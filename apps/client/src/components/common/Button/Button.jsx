/**
 * Apple-Style Button Component
 * Ultra-modern with soft corners, subtle animations, and gradient effects
 */

const variantStyles = {
  primary: [
    'bg-gradient-to-br',
    'from-[var(--color-green-primary)]',
    'to-[var(--color-green-hover)]',
    'text-white',
    'shadow-[0_4px_14px_rgba(46,204,113,0.35)]',
    'hover:shadow-[0_6px_20px_rgba(46,204,113,0.45)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
    'active:scale-[0.98]',
  ].join(' '),

  secondary: [
    'bg-[var(--bg-input)]',
    'text-[var(--text-primary)]',
    'border',
    'border-[var(--border-default)]',
    'hover:border-[var(--color-green-primary)]',
    'hover:text-[var(--color-green-primary)]',
    'hover:bg-[var(--bg-hover)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
    'active:scale-[0.98]',
  ].join(' '),

  danger: [
    'bg-gradient-to-br',
    'from-[var(--color-error)]',
    'to-red-600',
    'text-white',
    'shadow-[0_4px_14px_rgba(239,68,68,0.3)]',
    'hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
    'active:scale-[0.98]',
  ].join(' '),

  'danger-outline': [
    'bg-transparent',
    'text-[var(--color-error)]',
    'border',
    'border-[var(--color-error)]',
    'hover:bg-[var(--error-bg)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-hover)]',
    'hover:text-[var(--text-primary)]',
    'active:scale-[0.98]',
  ].join(' '),

  glass: [
    'bg-[var(--bg-glass-strong)]',
    'backdrop-blur-xl',
    'text-[var(--text-primary)]',
    'border',
    'border-[var(--border-default)]',
    'hover:bg-[var(--bg-elevated)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
    'active:scale-[0.98]',
  ].join(' '),
};

const sizeStyles = {
  sm: 'h-9 px-4 text-[13px] gap-1.5 rounded-full',
  md: 'h-11 px-5 text-[14px] gap-2 rounded-full',
  lg: 'h-13 px-7 text-[16px] gap-2.5 rounded-full',
  xl: 'h-14 px-8 text-[17px] gap-3 rounded-full',
};

const baseStyles = [
  'inline-flex',
  'items-center',
  'justify-center',
  'font-semibold',
  'transition-all',
  'duration-200',
  'cursor-pointer',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'disabled:transform-none',
  'focus:outline-none',
  'focus-visible:ring-4',
  'focus-visible:ring-[var(--color-green-primary)]/20',
  'select-none',
].join(' ');

/**
 * Button 컴포넌트 - Apple Style
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost' | 'glass'} props.variant - 버튼 스타일
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - 버튼 크기
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
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}