import { X, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

/**
 * 토스트 타입별 스타일
 */
const toastStyles = {
  success: {
    bg: 'bg-[var(--success-bg)]',
    border: 'border-[var(--color-success)]',
    text: 'text-[var(--success-text)]',
    icon: Check,
  },
  error: {
    bg: 'bg-[var(--error-bg)]',
    border: 'border-[var(--color-error)]',
    text: 'text-[var(--error-text)]',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-[var(--warning-bg)]',
    border: 'border-[var(--color-warning)]',
    text: 'text-[var(--warning-text)]',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-[var(--info-bg)]',
    border: 'border-[var(--color-info)]',
    text: 'text-[var(--info-text)]',
    icon: Info,
  },
};

/**
 * 개별 Toast 아이템
 */
function ToastItem({ id, type, message }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const style = toastStyles[type] || toastStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={`
        flex items-center gap-3
        px-4 py-3
        ${style.bg}
        backdrop-blur-xl
        border ${style.border}
        rounded-[var(--radius-xl)]
        shadow-[var(--shadow-lg)]
        animate-spring-in
        min-w-[280px]
        max-w-[400px]
      `}
    >
      <div className={`w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center ${style.bg}`}>
        <Icon size={16} className={style.text} />
      </div>
      <p className={`flex-1 text-[14px] font-medium ${style.text}`}>
        {message}
      </p>
      <button
        onClick={() => removeToast(id)}
        className={`
          w-7 h-7
          flex items-center justify-center
          rounded-full
          hover:bg-black/10
          transition-all duration-200
          active:scale-90
          ${style.text}
        `}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * Toast Container - App 최상위에 배치
 */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
