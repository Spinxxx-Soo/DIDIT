import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/common/Button/IconButton';
import './DraggableWindow.css';

/**
 * DraggableWindow 컴포넌트
 * 사용자가 드래그하여 이동할 수 있는 독립적인 창을 제공합니다.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 창의 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {string} props.title - 창 제목
 * @param {React.ReactNode} props.children - 창 내용
 * @param {number} props.defaultX - 초기 X 위치 (기본값: 100)
 * @param {number} props.defaultY - 초기 Y 위치 (기본값: 100)
 * @param {number} props.defaultWidth - 초기 너비 (기본값: 500)
 * @param {number} props.defaultHeight - 초기 높이 (기본값: 400)
 * @param {string} props.id - 창의 고유 ID (Z-index 관리용)
 */
export function DraggableWindow({
  isOpen,
  onClose,
  title,
  children,
  defaultX = 100,
  defaultY = 100,
  defaultWidth = 500,
  defaultHeight = 400,
  id = 'window',
}) {
  const windowRef = useRef(null);
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);

  if (!isOpen) return null;

  // 드래그 시작
  const handleMouseDown = (e) => {
    // 헤더를 잡았을 때만 드래그 시작
    if (e.target.closest('[data-drag-handle]')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      setZIndex(1000 + Math.floor(Math.random() * 100)); // Z-index 증가
    }
  };

  // 리사이즈 시작
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // 마우스 이동
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        setSize({
          width: Math.max(300, resizeStart.width + deltaX),
          height: Math.max(200, resizeStart.height + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  return (
    <div
      ref={windowRef}
      className="draggable-window"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: zIndex,
      }}
      onMouseDown={() => setZIndex(1000 + Math.floor(Math.random() * 100))}
    >
      {/* 헤더 */}
      <div
        className="draggable-window-header"
        data-drag-handle
        onMouseDown={handleMouseDown}
      >
        <h2 className="draggable-window-title">{title}</h2>
        <IconButton
          icon={<X size={18} />}
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="draggable-window-close"
        />
      </div>

      {/* 본문 */}
      <div className="draggable-window-content">
        {children}
      </div>

      {/* 리사이즈 핸들 */}
      <div
        className="draggable-window-resize-handle"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}

export default DraggableWindow;
