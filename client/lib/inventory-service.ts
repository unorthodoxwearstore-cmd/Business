import { BusinessType } from '@shared/types';

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  productId: string;
  quantity: number;
  expiryDate?: string;
  manufacturedDate?: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'expired' | 'recalled' | 'sold_out';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  unit: string;
  trackBatches: boolean;
  hasExpiry: boolean;
  minimumStock: number;
  maximumStock?: number;
  defaultCostPrice: number;
  defaultSellingPrice: number;
  gstRate: number;
  hsnCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  batchId?: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'expired' | 'damaged';
  quantity: number;
  reason: string;
  reference?: string; // Invoice number, PO number, etc.
  userId: string;
  userName: string;
  timestamp: string;
}

export interface ExpiryAlert {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  daysToExpiry: number;
  alertLevel: 'warning' | 'critical' | 'expired';
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface InventoryConfig {
  expiryAlertDays: {
    warning: number; // Days before expiry to show warning
    critical: number; // Days before expiry to show critical alert
  };
  lowStockMultiplier: number; // Multiply minimum stock by this for low stock alerts
  enableAutoExpiry: boolean; // Automatically mark expired batches
  enableExpiryNotifications: boolean;
  trackCostPriceVariations: boolean;
}

class InventoryService {
  private products: Product[] = [];
  private batches: InventoryBatch[] = [];
  private stockMovements: StockMovement[] = [];
  private expiryAlerts: ExpiryAlert[] = [];
  private config: InventoryConfig;

  constructor() {
    this.loadConfig();
    this.loadData();
    this.generateSampleData();
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('inventory_config');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    } else {
      this.config = {
        expiryAlertDays: {
          warning: 30,
          critical: 7
        },
        lowStockMultiplier: 1.5,
        enableAutoExpiry: true,
        enableExpiryNotifications: true,
        trackCostPriceVariations: true
      };
      this.saveConfig();
    }
  }

  private loadData(): void {
    const savedProducts = localStorage.getItem('inventory_products');
    const savedBatches = localStorage.getItem('inventory_batches');
    const savedMovements = localStorage.getItem('inventory_movements');
    const savedAlerts = localStorage.getItem('inventory_expiry_alerts');

    if (savedProducts) this.products = JSON.parse(savedProducts);
    if (savedBatches) this.batches = JSON.parse(savedBatches);
    if (savedMovements) this.stockMovements = JSON.parse(savedMovements);
    if (savedAlerts) this.expiryAlerts = JSON.parse(savedAlerts);
  }

  private saveConfig(): void {
    localStorage.setItem('inventory_config', JSON.stringify(this.config));
  }

  private saveData(): void {
    localStorage.setItem('inventory_products', JSON.stringify(this.products));
    localStorage.setItem('inventory_batches', JSON.stringify(this.batches));
    localStorage.setItem('inventory_movements', JSON.stringify(this.stockMovements));
    localStorage.setItem('inventory_expiry_alerts', JSON.stringify(this.expiryAlerts));
  }

