import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/lib/permissions';
import { BarChart3, TrendingUp, DollarSign, Building, 
         CreditCard, Calculator, Download, Filter } from 'lucide-react';

interface RevenueData {
  period: string;
  revenue: number;
  costs: number;
  grossProfit: number;
  netProfit: number;
  growth: number;
}

interface EBITDAData {
  period: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  ebitda: number;
  ebitdaMargin: number;
  pat: number;
  patMargin: number;
}

interface Asset {
  id: string;
  name: string;
  type: 'vehicle' | 'equipment' | 'property' | 'inventory' | 'other';
  category: string;
  purchaseDate: string;
  purchaseValue: number;
  currentValue: number;
  depreciationRate: number;
  depreciationMethod: 'straight_line' | 'reducing_balance';
  usefulLife: number;
  location: string;
  status: 'active' | 'maintenance' | 'disposed';
}

interface Liability {
  id: string;
  name: string;
  type: 'loan' | 'emi' | 'credit' | 'payable' | 'other';
  principal: number;
  outstanding: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  endDate: string;
  lender: string;
  status: 'active' | 'closed' | 'overdue';
}

interface ValuationData {
  businessType: string;
  industry: string;
  multiplier: number;
  revenue: number;
  profit: number;
  assets: number;
  liabilities: number;
  revenueBasedValuation: number;
  profitBasedValuation: number;
  assetBasedValuation: number;
  averageValuation: number;
}

