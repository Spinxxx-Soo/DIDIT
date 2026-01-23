/**
 * 이미지 유틸리티 함수
 * - 파일 시그니처 검증
 * - 이미지 압축/리사이즈
 */

/**
 * 허용된 이미지 타입과 매직 바이트
 */
const IMAGE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF],
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47],
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38], // GIF8
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP 시작)
  ],
};

/**
 * 허용된 MIME 타입 목록
 */
export const ALLOWED_IMAGE_TYPES = Object.keys(IMAGE_SIGNATURES);

/**
 * 최대 파일 크기 (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 이미지 검증 결과 타입
 * @typedef {Object} ImageValidationResult
 * @property {boolean} isValid - 유효 여부
 * @property {string|null} error - 에러 메시지
 */

/**
 * 이미지 파일 시그니처(매직 바이트) 검증
 * 확장자 위조 방지를 위해 실제 파일 내용 확인
 *
 * @param {File} file - 검증할 파일
 * @returns {Promise<ImageValidationResult>}
 */
export const validateImageFile = async (file) => {
  // 1. 파일 존재 여부
  if (!file) {
    return { isValid: false, error: '파일이 선택되지 않았습니다' };
  }

  // 2. 파일 크기 체크
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: '파일 크기는 5MB 이하여야 합니다' };
  }

  // 3. MIME 타입 기본 체크
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: '적합하지 않은 이미지입니다' };
  }

  // 4. 허용된 이미지 타입 체크
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: '지원하지 않는 이미지 형식입니다 (JPG, PNG, GIF, WebP만 가능)' };
  }

  // 5. 파일 시그니처(매직 바이트) 검증
  try {
    const headerBytes = await readFileHeader(file, 12);
    const isValidSignature = verifySignature(headerBytes, file.type);

    if (!isValidSignature) {
      return { isValid: false, error: '적합하지 않은 이미지입니다' };
    }
  } catch (error) {
    return { isValid: false, error: '이미지 파일을 읽을 수 없습니다' };
  }

  // 6. 실제 이미지 로드 가능 여부 확인
  try {
    await loadImage(file);
  } catch (error) {
    return { isValid: false, error: '손상된 이미지 파일입니다' };
  }

  return { isValid: true, error: null };
};

/**
 * 파일 헤더 읽기
 * @param {File} file
 * @param {number} bytes - 읽을 바이트 수
 * @returns {Promise<Uint8Array>}
 */
const readFileHeader = (file, bytes = 12) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
};

/**
 * 파일 시그니처 검증
 * @param {Uint8Array} header - 파일 헤더 바이트
 * @param {string} mimeType - 예상 MIME 타입
 * @returns {boolean}
 */
const verifySignature = (header, mimeType) => {
  const signatures = IMAGE_SIGNATURES[mimeType];
  if (!signatures) return false;

  return signatures.some(signature => {
    return signature.every((byte, index) => header[index] === byte);
  });
};

/**
 * 이미지 파일을 Image 객체로 로드
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지 로드 실패'));
    };
    img.src = url;
  });
};

/**
 * 이미지 압축 및 리사이즈
 * 프로젝트 썸네일용으로 최적화
 *
 * @param {File} file - 원본 이미지 파일
 * @param {Object} options - 압축 옵션
 * @param {number} options.maxSize - 최대 너비/높이 (기본: 200px)
 * @param {number} options.quality - JPEG 품질 0-1 (기본: 0.8)
 * @param {string} options.outputType - 출력 MIME 타입 (기본: 'image/jpeg')
 * @returns {Promise<{file: File, dataUrl: string}>}
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxSize = 200,
    quality = 0.8,
    outputType = 'image/jpeg',
  } = options;

  const img = await loadImage(file);

  // 리사이즈 비율 계산 (비율 유지)
  let { width, height } = img;

  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  // Canvas로 리사이즈
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  // Blob으로 변환
  const blob = await new Promise(resolve => {
    canvas.toBlob(resolve, outputType, quality);
  });

  // File 객체 생성
  const compressedFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, '.jpg'),
    { type: outputType }
  );

  // DataURL도 함께 반환 (미리보기용)
  const dataUrl = canvas.toDataURL(outputType, quality);

  return {
    file: compressedFile,
    dataUrl,
    originalSize: file.size,
    compressedSize: blob.size,
  };
};
