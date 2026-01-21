const variantStyles = {
  default: [
    'bg-[var(--bg-input)]',
    'text-[var(--text-secondary)]',
    'border-[var(--border-default)]',
  ].join(' '),

  success: [
    'bg-[var(--success-bg)]',
    'text-[var(--color-success)]',
    'border-[var(--color-success)]',
  ].join(' '),

  warning: [
    'bg-[var(--warning-bg)]',
    'text-[var(--color-warning)]',
    'border-[var(--color-warning)]',
  ].join(' '),

  error: [
    'bg-[var(--error-bg)]',
    'text-[var(--color-error)]',
    'border-[var(--color-error)]',
  ].join(' '),

  info: [
    'bg-[var(--info-bg)]',
    'text-[var(--color-info)]',
    'border-[var(--color-info)]',
  ].join(' '),
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-[12px]',
  lg: 'px-3 py-1.5 text-[13px]',
};

/**
 * Badge 컴포넌트
 * @param {Object} props
 * @param {'default' | 'success' | 'warning' | 'error' | 'info'} props.variant - 배지 스타일
 * @param {'sm' | 'md' | 'lg'} props.size - 배지 크기
 * @param {React.ReactNode} props.children - 배지 내용
 * @param {React.ReactNode} props.leftIcon - 왼쪽 아이콘
 * @param {string} props.className - 추가 클래스
 */
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  leftIcon,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        font-semibold
        rounded-[var(--radius-sm)]
        border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {leftIcon}
      {children}
    </span>
  );
}

/**
 * DotBadge 컴포넌트 (알림 점)
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info'} props.variant - 색상
 * @param {'sm' | 'md' | 'lg'} props.size - 크기
 */
export function DotBadge({ variant = 'error', size = 'md' }) {
  const dotColors = {
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    error: 'bg-[var(--color-error)]',
    info: 'bg-[var(--color-info)]',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`
        ${dotSizes[size]}
        ${dotColors[variant]}
        rounded-full
        inline-block
      `}
    />
  );
}

/**
 * CountBadge 컴포넌트 (숫자 배지)
 * @param {Object} props
 * @param {number} props.count - 숫자
 * @param {number} props.max - 최대 표시 숫자
 * @param {'sm' | 'md' | 'lg'} props.size - 크기
 */
export function CountBadge({ count = 0, max = 99, size = 'md' }) {
  const countSizes = {
    sm: 'min-w-4 h-4 text-[10px] px-1',
    md: 'min-w-5 h-5 text-[11px] px-1.5',
    lg: 'min-w-6 h-6 text-[12px] px-2',
  };

  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={`
        ${countSizes[size]}
        inline-flex
        items-center
        justify-center
        bg-[var(--color-error)]
        text-white
        font-semibold
        rounded-full
      `}
    >
      {displayCount}
    </span>
  );
}