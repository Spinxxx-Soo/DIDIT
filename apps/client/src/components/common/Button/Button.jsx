const variantStyles = {
  primary: [
    'bg-[var(--color-green-primary)]',
    'text-white',
    'hover:bg-[var(--color-green-hover)]',
    'active:bg-[var(--color-green-active)]',
  ].join(' '),

  secondary: [
    'bg-[var(--bg-input)]',
    'text-[var(--text-primary)]',
    'border',
    'border-[var(--border-default)]',
    'hover:border-[var(--color-green-primary)]',
    'hover:text-[var(--color-green-primary)]',
  ].join(' '),

  danger: [
    'bg-[var(--color-error)]',
    'text-white',
    'hover:bg-red-600',
    'active:bg-red-700',
  ].join(' '),

  // 🔶 새로 추가
  'danger-outline': [
    'bg-transparent',
    'text-[var(--color-error)]',
    'border',
    'border-[var(--color-error)]',
    'hover:bg-[var(--error-bg)]',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-hover)]',
    'hover:text-[var(--text-primary)]',
  ].join(' '),
};

const sizeStyles = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[14px] gap-2',
  lg: 'h-12 px-6 text-[16px] gap-2 rounded-[var(--radius-lg)]',
};

const baseStyles = [
  'inline-flex',
  'items-center',
  'justify-center',
  'font-semibold',
  'rounded-[var(--radius-md)]',
  'transition-all',
  'duration-200',
  'cursor-pointer',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'focus:outline-none',
  'focus:ring-3',
  'focus:ring-[var(--color-green-primary)]/20',
].join(' ');

/**
 * Button 컴포넌트
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost'} props.variant - 버튼 스타일
 * @param {'sm' | 'md' | 'lg'} props.size - 버튼 크기
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {React.ReactNode} props.leftIcon - 왼쪽 아이콘
 * @param {React.ReactNode} props.rightIcon - 오른쪽 아이콘
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {string} props.className - 추가 클래스
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}