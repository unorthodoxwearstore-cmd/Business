// Production-ready configuration for Hisaabb

interface Config {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  auth: {
    tokenExpiry: number;
    refreshThreshold: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  features: {
    aiAssistant: boolean;
    advancedAnalytics: boolean;
    multiLanguage: boolean;
    darkMode: boolean;
    notifications: boolean;
  };
  ui: {
    theme: 'light' | 'dark';
    defaultLanguage: 'en' | 'hi';
    animationsEnabled: boolean;
    compactMode: boolean;
  };
  storage: {
    prefix: string;
    encryptionEnabled: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
  };
  performance: {
    enableAnalytics: boolean;
    enableCaching: boolean;
    cacheExpiry: number;
  };
}

const getConfig = (): Config => {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  return {
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || (isProduction ? '/api' : 'http://localhost:3001/api'),
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
    },
    auth: {
      tokenExpiry: parseInt(import.meta.env.VITE_TOKEN_EXPIRY || '86400000'), // 24 hours
      refreshThreshold: parseInt(import.meta.env.VITE_REFRESH_THRESHOLD || '300000'), // 5 minutes
      maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(import.meta.env.VITE_LOCKOUT_DURATION || '900000'), // 15 minutes
    },
    features: {
      aiAssistant: import.meta.env.VITE_ENABLE_AI_ASSISTANT !== 'false',
      advancedAnalytics: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS !== 'false',
      multiLanguage: import.meta.env.VITE_ENABLE_MULTI_LANGUAGE !== 'false',
      darkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true', // Disabled by default as per requirements
      notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    },
    ui: {
      theme: 'light', // Light mode only as per requirements
      defaultLanguage: (import.meta.env.VITE_DEFAULT_LANGUAGE as 'en' | 'hi') || 'en',
      animationsEnabled: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false',
      compactMode: import.meta.env.VITE_COMPACT_MODE === 'true',
    },
    storage: {
      prefix: import.meta.env.VITE_STORAGE_PREFIX || 'hisaabb_',
      encryptionEnabled: isProduction,
    },
    logging: {
      level: (import.meta.env.VITE_LOG_LEVEL as any) || (isDevelopment ? 'debug' : 'error'),
      enableConsole: isDevelopment || import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
      enableRemote: isProduction && import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
    },
    performance: {
      enableAnalytics: isProduction && import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
      enableCaching: import.meta.env.VITE_ENABLE_CACHING !== 'false',
      cacheExpiry: parseInt(import.meta.env.VITE_CACHE_EXPIRY || '3600000'), // 1 hour
    },
  };
};

export const config = getConfig();

// Environment detection utilities
export const environment = {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  isTest: import.meta.env.MODE === 'test',
  mode: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL,
};

// Feature flags for controlled rollouts
export const featureFlags = {
  // Core features
  enableAI: config.features.aiAssistant,
  enableAdvancedAnalytics: config.features.advancedAnalytics,
  enableMultiLanguage: config.features.multiLanguage,
  
  // Business type specific features
  enableManufacturerModule: true,
  enableWholesalerModule: true,
  enableDistributorModule: true,
  enableTraderModule: true,
  
  // UI/UX features
  enableAnimations: config.ui.animationsEnabled,
  enableCompactMode: config.ui.compactMode,
  
  // Performance features
  enableLazyLoading: true,
  enableCodeSplitting: true,
  enableServiceWorker: environment.isProduction,
  
  // Security features
  enableCSP: environment.isProduction,
  enableHSTS: environment.isProduction,
  enableXSSProtection: true,
  
  // Monitoring
  enableErrorReporting: environment.isProduction,
  enablePerformanceMonitoring: environment.isProduction,
  enableUserAnalytics: config.performance.enableAnalytics,
};

// API endpoints configuration
export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    signup: '/auth/signup',
    verify: '/auth/verify',
  },
  business: {
    profile: '/business/profile',
    settings: '/business/settings',
    analytics: '/business/analytics',
    modules: '/business/modules',
  },
  user: {
    profile: '/user/profile',
    preferences: '/user/preferences',
    permissions: '/user/permissions',
  },
  data: {
    products: '/data/products',
    orders: '/data/orders',
    customers: '/data/customers',
    inventory: '/data/inventory',
    reports: '/data/reports',
  },
  ai: {
    chat: '/ai/chat',
    analysis: '/ai/analysis',
    suggestions: '/ai/suggestions',
  },
  files: {
    upload: '/files/upload',
    download: '/files/download',
    export: '/files/export',
  },
};

// Application constants
export const constants = {
  // UI constants
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  
  // Business constants
  MAX_BUSINESS_NAME_LENGTH: 100,
  MAX_PRODUCT_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  
  // File upload constants
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // Cache keys
  CACHE_KEYS: {
    USER_PROFILE: 'user_profile',
    BUSINESS_DATA: 'business_data',
    DASHBOARD_DATA: 'dashboard_data',
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: `${config.storage.prefix}access_token`,
    REFRESH_TOKEN: `${config.storage.prefix}refresh_token`,
    USER_DATA: `${config.storage.prefix}user_data`,
    BUSINESS_DATA: `${config.storage.prefix}business_data`,
    PREFERENCES: `${config.storage.prefix}preferences`,
    LANGUAGE: `${config.storage.prefix}language`,
    AI_API_KEY: `${config.storage.prefix}ai_api_key`,
  },
  
  // Validation patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[+]?[\d\s\-()]+$/,
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  },
};

// Error codes and messages
export const errorCodes = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  
  // Business errors
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
  BUSINESS_INACTIVE: 'BUSINESS_INACTIVE',
  BUSINESS_SUBSCRIPTION_EXPIRED: 'BUSINESS_SUBSCRIPTION_EXPIRED',
  
  // Data errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_VALIDATION_ERROR: 'DATA_VALIDATION_ERROR',
  DATA_DUPLICATE_ERROR: 'DATA_DUPLICATE_ERROR',
  
  // System errors
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  SYSTEM_OVERLOADED: 'SYSTEM_OVERLOADED',
  SYSTEM_UNKNOWN_ERROR: 'SYSTEM_UNKNOWN_ERROR',
};

// Security headers for production
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Performance monitoring configuration
export const performanceConfig = {
  // Core Web Vitals thresholds
  LCP_THRESHOLD: 2500, // Largest Contentful Paint
  FID_THRESHOLD: 100,  // First Input Delay
  CLS_THRESHOLD: 0.1,  // Cumulative Layout Shift
  
  // Custom metrics
  TTI_THRESHOLD: 3000, // Time to Interactive
  FCP_THRESHOLD: 1500, // First Contentful Paint
  
  // Monitoring settings
  SAMPLE_RATE: environment.isProduction ? 0.1 : 1.0, // 10% sampling in production
  ENABLE_LONG_TASKS: true,
  ENABLE_NAVIGATION_TIMING: true,
  ENABLE_RESOURCE_TIMING: true,
};

export default config;
