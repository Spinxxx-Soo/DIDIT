import os
import uuid
import subprocess
import requests
from datetime import datetime
from typing import Optional, Dict, Any

from models.meeting_summary.model import MeetingSummaryModel
from models.common.logger import get_logger

logger = get_logger(__name__)


class MeetingSummaryService:
    """회의 요약 서비스 클래스"""

    def __init__(self):
        logger.info("회의 요약 서비스 초기화 중...")
        
        # GMS API 키 설정 (Whisper API 호출용)
        self.gms_key = os.getenv("GMS_KEY")
        if not self.gms_key:
            logger.warning("GMS_KEY가 설정되지 않았습니다. Whisper API 호출 시 실패합니다.")
        self.whisper_api_url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/audio/transcriptions"
        
        self.model = MeetingSummaryModel()

        logger.info("회의 요약 서비스 초기화 완료")

    def process_meeting_summary_model(self, meeting_file: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not meeting_file:
            return None
            
        summary_id = meeting_file.get("summaryId")
        file_path = meeting_file.get("downloadUrl")

        if not summary_id or not file_path:
            logger.warning(f"유효하지 않은 meeting_file (meetingID/filePath 확인 필요): {meeting_file}")
            return None

        # 1) ffmpeg output wav 경로를 /tmp에 명시적으로 생성
        base = os.path.splitext(os.path.basename(file_path))[0]
        wav_path = os.path.join("/tmp", f"{base}_{uuid.uuid4().hex}.wav")

        try:
            # 1) FFmpeg: webm -> wav
            audio_file = self.process_with_ffmpeg(file_path, wav_path)

            # 2) Whisper STT
            transcript = self.transcribe(audio_file)

            # 3) Summary
            summary = self.summarize(transcript)

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
            # 임시 wav 파일 정리
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

    def summarize(self, text: str) -> str:
        summary = self.model.generate_summary(text)
        if not summary:
            raise ValueError("empty_summary")
        return summary

    # ======================
    # Helpers
    # ======================
    def process_with_ffmpeg(self, input_file: str, output_file: str) -> str:
        is_url = input_file.startswith("http://") or input_file.startswith("https://") if input_file else False
        if not input_file or (not is_url and not os.path.exists(input_file)):
            raise FileNotFoundError(f"입력 파일이 존재하지 않습니다: {input_file}")
        if not output_file:
            raise ValueError("output_file 경로가 비어 있습니다.")

        logger.info(f"FFmpeg 처리 시작: {input_file} -> {output_file}")

        cmd = [
            "ffmpeg", "-y",
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
            raise RuntimeError("ffmpeg가 설치되어 있지 않거나 PATH에 없습니다.")
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

        try:
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
                    timeout=60  # 오디오 파일 처리 시간을 고려하여 타임아웃 설정
                )
                response.raise_for_status()
                
                # 응답이 텍스트 형식이므로 직접 반환
                text = response.text.strip()
                
                if not text:
                    raise RuntimeError("Whisper STT 결과가 비어 있습니다.")

                logger.info("Whisper API STT 완료")
                return text
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Whisper API 호출 실패: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"응답 내용: {e.response.text}")
            raise RuntimeError(f"Whisper API 호출 실패: {str(e)}")