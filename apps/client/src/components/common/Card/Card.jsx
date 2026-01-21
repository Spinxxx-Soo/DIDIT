const variantStyles = {
  default: [
    'bg-[var(--bg-panel)]',
    'border',
    'border-[var(--border-default)]',
  ].join(' '),

  elevated: [
    'bg-[var(--bg-panel)]',
    'border',
    'border-[var(--border-default)]',
    'shadow-[var(--shadow-md)]',
  ].join(' '),

  outline: [
    'bg-transparent',
    'border-2',
    'border-[var(--border-default)]',
  ].join(' '),
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Card 컴포넌트
 * @param {Object} props
 * @param {'default' | 'elevated' | 'outline'} props.variant - 카드 스타일
 * @param {'none' | 'sm' | 'md' | 'lg'} props.padding - 내부 패딩
 * @param {boolean} props.isClickable - 클릭 가능 여부 (호버 효과)
 * @param {boolean} props.isSelected - 선택 상태
 * @param {Function} props.onClick - 클릭 핸들러
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} props.className - 추가 클래스
 */
export function Card({
  variant = 'default',
  padding = 'md',
  isClickable = false,
  isSelected = false,
  onClick,
  children,
  className = '',
  ...props
}) {
  const clickableStyles = isClickable
    ? 'cursor-pointer hover:border-[var(--color-green-primary)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all duration-200'
    : '';

  const selectedStyles = isSelected
    ? 'border-[var(--color-green-primary)] ring-2 ring-[var(--color-green-primary)]/20'
    : '';

  return (
    <div
      className={`
        rounded-[var(--radius-xl)]
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${clickableStyles}
        ${selectedStyles}
        ${className}
      `}
      onClick={isClickable ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader 컴포넌트
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div
      className={`
        pb-4 mb-4 border-b border-[var(--border-default)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle 컴포넌트
 */
export function CardTitle({ children, className = '' }) {
  return (
    <h3
      className={`
        text-[18px] font-semibold text-[var(--text-bright)]
        ${className}
      `}
    >
      {children}
    </h3>
  );
}

/**
 * CardDescription 컴포넌트
 */
export function CardDescription({ children, className = '' }) {
  return (
    <p
      className={`
        mt-1 text-[14px] text-[var(--text-secondary)]
        ${className}
      `}
    >
      {children}
    </p>
  );
}

/**
 * CardContent 컴포넌트
 */
export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

/**
 * CardFooter 컴포넌트
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`
        pt-4 mt-4 border-t border-[var(--border-default)]
        flex items-center justify-end gap-3
        ${className}
      `}
    >
      {children}
    </div>
  );
}