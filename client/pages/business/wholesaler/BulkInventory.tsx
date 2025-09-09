import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/lib/permissions';
import { Search, Package, AlertTriangle, TrendingUp, Plus,
         Download, Filter, BarChart3, Warehouse, Truck } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { dataManager } from '@/lib/data-manager';
import WholesalerBulkAddModal from '@/components/WholesalerBulkAddModal';

interface BulkProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  warehouse: string;
  supplier: string;
  lastPurchaseDate: string;
  expiryDate?: string;
  batchNumber?: string;
  qualityGrade: 'A' | 'B' | 'C';
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  unit: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  date: string;
  reference: string;
  remarks?: string;
  performedBy: string;
}

interface WarehouseSummary {
  warehouseId: string;
  warehouseName: string;
  location: string;
  totalProducts: number;
  totalValue: number;
  capacity: number;
  utilizationPercentage: number;
  lowStockItems: number;
  expiringSoon: number;
}

const BulkInventory: React.FC = () => {
  const permissions = usePermissions();
  const { toast } = useToast();
  const [products, setProducts] = useState<BulkProduct[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [warehouseSummary, setWarehouseSummary] = useState<WarehouseSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  // Load real data from the data management system
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      // Load regular products
      const allProducts = dataManager.getAllProducts();
      const wholesalerProducts = allProducts.filter(p =>
        p.businessTypes?.includes('wholesaler') || p.metadata?.businessType === 'wholesaler'
      );

      // Load wholesaler-specific data
      const wholesalerSpecificProducts = JSON.parse(localStorage.getItem('wholesaler_products') || '[]');

      // Transform to BulkProduct format
      const transformedProducts: BulkProduct[] = wholesalerProducts.map(p => {
        const wholesalerData = wholesalerSpecificProducts.find((wp: any) => wp.sku === p.sku) || {};

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          brand: wholesalerData.brand || 'Generic',
          currentStock: p.stock,
          minimumStock: p.lowStockThreshold || 10,
          maximumStock: wholesalerData.maximumStock || p.stock * 5,
          unit: wholesalerData.unitOfMeasure || 'pieces',
          unitCost: p.cost,
          sellingPrice: p.price,
          warehouse: wholesalerData.warehouse || 'Main Warehouse',
          supplier: wholesalerData.supplierName || 'Unknown Supplier',
          lastPurchaseDate: wholesalerData.manufactureDate || p.createdAt,
          expiryDate: wholesalerData.expiryDate,
          batchNumber: wholesalerData.batchLotNumber,
          qualityGrade: wholesalerData.qualityGrade || 'A',
          status: p.stock === 0 ? 'out_of_stock' :
                  p.stock <= p.lowStockThreshold ? 'low_stock' : 'in_stock'
        };
      });

      setProducts(transformedProducts);

      // Generate warehouse summary
      const warehouseGroups = transformedProducts.reduce((acc, product) => {
        const warehouse = product.warehouse;
        if (!acc[warehouse]) {
          acc[warehouse] = {
            warehouseId: warehouse.toLowerCase().replace(/\s+/g, '_'),
            warehouseName: warehouse,
            location: `${warehouse} Location`,
            totalProducts: 0,
            totalValue: 0,
            capacity: 10000,
            utilizationPercentage: 0,
            lowStockItems: 0,
            expiringSoon: 0
          };
        }

        acc[warehouse].totalProducts++;
        acc[warehouse].totalValue += product.currentStock * product.unitCost;
        acc[warehouse].utilizationPercentage = Math.min(95, (acc[warehouse].totalProducts / 100) * 85);

        if (product.status === 'low_stock') acc[warehouse].lowStockItems++;
        if (product.expiryDate) {
          const daysToExpiry = Math.ceil((new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysToExpiry <= 30) acc[warehouse].expiringSoon++;
        }

        return acc;
      }, {} as Record<string, WarehouseSummary>);

      setWarehouseSummary(Object.values(warehouseGroups));

      // Mock some stock movements
      const movements: StockMovement[] = [
        {
          id: 'mov_1',
          productId: transformedProducts[0]?.id || 'prod_1',
          productName: transformedProducts[0]?.name || 'Sample Product',
          type: 'purchase',
          quantity: 100,
          unit: 'pieces',
          date: new Date().toISOString(),
          reference: 'PO-2024-001',
          performedBy: 'System',
          toWarehouse: 'Main Warehouse'
        }
      ];
      setStockMovements(movements);

    } catch (error) {
      console.error('Error loading bulk inventory data:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = (newProducts: any[]) => {
    // Refresh data after bulk add
    loadData();
    setShowBulkAdd(false);

    toast({
      title: "Bulk Import Successful!",
      description: `${newProducts.length} products added to inventory`,
      variant: "default"
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesWarehouse = filterWarehouse === 'all' || product.warehouse === filterWarehouse;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getQualityBadge = (grade: string) => {
    const variants = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-yellow-100 text-yellow-800',
      C: 'bg-orange-100 text-orange-800'
    };
    return variants[grade as keyof typeof variants] || 'bg-gray-100 text-gray-800';
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
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateStockValue = (product: BulkProduct) => {
    return product.currentStock * product.unitCost;
  };

  const getStockLevel = (product: BulkProduct) => {
    const percentage = (product.currentStock / product.maximumStock) * 100;
    if (product.currentStock === 0) return 'empty';
    if (product.currentStock <= product.minimumStock) return 'low';
    if (percentage >= 80) return 'high';
    return 'medium';
  };

  const exportInventory = () => {
    if (!permissions.hasPermission('export_reports')) return;
    // Export inventory data via proper API
  };

  if (!permissions.hasPermission('view_inventory')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to view inventory.</p>
        </CardContent>
      </Card>
    );
  }

  if (permissions.businessType !== 'wholesaler') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Bulk Inventory is only available for wholesaler businesses.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading bulk inventory...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Warehouse Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouseSummary.map((warehouse) => (
          <Card key={warehouse.warehouseId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{warehouse.warehouseName}</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">{formatCurrency(warehouse.totalValue)}</div>
                <p className="text-xs text-muted-foreground">{warehouse.location}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Capacity Utilization</span>
                    <span>{warehouse.utilizationPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        warehouse.utilizationPercentage > 90 ? 'bg-red-500' : 
                        warehouse.utilizationPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${warehouse.utilizationPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Products: {warehouse.totalProducts}</span>
                  <span>Low Stock: {warehouse.lowStockItems}</span>
                </div>
                
                {warehouse.expiringSoon > 0 && (
                  <div className="flex items-center gap-1 text-sm text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{warehouse.expiringSoon} expiring soon</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bulk Inventory Management</CardTitle>
              <CardDescription>
                Manage wholesale inventory across multiple warehouses and suppliers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {permissions.hasPermission('create_product') && (
                <Button onClick={() => setShowBulkAdd(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Bulk Add Products
                </Button>
              )}
              {permissions.hasPermission('export_reports') && (
                <Button variant="outline" onClick={exportInventory}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="movements">Stock Movements</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU, or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Food Grains">Food Grains</SelectItem>
                    <SelectItem value="Cooking Oil">Cooking Oil</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Pulses">Pulses</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    <SelectItem value="Warehouse A">Warehouse A</SelectItem>
                    <SelectItem value="Warehouse B">Warehouse B</SelectItem>
                    <SelectItem value="Warehouse C">Warehouse C</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Product Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const stockLevel = getStockLevel(product);
                  const stockValue = calculateStockValue(product);
                  
                  return (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{product.category}</Badge>
                              <Badge className={getStatusBadge(product.status)}>
                                {product.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge className={getQualityBadge(product.qualityGrade)}>
                                Grade {product.qualityGrade}
                              </Badge>
                            </div>
                          </div>
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Current Stock</div>
                            <div className="font-semibold">
                              {product.currentStock.toLocaleString()} {product.unit}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Stock Value</div>
                            <div className="font-semibold">{formatCurrency(stockValue)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Unit Cost</div>
                            <div className="font-semibold">{formatCurrency(product.unitCost)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Selling Price</div>
                            <div className="font-semibold">{formatCurrency(product.sellingPrice)}</div>
                          </div>
                        </div>
                        
                        {/* Stock Level Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Stock Level</span>
                            <span>{((product.currentStock / product.maximumStock) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                stockLevel === 'empty' ? 'bg-red-500' :
                                stockLevel === 'low' ? 'bg-orange-500' : 
                                stockLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((product.currentStock / product.maximumStock) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Min: {product.minimumStock}</span>
                            <span>Max: {product.maximumStock}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Brand:</span>
                            <span>{product.brand}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Warehouse:</span>
                            <span>{product.warehouse}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supplier:</span>
                            <span>{product.supplier}</span>
                          </div>
                          {product.batchNumber && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Batch:</span>
                              <span>{product.batchNumber}</span>
                            </div>
                          )}
                          {product.expiryDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expires:</span>
                              <span>{formatDate(product.expiryDate)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Purchase:</span>
                            <span>{formatDate(product.lastPurchaseDate)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="movements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Stock Movements</CardTitle>
                  <CardDescription>Track all inventory transactions and transfers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stockMovements.map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={movement.type === 'purchase' ? 'default' : 
                                           movement.type === 'sale' ? 'destructive' : 'secondary'}>
                              {movement.type.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{movement.productName}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(movement.date)} | Ref: {movement.reference}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {movement.fromWarehouse && `From: ${movement.fromWarehouse}`}
                            {movement.fromWarehouse && movement.toWarehouse && ' → '}
                            {movement.toWarehouse && `To: ${movement.toWarehouse}`}
                          </div>
                          {movement.remarks && (
                            <div className="text-sm text-muted-foreground italic">
                              {movement.remarks}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className={`font-medium ${
                            movement.type === 'purchase' || movement.type === 'return' ? 'text-green-600' : 
                            movement.type === 'sale' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {movement.type === 'purchase' || movement.type === 'return' ? '+' : 
                             movement.type === 'sale' || movement.type === 'adjustment' ? '' : '±'}
                            {Math.abs(movement.quantity).toLocaleString()} {movement.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            by {movement.performedBy}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Inventory Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Products</span>
                        <span className="font-semibold">{products.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Stock Value</span>
                        <span className="font-semibold">
                          {formatCurrency(products.reduce((sum, p) => sum + calculateStockValue(p), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-600">In Stock</span>
                        <span className="font-semibold">
                          {products.filter(p => p.status === 'in_stock').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-600">Low Stock</span>
                        <span className="font-semibold">
                          {products.filter(p => p.status === 'low_stock').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-600">Out of Stock</span>
                        <span className="font-semibold">
                          {products.filter(p => p.status === 'out_of_stock').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Movement Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Movements (This Month)</span>
                        <span className="font-semibold">{stockMovements.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-600">Purchases</span>
                        <span className="font-semibold">
                          {stockMovements.filter(m => m.type === 'purchase').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-600">Sales</span>
                        <span className="font-semibold">
                          {stockMovements.filter(m => m.type === 'sale').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600">Transfers</span>
                        <span className="font-semibold">
                          {stockMovements.filter(m => m.type === 'transfer').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600">Adjustments</span>
                        <span className="font-semibold">
                          {stockMovements.filter(m => m.type === 'adjustment').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk Add Modal */}
      <WholesalerBulkAddModal
        isOpen={showBulkAdd}
        onClose={() => setShowBulkAdd(false)}
        onAdd={handleBulkAdd}
      />
    </div>
  );
};

export default BulkInventory;
