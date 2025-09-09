import { UserRole, BusinessType } from '@/shared/types';
import { notificationService } from '@/lib/notification-service';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId: string;
  businessName: string;
  businessType: BusinessType;
  permissions: string[];
  isOwner: boolean;
}

interface OwnerSignupData {
  businessName: string;
  businessType: BusinessType;
  ownerName: string;
  email: string;
  phone: string;
  ownerPassword: string;
  staffPassword: string;
}

interface StaffSigninData {
  businessName: string;
  staffPassword: string;
  name: string;
  phone: string;
  role: UserRole;
  email: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface Business {
  id: string;
  name: string;
  type: BusinessType;
  ownerId: string;
  ownerEmail: string;
  ownerPasswordHash: string;
  staffPasswordHash: string;
  createdAt: string;
  settings: {
    currency: string;
    timezone: string;
    language: string;
  };
}

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'insygth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'insygth_refresh_token';
  private readonly USER_KEY = 'insygth_user';
  private readonly BUSINESS_DATA_KEY = 'insygth_business_data';

  // In-memory business database (production would use real database)
  private businessDatabase = new Map<string, Business>();
  private userDatabase = new Map<string, AuthUser>();

  constructor() {
    // No mock data initialization - all data must be user-created
  }

  private hashPassword(password: string): string {
    // Simple hash for demo - production would use bcrypt
    return btoa(password + 'insygth_salt_2024');
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  private generateJWT(payload: any, expiresIn: number = 24 * 60 * 60 * 1000): string {
    // Simple JWT simulation - production would use proper JWT library
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({
      ...payload,
      iat: Date.now(),
      exp: Date.now() + expiresIn
    }));
    const signature = btoa(`${header}.${body}.insygth_secret_2024`);
    
    return `${header}.${body}.${signature}`;
  }

