// Multi-language support for Hisaabb
// Currently supports English and Hindi

interface TranslationKeys {
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    refresh: string;
    settings: string;
    logout: string;
    yes: string;
    no: string;
    ok: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  
  // Navigation
  nav: {
    dashboard: string;
    analytics: string;
    products: string;
    orders: string;
    customers: string;
    inventory: string;
    reports: string;
    settings: string;
    aiAssistant: string;
    advancedAnalytics: string;
  };
  
  // Dashboard
  dashboard: {
    welcome: string;
    totalRevenue: string;
    totalOrders: string;
    totalCustomers: string;
    totalProducts: string;
    recentOrders: string;
    topProducts: string;
    salesTrend: string;
    quickActions: string;
  };
  
  // Business Types
  business: {
    retailer: string;
    ecommerce: string;
    manufacturer: string;
    wholesaler: string;
    service: string;
    distributor: string;
    trader: string;
  };
  
  // User Roles
  roles: {
    owner: string;
    coFounder: string;
    manager: string;
    staff: string;
    accountant: string;
    salesExecutive: string;
  };
  
  // AI Assistant
  ai: {
    title: string;
    subtitle: string;
    askQuestion: string;
    suggestions: string;
    insights: string;
    analysis: string;
    quickQuestions: string;
    setupRequired: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    configure: string;
  };
  
  // Advanced Analytics
  analytics: {
    title: string;
    subtitle: string;
    totalAssets: string;
    totalLiabilities: string;
    netWorth: string;
    businessValuation: string;
    revenue: string;
    profit: string;
    margin: string;
    growth: string;
    ebitda: string;
    pat: string;
    assets: string;
    liabilities: string;
    valuation: string;
  };
  
  // Authentication
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    confirmPassword: string;
    businessName: string;
    businessType: string;
    firstName: string;
    lastName: string;
    ownerPassword: string;
    staffPassword: string;
    selectRole: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    welcomeBack: string;
    ownerLogin: string;
    staffLogin: string;
  };
}

