const sizeStyles = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const variantStyles = {
  default: [
    'bg-[var(--bg-input)]',
    'text-[var(--text-primary)]',
    'border',
    'border-[var(--border-default)]',
    'hover:border-[var(--color-green-primary)]',
    'hover:text-[var(--color-green-primary)]',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-hover)]',
    'hover:text-[var(--text-primary)]',
  ].join(' '),
};

const baseStyles = [
  'inline-flex',
  'items-center',
  'justify-center',
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
 * IconButton 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.icon - 아이콘 요소
 * @param {'sm' | 'md' | 'lg'} props.size - 버튼 크기
 * @param {'default' | 'ghost'} props.variant - 버튼 스타일
 * @param {string} props.className - 추가 클래스
 */
export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}