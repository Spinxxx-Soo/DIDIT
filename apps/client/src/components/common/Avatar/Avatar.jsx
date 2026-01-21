import { User } from 'lucide-react';

const sizeStyles = {
  xs: { container: 'w-6 h-6', icon: 12, text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', icon: 14, text: 'text-[11px]' },
  md: { container: 'w-10 h-10', icon: 18, text: 'text-[13px]' },
  lg: { container: 'w-12 h-12', icon: 22, text: 'text-[15px]' },
  xl: { container: 'w-16 h-16', icon: 28, text: 'text-[18px]' },
  '2xl': { container: 'w-24 h-24', icon: 40, text: 'text-[24px]' },
};

const statusColors = {
  online: 'bg-[var(--color-success)]',
  offline: 'bg-[var(--text-disabled)]',
  busy: 'bg-[var(--color-error)]',
  away: 'bg-[var(--color-warning)]',
};

const statusSizeStyles = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-3.5 h-3.5 border-2',
  '2xl': 'w-4 h-4 border-2',
};

/**
 * Avatar 컴포넌트
 * @param {Object} props
 * @param {string} props.src - 이미지 URL
 * @param {string} props.alt - 대체 텍스트
 * @param {string} props.name - 이름 (이니셜 표시용)
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'} props.size - 크기
 * @param {'online' | 'offline' | 'busy' | 'away'} props.status - 상태 표시
 * @param {string} props.className - 추가 클래스
 */
export function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  status,
  className = '',
}) {
  const styles = sizeStyles[size];

  // 이름에서 이니셜 추출
  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${styles.container}
          rounded-full
          overflow-hidden
          bg-[var(--bg-input)]
          border-2
          border-[var(--border-default)]
          flex
          items-center
          justify-center
        `}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : name ? (
          <span
            className={`
              ${styles.text}
              font-semibold
              text-[var(--text-secondary)]
            `}
          >
            {getInitials(name)}
          </span>
        ) : (
          <User
            size={styles.icon}
            className="text-[var(--text-tertiary)]"
          />
        )}
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          className={`
            absolute
            bottom-0
            right-0
            ${statusSizeStyles[size]}
            ${statusColors[status]}
            rounded-full
            border-[var(--bg-panel)]
          `}
        />
      )}
    </div>
  );
}