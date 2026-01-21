import { Avatar } from './Avatar';

/**
 * AvatarGroup 컴포넌트
 * @param {Object} props
 * @param {Array} props.avatars - 아바타 배열 [{ src, name, alt }]
 * @param {number} props.max - 최대 표시 개수
 * @param {'xs' | 'sm' | 'md' | 'lg'} props.size - 아바타 크기
 * @param {string} props.className - 추가 클래스
 */
export function AvatarGroup({
  avatars = [],
  max = 4,
  size = 'md',
  className = '',
}) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const overlapStyles = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
  };

  const counterSizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-12 h-12 text-[15px]',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={index > 0 ? overlapStyles[size] : ''}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`
            ${overlapStyles[size]}
            ${counterSizeStyles[size]}
            rounded-full
            bg-[var(--bg-input)]
            border-2
            border-[var(--border-default)]
            flex
            items-center
            justify-center
            font-medium
            text-[var(--text-secondary)]
          `}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}