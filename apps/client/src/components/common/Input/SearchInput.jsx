import { Search, X } from 'lucide-react';

const sizeStyles = {
  sm: 'h-9 pl-9 pr-3 text-[13px]',
  md: 'h-10 pl-10 pr-4 text-[14px]',
  lg: 'h-12 pl-11 pr-4 text-[15px]',
};

const iconSizeMap = {
  sm: 16,
  md: 18,
  lg: 20,
};

const baseStyles = [
  'w-full',
  'bg-[var(--bg-input)]',
  'border',
  'border-[var(--border-default)]',
  'rounded-[var(--radius-full)]',
  'text-[var(--text-primary)]',
  'placeholder:text-[var(--text-tertiary)]',
  'transition-all',
  'duration-200',
  'focus:outline-none',
  'focus:border-[var(--color-green-primary)]',
  'focus:ring-3',
  'focus:ring-[var(--color-green-primary)]/20',
].join(' ');

/**
 * SearchInput 컴포넌트
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} props.size - 입력창 크기
 * @param {string} props.value - 입력 값
 * @param {Function} props.onChange - 값 변경 핸들러
 * @param {Function} props.onClear - 초기화 핸들러
 * @param {string} props.placeholder - 플레이스홀더
 * @param {string} props.className - 추가 클래스
 */
export function SearchInput({
  size = 'md',
  value,
  onChange,
  onClear,
  placeholder = '검색...',
  className = '',
  ...props
}) {
  const iconSize = iconSizeMap[size];

  return (
    <div className={`relative ${className}`}>
      {/* 검색 아이콘 */}
      <Search
        size={iconSize}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
      />

      {/* 입력창 */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseStyles} ${sizeStyles[size]}`}
        {...props}
      />

      {/* 초기화 버튼 */}
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={iconSize} />
        </button>
      )}
    </div>
  );
}