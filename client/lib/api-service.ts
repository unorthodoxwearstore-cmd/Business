// API service layer ready for Firebase integration
import { firebaseService, FIREBASE_COLLECTIONS } from './firebase-service';

// Generic API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Base API service class
class BaseApiService {
  protected businessId: string = '';

  setBusiness(businessId: string) {
    this.businessId = businessId;
  }

  protected async handleApiCall<T>(
    operation: () => Promise<T>,
    errorMessage = 'Operation failed'
  ): Promise<ApiResponse<T>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error: any) {
      // Log errors to proper error tracking service in production
      return {
        success: false,
        error: error.message || errorMessage
      };
    }
  }
}

// Manufacturer API Service
export class ManufacturerApiService extends BaseApiService {
  // Raw Materials API
  async getRawMaterials(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return []; // Return empty array when Firebase not connected
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.rawMaterials(this.businessId));
    }, 'Failed to fetch raw materials');
  }

  async createRawMaterial(material: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.rawMaterials(this.businessId), material);
    }, 'Failed to create raw material');
  }

  async updateRawMaterial(materialId: string, updates: any): Promise<ApiResponse<void>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.updateDocument(FIREBASE_COLLECTIONS.rawMaterials(this.businessId), materialId, updates);
    }, 'Failed to update raw material');
  }

  async deleteRawMaterial(materialId: string): Promise<ApiResponse<void>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.deleteDocument(FIREBASE_COLLECTIONS.rawMaterials(this.businessId), materialId);
    }, 'Failed to delete raw material');
  }

  // Recipes API
  async getRecipes(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.recipes(this.businessId));
    }, 'Failed to fetch recipes');
  }

  async createRecipe(recipe: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.recipes(this.businessId), recipe);
    }, 'Failed to create recipe');
  }

  async updateRecipe(recipeId: string, updates: any): Promise<ApiResponse<void>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.updateDocument(FIREBASE_COLLECTIONS.recipes(this.businessId), recipeId, updates);
    }, 'Failed to update recipe');
  }

  // Production Orders API
  async getProductionOrders(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.productionOrders(this.businessId));
    }, 'Failed to fetch production orders');
  }

  async createProductionOrder(order: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.productionOrders(this.businessId), order);
    }, 'Failed to create production order');
  }

  // Production Logs API
  async getProductionLogs(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.productionLogs(this.businessId));
    }, 'Failed to fetch production logs');
  }

  async createProductionLog(log: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.productionLogs(this.businessId), log);
    }, 'Failed to create production log');
  }
}

// Retailer API Service
export class RetailerApiService extends BaseApiService {
  // Products API
  async getProducts(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.products(this.businessId));
    }, 'Failed to fetch products');
  }

  async createProduct(product: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.products(this.businessId), product);
    }, 'Failed to create product');
  }

  // Customers API
  async getCustomers(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.customers(this.businessId));
    }, 'Failed to fetch customers');
  }

  async createCustomer(customer: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.customers(this.businessId), customer);
    }, 'Failed to create customer');
  }

  // Orders API
  async getOrders(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.orders(this.businessId));
    }, 'Failed to fetch orders');
  }

  async createOrder(order: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.orders(this.businessId), order);
    }, 'Failed to create order');
  }
}

// Wholesaler API Service  
export class WholesalerApiService extends BaseApiService {
  // Parties API
  async getParties(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.parties(this.businessId));
    }, 'Failed to fetch parties');
  }

  async createParty(party: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.parties(this.businessId), party);
    }, 'Failed to create party');
  }

  // Inventory API
  async getInventory(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.inventory(this.businessId));
    }, 'Failed to fetch inventory');
  }

  // Invoices API
  async getInvoices(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.invoices(this.businessId));
    }, 'Failed to fetch invoices');
  }

  async createInvoice(invoice: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.invoices(this.businessId), invoice);
    }, 'Failed to create invoice');
  }
}

// Service Business API Service
export class ServiceApiService extends BaseApiService {
  // Services API
  async getServices(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.services(this.businessId));
    }, 'Failed to fetch services');
  }

  async createService(service: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.services(this.businessId), service);
    }, 'Failed to create service');
  }

  // Bookings API
  async getBookings(): Promise<ApiResponse<any[]>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return [];
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.bookings(this.businessId));
    }, 'Failed to fetch bookings');
  }

  async createBooking(booking: any): Promise<ApiResponse<string>> {
    return this.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.createDocument(FIREBASE_COLLECTIONS.bookings(this.businessId), booking);
    }, 'Failed to create booking');
  }
}

// Main API service that provides access to all business type services
export class ApiService {
  private static instance: ApiService;
  private currentBusinessId: string = '';

  public manufacturer = new ManufacturerApiService();
  public retailer = new RetailerApiService();
  public wholesaler = new WholesalerApiService();
  public service = new ServiceApiService();

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Set the business context for all API calls
  setBusiness(businessId: string, businessType: string) {
    this.currentBusinessId = businessId;
    
    // Set business ID for all service instances
    this.manufacturer.setBusiness(businessId);
    this.retailer.setBusiness(businessId);
    this.wholesaler.setBusiness(businessId);
    this.service.setBusiness(businessId);
  }

  getCurrentBusinessId(): string {
    return this.currentBusinessId;
  }

  // Analytics API (common across all business types)
  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.manufacturer.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return {
          revenue: 0,
          orders: 0,
          customers: 0,
          growth: 0,
          trends: []
        };
      }
      return firebaseService.getCollection(FIREBASE_COLLECTIONS.analytics(this.currentBusinessId));
    }, 'Failed to fetch analytics');
  }

  // Settings API (common across all business types)
  async getSettings(): Promise<ApiResponse<any>> {
    return this.manufacturer.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        return {};
      }
      const settings = await firebaseService.getCollection(FIREBASE_COLLECTIONS.settings(this.currentBusinessId));
      return settings.length > 0 ? settings[0] : {};
    }, 'Failed to fetch settings');
  }

  async updateSettings(settings: any): Promise<ApiResponse<void>> {
    return this.manufacturer.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      
      // Try to get existing settings first
      const existingSettings = await this.getSettings();
      if (existingSettings.success && existingSettings.data?.id) {
        return firebaseService.updateDocument(FIREBASE_COLLECTIONS.settings(this.currentBusinessId), existingSettings.data.id, settings);
      } else {
        await firebaseService.createDocument(FIREBASE_COLLECTIONS.settings(this.currentBusinessId), settings);
      }
    }, 'Failed to update settings');
  }

  // AI Assistant API
  async configureAI(apiKey: string): Promise<ApiResponse<boolean>> {
    return this.manufacturer.handleApiCall(async () => {
      if (!firebaseService.isReady()) {
        throw new Error('Database not connected. Connect Firebase to save data.');
      }
      return firebaseService.configureAIAssistant(apiKey, this.currentBusinessId);
    }, 'Failed to configure AI assistant');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; firebase: boolean }>> {
    return this.manufacturer.handleApiCall(async () => {
      return {
        status: 'healthy',
        firebase: firebaseService.isReady()
      };
    }, 'Health check failed');
  }
}

// Export the singleton instance
export const apiService = ApiService.getInstance();

// React hooks for API integration (ready for use in components)
export function useApiService(businessId?: string, businessType?: string) {
  const api = ApiService.getInstance();
  
  if (businessId && businessType) {
    api.setBusiness(businessId, businessType);
  }
  
  return api;
}

// Export individual services for direct use
export { 
  ManufacturerApiService, 
  RetailerApiService, 
  WholesalerApiService, 
  ServiceApiService 
};
