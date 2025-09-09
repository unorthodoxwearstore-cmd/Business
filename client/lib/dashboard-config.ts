import { BusinessType, UserRole } from '@shared/types';
import { getBusinessModules, getCommonModules, getSpecializedModules } from './business-modules';

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  category: 'primary' | 'secondary' | 'analytics' | 'settings';
  priority: number;
  permissions: string[];
}

export interface DashboardConfig {
  businessType: BusinessType;
  userRole: UserRole;
  modules: DashboardWidget[];
  layout: {
    sidebar: DashboardWidget[];
    quickActions: DashboardWidget[];
    widgets: DashboardWidget[];
  };
  // Legacy compatibility
  primaryWidgets?: DashboardWidget[];
  secondaryWidgets?: DashboardWidget[];
  analyticsWidgets?: DashboardWidget[];
  settingsWidgets?: DashboardWidget[];
  quickActions?: DashboardWidget[];
  kpis?: KPIConfig[];
}

export interface KPIConfig {
  id: string;
  title: string;
  icon: string;
  category: 'sales' | 'inventory' | 'finance' | 'performance' | 'operations';
  permissions: string[];
  businessTypes: BusinessType[];
}

// KPI configurations for different business types
export const KPI_CONFIGS: KPIConfig[] = [
  // Common KPIs for all business types
  {
    id: 'total_revenue',
    title: 'Total Revenue',
    icon: 'DollarSign',
    category: 'finance',
    permissions: ['view_basic_analytics'],
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader']
  },
  {
    id: 'active_orders',
    title: 'Active Orders',
    icon: 'ShoppingCart',
    category: 'sales',
    permissions: ['view_orders'],
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader']
  },
  {
    id: 'inventory_value',
    title: 'Inventory Value',
    icon: 'Package',
    category: 'inventory',
    permissions: ['view_inventory'],
    businessTypes: ['retailer', 'ecommerce', 'manufacturer', 'wholesaler', 'distributor', 'trader']
  },
  {
    id: 'staff_performance',
    title: 'Staff Performance',
    icon: 'Users',
    category: 'performance',
    permissions: ['manage_team'],
    businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader']
  },

  // Retailer specific KPIs
  {
    id: 'daily_sales',
    title: 'Daily Sales',
    icon: 'TrendingUp',
    category: 'sales',
    permissions: ['view_basic_analytics'],
    businessTypes: ['retailer']
  },
  {
    id: 'customer_count',
    title: 'Customer Count',
    icon: 'Users',
    category: 'sales',
    permissions: ['manage_customers'],
    businessTypes: ['retailer', 'ecommerce', 'service']
  },

  // E-commerce specific KPIs
  {
    id: 'conversion_rate',
    title: 'Conversion Rate',
    icon: 'Target',
    category: 'sales',
    permissions: ['view_basic_analytics'],
    businessTypes: ['ecommerce']
  },
  {
    id: 'pending_orders',
    title: 'Pending Orders',
    icon: 'Clock',
    category: 'operations',
    permissions: ['view_orders'],
    businessTypes: ['ecommerce', 'manufacturer', 'wholesaler']
  },

  // Service specific KPIs
  {
    id: 'service_bookings',
    title: 'Service Bookings',
    icon: 'Calendar',
    category: 'operations',
    permissions: ['view_basic_analytics'],
    businessTypes: ['service']
  },
  {
    id: 'service_completion_rate',
    title: 'Completion Rate',
    icon: 'CheckCircle',
    category: 'performance',
    permissions: ['view_basic_analytics'],
    businessTypes: ['service']
  },

  // Manufacturer specific KPIs
  {
    id: 'production_efficiency',
    title: 'Production Efficiency',
    icon: 'Zap',
    category: 'operations',
    permissions: ['view_basic_analytics'],
    businessTypes: ['manufacturer']
  },
  {
    id: 'raw_material_stock',
    title: 'Raw Material Stock',
    icon: 'Package2',
    category: 'inventory',
    permissions: ['view_inventory'],
    businessTypes: ['manufacturer']
  },

  // Wholesaler specific KPIs
  {
    id: 'bulk_orders_value',
    title: 'Bulk Orders Value',
    icon: 'Truck',
    category: 'sales',
    permissions: ['view_basic_analytics'],
    businessTypes: ['wholesaler', 'distributor']
  },
  {
    id: 'commission_earned',
    title: 'Commission Earned',
    icon: 'Award',
    category: 'finance',
    permissions: ['view_financial_data'],
    businessTypes: ['wholesaler', 'distributor', 'sales_executive']
  },

  // Trader specific KPIs
  {
    id: 'profit_margin',
    title: 'Profit Margin',
    icon: 'TrendingUp',
    category: 'finance',
    permissions: ['view_financial_data'],
    businessTypes: ['trader']
  },
  {
    id: 'inventory_turnover',
    title: 'Inventory Turnover',
    icon: 'RefreshCw',
    category: 'operations',
    permissions: ['view_basic_analytics'],
    businessTypes: ['trader', 'retailer', 'wholesaler']
  },

];

