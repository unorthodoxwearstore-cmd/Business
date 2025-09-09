import { useState, useEffect, useCallback } from 'react';
import { branchService, Branch, BranchContext } from './branch-service';
import { usePermissions } from './permissions';

export interface BranchContextHook {
  // Current state
  currentBranchId: string | null;
  currentBranch: Branch | null;
  availableBranches: Branch[];
  
  // Permissions
  canSwitchBranches: boolean;
  canViewAllBranches: boolean;
  canEditBranches: boolean;
  
  // Actions
  switchToBranch: (branchId: string | null) => void;
  refreshBranches: () => void;
  toggleFavoriteBranch: (branchId: string) => void;
  
  // Utilities
  getBranchDisplayName: (branchId: string | null) => string;
  isCurrentBranch: (branchId: string | null) => boolean;
  filterDataByBranch: <T extends { branchId?: string }>(data: T[]) => T[];
  addBranchToData: <T>(data: T) => T & { branchId: string };
  
  // Loading state
  isLoading: boolean;
}

export const useBranchContext = (): BranchContextHook => {
  const permissions = usePermissions();
  const [context, setContext] = useState<BranchContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and subscribe to context changes
  useEffect(() => {
    const updateContext = () => {
      const newContext = branchService.getBranchContext(
        permissions.userRole,
        'current_user' // TODO: Get actual user ID from auth
      );
      setContext(newContext);
      setIsLoading(false);
    };

    // Initial load
    updateContext();

    // Subscribe to changes
    const unsubscribe = branchService.onContextChange(updateContext);

    return unsubscribe;
  }, [permissions.userRole]);

  // Switch branch handler
  const switchToBranch = useCallback((branchId: string | null) => {
    if (!context) return;
    
    // Validate access
    if (branchId !== null) {
      const hasAccess = branchService.canUserAccessBranch(
        'current_user', 
        branchId, 
        permissions.userRole
      );
      
      if (!hasAccess) {
        console.warn('User does not have access to branch:', branchId);
        return;
      }
    } else if (!context.canViewAllBranches) {
      console.warn('User cannot view all branches');
      return;
    }
    
    branchService.setCurrentBranch(branchId);
  }, [context, permissions.userRole]);

  // Refresh branches
  const refreshBranches = useCallback(() => {
    setIsLoading(true);
    // Trigger context update by notifying service
    const newContext = branchService.getBranchContext(
      permissions.userRole,
      'current_user'
    );
    setContext(newContext);
    setIsLoading(false);
  }, [permissions.userRole]);

  // Toggle favorite branch
  const toggleFavoriteBranch = useCallback((branchId: string) => {
    branchService.toggleFavoriteBranch(branchId);
  }, []);

  // Utility functions
  const getBranchDisplayName = useCallback((branchId: string | null) => {
    return branchService.getBranchDisplayName(branchId);
  }, []);

  const isCurrentBranch = useCallback((branchId: string | null) => {
    return context?.currentBranchId === branchId;
  }, [context?.currentBranchId]);

  const filterDataByBranch = useCallback(<T extends { branchId?: string }>(data: T[]) => {
    return branchService.filterDataByCurrentBranch(data);
  }, []);

  const addBranchToData = useCallback(<T>(data: T) => {
    return branchService.addBranchContext(data);
  }, []);

  // Compute derived values
  const currentBranch = context?.currentBranchId 
    ? branchService.getBranchById(context.currentBranchId) 
    : null;

  const canEditBranches = permissions.hasPermission('manage_settings') || permissions.isOwner;

  return {
    // Current state
    currentBranchId: context?.currentBranchId || null,
    currentBranch,
    availableBranches: context?.availableBranches || [],
    
    // Permissions
    canSwitchBranches: context?.canSwitchBranches || false,
    canViewAllBranches: context?.canViewAllBranches || false,
    canEditBranches,
    
    // Actions
    switchToBranch,
    refreshBranches,
    toggleFavoriteBranch,
    
    // Utilities
    getBranchDisplayName,
    isCurrentBranch,
    filterDataByBranch,
    addBranchToData,
    
    // Loading state
    isLoading
  };
};
