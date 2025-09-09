import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
  Clock,
  Award,
  CheckCircle
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { dataManager, BusinessMetrics } from '@/lib/data-manager';
import { usePermissions } from '@/lib/permissions';
import { invoiceService } from '@/lib/invoice-service';

interface AnalyticsData {
  metrics: BusinessMetrics;
  recentSales: any[];
  topProducts: any[];
  customerInsights: any;
  staffPerformance: any[];
  monthlyTrends: any[];
}

const AnalyticsSystem: React.FC = () => {
  const permissions = usePermissions();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = () => {
    try {
      const metrics = dataManager.getBusinessMetrics();
      const sales = dataManager.getAllSales();
      const products = dataManager.getAllProducts();
      const customers = dataManager.getAllCustomers();
      const staff = dataManager.getAllStaff();
      const orders = dataManager.getAllOrders();
      const invoices = invoiceService.getInvoices();

      // Calculate date range
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      // Recent sales
      const recentSales = [...sales, ...invoices.map(inv => ({
        id: inv.id,
        customerName: inv.customerName,
        total: inv.total,
        date: inv.createdAt,
        status: 'completed'
      }))].filter(sale => new Date(sale.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      // Top products by sales
      const productSales = new Map();
      sales.forEach(sale => {
        if (sale.products) {
          sale.products.forEach(product => {
            const existing = productSales.get(product.productId) || { 
              productName: product.productName, 
              quantity: 0, 
              revenue: 0 
            };
            existing.quantity += product.quantity;
            existing.revenue += product.total;
            productSales.set(product.productId, existing);
          });
        }
      });

      const topProducts = Array.from(productSales.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Customer insights
      const totalCustomerValue = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
      const avgCustomerValue = customers.length > 0 ? totalCustomerValue / customers.length : 0;
      const recentCustomers = customers.filter(c => {
        const joinDate = new Date(c.createdAt);
        return joinDate >= cutoffDate;
      }).length;

      const customerInsights = {
        total: customers.length,
        avgValue: avgCustomerValue,
        recent: recentCustomers,
        totalValue: totalCustomerValue
      };

      // Staff performance
      const staffPerformance = staff.filter(s => s.isActive).map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        sales: s.totalSales || 0,
        commission: s.commissionEarned || 0,
        tasks: s.tasksCompleted || 0
      })).sort((a, b) => b.sales - a.sales);

      // Monthly trends (last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthSales = [...sales, ...invoices.map(inv => ({
          total: inv.total,
          date: inv.createdAt
        }))].filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= monthStart && saleDate <= monthEnd;
        });

        const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.orderDate);
          return orderDate >= monthStart && orderDate <= monthEnd;
        }).length;

        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue,
          orders: monthOrders,
          sales: monthSales.length
        });
      }

      setData({
        metrics,
        recentSales,
        topProducts,
        customerInsights,
        staffPerformance,
        monthlyTrends
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!permissions.hasPermission('view_basic_analytics')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="text-center p-8">
            <CardContent>
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to view analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
            <p className="text-gray-600">Insights and performance metrics for your business</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-900">₹{data.metrics.totalRevenue.toFixed(2)}</p>
                        <div className="flex items-center text-xs text-blue-600 mt-1">
                          {data.metrics.monthlyGrowth >= 0 ? (
                            <ArrowUp className="w-3 h-3 mr-1" />
                          ) : (
                            <ArrowDown className="w-3 h-3 mr-1" />
                          )}
                          <span>{Math.abs(data.metrics.monthlyGrowth).toFixed(1)}% vs last month</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Active Orders</p>
                        <p className="text-2xl font-bold text-green-900">{data.metrics.activeOrders}</p>
                        <p className="text-xs text-green-600 mt-1">{data.metrics.completedOrders} completed</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <ShoppingCart className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Customers</p>
                        <p className="text-2xl font-bold text-purple-900">{data.metrics.customerCount}</p>
                        <p className="text-xs text-purple-600 mt-1">{data.customerInsights.recent} new this period</p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Products</p>
                        <p className="text-2xl font-bold text-orange-900">{data.metrics.productCount}</p>
                        <p className="text-xs text-orange-600 mt-1">{data.metrics.lowStockItems} low stock</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full">
                        <Package className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Monthly Trends
                  </CardTitle>
                  <CardDescription>Revenue and order trends over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.monthlyTrends.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{month.month}</p>
                          <p className="text-sm text-gray-600">{month.sales} sales • {month.orders} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{month.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Sales
                    </CardTitle>
                    <CardDescription>Latest sales transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.recentSales.slice(0, 5).map((sale, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{sale.customerName}</p>
                            <p className="text-sm text-gray-600">{new Date(sale.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">₹{sale.total.toFixed(2)}</p>
                            <Badge variant="outline" className="text-xs">
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {data.recentSales.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No recent sales</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Top Products
                    </CardTitle>
                    <CardDescription>Best performing products by revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{product.productName}</p>
                              <p className="text-sm text-gray-600">{product.quantity} sold</p>
                            </div>
                          </div>
                          <p className="font-semibold text-green-600">₹{product.revenue.toFixed(2)}</p>
                        </div>
                      ))}
                      {data.topProducts.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No product sales data</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Summary</CardTitle>
                  <CardDescription>Overview of sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{data.metrics.totalSales}</p>
                      <p className="text-sm text-gray-600">Total Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">₹{data.metrics.todaySales.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Today's Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">₹{data.metrics.pendingAmount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Pending Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{data.customerInsights.total}</p>
                    <p className="text-sm text-gray-600">Total Customers</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">₹{data.customerInsights.avgValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Avg Customer Value</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{data.customerInsights.recent}</p>
                    <p className="text-sm text-gray-600">New This Period</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">₹{data.customerInsights.totalValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Total Customer Value</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Staff Performance
                  </CardTitle>
                  <CardDescription>Team performance metrics and rankings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.staffPerformance.map((staff, index) => (
                      <div key={staff.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{staff.name}</p>
                            <p className="text-sm text-gray-600 capitalize">{staff.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₹{staff.sales.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{staff.tasks} tasks completed</p>
                        </div>
                      </div>
                    ))}
                    {data.staffPerformance.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No staff performance data</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSystem;
