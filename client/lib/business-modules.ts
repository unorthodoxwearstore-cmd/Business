import { BusinessType, UserRole } from '@shared/types';

export interface BusinessModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  businessTypes: BusinessType[];
  allowedRoles: UserRole[];
  category: 'sales' | 'inventory' | 'customer' | 'analytics' | 'operations' | 'finance' | 'communication' | 'hr' | 'settings';
  priority: number;
  isSpecialized: boolean; // true for business-specific modules
  isCommon?: boolean; // true for common features across all business types
}

// COMMON FEATURES - Available to all business types
export const COMMON_MODULES: BusinessModule[] = [
  // Business Setup & Profile
  {
    id: 'business-profile',
    title: 'Business Profile',
    description: 'Manage business information, GST, currency, and settings',
    icon: 'Building2',
    path: '/dashboard/settings',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'settings',
    priority: 1,
    isSpecialized: false,
    isCommon: true
  },
  
  // Dashboard
  {
    id: 'main-dashboard',
    title: 'Dashboard',
    description: 'Overview of business KPIs and performance metrics',
    icon: 'BarChart3',
    path: '/dashboard',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff', 'accountant', 'sales_executive'],
    category: 'analytics',
    priority: 1,
    isSpecialized: false,
    isCommon: true
  },

  // Sales & Invoice System
  {
    id: 'add-sale-invoice',
    title: 'Add Sale & Invoice',
    description: 'Create sales and generate professional invoices',
    icon: 'FileText',
    path: '/dashboard/add-sale',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant', 'sales_executive'],
    category: 'sales',
    priority: 2,
    isSpecialized: false,
    isCommon: true
  },

  {
    id: 'sales-documents',
    title: 'Sales Documents',
    description: 'Manage invoices, receipts, and sales documents',
    icon: 'FolderOpen',
    path: '/dashboard/sales-documents',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant', 'sales_executive'],
    category: 'sales',
    priority: 3,
    isSpecialized: false,
    isCommon: true
  },

  // Inventory Basics
  {
    id: 'basic-inventory',
    title: 'Inventory Management',
    description: 'View, add, edit products with low-stock alerts',
    icon: 'Package',
    path: '/dashboard/inventory',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'inventory',
    priority: 2,
    isSpecialized: false,
    isCommon: true
  },

  // Analytics & Reports
  {
    id: 'analytics-reports',
    title: 'Analytics & Reports',
    description: 'Sales, revenue, expenses, profitability, and valuation metrics',
    icon: 'TrendingUp',
    path: '/dashboard/analytics',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'analytics',
    priority: 3,
    isSpecialized: false,
    isCommon: true
  },

  // AI Business Assistant
  {
    id: 'ai-assistant',
    title: 'AI Business Assistant',
    description: 'AI-powered suggestions, Q&A, trends, and growth tips',
    icon: 'Bot',
    path: '/dashboard/ai-assistant',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant', 'sales_executive'],
    category: 'operations',
    priority: 4,
    isSpecialized: false,
    isCommon: true
  },

  // Task & To-Do Manager
  {
    id: 'task-manager',
    title: 'Task & To-Do Manager',
    description: 'Assign, track, and complete tasks for staff',
    icon: 'CheckSquare',
    path: '/dashboard/tasks',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'operations',
    priority: 5,
    isSpecialized: false,
    isCommon: true
  },

  // Internal Communication
  {
    id: 'team-chat',
    title: 'Team Chat',
    description: 'In-app team communication and notifications',
    icon: 'MessageSquare',
    path: '/dashboard/team-chat',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff', 'accountant', 'sales_executive'],
    category: 'communication',
    priority: 6,
    isSpecialized: false,
    isCommon: true
  },

  // Leave & Attendance
  {
    id: 'attendance-tracker',
    title: 'Leave & Attendance',
    description: 'Staff availability logs and leave management',
    icon: 'Calendar',
    path: '/dashboard/attendance',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'hr',
    priority: 7,
    isSpecialized: false,
    isCommon: true
  },

  // Activity Logs
  {
    id: 'activity-logs',
    title: 'Activity Logs',
    description: 'Audit trail of actions taken by all roles',
    icon: 'FileText',
    path: '/dashboard/activity-logs',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'operations',
    priority: 8,
    isSpecialized: false,
    isCommon: true
  },

  // Multi-Branch Support
  {
    id: 'multi-branch',
    title: 'Multi-Branch Management',
    description: 'Centralized control over multiple branches/locations',
    icon: 'MapPin',
    path: '/dashboard/branches',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder'],
    category: 'operations',
    priority: 9,
    isSpecialized: false,
    isCommon: true
  },

  // Backup & Restore
  {
    id: 'backup-restore',
    title: 'Backup & Restore',
    description: 'Manual and scheduled backups, import/export data',
    icon: 'Download',
    path: '/dashboard/backup',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder'],
    category: 'settings',
    priority: 10,
    isSpecialized: false,
    isCommon: true
  },

  // Performance Dashboard
  {
    id: 'performance-dashboard',
    title: 'Performance Dashboard',
    description: 'Staff, sales, and task performance tracking',
    icon: 'Users',
    path: '/dashboard/performance',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'hr',
    priority: 11,
    isSpecialized: false,
    isCommon: true
  },

  // QR Code Scanner
  {
    id: 'qr-scanner',
    title: 'QR Code Scanner',
    description: 'Scan QR codes for products, payments, or quick actions',
    icon: 'QrCode',
    path: '/dashboard/qr-scanner',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff', 'sales_executive'],
    category: 'operations',
    priority: 12,
    isSpecialized: false,
    isCommon: true
  },

  // Settings
  {
    id: 'settings',
    title: 'Settings',
    description: 'GST, currency, language, permissions, and branch settings',
    icon: 'Settings',
    path: '/dashboard/settings',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'settings',
    priority: 13,
    isSpecialized: false,
    isCommon: true
  },

  // Staff Management
  {
    id: 'staff-management',
    title: 'Staff Management',
    description: 'Add, edit, and manage staff members with roles and permissions',
    icon: 'Users',
    path: '/dashboard/staff',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'hr',
    priority: 14,
    isSpecialized: false,
    isCommon: true
  },

  // Staff Attendance
  {
    id: 'staff-attendance',
    title: 'Staff Attendance',
    description: 'Track daily attendance, check-in/out, and working hours',
    icon: 'Clock',
    path: '/dashboard/staff/attendance',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'hr', 'staff', 'sales_staff', 'inventory_manager', 'delivery_staff', 'production', 'store_staff'],
    category: 'hr',
    priority: 15,
    isSpecialized: false,
    isCommon: true
  },

  // Staff Performance
  {
    id: 'staff-performance',
    title: 'Staff Performance',
    description: 'Track and analyze staff performance, productivity, and KPIs',
    icon: 'TrendingUp',
    path: '/dashboard/staff/performance',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'hr'],
    category: 'hr',
    priority: 16,
    isSpecialized: false,
    isCommon: true
  },

  // Team Chat
  {
    id: 'internal-chat',
    title: 'Internal Chat',
    description: 'Team communication with 1-on-1, group chats, and announcements',
    icon: 'MessageCircle',
    path: '/dashboard/chat',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff', 'accountant', 'sales_executive', 'hr', 'sales_staff', 'inventory_manager', 'delivery_staff', 'production', 'store_staff'],
    category: 'communication',
    priority: 17,
    isSpecialized: false,
    isCommon: true
  },

  // Task Assignment
  {
    id: 'task-assignment',
    title: 'Task Assignment',
    description: 'Assign, track, and manage tasks for staff and teams',
    icon: 'CheckSquare',
    path: '/dashboard/tasks/assignment',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'hr'],
    category: 'operations',
    priority: 18,
    isSpecialized: false,
    isCommon: true
  },

  // Commission Tracking (for applicable business types)
  {
    id: 'sales-commission',
    title: 'Sales Commission',
    description: 'Track and manage sales staff commission earnings and payments',
    icon: 'DollarSign',
    path: '/dashboard/staff/commission',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant', 'sales_staff'],
    category: 'finance',
    priority: 19,
    isSpecialized: false,
    isCommon: true
  },

  // Staff Leaderboard
  {
    id: 'staff-leaderboard',
    title: 'Staff Leaderboard',
    description: 'Performance rankings and staff achievements',
    icon: 'Trophy',
    path: '/dashboard/staff/leaderboard',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'hr'],
    category: 'hr',
    priority: 20,
    isSpecialized: false,
    isCommon: true
  },

  // Support Tickets
  {
    id: 'support-tickets',
    title: 'Support Tickets',
    description: 'Submit and track support requests with management',
    icon: 'HelpCircle',
    path: '/dashboard/staff/support',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff', 'accountant', 'sales_executive', 'hr', 'sales_staff', 'inventory_manager', 'delivery_staff', 'production', 'store_staff'],
    category: 'communication',
    priority: 21,
    isSpecialized: false,
    isCommon: true
  },

  // WhatsApp Integration
  {
    id: 'whatsapp-integration',
    title: 'WhatsApp Integration',
    description: 'Send invoices, catalogs, and quotations via WhatsApp',
    icon: 'MessageCircle',
    path: '/dashboard/whatsapp',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive', 'sales_staff'],
    category: 'communication',
    priority: 22,
    isSpecialized: false,
    isCommon: true
  },

  // Payment Reminders
  {
    id: 'payment-reminders',
    title: 'Payment Reminders',
    description: 'Automated payment reminders for due and overdue invoices',
    icon: 'Bell',
    path: '/dashboard/payment-reminders',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 23,
    isSpecialized: false,
    isCommon: true
  },

  // Inventory Batch Tracking
  {
    id: 'inventory-batches',
    title: 'Batch & Expiry Tracking',
    description: 'Track inventory batches, expiry dates, and stock movements',
    icon: 'Package',
    path: '/dashboard/inventory-batches',
    businessTypes: ['retailer', 'manufacturer', 'wholesaler', 'distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'inventory_manager', 'staff'],
    category: 'inventory',
    priority: 24,
    isSpecialized: false,
    isCommon: true
  },

  // Customer Relationship Management (CRM)
  {
    id: 'customer-relationship-management',
    title: 'Customer Relationship Management',
    description: 'Manage customer relationships, purchase history, follow-ups, and loyalty',
    icon: 'Users',
    path: '/dashboard/crm',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive', 'accountant'],
    category: 'customer',
    priority: 25,
    isSpecialized: false,
    isCommon: true
  },

  // Document Vault
  {
    id: 'document-vault',
    title: 'Document Vault',
    description: 'Centralized storage for invoices, contracts, and business documents with role-based access',
    icon: 'FileText',
    path: '/dashboard/document-vault',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant', 'sales_executive'],
    category: 'operations',
    priority: 26,
    isSpecialized: false,
    isCommon: true
  },

  // Owner Analytics (Owner-Only)
  {
    id: 'owner-analytics',
    title: 'Owner Analytics Dashboard',
    description: 'Advanced business analytics, PAT calculations, valuation calculator, and performance insights',
    icon: 'Crown',
    path: '/dashboard/owner-analytics',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner'],
    category: 'analytics',
    priority: 27,
    isSpecialized: false,
    isCommon: true
  },

  // Vendor Management (For businesses with suppliers)
  {
    id: 'vendor-management',
    title: 'Vendor Management',
    description: 'Manage suppliers, track vendor performance, orders, and relationship management',
    icon: 'Building',
    path: '/dashboard/vendor-management',
    businessTypes: ['manufacturer', 'wholesaler', 'distributor', 'retailer', 'trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'inventory_manager'],
    category: 'operations',
    priority: 28,
    isSpecialized: false,
    isCommon: true
  },

  // Branch Management (Owner-Only)
  {
    id: 'branch-management',
    title: 'Branch Management',
    description: 'Manage multiple business locations, assign staff, and configure branch settings',
    icon: 'Building',
    path: '/dashboard/branch-management',
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'],
    allowedRoles: ['owner'],
    category: 'settings',
    priority: 29,
    isSpecialized: false,
    isCommon: true
  }
];

// BUSINESS-SPECIFIC MODULES
export const BUSINESS_MODULES: BusinessModule[] = [
  // =================== RETAILER SPECIFIC ===================
  {
    id: 'customer-database',
    title: 'Customer Database',
    description: 'Manage customer information, history, and purchases',
    icon: 'Users',
    path: '/dashboard/retailer/customers',
    businessTypes: ['retailer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'customer',
    priority: 2,
    isSpecialized: true
  },
  {
    id: 'offers-promotions',
    title: 'Offers & Promotions',
    description: 'Create time-limited discounts and combo offers',
    icon: 'Tag',
    path: '/dashboard/retailer/offers',
    businessTypes: ['retailer'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'sales',
    priority: 3,
    isSpecialized: true
  },
  {
    id: 'expense-tracking',
    title: 'Expense Tracking',
    description: 'Track daily and monthly business expenses',
    icon: 'Receipt',
    path: '/dashboard/retailer/expenses',
    businessTypes: ['retailer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 4,
    isSpecialized: true
  },
  {
    id: 'daily-sales-analytics',
    title: 'Daily/Monthly/Yearly Sales Analytics',
    description: 'Visual reports for sales trends and patterns',
    icon: 'TrendingUp',
    path: '/dashboard/retailer/sales-analytics',
    businessTypes: ['retailer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'analytics',
    priority: 5,
    isSpecialized: true
  },
  {
    id: 'gst-reports',
    title: 'GST Reports',
    description: 'Generate and download GST filing data',
    icon: 'FileText',
    path: '/dashboard/retailer/gst-reports',
    businessTypes: ['retailer'],
    allowedRoles: ['owner', 'co_founder', 'accountant'],
    category: 'finance',
    priority: 6,
    isSpecialized: true
  },
  {
    id: 'catalog-sharing',
    title: 'Catalog Sharing',
    description: 'Share product catalogs via PDF/WhatsApp',
    icon: 'Share',
    path: '/dashboard/retailer/catalog-sharing',
    businessTypes: ['retailer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'sales',
    priority: 7,
    isSpecialized: true
  },
  {
    id: 'multi-branch-inventory-sync',
    title: 'Multi-Branch Inventory Sync',
    description: 'Synchronize inventory across multiple retail locations',
    icon: 'RefreshCw',
    path: '/dashboard/retailer/inventory-sync',
    businessTypes: ['retailer'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'inventory',
    priority: 8,
    isSpecialized: true
  },

  // =================== B2C/ECOMMERCE SPECIFIC ===================
  {
    id: 'product-catalog-mgmt',
    title: 'Product Catalog Management',
    description: 'Comprehensive product catalog with variants and categories',
    icon: 'Grid3x3',
    path: '/dashboard/ecommerce/product-catalog',
    businessTypes: ['ecommerce'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'inventory',
    priority: 1,
    isSpecialized: true
  },
  {
    id: 'in-app-ordering',
    title: 'In-App Ordering System',
    description: 'Customer ordering system with cart and checkout',
    icon: 'ShoppingCart',
    path: '/dashboard/ecommerce/orders',
    businessTypes: ['ecommerce'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'sales',
    priority: 2,
    isSpecialized: true
  },
  {
    id: 'order-tracking-fulfillment',
    title: 'Order Tracking & Fulfillment Analytics',
    description: 'Track orders from placement to delivery with analytics',
    icon: 'Package',
    path: '/dashboard/ecommerce/order-tracking',
    businessTypes: ['ecommerce'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'operations',
    priority: 3,
    isSpecialized: true
  },
  {
    id: 'customer-reviews',
    title: 'Customer Feedback/Reviews',
    description: 'Manage customer reviews and feedback',
    icon: 'Star',
    path: '/dashboard/ecommerce/reviews',
    businessTypes: ['ecommerce'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'customer',
    priority: 4,
    isSpecialized: true
  },
  {
    id: 'payment-tracking',
    title: 'Payment Tracking',
    description: 'UPI, COD, Card payment tracking and reconciliation',
    icon: 'CreditCard',
    path: '/dashboard/ecommerce/payments',
    businessTypes: ['ecommerce'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 5,
    isSpecialized: true
  },
  {
    id: 'auto-invoice-generator',
    title: 'Auto-Invoice Generator',
    description: 'Automated invoice generation for orders',
    icon: 'FileText',
    path: '/dashboard/ecommerce/invoices',
    businessTypes: ['ecommerce'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 6,
    isSpecialized: true
  },

  // =================== SERVICE PROVIDER SPECIFIC ===================
  {
    id: 'service-listing',
    title: 'Service Listing with Prices',
    description: 'Manage service offerings and pricing',
    icon: 'List',
    path: '/dashboard/service/services',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'inventory',
    priority: 1,
    isSpecialized: true
  },
  {
    id: 'booking-scheduling',
    title: 'Booking & Scheduling',
    description: 'Customer booking system with appointment management',
    icon: 'Calendar',
    path: '/dashboard/service/bookings',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'operations',
    priority: 2,
    isSpecialized: true
  },
  {
    id: 'time-slot-management',
    title: 'Time Slot Management',
    description: 'Configure and manage available time slots',
    icon: 'Clock',
    path: '/dashboard/service/time-slots',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'operations',
    priority: 3,
    isSpecialized: true
  },
  {
    id: 'post-service-reviews',
    title: 'Post-Service Reviews',
    description: 'Collect and manage customer service reviews',
    icon: 'Star',
    path: '/dashboard/service/reviews',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'customer',
    priority: 4,
    isSpecialized: true
  },
  {
    id: 'online-payment-tracker',
    title: 'Online Payment Tracker',
    description: 'Track digital payments for services',
    icon: 'CreditCard',
    path: '/dashboard/service/payments',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 5,
    isSpecialized: true
  },
  {
    id: 'income-expense-overview',
    title: 'Income & Expense Overview',
    description: 'Financial overview specific to service business',
    icon: 'DollarSign',
    path: '/dashboard/service/financials',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 6,
    isSpecialized: true
  },
  {
    id: 'staff-service-assignment',
    title: 'Staff-to-Service Assignment',
    description: 'Assign staff members to specific services',
    icon: 'UserCheck',
    path: '/dashboard/service/staff-assignment',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'hr',
    priority: 7,
    isSpecialized: true
  },
  {
    id: 'quotation-generator',
    title: 'Quotation Generator',
    description: 'Generate professional service quotations',
    icon: 'FileText',
    path: '/dashboard/service/quotations',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'sales',
    priority: 8,
    isSpecialized: true
  },
  {
    id: 'service-usage-analytics',
    title: 'Service Usage Analytics',
    description: 'Analytics on service performance and usage',
    icon: 'BarChart3',
    path: '/dashboard/service/analytics',
    businessTypes: ['service'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'analytics',
    priority: 9,
    isSpecialized: true
  },

  // =================== MANUFACTURER SPECIFIC ===================
  {
    id: 'raw-material-inventory',
    title: 'Raw Material Stock Tracking',
    description: 'Track raw materials with suppliers and costs',
    icon: 'Package2',
    path: '/dashboard/manufacturer/raw-material-inventory',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff', 'inventory_manager', 'production'],
    category: 'inventory',
    priority: 1,
    isSpecialized: true
  },
  {
    id: 'recipe',
    title: 'Recipe',
    description: 'Manage product recipes and material requirements',
    icon: 'FileText',
    path: '/dashboard/manufacturer/recipe',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'production'],
    category: 'operations',
    priority: 2,
    isSpecialized: true
  },
  {
    id: 'production',
    title: 'Production',
    description: 'Plan and schedule production runs',
    icon: 'Calendar',
    path: '/dashboard/manufacturer/production',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'production'],
    category: 'operations',
    priority: 3,
    isSpecialized: true
  },
  {
    id: 'waste-tracking',
    title: 'Waste Tracking',
    description: 'Monitor and analyze production waste and loss',
    icon: 'AlertTriangle',
    path: '/dashboard/manufacturer/waste-tracking',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'production'],
    category: 'operations',
    priority: 4,
    isSpecialized: true
  },
  {
    id: 'cost-per-unit',
    title: 'Cost per Unit Calculation',
    description: 'Calculate precise manufacturing costs per unit',
    icon: 'Calculator',
    path: '/dashboard/manufacturer/cost-per-unit',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 5,
    isSpecialized: true
  },
  {
    id: 'dispatch-management',
    title: 'Dispatch Management',
    description: 'Manage finished goods dispatch and delivery',
    icon: 'Truck',
    path: '/dashboard/manufacturer/dispatch',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff', 'delivery_staff', 'sales_staff'],
    category: 'operations',
    priority: 6,
    isSpecialized: true
  },
  {
    id: 'purchase-orders',
    title: 'Purchase Order Management',
    description: 'Manage supplier purchase orders and procurement',
    icon: 'ShoppingCart',
    path: '/dashboard/manufacturer/purchase-orders',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'inventory_manager'],
    category: 'operations',
    priority: 7,
    isSpecialized: true
  },
  {
    id: 'staff-productivity',
    title: 'Staff Productivity Tracker',
    description: 'Track and analyze staff productivity metrics',
    icon: 'Users',
    path: '/dashboard/manufacturer/staff-productivity',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'hr',
    priority: 8,
    isSpecialized: true
  },
  {
    id: 'vendor-management',
    title: 'Vendor Management',
    description: 'Manage supplier relationships and performance',
    icon: 'Building',
    path: '/dashboard/manufacturer/vendor-management',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'operations',
    priority: 9,
    isSpecialized: true
  },
  {
    id: 'manufacturer-sales-commission',
    title: 'Sales Commission Management',
    description: 'Track sales staff commissions on manufactured products',
    icon: 'DollarSign',
    path: '/dashboard/manufacturer/sales-commission',
    businessTypes: ['manufacturer'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_staff', 'accountant'],
    category: 'finance',
    priority: 10,
    isSpecialized: true
  },

  // =================== WHOLESALER SPECIFIC ===================
  {
    id: 'bulk-inventory-management',
    title: 'Bulk Inventory Management',
    description: 'Manage large-scale inventory with bulk operations',
    icon: 'Package',
    path: '/dashboard/wholesaler/bulk-inventory',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'inventory',
    priority: 1,
    isSpecialized: true
  },
  {
    id: 'party-ledger',
    title: 'Party Ledger & Receivables',
    description: 'Track party accounts and outstanding amounts',
    icon: 'BookOpen',
    path: '/dashboard/wholesaler/party-ledger',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 2,
    isSpecialized: true
  },
  {
    id: 'invoice-generator',
    title: 'Invoice Generator',
    description: 'Generate professional invoices for wholesale orders',
    icon: 'FileText',
    path: '/dashboard/wholesaler/invoices',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 3,
    isSpecialized: true
  },
  {
    id: 'purchase-order-system',
    title: 'Purchase Order System',
    description: 'Manage wholesale purchase orders',
    icon: 'ShoppingCart',
    path: '/dashboard/wholesaler/purchase-orders',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'operations',
    priority: 4,
    isSpecialized: true
  },
  {
    id: 'sales-performance-charts',
    title: 'Sales Performance Charts',
    description: 'Visual analytics for wholesale sales performance',
    icon: 'BarChart3',
    path: '/dashboard/wholesaler/sales-performance',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'analytics',
    priority: 5,
    isSpecialized: true
  },
  {
    id: 'salesman-commission-tracking',
    title: 'Salesman Commission Tracking',
    description: 'Track and calculate sales commissions',
    icon: 'DollarSign',
    path: '/dashboard/wholesaler/commission-management',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 6,
    isSpecialized: true
  },
  {
    id: 'transport-logs',
    title: 'Transport Logs',
    description: 'Track transportation and delivery logistics',
    icon: 'Truck',
    path: '/dashboard/wholesaler/transport-logs',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'operations',
    priority: 7,
    isSpecialized: true
  },
  {
    id: 'distributor-wise-sales',
    title: 'Distributor-wise Sales View',
    description: 'Analyze sales performance by distributor',
    icon: 'PieChart',
    path: '/dashboard/wholesaler/distributor-sales',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'analytics',
    priority: 8,
    isSpecialized: true
  },
  {
    id: 'gst-auto-reports',
    title: 'GST Auto-Reports',
    description: 'Automated GST reporting for wholesale operations',
    icon: 'FileText',
    path: '/dashboard/wholesaler/gst-reports',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'accountant'],
    category: 'finance',
    priority: 9,
    isSpecialized: true
  },
  {
    id: 'multi-branch-transfer',
    title: 'Multi-Branch Transfer',
    description: 'Transfer inventory between wholesale branches',
    icon: 'RefreshCw',
    path: '/dashboard/wholesaler/branch-transfer',
    businessTypes: ['wholesaler'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'operations',
    priority: 10,
    isSpecialized: true
  },

  // =================== DISTRIBUTOR SPECIFIC ===================
  {
    id: 'brand-product-management',
    title: 'Brand-wise Product Management',
    description: 'Manage products organized by brands with full CRUD operations',
    icon: 'Tags',
    path: '/dashboard/distributor/brand-products',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'inventory',
    priority: 1,
    isSpecialized: true
  },
  {
    id: 'area-client-tracking',
    title: 'Area-wise Client Tracking',
    description: 'Track clients by geographical areas',
    icon: 'MapPin',
    path: '/dashboard/distributor/territory-management',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'customer',
    priority: 2,
    isSpecialized: true
  },
  {
    id: 'salesman-assignment',
    title: 'Salesman Assignment',
    description: 'Assign salesmen to territories and clients',
    icon: 'UserCheck',
    path: '/dashboard/distributor/salesman-assignment',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'hr',
    priority: 3,
    isSpecialized: true
  },
  {
    id: 'target-achievement',
    title: 'Target vs Achievement Reports',
    description: 'Track sales targets against achievements',
    icon: 'Target',
    path: '/dashboard/distributor/target-achievement',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'analytics',
    priority: 4,
    isSpecialized: true
  },
  {
    id: 'scheme-offer-management',
    title: 'Scheme/Offer Management',
    description: 'Manage promotional schemes and offers',
    icon: 'Gift',
    path: '/dashboard/distributor/schemes',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'sales',
    priority: 5,
    isSpecialized: true
  },
  {
    id: 'route-planning',
    title: 'Route Planning',
    description: 'Plan and optimize delivery routes',
    icon: 'Route',
    path: '/dashboard/distributor/route-planning',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'operations',
    priority: 6,
    isSpecialized: true
  },
  {
    id: 'credit-followups',
    title: 'Credit Follow-ups',
    description: 'Track and follow up on credit accounts',
    icon: 'Phone',
    path: '/dashboard/distributor/credit-followups',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'finance',
    priority: 7,
    isSpecialized: true
  },
  {
    id: 'stock-ledger',
    title: 'Stock Ledger',
    description: 'Detailed stock movement tracking',
    icon: 'BookOpen',
    path: '/dashboard/distributor/stock-ledger',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'inventory',
    priority: 8,
    isSpecialized: true
  },
  {
    id: 'return-replacement',
    title: 'Return/Replacement Control',
    description: 'Manage product returns and replacements',
    icon: 'RotateCcw',
    path: '/dashboard/distributor/returns',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'operations',
    priority: 9,
    isSpecialized: true
  },
  {
    id: 'client-invoicing',
    title: 'Client Invoicing',
    description: 'Generate invoices for distributor clients',
    icon: 'FileText',
    path: '/dashboard/distributor/invoicing',
    businessTypes: ['distributor'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 10,
    isSpecialized: true
  },

  // =================== TRADER/RESELLER SPECIFIC ===================
  {
    id: 'buy-sell-tracking',
    title: 'Buy-Sell Inventory Tracking',
    description: 'Track purchase and sale transactions',
    icon: 'TrendingUp',
    path: '/dashboard/trader/buy-sell-tracking',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'inventory',
    priority: 1,
    isSpecialized: true
  },
  {
    id: 'margin-calculator',
    title: 'Margin Calculator',
    description: 'Calculate profit margins on trading transactions',
    icon: 'Calculator',
    path: '/dashboard/trader/margin-calculator',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 2,
    isSpecialized: true
  },
  {
    id: 'profit-loss-statements',
    title: 'Profit & Loss Statements',
    description: 'Generate P&L reports for trading activities',
    icon: 'FileText',
    path: '/dashboard/trader/profit-loss',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 3,
    isSpecialized: true
  },
  {
    id: 'manual-stock-adjustments',
    title: 'Manual Stock Adjustments',
    description: 'Make manual adjustments to stock levels',
    icon: 'Edit',
    path: '/dashboard/trader/stock-adjustments',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'inventory',
    priority: 4,
    isSpecialized: true
  },
  {
    id: 'party-list',
    title: 'Party List',
    description: 'Manage trading partners and suppliers',
    icon: 'Users',
    path: '/dashboard/trader/parties',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive'],
    category: 'customer',
    priority: 5,
    isSpecialized: true
  },
  {
    id: 'trader-invoice-generator',
    title: 'Invoice Generator',
    description: 'Generate invoices for trading transactions',
    icon: 'FileText',
    path: '/dashboard/trader/invoices',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 6,
    isSpecialized: true
  },
  {
    id: 'delivery-tracking',
    title: 'Delivery Tracking',
    description: 'Track deliveries and shipments',
    icon: 'Truck',
    path: '/dashboard/trader/delivery-tracking',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'operations',
    priority: 7,
    isSpecialized: true
  },
  {
    id: 'scheme-handling',
    title: 'Scheme Handling',
    description: 'Manage trading schemes and promotional offers',
    icon: 'Gift',
    path: '/dashboard/trader/schemes',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager'],
    category: 'sales',
    priority: 8,
    isSpecialized: true
  },
  {
    id: 'inventory-valuation',
    title: 'Inventory Valuation',
    description: 'Calculate current value of trading inventory',
    icon: 'DollarSign',
    path: '/dashboard/trader/inventory-valuation',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'accountant'],
    category: 'finance',
    priority: 9,
    isSpecialized: true
  },
  {
    id: 'return-refund-logs',
    title: 'Return & Refund Logs',
    description: 'Track returns and refunds in trading',
    icon: 'RotateCcw',
    path: '/dashboard/trader/returns-refunds',
    businessTypes: ['trader'],
    allowedRoles: ['owner', 'co_founder', 'manager', 'staff'],
    category: 'operations',
    priority: 10,
    isSpecialized: true
  },

];

// Combine common and business-specific modules
export const ALL_MODULES = [...COMMON_MODULES, ...BUSINESS_MODULES];

/**
 * Get modules for a specific business type and role
 */
export function getBusinessModules(businessType: BusinessType, userRole: UserRole): BusinessModule[] {
  return ALL_MODULES.filter(module => 
    module.businessTypes.includes(businessType) && 
    module.allowedRoles.includes(userRole)
  ).sort((a, b) => a.priority - b.priority);
}

/**
 * Get common modules for any business type
 */
export function getCommonModules(userRole: UserRole): BusinessModule[] {
  return COMMON_MODULES.filter(module => 
    module.allowedRoles.includes(userRole)
  ).sort((a, b) => a.priority - b.priority);
}

/**
 * Get business-specific modules only
 */
export function getSpecializedModules(businessType: BusinessType, userRole: UserRole): BusinessModule[] {
  return BUSINESS_MODULES.filter(module => 
    module.businessTypes.includes(businessType) && 
    module.allowedRoles.includes(userRole)
  ).sort((a, b) => a.priority - b.priority);
}

/**
 * Get business type display configuration
 */
export function getBusinessTypeConfig(businessType: BusinessType) {
  const configs = {
    retailer: {
      name: 'Retailer',
      description: 'Point of sale and retail operations',
      primaryColor: 'blue',
      features: ['POS System', 'Inventory Management', 'Customer Database', 'GST Reports'],
      mainModules: ['pos-billing', 'customer-database', 'offers-promotions', 'daily-sales-analytics']
    },
    ecommerce: {
      name: 'E-commerce',
      description: 'Online store and digital sales',
      primaryColor: 'purple',
      features: ['Product Catalog', 'Order Management', 'Payment Tracking', 'Customer Reviews'],
      mainModules: ['product-catalog-mgmt', 'in-app-ordering', 'order-tracking-fulfillment', 'payment-tracking']
    },
    service: {
      name: 'Service Provider',
      description: 'Service booking and management',
      primaryColor: 'green',
      features: ['Service Listing', 'Booking System', 'Time Slots', 'Quotation Generator'],
      mainModules: ['service-listing', 'booking-scheduling', 'quotation-generator', 'post-service-reviews']
    },
    manufacturer: {
      name: 'Manufacturer',
      description: 'Production and manufacturing operations',
      primaryColor: 'orange',
      features: ['Raw Materials', 'Cost Calculator', 'Production Planning', 'Quality Control'],
      mainModules: ['raw-material-inventory', 'cost-per-unit', 'production-planning', 'waste-tracking']
    },
    wholesaler: {
      name: 'Wholesaler',
      description: 'Bulk sales and distribution',
      primaryColor: 'indigo',
      features: ['Bulk Orders', 'Commission Management', 'Client Relations', 'Profit Analysis'],
      mainModules: ['bulk-inventory-management', 'party-ledger', 'invoice-generator', 'salesman-commission-tracking']
    },
    distributor: {
      name: 'Distributor',
      description: 'Distribution and logistics',
      primaryColor: 'teal',
      features: ['Territory Management', 'Brand Products', 'Commission Tracking', 'Route Planning'],
      mainModules: ['brand-product-management', 'area-client-tracking', 'target-achievement', 'route-planning']
    },
    trader: {
      name: 'Trader / Reseller',
      description: 'Buy-sell trading operations',
      primaryColor: 'yellow',
      features: ['Buy-Sell Tracking', 'Margin Calculator', 'P&L Statements', 'Inventory Valuation'],
      mainModules: ['buy-sell-tracking', 'margin-calculator', 'profit-loss-statements', 'party-list']
    }
  };

  return configs[businessType] || configs.retailer;
}

/**
 * Check if a module is available for a specific business type and role
 */
export function hasModuleAccess(moduleId: string, businessType: BusinessType, userRole: UserRole): boolean {
  const module = ALL_MODULES.find(m => m.id === moduleId);
  return module ? 
    module.businessTypes.includes(businessType) && module.allowedRoles.includes(userRole) : 
    false;
}
