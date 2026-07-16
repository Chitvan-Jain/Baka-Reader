import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handler);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${maxWidth} bg-bg-secondary border border-border rounded-lg shadow-lg animate-scale-in`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
