export type BusinessType =
  | 'manufacturer'
  | 'wholesaler'
  | 'retailer'
  | 'distributor'
  | 'ecommerce'
  | 'service'
  | 'trader';

export type UserRole =
  | 'owner'
  | 'co_founder'
  | 'manager'
  | 'staff'
  | 'accountant'
  | 'sales_executive'
  | 'inventory_manager'
  | 'delivery_staff'
  | 'hr'
  | 'production'
  | 'store_staff'
  | 'sales_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId: string;
  createdAt: string;
  lastActive: string;
  isActive: boolean;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword: string; // Hashed
  staffPassword: string; // Hashed
  createdAt: string;
  settings: BusinessSettings;
  branches: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
  isActive: boolean;
}

export interface BusinessSettings {
  offlineMode: boolean;
  aiAssistantEnabled: boolean;
  aiApiKey?: string;
  theme: 'light';
  currency: string;
  timeZone: string;
  language: 'en' | 'hi';
  gstNumber?: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  notificationsEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignupRequest {
  businessName: string;
  businessType: BusinessType;
  ownerName: string;
  email: string;
  phone: string;
  ownerPassword: string;
  staffPassword: string;
}

export interface SignupResponse {
  success: boolean;
  user: User;
  business: Business;
  tokens: AuthTokens;
}

export interface StaffSigninRequest {
  name: string;
  role: UserRole;
  businessName: string;
  staffPassword: string;
  email: string;
  phone: string;
}

export interface OwnerSigninRequest {
  email: string;
  ownerPassword: string;
}

export interface SigninResponse {
  success: boolean;
  user: User;
  business: Business;
  tokens: AuthTokens;
}

// Core permission structure based on the provided matrix
export interface DashboardPermissions {
  viewBusinessAnalytics: boolean;
  manageUsersAndRoles: boolean;
  addEditDeleteProducts: boolean;
  viewAddEditOrders: boolean;
  financialReports: boolean;
  assignTasksOrRoutes: boolean;
  hrAndStaffAttendance: boolean;
  manageAssetsLiabilities: boolean;
  aiAssistantAccess: boolean;
  // Additional common features
  businessProfileSetup: boolean;
  qrCodeScanner: boolean;
  assetTracker: boolean;
  autoBackupRestore: boolean;
  performanceDashboard: boolean;
  taskAndTodoManager: boolean;
  internalTeamChat: boolean;
  leaveAndAttendance: boolean;
  activityLogs: boolean;
  multiBranchSupport: boolean;
  settingsArea: boolean;
  dataImportExport: boolean;
  // Production-specific permissions for manufacturers
  rawMaterialInventory: boolean;
  recipeManagement: boolean;
  productionWorkflow: boolean;
  productionLogs: boolean;
}

export type RolePermissionMatrix = {
  [K in BusinessType]: {
    [R in UserRole]?: DashboardPermissions;
  };
};

// Comprehensive permission matrix based on provided table
export const ROLE_PERMISSIONS: RolePermissionMatrix = {
  retailer: {
    owner: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
    },
    'co-founder': {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
    },
    manager: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: false,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: false,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: false,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: false,
      dataImportExport: true,
    },
    'sales-staff': {
      viewBusinessAnalytics: false,
      manageUsersAndRoles: false,
      addEditDeleteProducts: false,
      viewAddEditOrders: true,
      financialReports: false,
      assignTasksOrRoutes: false,
      hrAndStaffAttendance: false,
      manageAssetsLiabilities: false,
      aiAssistantAccess: true,
      businessProfileSetup: false,
      qrCodeScanner: true,
      assetTracker: false,
      autoBackupRestore: false,
      performanceDashboard: false,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: false,
      activityLogs: false,
      multiBranchSupport: false,
      settingsArea: false,
      dataImportExport: false,
    },
    accountant: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: false,
      addEditDeleteProducts: false,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: false,
      hrAndStaffAttendance: false,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: false,
      qrCodeScanner: false,
      assetTracker: true,
      autoBackupRestore: false,
      performanceDashboard: false,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: false,
      activityLogs: true,
      multiBranchSupport: false,
      settingsArea: false,
      dataImportExport: true,
    },
    'inventory-manager': {
      viewBusinessAnalytics: false,
      manageUsersAndRoles: false,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: false,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: false,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: false,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: false,
      performanceDashboard: false,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: false,
      activityLogs: false,
      multiBranchSupport: false,
      settingsArea: false,
      dataImportExport: true,
    },
    'delivery-staff': {
      viewBusinessAnalytics: false,
      manageUsersAndRoles: false,
      addEditDeleteProducts: false,
      viewAddEditOrders: true,
      financialReports: false,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: false,
      manageAssetsLiabilities: false,
      aiAssistantAccess: true,
      businessProfileSetup: false,
      qrCodeScanner: true,
      assetTracker: false,
      autoBackupRestore: false,
      performanceDashboard: false,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: false,
      activityLogs: false,
      multiBranchSupport: false,
      settingsArea: false,
      dataImportExport: false,
    },
    hr: {
      viewBusinessAnalytics: false,
      manageUsersAndRoles: false,
      addEditDeleteProducts: false,
      viewAddEditOrders: false,
      financialReports: false,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: false,
      aiAssistantAccess: true,
      businessProfileSetup: false,
      qrCodeScanner: false,
      assetTracker: false,
      autoBackupRestore: false,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: false,
      settingsArea: false,
      dataImportExport: false,
    },
  },
  manufacturer: {
    owner: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
      rawMaterialInventory: true,
      recipeManagement: true,
      productionWorkflow: true,
      productionLogs: true,
    },
    'co-founder': {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
      rawMaterialInventory: true,
      recipeManagement: true,
      productionWorkflow: true,
      productionLogs: true,
    },
    manager: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: false,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: false,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: false,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: false,
      dataImportExport: true,
      rawMaterialInventory: true,
      recipeManagement: true,
      productionWorkflow: true,
      productionLogs: true,
    },
    // Copy similar patterns for other roles...
  },
  wholesaler: {
    // Similar permission structure...
    owner: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
    },
    // ... other roles follow same pattern
  },
  distributor: {
    owner: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
    },
  },
  ecommerce: {
    owner: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
    },
  },
  service: {
    owner: {
      viewBusinessAnalytics: true,
      manageUsersAndRoles: true,
      addEditDeleteProducts: true,
      viewAddEditOrders: true,
      financialReports: true,
      assignTasksOrRoutes: true,
      hrAndStaffAttendance: true,
      manageAssetsLiabilities: true,
      aiAssistantAccess: true,
      businessProfileSetup: true,
      qrCodeScanner: true,
      assetTracker: true,
      autoBackupRestore: true,
      performanceDashboard: true,
      taskAndTodoManager: true,
      internalTeamChat: true,
      leaveAndAttendance: true,
      activityLogs: true,
      multiBranchSupport: true,
      settingsArea: true,
      dataImportExport: true,
    },
  },
};

