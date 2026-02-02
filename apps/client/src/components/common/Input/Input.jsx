/**
 * Apple-Style Input Component
 * Soft corners, subtle focus glow, clean design
 */

const sizeStyles = {
  sm: 'h-10 px-4 text-[13px]',
  md: 'h-12 px-5 text-[14px]',
  lg: 'h-14 px-5 text-[15px]',
};

const baseStyles = [
  'w-full',
  'bg-[var(--bg-input)]',
  'border',
  'border-[var(--border-default)]',
  'rounded-[var(--radius-xl)]',
  'text-[var(--text-primary)]',
  'placeholder:text-[var(--text-tertiary)]',
  'transition-all',
  'duration-200',
  'focus:outline-none',
  'focus:border-[var(--color-green-primary)]',
  'focus:ring-4',
  'focus:ring-[var(--color-green-primary)]/10',
  'focus:bg-[var(--bg-panel)]',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'disabled:bg-[var(--bg-hover)]',
].join(' ');

const errorStyles = [
  'border-[var(--color-error)]',
  'focus:border-[var(--color-error)]',
  'focus:ring-[var(--color-error)]/10',
].join(' ');

/**
 * Input 컴포넌트 - Apple Style
 * @param {Object} props
 * @param {string} props.label - 라벨 텍스트
 * @param {'sm' | 'md' | 'lg'} props.size - 입력창 크기
 * @param {boolean} props.isError - 에러 상태
 * @param {string} props.errorMessage - 에러 메시지
 * @param {string} props.helperText - 도움말 텍스트
 * @param {boolean} props.isRequired - 필수 여부
 * @param {React.ReactNode} props.leftIcon - 왼쪽 아이콘
 * @param {React.ReactNode} props.rightIcon - 오른쪽 아이콘
 * @param {string} props.className - 추가 클래스
 */
export function Input({
  label,
  size = 'md',
  isError = false,
  errorMessage,
  helperText,
  isRequired = false,
  leftIcon,
  rightIcon,
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
          className="block mb-2.5 text-[14px] font-medium text-[var(--text-primary)] tracking-[-0.01em]"
        >
          {label}
          {isRequired && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            ${baseStyles}
            ${sizeStyles[size]}
            ${isError ? errorStyles : ''}
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {rightIcon}
          </div>
        )}
      </div>

      {isError && errorMessage && (
        <p className="mt-2 text-[13px] text-[var(--color-error)] flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 4v3M7 9v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {errorMessage}
        </p>
      )}

      {!isError && helperText && (
        <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea 컴포넌트 - Apple Style
 */
export function Textarea({
  label,
  isError = false,
  errorMessage,
  helperText,
  isRequired = false,
  rows = 4,
  className = '',
  id,
  ...props
}) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block mb-2.5 text-[14px] font-medium text-[var(--text-primary)] tracking-[-0.01em]"
        >
          {label}
          {isRequired && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={`
          w-full
          px-5
          py-4
          bg-[var(--bg-input)]
          border
          border-[var(--border-default)]
          rounded-[var(--radius-xl)]
          text-[var(--text-primary)]
          text-[14px]
          leading-relaxed
          placeholder:text-[var(--text-tertiary)]
          transition-all
          duration-200
          resize-none
          focus:outline-none
          focus:border-[var(--color-green-primary)]
          focus:ring-4
          focus:ring-[var(--color-green-primary)]/10
          focus:bg-[var(--bg-panel)]
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${isError ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10' : ''}
          ${className}
        `}
        {...props}
      />

      {isError && errorMessage && (
        <p className="mt-2 text-[13px] text-[var(--color-error)]">
          {errorMessage}
        </p>
      )}

      {!isError && helperText && (
        <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
          {helperText}
        </p>
      )}
    </div>
  );
}