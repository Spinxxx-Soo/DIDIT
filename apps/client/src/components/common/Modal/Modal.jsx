import { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/common/Button';

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Modal 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {string} props.title - 모달 제목
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - 모달 크기
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {React.ReactNode} props.footer - 푸터 (버튼 영역)
 * @param {boolean} props.hasCloseButton - 닫기 버튼 표시 여부
 * @param {boolean} props.closeOnOverlayClick - 오버레이 클릭 시 닫기 여부
 */
export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  hasCloseButton = true,
  closeOnOverlayClick = true,
}) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          w-full
          ${sizeStyles[size]}
          bg-[var(--bg-panel)]
          border
          border-[var(--border-default)]
          rounded-[var(--radius-xl)]
          shadow-[var(--shadow-xl)]
          animate-slide-up
        `}
      >
        {/* Header */}
        {(title || hasCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
            {title && (
              <h2 className="text-[20px] font-semibold text-[var(--text-bright)]">
                {title}
              </h2>
            )}
            {hasCloseButton && (
              <IconButton
                icon={<X size={20} />}
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="닫기"
                className="ml-auto"
              />
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border-default)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}