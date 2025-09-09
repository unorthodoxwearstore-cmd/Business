import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Download, Eye, Calculator, Save, DollarSign, Shield } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { invoiceService } from '@/lib/invoice-service';
import { usePermissions } from '@/lib/permissions';
import { dataManager } from '@/lib/data-manager';
import AddSaleInvoiceForm from '@/components/forms/AddSaleInvoiceForm';

interface SaleData {
  customerName: string;
  customerPhone: string;
  amount: number;
  description: string;
  invoiceDate: string;
  dueDate: string;
  taxRate: number;
  receivedAmount: number;
}

const AddSale: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const permissions = usePermissions();
  const [isGenerating, setIsGenerating] = useState(false);
  const [saleData, setSaleData] = useState<SaleData>({
    customerName: '',
    customerPhone: '',
    amount: 0,
    description: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    taxRate: 18, // Default GST rate
    receivedAmount: 0
  });

  const [errors, setErrors] = useState<Partial<SaleData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SaleData> = {};

    if (!saleData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!saleData.customerPhone.trim()) newErrors.customerPhone = 'Customer phone is required';
    if (saleData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!saleData.invoiceDate) newErrors.invoiceDate = 'Invoice date is required';

    // Validate phone number format
    const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
    if (saleData.customerPhone && !phoneRegex.test(saleData.customerPhone)) {
      newErrors.customerPhone = 'Please enter a valid phone number';
    }

    // Validate received amount doesn't exceed total
    const totalAmount = calculateTotal();
    if (saleData.receivedAmount > totalAmount) {
      newErrors.receivedAmount = 'Received amount cannot exceed total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateSubtotal = (): number => {
    return saleData.amount;
  };

  const calculateTax = (): number => {
    return (saleData.amount * saleData.taxRate) / 100;
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateBalance = (): number => {
    return calculateTotal() - saleData.receivedAmount;
  };

  // Check permissions
  if (!permissions.hasPermission('viewAddEditOrders')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center p-8">
            <CardContent>
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to create sales and invoices.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof SaleData, value: string | number) => {
    setSaleData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const updateAnalytics = (invoiceData: any) => {
    // Update analytics data automatically
    const existingAnalytics = localStorage.getItem('insygth_analytics');
    const analyticsData = existingAnalytics ? JSON.parse(existingAnalytics) : {
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

    // Update revenue and order metrics
    analyticsData.totalRevenue += invoiceData.total;
    analyticsData.totalOrders += 1;
    analyticsData.averageOrderValue = analyticsData.totalRevenue / analyticsData.totalOrders;
    analyticsData.lastUpdated = new Date().toISOString();

    // Update monthly sales data
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    if (!analyticsData.salesByMonth[currentMonth]) {
      analyticsData.salesByMonth[currentMonth] = {
        revenue: 0,
        orders: 0,
        customers: new Set()
      };
    }
    analyticsData.salesByMonth[currentMonth].revenue += invoiceData.total;
    analyticsData.salesByMonth[currentMonth].orders += 1;
    analyticsData.salesByMonth[currentMonth].customers.add(invoiceData.customerPhone);

    // Update customer data
    const customerIndex = analyticsData.topCustomers.findIndex(
      (customer: any) => customer.phone === invoiceData.customerPhone
    );

    if (customerIndex >= 0) {
      analyticsData.topCustomers[customerIndex].totalSpent += invoiceData.total;
      analyticsData.topCustomers[customerIndex].orderCount += 1;
      analyticsData.topCustomers[customerIndex].lastOrderDate = invoiceData.invoiceDate;
    } else {
      analyticsData.topCustomers.push({
        name: invoiceData.customerName,
        phone: invoiceData.customerPhone,
        totalSpent: invoiceData.total,
        orderCount: 1,
        firstOrderDate: invoiceData.invoiceDate,
        lastOrderDate: invoiceData.invoiceDate
      });
      analyticsData.customersCount += 1;
    }

    // Sort top customers by total spent
    analyticsData.topCustomers.sort((a: any, b: any) => b.totalSpent - a.totalSpent);

    // Keep only top 50 customers for performance
    analyticsData.topCustomers = analyticsData.topCustomers.slice(0, 50);

    // Calculate business valuation (simplified: 3x annual revenue)
    analyticsData.businessValuation = analyticsData.totalRevenue * 3;

    // Calculate growth rates (simplified: compare with previous month)
    const months = Object.keys(analyticsData.salesByMonth).sort();
    if (months.length >= 2) {
      const currentMonthData = analyticsData.salesByMonth[months[months.length - 1]];
      const previousMonthData = analyticsData.salesByMonth[months[months.length - 2]];

      analyticsData.revenueGrowth = previousMonthData.revenue > 0
        ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100
        : 0;

      analyticsData.orderGrowth = previousMonthData.orders > 0
        ? ((currentMonthData.orders - previousMonthData.orders) / previousMonthData.orders) * 100
        : 0;
    }

    // Convert Set to array for storage
    Object.keys(analyticsData.salesByMonth).forEach(month => {
      if (analyticsData.salesByMonth[month].customers instanceof Set) {
        analyticsData.salesByMonth[month].customers = Array.from(analyticsData.salesByMonth[month].customers);
      }
    });

    localStorage.setItem('insygth_analytics', JSON.stringify(analyticsData));
  };

  const handleGenerateInvoice = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before generating invoice",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const invoiceData = {
        ...saleData,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        balance: calculateBalance(),
        status: calculateBalance() === 0 ? 'paid' : 'pending'
      };

      const invoice = await invoiceService.createInvoice(invoiceData);

      // Update analytics automatically
      updateAnalytics(invoiceData);

      // Update CRM customer data if customer exists
      const existingCustomers = localStorage.getItem('insygth_customers');
      if (existingCustomers) {
        const customersData = JSON.parse(existingCustomers);
        const customerIndex = customersData.findIndex(
          (customer: any) => customer.phone === saleData.customerPhone
        );

        if (customerIndex >= 0) {
          customersData[customerIndex].totalOrders = (customersData[customerIndex].totalOrders || 0) + 1;
          customersData[customerIndex].totalSpent = (customersData[customerIndex].totalSpent || 0) + invoiceData.total;
          customersData[customerIndex].averageOrderValue = customersData[customerIndex].totalSpent / customersData[customerIndex].totalOrders;
          customersData[customerIndex].lastOrderDate = invoiceData.invoiceDate;
          customersData[customerIndex].updatedAt = new Date().toISOString();

          // Update customer segment based on spending
          if (customersData[customerIndex].totalSpent > 100000) {
            customersData[customerIndex].segment = 'vip';
          } else if (customersData[customerIndex].totalSpent > 50000) {
            customersData[customerIndex].segment = 'high_value';
          } else if (customersData[customerIndex].totalSpent > 10000) {
            customersData[customerIndex].segment = 'medium_value';
          } else {
            customersData[customerIndex].segment = 'low_value';
          }

          localStorage.setItem('insygth_customers', JSON.stringify(customersData));
        }
      }

      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoice.invoiceNumber} created successfully. Analytics updated automatically.`,
        variant: "default"
      });

      // Navigate to invoice preview
      navigate(`/dashboard/sales-documents/invoice/${invoice.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        ...saleData,
        isDraft: true,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        balance: calculateBalance()
      };

      await invoiceService.saveDraft(draftData);
      
      toast({
        title: "Draft Saved",
        description: "Sale draft saved successfully",
        variant: "default"
      });

      navigate('/dashboard/sales-documents');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Sale Invoice</CardTitle>
            <CardDescription>Create an invoice with product selection, payment mode and pending handling.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddSaleInvoiceForm />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Add New Sale
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Enter sale details to generate a professional invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={saleData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        placeholder="Enter customer name"
                        className={errors.customerName ? 'border-red-500' : ''}
                      />
                      {errors.customerName && (
                        <p className="text-sm text-red-500">{errors.customerName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Customer Phone *</Label>
                      <Input
                        id="customerPhone"
                        value={saleData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        placeholder="Enter phone number"
                        className={errors.customerPhone ? 'border-red-500' : ''}
                      />
                      {errors.customerPhone && (
                        <p className="text-sm text-red-500">{errors.customerPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sale Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sale Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Sale Amount *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={saleData.amount || ''}
                          onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-sm text-red-500">{errors.amount}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tax Rate (GST %)</Label>
                      <Select value={saleData.taxRate.toString()} onValueChange={(value) => handleInputChange('taxRate', parseFloat(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0% (No Tax)</SelectItem>
                          <SelectItem value="5">5% GST</SelectItem>
                          <SelectItem value="12">12% GST</SelectItem>
                          <SelectItem value="18">18% GST</SelectItem>
                          <SelectItem value="28">28% GST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description/Notes</Label>
                    <Textarea
                      id="description"
                      value={saleData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter sale description or notes (optional)"
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Date and Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Date & Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceDate">Invoice Date *</Label>
                      <Input
                        id="invoiceDate"
                        type="date"
                        value={saleData.invoiceDate}
                        onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                        className={errors.invoiceDate ? 'border-red-500' : ''}
                      />
                      {errors.invoiceDate && (
                        <p className="text-sm text-red-500">{errors.invoiceDate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date (Optional)</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={saleData.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                        min={saleData.invoiceDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receivedAmount">Received Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          id="receivedAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={saleData.receivedAmount || ''}
                          onChange={(e) => handleInputChange('receivedAmount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className={`pl-10 ${errors.receivedAmount ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.receivedAmount && (
                        <p className="text-sm text-red-500">{errors.receivedAmount}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({saleData.taxRate}%):</span>
                    <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  {saleData.receivedAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Received:</span>
                        <span className="font-medium text-green-600">₹{saleData.receivedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Balance:</span>
                        <span className={`font-medium ${calculateBalance() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{calculateBalance().toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Badge variant={calculateBalance() === 0 ? 'default' : 'secondary'} className="w-full justify-center">
                    {calculateBalance() === 0 ? 'Fully Paid' : `Balance: ₹${calculateBalance().toFixed(2)}`}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleGenerateInvoice}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Generate Invoice
                      </div>
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveDraft}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSale;
