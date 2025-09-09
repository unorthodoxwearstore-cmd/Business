import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/lib/permissions';
import { Search, Plus, Download, FileText, Calendar,
         DollarSign, Printer, Send, Eye, Edit } from 'lucide-react';
import BackButton from '@/components/BackButton';

interface InvoiceItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerAddress: string;
  customerGSTIN?: string;
  customerPhone: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: string;
  notes?: string;
  createdBy: string;
  lastModified: string;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
  paymentTerms: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  unit: string;
  taxRate: number;
  available: number;
}

const InvoiceGenerator: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New invoice form state
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    taxAmount: 0,
    totalAmount: 0,
    status: 'draft',
    paymentTerms: '30 days'
  });

  // Simulated data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'ABC Electronics Ltd',
        address: '123 Business Park, Mumbai, MH 400001',
        phone: '+91-9876543210',
        email: 'orders@abcelectronics.com',
        gstin: '27ABCDE1234F1Z5',
        paymentTerms: '30 days'
      },
      {
        id: '2',
        name: 'Retail Chain Solutions',
        address: '789 Commercial Street, Bangalore, KA 560001',
        phone: '+91-9876543212',
        email: 'purchase@retailchain.com',
        paymentTerms: '15 days'
      },
      {
        id: '3',
        name: 'Premium Distributors',
        address: '321 Market Plaza, Chennai, TN 600001',
        phone: '+91-9876543213',
        email: 'orders@premiumdist.com',
        gstin: '33FGHIJ5678K2L9',
        paymentTerms: '45 days'
      }
    ];

    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Basmati Rice',
        sku: 'RICE-PREM-001',
        price: 150,
        unit: 'kg',
        taxRate: 5,
        available: 5000
      },
      {
        id: '2',
        name: 'Refined Sunflower Oil',
        sku: 'OIL-SUN-001',
        price: 120,
        unit: 'liters',
        taxRate: 18,
        available: 800
      },
      {
        id: '3',
        name: 'Organic Pulses Mix',
        sku: 'PULSE-ORG-001',
        price: 220,
        unit: 'kg',
        taxRate: 5,
        available: 1500
      }
    ];

    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        date: '2024-01-15',
        dueDate: '2024-02-14',
        customerName: 'ABC Electronics Ltd',
        customerAddress: '123 Business Park, Mumbai, MH 400001',
        customerGSTIN: '27ABCDE1234F1Z5',
        customerPhone: '+91-9876543210',
        customerEmail: 'orders@abcelectronics.com',
        items: [
          {
            id: '1',
            productName: 'Premium Basmati Rice',
            productSku: 'RICE-PREM-001',
            quantity: 1000,
            unit: 'kg',
            unitPrice: 150,
            discount: 5,
            taxRate: 5,
            amount: 149250
          }
        ],
        subtotal: 150000,
        totalDiscount: 7500,
        taxAmount: 7125,
        totalAmount: 149625,
        status: 'sent',
        paymentTerms: '30 days',
        notes: 'Bulk order for retail distribution',
        createdBy: 'John Smith',
        lastModified: '2024-01-15'
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        date: '2024-01-12',
        dueDate: '2024-01-27',
        customerName: 'Retail Chain Solutions',
        customerAddress: '789 Commercial Street, Bangalore, KA 560001',
        customerPhone: '+91-9876543212',
        customerEmail: 'purchase@retailchain.com',
        items: [
          {
            id: '1',
            productName: 'Refined Sunflower Oil',
            productSku: 'OIL-SUN-001',
            quantity: 500,
            unit: 'liters',
            unitPrice: 120,
            discount: 0,
            taxRate: 18,
            amount: 70800
          }
        ],
        subtotal: 60000,
        totalDiscount: 0,
        taxAmount: 10800,
        totalAmount: 70800,
        status: 'paid',
        paymentTerms: '15 days',
        createdBy: 'Sarah Wilson',
        lastModified: '2024-01-12'
      }
    ];

    setCustomers(mockCustomers);
    setProducts(mockProducts);
    setInvoices(mockInvoices);
    setLoading(false);
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateItemAmount = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate / 100);
    return afterDiscount + taxAmount;
  };

  const calculateInvoiceTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discount / 100), 0);
    const taxAmount = items.reduce((sum, item) => {
      const afterDiscount = (item.quantity * item.unitPrice) - (item.quantity * item.unitPrice * item.discount / 100);
      return sum + (afterDiscount * item.taxRate / 100);
    }, 0);
    const totalAmount = subtotal - totalDiscount + taxAmount;
    
    return { subtotal, totalDiscount, taxAmount, totalAmount };
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      productSku: '',
      quantity: 1,
      unit: 'kg',
      unitPrice: 0,
      discount: 0,
      taxRate: 5,
      amount: 0
    };
    
    setNewInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const updateInvoiceItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setNewInvoice(prev => {
      const updatedItems = (prev.items || []).map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.amount = calculateItemAmount(updatedItem);
          return updatedItem;
        }
        return item;
      });
      
      const totals = calculateInvoiceTotals(updatedItems);
      
      return {
        ...prev,
        items: updatedItems,
        ...totals
      };
    });
  };

  const removeInvoiceItem = (itemId: string) => {
    setNewInvoice(prev => {
      const updatedItems = (prev.items || []).filter(item => item.id !== itemId);
      const totals = calculateInvoiceTotals(updatedItems);
      
      return {
        ...prev,
        items: updatedItems,
        ...totals
      };
    });
  };

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateInvoiceItem(itemId, 'productName', product.name);
      updateInvoiceItem(itemId, 'productSku', product.sku);
      updateInvoiceItem(itemId, 'unitPrice', product.price);
      updateInvoiceItem(itemId, 'unit', product.unit);
      updateInvoiceItem(itemId, 'taxRate', product.taxRate);
    }
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${count.toString().padStart(3, '0')}`;
  };

  const saveInvoice = () => {
    if (!hasPermission('create_invoice')) return;
    
    const invoice: Invoice = {
      ...newInvoice,
      id: Date.now().toString(),
      invoiceNumber: newInvoice.invoiceNumber || generateInvoiceNumber(),
      date: newInvoice.date || new Date().toISOString().split('T')[0],
      createdBy: 'Current User',
      lastModified: new Date().toISOString().split('T')[0]
    } as Invoice;
    
    setInvoices(prev => [...prev, invoice]);
    setNewInvoice({
      items: [],
      subtotal: 0,
      totalDiscount: 0,
      taxAmount: 0,
      totalAmount: 0,
      status: 'draft',
      paymentTerms: '30 days'
    });
    setIsCreating(false);
  };

  const printInvoice = (invoice: Invoice) => {
    if (!hasPermission('print_invoice')) return;
    console.log('Printing invoice:', invoice.invoiceNumber);
  };

  const sendInvoice = (invoice: Invoice) => {
    if (!hasPermission('send_invoice')) return;
    console.log('Sending invoice:', invoice.invoiceNumber);
  };

  if (!hasPermission('view_invoices')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to view invoices.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading invoice generator...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Invoice Generator</CardTitle>
              <CardDescription>
                Create, manage and track wholesale invoices and billing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('create_invoice') && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              )}
              {hasPermission('export_reports') && (
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={isCreating ? "create" : "list"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" onClick={() => setIsCreating(false)}>Invoice List</TabsTrigger>
              <TabsTrigger value="create" onClick={() => setIsCreating(true)}>Create Invoice</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices by number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                          <div className="text-sm text-muted-foreground">{invoice.customerName}</div>
                          <Badge className={getStatusBadge(invoice.status)}>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(invoice.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Invoice Date</div>
                          <div>{formatDate(invoice.date)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Due Date</div>
                          <div>{formatDate(invoice.dueDate)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Payment Terms</div>
                          <div>{invoice.paymentTerms}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Created By</div>
                          <div>{invoice.createdBy}</div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(invoice.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discount:</span>
                            <span className="text-red-600">-{formatCurrency(invoice.totalDiscount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>{formatCurrency(invoice.taxAmount)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrency(invoice.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {hasPermission('edit_invoice') && (
                          <Button size="sm" variant="outline">
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        {hasPermission('print_invoice') && (
                          <Button size="sm" variant="outline" onClick={() => printInvoice(invoice)}>
                            <Printer className="mr-1 h-3 w-3" />
                            Print
                          </Button>
                        )}
                        {hasPermission('send_invoice') && invoice.status === 'draft' && (
                          <Button size="sm" onClick={() => sendInvoice(invoice)}>
                            <Send className="mr-1 h-3 w-3" />
                            Send
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Invoice</CardTitle>
                  <CardDescription>Fill in the details to generate a new invoice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Invoice Number</label>
                      <Input
                        placeholder={generateInvoiceNumber()}
                        value={newInvoice.invoiceNumber || ''}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Invoice Date</label>
                      <Input
                        type="date"
                        value={newInvoice.date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={newInvoice.dueDate || ''}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Terms</label>
                      <Select value={newInvoice.paymentTerms} onValueChange={(value) => setNewInvoice(prev => ({ ...prev, paymentTerms: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15 days">15 days</SelectItem>
                          <SelectItem value="30 days">30 days</SelectItem>
                          <SelectItem value="45 days">45 days</SelectItem>
                          <SelectItem value="60 days">60 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer</label>
                    <Select onValueChange={(customerId) => {
                      const customer = customers.find(c => c.id === customerId);
                      if (customer) {
                        setNewInvoice(prev => ({
                          ...prev,
                          customerName: customer.name,
                          customerAddress: customer.address,
                          customerPhone: customer.phone,
                          customerEmail: customer.email,
                          customerGSTIN: customer.gstin,
                          paymentTerms: customer.paymentTerms
                        }));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Invoice Items */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Invoice Items</label>
                      <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                    
                    {newInvoice.items?.map((item, index) => (
                      <Card key={item.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-xs font-medium">Product</label>
                            <Select onValueChange={(productId) => selectProduct(item.id, productId)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium">Quantity</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Unit Price</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Discount %</label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => updateInvoiceItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button type="button" variant="outline" size="sm" onClick={() => removeInvoiceItem(item.id)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-right text-sm">
                          Amount: {formatCurrency(item.amount)}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Invoice Summary */}
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(newInvoice.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Discount:</span>
                        <span className="text-red-600">-{formatCurrency(newInvoice.totalDiscount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tax:</span>
                        <span>{formatCurrency(newInvoice.taxAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(newInvoice.totalAmount || 0)}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      placeholder="Additional notes or terms..."
                      value={newInvoice.notes || ''}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={saveInvoice} disabled={!newInvoice.items?.length}>
                      <FileText className="mr-2 h-4 w-4" />
                      Save Invoice
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