/**
 * Generate dashboard configuration based on business type and user role
 */
export function generateDashboardConfig(
  businessType: BusinessType, 
  userRole: UserRole, 
  userPermissions: string[]
): DashboardConfig {
  // Get all modules for this business type and role
  const allModules = getBusinessModules(businessType, userRole);
  const commonModules = getCommonModules(userRole);
  const specializedModules = getSpecializedModules(businessType, userRole);

  // Convert modules to dashboard widgets
  const widgets: DashboardWidget[] = allModules.map(module => ({
    id: module.id,
    title: module.title,
    description: module.description,
    icon: module.icon,
    path: module.path,
    category: getPrimaryCategory(module.category),
    priority: module.priority,
    permissions: [] // Modules already filtered by role
  }));

  // Categorize widgets
  const primaryWidgets = widgets.filter(w => 
    w.category === 'primary' && w.priority <= 4
  ).slice(0, 6);

  const secondaryWidgets = widgets.filter(w => 
    w.category === 'secondary' || (w.category === 'primary' && w.priority > 4)
  ).slice(0, 8);

  const analyticsWidgets = widgets.filter(w => 
    w.category === 'analytics'
  ).slice(0, 4);

  const settingsWidgets = widgets.filter(w => 
    w.category === 'settings'
  ).slice(0, 4);

  // Generate quick actions based on business type
  const quickActions = generateQuickActions(businessType, userRole, userPermissions);

  // Get relevant KPIs
  const kpis = KPI_CONFIGS.filter(kpi => 
    kpi.businessTypes.includes(businessType) &&
    kpi.permissions.some(permission => userPermissions.includes(permission))
  );

  return {
    businessType,
    userRole,
    modules: widgets,
    layout: {
      sidebar: [...primaryWidgets, ...secondaryWidgets].slice(0, 8),
      quickActions: quickActions,
      widgets: [...analyticsWidgets, ...settingsWidgets]
    },
    // Legacy compatibility
    primaryWidgets,
    secondaryWidgets,
    analyticsWidgets,
    settingsWidgets,
    quickActions,
    kpis
  };
}

function getPrimaryCategory(moduleCategory: string): 'primary' | 'secondary' | 'analytics' | 'settings' {
  const categoryMap: Record<string, 'primary' | 'secondary' | 'analytics' | 'settings'> = {
    'sales': 'primary',
    'inventory': 'primary',
    'customer': 'secondary',
    'operations': 'secondary',
    'analytics': 'analytics',
    'finance': 'analytics',
    'settings': 'settings',
    'hr': 'secondary',
    'communication': 'secondary'
  };

  return categoryMap[moduleCategory] || 'secondary';
}

