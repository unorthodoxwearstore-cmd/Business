import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Building2 } from 'lucide-react';
import { Shimmer, ShimmerCard, ShimmerStats, ShimmerChart, ShimmerList } from '@/components/ui/shimmer';

interface LoadingProps {
  type?: 'spinner' | 'shimmer' | 'dots' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'table' | 'cards' | 'chart' | 'list' | 'form';
  className?: string;
}

// Basic loading spinner
export const Loading: React.FC<LoadingProps> = ({ 
  type = 'spinner', 
  size = 'md', 
  text, 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (type === 'dots') {
    return (
      <div className={cn("flex items-center justify-center gap-1", className)}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (type === 'shimmer') {
    return (
      <div className={cn("space-y-3", className)}>
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-4 w-1/2" />
        <Shimmer className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

// Full page loading screen
export const FullPageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="bg-blue-600 p-3 rounded-xl">
            <Building2 className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
        <div>
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-lg font-medium text-gray-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Skeleton loading for different page types
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'dashboard', 
  className 
}) => {
  const skeletons = {
    dashboard: (
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
    ),

    table: (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-10 w-24" />
        </div>
        <div className="border rounded-lg p-4">
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} className="h-4 w-full" />
              ))}
            </div>
            {/* Data rows */}
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <Shimmer key={colIndex} className="h-3 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    cards: (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      </div>
    ),

    chart: (
      <div className={cn("space-y-4", className)}>
        <ShimmerChart />
      </div>
    ),

    list: (
      <div className={cn("space-y-4", className)}>
        <ShimmerList items={5} />
      </div>
    ),

    form: (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-10 w-24" />
          <Shimmer className="h-10 w-20" />
        </div>
      </div>
    )
  };

  return skeletons[variant];
};

// Loading overlay for components
export const LoadingOverlay: React.FC<{ 
  isLoading: boolean; 
  children: React.ReactNode;
  message?: string;
}> = ({ isLoading, children, message = 'Loading...' }) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Button loading state
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ isLoading, children, loadingText, className, onClick, disabled }) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all",
        "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  );
};

// Progress bar
export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  showPercentage?: boolean;
}> = ({ progress, className, showPercentage = false }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn("space-y-1", className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{clampedProgress.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default Loading;
