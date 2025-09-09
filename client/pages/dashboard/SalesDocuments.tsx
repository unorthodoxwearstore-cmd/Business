import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { invoiceService, Invoice, InvoiceData } from '@/lib/invoice-service';
import EmptyState from '@/components/EmptyState';
import { usePermissions } from '@/lib/permissions';

const SalesDocuments: React.FC = () => {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [drafts, setDrafts] = useState<InvoiceData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'customer'>('date');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      setInvoices(invoiceService.getInvoices());
      setDrafts(invoiceService.getDrafts());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sales documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
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
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      invoiceService.deleteInvoice(invoiceId);
      loadData();
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDraft = async (draftIndex: number) => {
    try {
      invoiceService.deleteDraft(draftIndex);
      loadData();
      toast({
        title: "Success",
        description: "Draft deleted successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
    }
  };

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
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
        <div className="max-w-7xl mx-auto px-4">
          <Card className="text-center p-8">
            <CardContent>
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to view sales documents.
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
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
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
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Sales Documents</h1>
            <p className="text-gray-600 text-lg">Manage invoices, drafts, and sales documents</p>
          </div>
          <Link to="/dashboard/add-sale">
            <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add New Sale
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Sales</p>
                  <p className="text-2xl font-bold text-green-900">₹{invoiceService.getTotalSales().toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Pending Amount</p>
                  <p className="text-2xl font-bold text-yellow-900">₹{invoiceService.getTotalPendingAmount().toFixed(2)}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Paid Invoices</p>
                  <p className="text-2xl font-bold text-blue-900">{invoiceService.getPaidInvoicesCount()}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Overdue</p>
                  <p className="text-2xl font-bold text-red-900">{invoiceService.getOverdueInvoicesCount()}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search invoices by customer, invoice number, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortField} onValueChange={(value) => setSortField(value as any)}>
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all'
                    ? "No invoices match your current filters. Try adjusting your search criteria."
                    : "Start generating professional invoices for your sales. Create your first invoice to get started."
                  }
                </p>
                {(!searchQuery && statusFilter === 'all') && (
                  <Link to="/dashboard/add-sale">
                    <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Invoice
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="card-hover shadow-md border-0 bg-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(invoice.status)}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {invoice.invoiceNumber}
                            </h3>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Customer:</span>
                              <p className="text-gray-900">{invoice.customerName}</p>
                            </div>
                            <div>
                              <span className="font-medium">Date:</span>
                              <p className="text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span>
                              <p className="text-gray-900 font-semibold">₹{invoice.total.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Balance:</span>
                              <p className={`font-semibold ${invoice.balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{invoice.balance.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {invoice.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{invoice.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/dashboard/sales-documents/invoice/${invoice.id}`}>
                            <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                              <Eye className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete invoice {invoice.invoiceNumber}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="space-y-6">
            {drafts.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No drafts saved</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Draft sales will appear here when you save incomplete invoices. Start creating a new sale to save drafts.
                </p>
                <Link to="/dashboard/add-sale">
                  <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Sale
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              Draft Sale
                            </h3>
                            <Badge variant="outline">Draft</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Customer:</span>
                              <p className="text-gray-900">{draft.customerName || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span>
                              <p className="text-gray-900 font-semibold">₹{draft.total.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Created:</span>
                              <p className="text-gray-900">{new Date(draft.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {draft.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{draft.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this draft? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDraft(index)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalesDocuments;
