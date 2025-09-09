import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/lib/auth-service';
import { UserRole } from '@/shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: UserRole;
  ownerOnly?: boolean;
  fallbackComponent?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  ownerOnly = false,
  fallbackComponent
}) => {
  const location = useLocation();
  
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check owner-only access
  if (ownerOnly && !authService.isOwner()) {
    return fallbackComponent || (
      <Card className="m-6">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold mb-2">Owner Access Only</h2>
            <p className="text-muted-foreground">
              This feature is restricted to business owners only.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check specific role requirement
  if (requiredRole && !authService.hasRole(requiredRole)) {
    return fallbackComponent || (
      <Card className="m-6">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-lg font-semibold mb-2">Insufficient Role</h2>
            <p className="text-muted-foreground">
              You need {requiredRole} role to access this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check specific permission requirement
  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    return fallbackComponent || (
      <Card className="m-6">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
