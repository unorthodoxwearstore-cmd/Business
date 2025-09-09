import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Grid3x3,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Image as ImageIcon,
  Tag,
  Star,
  Filter,
  Download,
  Upload,
  Copy,
  Share,
  Globe,
  Zap
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { dataManager } from '@/lib/data-manager';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import ECommerceAddProductModal from '@/components/ECommerceAddProductModal';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  attributes: Record<string, string>; // color, size, etc.
}

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  totalStock: number;
  totalSold: number;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

// No mock data - load real data

export default function ProductCatalog() {
  const permissions = usePermissions();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);

  const loadProducts = () => {
    // Load real products from data manager and e-commerce specific data
    const allProducts = dataManager.getAllProducts();
    const ecommerceProducts = JSON.parse(localStorage.getItem('ecommerce_products') || '[]');

    const transformedProducts = allProducts
      .filter(p => p.businessTypes?.includes('ecommerce') || p.metadata?.businessType === 'ecommerce')
      .map(p => {
        // Try to find extended e-commerce data
        const ecommerceData = ecommerceProducts.find((ep: any) => ep.id === p.id);

        if (ecommerceData) {
          return {
            ...ecommerceData,
            totalStock: ecommerceData.stockQuantity || p.stock,
            totalSold: 0, // This would come from sales data
            rating: 4.5,
            reviews: 0
          };
        }

        // Fallback to basic product data
        return {
          id: p.id,
          name: p.name,
          description: `${p.name} - ${p.category}`,
          shortDescription: p.name,
          basePrice: p.price,
          category: p.category,
          subcategory: p.category,
          brand: 'Generic',
          sku: p.sku,
          images: ['/placeholder.svg'],
          variants: [],
          tags: [p.category],
          status: p.isActive ? 'active' as const : 'inactive' as const,
          featured: false,
          seoTitle: p.name,
          seoDescription: `${p.name} - ${p.category}`,
          metaKeywords: p.category,
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 },
          shippingClass: 'standard',
          taxClass: 'standard',
          stockManagement: true,
          stockQuantity: p.stock,
          lowStockThreshold: p.lowStockThreshold || 5,
          backordersAllowed: false,
          soldIndividually: false,
          crossSellProducts: [],
          upsellProducts: [],
          relatedProducts: [],
          downloadable: false,
          virtual: false,
          buttonText: 'Buy Now',
          menuOrder: 0,
          reviewsEnabled: true,
          attributes: {},
          defaultAttributes: {},
          totalStock: p.stock,
          totalSold: 0,
          rating: 4.5,
          reviews: 0,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        };
      });

    setProducts(transformedProducts);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to manage product catalog.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (permissions.businessType !== 'ecommerce') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Business Type Mismatch</h3>
            <p className="text-gray-500">E-Commerce Product Catalog is only available for e-commerce businesses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const statuses = ['all', 'active', 'draft', 'inactive', 'out_of_stock'];

  const getStatusBadge = (status: Product['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      active: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      inactive: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      out_of_stock: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        {status.replace('_', ' ').toUpperCase()}
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

  const handleAddProduct = (productData: any) => {
    // Refresh products list after adding
    loadProducts();
    setShowAddProduct(false);

    toast({
      title: "Product Added!",
      description: `${productData.name} has been added to your catalog`,
      variant: "default"
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditProduct(true);
  };

  const handleUpdateProduct = (productData: any) => {
    // Refresh products list after updating
    loadProducts();
    setShowEditProduct(false);
    setEditingProduct(null);

    toast({
      title: "Product Updated!",
      description: `${productData.name} has been updated successfully`,
      variant: "default"
    });
  };

  const handleDeleteProduct = (productId: string) => {
    // Deactivate the product
    const product = dataManager.getAllProducts().find(p => p.id === productId);
    if (product) {
      dataManager.updateProduct(productId, { isActive: false });
      loadProducts();

      toast({
        title: "Product Removed",
        description: "Product has been removed from catalog",
        variant: "default"
      });
    }
  };

  const handleShareProduct = (product: Product) => {
    // Create shareable product link
    const productUrl = `${window.location.origin}/products/${product.sku}`;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription || product.description,
        url: productUrl,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(productUrl).then(() => {
        toast({
          title: "Link Copied!",
          description: "Product link has been copied to clipboard",
          variant: "default"
        });
      });
    }
  };

  const handleBulkExport = () => {
    const csvData = products.map(product => ({
      'Product Name': product.name,
      'SKU': product.sku,
      'Category': product.category,
      'Brand': product.brand,
      'Price': product.basePrice,
      'Sale Price': product.salePrice || '',
      'Stock': product.totalStock,
      'Status': product.status,
      'Featured': product.featured ? 'Yes' : 'No',
      'SEO Title': product.seoTitle,
      'Tags': product.tags.join(', ')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-catalog-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Product catalog has been exported to CSV",
      variant: "default"
    });
  };


  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Grid3x3 className="w-6 h-6 text-white" />
            </div>
            Product Catalog Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your product catalog, images, pricing, and variants</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Catalog
          </Button>
          <Button
            onClick={() => setShowAddProduct(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {products.filter(p => p.featured).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Promoted items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.variants.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Product variations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {products.length > 0 ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Search, filter, and manage your product inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by name, SKU, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-square bg-gray-100">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.featured && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(product.status)}
                    </div>
                    
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleShareProduct(product)}
                      >
                        <Share className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-purple-600">{formatCurrency(product.basePrice)}</span>
                      <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Stock: {product.totalStock}</span>
                      <span>Sold: {product.totalSold}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(`/products/${product.sku}`, '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                              {product.featured && (
                                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(product.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="font-medium ml-1">{formatCurrency(product.basePrice)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Stock:</span>
                            <span className="font-medium ml-1">{product.totalStock}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Sold:</span>
                            <span className="font-medium ml-1">{product.totalSold}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rating:</span>
                            <span className="font-medium ml-1">{product.rating}/5</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">SKU: {product.sku}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">{product.variants.length} variants</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigator.clipboard.writeText(product.sku)}
                              title="Copy SKU"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleShareProduct(product)}
                              title="Share Product"
                            >
                              <Share className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/products/${product.sku}`, '_blank')}
                              title="View Product"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditProduct(product)}
                              title="Edit Product"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Grid3x3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {products.length === 0 ? 'No Products in Catalog' : 'No Products Found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {products.length === 0
                  ? 'Start by adding your first product to the catalog.'
                  : searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No products available.'
                }
              </p>
              <Button onClick={() => window.location.href = '/dashboard/products'}>
                <Plus className="w-4 h-4 mr-2" />
                {products.length === 0 ? 'Add First Product' : 'Manage Products'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Button variant="outline" className="h-20 flex-col">
              <Globe className="w-6 h-6 mb-2 text-blue-500" />
              <span className="text-sm">Update SEO</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Tag className="w-6 h-6 mb-2 text-green-500" />
              <span className="text-sm">Bulk Price Update</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Download className="w-6 h-6 mb-2 text-purple-500" />
              <span className="text-sm">Export Catalog</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <ECommerceAddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onAdd={handleAddProduct}
      />

      {/* Edit Product Modal */}
      {editingProduct && (
        <ECommerceAddProductModal
          isOpen={showEditProduct}
          onClose={() => {
            setShowEditProduct(false);
            setEditingProduct(null);
          }}
          onAdd={handleUpdateProduct}
          initialData={editingProduct}
          isEditing={true}
        />
      )}
    </div>
  );
}
