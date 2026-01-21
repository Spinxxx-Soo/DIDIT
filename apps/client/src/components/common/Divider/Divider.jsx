const variantStyles = {
  default: 'bg-[var(--border-default)]',
  strong: 'bg-[var(--border-strong)]',
  subtle: 'bg-[var(--border-subtle)]',
};

/**
 * Divider 컴포넌트
 * @param {Object} props
 * @param {'horizontal' | 'vertical'} props.orientation - 방향
 * @param {'default' | 'strong' | 'subtle'} props.variant - 스타일
 * @param {string} props.label - 중간 라벨 (horizontal만 지원)
 * @param {string} props.className - 추가 클래스
 */
export function Divider({
  orientation = 'horizontal',
  variant = 'default',
  label,
  className = '',
}) {
  if (orientation === 'vertical') {
    return (
      <div
        className={`
          w-px
          self-stretch
          ${variantStyles[variant]}
          ${className}
        `}
      />
    );
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className={`flex-1 h-px ${variantStyles[variant]}`} />
        <span className="text-[13px] text-[var(--text-tertiary)]">{label}</span>
        <div className={`flex-1 h-px ${variantStyles[variant]}`} />
      </div>
    );
  }

  return (
    <div
      className={`
        h-px
        w-full
        ${variantStyles[variant]}
        ${className}
      `}
    />
  );
}