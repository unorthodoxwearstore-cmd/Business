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
  Package,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Filter,
  Download,
  Upload,
  Eye,
  DollarSign,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { dataManager, Product } from '@/lib/data-manager';
import { usePermissions } from '@/lib/permissions';
import { BusinessType } from '@shared/types';
import BusinessTypeProductForm from '@/components/BusinessTypeProductForm';
import BulkUploadButton from '@/components/BulkUploadButton';
import { ExtractedData } from '@/lib/document-upload-service';

const ProductManagement: React.FC = () => {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    cost: 0,
    stock: 0,
    lowStockThreshold: 10,
    businessTypes: [permissions.businessType] as BusinessType[],
    isActive: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const loadProducts = () => {
    try {
      const allProducts = dataManager.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(product => product.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(product => !product.isActive);
    } else if (statusFilter === 'low-stock') {
      filtered = filtered.filter(product => product.stock <= product.lowStockThreshold);
    }

    setFilteredProducts(filtered);
  };

  const handleAddProduct = async (productData: any) => {
    try {
      // Auto-generate SKU if not provided
      const sku = productData.barcodeQrCode ||
                  `${permissions.businessType.toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

      // Transform business-specific form data to match the data manager interface
      const transformedData = {
        name: productData.productName || productData.serviceName,
        sku,
        category: productData.category || productData.serviceCategory,
        price: productData.sellingPrice || productData.basePrice,
        cost: productData.buyingPrice || productData.costPerUnit || productData.totalCost || 0,
        stock: productData.quantityInStock || 0,
        lowStockThreshold: productData.minimumStockAlert || 10,
        businessTypes: [permissions.businessType],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Store additional business-specific data in a metadata field
        metadata: {
          ...productData,
          businessType: permissions.businessType,
          profitMargin: productData.profitMargin || 0
        }
      };

      // Validate before saving
      const validation = dataManager.validateProductData(transformedData);
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // Save product with instant update
      const newProduct = dataManager.addProduct(transformedData);

      // Instantly update UI
      setProducts(prev => [...prev, newProduct]);
      setFilteredProducts(prev => [...prev, newProduct]);

      // Close dialog and reset form
      setShowAddDialog(false);
      resetForm();

      // Success notification with specific details
      toast({
        title: "Success!",
        description: `${transformedData.name} has been added to your ${permissions.businessType === 'service' ? 'services' : 'inventory'}`,
        variant: "default"
      });

      // Check for low stock and notify if needed
      if (transformedData.stock <= transformedData.lowStockThreshold && permissions.businessType !== 'service') {
        setTimeout(() => {
          toast({
            title: "Low Stock Alert",
            description: `${transformedData.name} is below minimum stock threshold (${transformedData.lowStockThreshold})`,
            variant: "destructive"
          });
        }, 1000);
      }

    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: `Failed to add ${permissions.businessType === 'service' ? 'service' : 'product'}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!editingProduct) return;

    try {
      // Transform business-specific form data
      const transformedData = {
        name: productData.productName || productData.serviceName,
        sku: productData.barcodeQrCode || editingProduct.sku,
        category: productData.category || productData.serviceCategory,
        price: productData.sellingPrice || productData.basePrice,
        cost: productData.buyingPrice || productData.costPerUnit || productData.totalCost || 0,
        stock: productData.quantityInStock || editingProduct.stock || 0,
        lowStockThreshold: productData.minimumStockAlert || 10,
        businessTypes: [permissions.businessType],
        isActive: productData.isActive ?? true,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...productData,
          businessType: permissions.businessType,
          profitMargin: productData.profitMargin || 0,
          lastModified: new Date().toISOString()
        }
      };

      // Validate before saving
      const validation = dataManager.validateProductData(transformedData);
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // Update product with instant UI update
      const updatedProduct = dataManager.updateProduct(editingProduct.id, transformedData);
      if (updatedProduct) {
        // Instantly update both lists
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        setFilteredProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

        // Close dialog and reset
        setShowEditDialog(false);
        setEditingProduct(null);
        resetForm();

        toast({
          title: "Success!",
          description: `${updatedProduct.name} has been updated successfully`,
          variant: "default"
        });

        // Check for low stock after update
        if (updatedProduct.stock <= updatedProduct.lowStockThreshold && permissions.businessType !== 'service') {
          setTimeout(() => {
            toast({
              title: "Low Stock Alert",
              description: `${updatedProduct.name} is below minimum stock threshold (${updatedProduct.lowStockThreshold})`,
              variant: "destructive"
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: `Failed to update ${permissions.businessType === 'service' ? 'service' : 'product'}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    try {
      const updatedProduct = dataManager.updateProduct(productId, { isActive: false });
      if (updatedProduct) {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        toast({
          title: "Success",
          description: "Product deactivated successfully",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate product",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      price: 0,
      cost: 0,
      stock: 0,
      lowStockThreshold: 10,
      businessTypes: [permissions.businessType],
      isActive: true
    });
  };

  const handleBulkImport = async (importedData: ExtractedData[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const data of importedData) {
        try {
          const productData: Partial<Product> = {
            name: data.extractedFields.name || '',
            sku: data.extractedFields.sku || data.extractedFields.code || '',
            category: data.extractedFields.category || 'General',
            price: parseFloat(data.extractedFields.price || '0'),
            cost: parseFloat(data.extractedFields.cost || data.extractedFields.costPerUnit || '0'),
            stock: parseInt(data.extractedFields.stock || data.extractedFields.quantity || '0'),
            lowStockThreshold: parseInt(data.extractedFields.lowStockThreshold || '10'),
            unit: data.extractedFields.unit || 'pcs',
            description: data.extractedFields.description || '',
            businessTypes: [permissions.businessType],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Validate required fields
          if (!productData.name || !productData.sku) {
            throw new Error(`Missing required fields: ${!productData.name ? 'name' : 'sku'}`);
          }

          // Add product using data manager
          await dataManager.addProduct(productData as Product);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      // Refresh products list
      await loadProducts();

      toast({
        title: "Bulk Import Completed",
        description: `Successfully imported ${successCount} products. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to import products. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    // Transform product data back to form format for editing
    const productFormData = {
      productName: product.name,
      serviceName: product.name,
      category: product.category,
      serviceCategory: product.category,
      quantityInStock: product.stock,
      sellingPrice: product.price,
      basePrice: product.price,
      buyingPrice: product.cost,
      costPerUnit: product.cost,
      minimumStockAlert: product.lowStockThreshold,
      barcodeQrCode: product.sku,
      isActive: product.isActive,
      // Include any metadata if available
      ...(product.metadata || {})
    };
    setFormData(productFormData);
    setShowEditDialog(true);
  };

  const categories = [...new Set(products.map(p => p.category))];
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold && p.isActive).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const activeProductsCount = products.filter(p => p.isActive).length;

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="text-center p-8">
            <CardContent>
              <Package className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to manage products.
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
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600">Manage your product catalog and inventory</p>
          </div>
          <div className="flex gap-3">
            <BulkUploadButton
              dataType="product"
              onDataImported={handleBulkImport}
              size="lg"
              requiredPermission="addEditDeleteProducts"
            />
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Add {permissions.businessType === 'service' ? 'Service' : 'Product'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New {permissions.businessType === 'service' ? 'Service' : 'Product'}</DialogTitle>
                  <DialogDescription>
                    Enter {permissions.businessType === 'service' ? 'service' : 'product'} details for your {permissions.businessType} business
                  </DialogDescription>
                </DialogHeader>
                <BusinessTypeProductForm
                  businessType={permissions.businessType}
                  onSubmit={handleAddProduct}
                  onCancel={() => setShowAddDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{activeProductsCount}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Inventory Value</p>
                  <p className="text-2xl font-bold text-green-900">₹{totalValue.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-900">{lowStockCount}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Categories</p>
                  <p className="text-2xl font-bold text-purple-900">{categories.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
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
                  placeholder="Search products by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? "No products match your current filters."
                : "Start building your product catalog by adding your first product."
              }
            </p>
            {(!searchQuery && categoryFilter === 'all' && statusFilter === 'all') && (
              <Button onClick={() => setShowAddDialog(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="card-hover shadow-md border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      <Badge variant="outline" className="mt-2">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to deactivate "{product.name}"? This will hide it from sales but preserve the data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="font-semibold text-green-600">₹{product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stock}
                        </span>
                        {product.stock <= product.lowStockThreshold && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Product Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {permissions.businessType === 'service' ? 'Service' : 'Product'}</DialogTitle>
              <DialogDescription>
                Update {permissions.businessType === 'service' ? 'service' : 'product'} details
              </DialogDescription>
            </DialogHeader>
            {editingProduct && (
              <BusinessTypeProductForm
                businessType={permissions.businessType}
                onSubmit={handleEditProduct}
                onCancel={() => setShowEditDialog(false)}
                initialData={formData}
                isEditing={true}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductManagement;