  private generateSampleData(): void {
    // Sample data generation removed for production
    if (false && this.products.length === 0) {
      const now = new Date();
      
      // Sample products
      const sampleProducts: Product[] = [
        {
          id: 'prod_001',
          name: 'Organic Rice - Basmati',
          sku: 'RICE-BAS-ORG-001',
          category: 'Grains',
          description: 'Premium organic basmati rice',
          unit: 'kg',
          trackBatches: true,
          hasExpiry: true,
          minimumStock: 100,
          maximumStock: 1000,
          defaultCostPrice: 80,
          defaultSellingPrice: 120,
          gstRate: 5,
          hsnCode: '1006',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_002',
          name: 'Milk Powder - Full Cream',
          sku: 'MILK-PWD-FC-001',
          category: 'Dairy',
          description: 'Full cream milk powder',
          unit: 'kg',
          trackBatches: true,
          hasExpiry: true,
          minimumStock: 50,
          maximumStock: 500,
          defaultCostPrice: 300,
          defaultSellingPrice: 450,
          gstRate: 12,
          hsnCode: '0402',
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_003',
          name: 'Steel Pipe - 2 inch',
          sku: 'PIPE-STL-2IN-001',
          category: 'Hardware',
          description: '2 inch steel pipe for construction',
          unit: 'piece',
          trackBatches: true,
          hasExpiry: false,
          minimumStock: 20,
          maximumStock: 200,
          defaultCostPrice: 250,
          defaultSellingPrice: 350,
          gstRate: 18,
          hsnCode: '7306',
          createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Sample batches
      const sampleBatches: InventoryBatch[] = [
        {
          id: 'batch_001',
          batchNumber: 'RICE-001-240101',
          productId: 'prod_001',
          quantity: 250,
          expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 45 days
          manufacturedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          supplierName: 'Organic Farms Ltd',
          costPrice: 78,
          sellingPrice: 120,
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'batch_002',
          batchNumber: 'RICE-002-240110',
          productId: 'prod_001',
          quantity: 180,
          expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 5 days (critical)
          manufacturedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          supplierName: 'Organic Farms Ltd',
          costPrice: 82,
          sellingPrice: 120,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'batch_003',
          batchNumber: 'MILK-001-240105',
          productId: 'prod_002',
          quantity: 85,
          expiryDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 20 days (warning)
          manufacturedDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          supplierName: 'Dairy Co-op',
          costPrice: 295,
          sellingPrice: 450,
          createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'batch_004',
          batchNumber: 'PIPE-001-240108',
          productId: 'prod_003',
          quantity: 75,
          manufacturedDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          supplierName: 'Steel Industries',
          costPrice: 245,
          sellingPrice: 350,
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        }
      ];

      this.products = sampleProducts;
      this.batches = sampleBatches;
      this.saveData();
    }

    // Generate expiry alerts
    this.checkAndGenerateExpiryAlerts();
  }

  public getConfig(): InventoryConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<InventoryConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    // Regenerate alerts with new config
    this.checkAndGenerateExpiryAlerts();
  }

  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProductById(productId: string): Product | undefined {
    return this.products.find(p => p.id === productId);
  }

  public getBatches(productId?: string): InventoryBatch[] {
    let batches = [...this.batches];
    if (productId) {
      batches = batches.filter(b => b.productId === productId);
    }
    return batches.sort((a, b) => new Date(a.expiryDate || '9999-12-31').getTime() - new Date(b.expiryDate || '9999-12-31').getTime());
  }

  public getBatchById(batchId: string): InventoryBatch | undefined {
    return this.batches.find(b => b.id === batchId);
  }

  public addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.products.push(newProduct);
    this.saveData();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>): boolean {
    const productIndex = this.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return false;
    
    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveData();
    return true;
  }

