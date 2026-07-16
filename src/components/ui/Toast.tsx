import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onDismiss(toast.id);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const icons = {
    success: <CheckCircle size={16} className="text-success" />,
    error: <AlertCircle size={16} className="text-error" />,
    info: <Info size={16} className="text-info" />,
    warning: <AlertTriangle size={16} className="text-warning" />,
  };

  const barColors = {
    success: 'bg-success',
    error: 'bg-error',
    info: 'bg-info',
    warning: 'bg-warning',
  };

  return (
    <div className="relative overflow-hidden bg-bg-secondary border border-border rounded-lg shadow-lg animate-slide-up">
      <div className="flex items-start gap-2.5 p-3">
        <span className="shrink-0 mt-0.5">{icons[toast.type]}</span>
        <p className="text-sm text-text-primary flex-1">{toast.message}</p>
        <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-text-muted hover:text-text-primary">
          <X size={13} />
        </button>
      </div>
      <div className="h-0.5 bg-bg-tertiary">
        <div
          className={`h-full ${barColors[toast.type]} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
