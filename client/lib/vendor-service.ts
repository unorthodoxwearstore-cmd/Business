import { BusinessType } from '@shared/types';

export interface Vendor {
  id: string;
  name: string;
  companyName?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstNumber?: string;
  panNumber?: string;
  vendorType: 'raw_material' | 'finished_goods' | 'services' | 'equipment' | 'other';
  category: string;
  rating: number; // 1-5 stars
  isActive: boolean;
  isPreferred: boolean;
  creditLimit: number;
  paymentTerms: string; // e.g., "Net 30", "COD", "Advance"
  deliveryTerms: string;
  currency: string;
  website?: string;
  notes: string;
  tags: string[];
  businessTypes: BusinessType[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalOrderValue: number;
  averageDeliveryTime: number; // in days
  qualityScore: number; // 1-5
  priceCompetitiveness: number; // 1-5
}

export interface VendorProduct {
  id: string;
  vendorId: string;
  productName: string;
  productSku: string;
  vendorProductCode?: string;
  category: string;
  unitPrice: number;
  currency: string;
  unit: string; // kg, pieces, liters, etc.
  minimumOrderQuantity: number;
  leadTime: number; // in days
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
  description?: string;
  specifications?: string;
  isActive: boolean;
  lastUpdated: string;
  priceHistory: {
    date: string;
    price: number;
    updatedBy: string;
  }[];
}

export interface VendorOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'credit' | 'advance';
  items: {
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    receivedQuantity?: number;
    status: 'pending' | 'delivered' | 'partial' | 'cancelled';
  }[];
  shippingAddress: string;
  terms: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface VendorPerformance {
  vendorId: string;
  period: string; // YYYY-MM format
  ordersPlaced: number;
  ordersDelivered: number;
  onTimeDeliveries: number;
  averageDeliveryTime: number;
  qualityRating: number;
  communicationRating: number;
  overallRating: number;
  totalOrderValue: number;
  returnRate: number;
  defectRate: number;
  priceVariance: number; // percentage
  lastEvaluationDate: string;
  evaluatedBy: string;
  comments?: string;
}

export interface VendorContact {
  id: string;
  vendorId: string;
  name: string;
  designation: string;
  phone: string;
  email?: string;
  department: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

class VendorService {
  private readonly VENDORS_KEY = 'insygth_vendors';
  private readonly VENDOR_PRODUCTS_KEY = 'insygth_vendor_products';
  private readonly VENDOR_ORDERS_KEY = 'insygth_vendor_orders';
  private readonly VENDOR_PERFORMANCE_KEY = 'insygth_vendor_performance';
  private readonly VENDOR_CONTACTS_KEY = 'insygth_vendor_contacts';

  // Vendor Management
  getAllVendors(): Vendor[] {
    const vendors = localStorage.getItem(this.VENDORS_KEY);
    return vendors ? JSON.parse(vendors) : [];
  }

  getVendorById(id: string): Vendor | null {
    const vendors = this.getAllVendors();
    return vendors.find(vendor => vendor.id === id) || null;
  }

