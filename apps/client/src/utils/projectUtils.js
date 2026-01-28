/**
 * 프로젝트 기본 색상 풀
 * 프로젝트 id를 기반으로 순환 할당
 */
export const PROJECT_COLORS = [
  '#F94144', // Warm Red (강렬하지만 차분한 레드)
  '#F3722C', // Deep Orange (생동감 있는 오렌지)
  '#F9C74F', // Golden Yellow (부드러운 노란색)
  '#90BE6D', // Pistachio Green (자연스럽고 편안한 그린)
  '#43AA8B', // Ocean Teal (청량하고 세련된 청록)
  '#577590', // Slate Blue (이성적이고 차분한 블루)
  '#277DA1', // Deep Sky (깊이감 있는 스카이블루)
  '#938BB5', // Muted Purple (팔레트의 완성도를 높여줄 보라 - 추가 제안)
];

/**
 * 프로젝트 id로 색상 가져오기
 * @param {number} id - 프로젝트 id (BIGINT)
 * @returns {string} - 색상 hex 코드
 * 
 * @example
 * getProjectColor(1)  // '#10B981' (Green)
 * getProjectColor(2)  // '#F59E0B' (Amber)
 * getProjectColor(9)  // '#10B981' (Green) - 순환
 */
export const getProjectColor = (id) => {
  return PROJECT_COLORS[id % PROJECT_COLORS.length];
};

/**
 * 프로젝트 이니셜 (첫 글자) 가져오기
 * @param {string} name - 프로젝트 이름
 * @returns {string} - 대문자 첫 글자
 * 
 * @example
 * getProjectInitial('공통 프로젝트')  // '공'
 * getProjectInitial('My Project')     // 'M'
 * getProjectInitial('')               // 'P'
 */
export const getProjectInitial = (name) => {
  if (!name || !name.trim()) return 'P';
  return name.trim().charAt(0).toUpperCase();
};
