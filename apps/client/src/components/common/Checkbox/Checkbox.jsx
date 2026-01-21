import { Check } from 'lucide-react';

const sizeStyles = {
  sm: {
    box: 'w-4 h-4',
    icon: 12,
    label: 'text-[13px]',
  },
  md: {
    box: 'w-5 h-5',
    icon: 14,
    label: 'text-[14px]',
  },
  lg: {
    box: 'w-6 h-6',
    icon: 16,
    label: 'text-[15px]',
  },
};

/**
 * Checkbox 컴포넌트
 * @param {Object} props
 * @param {string} props.label - 라벨 텍스트
 * @param {boolean} props.isChecked - 체크 상태
 * @param {Function} props.onChange - 변경 핸들러
 * @param {'sm' | 'md' | 'lg'} props.size - 크기
 * @param {boolean} props.isDisabled - 비활성화 상태
 * @param {string} props.className - 추가 클래스
 */
export function Checkbox({
  label,
  isChecked = false,
  onChange,
  size = 'md',
  isDisabled = false,
  className = '',
  ...props
}) {
  const styles = sizeStyles[size];

  const handleClick = () => {
    if (!isDisabled && onChange) {
      onChange(!isChecked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <label
      className={`
        inline-flex items-center gap-3 cursor-pointer
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Hidden input for accessibility */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => onChange && onChange(!isChecked)}
        disabled={isDisabled}
        className="sr-only"
        {...props}
      />

      {/* Custom checkbox */}
      <div
        role="checkbox"
        aria-checked={isChecked}
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          ${styles.box}
          flex items-center justify-center
          rounded-[var(--radius-sm)]
          border-2
          transition-all duration-200
          ${
            isChecked
              ? 'bg-[var(--color-green-primary)] border-[var(--color-green-primary)]'
              : 'bg-transparent border-[var(--border-strong)]'
          }
          ${
            !isDisabled
              ? 'hover:border-[var(--color-green-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-primary)]/20'
              : ''
          }
        `}
      >
        {isChecked && <Check size={styles.icon} className="text-white" />}
      </div>

      {/* Label */}
      {label && (
        <span className={`${styles.label} text-[var(--text-primary)]`}>
          {label}
        </span>
      )}
    </label>
  );
}