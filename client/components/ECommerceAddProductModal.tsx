import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { dataManager } from '@/lib/data-manager';
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Globe, 
  Tag, 
  Camera,
  CheckCircle, 
  XCircle,
  Plus,
  Minus,
  Star,
  Truck,
  Search,
  Palette,
  Ruler,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  attributes: Record<string, string>;
  images?: string[];
}

interface ECommerceProduct {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  salePrice?: number;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  status: 'draft' | 'active' | 'inactive';
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  shippingClass: string;
  taxClass: string;
  stockManagement: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  backordersAllowed: boolean;
  soldIndividually: boolean;
  crossSellProducts: string[];
  upsellProducts: string[];
  relatedProducts: string[];
  downloadable: boolean;
  virtual: boolean;
  externalUrl?: string;
  buttonText?: string;
  purchaseNote?: string;
  menuOrder: number;
  reviewsEnabled: boolean;
  attributes: Record<string, string[]>;
  defaultAttributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface ECommerceAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: ECommerceProduct) => void;
  initialData?: Partial<ECommerceProduct>;
  isEditing?: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function ECommerceAddProductModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  initialData = {}, 
  isEditing = false 
}: ECommerceAddProductModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState<Omit<ECommerceProduct, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialData.name || '',
    description: initialData.description || '',
    shortDescription: initialData.shortDescription || '',
    basePrice: initialData.basePrice || 0,
    salePrice: initialData.salePrice || 0,
    category: initialData.category || '',
    subcategory: initialData.subcategory || '',
    brand: initialData.brand || '',
    sku: initialData.sku || '',
    images: initialData.images || [],
    variants: initialData.variants || [],
    tags: initialData.tags || [],
    status: initialData.status || 'draft',
    featured: initialData.featured || false,
    seoTitle: initialData.seoTitle || '',
    seoDescription: initialData.seoDescription || '',
    metaKeywords: initialData.metaKeywords || '',
    weight: initialData.weight || 0,
    dimensions: initialData.dimensions || { length: 0, width: 0, height: 0 },
    shippingClass: initialData.shippingClass || 'standard',
    taxClass: initialData.taxClass || 'standard',
    stockManagement: initialData.stockManagement || true,
    stockQuantity: initialData.stockQuantity || 0,
    lowStockThreshold: initialData.lowStockThreshold || 5,
    backordersAllowed: initialData.backordersAllowed || false,
    soldIndividually: initialData.soldIndividually || false,
    crossSellProducts: initialData.crossSellProducts || [],
    upsellProducts: initialData.upsellProducts || [],
    relatedProducts: initialData.relatedProducts || [],
    downloadable: initialData.downloadable || false,
    virtual: initialData.virtual || false,
    externalUrl: initialData.externalUrl || '',
    buttonText: initialData.buttonText || 'Buy Now',
    purchaseNote: initialData.purchaseNote || '',
    menuOrder: initialData.menuOrder || 0,
    reviewsEnabled: initialData.reviewsEnabled || true,
    attributes: initialData.attributes || {},
    defaultAttributes: initialData.defaultAttributes || {}
  });

  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: '',
    price: 0,
    stock: 0,
    attributes: {}
  });

  const [imageUrl, setImageUrl] = useState('');
  const [newTag, setNewTag] = useState('');

  const categories = [
    'Electronics', 'Clothing & Fashion', 'Home & Garden', 'Health & Beauty', 
    'Sports & Outdoors', 'Books & Media', 'Toys & Games', 'Automotive',
    'Jewelry & Accessories', 'Food & Beverages', 'Art & Crafts', 'Other'
  ];

  const subcategoriesByCategory = {
    'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Gaming'],
    'Clothing & Fashion': ['Men\'s Clothing', 'Women\'s Clothing', 'Shoes', 'Accessories'],
    'Home & Garden': ['Furniture', 'Appliances', 'Decor', 'Garden Tools'],
    'Health & Beauty': ['Skincare', 'Makeup', 'Health Supplements', 'Personal Care'],
    'Sports & Outdoors': ['Fitness Equipment', 'Outdoor Gear', 'Sports Apparel'],
    'Books & Media': ['Books', 'Movies', 'Music', 'Magazines'],
    'Toys & Games': ['Educational Toys', 'Board Games', 'Video Games'],
    'Automotive': ['Car Accessories', 'Tools', 'Parts'],
    'Jewelry & Accessories': ['Rings', 'Necklaces', 'Watches', 'Bags'],
    'Food & Beverages': ['Snacks', 'Beverages', 'Organic Foods'],
    'Art & Crafts': ['Art Supplies', 'Craft Kits', 'DIY Tools'],
    'Other': ['Miscellaneous']
  };

  useEffect(() => {
    // Auto-generate SEO fields if not set
    if (formData.name && !formData.seoTitle) {
      setFormData(prev => ({ ...prev, seoTitle: prev.name }));
    }
    if (formData.name && formData.category && !formData.seoDescription) {
      setFormData(prev => ({ 
        ...prev, 
        seoDescription: `${prev.name} - ${prev.category}. High quality products with fast shipping.` 
      }));
    }
  }, [formData.name, formData.category]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value || !value.toString().trim()) return 'Product name is required';
        if (value.toString().trim().length < 3) return 'Name must be at least 3 characters';
        return '';
      
      case 'description':
        if (!value || !value.toString().trim()) return 'Product description is required';
        if (value.toString().trim().length < 20) return 'Description must be at least 20 characters';
        return '';
      
      case 'basePrice':
        if (value <= 0) return 'Base price must be greater than 0';
        return '';
      
      case 'category':
        if (!value || !value.toString().trim()) return 'Category is required';
        return '';
      
      case 'seoTitle':
        if (value && value.length > 60) return 'SEO title should be under 60 characters';
        return '';
      
      case 'seoDescription':
        if (value && value.length > 160) return 'SEO description should be under 160 characters';
        return '';
      
      case 'stockQuantity':
        if (formData.stockManagement && value < 0) return 'Stock quantity cannot be negative';
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Validate required fields
    ['name', 'description', 'basePrice', 'category'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    // Validate SEO fields
    if (formData.seoTitle && formData.seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title should be under 60 characters';
    }
    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description should be under 160 characters';
    }

    // Validate stock if stock management is enabled
    if (formData.stockManagement && formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }

    // Validate sale price if set
    if (formData.salePrice && formData.salePrice >= formData.basePrice) {
      newErrors.salePrice = 'Sale price must be less than base price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Auto-generate SKU if not provided
      let sku = formData.sku.trim();
      if (!sku) {
        const categoryCode = formData.category.substring(0, 3).toUpperCase();
        const nameCode = formData.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        sku = `EC-${categoryCode}-${nameCode}-${timestamp}`;
      }

      const productId = isEditing ? 
        (initialData as ECommerceProduct).id : 
        `ec_product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const productData: ECommerceProduct = {
        ...formData,
        id: productId,
        sku,
        createdAt: isEditing ? (initialData as ECommerceProduct).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Also save to regular products for catalog integration
      const regularProductData = {
        id: productId,
        name: productData.name,
        sku: productData.sku,
        category: productData.category,
        price: productData.salePrice || productData.basePrice,
        cost: productData.basePrice * 0.6, // Estimated cost
        stock: productData.stockQuantity,
        lowStockThreshold: productData.lowStockThreshold,
        businessTypes: ['ecommerce'],
        isActive: productData.status === 'active',
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt,
        metadata: {
          ecommerceData: productData,
          businessType: 'ecommerce'
        }
      };

      // Save e-commerce specific data
      if (isEditing) {
        dataManager.updateProduct(productId, regularProductData);
      } else {
        dataManager.addProduct(regularProductData);
      }

      // Save e-commerce extended data
      const ecommerceProducts = JSON.parse(localStorage.getItem('ecommerce_products') || '[]');
      if (isEditing) {
        const index = ecommerceProducts.findIndex((p: ECommerceProduct) => p.id === productId);
        if (index !== -1) {
          ecommerceProducts[index] = productData;
        }
      } else {
        ecommerceProducts.push(productData);
      }
      localStorage.setItem('ecommerce_products', JSON.stringify(ecommerceProducts));

      onAdd(productData);
      
      toast({
        title: "Success!",
        description: `${productData.name} has been ${isEditing ? 'updated' : 'added to'} your e-commerce catalog`,
        variant: "default"
      });

      // Reset form if adding new
      if (!isEditing) {
        resetForm();
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving e-commerce product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      basePrice: 0,
      salePrice: 0,
      category: '',
      subcategory: '',
      brand: '',
      sku: '',
      images: [],
      variants: [],
      tags: [],
      status: 'draft',
      featured: false,
      seoTitle: '',
      seoDescription: '',
      metaKeywords: '',
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      shippingClass: 'standard',
      taxClass: 'standard',
      stockManagement: true,
      stockQuantity: 0,
      lowStockThreshold: 5,
      backordersAllowed: false,
      soldIndividually: false,
      crossSellProducts: [],
      upsellProducts: [],
      relatedProducts: [],
      downloadable: false,
      virtual: false,
      externalUrl: '',
      buttonText: 'Buy Now',
      purchaseNote: '',
      menuOrder: 0,
      reviewsEnabled: true,
      attributes: {},
      defaultAttributes: {}
    });
    setErrors({});
    setActiveTab('general');
  };

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user fixes field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addImage = () => {
    if (imageUrl.trim() && !formData.images.includes(imageUrl.trim())) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl.trim()] }));
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      images: prev.images.filter((_, i) => i !== index) 
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addVariant = () => {
    if (newVariant.name?.trim()) {
      const variant: ProductVariant = {
        id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: newVariant.name.trim(),
        price: newVariant.price || formData.basePrice,
        stock: newVariant.stock || 0,
        sku: newVariant.sku || `${formData.sku}-VAR-${Date.now().toString().slice(-4)}`,
        attributes: newVariant.attributes || {}
      };
      
      setFormData(prev => ({ ...prev, variants: [...prev.variants, variant] }));
      setNewVariant({ name: '', price: 0, stock: 0, attributes: {} });
    }
  };

  const removeVariant = (variantId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      variants: prev.variants.filter(v => v.id !== variantId) 
    }));
  };

  const getFieldIcon = (fieldName: string) => {
    if (!formData[fieldName as keyof typeof formData]) return null;
    
    const hasError = !!errors[fieldName];
    return hasError ? (
      <XCircle className="w-4 h-4 text-red-500" />
    ) : (
      <CheckCircle className="w-4 h-4 text-green-500" />
    );
  };

  const calculateDiscount = () => {
    if (formData.salePrice && formData.basePrice > 0) {
      return Math.round(((formData.basePrice - formData.salePrice) / formData.basePrice) * 100);
    }
    return 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
            {isEditing ? 'Edit' : 'Add'} E-Commerce Product
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive product listing for your e-commerce store with SEO optimization and variants
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <div className="relative">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Enter product name"
                        className={errors.name ? 'border-red-500 pr-10' : 'pr-10'}
                        maxLength={100}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getFieldIcon('name')}
                      </div>
                    </div>
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">Product SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => updateField('sku', e.target.value)}
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <div className="relative">
                      <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                        <SelectTrigger className={errors.category ? 'border-red-500 pr-10' : 'pr-10'}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        {getFieldIcon('category')}
                      </div>
                    </div>
                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select 
                      value={formData.subcategory} 
                      onValueChange={(value) => updateField('subcategory', value)}
                      disabled={!formData.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.category && subcategoriesByCategory[formData.category as keyof typeof subcategoriesByCategory]?.map(subcat => (
                          <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => updateField('brand', e.target.value)}
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => updateField('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                    placeholder="Brief product description for listings"
                    rows={2}
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-500">{formData.shortDescription.length}/150 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <div className="relative">
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Detailed product description"
                      rows={4}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => updateField('featured', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="featured" className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Featured Product
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addImage}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Product Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Regular Price (₹) *</Label>
                    <div className="relative">
                      <Input
                        id="basePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={(e) => updateField('basePrice', parseFloat(e.target.value) || 0)}
                        className={errors.basePrice ? 'border-red-500 pr-10' : 'pr-10'}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getFieldIcon('basePrice')}
                      </div>
                    </div>
                    {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Sale Price (₹)</Label>
                    <div className="relative">
                      <Input
                        id="salePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => updateField('salePrice', parseFloat(e.target.value) || 0)}
                        className={errors.salePrice ? 'border-red-500 pr-10' : 'pr-10'}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getFieldIcon('salePrice')}
                      </div>
                    </div>
                    {errors.salePrice && <p className="text-sm text-red-500">{errors.salePrice}</p>}
                  </div>
                </div>

                {/* Discount Display */}
                {formData.salePrice > 0 && formData.salePrice < formData.basePrice && (
                  <Alert className="border-green-200 bg-green-50">
                    <Target className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      <strong>Discount: {calculateDiscount()}% OFF</strong> - 
                      Customers save ₹{(formData.basePrice - formData.salePrice).toFixed(2)}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxClass">Tax Class</Label>
                    <Select value={formData.taxClass} onValueChange={(value) => updateField('taxClass', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (18% GST)</SelectItem>
                        <SelectItem value="reduced">Reduced (5% GST)</SelectItem>
                        <SelectItem value="zero">Zero Rate</SelectItem>
                        <SelectItem value="exempt">Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Variants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Product Variants
                </CardTitle>
                <CardDescription>
                  Add different variations of this product (color, size, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    placeholder="Variant name"
                    value={newVariant.name}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  />
                  <Button type="button" onClick={addVariant} disabled={!newVariant.name?.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {formData.variants.length > 0 && (
                  <div className="space-y-2">
                    {formData.variants.map((variant, index) => (
                      <div key={variant.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{variant.name}</span>
                          <Badge variant="outline">₹{variant.price}</Badge>
                          <Badge variant="secondary">Stock: {variant.stock}</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Inventory Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="stockManagement"
                    checked={formData.stockManagement}
                    onChange={(e) => updateField('stockManagement', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="stockManagement">Enable stock management</Label>
                </div>

                {formData.stockManagement && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                      <div className="relative">
                        <Input
                          id="stockQuantity"
                          type="number"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={(e) => updateField('stockQuantity', parseInt(e.target.value) || 0)}
                          className={errors.stockQuantity ? 'border-red-500 pr-10' : 'pr-10'}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('stockQuantity')}
                        </div>
                      </div>
                      {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        min="0"
                        value={formData.lowStockThreshold}
                        onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="backordersAllowed"
                      checked={formData.backordersAllowed}
                      onChange={(e) => updateField('backordersAllowed', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="backordersAllowed">Allow backorders</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="soldIndividually"
                      checked={formData.soldIndividually}
                      onChange={(e) => updateField('soldIndividually', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="soldIndividually">Sold individually (limit 1 per order)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingClass">Shipping Class</Label>
                    <Select value={formData.shippingClass} onValueChange={(value) => updateField('shippingClass', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Shipping</SelectItem>
                        <SelectItem value="express">Express Shipping</SelectItem>
                        <SelectItem value="overnight">Overnight Shipping</SelectItem>
                        <SelectItem value="free">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dimensions (cm)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="length" className="text-xs text-gray-500">Length</Label>
                      <Input
                        id="length"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.length}
                        onChange={(e) => updateField('dimensions', { 
                          ...formData.dimensions, 
                          length: parseFloat(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="width" className="text-xs text-gray-500">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.width}
                        onChange={(e) => updateField('dimensions', { 
                          ...formData.dimensions, 
                          width: parseFloat(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-xs text-gray-500">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.height}
                        onChange={(e) => updateField('dimensions', { 
                          ...formData.dimensions, 
                          height: parseFloat(e.target.value) || 0 
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  SEO Optimization
                </CardTitle>
                <CardDescription>
                  Optimize your product for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <div className="relative">
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => updateField('seoTitle', e.target.value)}
                      placeholder="SEO-friendly title"
                      className={errors.seoTitle ? 'border-red-500 pr-10' : 'pr-10'}
                      maxLength={60}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('seoTitle')}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{formData.seoTitle.length}/60 characters</p>
                  {errors.seoTitle && <p className="text-sm text-red-500">{errors.seoTitle}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <div className="relative">
                    <Textarea
                      id="seoDescription"
                      value={formData.seoDescription}
                      onChange={(e) => updateField('seoDescription', e.target.value)}
                      placeholder="Meta description for search results"
                      rows={3}
                      className={errors.seoDescription ? 'border-red-500' : ''}
                      maxLength={160}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{formData.seoDescription.length}/160 characters</p>
                  {errors.seoDescription && <p className="text-sm text-red-500">{errors.seoDescription}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={(e) => updateField('metaKeywords', e.target.value)}
                    placeholder="Comma-separated keywords"
                  />
                </div>

                {/* SEO Preview */}
                {formData.seoTitle && (
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-sm">Search Engine Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <h3 className="text-blue-600 text-lg font-medium cursor-pointer hover:underline">
                          {formData.seoTitle}
                        </h3>
                        <p className="text-green-700 text-sm">https://yourstore.com/products/{formData.name.toLowerCase().replace(/\s+/g, '-')}</p>
                        <p className="text-gray-600 text-sm">{formData.seoDescription}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="virtual"
                        checked={formData.virtual}
                        onChange={(e) => updateField('virtual', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="virtual">Virtual product (no shipping)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="downloadable"
                        checked={formData.downloadable}
                        onChange={(e) => updateField('downloadable', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="downloadable">Downloadable product</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="reviewsEnabled"
                        checked={formData.reviewsEnabled}
                        onChange={(e) => updateField('reviewsEnabled', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="reviewsEnabled">Enable reviews</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="menuOrder">Menu Order</Label>
                      <Input
                        id="menuOrder"
                        type="number"
                        value={formData.menuOrder}
                        onChange={(e) => updateField('menuOrder', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttonText">Button Text</Label>
                      <Input
                        id="buttonText"
                        value={formData.buttonText}
                        onChange={(e) => updateField('buttonText', e.target.value)}
                        placeholder="Buy Now"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseNote">Purchase Note</Label>
                  <Textarea
                    id="purchaseNote"
                    value={formData.purchaseNote}
                    onChange={(e) => updateField('purchaseNote', e.target.value)}
                    placeholder="Note shown to customers after purchase"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalUrl">External URL (for affiliate products)</Label>
                  <Input
                    id="externalUrl"
                    type="url"
                    value={formData.externalUrl}
                    onChange={(e) => updateField('externalUrl', e.target.value)}
                    placeholder="https://external-store.com/product"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="min-w-32">
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Add to Catalog'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
