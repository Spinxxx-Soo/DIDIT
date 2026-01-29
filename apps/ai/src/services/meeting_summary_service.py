# services/meeting_summary_service.py
"""
2. service - FFmpeg 처리 whisper에서 처리 -> 모델 실행 -> 결과 값 반환
"""
import tempfile
import os
from typing import Optional
import redis
from models.meeting_summary.model import MeetingSummaryModel
from models.common.logger import get_logger

logger = get_logger(__name__)


class MeetingSummaryService:
    """회의 요약 서비스 클래스"""
    
    def __init__(self):
        """서비스 초기화"""
        logger.info("회의 요약 서비스 초기화 중...")
        
        # 레디스 클라이언트 초기화
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=0,
            decode_responses=False  # 바이너리 데이터
        )
        
        # 모델 초기화
        self.model = MeetingSummaryModel()
        
        logger.info("회의 요약 서비스 초기화 완료")
    
    def get_file_from_redis(
        self, 
        meeting_id: int, 
        file_key: Optional[str] = None
    ) -> bytes:
        """
        백엔드 레디스에서 파일을 가져옵니다.
        
        Args:
            meeting_id: 회의 ID
            file_key: 레디스 파일 키 (없으면 자동 생성)
            
        Returns:
            파일 바이너리 데이터
        """
        # 키가 없으면 기본 형식으로 생성
        if file_key is None:
            file_key = f"meeting:{meeting_id}:file"
        
        try:
            logger.info(f"레디스에서 파일 가져오기: {file_key}")
            file_data = self.redis_client.get(file_key)
            
            if file_data is None:
                raise ValueError(f"레디스에서 파일을 찾을 수 없습니다: {file_key}")
            
            logger.info(f"파일 다운로드 완료: {len(file_data)} bytes")
            return file_data
            
        except redis.RedisError as e:
            logger.error(f"레디스 오류: {e}")
            raise
    
    def save_temp_file(self, file_data: bytes, suffix: str = ".webm") -> str:
        """
        임시 파일로 저장합니다.
        
        Args:
            file_data: 파일 바이너리 데이터
            suffix: 파일 확장자
            
        Returns:
            임시 파일 경로
        """
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_file.write(file_data)
        temp_file.close()
        logger.info(f"임시 파일 저장: {temp_file.name}")
        return temp_file.name
    
    def cleanup_temp_file(self, file_path: str):
        """임시 파일 삭제"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.info(f"임시 파일 삭제: {file_path}")
        except Exception as e:
            logger.warning(f"임시 파일 삭제 실패: {e}")
    
    def process_with_ffmpeg(self, input_file: str, output_file: str) -> str:
        """
        FFmpeg로 파일을 처리합니다.
        
        Args:
            input_file: 입력 파일 경로
            output_file: 출력 파일 경로
            
        Returns:
            처리된 파일 경로
        """
        # TODO: FFmpeg 처리 로직 구현
        logger.info(f"FFmpeg 처리 시작: {input_file} -> {output_file}")
        # 예시: subprocess로 ffmpeg 실행
        # subprocess.run(['ffmpeg', '-i', input_file, output_file, ...])
        return output_file
    
    def run_whisper(self, audio_file: str) -> str:
        """
        Whisper STT를 실행하여 텍스트를 추출합니다.
        
        Args:
            audio_file: 오디오 파일 경로
            
        Returns:
            추출된 텍스트 (transcript)
        """
        # TODO: Whisper STT 로직 구현
        logger.info(f"Whisper STT 실행 시작: {audio_file}")
        # 예시: whisper 모델로 음성 -> 텍스트 변환
        transcript = ""  # 실제 구현 필요
        return transcript
    
    async def process_meeting_file(
        self, 
        meeting_id: int,
        file_key: Optional[str] = None
    ) -> dict:
        """
        회의 파일을 처리하여 요약을 생성합니다.
        
        프로세스:
        1. 백엔드 레디스에서 파일 받아오기
        2. FFmpeg 처리
        3. Whisper STT 실행
        4. 모델 실행 (제미나이 요약)
        5. 결과 반환
        
        Args:
            meeting_id: 회의 ID
            file_key: 레디스 파일 키 (선택사항)
            
        Returns:
            요약 결과 딕셔너리
        """
        temp_file_path = None
        processed_file_path = None
        
        try:
            # 1. 백엔드 레디스에서 파일 받아오기
            logger.info(f"회의 파일 다운로드 시작 (meeting_id={meeting_id})")
            file_data = self.get_file_from_redis(meeting_id, file_key)
            
            # 2. 임시 파일로 저장
            temp_file_path = self.save_temp_file(file_data)
            
            # 3. FFmpeg 처리
            logger.info("FFmpeg 처리 시작...")
            processed_file_path = self.process_with_ffmpeg(
                temp_file_path,
                temp_file_path.replace(".webm", "_processed.wav")
            )
            
            # 4. Whisper STT 실행
            logger.info("Whisper STT 실행 시작...")
            transcript = self.run_whisper(processed_file_path)
            
            if not transcript:
                raise ValueError("음성에서 텍스트를 추출할 수 없습니다")
            
            # 5. 모델 실행 - 제미나이 요약
            logger.info("제미나이 모델 실행 시작...")
            summary = self.model.generate_summary(transcript)
            
            return {
                "meeting_id": meeting_id,
                "status": "success",
                "transcript": transcript,
                "summary": summary
            }
            
        except Exception as e:
            logger.error(f"회의 파일 처리 실패: {e}")
            raise
        finally:
            # 임시 파일 정리
            if temp_file_path and os.path.exists(temp_file_path):
                self.cleanup_temp_file(temp_file_path)
            if processed_file_path and os.path.exists(processed_file_path):
                self.cleanup_temp_file(processed_file_path)
