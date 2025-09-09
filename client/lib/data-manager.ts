import { authService } from './auth-service';
import { invoiceService } from './invoice-service';
import { BusinessType, UserRole } from '@shared/types';

// Central data types for cross-module connectivity
export interface BusinessMetrics {
  totalRevenue: number;
  totalSales: number;
  pendingAmount: number;
  activeOrders: number;
  completedOrders: number;
  teamMembers: number;
  activeTasks: number;
  inventoryValue: number;
  lowStockItems: number;
  todaySales: number;
  monthlyGrowth: number;
  customerCount: number;
  productCount: number;
}

export interface SaleRecord {
  id: string;
  invoiceId?: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  tax: number;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  businessType: BusinessType;
  date: string;
  products?: ProductSale[];
  createdBy: string;
  commission?: number;
}

export interface ProductSale {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  businessTypes: BusinessType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
  loyaltyPoints?: number;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email?: string;
  joinDate: string;
  isActive: boolean;
  totalSales?: number;
  commissionEarned?: number;
  tasksCompleted?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  products: ProductSale[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
  createdBy: string;
}

class DataManager {
  private storagePrefix = 'hisaabb_';

  // Storage keys
  private keys = {
    sales: `${this.storagePrefix}sales`,
    products: `${this.storagePrefix}products`,
    customers: `${this.storagePrefix}customers`,
    staff: `${this.storagePrefix}staff`,
    tasks: `${this.storagePrefix}tasks`,
    orders: `${this.storagePrefix}orders`,
    metrics: `${this.storagePrefix}metrics`
  };

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Initialize empty arrays if no data exists
    if (!localStorage.getItem(this.keys.sales)) {
      this.saveSales([]);
    }
    if (!localStorage.getItem(this.keys.products)) {
      this.saveProducts([]);
    }
    if (!localStorage.getItem(this.keys.customers)) {
      this.saveCustomers([]);
    }
    if (!localStorage.getItem(this.keys.staff)) {
      this.saveStaff([]);
    }
    if (!localStorage.getItem(this.keys.tasks)) {
      this.saveTasks([]);
    }
    if (!localStorage.getItem(this.keys.orders)) {
      this.saveOrders([]);
    }
  }

  // Sales Management
  getAllSales(): SaleRecord[] {
    try {
      const sales = localStorage.getItem(this.keys.sales);
      return sales ? JSON.parse(sales) : [];
    } catch (error) {
      console.error('Error loading sales:', error);
      return [];
    }
  }

  addSale(sale: Omit<SaleRecord, 'id' | 'createdBy' | 'date'>): SaleRecord {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const newSale: SaleRecord = {
      ...sale,
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdBy: currentUser.id,
      date: new Date().toISOString(),
      businessType: currentUser.businessType
    };

    const sales = this.getAllSales();
    sales.push(newSale);
    this.saveSales(sales);

    // Update related data
    this.updateCustomerFromSale(newSale);
    this.updateInventoryFromSale(newSale);
    this.updateStaffCommissions(newSale);
    this.recalculateMetrics();

    return newSale;
  }

  private saveSales(sales: SaleRecord[]): void {
    localStorage.setItem(this.keys.sales, JSON.stringify(sales));
  }

