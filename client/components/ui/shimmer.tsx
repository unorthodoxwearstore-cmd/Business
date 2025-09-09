import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export const Shimmer: React.FC<ShimmerProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded",
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    >
      {children}
    </div>
  );
};

export const ShimmerCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("border rounded-lg p-4 space-y-3", className)}>
      <Shimmer className="h-4 w-3/4" />
      <Shimmer className="h-3 w-1/2" />
      <div className="space-y-2">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-2/3" />
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-8 w-16" />
        <Shimmer className="h-8 w-20" />
      </div>
    </div>
  );
};

export const ShimmerTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-4 w-full" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Shimmer key={colIndex} className="h-3 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const ShimmerStats: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-4 w-4 rounded" />
          </div>
          <Shimmer className="h-8 w-24 mb-1" />
          <Shimmer className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
};

export const ShimmerChart: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("border rounded-lg p-4", className)}>
      <div className="space-y-2 mb-4">
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-3 w-48" />
      </div>
      <div className="h-64 bg-gray-50 rounded flex items-end justify-between p-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer
            key={i}
            className="w-8 h-12"
          />
        ))}
      </div>
    </div>
  );
};

export const ShimmerList: React.FC<{ items?: number }> = ({ items = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded">
          <Shimmer className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
          <Shimmer className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
};

export const DashboardShimmer: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Shimmer className="h-8 w-48" />
        <Shimmer className="h-4 w-64" />
      </div>

      {/* Stats cards */}
      <ShimmerStats count={4} />

      {/* Chart */}
      <ShimmerChart />

      {/* Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Shimmer className="h-6 w-32" />
          <ShimmerList items={3} />
        </div>
        <div className="space-y-4">
          <Shimmer className="h-6 w-32" />
          <ShimmerList items={3} />
        </div>
      </div>
    </div>
  );
};

// Add shimmer animation to global CSS
const shimmerStyle = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined') {
  const styleId = 'shimmer-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shimmerStyle;
    document.head.appendChild(style);
  }
}
