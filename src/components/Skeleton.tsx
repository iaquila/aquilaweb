import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
}) => {
  const roundedClass =
    variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded-md' : 'rounded-xl';

  return (
    <div
      className={`relative overflow-hidden bg-[#15241D]/70 ${roundedClass} ${className}`}
      style={{
        width: width,
        height: height,
      }}
    >
      {/* High-fidelity shimmer light-sweep */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#10B981]/15 to-transparent" />
    </div>
  );
};

export const CardSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`bg-[#0E1712] border border-[#1C2E24] rounded-2xl p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="h-4 w-1/3" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
};

export const MetricsSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#0E1712] border border-[#1C2E24] rounded-xl p-3.5 space-y-2">
          <Skeleton variant="text" className="h-3 w-2/5" />
          <Skeleton variant="text" className="h-6 w-3/5" />
          <Skeleton variant="rect" className="h-1.5 w-full mt-2" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => {
  return (
    <div className={`bg-[#0E1712] border border-[#1C2E24] rounded-2xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-[#1C2E24]">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="text" className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-[#1C2E24]/50 gap-4">
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton variant="circle" className="w-7 h-7 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="text" className="h-3.5 w-2/4" />
              <Skeleton variant="text" className="h-2.5 w-1/4" />
            </div>
          </div>
          <Skeleton variant="rect" className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
};