const translations: Record<'en' | 'hi', TranslationKeys> = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      refresh: 'Refresh',
      settings: 'Settings',
      logout: 'Logout',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information'
    },
    nav: {
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      products: 'Products',
      orders: 'Orders',
      customers: 'Customers',
      inventory: 'Inventory',
      reports: 'Reports',
      settings: 'Settings',
      aiAssistant: 'AI Assistant',
      advancedAnalytics: 'Advanced Analytics'
    },
    dashboard: {
      welcome: 'Welcome',
      totalRevenue: 'Total Revenue',
      totalOrders: 'Total Orders',
      totalCustomers: 'Total Customers',
      totalProducts: 'Total Products',
      recentOrders: 'Recent Orders',
      topProducts: 'Top Products',
      salesTrend: 'Sales Trend',
      quickActions: 'Quick Actions'
    },
    business: {
      retailer: 'Retail Store',
      ecommerce: 'E-commerce',
      manufacturer: 'Manufacturing',
      wholesaler: 'Wholesale',
      service: 'Service Business',
      distributor: 'Distribution',
      trader: 'Trading',
    },
    roles: {
      owner: 'Business Owner',
      coFounder: 'Co-Founder',
      manager: 'Manager',
      staff: 'Staff Member',
      accountant: 'Accountant',
      salesExecutive: 'Sales Executive'
    },
    ai: {
      title: 'AI Business Assistant',
      subtitle: 'Get intelligent insights and answers about your business data',
      askQuestion: 'Ask about your business performance, trends, or get recommendations...',
      suggestions: 'Smart Suggestions',
      insights: 'Business Insights',
      analysis: 'Analysis',
      quickQuestions: 'Quick Questions',
      setupRequired: 'Setup AI Assistant',
      apiKeyLabel: 'Google AI Studio API Key',
      apiKeyPlaceholder: 'Enter your API key from Google AI Studio',
      configure: 'Configure AI Assistant'
    },
    analytics: {
      title: 'Advanced Analytics',
      subtitle: 'Comprehensive financial analysis and business valuation tools',
      totalAssets: 'Total Assets',
      totalLiabilities: 'Total Liabilities',
      netWorth: 'Net Worth',
      businessValuation: 'Business Valuation',
      revenue: 'Revenue',
      profit: 'Profit',
      margin: 'Margin',
      growth: 'Growth',
      ebitda: 'EBITDA',
      pat: 'PAT',
      assets: 'Assets',
      liabilities: 'Liabilities',
      valuation: 'Valuation'
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      businessName: 'Business Name',
      businessType: 'Business Type',
      firstName: 'First Name',
      lastName: 'Last Name',
      ownerPassword: 'Owner Password',
      staffPassword: 'Staff Password',
      selectRole: 'Select Role',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      welcomeBack: 'Welcome Back',
      ownerLogin: 'Owner Login',
      staffLogin: 'Staff Login'
    }
  },
  hi: {
    common: {
      loading: 'लोड हो रहा है...',
      save: '��ेव करें',
      cancel: 'रद्द करें',
      delete: 'डिलीट करें',
      edit: 'संपादित करें',
      add: 'जोड़ें',
      search: 'खो��ें',
      filter: 'फिल्टर',
      export: 'एक्सपोर्ट',
      import: 'इंपोर्ट',
      refresh: 'रिफ्रेश',
      settings: 'सेटिंग्स',
      logout: 'लॉग आउट',
      yes: 'हाँ',
      no: 'नहीं',
      ok: 'ठीक है',
      error: 'त्रुटि',
      success: 'सफल���ा',
      warning: 'चेतावनी',
      info: 'जानकारी'
    },
    nav: {
      dashboard: 'डैशबोर्ड',
      analytics: 'एनालिटिक्स',
      products: 'उत्पाद',
      orders: 'ऑर्डर',
      customers: 'ग्राहक',
      inventory: 'इन्वेंटरी',
      reports: 'रिपोर्ट',
      settings: 'सेटिंग्स',
      aiAssistant: 'AI असिस्टेंट',
      advancedAnalytics: 'एडवांस्ड एनालिटिक्स'
    },
    dashboard: {
      welcome: 'स्वागत',
      totalRevenue: 'कुल आय',
      totalOrders: 'कुल ��र्डर',
      totalCustomers: 'कुल ग्राहक',
      totalProducts: 'कुल उत्पाद',
      recentOrders: 'हाल के ऑर्डर',
      topProducts: 'टॉप उत्पाद',
      salesTrend: 'सेल्स ट्रेंड',
      quickActions: 'त्वरित कार्��'
    },
    business: {
      retailer: 'रिटेल स्टोर',
      ecommerce: 'ई-कॉमर्स',
      manufacturer: 'मैन्युफैक्चरिंग',
      wholesaler: 'होलसेल',
      service: 'सेवा व्यव����ाय',
      distributor: 'डि��्ट्रिब्यूशन',
      trader: 'ट्रेडिंग',
    },
    roles: {
      owner: 'व्यवसाय मालिक',
      coFounder: 'सह-संस्थापक',
      manager: 'प्र��ंधक',
      staff: 'कर्मचारी',
      accountant: 'अकाउंटेंट',
      salesExecutive: 'सेल्स एक्जीक्यूटिव'
    },
    ai: {
      title: 'AI बिजनेस असिस्टेंट',
      subtitle: 'अपने व्यवसाय डेटा के बारे में बुद्धिमान जानकारी और उत्तर प्राप्त करें',
      askQuestion: 'अपने व्यवसाय के प्रदर्शन, रुझान के बारे में पूछें या सिफारिशें प्राप्त करें...',
      suggestions: 'स्मार्ट सुझाव',
      insights: 'व्यवसाय अंतर्दृष्टि',
      analysis: 'विश्लेषण',
      quickQuestions: 'त्वरित प्रश्न',
      setupRequired: 'AI असिस्टेंट सेटअप',
      apiKeyLabel: 'Google AI Studio API की',
      apiKeyPlaceholder: 'Google AI Studio से अपनी API की दर्ज करें',
      configure: 'AI असिस्टेंट कॉन्फ़िगर करें'
    },
    analytics: {
      title: 'एडवांस्ड एनालिटिक्स',
      subtitle: 'व्यापक वित्तीय विश्लेषण और व्यवसाय मूल्यांकन उपकरण',
      totalAssets: 'कुल संपत्ति',
      totalLiabilities: 'कुल देनदारियां',
      netWorth: 'नेट वर्थ',
      businessValuation: 'व्यवसाय मूल्यांकन',
      revenue: 'आय',
      profit: 'लाभ',
      margin: 'मार्जिन',
      growth: 'वृद्धि',
      ebitda: 'EBITDA',
      pat: 'PAT',
      assets: 'संपत्ति',
      liabilities: 'देनदारियां',
      valuation: 'मूल्यांकन'
    },
    auth: {
      signIn: 'साइन इन',
      signUp: 'साइन अप',
      email: 'ईमेल',
      password: 'पासवर्ड',
      confirmPassword: 'पासवर्ड कन्फर्म करें',
      businessName: 'व्यवसाय का नाम',
      businessType: 'व्यवसाय का प्रकार',
      firstName: 'पहला नाम',
      lastName: 'अंतिम नाम',
      ownerPassword: 'मालिक पासवर्ड',
      staffPassword: 'कर्मचारी पासवर्ड',
      selectRole: 'भूमिका चुनें',
      createAccount: 'खाता बनाएं',
      alreadyHaveAccount: 'पहले से खाता है?',
      dontHaveAccount: 'खाता नहीं है?',
      welcomeBack: 'वापस स्वागत है',
      ownerLogin: 'मालिक लॉगिन',
      staffLogin: 'कर्मचारी लॉगिन'
    }
  }
};

