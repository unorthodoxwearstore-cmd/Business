import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Share2, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar,
  Phone,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { invoiceService, Invoice } from '@/lib/invoice-service';
import { authService } from '@/lib/auth-service';
import { usePermissions } from '@/lib/permissions';
import ProfessionalInvoice from '@/components/ProfessionalInvoice';
import InvoiceCustomizationModal from '@/components/InvoiceCustomization';
import {
  InvoiceData,
  InvoiceCustomization,
  professionalInvoiceService
} from '@/lib/professional-invoice-service';

const InvoicePreview: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const permissions = usePermissions();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customization, setCustomization] = useState<Partial<InvoiceCustomization>>({});

  useEffect(() => {
    if (invoiceId) {
      loadInvoice(invoiceId);
    }
  }, [invoiceId]);

  const convertToInvoiceData = (invoice: Invoice): InvoiceData => {
    const items = (invoice.items || []).map((item, index) => ({
      id: (index + 1).toString(),
      description: `${item.productName}${item.description ? ` - ${item.description}` : ''}`,
      hsn: item.hsnCode || '',
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      rate: item.unitPrice,
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
      amount: item.total
    }));

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt,
      dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        name: invoice.customer?.name || 'Customer',
        address: `${invoice.customer?.address || ''}${invoice.customer?.city ? `\n${invoice.customer.city}` : ''}`,
        phone: invoice.customer?.phone || '',
        email: invoice.customer?.email || '',
        gstNumber: invoice.customer?.gstNumber || ''
      },
      items,
      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount || 0,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.total,
      totalInWords: professionalInvoiceService.convertToWords(invoice.total),
      notes: invoice.notes || 'Thank you for your business!',
      bankDetails: {
        accountName: 'Your Company Name',
        accountNumber: '1234567890',
        bankName: 'Your Bank',
        ifscCode: 'BANK0001234',
        branch: 'Main Branch'
      }
    };
  };

  const loadInvoice = (id: string) => {
    try {
      const foundInvoice = invoiceService.getInvoiceById(id);
      if (foundInvoice) {
        setInvoice(foundInvoice);
        setPaymentAmount(foundInvoice.balance);
      } else {
        toast({
          title: "Error",
          description: "Invoice not found",
          variant: "destructive"
        });
        navigate('/dashboard/sales-documents');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive"
      });
      navigate('/dashboard/sales-documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    try {
      await invoiceService.downloadInvoice(invoice);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!invoice || !navigator.share) {
      // Fallback: copy link to clipboard
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Invoice link copied to clipboard",
          variant: "default"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      await navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice for ${invoice.customerName} - ₹${invoice.total.toFixed(2)}`,
        url: window.location.href
      });
    } catch (error) {
      // User cancelled or error occurred
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    
    try {
      invoiceService.deleteInvoice(invoice.id);
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
        variant: "default"
      });
      navigate('/dashboard/sales-documents');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
    }
  };

  const handleRecordPayment = () => {
    if (!invoice || paymentAmount <= 0 || paymentAmount > invoice.balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    // Update the invoice with payment
    const updatedInvoice = {
      ...invoice,
      receivedAmount: invoice.receivedAmount + paymentAmount,
      balance: invoice.balance - paymentAmount,
      status: (invoice.balance - paymentAmount) === 0 ? 'paid' : invoice.status,
      updatedAt: new Date().toISOString()
    } as Invoice;

    // Update in service (in a real app, this would be an API call)
    const invoices = invoiceService.getInvoices();
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    if (index > -1) {
      invoices[index] = updatedInvoice;
      localStorage.setItem('hisaabb_invoices', JSON.stringify(invoices));
      setInvoice(updatedInvoice);
      setShowPaymentDialog(false);
      setPaymentAmount(updatedInvoice.balance);
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully`,
        variant: "default"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
                You don't have permission to view invoices.
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="bg-red-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              The requested invoice could not be found. It may have been deleted or the link may be incorrect.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/dashboard/sales-documents')}
                className="shadow-md hover:shadow-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sales Documents
              </Button>
              <div className="text-sm text-gray-500">
                <Link to="/dashboard/add-sale" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Create a new invoice instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = authService.getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-3">
            {getStatusIcon(invoice.status)}
            <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
            {getStatusBadge(invoice.status)}
          </div>
          <div className="flex flex-wrap gap-2">
            {invoice.balance > 0 && (
              <Button 
                variant="default"
                onClick={() => setShowPaymentDialog(true)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={() => setShowCustomization(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Customize
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this invoice? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Invoice Content */}
        <Card className="mb-8">
          <CardContent className="p-8 print:p-0 print:shadow-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-lg text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900">{invoice.businessName}</h2>
                <p className="text-gray-600 capitalize">{invoice.businessType} Business</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900 mb-2">{invoice.customerName}</p>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{invoice.customerPhone}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details:</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold capitalize ${
                      invoice.status === 'paid' ? 'text-green-600' : 
                      invoice.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{invoice.description}</p>
                </div>
              </div>
            )}

            {/* Amount Breakdown */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({invoice.taxRate}% GST):</span>
                  <span className="font-semibold">₹{invoice.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span>₹{invoice.total.toFixed(2)}</span>
                </div>
                {invoice.receivedAmount > 0 && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Amount Received:</span>
                      <span className="font-semibold text-green-600">₹{invoice.receivedAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Balance Due:</span>
                      <span className={invoice.balance === 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{invoice.balance.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Status */}
            <div className={`text-center p-6 rounded-lg mb-8 ${
              invoice.status === 'paid' ? 'bg-green-50 border border-green-200' :
              invoice.status === 'overdue' ? 'bg-red-50 border border-red-200' :
              'bg-yellow-50 border border-yellow-200'
            }`}>
              <h3 className={`text-lg font-bold uppercase tracking-wider ${
                invoice.status === 'paid' ? 'text-green-800' :
                invoice.status === 'overdue' ? 'text-red-800' :
                'text-yellow-800'
              }`}>
                {invoice.status === 'paid' ? 'PAID IN FULL' : 
                 invoice.status === 'overdue' ? 'OVERDUE' : 'PAYMENT PENDING'}
              </h3>
            </div>

            {/* Footer */}
            <div className="text-center border-t pt-6 text-gray-500 text-sm">
              <p className="mb-2">Thank you for your business!</p>
              <p>Generated on {new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Invoice Alternative View */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Professional Invoice Template
            </CardTitle>
            <CardDescription>
              Enhanced invoice design with customization options
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoice && (
              <ProfessionalInvoice
                invoiceData={convertToInvoiceData(invoice)}
                customization={customization}
                showActions={true}
              />
            )}
          </CardContent>
        </Card>

        {/* Invoice Customization Modal */}
        <InvoiceCustomizationModal
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
          onSave={setCustomization}
          currentCustomization={customization}
        />

        {/* Payment Dialog */}
        <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Record Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Record a payment for invoice {invoice.invoiceNumber}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <p className="font-semibold">₹{invoice.total.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Amount Received:</span>
                  <p className="font-semibold text-green-600">₹{invoice.receivedAmount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Balance Due:</span>
                  <p className="font-semibold text-red-600">₹{invoice.balance.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    max={invoice.balance}
                    step="0.01"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(invoice.balance)}
                  >
                    Full Amount
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(invoice.balance / 2)}
                  >
                    Half Amount
                  </Button>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRecordPayment}
                disabled={paymentAmount <= 0 || paymentAmount > invoice.balance}
              >
                Record Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default InvoicePreview;
