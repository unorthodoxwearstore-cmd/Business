// Production-ready error handling and logging system

import React from 'react';
import { config, environment } from './config';

export interface ErrorContext {
  userId?: string;
  businessId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context: ErrorContext;
  userAgent: string;
  url: string;
  handled: boolean;
}

class ErrorHandler {
  private errorQueue: ErrorReport[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.setupGlobalHandlers();
    this.setupNetworkListener();
  }

  private setupGlobalHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        component: 'Global',
        action: 'UnhandledError',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      }, false);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'Global',
          action: 'UnhandledPromiseRejection',
        },
        false
      );
    });

    // Handle console errors in production
    if (environment.isProduction) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        this.logError(new Error(args.join(' ')), {
          component: 'Console',
          action: 'ConsoleError',
        });
        originalConsoleError.apply(console, args);
      };
    }
  }

  private setupNetworkListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public logError(error: Error, context: ErrorContext = {}, handled = true): string {
    const errorId = this.generateErrorId();
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      handled,
    };

    this.processError(errorReport);
    return errorId;
  }

  public logWarning(message: string, context: ErrorContext = {}): string {
    const warningId = this.generateErrorId();
    
    const warningReport: ErrorReport = {
      id: warningId,
      timestamp: new Date(),
      level: 'warn',
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      handled: true,
    };

    this.processError(warningReport);
    return warningId;
  }

  public logInfo(message: string, context: ErrorContext = {}): string {
    const infoId = this.generateErrorId();
    
    const infoReport: ErrorReport = {
      id: infoId,
      timestamp: new Date(),
      level: 'info',
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      handled: true,
    };

    if (config.logging.level === 'debug' || config.logging.level === 'info') {
      this.processError(infoReport);
    }
    
    return infoId;
  }

  private processError(errorReport: ErrorReport) {
    // Log to console if enabled
    if (config.logging.enableConsole) {
      this.logToConsole(errorReport);
    }

    // Store locally
    this.storeLocally(errorReport);

    // Send to remote service if enabled and online
    if (config.logging.enableRemote && this.isOnline) {
      this.sendToRemote(errorReport);
    } else if (config.logging.enableRemote) {
      this.errorQueue.push(errorReport);
    }

    // Show user notification for critical errors
    if (errorReport.level === 'error' && !errorReport.handled) {
      this.showUserNotification(errorReport);
    }
  }

  private logToConsole(errorReport: ErrorReport) {
    const logMethod = errorReport.level === 'error' ? console.error : 
                     errorReport.level === 'warn' ? console.warn : console.log;
    
    logMethod(`[${errorReport.level.toUpperCase()}] ${errorReport.message}`, {
      id: errorReport.id,
      timestamp: errorReport.timestamp,
      context: errorReport.context,
      stack: errorReport.stack,
    });
  }

  private storeLocally(errorReport: ErrorReport) {
    try {
      const key = `${config.storage.prefix}error_${errorReport.id}`;
      const serialized = JSON.stringify({
        ...errorReport,
        timestamp: errorReport.timestamp.toISOString(),
      });
      
      localStorage.setItem(key, serialized);
      
      // Clean up old errors (keep only last 50)
      this.cleanupLocalErrors();
    } catch (error) {
      console.warn('Failed to store error locally:', error);
    }
  }

  private async sendToRemote(errorReport: ErrorReport) {
    try {
      const response = await fetch(`${config.api.baseUrl}/errors/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(config.storage.prefix + 'access_token')}`,
        },
        body: JSON.stringify({
          ...errorReport,
          timestamp: errorReport.timestamp.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send error report: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send error to remote service:', error);
      // Add back to queue for retry
      this.errorQueue.push(errorReport);
    }
  }

  private showUserNotification(errorReport: ErrorReport) {
    // Only show user-friendly messages for critical errors
    const userMessage = this.getUserFriendlyMessage(errorReport);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium">Something went wrong</div>
          <div class="text-sm opacity-90">${userMessage}</div>
        </div>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  private getUserFriendlyMessage(errorReport: ErrorReport): string {
    // Map technical errors to user-friendly messages
    const message = errorReport.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Please check your internet connection and try again.';
    }
    
    if (message.includes('auth') || message.includes('token')) {
      return 'Please sign in again to continue.';
    }
    
    if (message.includes('permission')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Please check your input and try again.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  private cleanupLocalErrors() {
    try {
      const errorKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(`${config.storage.prefix}error_`))
        .sort()
        .reverse(); // Most recent first
      
      // Remove old errors, keep only last 50
      if (errorKeys.length > 50) {
        const keysToRemove = errorKeys.slice(50);
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to cleanup local errors:', error);
    }
  }

  private flushErrorQueue() {
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    errors.forEach(error => {
      this.sendToRemote(error);
    });
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get stored errors for debugging
  public getStoredErrors(): ErrorReport[] {
    const errorKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`${config.storage.prefix}error_`));
    
    return errorKeys
      .map(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            return {
              ...parsed,
              timestamp: new Date(parsed.timestamp),
            };
          }
        } catch (error) {
          console.warn('Failed to parse stored error:', error);
        }
        return null;
      })
      .filter(Boolean) as ErrorReport[];
  }

  // Clear all stored errors
  public clearStoredErrors() {
    const errorKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`${config.storage.prefix}error_`));
    
    errorKeys.forEach(key => localStorage.removeItem(key));
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions for error handling
export const handleApiError = (error: any, context: ErrorContext = {}) => {
  if (error.response) {
    // HTTP error response
    const status = error.response.status;
    const data = error.response.data;
    
    const apiError = new Error(data?.message || `HTTP ${status} Error`);
    return errorHandler.logError(apiError, {
      ...context,
      metadata: {
        ...context.metadata,
        status,
        responseData: data,
      }
    });
  } else if (error.request) {
    // Network error
    const networkError = new Error('Network request failed');
    return errorHandler.logError(networkError, {
      ...context,
      action: 'NetworkError',
    });
  } else {
    // Other error
    return errorHandler.logError(error, context);
  }
};

