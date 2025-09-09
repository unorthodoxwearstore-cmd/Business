import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/lib/permissions';
import { dataManager } from '@/lib/data-manager';
import BackButton from '@/components/BackButton';
import { Search, Plus, Edit, Trash2, Package, Building, Star, 
         TrendingUp, Eye, Tag, BarChart3, Download } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  code: string;
  manufacturer: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  category: string;
  status: 'active' | 'inactive' | 'discontinued';
  establishedYear?: number;
  description?: string;
  website?: string;
  logo?: string;
  productCount: number;
  totalRevenue: number;
  averageMargin: number;
  lastOrderDate?: string;
  creditLimit?: number;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

interface BrandProduct {
  id: string;
  brandId: string;
  brandName: string;
  productName: string;
  sku: string;
  model: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  mrp: number;
  margin: number;
  stock: number;
  minStockLevel: number;
  reorderQuantity: number;
  packSize: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  isStarProduct: boolean;
  description?: string;
  specifications?: string;
  warranty?: string;
  supplier: string;
  supplierCode?: string;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
  totalSold: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

const BrandProductManager: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  
  // State management
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [activeTab, setActiveTab] = useState('brands');
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  
  // Dialog states
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingProduct, setEditingProduct] = useState<BrandProduct | null>(null);
  
  // Form states
  const [brandForm, setBrandForm] = useState({
    name: '',
    code: '',
    manufacturer: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    status: 'active' as const,
    establishedYear: '',
    description: '',
    website: '',
    creditLimit: '',
    paymentTerms: ''
  });
  
  const [productForm, setProductForm] = useState({
    brandId: '',
    productName: '',
    sku: '',
    model: '',
    category: '',
    buyingPrice: '',
    sellingPrice: '',
    mrp: '',
    stock: '',
    minStockLevel: '',
    reorderQuantity: '',
    packSize: '',
    unit: '',
    status: 'active' as const,
    isStarProduct: false,
    description: '',
    specifications: '',
    warranty: '',
    supplier: '',
    supplierCode: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // Load brands from localStorage with distributor prefix
    const savedBrands = localStorage.getItem('distributor_brands');
    const brandsData = savedBrands ? JSON.parse(savedBrands) : [];
    
    // Load brand products from localStorage with distributor prefix
    const savedProducts = localStorage.getItem('distributor_brand_products');
    const productsData = savedProducts ? JSON.parse(savedProducts) : [];
    
    // Update product count for each brand
    const updatedBrands = brandsData.map((brand: Brand) => ({
      ...brand,
      productCount: productsData.filter((p: BrandProduct) => p.brandId === brand.id).length,
      totalRevenue: productsData
        .filter((p: BrandProduct) => p.brandId === brand.id)
        .reduce((sum: number, p: BrandProduct) => sum + p.revenue, 0),
      averageMargin: calculateAverageMargin(brand.id, productsData)
    }));
    
    setBrands(updatedBrands);
    setBrandProducts(productsData);
    setLoading(false);
  };

  const calculateAverageMargin = (brandId: string, products: BrandProduct[]) => {
    const brandProducts = products.filter(p => p.brandId === brandId && p.sellingPrice > 0);
    if (brandProducts.length === 0) return 0;
    
    const totalMargin = brandProducts.reduce((sum, p) => sum + p.margin, 0);
    return totalMargin / brandProducts.length;
  };

  const saveBrands = (brandsData: Brand[]) => {
    localStorage.setItem('distributor_brands', JSON.stringify(brandsData));
  };

  const saveProducts = (productsData: BrandProduct[]) => {
    localStorage.setItem('distributor_brand_products', JSON.stringify(productsData));
  };

  // Brand CRUD operations
  const handleCreateBrand = () => {
    const validation = validateBrandForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const newBrand: Brand = {
      id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: brandForm.name,
      code: brandForm.code,
      manufacturer: brandForm.manufacturer,
      contactPerson: brandForm.contactPerson,
      phone: brandForm.phone,
      email: brandForm.email,
      address: brandForm.address,
      category: brandForm.category,
      status: brandForm.status,
      establishedYear: brandForm.establishedYear ? parseInt(brandForm.establishedYear) : undefined,
      description: brandForm.description,
      website: brandForm.website,
      creditLimit: brandForm.creditLimit ? parseFloat(brandForm.creditLimit) : undefined,
      paymentTerms: brandForm.paymentTerms,
      productCount: 0,
      totalRevenue: 0,
      averageMargin: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedBrands = [...brands, newBrand];
    setBrands(updatedBrands);
    saveBrands(updatedBrands);
    resetBrandForm();
    setBrandDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Brand created successfully",
    });
  };

  const handleUpdateBrand = () => {
    if (!editingBrand) return;

    const validation = validateBrandForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const updatedBrands = brands.map(brand => 
      brand.id === editingBrand.id 
        ? {
            ...brand,
            name: brandForm.name,
            code: brandForm.code,
            manufacturer: brandForm.manufacturer,
            contactPerson: brandForm.contactPerson,
            phone: brandForm.phone,
            email: brandForm.email,
            address: brandForm.address,
            category: brandForm.category,
            status: brandForm.status,
            establishedYear: brandForm.establishedYear ? parseInt(brandForm.establishedYear) : undefined,
            description: brandForm.description,
            website: brandForm.website,
            creditLimit: brandForm.creditLimit ? parseFloat(brandForm.creditLimit) : undefined,
            paymentTerms: brandForm.paymentTerms,
            updatedAt: new Date().toISOString()
          }
        : brand
    );

    setBrands(updatedBrands);
    saveBrands(updatedBrands);
    resetBrandForm();
    setEditingBrand(null);
    setBrandDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Brand updated successfully",
    });
  };

  const handleDeleteBrand = (brandId: string) => {
    const brandProducts = brandProducts.filter(p => p.brandId === brandId);
    if (brandProducts.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete brand with assigned products. Remove products first.",
        variant: "destructive"
      });
      return;
    }

    const updatedBrands = brands.filter(brand => brand.id !== brandId);
    setBrands(updatedBrands);
    saveBrands(updatedBrands);
    
    toast({
      title: "Success",
      description: "Brand deleted successfully",
    });
  };

  // Product CRUD operations
  const handleCreateProduct = () => {
    const validation = validateProductForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const selectedBrandData = brands.find(b => b.id === productForm.brandId);
    const buyingPrice = parseFloat(productForm.buyingPrice);
    const sellingPrice = parseFloat(productForm.sellingPrice);
    const margin = sellingPrice > 0 ? ((sellingPrice - buyingPrice) / sellingPrice) * 100 : 0;

    const newProduct: BrandProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      brandId: productForm.brandId,
      brandName: selectedBrandData?.name || '',
      productName: productForm.productName,
      sku: productForm.sku,
      model: productForm.model,
      category: productForm.category,
      buyingPrice,
      sellingPrice,
      mrp: parseFloat(productForm.mrp),
      margin,
      stock: parseInt(productForm.stock),
      minStockLevel: parseInt(productForm.minStockLevel),
      reorderQuantity: parseInt(productForm.reorderQuantity),
      packSize: parseInt(productForm.packSize),
      unit: productForm.unit,
      status: productForm.status,
      isStarProduct: productForm.isStarProduct,
      description: productForm.description,
      specifications: productForm.specifications,
      warranty: productForm.warranty,
      supplier: productForm.supplier,
      supplierCode: productForm.supplierCode,
      totalSold: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedProducts = [...brandProducts, newProduct];
    setBrandProducts(updatedProducts);
    saveProducts(updatedProducts);
    resetProductForm();
    setProductDialogOpen(false);
    loadData(); // Refresh to update brand metrics
    
    toast({
      title: "Success",
      description: "Product created successfully",
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;

    const validation = validateProductForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const selectedBrandData = brands.find(b => b.id === productForm.brandId);
    const buyingPrice = parseFloat(productForm.buyingPrice);
    const sellingPrice = parseFloat(productForm.sellingPrice);
    const margin = sellingPrice > 0 ? ((sellingPrice - buyingPrice) / sellingPrice) * 100 : 0;

    const updatedProducts = brandProducts.map(product => 
      product.id === editingProduct.id 
        ? {
            ...product,
            brandId: productForm.brandId,
            brandName: selectedBrandData?.name || '',
            productName: productForm.productName,
            sku: productForm.sku,
            model: productForm.model,
            category: productForm.category,
            buyingPrice,
            sellingPrice,
            mrp: parseFloat(productForm.mrp),
            margin,
            stock: parseInt(productForm.stock),
            minStockLevel: parseInt(productForm.minStockLevel),
            reorderQuantity: parseInt(productForm.reorderQuantity),
            packSize: parseInt(productForm.packSize),
            unit: productForm.unit,
            status: productForm.status,
            isStarProduct: productForm.isStarProduct,
            description: productForm.description,
            specifications: productForm.specifications,
            warranty: productForm.warranty,
            supplier: productForm.supplier,
            supplierCode: productForm.supplierCode,
            updatedAt: new Date().toISOString()
          }
        : product
    );

    setBrandProducts(updatedProducts);
    saveProducts(updatedProducts);
    resetProductForm();
    setEditingProduct(null);
    setProductDialogOpen(false);
    loadData(); // Refresh to update brand metrics
    
    toast({
      title: "Success",
      description: "Product updated successfully",
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = brandProducts.filter(product => product.id !== productId);
    setBrandProducts(updatedProducts);
    saveProducts(updatedProducts);
    loadData(); // Refresh to update brand metrics
    
    toast({
      title: "Success",
      description: "Product deleted successfully",
    });
  };

  // Validation functions
  const validateBrandForm = () => {
    const errors: string[] = [];
    
    if (!brandForm.name.trim()) errors.push('Brand name is required');
    if (!brandForm.code.trim()) errors.push('Brand code is required');
    if (!brandForm.manufacturer.trim()) errors.push('Manufacturer is required');
    if (!brandForm.contactPerson.trim()) errors.push('Contact person is required');
    if (!brandForm.phone.trim()) errors.push('Phone is required');
    if (!brandForm.category.trim()) errors.push('Category is required');
    
    if (brandForm.phone && !/^\d{10}$/.test(brandForm.phone.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid 10-digit phone number');
    }
    
    if (brandForm.email && !/\S+@\S+\.\S+/.test(brandForm.email)) {
      errors.push('Please enter a valid email address');
    }

    // Check for duplicate brand code
    const existingBrand = brands.find(brand => 
      brand.code.toLowerCase() === brandForm.code.toLowerCase() && 
      brand.id !== editingBrand?.id
    );
    if (existingBrand) {
      errors.push('Brand code already exists');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateProductForm = () => {
    const errors: string[] = [];
    
    if (!productForm.brandId) errors.push('Brand selection is required');
    if (!productForm.productName.trim()) errors.push('Product name is required');
    if (!productForm.sku.trim()) errors.push('SKU is required');
    if (!productForm.category.trim()) errors.push('Category is required');
    if (!productForm.buyingPrice || parseFloat(productForm.buyingPrice) < 0) errors.push('Valid buying price is required');
    if (!productForm.sellingPrice || parseFloat(productForm.sellingPrice) <= 0) errors.push('Valid selling price is required');
    if (!productForm.mrp || parseFloat(productForm.mrp) <= 0) errors.push('Valid MRP is required');
    if (!productForm.stock || parseInt(productForm.stock) < 0) errors.push('Valid stock quantity is required');
    if (!productForm.minStockLevel || parseInt(productForm.minStockLevel) < 0) errors.push('Valid minimum stock level is required');
    if (!productForm.packSize || parseInt(productForm.packSize) <= 0) errors.push('Valid pack size is required');
    if (!productForm.unit.trim()) errors.push('Unit is required');
    if (!productForm.supplier.trim()) errors.push('Supplier is required');

    // Check for duplicate SKU
    const existingSku = brandProducts.find(product => 
      product.sku.toLowerCase() === productForm.sku.toLowerCase() && 
      product.id !== editingProduct?.id
    );
    if (existingSku) {
      errors.push('SKU already exists');
    }

    // Price validation
    const buyingPrice = parseFloat(productForm.buyingPrice);
    const sellingPrice = parseFloat(productForm.sellingPrice);
    const mrp = parseFloat(productForm.mrp);
    
    if (sellingPrice < buyingPrice) {
      errors.push('Selling price should be higher than buying price');
    }
    
    if (mrp < sellingPrice) {
      errors.push('MRP should be higher than or equal to selling price');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Form reset functions
  const resetBrandForm = () => {
    setBrandForm({
      name: '',
      code: '',
      manufacturer: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      category: '',
      status: 'active',
      establishedYear: '',
      description: '',
      website: '',
      creditLimit: '',
      paymentTerms: ''
    });
  };

  const resetProductForm = () => {
    setProductForm({
      brandId: '',
      productName: '',
      sku: '',
      model: '',
      category: '',
      buyingPrice: '',
      sellingPrice: '',
      mrp: '',
      stock: '',
      minStockLevel: '',
      reorderQuantity: '',
      packSize: '',
      unit: '',
      status: 'active',
      isStarProduct: false,
      description: '',
      specifications: '',
      warranty: '',
      supplier: '',
      supplierCode: ''
    });
  };

  // Edit handlers
  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      code: brand.code,
      manufacturer: brand.manufacturer,
      contactPerson: brand.contactPerson,
      phone: brand.phone,
      email: brand.email || '',
      address: brand.address || '',
      category: brand.category,
      status: brand.status,
      establishedYear: brand.establishedYear?.toString() || '',
      description: brand.description || '',
      website: brand.website || '',
      creditLimit: brand.creditLimit?.toString() || '',
      paymentTerms: brand.paymentTerms || ''
    });
    setBrandDialogOpen(true);
  };

  const handleEditProduct = (product: BrandProduct) => {
    setEditingProduct(product);
    setProductForm({
      brandId: product.brandId,
      productName: product.productName,
      sku: product.sku,
      model: product.model,
      category: product.category,
      buyingPrice: product.buyingPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      mrp: product.mrp.toString(),
      stock: product.stock.toString(),
      minStockLevel: product.minStockLevel.toString(),
      reorderQuantity: product.reorderQuantity.toString(),
      packSize: product.packSize.toString(),
      unit: product.unit,
      status: product.status,
      isStarProduct: product.isStarProduct,
      description: product.description || '',
      specifications: product.specifications || '',
      warranty: product.warranty || '',
      supplier: product.supplier,
      supplierCode: product.supplierCode || ''
    });
    setProductDialogOpen(true);
  };

  // Filter functions
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase()) ||
                         brand.code.toLowerCase().includes(brandSearchTerm.toLowerCase()) ||
                         brand.manufacturer.toLowerCase().includes(brandSearchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || brand.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || brand.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredProducts = brandProducts.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                         product.model.toLowerCase().includes(productSearchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'all' || product.brandId === brandFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
  });

  // Utility functions
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

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      discontinued: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const exportData = () => {
    if (!hasPermission('export_reports')) return;
    
    const data = {
      brands: filteredBrands,
      products: filteredProducts,
      exportDate: new Date().toISOString(),
      totalBrands: filteredBrands.length,
      totalProducts: filteredProducts.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-products-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Brand and product data exported successfully",
    });
  };

  // Permission check
  if (!hasPermission('view_inventory')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to view brand management.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading brand management...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">
              {brands.filter(b => b.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brandProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              {brandProducts.filter(p => p.isStarProduct).length} star products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(brandProducts.reduce((sum, p) => sum + (p.stock * p.buyingPrice), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brandProducts.filter(p => p.stock <= p.minStockLevel).length}
            </div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Brand-wise Product Management</CardTitle>
              <CardDescription>
                Manage brands and their product portfolios for distribution
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('export_reports') && (
                <Button variant="outline" onClick={exportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
              <TabsTrigger value="products">Products ({brandProducts.length})</TabsTrigger>
            </TabsList>
            
            {/* Brands Tab */}
            <TabsContent value="brands" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search brands by name, code or manufacturer..."
                      value={brandSearchTerm}
                      onChange={(e) => setBrandSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Automotive">Automotive</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Consumer Goods">Consumer Goods</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasPermission('create_product') && (
                  <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { resetBrandForm(); setEditingBrand(null); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Brand
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brandName">Brand Name *</Label>
                          <Input
                            id="brandName"
                            value={brandForm.name}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter brand name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brandCode">Brand Code *</Label>
                          <Input
                            id="brandCode"
                            value={brandForm.code}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            placeholder="e.g., SONY, SAMSUNG"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="manufacturer">Manufacturer *</Label>
                          <Input
                            id="manufacturer"
                            value={brandForm.manufacturer}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                            placeholder="Manufacturer company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPerson">Contact Person *</Label>
                          <Input
                            id="contactPerson"
                            value={brandForm.contactPerson}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                            placeholder="Contact person name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            value={brandForm.phone}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="10-digit phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={brandForm.email}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="contact@brand.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select value={brandForm.category} onValueChange={(value) => setBrandForm(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Automotive">Automotive</SelectItem>
                              <SelectItem value="Industrial">Industrial</SelectItem>
                              <SelectItem value="Consumer Goods">Consumer Goods</SelectItem>
                              <SelectItem value="Healthcare">Healthcare</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={brandForm.status} onValueChange={(value: 'active' | 'inactive' | 'discontinued') => setBrandForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="discontinued">Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="establishedYear">Established Year</Label>
                          <Input
                            id="establishedYear"
                            type="number"
                            value={brandForm.establishedYear}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, establishedYear: e.target.value }))}
                            placeholder="e.g., 1995"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={brandForm.website}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://brand.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="creditLimit">Credit Limit</Label>
                          <Input
                            id="creditLimit"
                            type="number"
                            value={brandForm.creditLimit}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentTerms">Payment Terms</Label>
                          <Input
                            id="paymentTerms"
                            value={brandForm.paymentTerms}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                            placeholder="e.g., NET 30"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={brandForm.address}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Complete address"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={brandForm.description}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brand description and notes"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={editingBrand ? handleUpdateBrand : handleCreateBrand}>
                          {editingBrand ? 'Update' : 'Create'} Brand
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Brand Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBrands.map((brand) => (
                  <Card key={brand.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{brand.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {brand.code} • {brand.manufacturer}
                          </div>
                          <Badge className={getStatusBadge(brand.status)}>
                            {brand.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{brand.productCount}</div>
                          <div className="text-sm text-muted-foreground">Products</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Contact</div>
                          <div className="font-medium">{brand.contactPerson}</div>
                          <div className="text-xs text-muted-foreground">{brand.phone}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Category</div>
                          <div className="font-medium">{brand.category}</div>
                          {brand.establishedYear && (
                            <div className="text-xs text-muted-foreground">Since {brand.establishedYear}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Revenue</div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(brand.totalRevenue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Margin</div>
                          <div className="font-semibold text-blue-600">
                            {brand.averageMargin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {brand.description && (
                        <div className="text-sm italic text-muted-foreground">
                          "{brand.description}"
                        </div>
                      )}
                      
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        Created: {formatDate(brand.createdAt)}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedBrand(brand);
                            setBrandFilter(brand.id);
                            setActiveTab('products');
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View Products
                        </Button>
                        {hasPermission('edit_product') && (
                          <Button size="sm" variant="outline" onClick={() => handleEditBrand(brand)}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        {hasPermission('delete_product') && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteBrand(brand.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name, SKU or model..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Automotive">Automotive</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Consumer Goods">Consumer Goods</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasPermission('create_product') && (
                  <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { resetProductForm(); setEditingProduct(null); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brandSelect">Brand *</Label>
                          <Select value={productForm.brandId} onValueChange={(value) => setProductForm(prev => ({ ...prev, brandId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {brands.filter(b => b.status === 'active').map(brand => (
                                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="productName">Product Name *</Label>
                          <Input
                            id="productName"
                            value={productForm.productName}
                            onChange={(e) => setProductForm(prev => ({ ...prev, productName: e.target.value }))}
                            placeholder="Enter product name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sku">SKU *</Label>
                          <Input
                            id="sku"
                            value={productForm.sku}
                            onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                            placeholder="e.g., SKU123"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={productForm.model}
                            onChange={(e) => setProductForm(prev => ({ ...prev, model: e.target.value }))}
                            placeholder="Product model"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="productCategory">Category *</Label>
                          <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Automotive">Automotive</SelectItem>
                              <SelectItem value="Industrial">Industrial</SelectItem>
                              <SelectItem value="Consumer Goods">Consumer Goods</SelectItem>
                              <SelectItem value="Healthcare">Healthcare</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplier">Supplier *</Label>
                          <Input
                            id="supplier"
                            value={productForm.supplier}
                            onChange={(e) => setProductForm(prev => ({ ...prev, supplier: e.target.value }))}
                            placeholder="Supplier name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplierCode">Supplier Code</Label>
                          <Input
                            id="supplierCode"
                            value={productForm.supplierCode}
                            onChange={(e) => setProductForm(prev => ({ ...prev, supplierCode: e.target.value }))}
                            placeholder="Supplier product code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="buyingPrice">Buying Price *</Label>
                          <Input
                            id="buyingPrice"
                            type="number"
                            value={productForm.buyingPrice}
                            onChange={(e) => setProductForm(prev => ({ ...prev, buyingPrice: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sellingPrice">Selling Price *</Label>
                          <Input
                            id="sellingPrice"
                            type="number"
                            value={productForm.sellingPrice}
                            onChange={(e) => setProductForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mrp">MRP *</Label>
                          <Input
                            id="mrp"
                            type="number"
                            value={productForm.mrp}
                            onChange={(e) => setProductForm(prev => ({ ...prev, mrp: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stock">Stock Quantity *</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                          <Input
                            id="minStockLevel"
                            type="number"
                            value={productForm.minStockLevel}
                            onChange={(e) => setProductForm(prev => ({ ...prev, minStockLevel: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                          <Input
                            id="reorderQuantity"
                            type="number"
                            value={productForm.reorderQuantity}
                            onChange={(e) => setProductForm(prev => ({ ...prev, reorderQuantity: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="packSize">Pack Size *</Label>
                          <Input
                            id="packSize"
                            type="number"
                            value={productForm.packSize}
                            onChange={(e) => setProductForm(prev => ({ ...prev, packSize: e.target.value }))}
                            placeholder="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit *</Label>
                          <Select value={productForm.unit} onValueChange={(value) => setProductForm(prev => ({ ...prev, unit: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pieces">Pieces</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="liter">Liter</SelectItem>
                              <SelectItem value="meter">Meter</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="carton">Carton</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="productStatus">Status</Label>
                          <Select value={productForm.status} onValueChange={(value: 'active' | 'inactive' | 'discontinued') => setProductForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="discontinued">Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="warranty">Warranty</Label>
                          <Input
                            id="warranty"
                            value={productForm.warranty}
                            onChange={(e) => setProductForm(prev => ({ ...prev, warranty: e.target.value }))}
                            placeholder="e.g., 2 years"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="isStarProduct" className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isStarProduct"
                              checked={productForm.isStarProduct}
                              onChange={(e) => setProductForm(prev => ({ ...prev, isStarProduct: e.target.checked }))}
                            />
                            Star Product
                          </Label>
                        </div>
                        <div className="space-y-2 md:col-span-2 lg:col-span-3">
                          <Label htmlFor="productDescription">Description</Label>
                          <Textarea
                            id="productDescription"
                            value={productForm.description}
                            onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Product description"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2 lg:col-span-3">
                          <Label htmlFor="specifications">Specifications</Label>
                          <Textarea
                            id="specifications"
                            value={productForm.specifications}
                            onChange={(e) => setProductForm(prev => ({ ...prev, specifications: e.target.value }))}
                            placeholder="Product specifications"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                          {editingProduct ? 'Update' : 'Create'} Product
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Product Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{product.productName}</CardTitle>
                            {product.isStarProduct && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.sku} • {product.brandName}
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusBadge(product.status)}>
                              {product.status.toUpperCase()}
                            </Badge>
                            {product.stock <= product.minStockLevel && (
                              <Badge className="bg-red-100 text-red-800">
                                LOW STOCK
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(product.sellingPrice)}
                          </div>
                          <div className="text-sm text-muted-foreground">Selling Price</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Model</div>
                          <div className="font-medium">{product.model || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Category</div>
                          <div className="font-medium">{product.category}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Stock</div>
                          <div className={`font-medium ${product.stock <= product.minStockLevel ? 'text-red-600' : 'text-green-600'}`}>
                            {product.stock} {product.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Margin</div>
                          <div className="font-medium text-blue-600">
                            {product.margin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-muted-foreground">Buying</div>
                          <div className="font-semibold">{formatCurrency(product.buyingPrice)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Selling</div>
                          <div className="font-semibold">{formatCurrency(product.sellingPrice)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">MRP</div>
                          <div className="font-semibold">{formatCurrency(product.mrp)}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Supplier:</span>
                          <span>{product.supplier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pack Size:</span>
                          <span>{product.packSize} {product.unit}</span>
                        </div>
                        {product.warranty && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Warranty:</span>
                            <span>{product.warranty}</span>
                          </div>
                        )}
                      </div>
                      
                      {product.description && (
                        <div className="text-sm italic text-muted-foreground">
                          "{product.description}"
                        </div>
                      )}
                      
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        Created: {formatDate(product.createdAt)}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {hasPermission('edit_product') && (
                          <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        {hasPermission('delete_product') && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandProductManager;