class I18nService {
  private currentLanguage: 'en' | 'hi' = 'en';

  constructor() {
    // Load saved language preference
    const savedLang = localStorage.getItem('hisaabb_language') as 'en' | 'hi';
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      this.currentLanguage = savedLang;
    }
  }

  setLanguage(lang: 'en' | 'hi') {
    this.currentLanguage = lang;
    localStorage.setItem('hisaabb_language', lang);
    // Trigger a custom event for components to re-render
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key; // Return key if translation not found
  }

  // Helper methods for common translations
  common(key: keyof TranslationKeys['common']) {
    return this.t(`common.${key}`);
  }

  nav(key: keyof TranslationKeys['nav']) {
    return this.t(`nav.${key}`);
  }

  dashboard(key: keyof TranslationKeys['dashboard']) {
    return this.t(`dashboard.${key}`);
  }

  business(key: keyof TranslationKeys['business']) {
    return this.t(`business.${key}`);
  }

  roles(key: keyof TranslationKeys['roles']) {
    return this.t(`roles.${key}`);
  }

  ai(key: keyof TranslationKeys['ai']) {
    return this.t(`ai.${key}`);
  }

  analytics(key: keyof TranslationKeys['analytics']) {
    return this.t(`analytics.${key}`);
  }

  auth(key: keyof TranslationKeys['auth']) {
    return this.t(`auth.${key}`);
  }

  // Format currency based on language
  formatCurrency(amount: number): string {
    if (this.currentLanguage === 'hi') {
      return new Intl.NumberFormat('hi-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
  }

  // Format date based on language
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (this.currentLanguage === 'hi') {
      return dateObj.toLocaleDateString('hi-IN');
    } else {
      return dateObj.toLocaleDateString('en-IN');
    }
  }

  // Format number based on language
  formatNumber(number: number): string {
    if (this.currentLanguage === 'hi') {
      return new Intl.NumberFormat('hi-IN').format(number);
    } else {
      return new Intl.NumberFormat('en-IN').format(number);
    }
  }
}

export const i18n = new I18nService();

// React hook for using translations
import { useState, useEffect } from 'react';

export const useTranslation = () => {
  const [, setUpdateFlag] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      setUpdateFlag(prev => prev + 1);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  return {
    t: i18n.t.bind(i18n),
    setLanguage: i18n.setLanguage.bind(i18n),
    currentLanguage: i18n.getCurrentLanguage(),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    // Helper methods
    common: i18n.common.bind(i18n),
    nav: i18n.nav.bind(i18n),
    dashboard: i18n.dashboard.bind(i18n),
    business: i18n.business.bind(i18n),
    roles: i18n.roles.bind(i18n),
    ai: i18n.ai.bind(i18n),
    analytics: i18n.analytics.bind(i18n),
    auth: i18n.auth.bind(i18n)
  };
};
