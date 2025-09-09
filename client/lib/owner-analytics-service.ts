import { BusinessType, UserRole } from '@shared/types';
import { dataManager } from './data-manager';
import { crmService } from './crm-service';
import { vendorService } from './vendor-service';
import { branchService } from './branch-service';

export interface RevenueData {
  date: string;
  revenue: number;
  profit: number;
  sales: number;
  expenses: number;
}

export interface PATAnalysis {
  revenue: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  interestExpense: number;
  profitBeforeTax: number;
  taxExpense: number;
  profitAfterTax: number;
  patMargin: number;
  period: string;
}

export interface BusinessValuation {
  method: 'revenue_multiple' | 'ebitda_multiple' | 'profit_multiple' | 'dcf' | 'asset_based';
  valuation: number;
  multiplier: number;
  baseValue: number;
  industry: string;
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
  lastUpdated: string;
}

export interface StaffPerformanceMetrics {
  staffId: string;
  staffName: string;
  role: UserRole;
  totalSales: number;
  salesGrowth: number;
  tasksCompleted: number;
  tasksCompletionRate: number;
  attendanceRate: number;
  customerRating: number;
  commissionEarned: number;
  performanceScore: number;
  rank: number;
  period: string;
}

export interface ClientAnalysis {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  averageOrderValue: number;
  orderFrequency: number;
  lastPurchaseDate: string;
  loyaltyScore: number;
  profitContribution: number;
  growthRate: number;
  riskScore: number;
  segment: 'high_value' | 'medium_value' | 'low_value' | 'at_risk' | 'new';
}

export interface VendorAnalysis {
  vendorId: string;
  vendorName: string;
  totalOrderValue: number;
  orderFrequency: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  priceCompetitiveness: number;
  costSavings: number;
  riskScore: number;
  performanceScore: number;
  relationship: 'strategic' | 'preferred' | 'standard' | 'limited';
}

export interface TrendAnalysis {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  percentage: number;
  prediction: number;
  confidence: number;
  data: { date: string; value: number }[];
}

export interface KPIDashboard {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    target: number;
    achievement: number;
  };
  profit: {
    current: number;
    previous: number;
    growth: number;
    margin: number;
  };
  customers: {
    total: number;
    new: number;
    retained: number;
    churnRate: number;
  };
  inventory: {
    value: number;
    turnover: number;
    deadStock: number;
    fastMoving: number;
  };
  staff: {
    total: number;
    productive: number;
    avgPerformance: number;
    retention: number;
  };
  cash: {
    inflow: number;
    outflow: number;
    balance: number;
    receivables: number;
  };
}

class OwnerAnalyticsService {
  private readonly ANALYTICS_KEY = 'hisaabb_owner_analytics';
  private readonly VALUATIONS_KEY = 'hisaabb_business_valuations';

  // Revenue Analysis
  getRevenueAnalysis(
    businessType: BusinessType,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    dateRange?: { start: string; end: string },
    branchId?: string | null // null = all branches, undefined = current branch
  ): RevenueData[] {
    let sales = dataManager.getAllSales();

    // Filter by branch if specified
    if (branchId !== undefined) {
      if (branchId === null) {
        // All branches - include all sales
        sales = sales;
      } else {
        // Specific branch - filter sales
        sales = sales.filter(sale => (sale as any).branchId === branchId);
      }
    } else {
      // Use current branch context
      sales = branchService.filterDataByCurrentBranch(sales as any);
    }

    const now = new Date();
    const data: RevenueData[] = [];

    // Determine the number of periods to analyze
    let periodsCount = 12; // Default to 12 months
    let dateFormat: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };

    switch (period) {
      case 'daily':
        periodsCount = 30; // Last 30 days
        dateFormat = { month: 'short', day: '2-digit' };
        break;
      case 'weekly':
        periodsCount = 12; // Last 12 weeks
        dateFormat = { month: 'short', day: '2-digit' };
        break;
      case 'yearly':
        periodsCount = 5; // Last 5 years
        dateFormat = { year: 'numeric' };
        break;
    }

    // Generate data for each period
    for (let i = periodsCount - 1; i >= 0; i--) {
      let periodStart: Date, periodEnd: Date;

      switch (period) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
          break;
        case 'weekly':
          periodStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          break;
        case 'yearly':
          periodStart = new Date(now.getFullYear() - i, 0, 1);
          periodEnd = new Date(now.getFullYear() - i + 1, 0, 0);
          break;
      }