// Dashboard module configuration
export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  permission: keyof DashboardPermissions;
  priority: number;
  category: 'core' | 'analytics' | 'operations' | 'hr' | 'settings';
}

export interface DashboardConfig {
  businessType: BusinessType;
  userRole: UserRole;
  modules: DashboardModule[];
  layout: {
    sidebar: DashboardModule[];
    quickActions: DashboardModule[];
    widgets: DashboardModule[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Common feature interfaces
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface Asset {
  id: string;
  name: string;
  type: 'vehicle' | 'equipment' | 'property' | 'technology' | 'other';
  value: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  assignedTo?: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  status: 'active' | 'maintenance' | 'retired';
}

// Staff Management Interfaces
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId: string;
  branchId?: string;
  branchName?: string;
  joinDate: string;
  status: 'active' | 'suspended' | 'inactive';
  profileImage?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workingHours: number;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'holiday' | 'leave';
  notes?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: 'sick' | 'casual' | 'annual' | 'emergency' | 'maternity' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  documents?: string[];
}

export interface StaffPerformance {
  id: string;
  staffId: string;
  period: string; // YYYY-MM format
  tasksCompleted: number;
  tasksAssigned: number;
  salesAchieved: number;
  attendancePercentage: number;
  punctualityScore: number;
  productivityScore: number;
  overallRating: number;
  feedback?: string;
  goals: {
    target: number;
    achieved: number;
    type: 'sales' | 'tasks' | 'attendance' | 'custom';
  }[];
  lastUpdated: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'announcement';
  businessId: string;
  members: string[]; // staff IDs
  createdBy: string;
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
  description?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'document' | 'system';
  timestamp: string;
  isEdited: boolean;
  editedAt?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  replyTo?: string;
  mentions?: string[];
  readBy: {
    staffId: string;
    readAt: string;
  }[];
}

export interface TaskAssignment {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  assignedBy: string;
  businessId: string;
  branchId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  category: 'sales' | 'inventory' | 'customer_service' | 'admin' | 'delivery' | 'production' | 'other';
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  checkList?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  comments: {
    id: string;
    staffId: string;
    staffName: string;
    comment: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SalesCommission {
  id: string;
  staffId: string;
  staffName: string;
  saleId: string;
  saleDate: string;
  productService: string;
  saleAmount: number;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidDate?: string;
  paidBy?: string;
  notes?: string;
  period: string; // YYYY-MM format
  createdAt: string;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  breakStart?: string;
  breakEnd?: string;
  branchId?: string;
  notes?: string;
  isRecurring: boolean;
  recurringDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}

export interface BranchAccess {
  staffId: string;
  branchId: string;
  accessLevel: 'full' | 'read_only' | 'specific_modules';
  allowedModules?: string[];
  grantedBy: string;
  grantedAt: string;
}
