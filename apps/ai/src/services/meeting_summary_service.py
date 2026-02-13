import os
import uuid
import time
import tempfile
import subprocess
import requests
from datetime import datetime
from typing import Optional, Dict, Any

# imageio-ffmpeg를 사용하여 ffmpeg 바이너리 자동 다운로드 및 관리
try:
    import imageio_ffmpeg as ffmpeg
    FFMPEG_BINARY = ffmpeg.get_ffmpeg_exe()
    logger_import = None  # logger는 나중에 초기화
except ImportError:
    FFMPEG_BINARY = None
    logger_import = None

from models.meeting_summary.model import MeetingSummaryModel
from models.common.logger import get_logger

logger = get_logger(__name__)

# RAG 모듈 import
try:
    from models.rag import TextChunker, EmbeddingService, VectorStore
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False


class MeetingSummaryService:
    """회의 요약 서비스 클래스"""

    def __init__(self):
        logger.info("회의 요약 서비스 초기화 중...")
        
        # ffmpeg 바이너리 경로 확인 및 초기화
        global FFMPEG_BINARY
        if FFMPEG_BINARY is None:
            try:
                import imageio_ffmpeg as ffmpeg
                FFMPEG_BINARY = ffmpeg.get_ffmpeg_exe()
                logger.info(f"ffmpeg 바이너리 자동 다운로드 완료: {FFMPEG_BINARY}")
            except ImportError:
                logger.error("imageio-ffmpeg가 설치되지 않았습니다. 'pip install imageio-ffmpeg'를 실행하세요.")
                raise RuntimeError("imageio-ffmpeg가 설치되지 않았습니다. 'pip install imageio-ffmpeg'를 실행하세요.")
        
        # GMS API 키 설정 (Whisper API 호출용)
        self.gms_key = os.getenv("GMS_KEY")
        if not self.gms_key:
            logger.warning("GMS_KEY가 설정되지 않았습니다. Whisper API 호출 시 실패합니다.")
        self.whisper_api_url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/audio/transcriptions"
        
        self.model = MeetingSummaryModel()
        
        # RAG 기능 활성화 여부 설정
        # 환경 변수 RAG_ENABLED=true로 설정하면 RAG 기능 활성화
        # RAG 모듈이 없으면 자동으로 비활성화됨
        self.rag_enabled = (
            RAG_AVAILABLE and 
            os.getenv("RAG_ENABLED", "false").lower() == "true"
        )
        
        if self.rag_enabled:
            logger.info("RAG 기능 활성화됨")
            try:
                self.text_chunker = TextChunker(
                    chunk_size=int(os.getenv("RAG_CHUNK_SIZE", "500")),
                    chunk_overlap=int(os.getenv("RAG_CHUNK_OVERLAP", "100")),
                    min_chunk_size=int(os.getenv("RAG_MIN_CHUNK_SIZE", "50"))
                )
                self.embedding_service = EmbeddingService()
                self.vector_store = VectorStore(
                    db_path=os.getenv("VECTOR_DB_PATH", "./vector_db")
                )
                logger.info("RAG 모듈 초기화 완료")
            except Exception as e:
                logger.error(f"RAG 모듈 초기화 실패: {e}", exc_info=True)
                logger.warning("RAG 기능을 비활성화하고 계속 진행합니다.")
                self.rag_enabled = False
                self.text_chunker = None
                self.embedding_service = None
                self.vector_store = None
        else:
            if not RAG_AVAILABLE:
                logger.info("RAG 모듈을 찾을 수 없어 RAG 기능이 비활성화됩니다.")
            else:
                logger.info("RAG 기능 비활성화됨 (RAG_ENABLED=false)")
            self.text_chunker = None
            self.embedding_service = None
            self.vector_store = None

        logger.info("회의 요약 서비스 초기화 완료")

    def process_meeting_summary_model(self, meeting_file: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not meeting_file:
            return None
            
        summary_id = meeting_file.get("summaryId")
        file_path = meeting_file.get("downloadUrl")
        project_id = meeting_file.get("projectId")
        meeting_id = meeting_file.get("meetingId")

        if not summary_id or not file_path:
            logger.warning(f"유효하지 않은 meeting_file (meetingID/filePath 확인 필요): {meeting_file}")
            return None

        # URL인 경우 다운로드
        is_url = file_path.startswith("http://") or file_path.startswith("https://")
        temp_dir = tempfile.gettempdir()
        local_file_path = file_path
        
        if is_url:
            logger.info(f"URL에서 파일 다운로드 시작: {file_path}")
            try:
                # URL에서 파일 확장자 추출
                from urllib.parse import urlparse
                parsed_url = urlparse(file_path)
                file_ext = os.path.splitext(parsed_url.path)[1] or ".webm"
                
                # 임시 파일로 다운로드
                local_file_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}{file_ext}")
                
                logger.info(f"다운로드 대상 URL: {file_path}")
                logger.info(f"저장 경로: {local_file_path}")
                
                response = requests.get(file_path, timeout=300, stream=True)  # 5분 타임아웃
                response.raise_for_status()
                
                # 파일 크기 확인
                total_size = int(response.headers.get('content-length', 0))
                logger.info(f"다운로드할 파일 크기: {total_size} bytes")
                
                downloaded_size = 0
                with open(local_file_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded_size += len(chunk)
                
                # 다운로드 완료 확인
                if not os.path.exists(local_file_path):
                    raise RuntimeError(f"다운로드 후 파일이 존재하지 않습니다: {local_file_path}")
                
                file_size = os.path.getsize(local_file_path)
                logger.info(f"파일 다운로드 완료: {local_file_path} (크기: {file_size} bytes)")
                
                if file_size == 0:
                    raise RuntimeError(f"다운로드된 파일 크기가 0입니다: {local_file_path}")
                    
            except Exception as e:
                logger.error(f"파일 다운로드 실패: {e}", exc_info=True)
                # 다운로드 실패한 임시 파일 정리
                if local_file_path != file_path and os.path.exists(local_file_path):
                    try:
                        os.unlink(local_file_path)
                    except:
                        pass
                raise RuntimeError(f"파일 다운로드 실패: {str(e)}")

        # 1) ffmpeg output wav 경로를 임시 디렉토리에 명시적으로 생성
        base = os.path.splitext(os.path.basename(local_file_path))[0]
        wav_path = os.path.join(temp_dir, f"{base}_{uuid.uuid4().hex}.wav")

        try:
            # 1) FFmpeg: webm -> wav
            audio_file = self.process_with_ffmpeg(local_file_path, wav_path)

            # 2) Whisper STT
            transcript = self.transcribe(audio_file)

            # 3) RAG 저장 (활성화된 경우)
            if self.rag_enabled and project_id and meeting_id:
                try:
                    self._store_to_rag(transcript, project_id, meeting_id)
                except Exception as e:
                    logger.warning(f"RAG 저장 실패 (요약은 계속 진행): {e}", exc_info=True)

            # 4) RAG 검색 및 요약 생성
            summary = self.summarize(transcript, project_id=project_id, meeting_id=meeting_id)

            is_failed = (summary.get("title") == "데이터 분석 실패")
            status = "failed" if is_failed else "done"

            #model json 형식 변경?
            # return {
            #     "ok": False,
            #     "error": str(e),
            #     "title": "데이터 분석 실패",
            #     "discussion_points": [...],
            #     "action_items": [...]
            # }
            # 변경 후 service 코드 
            # summary = self.model.generate_summary(transcript)
            # status = "done" if summary.get("ok", True) else "failed"
            # summary.pop("ok", None)      # 필요 없으면 제거
            # summary.pop("error", None)   # 필요 없으면 제거

            # return {"meetingId": meeting_id, "status": status, "summary": summary}

            return {
                "summeryId": summary_id,
                "status": status,
                "summary": summary,
            }

        except Exception as e:
            logger.exception(f"회의 요약 처리 실패 (meetingId={summary_id}): {e}")
            return None


        finally:
            # 임시 파일 정리
            # 1. 다운로드한 원본 파일 삭제 (URL인 경우)
            if is_url and local_file_path != file_path and os.path.exists(local_file_path):
                try:
                    os.unlink(local_file_path)
                    logger.info(f"임시 다운로드 파일 삭제: {local_file_path}")
                except Exception as e:
                    logger.warning(f"임시 다운로드 파일 삭제 실패: {e}")
            
            # 2. 변환된 wav 파일 삭제
            if os.path.exists(wav_path):
                try:
                    os.unlink(wav_path)
                    logger.info(f"임시 wav 삭제: {wav_path}")
                except Exception as e:
                    logger.warning(f"임시 wav 삭제 실패: {e}")

    # ======================
    # Business
    # ======================
    def transcribe(self, wav_path: str) -> str:
        text = self.run_whisper(wav_path).strip()
        if not text:
            raise ValueError("empty_transcript")
        return text

    def summarize(self, text: str, project_id: int = None, meeting_id: int = None) -> str:
        """
        텍스트를 요약합니다. RAG가 활성화된 경우 관련 과거 회의록을 검색하여 컨텍스트로 활용합니다.
        
        Args:
            text: 요약할 텍스트 (STT 결과)
            project_id: 프로젝트 ID (RAG 검색용, 선택사항)
            meeting_id: 회의 ID (현재 회의 제외용, 선택사항)
        """
        # RAG 검색 (활성화된 경우)
        rag_context = None
        if self.rag_enabled and project_id:
            try:
                rag_context = self._search_relevant_chunks(text, project_id, meeting_id)
            except Exception as e:
                logger.warning(f"RAG 검색 실패 (요약은 계속 진행): {e}", exc_info=True)
        
        # 요약 생성 (RAG 컨텍스트 포함)
        summary = self.model.generate_summary(text, rag_context=rag_context)
        
        if not summary:
            raise ValueError("empty_summary")
        return summary
    
    # ======================
    # RAG
    # ======================   

    def _store_to_rag(self, transcript: str, project_id: int, meeting_id: int) -> bool:
        """
        STT 텍스트를 RAG에 저장합니다.
        
        Args:
            transcript: STT 변환된 텍스트
            project_id: 프로젝트 ID
            meeting_id: 회의 ID
            
        Returns:
            저장 성공 여부
        """
        if not self.rag_enabled or not self.text_chunker or not self.embedding_service or not self.vector_store:
            logger.warning("RAG 기능이 비활성화되어 있어 저장을 건너뜁니다.")
            return False
        
        try:
            # 1. 텍스트 청킹
            chunks = self.text_chunker.split_text(transcript)
            if not chunks:
                logger.warning("청크가 생성되지 않았습니다.")
                return False
            
            # 2. 임베딩 생성
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.embedding_service.encode(chunk_texts)
            
            # 3. 벡터 DB에 저장
            success = self.vector_store.store_chunks(
                project_id=project_id,
                meeting_id=meeting_id,
                chunks=chunks,
                embeddings=embeddings
            )
            
            if success:
                logger.info(f"RAG 저장 완료: 프로젝트={project_id}, 회의={meeting_id}, 청크 수={len(chunks)}")
            else:
                logger.error(f"RAG 저장 실패: 프로젝트={project_id}, 회의={meeting_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"RAG 저장 중 오류 발생: {e}", exc_info=True)
            return False

    # ======================
    # RAG -> chunking
    # ======================

    def _search_relevant_chunks(
        self,
        transcript: str,
        project_id: int,
        meeting_id: int = None,
        top_k: int = 5
    ) -> Optional[str]:
        """
        관련 과거 회의록을 검색합니다.
        
        Args:
            transcript: 현재 회의록 텍스트
            project_id: 프로젝트 ID
            meeting_id: 현재 회의 ID (제외용, 선택사항)
            top_k: 반환할 최대 결과 수
            
        Returns:
            관련 문서 컨텍스트 문자열 (없으면 None)
        """
        if not self.rag_enabled or not self.embedding_service or not self.vector_store:
            return None
        
        try:
            # 현재 회의록의 앞부분을 쿼리로 사용 (처음 500자)
            query_text = transcript[:500] if len(transcript) > 500 else transcript
            
            # 쿼리 임베딩 생성
            query_embedding = self.embedding_service.encode_single(query_text)
            
            # 벡터 검색
            results = self.vector_store.search(
                project_id=project_id,
                query_embedding=query_embedding,
                top_k=top_k,
                exclude_meeting_id=meeting_id,
                similarity_threshold=float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.7"))
            )
            
            if not results:
                logger.info("관련 과거 회의록을 찾지 못했습니다.")
                return None
            
            # 컨텍스트 문자열 구성
            # VectorStore.search()는 List[Dict[str, Any]]를 반환
            # 각 result는 {"text": str, "similarity": float} 형식으로 가정
            context_parts = []
            for i, result in enumerate(results, 1):
                similarity = result.get("similarity", 0.0)
                text = result.get("text", "")
                context_parts.append(
                    f"[과거 회의록 {i}] (유사도: {similarity:.2f})\n{text}"
                )
            
            context = "\n\n".join(context_parts)
            logger.info(f"RAG 검색 완료: {len(results)}개 관련 문서 발견")
            return context
            
        except Exception as e:
            logger.error(f"RAG 검색 중 오류 발생: {e}", exc_info=True)
            return None

    # ======================
    # Helpers
    # ======================
    def process_with_ffmpeg(self, input_file: str, output_file: str) -> str:
        if not input_file:
            raise ValueError("input_file 경로가 비어 있습니다.")
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"입력 파일이 존재하지 않습니다: {input_file}")
        if not output_file:
            raise ValueError("output_file 경로가 비어 있습니다.")

        logger.info(f"FFmpeg 처리 시작: {input_file} -> {output_file}")

        # ffmpeg 바이너리 경로 확인 (우선순위: 환경 변수 > imageio-ffmpeg > 시스템 PATH)
        ffmpeg_cmd = os.getenv("FFMPEG_PATH")
        
        if ffmpeg_cmd and os.path.exists(ffmpeg_cmd):
            # 환경 변수로 지정된 경로 사용
            logger.info(f"환경 변수 FFMPEG_PATH 사용: {ffmpeg_cmd}")
        elif FFMPEG_BINARY and os.path.exists(FFMPEG_BINARY):
            # imageio-ffmpeg가 제공하는 바이너리 사용
            ffmpeg_cmd = FFMPEG_BINARY
            logger.info(f"imageio-ffmpeg 바이너리 사용: {ffmpeg_cmd}")
        else:
            # 시스템 PATH에서 찾기
            ffmpeg_cmd = "ffmpeg"
            logger.info("시스템 PATH에서 ffmpeg 사용")

        cmd = [
            ffmpeg_cmd, "-y",
            "-i", input_file,
            "-vn",
            "-ac", "1",
            "-ar", "16000",
            "-f", "wav",
            output_file
        ]

        try:
            subprocess.run(
                cmd,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                text=True
            )
        except FileNotFoundError:
            error_msg = (
                f"ffmpeg를 찾을 수 없습니다. (경로: {ffmpeg_cmd})\n"
                "imageio-ffmpeg가 자동으로 설치되어야 합니다.\n"
                "다음 명령어로 설치하세요: pip install imageio-ffmpeg"
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffmpeg 변환 실패: {e.stderr}") from e

        if not os.path.exists(output_file):
            raise RuntimeError("ffmpeg 변환은 성공했으나 출력 파일이 존재하지 않습니다.")

        logger.info(f"FFmpeg 처리 완료: {output_file}")
        return output_file

    def run_whisper(self, audio_file: str) -> str:
        if not audio_file or not os.path.exists(audio_file):
            raise FileNotFoundError(f"오디오 파일이 존재하지 않습니다: {audio_file}")

        if not self.gms_key:
            raise RuntimeError("GMS_KEY가 설정되지 않았습니다. Whisper API 호출을 수행할 수 없습니다.")

        logger.info(f"Whisper API STT 시작: {audio_file}")

        # 공식 문서에 따른 HTTP 직접 호출 (multipart/form-data)
        headers = {
            "Authorization": f"Bearer {self.gms_key}"
        }

        # 재시도 설정
        max_retries = 3
        retry_delay = 2  # 초
        retryable_status_codes = [502, 503, 504]  # Bad Gateway, Service Unavailable, Gateway Timeout
        
        last_exception = None
        
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Whisper API 호출 시도 {attempt}/{max_retries}")
                
                with open(audio_file, "rb") as f:
                    files = {
                        "file": (os.path.basename(audio_file), f, "audio/wav")
                    }
                    data = {
                        "model": "whisper-1"
                    }
                    
                    response = requests.post(
                        self.whisper_api_url,
                        headers=headers,
                        files=files,
                        data=data,
                        timeout=120  # 오디오 파일 처리 시간을 고려하여 타임아웃 설정 (2분)
                    )
                    
                    # 상태 코드 확인
                    if response.status_code in retryable_status_codes:
                        if attempt < max_retries:
                            logger.warning(
                                f"Whisper API 호출 실패 (재시도 가능): status={response.status_code}, "
                                f"attempt={attempt}/{max_retries}, {retry_delay}초 후 재시도"
                            )
                            time.sleep(retry_delay * attempt)  # 지수 백오프
                            continue
                        else:
                            logger.error(f"Whisper API 호출 최종 실패: status={response.status_code}")
                            response.raise_for_status()
                    
                    response.raise_for_status()
                    
                    # 응답이 텍스트 형식이므로 직접 반환
                    text = response.text.strip()
                    
                    if not text:
                        raise RuntimeError("Whisper STT 결과가 비어 있습니다.")

                    logger.info(f"Whisper API STT 완료 (시도 {attempt}/{max_retries})")
                    return text
                    
            except requests.exceptions.HTTPError as e:
                last_exception = e
                status_code = e.response.status_code if e.response else None
                
                if status_code in retryable_status_codes and attempt < max_retries:
                    logger.warning(
                        f"Whisper API HTTP 오류 (재시도 가능): status={status_code}, "
                        f"attempt={attempt}/{max_retries}, {retry_delay * attempt}초 후 재시도"
                    )
                    if hasattr(e, 'response') and e.response is not None:
                        logger.warning(f"응답 내용: {e.response.text[:200]}")  # 처음 200자만
                    time.sleep(retry_delay * attempt)
                    continue
                else:
                    logger.error(f"Whisper API HTTP 오류: {e}")
                    if hasattr(e, 'response') and e.response is not None:
                        logger.error(f"응답 내용: {e.response.text}")
                    raise RuntimeError(f"Whisper API 호출 실패 (HTTP {status_code}): {str(e)}")
                    
            except requests.exceptions.Timeout as e:
                last_exception = e
                if attempt < max_retries:
                    logger.warning(
                        f"Whisper API 타임아웃 (재시도 가능): attempt={attempt}/{max_retries}, "
                        f"{retry_delay * attempt}초 후 재시도"
                    )
                    time.sleep(retry_delay * attempt)
                    continue
                else:
                    logger.error(f"Whisper API 타임아웃: {e}")
                    raise RuntimeError(f"Whisper API 호출 타임아웃: {str(e)}")
                    
            except requests.exceptions.RequestException as e:
                last_exception = e
                if attempt < max_retries:
                    logger.warning(
                        f"Whisper API 요청 오류 (재시도 가능): {e}, "
                        f"attempt={attempt}/{max_retries}, {retry_delay * attempt}초 후 재시도"
                    )
                    time.sleep(retry_delay * attempt)
                    continue
                else:
                    logger.error(f"Whisper API 호출 실패: {e}")
                    raise RuntimeError(f"Whisper API 호출 실패: {str(e)}")
        
        # 모든 재시도 실패
        if last_exception:
            logger.error(f"Whisper API 호출 최종 실패 (모든 재시도 소진): {last_exception}")
            raise RuntimeError(f"Whisper API 호출 실패 (모든 재시도 소진): {str(last_exception)}")
        else:
            raise RuntimeError("Whisper API 호출 실패: 알 수 없는 오류")