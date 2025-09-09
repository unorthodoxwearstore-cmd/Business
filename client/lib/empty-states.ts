// Empty state configurations for production-ready app
export interface EmptyStateConfig {
  title: string;
  description: string;
  actionText?: string;
  secondaryText?: string;
  showAction?: boolean;
}

export const EMPTY_STATES = {
  // Manufacturer Empty States
  rawMaterials: {
    title: "No Raw Materials",
    description: "Start by adding raw materials to your inventory. Track prices, suppliers, and stock levels automatically.",
    actionText: "Add First Material",
    showAction: true
  },
  recipes: {
    title: "No Recipes Created",
    description: "Create your first product recipe to start automated cost calculation and production planning.",
    actionText: "Create Recipe",
    showAction: true
  },
  productionOrders: {
    title: "No Production Orders",
    description: "Production orders will appear here once you send recipes to production.",
    actionText: "Create Production Order",
    showAction: true
  },
  productionLogs: {
    title: "No Production History",
    description: "Your production logs and history will appear here once manufacturing begins.",
    secondaryText: "Start your first production run to see detailed logs"
  },
  billOfMaterials: {
    title: "No Bills of Materials",
    description: "Define material compositions for your products to enable accurate costing and production planning.",
    actionText: "Create BoM",
    showAction: true
  },

  // Retailer Empty States
  customers: {
    title: "No Customers",
    description: "Start building your customer database by adding your first customer or import from existing data.",
    actionText: "Add Customer",
    showAction: true
  },
  products: {
    title: "No Products",
    description: "Add products to your catalog to start selling and managing inventory.",
    actionText: "Add Product",
    showAction: true
  },
  orders: {
    title: "No Orders",
    description: "Customer orders will appear here once you start processing sales.",
    secondaryText: "Create your first order to get started"
  },
  sales: {
    title: "No Sales Data",
    description: "Sales analytics and reports will appear once you start processing orders.",
    secondaryText: "Complete your first sale to see insights"
  },

  // Wholesaler Empty States
  parties: {
    title: "No Parties",
    description: "Add customers and suppliers to manage your business relationships and track transactions.",
    actionText: "Add Party",
    showAction: true
  },
  inventory: {
    title: "No Inventory",
    description: "Add products to your bulk inventory to start managing wholesale operations.",
    actionText: "Add Product",
    showAction: true
  },
  invoices: {
    title: "No Invoices",
    description: "Generated invoices will appear here. Create your first invoice to get started.",
    actionText: "Create Invoice",
    showAction: true
  },
  transportLogs: {
    title: "No Transport Records",
    description: "Vehicle and delivery logs will appear here once you start tracking shipments.",
    actionText: "Add Vehicle",
    showAction: true
  },

  // Service Business Empty States
  services: {
    title: "No Services",
    description: "Define your service offerings to enable bookings and customer management.",
    actionText: "Add Service",
    showAction: true
  },
  bookings: {
    title: "No Bookings",
    description: "Customer bookings and appointments will appear here once you start accepting reservations.",
    actionText: "Create Booking",
    showAction: true
  },
  appointments: {
    title: "No Appointments",
    description: "Schedule and manage customer appointments from this dashboard.",
    actionText: "Schedule Appointment",
    showAction: true
  },

  // E-commerce Empty States
  catalog: {
    title: "No Product Catalog",
    description: "Build your online product catalog to start selling to customers.",
    actionText: "Add Product",
    showAction: true
  },
  onlineOrders: {
    title: "No Online Orders",
    description: "Online customer orders will appear here once your store is live.",
    secondaryText: "Set up your online store to receive orders"
  },

  // Distributor Empty States
  territories: {
    title: "No Territories",
    description: "Define sales territories to organize your distribution network.",
    actionText: "Add Territory",
    showAction: true
  },
  routes: {
    title: "No Routes",
    description: "Create delivery and sales routes to optimize your distribution operations.",
    actionText: "Plan Route",
    showAction: true
  },

  // Core Dashboard Empty States
  analytics: {
    title: "No Analytics Data",
    description: "Business analytics and insights will appear once you start entering data and processing transactions.",
    secondaryText: "Start by adding products and customers"
  },
  revenue: {
    title: "No Revenue Data",
    description: "Revenue tracking and financial reports will appear once you start making sales.",
    secondaryText: "Process your first sale to see revenue analytics"
  },
  performance: {
    title: "No Performance Data",
    description: "Performance metrics and KPIs will be calculated once you have business activity.",
    secondaryText: "Continue using the system to generate performance insights"
  },

  // AI Assistant Empty States
  aiAssistant: {
    title: "AI Assistant Ready",
    description: "Your AI business assistant is ready to help with insights, analytics, and recommendations.",
    actionText: "Ask a Question",
    showAction: true,
    secondaryText: "Configure your Google AI Studio API key in settings to enable AI features"
  },

  // General Empty States
  general: {
    title: "No Data Available",
    description: "Data will appear here once you start using this feature.",
    secondaryText: "Get started by exploring the available options"
  },
  search: {
    title: "No Results Found",
    description: "Try adjusting your search criteria or filters to find what you're looking for.",
    secondaryText: "Check your spelling or try different keywords"
  },
  filter: {
    title: "No Items Match Your Filters",
    description: "Try adjusting your filter criteria to see more results.",
    actionText: "Clear Filters",
    showAction: true
  },
  loading: {
    title: "Loading...",
    description: "Please wait while we fetch your data.",
    secondaryText: "This should only take a moment"
  },
  error: {
    title: "Something Went Wrong",
    description: "We couldn't load your data. Please try again or contact support if the problem persists.",
    actionText: "Try Again",
    showAction: true
  },
  offline: {
    title: "You're Offline",
    description: "Please check your internet connection and try again.",
    secondaryText: "Some features may be limited in offline mode"
  },

  // Firebase Integration States
  notConnected: {
    title: "Database Not Connected",
    description: "Connect to Firebase to start saving and syncing your business data.",
    secondaryText: "Configure Firebase connection in settings"
  },
  syncing: {
    title: "Syncing Data",
    description: "Your data is being synchronized with the cloud.",
    secondaryText: "Please don't close the application"
  }
} as const;

// Helper function to get empty state config
export function getEmptyState(key: keyof typeof EMPTY_STATES): EmptyStateConfig {
  return EMPTY_STATES[key] || EMPTY_STATES.general;
}

// React component props for empty states
export interface EmptyStateProps {
  config: EmptyStateConfig;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Default empty state component structure
export const DEFAULT_EMPTY_STATE_CLASSES = {
  container: "flex flex-col items-center justify-center p-8 text-center",
  icon: "w-12 h-12 text-gray-400 mx-auto mb-4",
  title: "text-lg font-medium text-gray-900 mb-2",
  description: "text-gray-500 mb-4 max-w-md",
  action: "bg-orange-600 hover:bg-orange-700 text-white",
  secondary: "text-sm text-gray-400 mt-2"
};
