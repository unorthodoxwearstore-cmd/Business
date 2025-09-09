import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { dataManager } from '@/lib/data-manager';
import { 
  Package, 
  Plus, 
  Minus, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Calculator,
  Truck,
  Users,
  Building,
  BarChart3,
  DollarSign,
  FileSpreadsheet,
  Trash2,
  Copy
} from 'lucide-react';

interface BulkProduct {
  id: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  supplierName: string;
  supplierCode: string;
  unitOfMeasure: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  sellingPrice: number;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  warehouse: string;
  shelfLocation: string;
  batchLotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  qualityGrade: 'A' | 'B' | 'C' | 'Premium' | 'Standard';
  remarks: string;
  errors: { [key: string]: string };
}

interface WholesalerBulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (products: BulkProduct[]) => void;
}

const WholesalerBulkAddModal: React.FC<WholesalerBulkAddModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<BulkProduct[]>([
    createEmptyProduct(),
    createEmptyProduct(),
    createEmptyProduct()
  ]);

  const categories = [
    'Food & Beverages', 'Consumer Goods', 'Electronics', 'Clothing & Textiles',
    'Health & Personal Care', 'Home & Garden', 'Industrial Supplies',
    'Automotive', 'Office Supplies', 'Toys & Games', 'Sports & Recreation'
  ];

  const unitOptions = [
    'pieces', 'kg', 'gram', 'litre', 'ml', 'meter', 'cm', 'box', 'carton',
    'pallet', 'dozen', 'pack', 'bundle', 'roll', 'sheet', 'ton'
  ];

  const qualityGrades = ['Premium', 'A', 'Standard', 'B', 'C'];

  const warehouses = ['Main Warehouse', 'Warehouse A', 'Warehouse B', 'Cold Storage', 'Distribution Center'];

  function createEmptyProduct(): BulkProduct {
    const id = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      id,
      productName: '',
      sku: '',
      category: '',
      brand: '',
      supplierName: '',
      supplierCode: '',
      unitOfMeasure: 'pieces',
      quantityOrdered: 0,
      quantityReceived: 0,
      unitCost: 0,
      sellingPrice: 0,
      minimumOrderQuantity: 1,
      leadTimeDays: 7,
      warehouse: 'Main Warehouse',
      shelfLocation: '',
      batchLotNumber: '',
      manufactureDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      qualityGrade: 'A',
      remarks: '',
      errors: {}
    };
  }

  const validateProduct = (product: BulkProduct): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};

    if (!product.productName.trim()) errors.productName = 'Product name is required';
    if (!product.category) errors.category = 'Category is required';
    if (!product.supplierName.trim()) errors.supplierName = 'Supplier name is required';
    if (product.quantityOrdered <= 0) errors.quantityOrdered = 'Quantity must be greater than 0';
    if (product.unitCost <= 0) errors.unitCost = 'Unit cost must be greater than 0';
    if (product.sellingPrice <= 0) errors.sellingPrice = 'Selling price must be greater than 0';
    if (product.sellingPrice <= product.unitCost) errors.sellingPrice = 'Selling price must be higher than unit cost';
    if (product.minimumOrderQuantity <= 0) errors.minimumOrderQuantity = 'MOQ must be greater than 0';
    if (product.leadTimeDays < 1) errors.leadTimeDays = 'Lead time must be at least 1 day';

    // Validate dates
    if (product.expiryDate && product.expiryDate <= product.manufactureDate) {
      errors.expiryDate = 'Expiry date must be after manufacture date';
    }

    return errors;
  };

  const validateAllProducts = (): boolean => {
    const globalErrors: string[] = [];
    let hasValidProducts = false;

    const updatedProducts = products.map(product => {
      const errors = validateProduct(product);
      const isProductFilled = product.productName.trim() || product.category || product.supplierName.trim();
      
      if (isProductFilled) {
        hasValidProducts = true;
        if (Object.keys(errors).length === 0) {
          return { ...product, errors: {} };
        }
      }
      
      return { ...product, errors };
    });

    setProducts(updatedProducts);

    if (!hasValidProducts) {
      globalErrors.push('At least one product must be added');
    }

    const productsWithErrors = updatedProducts.filter(p => Object.keys(p.errors).length > 0);
    if (productsWithErrors.length > 0) {
      globalErrors.push(`${productsWithErrors.length} product(s) have validation errors`);
    }

    setValidationErrors(globalErrors);
    return globalErrors.length === 0;
  };

  const updateProduct = (index: number, field: keyof BulkProduct, value: any) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-generate SKU if not provided
      if (field === 'productName' || field === 'category') {
        if (!updated[index].sku && updated[index].productName && updated[index].category) {
          const nameCode = updated[index].productName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
          const catCode = updated[index].category.replace(/\s+/g, '').substring(0, 3).toUpperCase();
          const timestamp = Date.now().toString().slice(-4);
          updated[index].sku = `WS-${catCode}-${nameCode}-${timestamp}`;
        }
      }

      // Auto-generate batch number
      if (field === 'productName' && !updated[index].batchLotNumber) {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const code = updated[index].productName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        updated[index].batchLotNumber = `WS-${date}-${code}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      }

      // Auto-set quantity received to ordered if not set
      if (field === 'quantityOrdered' && updated[index].quantityReceived === 0) {
        updated[index].quantityReceived = value;
      }

      // Clear errors for the updated field
      if (updated[index].errors[field]) {
        const newErrors = { ...updated[index].errors };
        delete newErrors[field];
        updated[index].errors = newErrors;
      }

      return updated;
    });
  };

  const addProduct = () => {
    setProducts(prev => [...prev, createEmptyProduct()]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateProduct = (index: number) => {
    const productToDuplicate = { ...products[index] };
    const newProduct = {
      ...productToDuplicate,
      id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sku: '', // Will be auto-generated
      batchLotNumber: '', // Will be auto-generated
      errors: {}
    };
    
    setProducts(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newProduct);
      return updated;
    });
  };

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const importedProducts: BulkProduct[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const product = createEmptyProduct();
            
            headers.forEach((header, index) => {
              const value = values[index] || '';
              switch (header.toLowerCase()) {
                case 'product name':
                case 'productname':
                  product.productName = value;
                  break;
                case 'sku':
                  product.sku = value;
                  break;
                case 'category':
                  product.category = value;
                  break;
                case 'brand':
                  product.brand = value;
                  break;
                case 'supplier':
                case 'supplier name':
                  product.supplierName = value;
                  break;
                case 'quantity':
                case 'quantity ordered':
                  product.quantityOrdered = parseInt(value) || 0;
                  product.quantityReceived = parseInt(value) || 0;
                  break;
                case 'unit cost':
                case 'cost':
                  product.unitCost = parseFloat(value) || 0;
                  break;
                case 'selling price':
                case 'price':
                  product.sellingPrice = parseFloat(value) || 0;
                  break;
                case 'unit':
                case 'unit of measure':
                  product.unitOfMeasure = value || 'pieces';
                  break;
                case 'warehouse':
                  product.warehouse = value || 'Main Warehouse';
                  break;
                case 'moq':
                case 'minimum order quantity':
                  product.minimumOrderQuantity = parseInt(value) || 1;
                  break;
              }
            });
            
            if (product.productName) {
              importedProducts.push(product);
            }
          }
          
          if (importedProducts.length > 0) {
            setProducts(importedProducts);
            toast({
              title: "Import Successful",
              description: `${importedProducts.length} products imported from CSV`,
              variant: "default"
            });
          } else {
            toast({
              title: "Import Failed",
              description: "No valid products found in CSV file",
              variant: "destructive"
            });
          }
        } catch (error) {
          toast({
            title: "Import Error",
            description: "Failed to parse CSV file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportTemplate = () => {
    const headers = [
      'Product Name', 'SKU', 'Category', 'Brand', 'Supplier Name', 'Supplier Code',
      'Unit of Measure', 'Quantity Ordered', 'Unit Cost', 'Selling Price',
      'Minimum Order Quantity', 'Lead Time Days', 'Warehouse', 'Quality Grade'
    ];
    
    const sampleData = [
      'Rice Basmati Premium', 'WS-FOO-RIC-001', 'Food & Beverages', 'FarmFresh',
      'FarmFresh Suppliers Ltd', 'FF001', 'kg', '1000', '45.50', '60.00',
      '50', '7', 'Main Warehouse', 'A'
    ];
    
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wholesaler-bulk-products-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculateTotals = () => {
    const validProducts = products.filter(p => 
      p.productName.trim() && p.quantityOrdered > 0 && p.unitCost > 0
    );
    
    const totalProducts = validProducts.length;
    const totalQuantity = validProducts.reduce((sum, p) => sum + p.quantityOrdered, 0);
    const totalCost = validProducts.reduce((sum, p) => sum + (p.quantityOrdered * p.unitCost), 0);
    const totalValue = validProducts.reduce((sum, p) => sum + (p.quantityOrdered * p.sellingPrice), 0);
    const totalProfit = totalValue - totalCost;
    const avgMargin = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;
    
    return { totalProducts, totalQuantity, totalCost, totalValue, totalProfit, avgMargin };
  };

  const handleSubmit = async () => {
    if (!validateAllProducts()) {
      toast({
        title: "Validation Failed",
        description: "Please fix all errors before submitting",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const validProducts = products.filter(p => 
        p.productName.trim() && Object.keys(p.errors).length === 0
      );

      // Save all products to data manager
      const savedProducts = [];
      for (const product of validProducts) {
        const productData = {
          name: product.productName,
          sku: product.sku || `WS-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          category: product.category,
          price: product.sellingPrice,
          cost: product.unitCost,
          stock: product.quantityReceived,
          lowStockThreshold: Math.ceil(product.minimumOrderQuantity / 2),
          businessTypes: ['wholesaler'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            wholesalerData: product,
            businessType: 'wholesaler',
            isBulkImport: true
          }
        };

        const savedProduct = dataManager.addProduct(productData);
        savedProducts.push(savedProduct);
      }

      // Also save to wholesaler-specific storage
      const existingWholesalerProducts = JSON.parse(localStorage.getItem('wholesaler_products') || '[]');
      const wholesalerProducts = validProducts.map(p => ({
        ...p,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      localStorage.setItem('wholesaler_products', JSON.stringify([...existingWholesalerProducts, ...wholesalerProducts]));

      onAdd(validProducts);

      toast({
        title: "Bulk Import Successful!",
        description: `${validProducts.length} products have been added to your inventory`,
        variant: "default"
      });

      // Reset form
      setProducts([createEmptyProduct(), createEmptyProduct(), createEmptyProduct()]);
      setValidationErrors([]);
      onClose();
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to save products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Bulk Add Products - Wholesaler
          </DialogTitle>
          <DialogDescription>
            Add multiple products at once with comprehensive details for wholesale inventory management
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvImport}
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportTemplate}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addProduct}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </Button>
        </div>

        {validationErrors.length > 0 && (
          <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Products</div>
                <div className="font-bold text-lg">{totals.totalProducts}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Qty</div>
                <div className="font-bold text-lg">{totals.totalQuantity.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Cost</div>
                <div className="font-bold text-lg text-red-600">₹{totals.totalCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Value</div>
                <div className="font-bold text-lg text-green-600">₹{totals.totalValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Profit</div>
                <div className="font-bold text-lg text-blue-600">₹{totals.totalProfit.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Avg Margin</div>
                <div className="font-bold text-lg">{totals.avgMargin.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            {products.map((product, index) => (
              <Card key={product.id} className={`${Object.keys(product.errors).length > 0 ? 'border-red-300' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Product #{index + 1}
                      {Object.keys(product.errors).length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {Object.keys(product.errors).length} Error(s)
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateProduct(index)}
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        disabled={products.length <= 1}
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    {/* Basic Information */}
                    <div className="space-y-1">
                      <Label className="text-xs">Product Name *</Label>
                      <Input
                        value={product.productName}
                        onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                        placeholder="Enter product name"
                        className={product.errors.productName ? 'border-red-500' : ''}
                      />
                      {product.errors.productName && (
                        <p className="text-xs text-red-500">{product.errors.productName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">SKU</Label>
                      <Input
                        value={product.sku}
                        onChange={(e) => updateProduct(index, 'sku', e.target.value)}
                        placeholder="Auto-generated"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Category *</Label>
                      <Select value={product.category} onValueChange={(value) => updateProduct(index, 'category', value)}>
                        <SelectTrigger className={product.errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {product.errors.category && (
                        <p className="text-xs text-red-500">{product.errors.category}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Brand</Label>
                      <Input
                        value={product.brand}
                        onChange={(e) => updateProduct(index, 'brand', e.target.value)}
                        placeholder="Enter brand"
                      />
                    </div>

                    {/* Supplier Information */}
                    <div className="space-y-1">
                      <Label className="text-xs">Supplier Name *</Label>
                      <Input
                        value={product.supplierName}
                        onChange={(e) => updateProduct(index, 'supplierName', e.target.value)}
                        placeholder="Enter supplier"
                        className={product.errors.supplierName ? 'border-red-500' : ''}
                      />
                      {product.errors.supplierName && (
                        <p className="text-xs text-red-500">{product.errors.supplierName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Supplier Code</Label>
                      <Input
                        value={product.supplierCode}
                        onChange={(e) => updateProduct(index, 'supplierCode', e.target.value)}
                        placeholder="Supplier code"
                      />
                    </div>

                    {/* Quantity and Pricing */}
                    <div className="space-y-1">
                      <Label className="text-xs">Qty Ordered *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={product.quantityOrdered}
                        onChange={(e) => updateProduct(index, 'quantityOrdered', parseInt(e.target.value) || 0)}
                        className={product.errors.quantityOrdered ? 'border-red-500' : ''}
                      />
                      {product.errors.quantityOrdered && (
                        <p className="text-xs text-red-500">{product.errors.quantityOrdered}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Qty Received</Label>
                      <Input
                        type="number"
                        min="0"
                        value={product.quantityReceived}
                        onChange={(e) => updateProduct(index, 'quantityReceived', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={product.unitOfMeasure} onValueChange={(value) => updateProduct(index, 'unitOfMeasure', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Unit Cost (₹) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.unitCost}
                        onChange={(e) => updateProduct(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        className={product.errors.unitCost ? 'border-red-500' : ''}
                      />
                      {product.errors.unitCost && (
                        <p className="text-xs text-red-500">{product.errors.unitCost}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Selling Price (₹) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.sellingPrice}
                        onChange={(e) => updateProduct(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                        className={product.errors.sellingPrice ? 'border-red-500' : ''}
                      />
                      {product.errors.sellingPrice && (
                        <p className="text-xs text-red-500">{product.errors.sellingPrice}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">MOQ *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={product.minimumOrderQuantity}
                        onChange={(e) => updateProduct(index, 'minimumOrderQuantity', parseInt(e.target.value) || 1)}
                        className={product.errors.minimumOrderQuantity ? 'border-red-500' : ''}
                      />
                      {product.errors.minimumOrderQuantity && (
                        <p className="text-xs text-red-500">{product.errors.minimumOrderQuantity}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Lead Time (Days) *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={product.leadTimeDays}
                        onChange={(e) => updateProduct(index, 'leadTimeDays', parseInt(e.target.value) || 1)}
                        className={product.errors.leadTimeDays ? 'border-red-500' : ''}
                      />
                      {product.errors.leadTimeDays && (
                        <p className="text-xs text-red-500">{product.errors.leadTimeDays}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Warehouse</Label>
                      <Select value={product.warehouse} onValueChange={(value) => updateProduct(index, 'warehouse', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(warehouse => (
                            <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Quality Grade</Label>
                      <Select value={product.qualityGrade} onValueChange={(value: any) => updateProduct(index, 'qualityGrade', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {qualityGrades.map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Batch/Lot Number</Label>
                      <Input
                        value={product.batchLotNumber}
                        onChange={(e) => updateProduct(index, 'batchLotNumber', e.target.value)}
                        placeholder="Auto-generated"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Manufacture Date</Label>
                      <Input
                        type="date"
                        value={product.manufactureDate}
                        onChange={(e) => updateProduct(index, 'manufactureDate', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Expiry Date</Label>
                      <Input
                        type="date"
                        value={product.expiryDate}
                        onChange={(e) => updateProduct(index, 'expiryDate', e.target.value)}
                        className={product.errors.expiryDate ? 'border-red-500' : ''}
                      />
                      {product.errors.expiryDate && (
                        <p className="text-xs text-red-500">{product.errors.expiryDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Profit Calculation */}
                  {product.unitCost > 0 && product.sellingPrice > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span>Profit per unit:</span>
                        <span className="font-medium">₹{(product.sellingPrice - product.unitCost).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Margin:</span>
                        <span className="font-medium">{((product.sellingPrice - product.unitCost) / product.unitCost * 100).toFixed(1)}%</span>
                      </div>
                      {product.quantityOrdered > 0 && (
                        <div className="flex items-center justify-between font-medium text-green-600">
                          <span>Total profit:</span>
                          <span>₹{((product.sellingPrice - product.unitCost) * product.quantityOrdered).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || totals.totalProducts === 0} className="min-w-32">
            {loading ? 'Saving...' : `Save ${totals.totalProducts} Product(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WholesalerBulkAddModal;