  addVendor(vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalOrderValue'>): { success: boolean; vendor?: Vendor; message: string } {
    try {
      const vendors = this.getAllVendors();
      
      // Check for duplicate vendors
      const existingVendor = vendors.find(v => 
        v.phone === vendorData.phone || 
        (vendorData.email && v.email === vendorData.email) ||
        (vendorData.gstNumber && v.gstNumber === vendorData.gstNumber)
      );
      
      if (existingVendor) {
        return { success: false, message: 'Vendor with this phone, email, or GST number already exists' };
      }

      const vendor: Vendor = {
        ...vendorData,
        id: Date.now().toString(),
        totalOrders: 0,
        totalOrderValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vendors.push(vendor);
      localStorage.setItem(this.VENDORS_KEY, JSON.stringify(vendors));
      
      return { success: true, vendor, message: 'Vendor added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add vendor' };
    }
  }

  updateVendor(id: string, updates: Partial<Vendor>): { success: boolean; vendor?: Vendor; message: string } {
    try {
      const vendors = this.getAllVendors();
      const index = vendors.findIndex(vendor => vendor.id === id);
      
      if (index === -1) {
        return { success: false, message: 'Vendor not found' };
      }

      const updatedVendor = {
        ...vendors[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      vendors[index] = updatedVendor;
      localStorage.setItem(this.VENDORS_KEY, JSON.stringify(vendors));
      
      return { success: true, vendor: updatedVendor, message: 'Vendor updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update vendor' };
    }
  }

  deleteVendor(id: string): { success: boolean; message: string } {
    try {
      const vendors = this.getAllVendors();
      const filteredVendors = vendors.filter(vendor => vendor.id !== id);
      
      localStorage.setItem(this.VENDORS_KEY, JSON.stringify(filteredVendors));
      
      // Also remove associated data
      this.removeVendorAssociatedData(id);
      
      return { success: true, message: 'Vendor deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to delete vendor' };
    }
  }

  private removeVendorAssociatedData(vendorId: string): void {
    // Remove vendor products
    const products = this.getAllVendorProducts();
    const filteredProducts = products.filter(product => product.vendorId !== vendorId);
    localStorage.setItem(this.VENDOR_PRODUCTS_KEY, JSON.stringify(filteredProducts));

    // Remove vendor contacts
    const contacts = this.getAllVendorContacts();
    const filteredContacts = contacts.filter(contact => contact.vendorId !== vendorId);
    localStorage.setItem(this.VENDOR_CONTACTS_KEY, JSON.stringify(filteredContacts));

    // Keep orders for historical records but mark vendor as deleted
    // Performance records are also kept for historical analysis
  }

  // Vendor Products Management
  getAllVendorProducts(): VendorProduct[] {
    const products = localStorage.getItem(this.VENDOR_PRODUCTS_KEY);
    return products ? JSON.parse(products) : [];
  }

  getVendorProducts(vendorId: string): VendorProduct[] {
    const products = this.getAllVendorProducts();
    return products.filter(product => product.vendorId === vendorId);
  }

  addVendorProduct(productData: Omit<VendorProduct, 'id' | 'lastUpdated' | 'priceHistory'>): { success: boolean; product?: VendorProduct; message: string } {
    try {
      const products = this.getAllVendorProducts();
      
      const product: VendorProduct = {
        ...productData,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString(),
        priceHistory: [{
          date: new Date().toISOString(),
          price: productData.unitPrice,
          updatedBy: productData.vendorId // This should be current user ID
        }]
      };

      products.push(product);
      localStorage.setItem(this.VENDOR_PRODUCTS_KEY, JSON.stringify(products));
      
      return { success: true, product, message: 'Vendor product added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add vendor product' };
    }
  }

  updateVendorProductPrice(productId: string, newPrice: number, updatedBy: string): { success: boolean; message: string } {
    try {
      const products = this.getAllVendorProducts();
      const index = products.findIndex(product => product.id === productId);
      
      if (index === -1) {
        return { success: false, message: 'Product not found' };
      }

      const product = products[index];
      
      // Add to price history
      product.priceHistory.push({
        date: new Date().toISOString(),
        price: newPrice,
        updatedBy
      });

      // Update current price
      product.unitPrice = newPrice;
      product.lastUpdated = new Date().toISOString();

      products[index] = product;
      localStorage.setItem(this.VENDOR_PRODUCTS_KEY, JSON.stringify(products));
      
      return { success: true, message: 'Product price updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update product price' };
    }
  }

  // Vendor Orders Management
  getAllVendorOrders(): VendorOrder[] {
    const orders = localStorage.getItem(this.VENDOR_ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
  }

  getVendorOrders(vendorId: string): VendorOrder[] {
    const orders = this.getAllVendorOrders();
    return orders.filter(order => order.vendorId === vendorId);
  }

  addVendorOrder(orderData: Omit<VendorOrder, 'id' | 'createdAt'>): { success: boolean; order?: VendorOrder; message: string } {
    try {
      const orders = this.getAllVendorOrders();
      
      const order: VendorOrder = {
        ...orderData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      orders.push(order);
      localStorage.setItem(this.VENDOR_ORDERS_KEY, JSON.stringify(orders));
      
      // Update vendor statistics
      this.updateVendorOrderStats(orderData.vendorId, orderData.totalAmount);
      
      return { success: true, order, message: 'Vendor order created successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to create vendor order' };
    }
  }

  updateOrderStatus(orderId: string, status: VendorOrder['status'], actualDeliveryDate?: string): { success: boolean; message: string } {
    try {
      const orders = this.getAllVendorOrders();
      const index = orders.findIndex(order => order.id === orderId);
      
      if (index === -1) {
        return { success: false, message: 'Order not found' };
      }

      orders[index].status = status;
      if (actualDeliveryDate) {
        orders[index].actualDeliveryDate = actualDeliveryDate;
      }

      localStorage.setItem(this.VENDOR_ORDERS_KEY, JSON.stringify(orders));
      
      // Update vendor performance if order is delivered
      if (status === 'delivered') {
        this.updateVendorPerformance(orders[index]);
      }
      
      return { success: true, message: 'Order status updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update order status' };
    }
  }

  private updateVendorOrderStats(vendorId: string, orderAmount: number): void {
    const vendors = this.getAllVendors();
    const index = vendors.findIndex(vendor => vendor.id === vendorId);
    
    if (index !== -1) {
      vendors[index].totalOrders += 1;
      vendors[index].totalOrderValue += orderAmount;
      vendors[index].lastOrderDate = new Date().toISOString();
      vendors[index].updatedAt = new Date().toISOString();
      
      localStorage.setItem(this.VENDORS_KEY, JSON.stringify(vendors));
    }
  }

  // Vendor Performance Tracking
  private updateVendorPerformance(order: VendorOrder): void {
    try {
      const performances = this.getAllVendorPerformance();
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      
      let performance = performances.find(p => p.vendorId === order.vendorId && p.period === currentMonth);
      
      if (!performance) {
        performance = {
          vendorId: order.vendorId,
          period: currentMonth,
          ordersPlaced: 0,
          ordersDelivered: 0,
          onTimeDeliveries: 0,
          averageDeliveryTime: 0,
          qualityRating: 5,
          communicationRating: 5,
          overallRating: 5,
          totalOrderValue: 0,
          returnRate: 0,
          defectRate: 0,
          priceVariance: 0,
          lastEvaluationDate: new Date().toISOString(),
          evaluatedBy: 'system'
        };
        performances.push(performance);
      }

      // Update performance metrics
      performance.ordersDelivered += 1;
      performance.totalOrderValue += order.totalAmount;

      // Calculate delivery time
      if (order.actualDeliveryDate) {
        const deliveryTime = Math.ceil(
          (new Date(order.actualDeliveryDate).getTime() - new Date(order.orderDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        const expectedDeliveryTime = Math.ceil(
          (new Date(order.expectedDeliveryDate).getTime() - new Date(order.orderDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        );

        // Update average delivery time
        performance.averageDeliveryTime = 
          (performance.averageDeliveryTime * (performance.ordersDelivered - 1) + deliveryTime) / 
          performance.ordersDelivered;

        // Check if delivered on time
        if (deliveryTime <= expectedDeliveryTime) {
          performance.onTimeDeliveries += 1;
        }
      }

      performance.lastEvaluationDate = new Date().toISOString();
      
      localStorage.setItem(this.VENDOR_PERFORMANCE_KEY, JSON.stringify(performances));
    } catch (error) {
      console.error('Failed to update vendor performance:', error);
    }
  }

  getAllVendorPerformance(): VendorPerformance[] {
    const performance = localStorage.getItem(this.VENDOR_PERFORMANCE_KEY);
    return performance ? JSON.parse(performance) : [];
  }

  getVendorPerformance(vendorId: string): VendorPerformance[] {
    const performances = this.getAllVendorPerformance();
    return performances.filter(performance => performance.vendorId === vendorId)
                     .sort((a, b) => b.period.localeCompare(a.period));
  }

  // Vendor Contacts Management
  getAllVendorContacts(): VendorContact[] {
    const contacts = localStorage.getItem(this.VENDOR_CONTACTS_KEY);
    return contacts ? JSON.parse(contacts) : [];
  }

  getVendorContacts(vendorId: string): VendorContact[] {
    const contacts = this.getAllVendorContacts();
    return contacts.filter(contact => contact.vendorId === vendorId);
  }

  addVendorContact(contactData: Omit<VendorContact, 'id' | 'createdAt'>): { success: boolean; contact?: VendorContact; message: string } {
    try {
      const contacts = this.getAllVendorContacts();
      
      const contact: VendorContact = {
        ...contactData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      contacts.push(contact);
      localStorage.setItem(this.VENDOR_CONTACTS_KEY, JSON.stringify(contacts));
      
      return { success: true, contact, message: 'Vendor contact added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add vendor contact' };
    }
  }

  // Search and Analytics
  searchVendors(query: string, filters?: {
    vendorType?: string;
    category?: string;
    isActive?: boolean;
    isPreferred?: boolean;
    businessTypes?: BusinessType[];
    rating?: number;
  }): Vendor[] {
    const vendors = this.getAllVendors();
    
    return vendors.filter(vendor => {
      // Text search
      const matchesSearch = query === '' || 
        vendor.name.toLowerCase().includes(query.toLowerCase()) ||
        vendor.companyName?.toLowerCase().includes(query.toLowerCase()) ||
        vendor.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
        vendor.phone.includes(query) ||
        vendor.email?.toLowerCase().includes(query.toLowerCase());

      // Filter by vendor type
      const matchesType = !filters?.vendorType || vendor.vendorType === filters.vendorType;

      // Filter by category
      const matchesCategory = !filters?.category || vendor.category === filters.category;

      // Filter by active status
      const matchesActive = filters?.isActive === undefined || vendor.isActive === filters.isActive;

      // Filter by preferred status
      const matchesPreferred = filters?.isPreferred === undefined || vendor.isPreferred === filters.isPreferred;

      // Filter by business types
      const matchesBusinessTypes = !filters?.businessTypes?.length || 
        filters.businessTypes.some(type => vendor.businessTypes.includes(type));

      // Filter by rating
      const matchesRating = !filters?.rating || vendor.rating >= filters.rating;

      return matchesSearch && matchesType && matchesCategory && 
             matchesActive && matchesPreferred && matchesBusinessTypes && matchesRating;
    });
  }

  getVendorAnalytics(): {
    totalVendors: number;
    activeVendors: number;
    preferredVendors: number;
    vendorsByType: { type: string; count: number }[];
    vendorsByRating: { rating: number; count: number }[];
    topVendorsByOrderValue: { vendor: Vendor; totalValue: number }[];
    averageRating: number;
    totalOrderValue: number;
    onTimeDeliveryRate: number;
  } {
    const vendors = this.getAllVendors();
    const orders = this.getAllVendorOrders();
    const performances = this.getAllVendorPerformance();

    const activeVendors = vendors.filter(vendor => vendor.isActive).length;
    const preferredVendors = vendors.filter(vendor => vendor.isPreferred).length;

    // Vendors by type
    const typeCount: { [key: string]: number } = {};
    vendors.forEach(vendor => {
      typeCount[vendor.vendorType] = (typeCount[vendor.vendorType] || 0) + 1;
    });
    const vendorsByType = Object.entries(typeCount).map(([type, count]) => ({ type, count }));

    // Vendors by rating
    const ratingCount: { [key: number]: number } = {};
    vendors.forEach(vendor => {
      ratingCount[vendor.rating] = (ratingCount[vendor.rating] || 0) + 1;
    });
    const vendorsByRating = Object.entries(ratingCount).map(([rating, count]) => ({ 
      rating: parseInt(rating), 
      count 
    }));

    // Top vendors by order value
    const topVendorsByOrderValue = vendors
      .map(vendor => ({
        vendor,
        totalValue: vendor.totalOrderValue
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Average rating
    const averageRating = vendors.length > 0 ? 
      vendors.reduce((sum, vendor) => sum + vendor.rating, 0) / vendors.length : 0;

    // Total order value
    const totalOrderValue = vendors.reduce((sum, vendor) => sum + vendor.totalOrderValue, 0);

    // On-time delivery rate
    const totalDeliveries = performances.reduce((sum, perf) => sum + perf.ordersDelivered, 0);
    const onTimeDeliveries = performances.reduce((sum, perf) => sum + perf.onTimeDeliveries, 0);
    const onTimeDeliveryRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    return {
      totalVendors: vendors.length,
      activeVendors,
      preferredVendors,
      vendorsByType,
      vendorsByRating,
      topVendorsByOrderValue,
      averageRating,
      totalOrderValue,
      onTimeDeliveryRate
    };
  }

  // Business type specific vendors
  getVendorsForBusinessType(businessType: BusinessType): Vendor[] {
    const vendors = this.getAllVendors();
    return vendors.filter(vendor => 
      vendor.isActive && vendor.businessTypes.includes(businessType)
    );
  }

  // Vendor comparison
  compareVendors(vendorIds: string[]): {
    vendors: Vendor[];
    comparison: {
      rating: { vendorId: string; value: number }[];
      priceCompetitiveness: { vendorId: string; value: number }[];
      qualityScore: { vendorId: string; value: number }[];
      averageDeliveryTime: { vendorId: string; value: number }[];
      totalOrderValue: { vendorId: string; value: number }[];
    };
  } {
    const vendors = this.getAllVendors().filter(vendor => vendorIds.includes(vendor.id));
    
    const comparison = {
      rating: vendors.map(vendor => ({ vendorId: vendor.id, value: vendor.rating })),
      priceCompetitiveness: vendors.map(vendor => ({ vendorId: vendor.id, value: vendor.priceCompetitiveness })),
      qualityScore: vendors.map(vendor => ({ vendorId: vendor.id, value: vendor.qualityScore })),
      averageDeliveryTime: vendors.map(vendor => ({ vendorId: vendor.id, value: vendor.averageDeliveryTime })),
      totalOrderValue: vendors.map(vendor => ({ vendorId: vendor.id, value: vendor.totalOrderValue }))
    };

    return { vendors, comparison };
  }
}

export const vendorService = new VendorService();
