# services/meeting_summary_service.py
"""
2. service - FFmpeg 처리 -> Whisper(STT) -> 모델 요약 -> 결과 반환
"""
import os
import uuid
import subprocess
from datetime import datetime
from typing import Optional, Dict, Any

from openai import OpenAI

from models.meeting_summary.model import MeetingSummaryModel
from models.common.logger import get_logger
from common.settings import settings

logger = get_logger(__name__)


class MeetingSummaryService:
    """회의 요약 서비스 클래스"""

    def __init__(self):
        logger.info("회의 요약 서비스 초기화 중...")
        # 모델 초기화
        # 프록시 서버를 통해 Whisper API 사용
        gms_key = os.getenv("GMS_KEY")
        if not gms_key:
            logger.warning("GMS_KEY가 설정되지 않았습니다. Whisper API 호출 시 실패합니다.")
            self.stt_client = None
        else:
            self.stt_client = OpenAI(
                api_key=gms_key,
                base_url=settings.WHISPER_PROXY_URL
            )

        # 요약 모델(예: Gemini)
        self.model = MeetingSummaryModel()

        logger.info("회의 요약 서비스 초기화 완료")

    def process_meeting_summary_model(self, meeting_file: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not meeting_file:
            return None

        meeting_id = meeting_file.get("meetingID")
        file_path = meeting_file.get("filePath")

        if not meeting_id or not file_path:
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

            # title: 연월일만
            title = datetime.now().strftime("%Y%m%d")

            return {
                "meetingId": meeting_id,
                "status": "done",
                "title": title,
                "summary": summary,
            }

        except Exception as e:
            logger.exception(f"회의 요약 처리 실패 (meetingId={meeting_id}): {e}")
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
        if not input_file or not os.path.exists(input_file):
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

        if self.stt_client is None:
            raise RuntimeError("STT client가 초기화되지 않았습니다. (GMS_KEY/WHISPER_PROXY_URL 확인)")

        logger.info(f"Whisper API STT 시작: {audio_file}")

        with open(audio_file, "rb") as f:
            transcript = self.stt_client.audio.transcriptions.create(
                file=f,
                model="whisper-1",
                response_format="text",
                temperature=0.0
            )

        text = (transcript or "").strip()
        if not text:
            raise RuntimeError("Whisper STT 결과가 비어 있습니다.")

        logger.info("Whisper API STT 완료")
        return text
