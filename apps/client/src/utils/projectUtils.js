/**
 * 프로젝트 기본 색상 풀
 * 프로젝트 id를 기반으로 순환 할당
 */
export const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green (Brand)
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
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