  private verifyJWT(token: string): any {
    try {
      const [header, payload, signature] = token.split('.');
      const decodedPayload = JSON.parse(atob(payload));
      
      // Check expiration
      if (decodedPayload.exp < Date.now()) {
        throw new Error('Token expired');
      }
      
      // Verify signature (simplified)
      const expectedSignature = btoa(`${header}.${payload}.insygth_secret_2024`);
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }
      
      return decodedPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private generateBusinessId(): string {
    return `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  findBusinessByName(businessName: string): Business | null {
    for (const business of this.businessDatabase.values()) {
      if (business.name.toLowerCase() === businessName.toLowerCase()) {
        return business;
      }
    }
    return null;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private validateStrongPassword(password: string): string | null {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  async ownerSignup(signupData: OwnerSignupData): Promise<{ success: boolean; user?: AuthUser; tokens?: AuthTokens; message: string }> {
    try {
      // Validation
      if (!signupData.businessName.trim()) {
        return { success: false, message: 'Business name is required' };
      }

      if (!signupData.ownerName.trim()) {
        return { success: false, message: 'Owner name is required' };
      }

      if (!this.validateEmail(signupData.email)) {
        return { success: false, message: 'Invalid email format' };
      }

      if (!this.validatePhone(signupData.phone)) {
        return { success: false, message: 'Invalid phone number format' };
      }

      // Restrict business type to allowed set only
      const allowedBusinessTypes: BusinessType[] = ['manufacturer', 'wholesaler', 'retailer'];
      if (!allowedBusinessTypes.includes(signupData.businessType)) {
        return { success: false, message: 'Selected business type is not supported' };
      }

      // Validate strong passwords
      const ownerPasswordError = this.validateStrongPassword(signupData.ownerPassword);
      if (ownerPasswordError) {
        return { success: false, message: `Owner password: ${ownerPasswordError}` };
      }

      const staffPasswordError = this.validateStrongPassword(signupData.staffPassword);
      if (staffPasswordError) {
        return { success: false, message: `Staff password: ${staffPasswordError}` };
      }

      if (signupData.ownerPassword === signupData.staffPassword) {
        return { success: false, message: 'Owner and staff passwords must be different' };
      }

      // Check for duplicate business name
      if (this.findBusinessByName(signupData.businessName)) {
        return { success: false, message: 'A business with this name already exists' };
      }

      // Check for duplicate email
      for (const user of this.userDatabase.values()) {
        if (user.email.toLowerCase() === signupData.email.toLowerCase()) {
          return { success: false, message: 'An account with this email already exists' };
        }
      }

      // Create business
      const businessId = this.generateBusinessId();
      const userId = this.generateUserId();

      const business: Business = {
        id: businessId,
        name: signupData.businessName,
        type: signupData.businessType,
        ownerId: userId,
        ownerEmail: signupData.email,
        ownerPasswordHash: this.hashPassword(signupData.ownerPassword),
        staffPasswordHash: this.hashPassword(signupData.staffPassword),
        createdAt: new Date().toISOString(),
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          language: 'en'
        }
      };

      // Create owner user
      const user: AuthUser = {
        id: userId,
        name: signupData.ownerName,
        email: signupData.email,
        phone: signupData.phone,
        role: 'owner',
        businessId: businessId,
        businessName: signupData.businessName,
        businessType: signupData.businessType,
        permissions: this.getPermissionsForRole('owner'),
        isOwner: true
      };

      // Store in databases
      this.businessDatabase.set(businessId, business);
      this.userDatabase.set(userId, user);

      // Generate tokens
      const accessToken = this.generateJWT(user, 24 * 60 * 60 * 1000); // 24 hours
      const refreshToken = this.generateJWT({ userId: user.id }, 7 * 24 * 60 * 60 * 1000); // 7 days

      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };

      // Store in localStorage for auto-login
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.BUSINESS_DATA_KEY, JSON.stringify(business));

      // Show success notification
      notificationService.success(
        'Business Created Successfully!',
        "You're all set! Welcome to your new business dashboard."
      );

      return { success: true, user, tokens, message: 'Business created and owner logged in successfully' };
    } catch (error) {
      return { success: false, message: 'Account creation failed. Please try again.' };
    }
  }

  async staffSignin(signinData: StaffSigninData): Promise<{ success: boolean; user?: AuthUser; tokens?: AuthTokens; message: string }> {
    try {
      // Enhanced validation
      if (!signinData.businessName.trim()) {
        return { success: false, message: 'Business name is required' };
      }

      if (signinData.businessName.trim().length < 2 || signinData.businessName.trim().length > 100) {
        return { success: false, message: 'Business name must be between 2-100 characters' };
      }

      if (!signinData.name.trim()) {
        return { success: false, message: 'Your name is required' };
      }

      if (signinData.name.trim().length < 2 || signinData.name.trim().length > 50) {
        return { success: false, message: 'Name must be between 2-50 characters' };
      }

      if (!this.validateEmail(signinData.email)) {
        return { success: false, message: 'Invalid email format' };
      }

      if (!this.validatePhone(signinData.phone)) {
        return { success: false, message: 'Invalid phone number format' };
      }

      if (!signinData.staffPassword) {
        return { success: false, message: 'Staff password is required' };
      }

      if (signinData.staffPassword.length < 8 || signinData.staffPassword.length > 50) {
        return { success: false, message: 'Staff password must be between 8-50 characters' };
      }

      // CRITICAL SECURITY: Prevent owner/co-founder bypass attempts
      const restrictedRoles: UserRole[] = ['owner', 'co_founder'];
      if (restrictedRoles.includes(signinData.role)) {
        return { success: false, message: 'Owner and Co-Founder accounts cannot be created through staff sign-in. Use business owner sign-up instead.' };
      }

      // Find business by name
      const business = this.findBusinessByName(signinData.businessName);
      if (!business) {
        return { success: false, message: 'Business not found. Please check the business name or contact your business owner.' };
      }

      // Verify staff password
      if (!this.verifyPassword(signinData.staffPassword, business.staffPasswordHash)) {
        return { success: false, message: 'Invalid staff password. Please contact your business owner for the correct password.' };
      }

      // Check for duplicate email within business
      for (const user of this.userDatabase.values()) {
        if (user.businessId === business.id && user.email.toLowerCase() === signinData.email.toLowerCase()) {
          return { success: false, message: 'An account with this email already exists in this business. Please use a different email or contact your administrator.' };
        }
      }

      // Check for duplicate phone within business
      for (const user of this.userDatabase.values()) {
        if (user.businessId === business.id && user.phone === signinData.phone) {
          return { success: false, message: 'An account with this phone number already exists in this business. Please use a different phone number.' };
        }
      }

      // Validate role (exclude owner and co_founder)
      const allowedRoles: UserRole[] = ['manager', 'staff', 'accountant', 'sales_executive', 'inventory_manager', 'delivery_staff', 'hr', 'production', 'store_staff', 'sales_staff'];
      if (!allowedRoles.includes(signinData.role)) {
        return { success: false, message: 'Invalid role selection. Please choose a valid staff role.' };
      }

      // Additional security check: Ensure the business owner email doesn't match
      if (signinData.email.toLowerCase() === business.ownerEmail.toLowerCase()) {
        return { success: false, message: 'This email is reserved for the business owner. Staff members must use a different email address.' };
      }

      // Sanitize and validate input data
      const sanitizedData = {
        name: signinData.name.trim(),
        email: signinData.email.trim().toLowerCase(),
        phone: signinData.phone.trim(),
        role: signinData.role
      };

      // Create staff user with additional security measures
      const userId = this.generateUserId();
      const user: AuthUser = {
        id: userId,
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        role: sanitizedData.role,
        businessId: business.id,
        businessName: business.name,
        businessType: business.type,
        permissions: this.getPermissionsForRole(sanitizedData.role),
        isOwner: false // CRITICAL: Always false for staff sign-in
      };

      // Double-check that isOwner is false
      if (user.isOwner) {
        return { success: false, message: 'Security error: Invalid role assignment detected.' };
      }

      // Store user
      this.userDatabase.set(userId, user);

      // Generate tokens with user info
      const tokenPayload = {
        userId: user.id,
        businessId: user.businessId,
        role: user.role,
        isOwner: false // Explicit in token
      };

      const accessToken = this.generateJWT(tokenPayload, 24 * 60 * 60 * 1000); // 24 hours
      const refreshToken = this.generateJWT({ userId: user.id, type: 'refresh' }, 7 * 24 * 60 * 60 * 1000); // 7 days

      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };

      // Store in localStorage
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.BUSINESS_DATA_KEY, JSON.stringify(business));

      // Log successful staff sign-in for audit
      console.log(`Staff sign-in successful: ${user.name} (${user.role}) joined ${business.name}`);

      // Show success notification
      notificationService.success(
        `Welcome, ${this.getRoleName(sanitizedData.role)}!`,
        `You're now connected to ${business.name}. Access is limited to your role permissions.`
      );

      return { success: true, user, tokens, message: 'Staff signed in successfully' };
    } catch (error) {
      console.error('Staff sign-in error:', error);
      return { success: false, message: 'Sign in failed. Please check your information and try again.' };
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.BUSINESS_DATA_KEY);
    
