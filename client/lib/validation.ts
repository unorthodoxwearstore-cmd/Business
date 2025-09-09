// Production-ready data validation and sanitization

import { constants } from './config';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => ({
    required: true,
    custom: (value: any) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    }
  }),

  email: (message = 'Please enter a valid email address') => ({
    pattern: constants.PATTERNS.EMAIL,
    custom: (value: string) => {
      if (value && !constants.PATTERNS.EMAIL.test(value)) {
        return message;
      }
      return null;
    }
  }),

  phone: (message = 'Please enter a valid phone number') => ({
    pattern: constants.PATTERNS.PHONE,
    custom: (value: string) => {
      if (value && !constants.PATTERNS.PHONE.test(value)) {
        return message;
      }
      return null;
    }
  }),

  minLength: (min: number, message?: string) => ({
    minLength: min,
    custom: (value: string) => {
      if (value && value.length < min) {
        return message || `Must be at least ${min} characters long`;
      }
      return null;
    }
  }),

  maxLength: (max: number, message?: string) => ({
    maxLength: max,
    custom: (value: string) => {
      if (value && value.length > max) {
        return message || `Must be no more than ${max} characters long`;
      }
      return null;
    }
  }),

  numeric: (message = 'Must be a valid number') => ({
    custom: (value: any) => {
      if (value !== '' && value !== null && value !== undefined && isNaN(Number(value))) {
        return message;
      }
      return null;
    }
  }),

  positive: (message = 'Must be a positive number') => ({
    custom: (value: any) => {
      const num = Number(value);
      if (!isNaN(num) && num <= 0) {
        return message;
      }
      return null;
    }
  }),

  gst: (message = 'Please enter a valid GST number') => ({
    pattern: constants.PATTERNS.GST,
    custom: (value: string) => {
      if (value && !constants.PATTERNS.GST.test(value)) {
        return message;
      }
      return null;
    }
  }),

  pan: (message = 'Please enter a valid PAN number') => ({
    pattern: constants.PATTERNS.PAN,
    custom: (value: string) => {
      if (value && !constants.PATTERNS.PAN.test(value)) {
        return message;
      }
      return null;
    }
  }),

  strongPassword: (message = 'Password must be at least 8 characters with uppercase, lowercase, and number') => ({
    custom: (value: string) => {
      if (value) {
        const hasLength = value.length >= 8;
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        
        if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
          return message;
        }
      }
      return null;
    }
  }),

  confirmPassword: (password: string, message = 'Passwords do not match') => ({
    custom: (value: string) => {
      if (value !== password) {
        return message;
      }
      return null;
    }
  }),

  url: (message = 'Please enter a valid URL') => ({
    custom: (value: string) => {
      if (value) {
        try {
          new URL(value);
        } catch {
          return message;
        }
      }
      return null;
    }
  }),

  date: (message = 'Please enter a valid date') => ({
    custom: (value: string) => {
      if (value && isNaN(Date.parse(value))) {
        return message;
      }
      return null;
    }
  }),

  futureDate: (message = 'Date must be in the future') => ({
    custom: (value: string) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        if (date <= now) {
          return message;
        }
      }
      return null;
    }
  }),

  pastDate: (message = 'Date must be in the past') => ({
    custom: (value: string) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        if (date >= now) {
          return message;
        }
      }
      return null;
    }
  }),
};

