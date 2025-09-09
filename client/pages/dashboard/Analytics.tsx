import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  PieChart,
  Activity,
  Calendar,
  Download,
  Star,
  Crown,
  RefreshCw,
  Eye,
  ArrowUp,
  ArrowDown,
  Building2,
  Target,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/lib/permissions';
import { authService } from '@/lib/auth-service';
import BackButton from '@/components/BackButton';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  customersCount: number;
  salesByMonth: { [key: string]: { revenue: number; orders: number; customers: string[] } };
  topCustomers: Array<{
    name: string;
    phone: string;
    totalSpent: number;
    orderCount: number;
    firstOrderDate: string;
    lastOrderDate: string;
  }>;
  revenueGrowth: number;
  orderGrowth: number;
  businessValuation: number;
  lastUpdated: string;
}

export default function Analytics() {
  const permissions = usePermissions();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadAnalyticsData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = () => {
    setLoading(true);
    const existingAnalytics = localStorage.getItem('insygth_analytics');
    
    if (existingAnalytics) {
      const data = JSON.parse(existingAnalytics);
      // Convert customer arrays back to Sets for processing
      Object.keys(data.salesByMonth).forEach(month => {
        if (Array.isArray(data.salesByMonth[month].customers)) {
          data.salesByMonth[month].customers = data.salesByMonth[month].customers;
        }
      });
      setAnalyticsData(data);
    } else {
      // Initialize empty analytics
      const emptyAnalytics: AnalyticsData = {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        customersCount: 0,
        salesByMonth: {},
        topCustomers: [],
        revenueGrowth: 0,
        orderGrowth: 0,
        businessValuation: 0,
        lastUpdated: new Date().toISOString()
      };
      setAnalyticsData(emptyAnalytics);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return {
      value: `${isPositive ? '+' : ''}${growth.toFixed(1)}%`,
      isPositive,
      icon: isPositive ? ArrowUp : ArrowDown,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      bgColor: isPositive ? 'bg-green-100' : 'bg-red-100'
    };
  };

  const getRecentSalesData = () => {
    if (!analyticsData) return [];
    
    const months = Object.keys(analyticsData.salesByMonth).sort().slice(-6); // Last 6 months
    return months.map(month => ({
      month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      revenue: analyticsData.salesByMonth[month].revenue,
      orders: analyticsData.salesByMonth[month].orders
    }));
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const reportData = {
      ...analyticsData,
      exportDate: new Date().toISOString(),
      businessType: currentUser?.businessType,
      reportPeriod: selectedTimeframe
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!permissions.hasPermission('view_basic_analytics')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to view business analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !analyticsData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revenueGrowth = formatGrowth(analyticsData.revenueGrowth);
  const orderGrowth = formatGrowth(analyticsData.orderGrowth);
  const recentSales = getRecentSalesData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-600 mt-1">
            Real-time insights into your {permissions.businessType?.toLowerCase() || 'business'} performance
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Auto-updated
            </Badge>
            <span className="text-xs text-gray-500">
              Last updated: {new Date(analyticsData.lastUpdated).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
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
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
            <div className="flex items-center space-x-2 mt-2">
              <revenueGrowth.icon className={`h-4 w-4 ${revenueGrowth.color === 'text-green-600' ? 'text-green-200' : 'text-red-200'}`} />
              <p className="text-xs text-blue-100">
                {revenueGrowth.value} from last period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders.toLocaleString('en-IN')}</div>
            <div className="flex items-center space-x-2 mt-2">
              <orderGrowth.icon className={`h-4 w-4 ${orderGrowth.color === 'text-green-600' ? 'text-green-200' : 'text-red-200'}`} />
              <p className="text-xs text-green-100">
                {orderGrowth.value} from last period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Active Customers</CardTitle>
            <Users className="h-5 w-5 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.customersCount.toLocaleString('en-IN')}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Activity className="h-4 w-4 text-purple-200" />
              <p className="text-xs text-purple-100">
                Avg: {formatCurrency(analyticsData.averageOrderValue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Business Valuation</CardTitle>
            <Building2 className="h-5 w-5 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.businessValuation)}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Activity className="h-4 w-4 text-orange-200" />
              <p className="text-xs text-orange-100">
                3x annual revenue estimate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
                <CardDescription>Monthly sales performance</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSales.length > 0 ? (
                  <div className="space-y-4">
                    {recentSales.map((sale, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{sale.month}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{formatCurrency(sale.revenue)}</div>
                          <div className="text-xs text-gray-500">{sale.orders} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No sales data yet</p>
                    <p className="text-sm">Start adding sales to see revenue trends</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Growth Metrics
                </CardTitle>
                <CardDescription>Month-over-month growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${revenueGrowth.bgColor}`}>
                      <revenueGrowth.icon className={`h-3 w-3 ${revenueGrowth.color}`} />
                      <span className={revenueGrowth.color}>{revenueGrowth.value}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Order Growth</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${orderGrowth.bgColor}`}>
                      <orderGrowth.icon className={`h-3 w-3 ${orderGrowth.color}`} />
                      <span className={orderGrowth.color}>{orderGrowth.value}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Avg Order Value</span>
                    <span className="text-sm font-semibold">{formatCurrency(analyticsData.averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Customer Count</span>
                    <span className="text-sm font-semibold">{analyticsData.customersCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Top Customers
              </CardTitle>
              <CardDescription>Your most valuable customers by total spending</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.topCustomers.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.topCustomers.slice(0, 10).map((customer, index) => (
                    <div key={customer.phone} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{customer.name}</h4>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(customer.totalSpent)}</div>
                        <div className="text-sm text-gray-500">{customer.orderCount} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No customer data yet</p>
                  <p className="text-sm">Customer insights will appear after sales</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Performance Indicators
                </CardTitle>
                <CardDescription>Essential business metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Revenue per Customer</span>
                    <span className="text-sm font-semibold">
                      {analyticsData.customersCount > 0 
                        ? formatCurrency(analyticsData.totalRevenue / analyticsData.customersCount)
                        : formatCurrency(0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Orders per Customer</span>
                    <span className="text-sm font-semibold">
                      {analyticsData.customersCount > 0 
                        ? (analyticsData.totalOrders / analyticsData.customersCount).toFixed(1)
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Business Valuation</span>
                    <span className="text-sm font-semibold">{formatCurrency(analyticsData.businessValuation)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Data Quality Score</span>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">100%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Business Health
                </CardTitle>
                <CardDescription>Overall business performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Revenue Trend</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {analyticsData.revenueGrowth >= 0 ? 'Growing' : 'Declining'} at {Math.abs(analyticsData.revenueGrowth).toFixed(1)}% monthly rate
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Customer Base</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {analyticsData.customersCount > 0 
                        ? `${analyticsData.customersCount} active customers with avg ${formatCurrency(analyticsData.averageOrderValue)} orders`
                        : 'Ready to acquire first customers'
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-800">Business Value</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Estimated at {formatCurrency(analyticsData.businessValuation)} based on revenue performance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
