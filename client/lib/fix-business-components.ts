import { dataManager } from './data-manager';
import { useToast } from '@/hooks/use-toast';

/**
 * Common functionality fixes for business components:
 * 1. Remove mock data
 * 2. Load real data from dataManager
 * 3. Add proper error handling
 * 4. Ensure consistent UI patterns
 */

export const useBusinessData = () => {
  const { toast } = useToast();

  const showSuccessToast = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "default"
    });
  };

  const showErrorToast = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive"
    });
  };

  const handleDataOperation = async (operation: () => Promise<any> | any, successMessage: string) => {
    try {
      const result = await operation();
      showSuccessToast("Success", successMessage);
      return result;
    } catch (error) {
      console.error('Data operation failed:', error);
      showErrorToast("Error", "Operation failed. Please try again.");
      throw error;
    }
  };

  return {
    showSuccessToast,
    showErrorToast,
    handleDataOperation,
    dataManager
  };
};

// Common empty state configurations
export const getEmptyStateConfig = (type: 'customers' | 'products' | 'orders' | 'staff' | 'inventory') => {
  const configs = {
    customers: {
      title: 'No Customers Yet',
      description: 'Start building your customer database by adding your first customer.',
      actionText: 'Add First Customer',
      actionHref: null
    },
    products: {
      title: 'No Products Available',
      description: 'Add products to inventory to start selling.',
      actionText: 'Add Products',
      actionHref: '/dashboard/products'
    },
    orders: {
      title: 'No Orders Yet',
      description: 'Orders will appear here once customers start purchasing.',
      actionText: 'View Products',
      actionHref: '/dashboard/products'
    },
    staff: {
      title: 'No Staff Members',
      description: 'Add team members to manage your business operations.',
      actionText: 'Add Staff Member',
      actionHref: '/dashboard/staff'
    },
    inventory: {
      title: 'No Inventory Items',
      description: 'Add products to track inventory levels and stock alerts.',
      actionText: 'Add Product',
      actionHref: '/dashboard/products'
    }
  };

  return configs[type];
};

// Common access denied configuration
export const getAccessDeniedConfig = (feature: string) => ({
  title: 'Access Restricted',
  message: `You don't have permission to access ${feature}.`
});

export default useBusinessData;
