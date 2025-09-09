import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Building,
  Calendar,
  Download,
  Filter,
  Target,
  Truck,
  Factory,
  Home,
  ArrowUpIcon,
  ArrowDownIcon,
  ShoppingBag,
  Store,
  FileText
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { dataManager } from '@/lib/data-manager';
import { getBusinessData } from '@/lib/business-data';
import BackButton from '@/components/BackButton';

interface AnalyticsData {
  revenue: {
    daily: { date: string; amount: number }[];
    monthly: { month: string; amount: number }[];
    yearly: { year: string; amount: number }[];
  };
  totalSales: number;
  growthRate: number;
  profitAfterTax: number;
  businessValuation: number;
  topStaff: { name: string; performance: number; kpi: string; revenue: number }[];
  topClients: { name: string; revenue: number; orders: number }[];
  topVendors: { name: string; spent: number; orders: number; lastOrder: string }[];
  assets: { name: string; value: number; depreciation: number; type: string; purchaseDate: string; currentValue: number }[];
  expenses: { category: string; amount: number; percentage: number }[];
  inventoryValue: number;
  cashFlow: { month: string; inflow: number; outflow: number; net: number }[];
  profitMargin: number;
  salesGrowth: number;
  totalExpenses: number;
  netProfit: number;
}