    notificationService.info('Signed Out', 'You have been successfully signed out.');
  }

  getCurrentUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      
      if (!userStr || !token) return null;
      
      // Verify token is still valid
      this.verifyJWT(token);
      
      return JSON.parse(userStr);
    } catch (error) {
      // Token invalid or expired, clear storage
      this.logout();
      return null;
    }
  }

  getBusinessData(): Business | null {
    try {
      const businessStr = localStorage.getItem(this.BUSINESS_DATA_KEY);
      return businessStr ? JSON.parse(businessStr) : null;
    } catch (error) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.permissions.includes(permission) || user.isOwner;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isOwner(): boolean {
    const user = this.getCurrentUser();
    return user?.isOwner || false;
  }

  getPermissionsForRole(role: UserRole): string[] {
    const basePermissions = [
      'view_dashboard',
      'view_basic_analytics',
      'view_inventory',
      'view_orders'
    ];

    const rolePermissions: Record<UserRole, string[]> = {
      owner: [
        ...basePermissions,
        // All permissions for owner
        'view_all_modules',
        'create_all',
        'edit_all',
        'delete_all',
        'view_advanced_analytics',
        'view_financial_data',
        'manage_users',
        'manage_settings',
        'export_reports',
        'view_ai_assistant',
        'manage_business_settings',
        'addEditDeleteProducts',
        'viewAddEditOrders',
        'financialReports',
        'assignTasksOrRoutes',
        'hrAndStaffAttendance',
        'manageAssetsLiabilities',
        'aiAssistantAccess',
        'businessProfileSetup',
        'qrCodeScanner',
        'assetTracker',
        'autoBackupRestore',
        'performanceDashboard',
        'taskAndTodoManager',
        'internalTeamChat',
        'leaveAndAttendance',
        'activityLogs',
        'multiBranchSupport',
        'settingsArea',
        'dataImportExport',
        'manage_team',
        'create_basic',
        'edit_assigned',
        'view_own_data'
      ],
      co_founder: [
        ...basePermissions,
        'view_most_modules',
        'create_most',
        'edit_most',
        'view_advanced_analytics',
        'view_financial_data',
        'manage_users',
        'export_reports',
        'view_ai_assistant',
        'addEditDeleteProducts',
        'viewAddEditOrders',
        'financialReports',
        'assignTasksOrRoutes',
        'hrAndStaffAttendance',
        'manageAssetsLiabilities',
        'aiAssistantAccess',
        'businessProfileSetup',
        'qrCodeScanner',
        'assetTracker',
        'performanceDashboard',
        'taskAndTodoManager',
        'internalTeamChat',
        'leaveAndAttendance',
        'activityLogs',
        'multiBranchSupport',
        'settingsArea',
        'dataImportExport',
        'manage_team'
      ],
      manager: [
        ...basePermissions,
        'view_department_modules',
        'create_department',
        'edit_department',
        'view_team_analytics',
        'manage_team',
        'export_team_reports',
        'view_ai_assistant',
        'addEditDeleteProducts',
        'viewAddEditOrders',
        'assignTasksOrRoutes',
        'hrAndStaffAttendance',
        'aiAssistantAccess',
        'businessProfileSetup',
        'qrCodeScanner',
        'performanceDashboard',
        'taskAndTodoManager',
        'internalTeamChat',
        'leaveAndAttendance',
        'activityLogs',
        'manage_settings'
      ],
      staff: [
        ...basePermissions,
        'view_assigned_modules',
        'create_basic',
        'edit_assigned',
        'view_own_data',
        'viewAddEditOrders',
        'assignTasksOrRoutes',
        'qrCodeScanner',
        'taskAndTodoManager',
        'internalTeamChat'
      ],
      accountant: [
        ...basePermissions,
        'view_financial_modules',
        'create_financial',
        'edit_financial',
        'view_financial_analytics',
        'export_financial_reports',
        'view_ai_assistant',
        'view_financial_data',
        'financialReports',
        'aiAssistantAccess',
        'businessProfileSetup',
        'qrCodeScanner',
        'taskAndTodoManager',
        'internalTeamChat',
        'dataImportExport'
      ],
      sales_executive: [
        ...basePermissions,
        'view_sales_modules',
        'create_sales',
        'edit_sales',
        'view_sales_analytics',
        'manage_customers',
        'export_sales_reports',
        'view_ai_assistant',
        'viewAddEditOrders',
        'assignTasksOrRoutes',
        'aiAssistantAccess',
        'businessProfileSetup',
        'qrCodeScanner',
        'taskAndTodoManager',
        'internalTeamChat'
      ],
      inventory_manager: [
        ...basePermissions,
        'view_inventory_modules',
        'addEditDeleteProducts',
        'view_inventory_analytics',
        'manage_stock',
        'export_inventory_reports',
        'qrCodeScanner',
        'taskAndTodoManager',
        'internalTeamChat',
        'assignTasksOrRoutes'
      ],
      delivery_staff: [
        ...basePermissions,
        'view_delivery_modules',
        'viewAddEditOrders',
        'update_delivery_status',
        'qrCodeScanner',
        'taskAndTodoManager',
        'internalTeamChat'
      ],
      hr: [
        ...basePermissions,
        'view_hr_modules',
        'hrAndStaffAttendance',
        'manage_staff',
        'view_staff_analytics',
        'taskAndTodoManager',
        'internalTeamChat',
        'performanceDashboard',
        'leaveAndAttendance'
      ],
      production: [
        ...basePermissions,
        'view_production_modules',
        'manage_production',
        'view_production_analytics',
        'taskAndTodoManager',
        'internalTeamChat',
        'rawMaterialInventory',
        'recipeManagement',
        'productionWorkflow',
        'productionLogs'
      ],
      store_staff: [
        ...basePermissions,
        'view_store_modules',
        'viewAddEditOrders',
        'basic_inventory_access',
        'qrCodeScanner',
        'taskAndTodoManager',
        'internalTeamChat'
      ],
      sales_staff: [
        ...basePermissions,
        'view_sales_modules',
        'viewAddEditOrders',
        'manage_customers',
        'view_commission',
        'qrCodeScanner',
        'taskAndTodoManager',
        'internalTeamChat'
      ]
    };

    return rolePermissions[role] || basePermissions;
  }

  getAvailableRoles(): { value: UserRole; label: string }[] {
    return [
      { value: 'manager', label: 'Manager' },
      { value: 'staff', label: 'Staff Member' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'sales_executive', label: 'Sales Executive' },
      { value: 'inventory_manager', label: 'Inventory Manager' },
      { value: 'delivery_staff', label: 'Delivery Staff' },
      { value: 'hr', label: 'HR Staff' },
      { value: 'production', label: 'Production Staff' },
      { value: 'store_staff', label: 'Store Staff' },
      { value: 'sales_staff', label: 'Sales Staff' }
    ];
  }

  private getRoleName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      owner: 'Business Owner',
      co_founder: 'Co-Founder',
      manager: 'Manager',
      staff: 'Staff Member',
      accountant: 'Accountant',
      sales_executive: 'Sales Executive',
      inventory_manager: 'Inventory Manager',
      delivery_staff: 'Delivery Staff',
      hr: 'HR Staff',
      production: 'Production Staff',
      store_staff: 'Store Staff',
      sales_staff: 'Sales Staff'
    };

    return roleNames[role] || 'Staff Member';
  }

  // Get business-type specific dashboard route
  getBusinessDashboardRoute(businessType: BusinessType, role: UserRole): string {
    // For all roles, they go to the main dashboard 
    // The dashboard will show appropriate modules based on permissions
    return '/dashboard';
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      // Verify refresh token
      const payload = this.verifyJWT(refreshToken);
      
      // Get current user
      const user = this.getCurrentUser();
      if (!user) return false;

      // Generate new access token
      const newAccessToken = this.generateJWT(user, 24 * 60 * 60 * 1000);
      localStorage.setItem(this.ACCESS_TOKEN_KEY, newAccessToken);

      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }
  verifyBusinessStaffPassword(businessName: string, password: string): boolean {
    const biz = this.findBusinessByName(businessName);
    if (!biz) return false;
    return this.verifyPassword(password, biz.staffPasswordHash);
  }
}

export const authService = new AuthService();
export type { AuthUser, OwnerSignupData, StaffSigninData, AuthTokens, Business };
