import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, TrendingUp, Filter, Download, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { staffService, SalesCommission, StaffMember } from '@/lib/staff-service';
import { authService } from '@/lib/auth-service';

interface CommissionFormData {
  staffId: string;
  saleId: string;
  saleDate: string;
  productService: string;
  saleAmount: number;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number;
  notes: string;
}

interface CommissionSummary {
  staffId: string;
  staffName: string;
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  transactionCount: number;
}

export default function CommissionManagement() {
  const [commissions, setCommissions] = useState<SalesCommission[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCommissionOpen, setIsAddCommissionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [commissionForm, setCommissionForm] = useState<CommissionFormData>({
    staffId: '',
    saleId: '',
    saleDate: '',
    productService: '',
    saleAmount: 0,
    commissionType: 'percentage',
    commissionRate: 0,
    notes: ''
  });

  const user = authService.getCurrentUser();
  const canManageCommissions = authService.hasPermission('financialReports') || authService.hasPermission('manage_team');
  const isSalesStaff = user?.role === 'sales_staff' || user?.role === 'sales_executive';

  useEffect(() => {
    loadCommissions();
    loadStaff();
    
    // Set default period to current month
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(currentPeriod);
  }, []);

  useEffect(() => {
    loadCommissions();
  }, [selectedPeriod, selectedStaff]);

  const loadCommissions = () => {
    const targetStaffId = isSalesStaff && !canManageCommissions ? user?.id : (selectedStaff === 'all' ? undefined : selectedStaff);
    const commissionList = staffService.getCommissionRecords(targetStaffId, selectedPeriod);
    setCommissions(commissionList);
  };

  const loadStaff = () => {
    const staffList = staffService.getStaffList().filter(member => 
      member.role === 'sales_staff' || member.role === 'sales_executive'
    );
    setStaff(staffList);
  };

  const handleAddCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!commissionForm.staffId || !commissionForm.productService || !commissionForm.saleAmount) {
        setError('Please fill in all required fields');
        return;
      }

      if (commissionForm.commissionRate <= 0) {
        setError('Commission rate must be greater than 0');
        return;
      }

      const staffMember = staff.find(s => s.id === commissionForm.staffId);
      if (!staffMember) {
        setError('Invalid staff member selected');
        return;
      }

      // Calculate commission amount
      const commissionAmount = commissionForm.commissionType === 'percentage' 
        ? (commissionForm.saleAmount * commissionForm.commissionRate) / 100
        : commissionForm.commissionRate;

      const commissionData = {
        ...commissionForm,
        staffName: staffMember.name,
        commissionAmount,
        status: 'pending' as const,
        period: selectedPeriod
      };

      const result = await staffService.addSalesCommission(commissionData);
      
      if (result.success) {
        loadCommissions();
        setIsAddCommissionOpen(false);
        resetCommissionForm();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to add commission record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCommissionPaid = async (commissionId: string) => {
    const result = await staffService.markCommissionPaid(commissionId);
    if (result.success) {
      loadCommissions();
    }
  };

  const resetCommissionForm = () => {
    setCommissionForm({
      staffId: '',
      saleId: '',
      saleDate: new Date().toISOString().split('T')[0],
      productService: '',
      saleAmount: 0,
      commissionType: 'percentage',
      commissionRate: 0,
      notes: ''
    });
    setError('');
  };

  const getCommissionSummary = (): CommissionSummary[] => {
    const summaryMap = new Map<string, CommissionSummary>();

    commissions.forEach(commission => {
      const existing = summaryMap.get(commission.staffId) || {
        staffId: commission.staffId,
        staffName: commission.staffName,
        totalSales: 0,
        totalCommission: 0,
        pendingCommission: 0,
        paidCommission: 0,
        transactionCount: 0
      };

      existing.totalSales += commission.saleAmount;
      existing.totalCommission += commission.commissionAmount;
      existing.transactionCount += 1;

      if (commission.status === 'pending') {
        existing.pendingCommission += commission.commissionAmount;
      } else if (commission.status === 'paid') {
        existing.paidCommission += commission.commissionAmount;
      }

      summaryMap.set(commission.staffId, existing);
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.totalCommission - a.totalCommission);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generatePeriodOptions = (): { value: string; label: string }[] => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  const exportCommissionData = () => {
    const summary = getCommissionSummary();
    const csvContent = [
      ['Staff Name', 'Total Sales', 'Total Commission', 'Pending Commission', 'Paid Commission', 'Transactions'],
      ...summary.map(item => [
        item.staffName,
        item.totalSales,
        item.totalCommission,
        item.pendingCommission,
        item.paidCommission,
        item.transactionCount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    const matchesSearch = commission.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         commission.productService.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         commission.saleId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const commissionSummary = getCommissionSummary();
  const totalSales = commissionSummary.reduce((sum, item) => sum + item.totalSales, 0);
  const totalCommissions = commissionSummary.reduce((sum, item) => sum + item.totalCommission, 0);
  const pendingCommissions = commissionSummary.reduce((sum, item) => sum + item.pendingCommission, 0);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to access commission management.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!canManageCommissions && !isSalesStaff) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>You don't have permission to access commission management.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Commission</h1>
          <p className="text-gray-600">Track and manage sales staff commission earnings</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {canManageCommissions && (
            <Button onClick={exportCommissionData}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
          
          {canManageCommissions && (
            <Dialog open={isAddCommissionOpen} onOpenChange={setIsAddCommissionOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetCommissionForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Commission
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Sales Commission</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCommission} className="space-y-4">
                  {error && (
                    <Alert>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div>
                    <Label htmlFor="staffId">Sales Staff *</Label>
                    <Select value={commissionForm.staffId} onValueChange={(value) => setCommissionForm(prev => ({ ...prev, staffId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sales staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map(staffMember => (
                          <SelectItem key={staffMember.id} value={staffMember.id}>
                            {staffMember.name} - {staffMember.role.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="saleId">Sale ID</Label>
                      <Input
                        id="saleId"
                        value={commissionForm.saleId}
                        onChange={(e) => setCommissionForm(prev => ({ ...prev, saleId: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saleDate">Sale Date *</Label>
                      <Input
                        id="saleDate"
                        type="date"
                        value={commissionForm.saleDate}
                        onChange={(e) => setCommissionForm(prev => ({ ...prev, saleDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="productService">Product/Service *</Label>
                    <Input
                      id="productService"
                      value={commissionForm.productService}
                      onChange={(e) => setCommissionForm(prev => ({ ...prev, productService: e.target.value }))}
                      placeholder="e.g., Premium Package, Product XYZ"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="saleAmount">Sale Amount (₹) *</Label>
                    <Input
                      id="saleAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={commissionForm.saleAmount}
                      onChange={(e) => setCommissionForm(prev => ({ ...prev, saleAmount: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="commissionType">Commission Type</Label>
                      <Select 
                        value={commissionForm.commissionType} 
                        onValueChange={(value: any) => setCommissionForm(prev => ({ ...prev, commissionType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="commissionRate">
                        Commission {commissionForm.commissionType === 'percentage' ? 'Rate (%)' : 'Amount (₹)'} *
                      </Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        step={commissionForm.commissionType === 'percentage' ? '0.1' : '0.01'}
                        value={commissionForm.commissionRate}
                        onChange={(e) => setCommissionForm(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>

                  {commissionForm.saleAmount > 0 && commissionForm.commissionRate > 0 && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="text-sm">
                        <span className="text-gray-600">Commission Amount: </span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(
                            commissionForm.commissionType === 'percentage' 
                              ? (commissionForm.saleAmount * commissionForm.commissionRate) / 100
                              : commissionForm.commissionRate
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={commissionForm.notes}
                      onChange={(e) => setCommissionForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddCommissionOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Commission'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</div>
                <div className="text-sm text-gray-600">Total Sales</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommissions)}</div>
                <div className="text-sm text-gray-600">Total Commissions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(pendingCommissions)}</div>
                <div className="text-sm text-gray-600">Pending Commissions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommissions - pendingCommissions)}</div>
                <div className="text-sm text-gray-600">Paid Commissions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            {generatePeriodOptions().map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canManageCommissions && (
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map(staffMember => (
                <SelectItem key={staffMember.id} value={staffMember.id}>
                  {staffMember.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search commissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Summary by Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Staff Member</th>
                      <th className="text-right p-3">Total Sales</th>
                      <th className="text-right p-3">Total Commission</th>
                      <th className="text-right p-3">Pending</th>
                      <th className="text-right p-3">Paid</th>
                      <th className="text-center p-3">Transactions</th>
                      {canManageCommissions && <th className="text-center p-3">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {commissionSummary.map((summary) => (
                      <tr key={summary.staffId} className="border-b">
                        <td className="p-3">
                          <div className="font-medium">{summary.staffName}</div>
                        </td>
                        <td className="text-right p-3">{formatCurrency(summary.totalSales)}</td>
                        <td className="text-right p-3 font-semibold">{formatCurrency(summary.totalCommission)}</td>
                        <td className="text-right p-3 text-yellow-600">{formatCurrency(summary.pendingCommission)}</td>
                        <td className="text-right p-3 text-green-600">{formatCurrency(summary.paidCommission)}</td>
                        <td className="text-center p-3">{summary.transactionCount}</td>
                        {canManageCommissions && (
                          <td className="text-center p-3">
                            {summary.pendingCommission > 0 && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Mark all pending commissions for this staff as paid
                                  const pendingCommissions = commissions.filter(c => 
                                    c.staffId === summary.staffId && c.status === 'pending'
                                  );
                                  pendingCommissions.forEach(c => handleMarkCommissionPaid(c.id));
                                }}
                              >
                                Mark All Paid
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {commissionSummary.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No commission data found for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCommissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{commission.staffName}</span>
                        <Badge className={getStatusBadge(commission.status)}>
                          {commission.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {commission.productService} • {formatDate(commission.saleDate)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Sale: {formatCurrency(commission.saleAmount)} • 
                        Commission: {commission.commissionType === 'percentage' ? `${commission.commissionRate}%` : formatCurrency(commission.commissionRate)}
                      </div>
                      {commission.saleId && (
                        <div className="text-xs text-gray-500">
                          Sale ID: {commission.saleId}
                        </div>
                      )}
                      {commission.notes && (
                        <div className="text-xs text-gray-500">
                          Notes: {commission.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="text-lg font-semibold">
                        {formatCurrency(commission.commissionAmount)}
                      </div>
                      {canManageCommissions && commission.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkCommissionPaid(commission.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      {commission.paidDate && (
                        <div className="text-xs text-gray-500">
                          Paid: {formatDate(commission.paidDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredCommissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No commission transactions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
