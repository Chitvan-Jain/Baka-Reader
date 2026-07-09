interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({ className = '', variant = 'rect', width, height, count = 1 }: SkeletonProps) {
  const baseClass = 'skeleton-shimmer rounded-lg';

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '14px' : variant === 'circle' ? width || '40px' : '100%'),
    borderRadius: variant === 'circle' ? '50%' : undefined,
  };

  if (count > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={baseClass} style={{ ...style, width: i === count - 1 ? '70%' : style.width }} />
        ))}
      </div>
    );
  }

  return <div className={`${baseClass} ${className}`} style={style} />;
}

export function ChapterCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-bg-secondary animate-pulse">
      <Skeleton width={64} height={90} className="rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={18} />
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="30%" height={12} />
        <div className="flex gap-2 pt-1">
          <Skeleton width={70} height={28} className="rounded-md" />
          <Skeleton width={28} height={28} className="rounded-md" />
          <Skeleton width={28} height={28} className="rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function MangaCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-bg-secondary animate-pulse">
      <Skeleton width={48} height={68} className="rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="text" width="50%" height={12} />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden skeleton-shimmer" />
  );
}