const AdvancedAnalytics: React.FC = () => {
  const { hasPermission, userRole } = usePermissions();
  const [selectedPeriod, setSelectedPeriod] = useState('last_12_months');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Revenue & Sales Data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [ebitdaData, setEbitdaData] = useState<EBITDAData[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [valuationData, setValuationData] = useState<ValuationData | null>(null);

  // Mock data - in production, this would come from actual business data
  useEffect(() => {
    const mockRevenueData: RevenueData[] = [
      { period: 'Jan 2024', revenue: 850000, costs: 620000, grossProfit: 230000, netProfit: 180000, growth: 12.5 },
      { period: 'Feb 2024', revenue: 920000, costs: 680000, grossProfit: 240000, netProfit: 190000, growth: 8.2 },
      { period: 'Mar 2024', revenue: 780000, costs: 580000, grossProfit: 200000, netProfit: 160000, growth: -15.2 },
      { period: 'Apr 2024', revenue: 1100000, costs: 790000, grossProfit: 310000, netProfit: 250000, growth: 41.0 },
      { period: 'May 2024', revenue: 1050000, costs: 750000, grossProfit: 300000, netProfit: 240000, growth: -4.5 },
      { period: 'Jun 2024', revenue: 1200000, costs: 850000, grossProfit: 350000, netProfit: 280000, growth: 14.3 }
    ];

    const mockEBITDAData: EBITDAData[] = [
      { period: 'Q1 2024', revenue: 2550000, cogs: 1880000, operatingExpenses: 420000, ebitda: 250000, ebitdaMargin: 9.8, pat: 180000, patMargin: 7.1 },
      { period: 'Q2 2024', revenue: 3350000, cogs: 2390000, operatingExpenses: 560000, ebitda: 400000, ebitdaMargin: 11.9, pat: 320000, patMargin: 9.6 },
      { period: 'Q3 2023', revenue: 2200000, cogs: 1650000, operatingExpenses: 380000, ebitda: 170000, ebitdaMargin: 7.7, pat: 120000, patMargin: 5.5 },
      { period: 'Q4 2023', revenue: 2800000, cogs: 2100000, operatingExpenses: 450000, ebitda: 250000, ebitdaMargin: 8.9, pat: 190000, patMargin: 6.8 }
    ];

    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'Delivery Truck - MH01AB1234',
        type: 'vehicle',
        category: 'Transportation',
        purchaseDate: '2022-06-15',
        purchaseValue: 800000,
        currentValue: 640000,
        depreciationRate: 10,
        depreciationMethod: 'reducing_balance',
        usefulLife: 8,
        location: 'Mumbai Branch',
        status: 'active'
      },
      {
        id: '2',
        name: 'Main Warehouse',
        type: 'property',
        category: 'Real Estate',
        purchaseDate: '2020-01-10',
        purchaseValue: 5000000,
        currentValue: 5500000,
        depreciationRate: 2,
        depreciationMethod: 'straight_line',
        usefulLife: 30,
        location: 'Mumbai Central',
        status: 'active'
      },
      {
        id: '3',
        name: 'Manufacturing Equipment Set',
        type: 'equipment',
        category: 'Production',
        purchaseDate: '2023-03-20',
        purchaseValue: 1200000,
        currentValue: 1080000,
        depreciationRate: 15,
        depreciationMethod: 'straight_line',
        usefulLife: 10,
        location: 'Production Unit',
        status: 'active'
      },
      {
        id: '4',
        name: 'Current Inventory Stock',
        type: 'inventory',
        category: 'Stock',
        purchaseDate: '2024-06-01',
        purchaseValue: 2500000,
        currentValue: 2500000,
        depreciationRate: 0,
        depreciationMethod: 'straight_line',
        usefulLife: 1,
        location: 'All Branches',
        status: 'active'
      }
    ];

    const mockLiabilities: Liability[] = [
      {
        id: '1',
        name: 'Business Term Loan',
        type: 'loan',
        principal: 2000000,
        outstanding: 1350000,
        interestRate: 9.5,
        monthlyPayment: 35000,
        startDate: '2022-04-01',
        endDate: '2027-04-01',
        lender: 'HDFC Bank',
        status: 'active'
      },
      {
        id: '2',
        name: 'Equipment Finance',
        type: 'emi',
        principal: 800000,
        outstanding: 450000,
        interestRate: 11.2,
        monthlyPayment: 18500,
        startDate: '2023-03-20',
        endDate: '2026-03-20',
        lender: 'Bajaj Finserv',
        status: 'active'
      },
      {
        id: '3',
        name: 'Working Capital Loan',
        type: 'credit',
        principal: 500000,
        outstanding: 320000,
        interestRate: 12.5,
        monthlyPayment: 25000,
        startDate: '2024-01-15',
        endDate: '2025-01-15',
        lender: 'ICICI Bank',
        status: 'active'
      },
      {
        id: '4',
        name: 'Supplier Outstanding',
        type: 'payable',
        principal: 150000,
        outstanding: 150000,
        interestRate: 0,
        monthlyPayment: 0,
        startDate: '2024-06-01',
        endDate: '2024-07-30',
        lender: 'ABC Suppliers Ltd',
        status: 'active'
      }
    ];

    const mockValuationData: ValuationData = {
      businessType: 'Wholesale Distribution',
      industry: 'FMCG',
      multiplier: 3.2,
      revenue: 12500000,
      profit: 1250000,
      assets: 9220000,
      liabilities: 2270000,
      revenueBasedValuation: 40000000,
      profitBasedValuation: 4000000,
      assetBasedValuation: 6950000,
      averageValuation: 16983333
    };

    setRevenueData(mockRevenueData);
    setEbitdaData(mockEBITDAData);
    setAssets(mockAssets);
    setLiabilities(mockLiabilities);
    setValuationData(mockValuationData);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateDepreciation = (asset: Asset) => {
    const yearsElapsed = (new Date().getFullYear() - new Date(asset.purchaseDate).getFullYear());
    if (asset.depreciationMethod === 'straight_line') {
      const annualDepreciation = asset.purchaseValue / asset.usefulLife;
      return Math.min(annualDepreciation * yearsElapsed, asset.purchaseValue);
    } else {
      // Reducing balance
      return asset.purchaseValue - asset.currentValue;
    }
  };

  const getTotalAssetValue = () => {
    return assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  };

  const getTotalLiabilities = () => {
    return liabilities.reduce((sum, liability) => sum + liability.outstanding, 0);
  };

  const getNetWorth = () => {
    return getTotalAssetValue() - getTotalLiabilities();
  };

  const exportReport = (reportType: string) => {
    if (!hasPermission('export_reports')) return;
    console.log(`Exporting ${reportType} report...`);
  };

  // Owner and Co-Founder access only
  if (userRole !== 'owner' && userRole !== 'co_founder') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Advanced Analytics</p>
            <p className="text-muted-foreground">This feature is available only to Business Owners and Co-Founders.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive financial analysis and business valuation tools
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                  <SelectItem value="year_to_date">Year to Date</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => exportReport('analytics')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalAssetValue())}</div>
            <p className="text-xs text-muted-foreground">Current market value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(getTotalLiabilities())}</div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(getNetWorth())}</div>
            <p className="text-xs text-muted-foreground">Assets - Liabilities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Valuation</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {valuationData && formatCurrency(valuationData.averageValuation)}
            </div>
            <p className="text-xs text-muted-foreground">Estimated value</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue & Sales</TabsTrigger>
          <TabsTrigger value="ebitda">EBITDA & PAT</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Sales Analysis</CardTitle>
              <CardDescription>Track revenue trends and growth patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Chart Placeholder */}
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">Revenue trend chart would be displayed here</p>
                    <p className="text-sm text-muted-foreground">Integration with charting library needed</p>
                  </div>
                </div>
                
                {/* Revenue Data Table */}
                <div className="space-y-4">
                  <h4 className="font-medium">Monthly Revenue Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {revenueData.map((data, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{data.period}</CardTitle>
                            <Badge variant={data.growth >= 0 ? 'default' : 'destructive'}>
                              {data.growth >= 0 ? '+' : ''}{data.growth.toFixed(1)}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Revenue:</span>
                            <span className="font-medium">{formatCurrency(data.revenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Costs:</span>
                            <span className="text-red-600">{formatCurrency(data.costs)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Gross Profit:</span>
                            <span className="font-medium">{formatCurrency(data.grossProfit)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>Net Profit:</span>
                            <span className="text-green-600">{formatCurrency(data.netProfit)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Margin: {((data.netProfit / data.revenue) * 100).toFixed(1)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ebitda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>EBITDA & PAT Analysis</CardTitle>
              <CardDescription>Earnings Before Interest, Taxes, Depreciation & Amortization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* EBITDA Chart Placeholder */}
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">EBITDA & PAT trend chart would be displayed here</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ebitdaData.map((data, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{data.period}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Revenue:</span>
                            <span className="font-medium">{formatCurrency(data.revenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>COGS:</span>
                            <span className="text-red-600">{formatCurrency(data.cogs)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Operating Expenses:</span>
                            <span className="text-red-600">{formatCurrency(data.operatingExpenses)}</span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3 space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>EBITDA:</span>
                            <span className="text-blue-600">{formatCurrency(data.ebitda)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>EBITDA Margin:</span>
                            <span className="text-blue-600">{data.ebitdaMargin.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>PAT:</span>
                            <span className="text-green-600">{formatCurrency(data.pat)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>PAT Margin:</span>
                            <span className="text-green-600">{data.patMargin.toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
              <CardDescription>Track and manage business assets with depreciation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => {
                  const depreciationAmount = calculateDepreciation(asset);
                  const depreciationPercentage = (depreciationAmount / asset.purchaseValue) * 100;
                  
                  return (
                    <Card key={asset.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{asset.name}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{asset.type}</Badge>
                              <Badge variant="secondary">{asset.category}</Badge>
                              <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                                {asset.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{formatCurrency(asset.currentValue)}</div>
                            <div className="text-sm text-muted-foreground">Current Value</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Purchase Details</div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span>{formatDate(asset.purchaseDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Value:</span>
                              <span>{formatCurrency(asset.purchaseValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Useful Life:</span>
                              <span>{asset.usefulLife} years</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Depreciation</div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Method:</span>
                              <span className="capitalize">{asset.depreciationMethod.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rate:</span>
                              <span>{asset.depreciationRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Accumulated:</span>
                              <span className="text-red-600">{formatCurrency(depreciationAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Percentage:</span>
                              <span>{depreciationPercentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Location & Status</div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Location:</span>
                              <span>{asset.location}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Book Value:</span>
                              <span className="font-medium">{formatCurrency(asset.currentValue)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="liabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liability Overview</CardTitle>
              <CardDescription>Track loans, EMIs, and outstanding dues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liabilities.map((liability) => {
                  const completionPercentage = ((liability.principal - liability.outstanding) / liability.principal) * 100;
                  const monthsRemaining = liability.outstanding / (liability.monthlyPayment || 1);
                  
                  return (
                    <Card key={liability.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{liability.name}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="capitalize">{liability.type}</Badge>
                              <Badge variant={liability.status === 'active' ? 'destructive' : 'default'}>
                                {liability.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-red-600">
                              {formatCurrency(liability.outstanding)}
                            </div>
                            <div className="text-sm text-muted-foreground">Outstanding</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Loan Details</div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Principal:</span>
                                <span>{formatCurrency(liability.principal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Interest Rate:</span>
                                <span>{liability.interestRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Lender:</span>
                                <span>{liability.lender}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Payment Schedule</div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Monthly Payment:</span>
                                <span className="font-medium">{formatCurrency(liability.monthlyPayment)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Start Date:</span>
                                <span>{formatDate(liability.startDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>End Date:</span>
                                <span>{formatDate(liability.endDate)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Progress</div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Completed:</span>
                                <span>{completionPercentage.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Paid Amount:</span>
                                <span className="text-green-600">
                                  {formatCurrency(liability.principal - liability.outstanding)}
                                </span>
                              </div>
                              {liability.monthlyPayment > 0 && (
                                <div className="flex justify-between">
                                  <span>Est. Months Left:</span>
                                  <span>{Math.ceil(monthsRemaining)} months</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Repayment Progress</span>
                            <span>{completionPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="valuation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Valuation Calculator</CardTitle>
              <CardDescription>Estimate your business value using multiple valuation methods</CardDescription>
            </CardHeader>
            <CardContent>
              {valuationData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Business Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Business Type:</span>
                          <span>{valuationData.businessType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Industry:</span>
                          <span>{valuationData.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Industry Multiplier:</span>
                          <span>{valuationData.multiplier}x</span>
                        </div>
                      </div>
                      
                      <h4 className="font-medium">Key Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Annual Revenue:</span>
                          <span className="font-medium">{formatCurrency(valuationData.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Profit:</span>
                          <span className="font-medium">{formatCurrency(valuationData.profit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Assets:</span>
                          <span className="font-medium">{formatCurrency(valuationData.assets)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Liabilities:</span>
                          <span className="font-medium">{formatCurrency(valuationData.liabilities)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Valuation Methods</h4>
                      
                      <Card className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Revenue-Based Valuation</span>
                          <span className="text-sm text-muted-foreground">Revenue × {valuationData.multiplier}x</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(valuationData.revenueBasedValuation)}
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Profit-Based Valuation</span>
                          <span className="text-sm text-muted-foreground">Profit × 10x (P/E)</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(valuationData.profitBasedValuation)}
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Asset-Based Valuation</span>
                          <span className="text-sm text-muted-foreground">Assets - Liabilities</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(valuationData.assetBasedValuation)}
                        </div>
                      </Card>
                    </div>
                  </div>
                  
                  <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Estimated Business Valuation</h3>
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {formatCurrency(valuationData.averageValuation)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average of all valuation methods
                      </p>
                    </div>
                  </Card>
                  
                  <div className="text-xs text-muted-foreground p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-2">Disclaimer:</p>
                    <p>This valuation is an estimate based on standard industry practices and should not be considered as professional financial advice. For accurate business valuation, consult with a certified business valuator or financial advisor.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
