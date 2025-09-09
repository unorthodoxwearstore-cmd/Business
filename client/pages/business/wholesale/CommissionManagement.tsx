import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Percent,
  Plus,
  Search,
  Edit,
  Eye,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Download,
  Filter,
  Calendar,
  Award,
  BarChart3,
  Calculator,
  CheckCircle,
  Clock
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import BackButton from '@/components/BackButton';

interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory: string;
  joinedDate: string;
  commissionRate: number; // percentage
  status: 'active' | 'inactive';
  totalSales: number;
  totalCommission: number;
  target: number;
  achievement: number; // percentage
}

interface CommissionRule {
  id: string;
  name: string;
  type: 'product' | 'client' | 'volume' | 'flat';
  description: string;
  rate: number;
  minValue?: number;
  maxValue?: number;
  products?: string[];
  clients?: string[];
  isActive: boolean;
}

interface Commission {
  id: string;
  salespersonId: string;
  salespersonName: string;
  clientId: string;
  clientName: string;
  orderId: string;
  orderDate: string;
  orderValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    commission: number;
  }>;
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
}

export default function CommissionManagement() {
  const permissions = usePermissions();

  // Real data will be loaded from the data management system
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'salespersons' | 'commissions' | 'rules'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [loading, setLoading] = useState(true);

  // Load real data
  useEffect(() => {
    // This would load real data from the data management system
    setLoading(false);
  }, []);

  if (!permissions.hasPermission('financialReports')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access commission management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.salespersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || commission.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Commission['status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      paid: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle },
      disputed: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: Clock }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'text-green-600';
    if (achievement >= 80) return 'text-blue-600';
    if (achievement >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalCommissionsPending = filteredCommissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const totalCommissionsPaid = filteredCommissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-white" />
            </div>
            Commission Management
          </h1>
          <p className="text-gray-600 mt-1">Track and manage sales commissions and incentives</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Commissions
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'salespersons', label: 'Sales Team', icon: Users },
          { id: 'commissions', label: 'Commissions', icon: DollarSign },
          { id: 'rules', label: 'Rules', icon: Target }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales Team</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sampleSalespersons.length}</div>
                <p className="text-xs text-muted-foreground">
                  {sampleSalespersons.filter(s => s.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(totalCommissionsPending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCommissionsPaid)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Commission payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {(sampleSalespersons.reduce((sum, s) => sum + s.commissionRate, 0) / sampleSalespersons.length).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all sales staff
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top Performers This Month
              </CardTitle>
              <CardDescription>Sales team performance and commission earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleSalespersons
                  .sort((a, b) => b.achievement - a.achievement)
                  .map((salesperson, index) => (
                    <div key={salesperson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{salesperson.name}</h4>
                          <p className="text-sm text-gray-600">{salesperson.territory}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Sales</div>
                            <div className="font-medium">{formatCurrency(salesperson.totalSales)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Commission</div>
                            <div className="font-medium">{formatCurrency(salesperson.totalCommission)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Achievement</div>
                            <div className={`font-bold ${getAchievementColor(salesperson.achievement)}`}>
                              {salesperson.achievement.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Team Tab */}
      {selectedTab === 'salespersons' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Team</CardTitle>
              <CardDescription>Manage sales team members and their commission structures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleSalespersons.map((salesperson) => (
                  <Card 
                    key={salesperson.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedSalesperson(salesperson)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{salesperson.name}</h4>
                          <p className="text-sm text-gray-600">{salesperson.email} • {salesperson.phone}</p>
                          <p className="text-sm text-gray-500">{salesperson.territory}</p>
                        </div>
                        <Badge variant={salesperson.status === 'active' ? 'default' : 'secondary'}>
                          {salesperson.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Commission Rate:</span>
                          <span className="font-medium ml-1">{salesperson.commissionRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Sales:</span>
                          <span className="font-medium ml-1">{formatCurrency(salesperson.totalSales)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Commission:</span>
                          <span className="font-medium ml-1">{formatCurrency(salesperson.totalCommission)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <span className="font-medium ml-1">{formatCurrency(salesperson.target)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Achievement:</span>
                          <span className={`font-bold ml-1 ${getAchievementColor(salesperson.achievement)}`}>
                            {salesperson.achievement.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Target Progress</span>
                          <span>{salesperson.achievement.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              salesperson.achievement >= 100 ? 'bg-green-500' :
                              salesperson.achievement >= 80 ? 'bg-blue-500' :
                              salesperson.achievement >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(salesperson.achievement, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commissions Tab */}
      {selectedTab === 'commissions' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by salesperson, client, or order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="disputed">Disputed</option>
                </select>
                
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_quarter">This Quarter</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Commission List */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Records</CardTitle>
              <CardDescription>Track and manage individual commission payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCommissions.map((commission) => (
                  <Card key={commission.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{commission.orderId}</h4>
                          <p className="text-sm text-gray-600">
                            {commission.salespersonName} • {commission.clientName}
                          </p>
                        </div>
                        {getStatusBadge(commission.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Order Date:</span>
                          <span className="font-medium ml-1">{formatDate(commission.orderDate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Order Value:</span>
                          <span className="font-medium ml-1">{formatCurrency(commission.orderValue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Commission Rate:</span>
                          <span className="font-medium ml-1">{commission.commissionRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Commission:</span>
                          <span className="font-bold ml-1 text-indigo-600">
                            {formatCurrency(commission.commissionAmount)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Products:</h5>
                        {commission.products.map((product) => (
                          <div key={product.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                            <span>{product.name} (Qty: {product.quantity})</span>
                            <span className="font-medium">{formatCurrency(product.price)} each</span>
                          </div>
                        ))}
                      </div>
                      
                      {commission.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                          <strong>Notes:</strong> {commission.notes}
                        </div>
                      )}
                      
                      {commission.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCommissions.length === 0 && (
                <div className="text-center py-12">
                  <Percent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
                  <p className="text-gray-500">No commission records match your current filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Tab */}
      {selectedTab === 'rules' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Commission Rules
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </CardTitle>
              <CardDescription>Configure commission rules and rates for different scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleCommissionRules.map((rule) => (
                  <Card key={rule.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {rule.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Commission Rate:</span>
                          <span className="font-bold ml-1 text-indigo-600">{rule.rate}%</span>
                        </div>
                        {rule.minValue && (
                          <div>
                            <span className="text-gray-500">Min Value:</span>
                            <span className="font-medium ml-1">{formatCurrency(rule.minValue)}</span>
                          </div>
                        )}
                        {rule.maxValue && (
                          <div>
                            <span className="text-gray-500">Max Value:</span>
                            <span className="font-medium ml-1">{formatCurrency(rule.maxValue)}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="font-medium ml-1 capitalize">{rule.type} Based</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
