# apps/ai/src/models/common/drive_io.py
"""Google Drive 공개 링크에서 파일 다운로드 유틸리티"""
import re
import requests
import os
from pathlib import Path
from typing import Optional, List, Dict
from models.common.logger import get_logger

logger = get_logger(__name__)


def extract_file_id_from_url(url: str) -> Optional[str]:
    """
    Google Drive 공개 링크에서 파일/폴더 ID 추출
    
    Args:
        url: Google Drive 공유 URL
            - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
            - https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
            - https://drive.google.com/uc?id=FILE_ID
    
    Returns:
        파일/폴더 ID 또는 None
    """
    try:
        # 파일 링크 형식: /file/d/FILE_ID
        match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
        
        # 폴더 링크 형식: /drive/folders/FOLDER_ID
        match = re.search(r'/drive/folders/([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
        
        # 직접 다운로드 링크 형식: ?id=FILE_ID
        match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
        
        logger.warning(f"URL에서 파일 ID를 추출할 수 없습니다: {url}")
        return None
    except Exception as e:
        logger.error(f"파일 ID 추출 실패: {e}")
        return None


def download_file_from_drive(file_id: str, local_path: str) -> bool:
    """
    Google Drive 공개 파일 다운로드
    
    Args:
        file_id: Google Drive 파일 ID
        local_path: 로컬 저장 경로
    
    Returns:
        성공 여부
    """
    try:
        # Google Drive 직접 다운로드 URL
        download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        
        # 세션 생성 (쿠키 처리용)
        session = requests.Session()
        
        # 첫 번째 요청 (큰 파일의 경우 확인 페이지로 리다이렉트)
        response = session.get(download_url, stream=True, allow_redirects=True)
        
        # HTML 응답인 경우 (확인 페이지)
        if response.headers.get('content-type', '').startswith('text/html'):
            # 확인 링크에서 실제 다운로드 URL 추출
            # Google Drive는 큰 파일의 경우 확인 링크를 제공
            confirm_match = re.search(r'href="(/uc\?export=download[^"]+)"', response.text)
            if confirm_match:
                confirm_url = "https://drive.google.com" + confirm_match.group(1).replace('&amp;', '&')
                logger.info(f"확인 페이지 감지, 실제 다운로드 URL로 재시도: {confirm_url}")
                response = session.get(confirm_url, stream=True, allow_redirects=True)
            else:
                # 다른 방법: confirm 파라미터 추가
                confirm_match = re.search(r'confirm=([a-zA-Z0-9_-]+)', response.text)
                if confirm_match:
                    confirm_code = confirm_match.group(1)
                    download_url_with_confirm = f"https://drive.google.com/uc?export=download&id={file_id}&confirm={confirm_code}"
                    logger.info(f"확인 코드 발견, 재시도: {download_url_with_confirm}")
                    response = session.get(download_url_with_confirm, stream=True, allow_redirects=True)
        
        # 응답이 성공인지 확인
        response.raise_for_status()
        
        # HTML 응답인지 확인 (바이러스 스캔 경고 페이지 등)
        content_type = response.headers.get('content-type', '').lower()
        if 'text/html' in content_type:
            # stream=True일 때는 text 속성을 사용할 수 없으므로 content를 읽어야 함
            html_content = response.content.decode('utf-8', errors='ignore')
            content_preview = html_content[:2000]  # 충분한 길이로 확인
            
            if 'virus scan' in content_preview.lower() or 'download anyway' in content_preview.lower():
                logger.warning("Google Drive 바이러스 스캔 경고 페이지 감지, 확인 링크 추출 시도...")
                # form action URL 추출
                action_match = re.search(r'action="([^"]+)"', html_content)
                # form 데이터 추출
                id_match = re.search(r'name="id"\s+value="([^"]+)"', html_content)
                export_match = re.search(r'name="export"\s+value="([^"]+)"', html_content)
                confirm_value_match = re.search(r'name="confirm"\s+value="([^"]+)"', html_content)
                uuid_match = re.search(r'name="uuid"\s+value="([^"]+)"', html_content)
                
                if action_match and id_match and confirm_value_match:
                    # 실제 다운로드 URL 구성
                    base_url = action_match.group(1)
                    if not base_url.startswith('http'):
                        base_url = 'https://drive.usercontent.google.com' + base_url
                    
                    download_params = {
                        'id': id_match.group(1),
                        'export': export_match.group(1) if export_match else 'download',
                        'confirm': confirm_value_match.group(1),
                    }
                    if uuid_match:
                        download_params['uuid'] = uuid_match.group(1)
                    
                    download_url = base_url + '?' + '&'.join([f"{k}={v}" for k, v in download_params.items()])
                    
                    logger.info(f"확인 링크로 재다운로드 시도: {download_url}")
                    response = session.get(download_url, stream=True, allow_redirects=True)
                    response.raise_for_status()
                else:
                    logger.error("확인 링크에서 필요한 파라미터를 추출할 수 없습니다.")
                    logger.debug(f"추출 결과 - action: {action_match}, id: {id_match}, confirm: {confirm_value_match}")
                    return False
        
        # 파일 저장
        local_file = Path(local_path)
        local_file.parent.mkdir(parents=True, exist_ok=True)
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        if downloaded % (8192 * 100) == 0:  # 100번마다 로그
                            logger.debug(f"다운로드 진행률: {progress:.1f}%")
        
        # 다운로드된 파일이 HTML인지 확인
        if local_file.exists() and local_file.stat().st_size > 0:
            # 파일의 첫 부분을 읽어서 HTML인지 확인
            with open(local_path, 'rb') as f:
                first_bytes = f.read(100)
                if first_bytes.startswith(b'<!DOCTYPE') or first_bytes.startswith(b'<html'):
                    logger.error(f"❌ 다운로드된 파일이 HTML입니다 (바이러스 스캔 페이지로 다운로드됨): {local_path}")
                    local_file.unlink()  # 잘못된 파일 삭제
                    return False
            
            logger.info(f"✅ Google Drive 파일 다운로드 완료: {local_path} ({local_file.stat().st_size} bytes)")
            return True
        else:
            logger.error(f"다운로드된 파일이 비어있거나 존재하지 않습니다: {local_path}")
            return False
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Google Drive 파일 다운로드 실패 (네트워크 오류): {e}")
        return False
    except Exception as e:
        logger.error(f"Google Drive 파일 다운로드 실패: {e}")
        return False


def get_folder_files(folder_id: str) -> List[Dict[str, str]]:
    """
    Google Drive 공개 폴더의 파일 목록 가져오기
    
    Args:
        folder_id: Google Drive 폴더 ID
    
    Returns:
        파일 정보 리스트 [{"id": "file_id", "name": "file_name"}]
    """
    try:
        # Google Drive 폴더 공개 링크에서 파일 목록 가져오기
        # 참고: 공개 폴더의 경우 직접 API 접근이 제한될 수 있음
        # 대안: 폴더 내 각 파일의 공개 링크를 직접 제공하거나
        # 폴더를 ZIP으로 다운로드하는 방법 사용
        
        # 폴더를 ZIP으로 다운로드 시도
        zip_url = f"https://drive.google.com/uc?export=download&id={folder_id}"
        
        # 이 방법은 폴더를 ZIP으로 다운로드
        # 개별 파일 다운로드를 위해서는 각 파일의 ID가 필요
        logger.warning("폴더 내 개별 파일 목록은 공개 API로 제한됩니다. 각 파일의 공개 링크를 직접 제공하거나 ZIP 다운로드를 사용하세요.")
        return []
        
    except Exception as e:
        logger.error(f"폴더 파일 목록 가져오기 실패: {e}")
        return []


def download_folder_as_zip(folder_id: str, local_path: str) -> bool:
    """
    Google Drive 폴더를 ZIP으로 다운로드
    
    Args:
        folder_id: Google Drive 폴더 ID
        local_path: 로컬 저장 경로 (ZIP 파일)
    
    Returns:
        성공 여부
    """
    try:
        # Google Drive 폴더 ZIP 다운로드 URL
        # 참고: 이 방법은 폴더가 공개되어 있고 ZIP 다운로드가 허용된 경우에만 작동
        zip_url = f"https://drive.google.com/uc?export=download&id={folder_id}"
        
        response = requests.get(zip_url, stream=True, allow_redirects=True)
        
        local_file = Path(local_path)
        local_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        logger.info(f"✅ Google Drive 폴더 ZIP 다운로드 완료: {local_path}")
        return True
        
    except Exception as e:
        logger.error(f"Google Drive 폴더 ZIP 다운로드 실패: {e}")
        return False


def download_file_from_public_link(url: str, local_path: str) -> bool:
    """
    Google Drive 공개 링크에서 파일 다운로드 (간편 함수)
    
    Args:
        url: Google Drive 공유 URL
        local_path: 로컬 저장 경로
    
    Returns:
        성공 여부
    """
    file_id = extract_file_id_from_url(url)
    if not file_id:
        logger.error(f"URL에서 파일 ID를 추출할 수 없습니다: {url}")
        return False
    
    return download_file_from_drive(file_id, local_path)


def download_json_files_from_drive(
    file_urls: List[str],
    local_dir: str
) -> bool:
    """
    여러 Google Drive 파일을 다운로드
    
    Args:
        file_urls: Google Drive 파일 공개 링크 리스트
        local_dir: 로컬 저장 디렉토리
    
    Returns:
        성공 여부
    """
    try:
        local_path = Path(local_dir)
        local_path.mkdir(parents=True, exist_ok=True)
        
        success_count = 0
        for url in file_urls:
            file_id = extract_file_id_from_url(url)
            if not file_id:
                logger.warning(f"파일 ID 추출 실패, 건너뜀: {url}")
                continue
            
            # 파일명 추출 시도 (Content-Disposition 헤더에서)
            # 먼저 파일명을 가져오기 위해 HEAD 요청
            try:
                download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
                session = requests.Session()
                response = session.head(download_url, allow_redirects=True)
                
                # Content-Disposition에서 파일명 추출
                content_disposition = response.headers.get('Content-Disposition', '')
                filename_match = re.search(r'filename[^;=\n]*=(([\'"]).*?\2|[^\s\n]+)', content_disposition)
                if filename_match:
                    filename = filename_match.group(1).strip('"\'')
                    # 파일명에 경로가 포함된 경우 처리
                    filename = Path(filename).name
                else:
                    # 파일명을 추출할 수 없으면 file_id 사용
                    filename = f"{file_id}.json"
            except Exception as e:
                logger.warning(f"파일명 추출 실패, file_id 사용: {e}")
                filename = f"{file_id}.json"
            
            local_file_path = local_path / filename
            
            logger.info(f"다운로드 시도: {url} -> {local_file_path}")
            if download_file_from_drive(file_id, str(local_file_path)):
                success_count += 1
            else:
                logger.error(f"다운로드 실패: {url}")
        
        logger.info(f"✅ 총 {success_count}/{len(file_urls)}개 파일 다운로드 완료")
        return success_count > 0
        
    except Exception as e:
        logger.error(f"파일 다운로드 실패: {e}")
        return False
