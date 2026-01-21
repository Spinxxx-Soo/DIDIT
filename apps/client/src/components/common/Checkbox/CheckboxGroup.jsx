import { Checkbox } from './Checkbox';

/**
 * CheckboxGroup 컴포넌트
 * @param {Object} props
 * @param {string} props.label - 그룹 라벨
 * @param {Array} props.options - 옵션 배열 [{ value, label }]
 * @param {Array} props.selectedValues - 선택된 값 배열
 * @param {Function} props.onChange - 변경 핸들러 (selectedValues)
 * @param {'sm' | 'md' | 'lg'} props.size - 체크박스 크기
 * @param {boolean} props.isDisabled - 전체 비활성화
 * @param {'vertical' | 'horizontal'} props.direction - 배치 방향
 * @param {string} props.className - 추가 클래스
 */
export function CheckboxGroup({
  label,
  options = [],
  selectedValues = [],
  onChange,
  size = 'md',
  isDisabled = false,
  direction = 'vertical',
  className = '',
}) {
  const handleChange = (value, isChecked) => {
    if (!onChange) return;

    if (isChecked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className={className}>
      {/* Group Label */}
      {label && (
        <p className="mb-3 text-[14px] font-medium text-[var(--text-primary)]">
          {label}
        </p>
      )}

      {/* Checkboxes */}
      <div
        className={`
          flex
          ${direction === 'vertical' ? 'flex-col gap-3' : 'flex-row flex-wrap gap-4'}
        `}
      >
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            isChecked={selectedValues.includes(option.value)}
            onChange={(checked) => handleChange(option.value, checked)}
            size={size}
            isDisabled={isDisabled || option.isDisabled}
          />
        ))}
      </div>
    </div>
  );
}