// Validation schemas for common forms
export const validationSchemas = {
  login: {
    email: validationRules.required('Email is required'),
    password: validationRules.required('Password is required'),
  },

  signup: {
    firstName: {
      ...validationRules.required('First name is required'),
      ...validationRules.minLength(2),
      ...validationRules.maxLength(50),
    },
    lastName: {
      ...validationRules.required('Last name is required'),
      ...validationRules.minLength(2),
      ...validationRules.maxLength(50),
    },
    email: {
      ...validationRules.required('Email is required'),
      ...validationRules.email(),
    },
    businessName: {
      ...validationRules.required('Business name is required'),
      ...validationRules.minLength(2),
      ...validationRules.maxLength(constants.MAX_BUSINESS_NAME_LENGTH),
    },
    ownerPassword: {
      ...validationRules.required('Owner password is required'),
      ...validationRules.strongPassword(),
    },
    staffPassword: {
      ...validationRules.required('Staff password is required'),
      ...validationRules.minLength(6, 'Staff password must be at least 6 characters'),
    },
  },

  product: {
    name: {
      ...validationRules.required('Product name is required'),
      ...validationRules.minLength(2),
      ...validationRules.maxLength(constants.MAX_PRODUCT_NAME_LENGTH),
    },
    sku: {
      ...validationRules.required('SKU is required'),
      ...validationRules.minLength(3),
      ...validationRules.maxLength(50),
    },
    price: {
      ...validationRules.required('Price is required'),
      ...validationRules.numeric(),
      ...validationRules.positive(),
    },
    stock: {
      ...validationRules.required('Stock quantity is required'),
      ...validationRules.numeric(),
      custom: (value: any) => {
        const num = Number(value);
        if (!isNaN(num) && num < 0) {
          return 'Stock cannot be negative';
        }
        return null;
      }
    },
  },

  customer: {
    name: {
      ...validationRules.required('Customer name is required'),
      ...validationRules.minLength(2),
      ...validationRules.maxLength(100),
    },
    email: validationRules.email(),
    phone: {
      ...validationRules.required('Phone number is required'),
      ...validationRules.phone(),
    },
    address: {
      ...validationRules.maxLength(500),
    },
  },

  business: {
    name: {
      ...validationRules.required('Business name is required'),
      ...validationRules.minLength(2),
      ...validationRules.maxLength(constants.MAX_BUSINESS_NAME_LENGTH),
    },
    gstNumber: validationRules.gst(),
    panNumber: validationRules.pan(),
    address: {
      ...validationRules.required('Address is required'),
      ...validationRules.maxLength(500),
    },
  },
};

// Main validation function
export function validateData(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const error = validateField(value, rule);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Validate single field
export function validateField(value: any, rule: ValidationRule): string | null {
  // Required check
  if (rule.required && (value === null || value === undefined || value === '')) {
    return 'This field is required';
  }

  // Skip other validations if value is empty and not required
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  // Length validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `Must be at least ${rule.minLength} characters long`;
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return `Must be no more than ${rule.maxLength} characters long`;
    }
  }

  // Numeric validations
  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
    const numValue = Number(value);
    if (rule.min !== undefined && numValue < rule.min) {
      return `Must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && numValue > rule.max) {
      return `Must be no more than ${rule.max}`;
    }
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return 'Invalid format';
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

// Sanitization functions
export const sanitize = {
  // Remove HTML tags and dangerous characters
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Sanitize for SQL (though we should use parameterized queries)
  sql: (input: string): string => {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  },

  // Clean and normalize text
  text: (input: string): string => {
    return input
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,!?@#$%&*()]/g, '');
  },

  // Sanitize email
  email: (input: string): string => {
    return input.toLowerCase().trim().replace(/[^\w@.-]/g, '');
  },

  // Sanitize phone number
  phone: (input: string): string => {
    return input.replace(/[^\d+\-\s()]/g, '').trim();
  },

  // Sanitize alphanumeric (for SKUs, codes, etc.)
  alphanumeric: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  },

  // Sanitize numeric
  numeric: (input: string): string => {
    return input.replace(/[^\d.-]/g, '');
  },

  // Sanitize URL
  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      return '';
    }
  },
};

// Form validation hook
import { useState, useCallback } from 'react';

export function useFormValidation<T extends Record<string, any>>(
  schema: ValidationSchema,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = useCallback(() => {
    const result = validateData(values, schema);
    setErrors(result.errors);
    return result.isValid;
  }, [values, schema]);

  const validateField = useCallback((field: string, value: any) => {
    const rule = schema[field];
    if (rule) {
      const error = validateField(value, rule);
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
      return !error;
    }
    return true;
  }, [schema]);

  const setValue = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched, validateField]);

  const setTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateForm,
    validateField,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

export default validationRules;
