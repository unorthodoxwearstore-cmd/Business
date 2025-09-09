import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  inventoryService, 
  Product, 
  InventoryBatch, 
  ExpiryAlert,
  StockMovement
} from '@/lib/inventory-service';
import { 
  Package, 
  Calendar, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  TrendingDown,
  Warehouse,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  ShoppingCart,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/lib/permissions';
import { formatCurrency } from '@/lib/business-data';

export default function InventoryBatches() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showBatchDetail, setShowBatchDetail] = useState<InventoryBatch | null>(null);
  const [newBatch, setNewBatch] = useState<any>({
    productId: '',
    batchNumber: '',
    quantity: 0,
    expiryDate: '',
    manufacturedDate: '',
    supplierName: '',
    costPrice: 0,
    sellingPrice: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(inventoryService.getProducts());
    setBatches(inventoryService.getBatches());
    setExpiryAlerts(inventoryService.getExpiryAlerts(false));
    setLowStockProducts(inventoryService.getLowStockProducts());
  };

  const handleAddBatch = () => {
    if (!newBatch.productId || !newBatch.batchNumber || newBatch.quantity <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const product = products.find(p => p.id === newBatch.productId);
      if (!product) return;

      inventoryService.addBatch({
        ...newBatch,
        status: 'active',
        hasExpiry: product.hasExpiry && !!newBatch.expiryDate
      });

      toast({
        title: "Batch Added",
        description: `Batch ${newBatch.batchNumber} added successfully`,
        variant: "default"
      });

      setNewBatch({
        productId: '',
        batchNumber: '',
        quantity: 0,
        expiryDate: '',
        manufacturedDate: '',
        supplierName: '',
        costPrice: 0,
        sellingPrice: 0
      });
      setShowAddBatch(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add batch",
        variant: "destructive"
      });
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    const success = inventoryService.acknowledgeExpiryAlert(alertId, 'current_user', 'Current User');
    if (success) {
      toast({
        title: "Alert Acknowledged",
        description: "Expiry alert has been acknowledged",
        variant: "default"
      });
      loadData();
    }
  };

  const filteredBatches = batches.filter(batch => {
    const product = products.find(p => p.id === batch.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === 'all' || batch.productId === selectedProduct;
    const matchesStatus = selectedStatus === 'all' || batch.status === selectedStatus;
    
    return matchesSearch && matchesProduct && matchesStatus;
  });

  const getStatusColor = (status: InventoryBatch['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'recalled': return 'bg-yellow-100 text-yellow-800';
      case 'sold_out': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertLevelColor = (level: ExpiryAlert['alertLevel']) => {
    switch (level) {
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access inventory management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const criticalAlerts = expiryAlerts.filter(alert => alert.alertLevel === 'critical' || alert.alertLevel === 'expired');
  const warningAlerts = expiryAlerts.filter(alert => alert.alertLevel === 'warning');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            Inventory Batch Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            Manage product batches, expiry dates, and stock movements
          </p>
        </div>
        
        <Button onClick={() => setShowAddBatch(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Batch
        </Button>
      </div>

      {/* Alerts Section */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="space-y-4">
          {criticalAlerts.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-800">
                    {criticalAlerts.length} product batch(es) are expired or expiring soon!
                  </span>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    View Details
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {warningAlerts.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-800">
                    {warningAlerts.length} product batch(es) will expire within 30 days
                  </span>
                  <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-200">
                    Review Inventory
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Batches</p>
                <p className="text-2xl font-bold mt-2">
                  {batches.filter(b => b.status === 'active').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiry Alerts</p>
                <p className="text-2xl font-bold mt-2">{expiryAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold mt-2">{lowStockProducts.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(batches.reduce((sum, batch) => sum + (batch.quantity * batch.costPrice), 0))}
                </p>
              </div>
              <Warehouse className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="batches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="batches">Inventory Batches</TabsTrigger>
          <TabsTrigger value="alerts">Expiry Alerts ({expiryAlerts.length})</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock ({lowStockProducts.length})</TabsTrigger>
        </TabsList>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Batches</CardTitle>
              <CardDescription>
                Manage product batches with expiry tracking and stock movements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search batches, products, or suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                    <SelectItem value="recalled">Recalled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Batches List */}
              <div className="space-y-4">
                {filteredBatches.map((batch) => {
                  const product = products.find(p => p.id === batch.productId);
                  const daysToExpiry = batch.expiryDate ? 
                    Math.floor((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
                    null;
                  
                  return (
                    <div key={batch.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          batch.status === 'expired' ? 'bg-red-100 text-red-600' :
                          daysToExpiry !== null && daysToExpiry <= 7 ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium">{product?.name}</p>
                          <p className="text-sm text-gray-500">
                            Batch: {batch.batchNumber} • Qty: {batch.quantity} {product?.unit}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(batch.status)}>
                              {batch.status.replace('_', ' ')}
                            </Badge>
                            {daysToExpiry !== null && (
                              <Badge variant="outline" className={
                                daysToExpiry < 0 ? 'text-red-600 border-red-200' :
                                daysToExpiry <= 7 ? 'text-orange-600 border-orange-200' :
                                daysToExpiry <= 30 ? 'text-yellow-600 border-yellow-200' :
                                'text-green-600 border-green-200'
                              }>
                                {daysToExpiry < 0 ? `Expired ${Math.abs(daysToExpiry)} days ago` :
                                 daysToExpiry === 0 ? 'Expires today' :
                                 `${daysToExpiry} days to expiry`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBatchDetail(batch)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filteredBatches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No batches found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiry Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Expiry Alerts
              </CardTitle>
              <CardDescription>
                Products that are expired or expiring soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expiryAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertLevelColor(alert.alertLevel)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          alert.alertLevel === 'expired' ? 'bg-red-200 text-red-700' :
                          alert.alertLevel === 'critical' ? 'bg-orange-200 text-orange-700' :
                          'bg-yellow-200 text-yellow-700'
                        }`}>
                          {alert.alertLevel === 'expired' ? <XCircle className="w-5 h-5" /> :
                           alert.alertLevel === 'critical' ? <AlertTriangle className="w-5 h-5" /> :
                           <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{alert.productName}</p>
                          <p className="text-sm">
                            Batch: {alert.batchNumber} • Qty: {alert.quantity}
                          </p>
                          <p className="text-sm">
                            {alert.daysToExpiry < 0 ? 
                              `Expired ${Math.abs(alert.daysToExpiry)} days ago` :
                              alert.daysToExpiry === 0 ?
                              'Expires today' :
                              `Expires in ${alert.daysToExpiry} days`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))}

                {expiryAlerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <p>No expiry alerts</p>
                    <p className="text-sm">All products are within safe expiry limits</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Low Stock Products
              </CardTitle>
              <CardDescription>
                Products that need restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.map(({ product, currentStock, requiredStock }) => (
                  <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Current: {currentStock} {product.unit} • Required: {requiredStock} {product.unit}
                        </p>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((currentStock / requiredStock) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Restock
                    </Button>
                  </div>
                ))}

                {lowStockProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <p>All products are adequately stocked</p>
                    <p className="text-sm">No restocking required at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Batch Dialog */}
      <Dialog open={showAddBatch} onOpenChange={setShowAddBatch}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
            <DialogDescription>
              Create a new inventory batch with expiry tracking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productSelect">Product</Label>
              <Select value={newBatch.productId} onValueChange={(value) => {
                const product = products.find(p => p.id === value);
                setNewBatch({ 
                  ...newBatch, 
                  productId: value,
                  costPrice: product?.defaultCostPrice || 0,
                  sellingPrice: product?.defaultSellingPrice || 0
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.trackBatches).map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  value={newBatch.batchNumber}
                  onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                  placeholder="Enter batch number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={newBatch.quantity}
                  onChange={(e) => setNewBatch({ ...newBatch, quantity: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturedDate">Manufactured Date</Label>
                <Input
                  id="manufacturedDate"
                  type="date"
                  value={newBatch.manufacturedDate}
                  onChange={(e) => setNewBatch({ ...newBatch, manufacturedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newBatch.expiryDate}
                  onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={newBatch.supplierName}
                onChange={(e) => setNewBatch({ ...newBatch, supplierName: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBatch.costPrice}
                  onChange={(e) => setNewBatch({ ...newBatch, costPrice: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBatch.sellingPrice}
                  onChange={(e) => setNewBatch({ ...newBatch, sellingPrice: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAddBatch(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBatch}>
              Add Batch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Detail Dialog */}
      {showBatchDetail && (
        <Dialog open={!!showBatchDetail} onOpenChange={() => setShowBatchDetail(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Batch Details</DialogTitle>
              <DialogDescription>
                Detailed information for batch {showBatchDetail.batchNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Product</Label>
                  <p className="text-sm">{products.find(p => p.id === showBatchDetail.productId)?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Batch Number</Label>
                  <p className="text-sm">{showBatchDetail.batchNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Quantity</Label>
                  <p className="text-sm">{showBatchDetail.quantity} {products.find(p => p.id === showBatchDetail.productId)?.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(showBatchDetail.status)}>
                    {showBatchDetail.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Supplier</Label>
                  <p className="text-sm">{showBatchDetail.supplierName || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cost Price</Label>
                  <p className="text-sm">{formatCurrency(showBatchDetail.costPrice)}</p>
                </div>
              </div>

              {/* Dates */}
              {(showBatchDetail.manufacturedDate || showBatchDetail.expiryDate) && (
                <div className="grid grid-cols-2 gap-4">
                  {showBatchDetail.manufacturedDate && (
                    <div>
                      <Label className="text-sm font-medium">Manufactured Date</Label>
                      <p className="text-sm">{new Date(showBatchDetail.manufacturedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {showBatchDetail.expiryDate && (
                    <div>
                      <Label className="text-sm font-medium">Expiry Date</Label>
                      <p className="text-sm">{new Date(showBatchDetail.expiryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Movements */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Recent Stock Movements</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {inventoryService.getStockMovements(showBatchDetail.productId, showBatchDetail.id).slice(0, 10).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          movement.type === 'in' ? 'bg-green-500' : 
                          movement.type === 'out' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-sm">{movement.reason}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{movement.type === 'out' ? '-' : '+'}{movement.quantity}</p>
                        <p className="text-xs text-gray-500">{new Date(movement.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowBatchDetail(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
