import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Building, 
  Search, 
  Star, 
  Check, 
  Globe,
  MapPin,
  Plus,
  Settings
} from 'lucide-react';
import { useBranchContext } from '@/lib/use-branch-context';
import { Branch } from '@/lib/branch-service';

interface BranchSwitcherProps {
  variant?: 'header' | 'sidebar' | 'compact';
  showBadge?: boolean;
  onCreateBranch?: () => void;
  onManageBranches?: () => void;
}

export default function BranchSwitcher({ 
  variant = 'header',
  showBadge = true,
  onCreateBranch,
  onManageBranches
}: BranchSwitcherProps) {
  const {
    currentBranchId,
    currentBranch,
    availableBranches,
    canSwitchBranches,
    canViewAllBranches,
    canEditBranches,
    switchToBranch,
    toggleFavoriteBranch,
    getBranchDisplayName,
    isCurrentBranch,
    isLoading
  } = useBranchContext();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter branches based on search
  const filteredBranches = availableBranches.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate favorites and regular branches
  const favoriteBranches = filteredBranches.filter(branch => branch.isFavorite);
  const regularBranches = filteredBranches.filter(branch => !branch.isFavorite);

  const handleBranchSelect = (branchId: string | null) => {
    switchToBranch(branchId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggleFavorite = (e: React.MouseEvent, branchId: string) => {
    e.stopPropagation();
    toggleFavoriteBranch(branchId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Don't show switcher if user can't switch branches and only has one branch
  if (!canSwitchBranches && availableBranches.length <= 1) {
    return showBadge && currentBranch ? (
      <Badge variant="outline" className="text-xs">
        <Building className="w-3 h-3 mr-1" />
        {currentBranch.code}
      </Badge>
    ) : null;
  }

  const currentDisplayName = getBranchDisplayName(currentBranchId);

  const renderBranchItem = (branch: Branch) => (
    <div
      key={branch.id}
      className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg transition-colors ${
        isCurrentBranch(branch.id)
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50'
      }`}
      onClick={() => handleBranchSelect(branch.id)}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Building className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 truncate">
              {branch.name}
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              {branch.code}
            </Badge>
            {branch.status === 'inactive' && (
              <Badge variant="destructive" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
          {branch.address && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{branch.address}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {isCurrentBranch(branch.id) && (
          <Check className="w-4 h-4 text-blue-600" />
        )}
        <button
          onClick={(e) => handleToggleFavorite(e, branch.id)}
          className={`p-1 rounded hover:bg-gray-100 ${
            branch.isFavorite ? 'text-yellow-500' : 'text-gray-400'
          }`}
        >
          <Star className={`w-4 h-4 ${branch.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );

  const renderCompactView = () => (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 max-w-48"
      >
        <Building className="w-4 h-4" />
        <span className="truncate">{currentDisplayName}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>
      {/* Dropdown rendered below */}
    </div>
  );

  const renderHeaderView = () => (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 h-auto px-3 py-2"
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Building className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-left">
          <div className="font-medium text-gray-900 text-sm truncate max-w-32">
            {currentBranch?.name || 'All Branches'}
          </div>
          <div className="text-xs text-gray-500">
            {currentBranch?.code || 'Global View'}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </Button>
      {/* Dropdown rendered below */}
    </div>
  );

  const renderSidebarView = () => (
    <div className="w-full">
      <Button
        ref={buttonRef}
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 h-auto"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 text-sm">
              {currentBranch?.name || 'All Branches'}
            </div>
            <div className="text-xs text-gray-500">
              {currentBranch?.code || 'Global View'}
            </div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </Button>
      {/* Dropdown rendered below */}
    </div>
  );

  const renderMainContent = () => {
    switch (variant) {
      case 'compact':
        return renderCompactView();
      case 'sidebar':
        return renderSidebarView();
      default:
        return renderHeaderView();
    }
  };

  return (
    <>
      {renderMainContent()}
      
      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg ${
            variant === 'sidebar' ? 'w-full' : 'w-80'
          }`}
          style={{
            top: '100%',
            left: variant === 'header' ? '0' : 'auto',
            right: variant === 'compact' ? '0' : 'auto'
          }}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {/* Header with search */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Switch Branch</h3>
                  {canEditBranches && onManageBranches && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onManageBranches}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {availableBranches.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search branches..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* All Branches option (for owners) */}
              {canViewAllBranches && (
                <div className="p-2">
                  <div
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg transition-colors ${
                      isCurrentBranch(null)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleBranchSelect(null)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Globe className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">All Branches</span>
                        <div className="text-xs text-gray-500">Global View</div>
                      </div>
                    </div>
                    {isCurrentBranch(null) && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </div>
              )}

              {/* Favorites section */}
              {favoriteBranches.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Favorites
                  </div>
                  <div className="space-y-1 mt-1">
                    {favoriteBranches.map(renderBranchItem)}
                  </div>
                </div>
              )}

              {/* Regular branches */}
              {regularBranches.length > 0 && (
                <div className="p-2">
                  {favoriteBranches.length > 0 && (
                    <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      All Branches
                    </div>
                  )}
                  <div className="space-y-1 mt-1">
                    {regularBranches.map(renderBranchItem)}
                  </div>
                </div>
              )}

              {/* No results */}
              {filteredBranches.length === 0 && searchQuery && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No branches found matching "{searchQuery}"
                </div>
              )}

              {/* Create branch option */}
              {canEditBranches && onCreateBranch && (
                <div className="p-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCreateBranch}
                    className="w-full justify-start text-gray-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Branch
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
