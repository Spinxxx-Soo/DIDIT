const sizeStyles = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-4 text-[15px]',
};

const baseStyles = [
  'w-full',
  'bg-[var(--bg-input)]',
  'border',
  'border-[var(--border-default)]',
  'rounded-[var(--radius-md)]',
  'text-[var(--text-primary)]',
  'placeholder:text-[var(--text-tertiary)]',
  'transition-all',
  'duration-200',
  'focus:outline-none',
  'focus:border-[var(--color-green-primary)]',
  'focus:ring-3',
  'focus:ring-[var(--color-green-primary)]/20',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
].join(' ');

const errorStyles = [
  'border-[var(--color-error)]',
  'focus:border-[var(--color-error)]',
  'focus:ring-[var(--color-error)]/20',
].join(' ');

/**
 * Input 컴포넌트
 * @param {Object} props
 * @param {string} props.label - 라벨 텍스트
 * @param {'sm' | 'md' | 'lg'} props.size - 입력창 크기
 * @param {boolean} props.isError - 에러 상태
 * @param {string} props.errorMessage - 에러 메시지
 * @param {boolean} props.isRequired - 필수 여부
 * @param {string} props.className - 추가 클래스
 */
export function Input({
  label,
  size = 'md',
  isError = false,
  errorMessage,
  isRequired = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 text-[14px] font-medium text-[var(--text-primary)]"
        >
          {label}
          {isRequired && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${isError ? errorStyles : ''}
          ${className}
        `}
        {...props}
      />
      {isError && errorMessage && (
        <p className="mt-1.5 text-[13px] text-[var(--color-error)]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}