export default function OwnerAnalytics() {
  const permissions = usePermissions();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'last_7_days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'last_30_days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'last_3_months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'last_year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const loadAnalyticsData = () => {
    setLoading(true);
    try {
      const business = getBusinessData();
      const filterDate = getDateFilter();
      
      // Get live data from data manager
      const allSales = dataManager.getAllSales();
      const allCustomers = dataManager.getAllCustomers();
      const allProducts = dataManager.getAllProducts();
      const allStaff = dataManager.getAllStaff();
      const allVendors = dataManager.getAllVendors() || [];
      const allExpenses = dataManager.getAllExpenses() || [];
      const allAssets = dataManager.getAllAssets() || [];
      
      // Filter data by date range
      const filteredSales = allSales.filter(sale => new Date(sale.date) >= filterDate);
      
      // Calculate revenue metrics
      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
      
      // Calculate previous period for growth rate
      const previousPeriodEnd = filterDate;
      const previousPeriodStart = new Date(filterDate.getTime() - (Date.now() - filterDate.getTime()));
      const previousPeriodSales = allSales
        .filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
        })
        .reduce((sum, sale) => sum + sale.total, 0);
      
      const growthRate = previousPeriodSales > 0 ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 : 0;
      
      // Calculate expenses
      const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const netProfit = totalSales - totalExpenses;
      const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
      const profitAfterTax = netProfit * 0.85; // Assuming 15% tax rate
      
      // Business valuation based on annual revenue and profit
      const annualRevenue = totalSales * (365 / Math.max(1, (Date.now() - filterDate.getTime()) / (24 * 60 * 60 * 1000)));
      const industryMultipliers = {
        'manufacturer': 4.0,
        'wholesaler': 3.5,
        'retailer': 3.0,
        'distributor': 3.5,
        'ecommerce': 4.5,
        'service': 3.8,
        'trader': 3.2
      };
      const multiplier = industryMultipliers[business.type] || 3.5;
      const businessValuation = annualRevenue * multiplier;
      
      // Top clients analysis
      const clientRevenue = allCustomers.map(customer => {
        const customerSales = filteredSales.filter(sale => sale.customerId === customer.id);
        const revenue = customerSales.reduce((sum, sale) => sum + sale.total, 0);
        return {
          name: customer.name,
          revenue,
          orders: customerSales.length
        };
      }).filter(client => client.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top staff performance based on actual sales
      const staffPerformance = allStaff.map(staff => {
        const staffSales = filteredSales.filter(sale => sale.staffId === staff.id);
        const revenue = staffSales.reduce((sum, sale) => sum + sale.total, 0);
        const performance = staffSales.length > 0 ? Math.min(100, (revenue / (totalSales || 1)) * 100 * allStaff.length) : 0;
        return {
          name: staff.name,
          performance: Math.round(performance),
          kpi: 'Sales Performance',
          revenue
        };
      }).filter(staff => staff.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top vendors (for vendor-using business types)
      const vendorTypes = ['manufacturer', 'wholesaler', 'distributor', 'retailer', 'trader'];
      let topVendors: { name: string; spent: number; orders: number; lastOrder: string }[] = [];
      
      if (vendorTypes.includes(business.type)) {
        topVendors = allVendors.map(vendor => {
          const purchases = allSales.filter(sale => sale.vendorId === vendor.id);
          const spent = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
          const lastOrder = purchases.length > 0 
            ? purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : 'Never';
          return {
            name: vendor.name,
            spent,
            orders: purchases.length,
            lastOrder
          };
        }).filter(vendor => vendor.spent > 0)
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 5);
      }

      // Calculate inventory value
      const inventoryValue = allProducts.reduce((sum, product) => sum + (product.price * (product.stock || 0)), 0);

      // Assets with depreciation calculations
      const assetsWithDepreciation = allAssets.map(asset => {
        const purchaseDate = new Date(asset.purchaseDate || Date.now());
        const yearsOwned = (Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const depreciationRate = asset.depreciation || 10;
        const totalDepreciation = Math.min(asset.value * 0.9, asset.value * (depreciationRate / 100) * yearsOwned);
        const currentValue = Math.max(asset.value * 0.1, asset.value - totalDepreciation);
        
        return {
          name: asset.name,
          value: asset.value,
          depreciation: depreciationRate,
          type: asset.type,
          purchaseDate: asset.purchaseDate || new Date().toISOString(),
          currentValue: Math.round(currentValue)
        };
      });

      // Expense breakdown with percentages
      const expenseCategories = allExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as { [key: string]: number });
      
      const expenseBreakdown = Object.entries(expenseCategories).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      // Revenue trends (real data from sales)
      const dailyRevenue = [];
      const monthlyRevenue = [];
      const yearlyRevenue = [];
      
      // Daily revenue for last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayRevenue = allSales
          .filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= dayStart && saleDate < dayEnd;
          })
          .reduce((sum, sale) => sum + sale.total, 0);
          
        dailyRevenue.push({
          date: dayStart.toISOString().split('T')[0],
          amount: dayRevenue
        });
      }
      
      // Monthly revenue for last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthRevenue = allSales
          .filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= monthStart && saleDate <= monthEnd;
          })
          .reduce((sum, sale) => sum + sale.total, 0);
          
        monthlyRevenue.push({
          month: monthStart.toLocaleDateString('en', { month: 'short' }),
          amount: monthRevenue
        });
      }
      
      // Yearly revenue for last 3 years
      for (let i = 2; i >= 0; i--) {
        const year = new Date().getFullYear() - i;
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        
        const yearRevenue = allSales
          .filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= yearStart && saleDate <= yearEnd;
          })
          .reduce((sum, sale) => sum + sale.total, 0);
          
        yearlyRevenue.push({
          year: year.toString(),
          amount: yearRevenue
        });
      }

      // Cash flow calculation
      const cashFlowData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const inflow = allSales
          .filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= monthStart && saleDate <= monthEnd;
          })
          .reduce((sum, sale) => sum + sale.total, 0);
          
        const outflow = allExpenses
          .filter(expense => {
            const expenseDate = new Date(expense.date || Date.now());
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);
          
        cashFlowData.push({
          month: monthStart.toLocaleDateString('en', { month: 'short' }),
          inflow,
          outflow,
          net: inflow - outflow
        });
      }

      const analyticsData: AnalyticsData = {
        revenue: {
          daily: dailyRevenue,
          monthly: monthlyRevenue,
          yearly: yearlyRevenue
        },
        totalSales,
        growthRate,
        profitAfterTax,
        businessValuation,
        topStaff: staffPerformance,
        topClients: clientRevenue,
        topVendors,
        assets: assetsWithDepreciation,
        expenses: expenseBreakdown,
        inventoryValue,
        cashFlow: cashFlowData,
        profitMargin,
        salesGrowth: growthRate,
        totalExpenses,
        netProfit
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const exportData = {
      'Business Analytics Report': '',
      'Generated Date': new Date().toLocaleDateString(),
      'Period': dateRange.replace('_', ' '),
      '': '',
      'Financial Metrics': '',
      'Total Sales': formatCurrency(analytics.totalSales),
      'Growth Rate': `${analytics.growthRate.toFixed(1)}%`,
      'Net Profit': formatCurrency(analytics.netProfit),
      'Profit Margin': `${analytics.profitMargin.toFixed(1)}%`,
      'Business Valuation': formatCurrency(analytics.businessValuation),
      'Inventory Value': formatCurrency(analytics.inventoryValue),
      ' ': '',
      'Top Clients': analytics.topClients.map(c => `${c.name}: ${formatCurrency(c.revenue)}`).join(', '),
      'Top Staff': analytics.topStaff.map(s => `${s.name}: ${s.performance}%`).join(', '),
      'Assets': analytics.assets.map(a => `${a.name}: ${formatCurrency(a.currentValue)}`).join(', ')
    };

    const csvContent = Object.entries(exportData).map(([key, value]) => `"${key}","${value}"`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  if (!permissions.isOwner) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">Only business owners can access analytics data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-500">Start making sales to see your business analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Business Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your business performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_3_months">Last 3 months</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalSales)}</div>
            <div className="flex items-center space-x-2 mt-2">
              {formatPercentage(analytics.growthRate)}
              <span className="text-xs text-blue-100">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Net Profit</CardTitle>
            <Target className="h-5 w-5 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.netProfit)}</div>
            <p className="text-xs text-green-100 mt-2">{analytics.profitMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Business Valuation</CardTitle>
            <Building className="h-5 w-5 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.businessValuation)}</div>
            <p className="text-xs text-purple-100 mt-2">Industry standard</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Inventory Value</CardTitle>
            <Package className="h-5 w-5 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.inventoryValue)}</div>
            <p className="text-xs text-orange-100 mt-2">Current stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.revenue.daily.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Daily Average</span>
                  <span className="font-medium">{formatCurrency(analytics.totalSales / Math.max(1, analytics.revenue.daily.length))}</span>
                </div>
                <div className="h-48 flex items-end space-x-2">
                  {analytics.revenue.daily.slice(-7).map((day, index) => {
                    const maxRevenue = Math.max(...analytics.revenue.daily.map(d => d.amount));
                    const height = maxRevenue > 0 ? (day.amount / maxRevenue) * 100 : 0;
                    return (
                      <div 
                        key={index} 
                        className="flex-1 bg-blue-100 rounded-t min-h-[4px]" 
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${day.date}: ${formatCurrency(day.amount)}`}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No revenue data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.cashFlow.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Net Flow (This Month)</span>
                  <span className={`font-medium ${analytics.cashFlow[analytics.cashFlow.length - 1]?.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(analytics.cashFlow[analytics.cashFlow.length - 1]?.net || 0)}
                  </span>
                </div>
                <div className="h-48 flex items-end space-x-1">
                  {analytics.cashFlow.slice(-6).map((month, index) => {
                    const maxFlow = Math.max(...analytics.cashFlow.map(m => Math.max(m.inflow, m.outflow)));
                    return (
                      <div key={index} className="flex-1 space-y-1">
                        <div 
                          className="bg-green-200 rounded-t" 
                          style={{ height: `${maxFlow > 0 ? (month.inflow / maxFlow) * 80 : 4}%` }}
                          title={`Inflow: ${formatCurrency(month.inflow)}`}
                        />
                        <div 
                          className="bg-red-200 rounded-b" 
                          style={{ height: `${maxFlow > 0 ? (month.outflow / maxFlow) * 80 : 4}%` }}
                          title={`Outflow: ${formatCurrency(month.outflow)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No cash flow data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance and Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Performing Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topStaff.length > 0 ? (
              <div className="space-y-4">
                {analytics.topStaff.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(staff.revenue)} revenue</p>
                    </div>
                    <Badge variant="secondary">{staff.performance}%</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No staff performance data</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Top Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topClients.length > 0 ? (
              <div className="space-y-4">
                {analytics.topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.orders} orders</p>
                    </div>
                    <span className="font-medium">{formatCurrency(client.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No client data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendors Section (only for vendor-using business types) */}
      {analytics.topVendors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Top Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.topVendors.map((vendor, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{vendor.name}</h4>
                    <Badge variant="outline">{vendor.orders} orders</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Total Spent: {formatCurrency(vendor.spent)}</p>
                  <p className="text-xs text-gray-500">Last Order: {vendor.lastOrder !== 'Never' ? new Date(vendor.lastOrder).toLocaleDateString() : 'Never'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets and Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5" />
              Company Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.assets.length > 0 ? (
              <div className="space-y-4">
                {analytics.assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-gray-500">{asset.type} • {asset.depreciation}% depreciation</p>
                      <p className="text-xs text-gray-400">Current: {formatCurrency(asset.currentValue)}</p>
                    </div>
                    <span className="font-medium text-gray-600">{formatCurrency(asset.value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Factory className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No assets registered</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.expenses.length > 0 ? (
              <div className="space-y-4">
                {analytics.expenses.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{expense.category}</span>
                        <span>{formatCurrency(expense.amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${expense.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{expense.percentage.toFixed(1)}% of total</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No expense data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
