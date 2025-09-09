import React from 'react';
import { usePermissions } from '@/lib/permissions';
import { useBranchContext } from '@/lib/use-branch-context';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Shield, AlertTriangle } from 'lucide-react';

interface BranchProtectedRouteProps {
  children: React.ReactNode;
  requireBranchAccess?: boolean;
  ownerOnly?: boolean;
  managerAccess?: boolean;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export default function BranchProtectedRoute({
  children,
  requireBranchAccess = true,
  ownerOnly = false,
  managerAccess = false,
  requiredPermission,
  fallback
}: BranchProtectedRouteProps) {
  const permissions = usePermissions();
  const {
    currentBranchId,
    currentBranch,
    canSwitchBranches,
    canViewAllBranches,
    availableBranches
  } = useBranchContext();

  // Check basic authentication
  if (!permissions.isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500">Please sign in to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check owner-only access
  if (ownerOnly && !permissions.isOwner) {
    return fallback || (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Owner Access Required</h3>
            <p className="text-gray-500">This feature is only available to business owners.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check manager access
  if (managerAccess && !['owner', 'co_founder', 'manager'].includes(permissions.userRole)) {
    return fallback || (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Manager Access Required</h3>
            <p className="text-gray-500">This feature requires manager-level permissions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check specific permission
  if (requiredPermission && !permissions.hasPermission(requiredPermission)) {
    return fallback || (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access this feature.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check branch access requirements
  if (requireBranchAccess) {
    // If viewing all branches, check if user has that permission
    if (currentBranchId === null && !canViewAllBranches) {
      return fallback || (
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Building className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Global View Not Permitted</h3>
              <p className="text-gray-500">You can only view data for your assigned branches.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // If viewing specific branch, check if user has access
    if (currentBranchId && currentBranch) {
      const hasAccess = availableBranches.some(branch => branch.id === currentBranchId);
      
      if (!hasAccess) {
        return fallback || (
          <div className="p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Building className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Branch Access Denied</h3>
                <p className="text-gray-500">
                  You don't have access to "{currentBranch.name}" branch.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }
    }

    // If no branch is selected and user has multiple branches, show selection prompt
    if (!currentBranchId && availableBranches.length > 1 && canSwitchBranches) {
      return fallback || (
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Building className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Branch</h3>
              <p className="text-gray-500 mb-4">
                Please select a branch to view data, or choose "All Branches" if available.
              </p>
              <div className="text-sm text-gray-400">
                Use the branch switcher in the top navigation to select a branch.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // If user has no branch access at all
    if (availableBranches.length === 0) {
      return fallback || (
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Branch Access</h3>
              <p className="text-gray-500">
                You haven't been assigned to any branches. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// HOC for easier use
export function withBranchProtection(
  Component: React.ComponentType,
  options: Omit<BranchProtectedRouteProps, 'children'>
) {
  return function BranchProtectedComponent(props: any) {
    return (
      <BranchProtectedRoute {...options}>
        <Component {...props} />
      </BranchProtectedRoute>
    );
  };
}

// Hook for checking branch access in components
export function useBranchAccess() {
  const permissions = usePermissions();
  const {
    currentBranchId,
    currentBranch,
    canSwitchBranches,
    canViewAllBranches,
    availableBranches
  } = useBranchContext();

  const checkBranchAccess = (branchId: string | null): boolean => {
    // Owners can access all branches
    if (permissions.isOwner) return true;
    
    // Check all branches access
    if (branchId === null) return canViewAllBranches;
    
    // Check specific branch access
    return availableBranches.some(branch => branch.id === branchId);
  };

  const checkFeatureAccess = (feature: string): boolean => {
    // Basic permission check
    if (!permissions.hasPermission(feature)) return false;
    
    // Additional branch-specific checks can be added here
    return true;
  };

  return {
    checkBranchAccess,
    checkFeatureAccess,
    hasCurrentBranchAccess: currentBranchId ? checkBranchAccess(currentBranchId) : canViewAllBranches,
    canAccessAllBranches: canViewAllBranches,
    canSwitchBranches,
    availableBranches,
    currentBranch,
    isOwner: permissions.isOwner,
    userRole: permissions.userRole
  };
}
