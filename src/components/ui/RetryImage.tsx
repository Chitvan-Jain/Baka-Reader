import { useState, useCallback, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface RetryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  maxRetries?: number;
  retryDelay?: number; // ms between retries
}

/**
 * Image component that automatically retries loading on failure.
 * Shows a retry button after all automatic retries are exhausted.
 */
export default function RetryImage({
  src,
  maxRetries = 3,
  retryDelay = 2000,
  alt,
  className,
  style,
  ...rest
}: RetryImageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Reset when src changes (e.g., navigating to a different page)
  useEffect(() => {
    setRetryCount(0);
    setStatus('loading');
    setCurrentSrc(src);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [src]);

  const handleError = useCallback(() => {
    if (retryCount < maxRetries) {
      setStatus('loading');
      timerRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Bust cache by appending a query param
        const separator = src?.includes('?') ? '&' : '?';
        setCurrentSrc(`${src}${separator}_retry=${retryCount + 1}`);
      }, retryDelay);
    } else {
      setStatus('error');
    }
  }, [retryCount, maxRetries, retryDelay, src]);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
  }, []);

  const handleManualRetry = () => {
    setRetryCount(0);
    setStatus('loading');
    const separator = src?.includes('?') ? '&' : '?';
    setCurrentSrc(`${src}${separator}_retry=manual_${Date.now()}`);
  };

  if (status === 'error') {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 bg-black/40 rounded-lg ${className || ''}`}
        style={{ ...style, minHeight: '200px' }}
      >
        <p className="text-sm text-white/50">Failed to load page</p>
        <button
          onClick={handleManualRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative" style={style}>
      {status === 'loading' && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${className || ''}`}
          style={{ minHeight: '200px' }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            {retryCount > 0 && (
              <p className="text-xs text-white/40">Retry {retryCount}/{maxRetries}</p>
            )}
          </div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className || ''} ${status === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={status === 'loaded' ? style : undefined}
        onError={handleError}
        onLoad={handleLoad}
        {...rest}
      />
    </div>
  );
}
