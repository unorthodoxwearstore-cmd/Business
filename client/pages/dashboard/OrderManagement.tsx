import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  ShoppingCart,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  Package,
  X,
  Filter,
  Download
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { dataManager, Order, Product } from '@/lib/data-manager';
import { usePermissions } from '@/lib/permissions';

const OrderManagement: React.FC = () => {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    products: [] as Array<{ productId: string; quantity: number; price: number }>,
    notes: ''
  });

  const [selectedProducts, setSelectedProducts] = useState<Array<{ product: Product; quantity: number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadData = () => {
    try {
      const allOrders = dataManager.getAllOrders();
      const allProducts = dataManager.getAllProducts().filter(p => p.isActive);
      setOrders(allOrders);
      setProducts(allProducts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleAddOrder = () => {
    if (!formData.customerName || selectedProducts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and add at least one product",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderProducts = selectedProducts.map(sp => ({
        productId: sp.product.id,
        productName: sp.product.name,
        quantity: sp.quantity,
        price: sp.product.price,
        total: sp.quantity * sp.product.price
      }));

      const subtotal = orderProducts.reduce((sum, p) => sum + p.total, 0);
      const tax = subtotal * 0.18; // 18% GST
      const total = subtotal + tax;

      const newOrder = dataManager.addOrder({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        products: orderProducts,
        subtotal,
        tax,
        total,
        status: 'pending',
        notes: formData.notes
      });

      setOrders(prev => [...prev, newOrder]);
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Order created successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = dataManager.updateOrderStatus(orderId, newStatus);
      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        toast({
          title: "Success",
          description: `Order status updated to ${newStatus}`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      products: [],
      notes: ''
    });
    setSelectedProducts([]);
  };

  const addProductToOrder = (product: Product) => {
    const existing = selectedProducts.find(sp => sp.product.id === product.id);
    if (existing) {
      setSelectedProducts(prev =>
        prev.map(sp =>
          sp.product.id === product.id
            ? { ...sp, quantity: sp.quantity + 1 }
            : sp
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(prev => prev.filter(sp => sp.product.id !== productId));
    } else {
      setSelectedProducts(prev =>
        prev.map(sp =>
          sp.product.id === productId
            ? { ...sp, quantity }
            : sp
        )
      );
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
      processing: { label: 'Processing', className: 'bg-purple-100 text-purple-800' },
      shipped: { label: 'Shipped', className: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Calculate stats
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const todayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === new Date().toDateString()).length;

  if (!permissions.hasPermission('viewAddEditOrders')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="text-center p-8">
            <CardContent>
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to manage orders.
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
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Track and manage customer orders</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Add customer details and select products
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Customer Phone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Product Selection */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Select Products</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                    {products.map(product => (
                      <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium">{product.name}</h5>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addProductToOrder(product)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">₹{product.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Selected Products</h4>
                    <div className="space-y-2">
                      {selectedProducts.map(sp => (
                        <div key={sp.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{sp.product.name}</span>
                            <span className="text-sm text-gray-600 ml-2">₹{sp.product.price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProductQuantity(sp.product.id, sp.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{sp.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProductQuantity(sp.product.id, sp.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updateProductQuantity(sp.product.id, 0)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₹{selectedProducts.reduce((sum, sp) => sum + (sp.quantity * sp.product.price), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (18%):</span>
                        <span>₹{(selectedProducts.reduce((sum, sp) => sum + (sp.quantity * sp.product.price), 0) * 0.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>₹{(selectedProducts.reduce((sum, sp) => sum + (sp.quantity * sp.product.price), 0) * 1.18).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddOrder}
                  disabled={!formData.customerName || selectedProducts.length === 0}
                >
                  Create Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Active Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{pendingOrders}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{completedOrders}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Revenue</p>
                  <p className="text-2xl font-bold text-purple-900">₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Today's Orders</p>
                  <p className="text-2xl font-bold text-orange-900">{todayOrders}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search orders by customer name, phone, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? "No orders match your current filters."
                : "Start taking orders from your customers to see them here."
              }
            </p>
            {(!searchQuery && statusFilter === 'all') && (
              <Button onClick={() => setShowAddDialog(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Order
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="card-hover shadow-md border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(order.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Customer:</span>
                          <p className="text-gray-900">{order.customerName}</p>
                          {order.customerPhone && (
                            <p className="text-gray-600">{order.customerPhone}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Order Date:</span>
                          <p className="text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Items:</span>
                          <p className="text-gray-900">{order.products.length} product(s)</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Total:</span>
                          <p className="text-gray-900 font-semibold">₹{order.total.toFixed(2)}</p>
                        </div>
                      </div>
                      {order.notes && (
                        <p className="text-sm text-gray-600 mt-3 italic">Note: {order.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      
                      {order.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Confirm
                        </Button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          Process
                        </Button>
                      )}
                      
                      {order.status === 'processing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Ship
                        </Button>
                      )}
                      
                      {order.status === 'shipped' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="text-green-600 hover:text-green-700"
                        >
                          Deliver
                        </Button>
                      )}

                      {['pending', 'confirmed'].includes(order.status) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this order? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Yes, Cancel Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                {selectedOrder && `Order #${selectedOrder.id.slice(-8).toUpperCase()}`}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Customer Information</h4>
                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                    {selectedOrder.customerPhone && (
                      <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                    )}
                    <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                    {selectedOrder.deliveryDate && (
                      <p><strong>Delivery Date:</strong> {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Order Status</h4>
                    {getStatusBadge(selectedOrder.status)}
                    {selectedOrder.notes && (
                      <div className="mt-3">
                        <p><strong>Notes:</strong></p>
                        <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-600">₹{product.price.toFixed(2)} × {product.quantity}</p>
                        </div>
                        <p className="font-semibold">₹{product.total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span>Tax:</span>
                    <span>₹{selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrderManagement;