  public addBatch(batch: Omit<InventoryBatch, 'id' | 'createdAt' | 'updatedAt'>): InventoryBatch {
    const newBatch: InventoryBatch = {
      ...batch,
      id: `batch_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.batches.push(newBatch);
    
    // Record stock movement
    this.recordStockMovement({
      productId: batch.productId,
      batchId: newBatch.id,
      type: 'in',
      quantity: batch.quantity,
      reason: 'New batch added',
      reference: `Batch: ${batch.batchNumber}`,
      userId: 'current_user',
      userName: 'Current User'
    });
    
    this.saveData();
    this.checkAndGenerateExpiryAlerts();
    return newBatch;
  }

  public updateBatch(batchId: string, updates: Partial<InventoryBatch>): boolean {
    const batchIndex = this.batches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) return false;
    
    const oldBatch = this.batches[batchIndex];
    const newBatch = {
      ...oldBatch,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Record quantity changes as stock movements
    if (updates.quantity !== undefined && updates.quantity !== oldBatch.quantity) {
      const quantityDiff = updates.quantity - oldBatch.quantity;
      this.recordStockMovement({
        productId: oldBatch.productId,
        batchId: batchId,
        type: quantityDiff > 0 ? 'in' : 'out',
        quantity: Math.abs(quantityDiff),
        reason: 'Batch quantity adjustment',
        reference: `Batch: ${oldBatch.batchNumber}`,
        userId: 'current_user',
        userName: 'Current User'
      });
    }
    
    this.batches[batchIndex] = newBatch;
    this.saveData();
    this.checkAndGenerateExpiryAlerts();
    return true;
  }

  public recordStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): StockMovement {
    const newMovement: StockMovement = {
      ...movement,
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    this.stockMovements.unshift(newMovement);
    
    // Keep only last 1000 movements
    if (this.stockMovements.length > 1000) {
      this.stockMovements = this.stockMovements.slice(0, 1000);
    }
    
    this.saveData();
    return newMovement;
  }

  public getStockMovements(productId?: string, batchId?: string): StockMovement[] {
    let movements = [...this.stockMovements];
    
    if (productId) {
      movements = movements.filter(m => m.productId === productId);
    }
    
    if (batchId) {
      movements = movements.filter(m => m.batchId === batchId);
    }
    
    return movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getCurrentStock(productId: string): { totalQuantity: number; batches: InventoryBatch[] } {
    const productBatches = this.getBatches(productId).filter(b => b.status === 'active' && b.quantity > 0);
    const totalQuantity = productBatches.reduce((sum, batch) => sum + batch.quantity, 0);
    
    return {
      totalQuantity,
      batches: productBatches
    };
  }

  public checkAndGenerateExpiryAlerts(): ExpiryAlert[] {
    if (!this.config.enableExpiryNotifications) return [];
    
    const now = new Date();
    const newAlerts: ExpiryAlert[] = [];
    
    // Clear existing alerts for regeneration
    this.expiryAlerts = this.expiryAlerts.filter(alert => alert.acknowledged);
    
    this.batches
      .filter(batch => batch.hasExpiry && batch.expiryDate && batch.status === 'active' && batch.quantity > 0)
      .forEach(batch => {
        const expiryDate = new Date(batch.expiryDate!);
        const daysToExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let alertLevel: 'warning' | 'critical' | 'expired' | null = null;
        
        if (daysToExpiry < 0) {
          alertLevel = 'expired';
          // Auto-expire if enabled
          if (this.config.enableAutoExpiry) {
            batch.status = 'expired';
          }
        } else if (daysToExpiry <= this.config.expiryAlertDays.critical) {
          alertLevel = 'critical';
        } else if (daysToExpiry <= this.config.expiryAlertDays.warning) {
          alertLevel = 'warning';
        }
        
        if (alertLevel) {
          const product = this.getProductById(batch.productId);
          if (product) {
            const alert: ExpiryAlert = {
              id: `alert_${batch.id}_${Date.now()}`,
              productId: batch.productId,
              productName: product.name,
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              quantity: batch.quantity,
              expiryDate: batch.expiryDate!,
              daysToExpiry,
              alertLevel,
              acknowledged: false
            };
            
            newAlerts.push(alert);
          }
        }
      });
    
    this.expiryAlerts.push(...newAlerts);
    this.saveData();
    
    return newAlerts;
  }

  public getExpiryAlerts(acknowledged?: boolean): ExpiryAlert[] {
    let alerts = [...this.expiryAlerts];
    
    if (acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === acknowledged);
    }
    
    return alerts.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }

  public acknowledgeExpiryAlert(alertId: string, userId: string, userName: string): boolean {
    const alert = this.expiryAlerts.find(a => a.id === alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = userName;
    
    this.saveData();
    return true;
  }

  public getLowStockProducts(): { product: Product; currentStock: number; requiredStock: number }[] {
    const lowStockProducts: { product: Product; currentStock: number; requiredStock: number }[] = [];
    
    this.products.forEach(product => {
      const { totalQuantity } = this.getCurrentStock(product.id);
      const requiredStock = Math.ceil(product.minimumStock * this.config.lowStockMultiplier);
      
      if (totalQuantity <= requiredStock) {
        lowStockProducts.push({
          product,
          currentStock: totalQuantity,
          requiredStock
        });
      }
    });
    
    return lowStockProducts.sort((a, b) => (a.currentStock / a.requiredStock) - (b.currentStock / b.requiredStock));
  }

  public getExpiringProducts(days: number = 30): { product: Product; batch: InventoryBatch; daysToExpiry: number }[] {
    const now = new Date();
    const expiringProducts: { product: Product; batch: InventoryBatch; daysToExpiry: number }[] = [];
    
    this.batches
      .filter(batch => batch.expiryDate && batch.status === 'active' && batch.quantity > 0)
      .forEach(batch => {
        const expiryDate = new Date(batch.expiryDate!);
        const daysToExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry <= days && daysToExpiry >= 0) {
          const product = this.getProductById(batch.productId);
          if (product) {
            expiringProducts.push({
              product,
              batch,
              daysToExpiry
            });
          }
        }
      });
    
    return expiringProducts.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }

  public sellFromBatch(batchId: string, quantity: number, reason: string = 'Sale'): boolean {
    const batch = this.getBatchById(batchId);
    if (!batch || batch.quantity < quantity) return false;
    
    batch.quantity -= quantity;
    batch.updatedAt = new Date().toISOString();
    
    if (batch.quantity === 0) {
      batch.status = 'sold_out';
    }
    
    this.recordStockMovement({
      productId: batch.productId,
      batchId: batchId,
      type: 'out',
      quantity,
      reason,
      userId: 'current_user',
      userName: 'Current User'
    });
    
    this.saveData();
    return true;
  }
}

export const inventoryService = new InventoryService();