  // Product Management
  getAllProducts(): Product[] {
    try {
      const products = localStorage.getItem(this.keys.products);
      return products ? JSON.parse(products) : [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const products = this.getAllProducts();
    products.push(newProduct);
    this.saveProducts(products);
    this.recalculateMetrics();

    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getAllProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveProducts(products);
    this.recalculateMetrics();
    return products[index];
  }

  private saveProducts(products: Product[]): void {
    localStorage.setItem(this.keys.products, JSON.stringify(products));
  }

  // Customer Management
  getAllCustomers(): Customer[] {
    try {
      const customers = localStorage.getItem(this.keys.customers);
      return customers ? JSON.parse(customers) : [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }

  addCustomer(customer: Omit<Customer, 'id' | 'totalPurchases' | 'createdAt'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      totalPurchases: 0,
      createdAt: new Date().toISOString()
    };

    const customers = this.getAllCustomers();
    customers.push(newCustomer);
    this.saveCustomers(customers);
    this.recalculateMetrics();

    return newCustomer;
  }

  private updateCustomerFromSale(sale: SaleRecord): void {
    const customers = this.getAllCustomers();
    let customer = customers.find(c => c.phone === sale.customerPhone || c.name === sale.customerName);

    if (!customer) {
      // Create new customer
      customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: sale.customerName,
        phone: sale.customerPhone || '',
        totalPurchases: sale.total,
        lastPurchaseDate: sale.date,
        createdAt: new Date().toISOString()
      };
      customers.push(customer);
    } else {
      // Update existing customer
      customer.totalPurchases += sale.total;
      customer.lastPurchaseDate = sale.date;
    }

    this.saveCustomers(customers);
  }

  private saveCustomers(customers: Customer[]): void {
    localStorage.setItem(this.keys.customers, JSON.stringify(customers));
  }

  // Staff Management
  getAllStaff(): StaffMember[] {
    try {
      const staff = localStorage.getItem(this.keys.staff);
      return staff ? JSON.parse(staff) : [];
    } catch (error) {
      console.error('Error loading staff:', error);
      return [];
    }
  }

  addStaffMember(staff: Omit<StaffMember, 'id' | 'totalSales' | 'commissionEarned' | 'tasksCompleted'>): StaffMember {
    const newStaff: StaffMember = {
      ...staff,
      id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      totalSales: 0,
      commissionEarned: 0,
      tasksCompleted: 0
    };

    const staffList = this.getAllStaff();
    staffList.push(newStaff);
    this.saveStaff(staffList);
    this.recalculateMetrics();

    return newStaff;
  }

  private updateStaffCommissions(sale: SaleRecord): void {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const staffList = this.getAllStaff();
    const staffMember = staffList.find(s => s.id === currentUser.id);

    if (staffMember) {
      staffMember.totalSales = (staffMember.totalSales || 0) + sale.total;
      if (sale.commission) {
        staffMember.commissionEarned = (staffMember.commissionEarned || 0) + sale.commission;
      }
      this.saveStaff(staffList);
    }
  }

  private saveStaff(staff: StaffMember[]): void {
    localStorage.setItem(this.keys.staff, JSON.stringify(staff));
  }

  // Task Management
  getAllTasks(): Task[] {
    try {
      const tasks = localStorage.getItem(this.keys.tasks);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    const tasks = this.getAllTasks();
    tasks.push(newTask);
    this.saveTasks(tasks);
    this.recalculateMetrics();

    return newTask;
  }

  updateTaskStatus(id: string, status: Task['status']): Task | null {
    const tasks = this.getAllTasks();
    const task = tasks.find(t => t.id === id);

    if (task) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
        this.updateStaffTaskCompletion(task.assignedTo);
      }
      this.saveTasks(tasks);
      this.recalculateMetrics();
    }

    return task || null;
  }

  private updateStaffTaskCompletion(staffId: string): void {
    const staffList = this.getAllStaff();
    const staff = staffList.find(s => s.id === staffId);

    if (staff) {
      staff.tasksCompleted = (staff.tasksCompleted || 0) + 1;
      this.saveStaff(staffList);
    }
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(this.keys.tasks, JSON.stringify(tasks));
  }

  // Order Management
  getAllOrders(): Order[] {
    try {
      const orders = localStorage.getItem(this.keys.orders);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  addOrder(order: Omit<Order, 'id' | 'createdBy' | 'orderDate'>): Order {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const newOrder: Order = {
      ...order,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdBy: currentUser.id,
      orderDate: new Date().toISOString()
    };

    const orders = this.getAllOrders();
    orders.push(newOrder);
    this.saveOrders(orders);
    this.recalculateMetrics();

    return newOrder;
  }

  updateOrderStatus(id: string, status: Order['status']): Order | null {
    const orders = this.getAllOrders();
    const order = orders.find(o => o.id === id);

    if (order) {
      order.status = status;
      if (status === 'delivered') {
        order.deliveryDate = new Date().toISOString();
      }
      this.saveOrders(orders);
      this.recalculateMetrics();
    }

    return order || null;
  }

  private saveOrders(orders: Order[]): void {
    localStorage.setItem(this.keys.orders, JSON.stringify(orders));
  }

  private updateInventoryFromSale(sale: SaleRecord): void {
    if (!sale.products) return;

    const products = this.getAllProducts();
    let updated = false;

    sale.products.forEach(productSale => {
      const product = products.find(p => p.id === productSale.productId);
      if (product) {
        product.stock -= productSale.quantity;
        updated = true;
      }
    });

    if (updated) {
      this.saveProducts(products);
    }
  }

  // Metrics Calculation
  getBusinessMetrics(): BusinessMetrics {
    try {
      const cached = localStorage.getItem(this.keys.metrics);
      if (cached) {
        const metrics = JSON.parse(cached);
        // Check if cache is less than 5 minutes old
        if (Date.now() - metrics.lastUpdated < 5 * 60 * 1000) {
          return metrics.data;
        }
      }
    } catch (error) {
      console.error('Error loading cached metrics:', error);
    }

    return this.recalculateMetrics();
  }

  private recalculateMetrics(): BusinessMetrics {
    const sales = this.getAllSales();
    const products = this.getAllProducts();
    const customers = this.getAllCustomers();
    const staff = this.getAllStaff();
    const tasks = this.getAllTasks();
    const orders = this.getAllOrders();
    const invoices = invoiceService.getInvoices();

    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Calculate metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0) + 
                        invoices.reduce((sum, inv) => sum + inv.total, 0);
    
    const todaySales = sales
      .filter(sale => new Date(sale.date).toDateString() === today.toDateString())
      .reduce((sum, sale) => sum + sale.total, 0);

    const thisMonthSales = sales
      .filter(sale => new Date(sale.date) >= thisMonth)
      .reduce((sum, sale) => sum + sale.total, 0);

    const lastMonthSales = sales
      .filter(sale => new Date(sale.date) >= lastMonth && new Date(sale.date) < thisMonth)
      .reduce((sum, sale) => sum + sale.total, 0);

    const monthlyGrowth = lastMonthSales > 0 ? 
      ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;

    const inventoryValue = products.reduce((sum, product) => 
      sum + (product.stock * product.cost), 0);

    const lowStockItems = products.filter(product => 
      product.stock <= product.lowStockThreshold).length;

    const activeOrders = orders.filter(order => 
      ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)).length;

    const completedOrders = orders.filter(order => 
      order.status === 'delivered').length;

    const activeTasks = tasks.filter(task => 
      ['pending', 'in-progress'].includes(task.status)).length;

    const metrics: BusinessMetrics = {
      totalRevenue,
      totalSales: sales.length + invoices.length,
      pendingAmount: invoiceService.getTotalPendingAmount(),
      activeOrders,
      completedOrders,
      teamMembers: staff.filter(s => s.isActive).length,
      activeTasks,
      inventoryValue,
      lowStockItems,
      todaySales,
      monthlyGrowth,
      customerCount: customers.length,
      productCount: products.length
    };

    // Cache the metrics
    localStorage.setItem(this.keys.metrics, JSON.stringify({
      data: metrics,
      lastUpdated: Date.now()
    }));

    return metrics;
  }

  // Utility methods
  clearAllData(): void {
    Object.values(this.keys).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeDefaultData();
  }

  exportData(): any {
    return {
      sales: this.getAllSales(),
      products: this.getAllProducts(),
      customers: this.getAllCustomers(),
      staff: this.getAllStaff(),
      tasks: this.getAllTasks(),
      orders: this.getAllOrders(),
      invoices: invoiceService.getInvoices(),
      metrics: this.getBusinessMetrics()
    };
  }

  importData(data: any): void {
    if (data.sales) this.saveSales(data.sales);
    if (data.products) this.saveProducts(data.products);
    if (data.customers) this.saveCustomers(data.customers);
    if (data.staff) this.saveStaff(data.staff);
    if (data.tasks) this.saveTasks(data.tasks);
    if (data.orders) this.saveOrders(data.orders);

    this.recalculateMetrics();
  }

  // Validate product data before saving
  validateProductData(productData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!productData.productName?.trim() && !productData.serviceName?.trim()) {
      errors.push('Product/Service name is required');
    }

    if (!productData.category?.trim() && !productData.serviceCategory?.trim()) {
      errors.push('Category is required');
    }

    if (!productData.sellingPrice || productData.sellingPrice <= 0) {
      errors.push('Selling price must be greater than 0');
    }

    if (productData.buyingPrice < 0) {
      errors.push('Buying price cannot be negative');
    }

    if (productData.quantityInStock < 0) {
      errors.push('Quantity cannot be negative');
    }

    if (productData.minimumStockAlert < 0) {
      errors.push('Minimum stock alert cannot be negative');
    }

    // Business-specific validation
    if (productData.businessType === 'manufacturer') {
      if (!productData.batchLotNumber?.trim()) {
        errors.push('Batch/Lot number is required for manufactured products');
      }
    }

    if (productData.businessType === 'service') {
      if (!productData.serviceDuration || productData.serviceDuration <= 0) {
        errors.push('Service duration must be greater than 0');
      }
    }

    if (productData.businessType === 'wholesaler' || productData.businessType === 'distributor') {
      if (!productData.minimumOrderQuantity || productData.minimumOrderQuantity <= 0) {
        errors.push('Minimum order quantity must be greater than 0');
      }
    }

    // Price validation
    if (productData.sellingPrice < productData.buyingPrice) {
      errors.push('Selling price should be higher than buying price');
    }

    // Discount validation
    if (productData.discount && (productData.discount < 0 || productData.discount > 100)) {
      errors.push('Discount must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get additional data for enhanced features
  getAllVendors(): any[] {
    try {
      const vendors = localStorage.getItem('vendors');
      return vendors ? JSON.parse(vendors) : [];
    } catch (error) {
      console.error('Error loading vendors:', error);
      return [];
    }
  }

  getAllExpenses(): any[] {
    try {
      const expenses = localStorage.getItem('expenses');
      return expenses ? JSON.parse(expenses) : [];
    } catch (error) {
      console.error('Error loading expenses:', error);
      return [];
    }
  }

  getAllAssets(): any[] {
    try {
      const assets = localStorage.getItem('assets');
      return assets ? JSON.parse(assets) : [];
    } catch (error) {
      console.error('Error loading assets:', error);
      return [];
    }
  }

  getAllRecipes(): any[] {
    try {
      const recipes = localStorage.getItem('recipes');
      return recipes ? JSON.parse(recipes) : [];
    } catch (error) {
      console.error('Error loading recipes:', error);
      return [];
    }
  }
}

export const dataManager = new DataManager();
