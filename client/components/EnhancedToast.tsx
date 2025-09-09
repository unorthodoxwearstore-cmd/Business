import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X,
  Undo,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ToastAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  icon?: React.ReactNode;
}

export interface EnhancedToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
  actions?: ToastAction[];
  persistent?: boolean;
  showIcon?: boolean;
  onUndo?: () => void;
  metadata?: Record<string, any>;
}

class EnhancedToastService {
  private toastHook: any = null;

  setToastHook(hook: any) {
    this.toastHook = hook;
  }

  show(options: EnhancedToastOptions) {
    if (!this.toastHook) return;

    const { title, description, variant = 'default', actions, onUndo, showIcon = true } = options;

    const getIcon = () => {
      if (!showIcon) return null;
      
      switch (variant) {
        case 'success':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'warning':
          return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
        case 'destructive':
          return <XCircle className="w-4 h-4 text-red-600" />;
        case 'info':
          return <Info className="w-4 h-4 text-blue-600" />;
        default:
          return <CheckCircle className="w-4 h-4 text-gray-600" />;
      }
    };

    const getVariantClass = () => {
      switch (variant) {
        case 'success':
          return 'border-green-200 bg-green-50 text-green-900';
        case 'warning':
          return 'border-yellow-200 bg-yellow-50 text-yellow-900';
        case 'destructive':
          return 'border-red-200 bg-red-50 text-red-900';
        case 'info':
          return 'border-blue-200 bg-blue-50 text-blue-900';
        default:
          return 'border-gray-200 bg-white text-gray-900';
      }
    };

    this.toastHook({
      title: (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium">{title}</span>
        </div>
      ),
      description: description && (
        <div className="mt-1">
          <p className="text-sm">{description}</p>
          {(actions || onUndo) && (
            <div className="flex items-center gap-2 mt-3">
              {onUndo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUndo}
                  className="h-8 text-xs"
                >
                  <Undo className="w-3 h-3 mr-1" />
                  Undo
                </Button>
              )}
              {actions?.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.action}
                  className="h-8 text-xs"
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ),
      duration: options.persistent ? Infinity : (options.duration || 5000),
      className: `border ${getVariantClass()}`
    });
  }

  success(title: string, description?: string, actions?: ToastAction[]) {
    this.show({ title, description, variant: 'success', actions });
  }

  error(title: string, description?: string, actions?: ToastAction[]) {
    this.show({ title, description, variant: 'destructive', actions });
  }

  warning(title: string, description?: string, actions?: ToastAction[]) {
    this.show({ title, description, variant: 'warning', actions });
  }

  info(title: string, description?: string, actions?: ToastAction[]) {
    this.show({ title, description, variant: 'info', actions });
  }

  // Specialized toast methods
  bulkAction(count: number, action: string, onUndo?: () => void) {
    this.show({
      title: `${count} items ${action}`,
      description: `Successfully ${action} ${count} product${count > 1 ? 's' : ''}`,
      variant: 'success',
      onUndo,
      actions: onUndo ? undefined : [
        {
          label: 'View Details',
          action: () => console.log('View details'),
          icon: <ExternalLink className="w-3 h-3" />
        }
      ]
    });
  }

  saving(title: string = 'Saving changes...') {
    this.show({
      title,
      variant: 'info',
      persistent: true,
      showIcon: true
    });
  }

  saved(title: string = 'Changes saved', onUndo?: () => void) {
    this.show({
      title,
      description: 'Your changes have been saved successfully',
      variant: 'success',
      onUndo
    });
  }

  networkError(retry?: () => void) {
    this.show({
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
      variant: 'destructive',
      persistent: true,
      actions: retry ? [
        {
          label: 'Retry',
          action: retry,
          icon: <RotateCcw className="w-3 h-3" />
        }
      ] : undefined
    });
  }

  permissionDenied(action: string) {
    this.show({
      title: 'Permission Denied',
      description: `You don't have permission to ${action}. Contact your administrator.`,
      variant: 'warning',
      duration: 8000
    });
  }
}

export const enhancedToast = new EnhancedToastService();

// Hook to initialize the service
export function useEnhancedToast() {
  const { toast } = useToast();
  
  React.useEffect(() => {
    enhancedToast.setToastHook(toast);
  }, [toast]);

  return enhancedToast;
}
