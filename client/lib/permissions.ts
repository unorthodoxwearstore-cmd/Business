import { UserRole, BusinessType } from '@/shared/types';
import { authService } from '@/lib/auth-service';

// Initialize permissions system for a user and business
export const initializePermissions = (user: any, business: any) => {
  return {
    getAllPermissions: () => {
      if (!user) return [];

      // Get role-based permissions
      const rolePermissions = authService.hasRole(user.role) ?
        authService.getCurrentUser()?.permissions || [] : [];

      return rolePermissions;
    },
    hasPermission: (permission: string) => {
      return authService.hasPermission(permission);
    },
    getUser: () => user,
    getBusiness: () => business
  };
};

// Hook to access current user permissions
export const usePermissions = () => {
  const currentUser = authService.getCurrentUser();
  const businessData = authService.getBusinessData();
  
  return {
    // User information
    userRole: currentUser?.role || 'staff' as UserRole,
    businessType: currentUser?.businessType || 'retailer' as BusinessType,
    businessName: currentUser?.businessName || 'Business',
    isOwner: authService.isOwner(),
    isAuthenticated: authService.isAuthenticated(),
    
    // Permission checking
    hasPermission: (permission: string): boolean => {
      return authService.hasPermission(permission);
    },
    
    hasRole: (role: UserRole): boolean => {
      return authService.hasRole(role);
    },
    
    // Convenience methods
    canViewFinancials: (): boolean => {
      return authService.hasPermission('view_financial_data');
    },
    
    canManageUsers: (): boolean => {
      return authService.hasPermission('manage_users');
    },
    
    canExportReports: (): boolean => {
      return authService.hasPermission('export_reports');
    },
    
    canViewAdvancedAnalytics: (): boolean => {
      return authService.hasPermission('view_advanced_analytics');
    },
    
    canManageSettings: (): boolean => {
      return authService.hasPermission('manage_settings');
    },
    
    // Business module access
    hasModuleAccess: (moduleId: string): boolean => {
      const user = currentUser;
      if (!user) return false;
      
      // Owner has access to everything
      if (user.isOwner) return true;
      
      // Role-based module access
      const roleModuleAccess: Record<UserRole, string[]> = {
        owner: ['*'], // All modules
        co_founder: ['*'], // All modules
        manager: [
          'analytics', 'products', 'orders', 'inventory', 'customers',
          'sales', 'reports', 'team-management', 'ai-assistant'
        ],
        staff: [
          'orders', 'customers', 'basic-inventory', 'pos', 'basic-reports'
        ],
        accountant: [
          'analytics', 'financial-reports', 'expenses', 'gst-reports',
          'profit-loss', 'ai-assistant'
        ],
        sales_executive: [
          'customers', 'orders', 'sales', 'commissions', 'targets',
          'ai-assistant'
        ]
      };
      
      const allowedModules = roleModuleAccess[user.role] || [];
      return allowedModules.includes('*') || allowedModules.includes(moduleId);
    },
    
    // Current user data
    getCurrentUser: () => currentUser,
    getBusinessData: () => businessData
  };
};

// Permission constants
export const PERMISSIONS = {
  // Basic permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_BASIC_ANALYTICS: 'view_basic_analytics',
  
  // Advanced permissions
  VIEW_ADVANCED_ANALYTICS: 'view_advanced_analytics',
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  EXPORT_REPORTS: 'export_reports',
  
  // Module permissions
  VIEW_AI_ASSISTANT: 'view_ai_assistant',
  VIEW_INVENTORY: 'view_inventory',
  CREATE_PRODUCT: 'create_product',
  EDIT_PRODUCT: 'edit_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Financial permissions
  VIEW_PROFIT_LOSS: 'view_profit_loss',
  VIEW_EBITDA: 'view_ebitda',
  VIEW_VALUATION: 'view_valuation',
  
  // Sales permissions
  CREATE_SALE: 'create_sale',
  VIEW_SALES: 'view_sales',
  MANAGE_CUSTOMERS: 'manage_customers',
  
  // Business specific permissions
  VIEW_PARTY_LEDGER: 'view_party_ledger',
  CREATE_PARTY: 'create_party',
  VIEW_TRANSPORT: 'view_transport',
  CREATE_TRANSPORT: 'create_transport',
  VIEW_TERRITORIES: 'view_territories',
  CREATE_TERRITORY: 'create_territory',
  EDIT_TERRITORY: 'edit_territory',
  VIEW_TRANSACTIONS: 'view_transactions',
  CREATE_TRANSACTION: 'create_transaction',
  EDIT_TRANSACTION: 'edit_transaction',
  VIEW_BRAND_CONTROLS: 'view_brand_controls',
  REQUEST_CHANGES: 'request_changes',
  
  // Invoice permissions
  VIEW_INVOICES: 'view_invoices',
  CREATE_INVOICE: 'create_invoice',
  EDIT_INVOICE: 'edit_invoice',
  PRINT_INVOICE: 'print_invoice',
  SEND_INVOICE: 'send_invoice'
} as const;

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 100,
  co_founder: 90,
  manager: 70,
  accountant: 60,
  sales_executive: 50,
  staff: 10
};

// Check if user has higher or equal role level
export const hasRoleLevel = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Get user-friendly role name
export const getRoleName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    owner: 'Business Owner',
    co_founder: 'Co-Founder',
    manager: 'Manager',
    staff: 'Staff Member',
    accountant: 'Accountant',
    sales_executive: 'Sales Executive'
  };
  
  return roleNames[role] || 'Staff Member';
};

// Get business type display name
export const getBusinessTypeName = (type: BusinessType): string => {
  const typeNames: Record<BusinessType, string> = {
    retailer: 'Retail Store',
    ecommerce: 'E-commerce',
    manufacturer: 'Manufacturing',
    wholesaler: 'Wholesale Distribution',
    service: 'Service Business',
    distributor: 'Distribution',
    trader: 'Trading Business',
  };
  
  return typeNames[type] || 'Business';
};