export const handleAsyncError = <T>(
  asyncFn: () => Promise<T>,
  context: ErrorContext = {}
) => {
  return asyncFn().catch(error => {
    handleApiError(error, context);
    throw error; // Re-throw for component handling
  });
};

// React error boundary helper
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorId: string }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const errorId = errorHandler.logError(error, {
      component: 'ErrorBoundary',
      action: 'ComponentError',
      metadata: {
        componentStack: errorInfo.componentStack,
      }
    });
    
    this.setState({ errorId });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error && this.state.errorId) {
        const FallbackComponent = this.props.fallback;
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          errorId: this.state.errorId
        });
      }
      
      return React.createElement('div', {
        className: 'flex items-center justify-center min-h-screen bg-gray-50'
      }, React.createElement('div', {
        className: 'text-center'
      }, [
        React.createElement('h1', {
          key: 'title',
          className: 'text-xl font-semibold text-gray-900 mb-2'
        }, 'Something went wrong'),
        React.createElement('p', {
          key: 'message',
          className: 'text-gray-600 mb-4'
        }, "We've been notified and are working on a fix."),
        React.createElement('button', {
          key: 'reload',
          className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700',
          onClick: () => window.location.reload()
        }, 'Reload Page'),
        this.state.errorId && React.createElement('p', {
          key: 'errorId',
          className: 'text-xs text-gray-400 mt-2'
        }, `Error ID: ${this.state.errorId}`)
      ]));
    }

    return this.props.children;
  }
}

// Performance monitoring
export const performanceMonitor = {
  measurePageLoad: () => {
    if (!environment.isProduction) return;
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
        };
        
        errorHandler.logInfo('Page Performance Metrics', {
          component: 'Performance',
          action: 'PageLoad',
          metadata: metrics,
        });
      }, 0);
    });
  },

  measureUserInteraction: (action: string, startTime: number) => {
    const duration = performance.now() - startTime;
    
    if (duration > 100) { // Log slow interactions
      errorHandler.logWarning(`Slow user interaction: ${action}`, {
        component: 'Performance',
        action: 'SlowInteraction',
        metadata: { duration, action },
      });
    }
  },
};

// Initialize performance monitoring
if (environment.isProduction) {
  performanceMonitor.measurePageLoad();
}

export default errorHandler;
