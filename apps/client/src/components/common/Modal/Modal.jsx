/**
 * Apple-Style Modal Component
 * Glassmorphism, spring animations, soft corners
 */
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/common/Button';

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[90vw]',
};

/**
 * Modal 컴포넌트 - Apple Style
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {string} props.title - 모달 제목
 * @param {'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'} props.size - 모달 크기
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {React.ReactNode} props.footer - 푸터 (버튼 영역)
 * @param {boolean} props.hasCloseButton - 닫기 버튼 표시 여부
 * @param {boolean} props.closeOnOverlayClick - 오버레이 클릭 시 닫기 여부
 * @param {boolean} props.glass - glassmorphism 효과 적용 여부
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
  glass = false,
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

  const panelClass = glass
    ? 'bg-[var(--bg-glass-strong)] backdrop-blur-2xl border-[var(--border-default)]'
    : 'bg-[var(--bg-panel)] border-[var(--border-default)]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

      {/* Modal Panel */}
      <div
        className={`
          relative
          w-full
          ${sizeStyles[size]}
          ${panelClass}
          border
          rounded-[var(--radius-2xl)]
          shadow-[var(--shadow-2xl)]
          animate-spring-in
          overflow-hidden
        `}
      >
        {/* Header */}
        {(title || hasCloseButton) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
            {title && (
              <h2 className="text-[20px] font-semibold text-[var(--text-bright)] tracking-[-0.01em]">
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
                className="ml-auto -mr-2 rounded-full hover:bg-[var(--bg-hover)]"
              />
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-5 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}