function generateQuickActions(
  businessType: BusinessType, 
  userRole: UserRole, 
  userPermissions: string[]
): DashboardWidget[] {
  const businessQuickActions: Record<BusinessType, DashboardWidget[]> = {
    retailer: [
      {
        id: 'new_sale',
        title: 'New Sale',
        description: 'Create a new sale transaction',
        icon: 'Plus',
        path: '/dashboard/retailer/pos',
        category: 'primary',
        priority: 1,
        permissions: ['viewAddEditOrders']
      },
      {
        id: 'add_sale_invoice',
        title: 'Add Sale & Invoice',
        description: 'Create sale and generate invoice',
        icon: 'FileText',
        path: '/dashboard/add-sale',
        category: 'primary',
        priority: 2,
        permissions: ['viewAddEditOrders']
      },
      {
        id: 'add_customer',
        title: 'Add Customer',
        description: 'Add new customer to database',
        icon: 'UserPlus',
        path: '/dashboard/retailer/customers',
        category: 'primary',
        priority: 2,
        permissions: ['manage_customers']
      },
      {
        id: 'check_inventory',
        title: 'Check Inventory',
        description: 'View current stock levels',
        icon: 'Package',
        path: '/dashboard/retailer/inventory',
        category: 'primary',
        priority: 3,
        permissions: ['view_inventory']
      },
      {
        id: 'scan_qr',
        title: 'Scan QR Code',
        description: 'Quick product lookup',
        icon: 'QrCode',
        path: '/dashboard/qr-scanner',
        category: 'secondary',
        priority: 4,
        permissions: ['qrCodeScanner']
      }
    ],
    ecommerce: [
      {
        id: 'new_product',
        title: 'Add Product',
        description: 'Add new product to catalog',
        icon: 'Plus',
        path: '/dashboard/ecommerce/product-catalog',
        category: 'primary',
        priority: 1,
        permissions: ['addEditDeleteProducts']
      },
      {
        id: 'process_orders',
        title: 'Process Orders',
        description: 'Manage pending orders',
        icon: 'ShoppingCart',
        path: '/dashboard/ecommerce/orders',
        category: 'primary',
        priority: 2,
        permissions: ['viewAddEditOrders']
      },
      {
        id: 'track_payments',
        title: 'Track Payments',
        description: 'Monitor payment status',
        icon: 'CreditCard',
        path: '/dashboard/ecommerce/payments',
        category: 'primary',
        priority: 3,
        permissions: ['view_financial_data']
      }
    ],
    service: [
      {
        id: 'new_booking',
        title: 'New Booking',
        description: 'Schedule new service',
        icon: 'Calendar',
        path: '/dashboard/service/bookings',
        category: 'primary',
        priority: 1,
        permissions: ['assignTasksOrRoutes']
      },
      {
        id: 'manage_slots',
        title: 'Manage Slots',
        description: 'Configure time slots',
        icon: 'Clock',
        path: '/dashboard/service/time-slots',
        category: 'primary',
        priority: 2,
        permissions: ['assignTasksOrRoutes']
      },
      {
        id: 'generate_quote',
        title: 'Generate Quote',
        description: 'Create service quotation',
        icon: 'FileText',
        path: '/dashboard/service/quotations',
        category: 'primary',
        priority: 3,
        permissions: ['create_sales']
      }
    ],
    manufacturer: [
      {
        id: 'start_production',
        title: 'Start Production',
        description: 'Initiate production order',
        icon: 'Play',
        path: '/dashboard/manufacturer/production-planning',
        category: 'primary',
        priority: 1,
        permissions: ['addEditDeleteProducts']
      },
      {
        id: 'check_materials',
        title: 'Check Materials',
        description: 'View raw material stock',
        icon: 'Package2',
        path: '/dashboard/manufacturer/raw-material-inventory',
        category: 'primary',
        priority: 2,
        permissions: ['view_inventory']
      },
      {
        id: 'calculate_cost',
        title: 'Calculate Cost',
        description: 'Calculate unit costs',
        icon: 'Calculator',
        path: '/dashboard/manufacturer/cost-per-unit',
        category: 'primary',
        priority: 3,
        permissions: ['view_financial_data']
      }
    ],
    wholesaler: [
      {
        id: 'bulk_order',
        title: 'Bulk Order',
        description: 'Create bulk order',
        icon: 'Truck',
        path: '/dashboard/wholesaler/bulk-inventory',
        category: 'primary',
        priority: 1,
        permissions: ['viewAddEditOrders']
      },
      {
        id: 'party_ledger',
        title: 'Party Ledger',
        description: 'View party accounts',
        icon: 'BookOpen',
        path: '/dashboard/wholesaler/party-ledger',
        category: 'primary',
        priority: 2,
        permissions: ['view_financial_data']
      },
      {
        id: 'generate_invoice',
        title: 'Generate Invoice',
        description: 'Create new invoice',
        icon: 'FileText',
        path: '/dashboard/wholesaler/invoices',
        category: 'primary',
        priority: 3,
        permissions: ['create_financial']
      }
    ],
    distributor: [
      {
        id: 'territory_map',
        title: 'Territory Map',
        description: 'View territory assignments',
        icon: 'MapPin',
        path: '/dashboard/distributor/territory-management',
        category: 'primary',
        priority: 1,
        permissions: ['view_basic_analytics']
      },
      {
        id: 'assign_salesman',
        title: 'Assign Salesman',
        description: 'Assign salesman to area',
        icon: 'UserCheck',
        path: '/dashboard/distributor/salesman-assignment',
        category: 'primary',
        priority: 2,
        permissions: ['manage_team']
      },
      {
        id: 'route_plan',
        title: 'Plan Route',
        description: 'Optimize delivery routes',
        icon: 'Route',
        path: '/dashboard/distributor/route-planning',
        category: 'primary',
        priority: 3,
        permissions: ['assignTasksOrRoutes']
      }
    ],
    trader: [
      {
        id: 'buy_sell',
        title: 'Buy/Sell',
        description: 'Record transaction',
        icon: 'TrendingUp',
        path: '/dashboard/trader/buy-sell-tracking',
        category: 'primary',
        priority: 1,
        permissions: ['viewAddEditOrders']
      },
      {
        id: 'calculate_margin',
        title: 'Calculate Margin',
        description: 'Calculate profit margin',
        icon: 'Calculator',
        path: '/dashboard/trader/margin-calculator',
        category: 'primary',
        priority: 2,
        permissions: ['view_financial_data']
      },
      {
        id: 'party_management',
        title: 'Manage Parties',
        description: 'Manage trading partners',
        icon: 'Users',
        path: '/dashboard/trader/parties',
        category: 'primary',
        priority: 3,
        permissions: ['manage_customers']
      }
    ]
  };

  const actions = businessQuickActions[businessType] || [];
  
  // Filter actions based on user permissions
  return actions.filter(action => 
    action.permissions.some(permission => userPermissions.includes(permission))
  );
}

