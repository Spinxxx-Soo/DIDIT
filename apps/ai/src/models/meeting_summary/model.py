# apps/ai/src/models/meeting_summary/models.py

import os
import json
import requests
from typing import Dict, Any
from models.common.logger import get_logger

logger = get_logger(__name__)

class MeetingSummaryModel:
    """회의 요약 모델 클래스 (SSAFY GMS Gemini 2.5 Flash 사용)"""
    
    def __init__(self):
        """API 설정 초기화"""
        logger.info("회의 요약 모델(Gemini 2.5 Flash) 초기화 중...")
        
        self.gms_key = os.getenv("GMS_KEY")
        if not self.gms_key:
            logger.error("GMS_KEY가 .env에 설정되지 않았습니다.")
            raise ValueError("GMS_KEY missing in .env")
            
        # GMS 가이드라인 엔드포인트 (커스텀 도메인 및 쿼리 스트링 키)
        self.api_url = f"https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gms_key}"
        
        logger.info("회의 요약 모델 초기화 완료")
    
    def generate_summary(self, transcript: str, rag_context: str = None) -> Dict[str, Any]:
        """
        Gemini 2.5 Flash를 사용하여 회의록에서 제목, 논의 사항, Action Items를 추출합니다.
        RAG 컨텍스트가 제공되면 과거 회의 내용을 참고하여 더 정확한 요약을 생성합니다.
        """
        logger.info(f"Gemini 2.5 Flash 모델로 요약 생성 시작... (RAG 컨텍스트 {'포함' if rag_context else '미포함'})")

        # RAG 컨텍스트 추가
        rag_section = ""
        if rag_context:
            rag_section = f"""
        [참고: 과거 회의 관련 맥락]
        다음은 현재 회의와 관련된 과거 회의의 주요 내용입니다. 이를 참고하여 현재 회의의 요약에 반영하세요:
        {rag_context}
        """

        # 요구하신 세 가지 필드(title, discussion_points, action_items)에 최적화된 프롬프트
        prompt_text = f"""
        당신은 전문 회의 기록원입니다. 제공된 회의 스크립트{ ' 및 과거 회의 맥락' if rag_context else ''}를 분석하여 UI 디자인의 각 섹션에 맞게 다음 형식의 JSON으로 출력하세요.
        반드시 마크다운 코드 블록(```json) 없이 순수 JSON 데이터만 반환하세요.

        [분석 지침]:
        1. title: 회의의 전체 내용을 관통하는 핵심 주제를 한 문장의 제목으로 작성하세요.
        2. discussion_points: 회의에서 다루어진 '주요 논의 사항'들을 리스트 형태로 정리하세요. 각 항목은 명확하고 간결해야 합니다.
        3. action_items: 향후 실행해야 할 '할 일 목록'입니다. 구체적인 작업 내용과 담당자가 있다면 함께 명시하세요. (예: "로그인 페이지 UI 시안 제작 (박지민)")
        {rag_section}
        [회의 스크립트]:
        {transcript}

        [응답 JSON 형식]:
        {{
            "title": "회의 핵심 제목",
            "discussion_points": [
                "논의 사항 1",
                "논의 사항 2"
            ],
            "action_items": [
                "할 일 1",
                "할 일 2"
            ]
        }}
        """

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt_text}]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,  # 분석의 일관성을 위해 낮게 설정
                "responseMimeType": "application/json"
            }
        }

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.gms_key
        }

        try:
            # API 호출 (타임아웃은 넉넉하게 40초)
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=40)
            response.raise_for_status()
            
            result = response.json()
            
            # JSON 파싱 및 데이터 반환
            if 'candidates' in result and result['candidates']:
                raw_text = result['candidates'][0]['content']['parts'][0]['text']
                summary_data = json.loads(raw_text)
                logger.info("Gemini 2.5 Flash 회의록 구조화 데이터 생성 성공")
                return summary_data
            else:
                raise ValueError("API 응답 구조에서 결과를 찾을 수 없습니다.")

        except Exception as e:
            logger.error(f"요약 데이터 생성 중 오류 발생: {e}")
            return {
                "title": "데이터 분석 실패",
                "discussion_points": [f"오류: {str(e)}"],
                "action_items": ["다시 시도해주세요."]
            }