      // Filter sales for this period
      const periodSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= periodStart && saleDate <= periodEnd;
      });

      const revenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
      const salesCount = periodSales.length;
      const profit = periodSales.reduce((sum, sale) => {
        const cost = sale.products?.reduce((productSum, product) => {
          const productData = dataManager.getProductById(product.productId);
          return productSum + (productData?.cost || 0) * product.quantity;
        }, 0) || 0;
        return sum + (sale.total - cost);
      }, 0);

      // Estimate expenses (simplified calculation)
      const expenses = revenue * 0.2; // Assuming 20% of revenue as expenses

      data.push({
        date: periodStart.toLocaleDateString('en-US', dateFormat),
        revenue,
        profit,
        sales: salesCount,
        expenses
      });
    }

    return data;
  }

  // PAT Analysis
  calculatePAT(
    businessType: BusinessType,
    period: string = new Date().toISOString().substring(0, 7),
    branchId?: string | null
  ): PATAnalysis {
    let sales = dataManager.getAllSales();

    // Filter by branch if specified
    if (branchId !== undefined) {
      if (branchId === null) {
        // All branches - include all sales
        sales = sales;
      } else {
        // Specific branch - filter sales
        sales = sales.filter(sale => (sale as any).branchId === branchId);
      }
    } else {
      // Use current branch context
      sales = branchService.filterDataByCurrentBranch(sales as any);
    }

    const periodSales = sales.filter(sale => sale.date.startsWith(period));

    const revenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate gross profit
    const grossProfit = periodSales.reduce((sum, sale) => {
      const cost = sale.products?.reduce((productSum, product) => {
        const productData = dataManager.getProductById(product.productId);
        return productSum + (productData?.cost || 0) * product.quantity;
      }, 0) || 0;
      return sum + (sale.total - cost);
    }, 0);

    // Estimated operating expenses (industry averages)
    const operatingExpenses = revenue * this.getOperatingExpenseRatio(businessType);
    const ebitda = grossProfit - operatingExpenses;
    
    // Estimated depreciation and amortization
    const depreciation = revenue * 0.02; // 2% of revenue
    const ebit = ebitda - depreciation;
    
    // Estimated interest expense
    const interestExpense = revenue * 0.01; // 1% of revenue
    const profitBeforeTax = ebit - interestExpense;
    
    // Tax calculation (assuming 30% tax rate)
    const taxRate = 0.30;
    const taxExpense = Math.max(0, profitBeforeTax * taxRate);
    const profitAfterTax = profitBeforeTax - taxExpense;
    
    const patMargin = revenue > 0 ? (profitAfterTax / revenue) * 100 : 0;

    return {
      revenue,
      grossProfit,
      operatingExpenses,
      ebitda,
      depreciation,
      ebit,
      interestExpense,
      profitBeforeTax,
      taxExpense,
      profitAfterTax,
      patMargin,
      period
    };
  }

  private getOperatingExpenseRatio(businessType: BusinessType): number {
    const ratios = {
      retailer: 0.25,
      ecommerce: 0.30,
      service: 0.35,
      manufacturer: 0.20,
      wholesaler: 0.15,
      distributor: 0.18,
      trader: 0.12,
    };
    return ratios[businessType] || 0.25;
  }

  // Business Valuation
  calculateBusinessValuation(businessType: BusinessType, branchId?: string | null): BusinessValuation[] {
    const currentPAT = this.calculatePAT(businessType, undefined, branchId);
    const revenueData = this.getRevenueAnalysis(businessType, 'yearly', undefined, branchId);
    const currentRevenue = revenueData[revenueData.length - 1]?.revenue || 0;

    const valuations: BusinessValuation[] = [];
    const industry = this.getIndustryMultipliers(businessType);

    // Revenue Multiple Method
    valuations.push({
      method: 'revenue_multiple',
      valuation: currentRevenue * industry.revenueMultiple,
      multiplier: industry.revenueMultiple,
      baseValue: currentRevenue,
      industry: businessType,
      confidence: 'medium',
      factors: ['Industry standards', 'Revenue growth trend', 'Market conditions'],
      lastUpdated: new Date().toISOString()
    });

    // EBITDA Multiple Method
    valuations.push({
      method: 'ebitda_multiple',
      valuation: currentPAT.ebitda * industry.ebitdaMultiple,
      multiplier: industry.ebitdaMultiple,
      baseValue: currentPAT.ebitda,
      industry: businessType,
      confidence: 'high',
      factors: ['Industry benchmarks', 'Profitability', 'Cash generation capability'],
      lastUpdated: new Date().toISOString()
    });

    // Profit Multiple Method
    valuations.push({
      method: 'profit_multiple',
      valuation: currentPAT.profitAfterTax * industry.profitMultiple,
      multiplier: industry.profitMultiple,
      baseValue: currentPAT.profitAfterTax,
      industry: businessType,
      confidence: 'high',
      factors: ['Earnings stability', 'Growth prospects', 'Risk factors'],
      lastUpdated: new Date().toISOString()
    });

    return valuations;
  }

  private getIndustryMultipliers(businessType: BusinessType): {
    revenueMultiple: number;
    ebitdaMultiple: number;
    profitMultiple: number;
  } {
    const multipliers = {
      retailer: { revenueMultiple: 0.8, ebitdaMultiple: 6, profitMultiple: 12 },
      ecommerce: { revenueMultiple: 2.5, ebitdaMultiple: 10, profitMultiple: 18 },
      service: { revenueMultiple: 1.2, ebitdaMultiple: 8, profitMultiple: 15 },
      manufacturer: { revenueMultiple: 1.5, ebitdaMultiple: 7, profitMultiple: 14 },
      wholesaler: { revenueMultiple: 0.6, ebitdaMultiple: 5, profitMultiple: 10 },
      distributor: { revenueMultiple: 0.7, ebitdaMultiple: 5.5, profitMultiple: 11 },
      trader: { revenueMultiple: 0.5, ebitdaMultiple: 4, profitMultiple: 8 },
    };
    return multipliers[businessType] || multipliers.retailer;
  }

  // Staff Performance Analysis
  getHighPerformingStaff(limit: number = 10, branchId?: string | null): StaffPerformanceMetrics[] {
    let staff = dataManager.getAllStaff();
    let sales = dataManager.getAllSales();
    let tasks = dataManager.getAllTasks();

    // Filter by branch if specified
    if (branchId !== undefined) {
      if (branchId === null) {
        // All branches - include all data
        staff = staff;
        sales = sales;
        tasks = tasks;
      } else {
        // Specific branch - filter data
        staff = staff.filter(member => (member as any).branchId === branchId);
        sales = sales.filter(sale => (sale as any).branchId === branchId);
        tasks = tasks.filter(task => (task as any).branchId === branchId);
      }
    } else {
      // Use current branch context
      staff = branchService.filterDataByCurrentBranch(staff as any);
      sales = branchService.filterDataByCurrentBranch(sales as any);
      tasks = branchService.filterDataByCurrentBranch(tasks as any);
    }
    
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    const performanceMetrics = staff.map(member => {
      // Calculate sales performance
      const staffSales = sales.filter(sale => sale.createdBy === member.id);
      const monthSales = staffSales.filter(sale => sale.date.startsWith(currentMonth));
      const previousMonthSales = staffSales.filter(sale => {
        const prevMonth = new Date();
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        return sale.date.startsWith(prevMonth.toISOString().substring(0, 7));
      });

      const totalSales = monthSales.reduce((sum, sale) => sum + sale.total, 0);
      const previousTotal = previousMonthSales.reduce((sum, sale) => sum + sale.total, 0);
      const salesGrowth = previousTotal > 0 ? ((totalSales - previousTotal) / previousTotal) * 100 : 0;

      // Calculate task performance
      const staffTasks = tasks.filter(task => task.assignedTo === member.id);
      const completedTasks = staffTasks.filter(task => task.status === 'completed').length;
      const tasksCompletionRate = staffTasks.length > 0 ? (completedTasks / staffTasks.length) * 100 : 0;

      // Simulate other metrics (in real app, these would come from actual data)
      const attendanceRate = 85 + Math.random() * 15; // 85-100%
      const customerRating = 3.5 + Math.random() * 1.5; // 3.5-5.0
      const commissionEarned = totalSales * 0.03; // 3% commission

      // Calculate overall performance score
      const performanceScore = (
        (totalSales / 100000) * 0.3 + // Sales weight
        (tasksCompletionRate / 100) * 0.25 + // Task completion weight
        (attendanceRate / 100) * 0.2 + // Attendance weight
        (customerRating / 5) * 0.15 + // Customer rating weight
        (salesGrowth / 100) * 0.1 // Growth weight
      ) * 100;

      return {
        staffId: member.id,
        staffName: member.name,
        role: member.role,
        totalSales,
        salesGrowth,
        tasksCompleted: completedTasks,
        tasksCompletionRate,
        attendanceRate,
        customerRating,
        commissionEarned,
        performanceScore,
        rank: 0, // Will be set after sorting
        period: currentMonth
      };
    });

    // Sort by performance score and assign ranks
    const sortedMetrics = performanceMetrics
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit)
      .map((metric, index) => ({ ...metric, rank: index + 1 }));

    return sortedMetrics;
  }

  // Client Analysis
  getBiggestClients(limit: number = 10, branchId?: string | null): ClientAnalysis[] {
    let customers = crmService.getAllCustomers();
    let sales = dataManager.getAllSales();

    // Filter by branch if specified
    if (branchId !== undefined) {
      if (branchId === null) {
        // All branches - include all data
        customers = customers;
        sales = sales;
      } else {
        // Specific branch - filter data
        customers = customers.filter(customer => (customer as any).branchId === branchId);
        sales = sales.filter(sale => (sale as any).branchId === branchId);
      }
    } else {
      // Use current branch context
      customers = branchService.filterDataByCurrentBranch(customers as any);
      sales = branchService.filterDataByCurrentBranch(sales as any);
    }

    const clientAnalysis = customers.map(customer => {
      const customerSales = sales.filter(sale => sale.customerName === customer.name);
      const totalPurchases = customerSales.reduce((sum, sale) => sum + sale.total, 0);
      const averageOrderValue = customerSales.length > 0 ? totalPurchases / customerSales.length : 0;
      
      // Calculate order frequency (orders per month)
      const firstOrder = customerSales.length > 0 ? new Date(customerSales[0].date) : new Date();
      const monthsSinceFirst = Math.max(1, Math.ceil((Date.now() - firstOrder.getTime()) / (30 * 24 * 60 * 60 * 1000)));
      const orderFrequency = customerSales.length / monthsSinceFirst;

      // Calculate growth rate (last 3 months vs previous 3 months)
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

      const recentSales = customerSales.filter(sale => new Date(sale.date) >= threeMonthsAgo);
      const previousSales = customerSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= sixMonthsAgo && saleDate < threeMonthsAgo;
      });

      const recentTotal = recentSales.reduce((sum, sale) => sum + sale.total, 0);
      const previousTotal = previousSales.reduce((sum, sale) => sum + sale.total, 0);
      const growthRate = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;

      // Calculate profit contribution (simplified)
      const profitContribution = totalPurchases * 0.25; // Assuming 25% profit margin

      // Calculate loyalty score
      const loyaltyScore = Math.min(100, (orderFrequency * 10) + (customerSales.length * 2));

      // Calculate risk score
      const daysSinceLastPurchase = customer.lastPurchaseDate ? 
        Math.ceil((Date.now() - new Date(customer.lastPurchaseDate).getTime()) / (24 * 60 * 60 * 1000)) : 365;
      const riskScore = Math.min(100, daysSinceLastPurchase / 3.65); // Days to percentage

      // Determine segment
      let segment: ClientAnalysis['segment'];
      if (totalPurchases > 500000) segment = 'high_value';
      else if (totalPurchases > 100000) segment = 'medium_value';
      else if (daysSinceLastPurchase > 90) segment = 'at_risk';
      else if (daysSinceLastPurchase < 30) segment = 'new';
      else segment = 'low_value';

      return {
        customerId: customer.id,
        customerName: customer.name,
        totalPurchases,
        averageOrderValue,
        orderFrequency,
        lastPurchaseDate: customer.lastPurchaseDate || '',
        loyaltyScore,
        profitContribution,
        growthRate,
        riskScore,
        segment
      };
    });

    return clientAnalysis
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, limit);
  }

  // Vendor Analysis
  getBiggestVendors(limit: number = 10, branchId?: string | null): VendorAnalysis[] {
    let vendors = vendorService.getAllVendors();
    let orders = vendorService.getAllVendorOrders();

    // Filter by branch if specified
    if (branchId !== undefined) {
      if (branchId === null) {
        // All branches - include all data
        vendors = vendors;
        orders = orders;
      } else {
        // Specific branch - filter data
        vendors = vendors.filter(vendor => (vendor as any).branchId === branchId);
        orders = orders.filter(order => (order as any).branchId === branchId);
      }
    } else {
      // Use current branch context
      vendors = branchService.filterDataByCurrentBranch(vendors as any);
      orders = branchService.filterDataByCurrentBranch(orders as any);
    }

    const vendorAnalysis = vendors.map(vendor => {
      const vendorOrders = orders.filter(order => order.vendorId === vendor.id);
      const totalOrderValue = vendorOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = vendorOrders.length > 0 ? totalOrderValue / vendorOrders.length : 0;
      
      // Calculate order frequency
      const firstOrder = vendorOrders.length > 0 ? new Date(vendorOrders[0].orderDate) : new Date();
      const monthsSinceFirst = Math.max(1, Math.ceil((Date.now() - firstOrder.getTime()) / (30 * 24 * 60 * 60 * 1000)));
      const orderFrequency = vendorOrders.length / monthsSinceFirst;

      // Calculate on-time delivery rate
      const deliveredOrders = vendorOrders.filter(order => order.status === 'delivered');
      const onTimeDeliveries = deliveredOrders.filter(order => {
        if (!order.actualDeliveryDate) return false;
        return new Date(order.actualDeliveryDate) <= new Date(order.expectedDeliveryDate);
      }).length;
      const onTimeDeliveryRate = deliveredOrders.length > 0 ? (onTimeDeliveries / deliveredOrders.length) * 100 : 0;

      // Estimate cost savings (simplified calculation)
      const costSavings = totalOrderValue * 0.05; // Assuming 5% savings

      // Calculate risk score based on various factors
      const riskScore = Math.max(0, 100 - vendor.rating * 15 - onTimeDeliveryRate * 0.5);

      // Calculate overall performance score
      const performanceScore = (
        (vendor.rating / 5) * 0.3 +
        (onTimeDeliveryRate / 100) * 0.25 +
        (vendor.qualityScore / 5) * 0.25 +
        (vendor.priceCompetitiveness / 5) * 0.2
      ) * 100;

      // Determine relationship type
      let relationship: VendorAnalysis['relationship'];
      if (totalOrderValue > 1000000 && vendor.isPreferred) relationship = 'strategic';
      else if (vendor.isPreferred) relationship = 'preferred';
      else if (totalOrderValue > 100000) relationship = 'standard';
      else relationship = 'limited';

      return {
        vendorId: vendor.id,
        vendorName: vendor.name,
        totalOrderValue,
        orderFrequency,
        averageOrderValue,
        onTimeDeliveryRate,
        qualityScore: vendor.qualityScore,
        priceCompetitiveness: vendor.priceCompetitiveness,
        costSavings,
        riskScore,
        performanceScore,
        relationship
      };
    });

    return vendorAnalysis
      .sort((a, b) => b.totalOrderValue - a.totalOrderValue)
      .slice(0, limit);
  }

  // KPI Dashboard
  getKPIDashboard(businessType: BusinessType, branchId?: string | null): KPIDashboard {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = previousMonth.toISOString().substring(0, 7);

    let sales = dataManager.getAllSales();
    let customers = crmService.getAllCustomers();
    let products = dataManager.getAllProducts();
    let staff = dataManager.getAllStaff();

    // Filter by branch if specified
    if (branchId !== undefined) {
      if (branchId === null) {
        // All branches - include all data
        sales = sales;
        customers = customers;
        products = products;
        staff = staff;
      } else {
        // Specific branch - filter data
        sales = sales.filter(sale => (sale as any).branchId === branchId);
        customers = customers.filter(customer => (customer as any).branchId === branchId);
        products = products.filter(product => (product as any).branchId === branchId);
        staff = staff.filter(member => (member as any).branchId === branchId);
      }
    } else {
      // Use current branch context
      sales = branchService.filterDataByCurrentBranch(sales as any);
      customers = branchService.filterDataByCurrentBranch(customers as any);
      products = branchService.filterDataByCurrentBranch(products as any);
      staff = branchService.filterDataByCurrentBranch(staff as any);
    }

    // Revenue metrics
    const currentRevenue = sales
      .filter(sale => sale.date.startsWith(currentMonth))
      .reduce((sum, sale) => sum + sale.total, 0);
    
    const previousRevenue = sales
      .filter(sale => sale.date.startsWith(prevMonthStr))
      .reduce((sum, sale) => sum + sale.total, 0);

    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Profit metrics
    const pat = this.calculatePAT(businessType, currentMonth);
    const previousPAT = this.calculatePAT(businessType, prevMonthStr);
    const profitGrowth = previousPAT.profitAfterTax > 0 ? 
      ((pat.profitAfterTax - previousPAT.profitAfterTax) / previousPAT.profitAfterTax) * 100 : 0;

    // Customer metrics
    const newCustomers = customers.filter(customer => customer.createdAt.startsWith(currentMonth)).length;
    const totalCustomers = customers.length;
    const churnRate = 5; // Simplified calculation

    // Inventory metrics
    const inventoryValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);
    const deadStockCount = products.filter(product => product.stock > 0 && !product.isActive).length;
    const fastMovingCount = products.filter(product => product.stock < product.lowStockThreshold).length;

    // Staff metrics
    const activeStaff = staff.filter(member => member.isActive).length;
    const performanceMetrics = this.getHighPerformingStaff();
    const avgPerformance = performanceMetrics.length > 0 ? 
      performanceMetrics.reduce((sum, metric) => sum + metric.performanceScore, 0) / performanceMetrics.length : 0;

    // Cash flow (simplified estimates)
    const cashInflow = currentRevenue;
    const cashOutflow = currentRevenue * 0.8; // Estimate
    const receivables = currentRevenue * 0.3; // Estimate

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: revenueGrowth,
        target: currentRevenue * 1.2, // 20% growth target
        achievement: (currentRevenue / (currentRevenue * 1.2)) * 100
      },
      profit: {
        current: pat.profitAfterTax,
        previous: previousPAT.profitAfterTax,
        growth: profitGrowth,
        margin: pat.patMargin
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        retained: totalCustomers - newCustomers,
        churnRate
      },
      inventory: {
        value: inventoryValue,
        turnover: 6, // Simplified calculation
        deadStock: deadStockCount,
        fastMoving: fastMovingCount
      },
      staff: {
        total: activeStaff,
        productive: Math.ceil(activeStaff * 0.8),
        avgPerformance,
        retention: 90 // Simplified percentage
      },
      cash: {
        inflow: cashInflow,
        outflow: cashOutflow,
        balance: cashInflow - cashOutflow,
        receivables
      }
    };
  }

  // Trend Analysis
  analyzeTrends(metric: string, businessType: BusinessType, branchId?: string | null): TrendAnalysis {
    let data: { date: string; value: number }[] = [];
    
    switch (metric) {
      case 'revenue':
        data = this.getRevenueAnalysis(businessType, 'monthly', undefined, branchId).map(item => ({
          date: item.date,
          value: item.revenue
        }));
        break;
      case 'profit':
        data = this.getRevenueAnalysis(businessType, 'monthly', undefined, branchId).map(item => ({
          date: item.date,
          value: item.profit
        }));
        break;
      case 'customers':
        // Simplified customer growth data
        data = this.generateCustomerTrendData(branchId);
        break;
      default:
        data = [];
    }

    if (data.length < 2) {
      return {
        metric,
        period: 'monthly',
        trend: 'stable',
        percentage: 0,
        prediction: data[data.length - 1]?.value || 0,
        confidence: 0,
        data
      };
    }

    // Calculate trend
    const values = data.map(item => item.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const percentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    
    let trend: TrendAnalysis['trend'];
    if (Math.abs(percentage) < 5) trend = 'stable';
    else if (percentage > 0) trend = 'increasing';
    else trend = 'decreasing';

    // Simple prediction (linear projection)
    const lastValue = values[values.length - 1];
    const prediction = lastValue * (1 + percentage / 100);
    
    // Confidence based on data consistency
    const volatility = this.calculateVolatility(values);
    const confidence = Math.max(0, 100 - volatility);

    return {
      metric,
      period: 'monthly',
      trend,
      percentage: Math.abs(percentage),
      prediction,
      confidence,
      data
    };
  }

  private generateCustomerTrendData(branchId?: string | null): { date: string; value: number }[] {
    let customers = crmService.getAllCustomers();

    // Filter by branch if specified
    if (branchId !== undefined) {
      if (branchId === null) {
        customers = customers;
      } else {
        customers = customers.filter(customer => (customer as any).branchId === branchId);
      }
    } else {
      customers = branchService.filterDataByCurrentBranch(customers as any);
    }
    const data: { date: string; value: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const monthCustomers = customers.filter(customer => 
        customer.createdAt.startsWith(monthStr)
      ).length;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: monthCustomers
      });
    }
    
    return data;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean > 0 ? (standardDeviation / mean) * 100 : 0;
  }
}

export const ownerAnalyticsService = new OwnerAnalyticsService();