// Import all required Lucide React icons
import {
  Calculator,
  Package,
  Package2,
  Users,
  TrendingUp,
  FileText,
  BarChart3,
  Settings,
  Crown,
  Plus,
  Calendar,
  Clock,
  Truck,
  MapPin,
  DollarSign,
  ShoppingCart,
  Building2,
  Play,
  Bot,
  CheckSquare,
  MessageSquare,
  Tag,
  Grid3x3,
  CreditCard,
  Star,
  List,
  Factory,
  BookOpen,
  Award,
  Tags,
  Target,
  Route,
  QrCode,
  UserPlus,
  UserCheck,
  Zap,
  RefreshCw,
  Shield,
  CheckCircle,
  Trophy,
  HelpCircle
} from 'lucide-react';

/**
 * Get icon component for a given icon string
 */
export function getIconComponent(iconName: string): React.ComponentType<any> {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'Calculator': Calculator,
    'Package': Package,
    'Package2': Package2,
    'Users': Users,
    'TrendingUp': TrendingUp,
    'FileText': FileText,
    'BarChart3': BarChart3,
    'Settings': Settings,
    'Crown': Crown,
    'Plus': Plus,
    'Calendar': Calendar,
    'Clock': Clock,
    'Truck': Truck,
    'MapPin': MapPin,
    'DollarSign': DollarSign,
    'ShoppingCart': ShoppingCart,
    'Building2': Building2,
    'Play': Play,
    'Bot': Bot,
    'CheckSquare': CheckSquare,
    'MessageSquare': MessageSquare,
    'Tag': Tag,
    'Grid3x3': Grid3x3,
    'CreditCard': CreditCard,
    'Star': Star,
    'List': List,
    'Factory': Factory,
    'BookOpen': BookOpen,
    'Award': Award,
    'Tags': Tags,
    'Target': Target,
    'Route': Route,
    'QrCode': QrCode,
    'UserPlus': UserPlus,
    'UserCheck': UserCheck,
    'Zap': Zap,
    'RefreshCw': RefreshCw,
    'Shield': Shield,
    'CheckCircle': CheckCircle,
    'Trophy': Trophy,
    'HelpCircle': HelpCircle
  };

  return iconMap[iconName] || Package; // Default fallback icon
}

