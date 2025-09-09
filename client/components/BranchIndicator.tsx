import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building, Globe, MapPin } from 'lucide-react';
import { useBranchContext } from '@/lib/use-branch-context';

interface BranchIndicatorProps {
  variant?: 'badge' | 'full' | 'minimal';
  showIcon?: boolean;
  showAddress?: boolean;
  className?: string;
}

export default function BranchIndicator({ 
  variant = 'badge',
  showIcon = true,
  showAddress = false,
  className = ""
}: BranchIndicatorProps) {
  const {
    currentBranchId,
    currentBranch,
    getBranchDisplayName,
    isLoading
  } = useBranchContext();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  const displayName = getBranchDisplayName(currentBranchId);
  const isAllBranches = currentBranchId === null;

  const renderBadgeVariant = () => (
    <Badge variant="outline" className={`text-xs ${className}`}>
      {showIcon && (
        <>
          {isAllBranches ? (
            <Globe className="w-3 h-3 mr-1" />
          ) : (
            <Building className="w-3 h-3 mr-1" />
          )}
        </>
      )}
      {isAllBranches ? 'All Branches' : currentBranch?.code || 'Unknown'}
    </Badge>
  );

  const renderMinimalVariant = () => (
    <div className={`flex items-center text-sm text-gray-600 ${className}`}>
      {showIcon && (
        <>
          {isAllBranches ? (
            <Globe className="w-4 h-4 mr-1" />
          ) : (
            <Building className="w-4 h-4 mr-1" />
          )}
        </>
      )}
      <span className="font-medium">
        {isAllBranches ? 'Global' : currentBranch?.code || 'Unknown'}
      </span>
    </div>
  );

  const renderFullVariant = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isAllBranches ? 'bg-purple-100' : 'bg-blue-100'
      }`}>
        {isAllBranches ? (
          <Globe className="w-4 h-4 text-purple-600" />
        ) : (
          <Building className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">
          {displayName}
        </div>
        {showAddress && currentBranch?.address && (
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{currentBranch.address}</span>
          </div>
        )}
        {!isAllBranches && currentBranch && (
          <div className="text-xs text-gray-500">
            Branch: {currentBranch.code}
          </div>
        )}
      </div>
    </div>
  );

  switch (variant) {
    case 'minimal':
      return renderMinimalVariant();
    case 'full':
      return renderFullVariant();
    default:
      return renderBadgeVariant();
  }
}

// Helper component for page headers
export const BranchPageHeader = ({ 
  title, 
  description,
  children 
}: { 
  title: string;
  description?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <div className="flex items-center space-x-3 mb-1">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <BranchIndicator variant="badge" />
        </div>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};
