/**
 * Apple-Style Card Component
 * Soft corners, glassmorphism, subtle shadows, and smooth interactions
 */

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
    'shadow-[var(--shadow-card)]',
  ].join(' '),

  outline: [
    'bg-transparent',
    'border-2',
    'border-[var(--border-default)]',
    'border-dashed',
  ].join(' '),

  glass: [
    'bg-[var(--bg-glass-strong)]',
    'backdrop-blur-xl',
    'border',
    'border-[var(--border-default)]',
    'shadow-[var(--shadow-soft)]',
  ].join(' '),

  bento: [
    'bg-[var(--bg-input)]',
    'border',
    'border-[var(--border-subtle)]',
  ].join(' '),
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

/**
 * Card 컴포넌트 - Apple Style
 * @param {Object} props
 * @param {'default' | 'elevated' | 'outline' | 'glass' | 'bento'} props.variant - 카드 스타일
 * @param {'none' | 'sm' | 'md' | 'lg' | 'xl'} props.padding - 내부 패딩
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
    ? 'cursor-pointer hover:border-[var(--color-green-primary)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 transition-all duration-300 ease-out'
    : '';

  const selectedStyles = isSelected
    ? 'border-[var(--color-green-primary)] ring-4 ring-[var(--color-green-primary)]/10 shadow-[var(--shadow-glow)]'
    : '';

  return (
    <div
      className={`
        rounded-[var(--radius-2xl)]
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
        pb-5 mb-5 border-b border-[var(--border-subtle)]
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
        text-[18px] font-semibold text-[var(--text-bright)] tracking-[-0.01em]
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
        mt-1.5 text-[14px] text-[var(--text-secondary)] leading-relaxed
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
        pt-5 mt-5 border-t border-[var(--border-subtle)]
        flex items-center justify-end gap-3
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * BentoCard 컴포넌트 - Bento Grid용 특별 카드
 */
export function BentoCard({
  children,
  className = '',
  span = 1,
  rowSpan = 1,
  ...props
}) {
  const spanClass = span === 2 ? 'md:col-span-2' : '';
  const rowSpanClass = rowSpan === 2 ? 'md:row-span-2' : '';

  return (
    <div
      className={`
        bg-[var(--bg-input)]
        rounded-[var(--radius-2xl)]
        p-6
        border border-[var(--border-subtle)]
        transition-all duration-300 ease-out
        hover:-translate-y-1
        hover:shadow-[var(--shadow-lg)]
        ${spanClass}
        ${rowSpanClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}