// Dashboard module configurations for different business types
export const DASHBOARD_MODULES = {
  common: [
    { id: 'analytics', title: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
    { id: 'tasks', title: 'Tasks', icon: 'CheckSquare', path: '/dashboard/tasks' },
    { id: 'team-chat', title: 'Team Chat', icon: 'MessageSquare', path: '/dashboard/team-chat' },
    { id: 'ai-assistant', title: 'AI Assistant', icon: 'Bot', path: '/dashboard/ai-assistant' },
    { id: 'settings', title: 'Settings', icon: 'Settings', path: '/dashboard/settings' }
  ],
  retailer: [
    { id: 'pos-billing', title: 'POS & Billing', icon: 'Calculator', path: '/dashboard/retailer/pos' },
    { id: 'inventory', title: 'Inventory', icon: 'Package', path: '/dashboard/retailer/inventory' },
    { id: 'customers', title: 'Customers', icon: 'Users', path: '/dashboard/retailer/customers' },
    { id: 'offers', title: 'Offers', icon: 'Tag', path: '/dashboard/retailer/offers' }
  ],
  ecommerce: [
    { id: 'catalog', title: 'Product Catalog', icon: 'Grid3x3', path: '/dashboard/ecommerce/product-catalog' },
    { id: 'orders', title: 'Orders', icon: 'ShoppingCart', path: '/dashboard/ecommerce/orders' },
    { id: 'payments', title: 'Payments', icon: 'CreditCard', path: '/dashboard/ecommerce/payments' },
    { id: 'reviews', title: 'Reviews', icon: 'Star', path: '/dashboard/ecommerce/reviews' }
  ],
  service: [
    { id: 'services', title: 'Services', icon: 'List', path: '/dashboard/service/services' },
    { id: 'bookings', title: 'Bookings', icon: 'Calendar', path: '/dashboard/service/bookings' },
    { id: 'time-slots', title: 'Time Slots', icon: 'Clock', path: '/dashboard/service/time-slots' },
    { id: 'quotations', title: 'Quotations', icon: 'FileText', path: '/dashboard/service/quotations' }
  ],
  manufacturer: [
    { id: 'raw-materials', title: 'Raw Materials', icon: 'Package2', path: '/dashboard/manufacturer/raw-material-inventory' },
    { id: 'production', title: 'Production', icon: 'Factory', path: '/dashboard/manufacturer/production-planning' },
    { id: 'bom', title: 'Bill of Materials', icon: 'FileText', path: '/dashboard/manufacturer/bill-of-materials' },
    { id: 'cost-calculation', title: 'Cost Calculator', icon: 'Calculator', path: '/dashboard/manufacturer/cost-per-unit' }
  ],
  wholesaler: [
    { id: 'bulk-inventory', title: 'Bulk Inventory', icon: 'Package', path: '/dashboard/wholesaler/bulk-inventory' },
    { id: 'party-ledger', title: 'Party Ledger', icon: 'BookOpen', path: '/dashboard/wholesaler/party-ledger' },
    { id: 'invoices', title: 'Invoices', icon: 'FileText', path: '/dashboard/wholesaler/invoices' },
    { id: 'commissions', title: 'Commissions', icon: 'Award', path: '/dashboard/wholesaler/commission-management' }
  ],
  distributor: [
    { id: 'territory', title: 'Territory', icon: 'MapPin', path: '/dashboard/distributor/territory-management' },
    { id: 'brand-products', title: 'Brand Products', icon: 'Tags', path: '/dashboard/distributor/brand-products' },
    { id: 'targets', title: 'Targets', icon: 'Target', path: '/dashboard/distributor/target-achievement' },
    { id: 'routes', title: 'Routes', icon: 'Route', path: '/dashboard/distributor/route-planning' }
  ],
  trader: [
    { id: 'buy-sell', title: 'Buy/Sell', icon: 'TrendingUp', path: '/dashboard/trader/buy-sell-tracking' },
    { id: 'margins', title: 'Margins', icon: 'Calculator', path: '/dashboard/trader/margin-calculator' },
    { id: 'parties', title: 'Parties', icon: 'Users', path: '/dashboard/trader/parties' },
    { id: 'valuation', title: 'Valuation', icon: 'DollarSign', path: '/dashboard/trader/inventory-valuation' }
  ]
};
