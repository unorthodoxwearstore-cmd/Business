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
import { useToast } from '@/hooks/use-toast';
import { dataManager } from '@/lib/data-manager';
import { 
  Calculator, 
  Package, 
  DollarSign, 
  Calendar, 
  MapPin, 
  User, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  TrendingUp,
  Factory
} from 'lucide-react';

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  supplierId: string;
  unitOfMeasure: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  warehouse: string;
  batchNumber: string;
  expiryDate?: string;
  purchaseDate: string;
  qualityGrade: 'A' | 'B' | 'C' | 'Premium' | 'Standard' | 'Basic';
  materialType: string;
  density?: number;
  purity?: number;
  specifications: string;
  certifications: string;
  storageConditions: string;
  handlingSafety: string;
  leadTime: number; // in days
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface AddRawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (material: RawMaterial) => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function AddRawMaterialModal({ isOpen, onClose, onAdd }: AddRawMaterialModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState<Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    sku: '',
    category: '',
    supplier: '',
    supplierId: '',
    unitOfMeasure: 'kg',
    quantity: 0,
    unitCost: 0,
    totalValue: 0,
    minimumStock: 10,
    maximumStock: 1000,
    reorderPoint: 20,
    warehouse: 'Main Warehouse',
    batchNumber: '',
    expiryDate: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    qualityGrade: 'A',
    materialType: '',
    density: 0,
    purity: 0,
    specifications: '',
    certifications: '',
    storageConditions: '',
    handlingSafety: '',
    leadTime: 7,
    notes: '',
    isActive: true
  });

  // Auto-calculate total value when quantity or unit cost changes
  useEffect(() => {
    const totalValue = formData.quantity * formData.unitCost;
    setFormData(prev => ({ ...prev, totalValue }));
  }, [formData.quantity, formData.unitCost]);

  // Auto-calculate reorder point based on lead time and consumption
  useEffect(() => {
    // Simple calculation: lead time days * average daily consumption (estimated from min stock)
    const averageDailyConsumption = formData.minimumStock / 30; // Assuming 30-day cycle
    const reorderPoint = Math.max(formData.leadTime * averageDailyConsumption, formData.minimumStock);
    setFormData(prev => ({ ...prev, reorderPoint: Math.round(reorderPoint) }));
  }, [formData.leadTime, formData.minimumStock]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value || !value.toString().trim()) return 'Material name is required';
        if (value.toString().trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      
      case 'category':
        if (!value || !value.toString().trim()) return 'Category is required';
        return '';
      
      case 'supplier':
        if (!value || !value.toString().trim()) return 'Supplier name is required';
        return '';
      
      case 'quantity':
        if (value <= 0) return 'Quantity must be greater than 0';
        if (value > 1000000) return 'Quantity seems unrealistic';
        return '';
      
      case 'unitCost':
        if (value <= 0) return 'Unit cost must be greater than 0';
        if (value > 1000000) return 'Unit cost seems unrealistic';
        return '';
      
      case 'minimumStock':
        if (value < 0) return 'Minimum stock cannot be negative';
        return '';
      
      case 'maximumStock':
        if (value <= formData.minimumStock) return 'Maximum stock must be greater than minimum stock';
        return '';
      
      case 'leadTime':
        if (value < 1) return 'Lead time must be at least 1 day';
        if (value > 365) return 'Lead time cannot exceed 365 days';
        return '';
      
      case 'purity':
        if (value < 0 || value > 100) return 'Purity must be between 0-100%';
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Validate required fields
    ['name', 'category', 'supplier', 'quantity', 'unitCost', 'minimumStock', 'maximumStock', 'leadTime'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    // Additional validations
    if (formData.purity && (formData.purity < 0 || formData.purity > 100)) {
      newErrors.purity = 'Purity must be between 0-100%';
    }

    if (formData.expiryDate && formData.expiryDate < formData.purchaseDate) {
      newErrors.expiryDate = 'Expiry date cannot be before purchase date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        sku = `RM-${categoryCode}-${nameCode}-${timestamp}`;
      }

      // Auto-generate batch number if not provided
      let batchNumber = formData.batchNumber.trim();
      if (!batchNumber) {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        batchNumber = `BATCH-${dateStr}-${random}`;
      }

      const materialId = `rm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const materialData: RawMaterial = {
        ...formData,
        id: materialId,
        sku,
        batchNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to data manager
      const existingMaterials = dataManager.getAllRawMaterials ? dataManager.getAllRawMaterials() : [];
      existingMaterials.push(materialData);
      localStorage.setItem('raw_materials', JSON.stringify(existingMaterials));

      onAdd(materialData);
      
      toast({
        title: "Success!",
        description: `${materialData.name} has been added to raw materials inventory`,
        variant: "default"
      });

      // Check for automatic reorder alerts
      if (materialData.quantity <= materialData.reorderPoint) {
        setTimeout(() => {
          toast({
            title: "Reorder Alert",
            description: `${materialData.name} is at reorder point. Consider placing new order.`,
            variant: "destructive"
          });
        }, 1000);
      }

      // Reset form
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error adding raw material:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add raw material",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      supplier: '',
      supplierId: '',
      unitOfMeasure: 'kg',
      quantity: 0,
      unitCost: 0,
      totalValue: 0,
      minimumStock: 10,
      maximumStock: 1000,
      reorderPoint: 20,
      warehouse: 'Main Warehouse',
      batchNumber: '',
      expiryDate: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      qualityGrade: 'A',
      materialType: '',
      density: 0,
      purity: 0,
      specifications: '',
      certifications: '',
      storageConditions: '',
      handlingSafety: '',
      leadTime: 7,
      notes: '',
      isActive: true
    });
    setErrors({});
    setShowAdvanced(false);
  };

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user fixes field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

  const calculateStockMetrics = () => {
    const { quantity, minimumStock, maximumStock, reorderPoint, unitCost } = formData;
    const stockLevel = quantity <= minimumStock ? 'Low' : quantity >= maximumStock ? 'High' : 'Normal';
    const stockPercentage = ((quantity - minimumStock) / (maximumStock - minimumStock)) * 100;
    const needsReorder = quantity <= reorderPoint;
    
    return { stockLevel, stockPercentage: Math.max(0, Math.min(100, stockPercentage)), needsReorder };
  };

  const stockMetrics = calculateStockMetrics();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-600" />
            Add Raw Material
          </DialogTitle>
          <DialogDescription>
            Add a new raw material to your manufacturing inventory with complete specifications and auto-calculations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Material Name *</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., High-Grade Aluminum Sheets"
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
                  <Label htmlFor="sku">SKU/Material Code</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="Auto-generated if empty"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">Leave empty for auto-generation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <div className="relative">
                    <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                      <SelectTrigger className={errors.category ? 'border-red-500 pr-10' : 'pr-10'}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metals">Metals & Alloys</SelectItem>
                        <SelectItem value="chemicals">Chemicals & Solvents</SelectItem>
                        <SelectItem value="plastics">Plastics & Polymers</SelectItem>
                        <SelectItem value="textiles">Textiles & Fabrics</SelectItem>
                        <SelectItem value="components">Electronic Components</SelectItem>
                        <SelectItem value="packaging">Packaging Materials</SelectItem>
                        <SelectItem value="adhesives">Adhesives & Sealants</SelectItem>
                        <SelectItem value="coatings">Coatings & Finishes</SelectItem>
                        <SelectItem value="abrasives">Abrasives & Tools</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('category')}
                    </div>
                  </div>
                  {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materialType">Material Type</Label>
                  <Input
                    id="materialType"
                    value={formData.materialType}
                    onChange={(e) => updateField('materialType', e.target.value)}
                    placeholder="e.g., Sheet, Rod, Powder"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier Name *</Label>
                  <div className="relative">
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => updateField('supplier', e.target.value)}
                      placeholder="e.g., MetalCorp Industries Ltd."
                      className={errors.supplier ? 'border-red-500 pr-10' : 'pr-10'}
                      maxLength={100}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('supplier')}
                    </div>
                  </div>
                  {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier ID/Code</Label>
                  <Input
                    id="supplierId"
                    value={formData.supplierId}
                    onChange={(e) => updateField('supplierId', e.target.value)}
                    placeholder="e.g., SUP-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadTime">Lead Time (Days) *</Label>
                  <div className="relative">
                    <Input
                      id="leadTime"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.leadTime}
                      onChange={(e) => updateField('leadTime', parseInt(e.target.value) || 0)}
                      className={errors.leadTime ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('leadTime')}
                    </div>
                  </div>
                  {errors.leadTime && <p className="text-sm text-red-500">{errors.leadTime}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => updateField('purchaseDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity and Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Quantity & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <div className="relative">
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
                      className={errors.quantity ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('quantity')}
                    </div>
                  </div>
                  {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit</Label>
                  <Select value={formData.unitOfMeasure} onValueChange={(value) => updateField('unitOfMeasure', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="gm">Grams (gm)</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="ml">Milliliters (ml)</SelectItem>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="cm">Centimeters</SelectItem>
                      <SelectItem value="sqm">Square Meters</SelectItem>
                      <SelectItem value="cum">Cubic Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost (₹) *</Label>
                  <div className="relative">
                    <Input
                      id="unitCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) => updateField('unitCost', parseFloat(e.target.value) || 0)}
                      className={errors.unitCost ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('unitCost')}
                    </div>
                  </div>
                  {errors.unitCost && <p className="text-sm text-red-500">{errors.unitCost}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Total Value</Label>
                  <div className="text-lg font-bold text-green-600 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    ₹{formData.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Stock Level Visualization */}
              {formData.quantity > 0 && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Stock Level Analysis</span>
                      <Badge variant={stockMetrics.stockLevel === 'Low' ? 'destructive' : stockMetrics.stockLevel === 'High' ? 'secondary' : 'default'}>
                        {stockMetrics.stockLevel}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${stockMetrics.stockLevel === 'Low' ? 'bg-red-500' : stockMetrics.stockLevel === 'High' ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${stockMetrics.stockPercentage}%` }}
                      />
                    </div>
                    {stockMetrics.needsReorder && (
                      <Alert className="mt-2 border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-700">
                          Quantity is at or below reorder point ({formData.reorderPoint} {formData.unitOfMeasure})
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Stock Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Stock Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Minimum Stock *</Label>
                  <div className="relative">
                    <Input
                      id="minimumStock"
                      type="number"
                      min="0"
                      value={formData.minimumStock}
                      onChange={(e) => updateField('minimumStock', parseInt(e.target.value) || 0)}
                      className={errors.minimumStock ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('minimumStock')}
                    </div>
                  </div>
                  {errors.minimumStock && <p className="text-sm text-red-500">{errors.minimumStock}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maximumStock">Maximum Stock *</Label>
                  <div className="relative">
                    <Input
                      id="maximumStock"
                      type="number"
                      min="0"
                      value={formData.maximumStock}
                      onChange={(e) => updateField('maximumStock', parseInt(e.target.value) || 0)}
                      className={errors.maximumStock ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('maximumStock')}
                    </div>
                  </div>
                  {errors.maximumStock && <p className="text-sm text-red-500">{errors.maximumStock}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point (Auto-calculated)</Label>
                  <div className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {formData.reorderPoint} {formData.unitOfMeasure}
                  </div>
                  <p className="text-xs text-gray-500">Based on lead time & consumption</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse/Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="warehouse"
                      value={formData.warehouse}
                      onChange={(e) => updateField('warehouse', e.target.value)}
                      placeholder="e.g., Main Warehouse, Shelf A-12"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality and Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality & Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualityGrade">Quality Grade</Label>
                  <Select value={formData.qualityGrade} onValueChange={(value: any) => updateField('qualityGrade', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">Premium (Highest)</SelectItem>
                      <SelectItem value="A">Grade A (Excellent)</SelectItem>
                      <SelectItem value="Standard">Standard (Good)</SelectItem>
                      <SelectItem value="B">Grade B (Average)</SelectItem>
                      <SelectItem value="Basic">Basic (Minimum)</SelectItem>
                      <SelectItem value="C">Grade C (Below Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purity">Purity (%)</Label>
                  <div className="relative">
                    <Input
                      id="purity"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.purity}
                      onChange={(e) => updateField('purity', parseFloat(e.target.value) || 0)}
                      className={errors.purity ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('purity')}
                    </div>
                  </div>
                  {errors.purity && <p className="text-sm text-red-500">{errors.purity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="density">Density (g/cm³)</Label>
                  <Input
                    id="density"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.density}
                    onChange={(e) => updateField('density', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => updateField('batchNumber', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
                  <div className="relative">
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => updateField('expiryDate', e.target.value)}
                      className={errors.expiryDate ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors.expiryDate && <p className="text-sm text-red-500">{errors.expiryDate}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader>
              <CardTitle 
                className="text-lg cursor-pointer flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Advanced Options
                <Button type="button" variant="outline" size="sm">
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </Button>
              </CardTitle>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specifications">Technical Specifications</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => updateField('specifications', e.target.value)}
                    placeholder="Technical specifications, dimensions, properties..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => updateField('certifications', e.target.value)}
                    placeholder="e.g., ISO 9001, CE, ROHS"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storageConditions">Storage Conditions</Label>
                    <Textarea
                      id="storageConditions"
                      value={formData.storageConditions}
                      onChange={(e) => updateField('storageConditions', e.target.value)}
                      placeholder="Temperature, humidity, light conditions..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="handlingSafety">Handling & Safety</Label>
                    <Textarea
                      id="handlingSafety"
                      value={formData.handlingSafety}
                      onChange={(e) => updateField('handlingSafety', e.target.value)}
                      placeholder="Safety precautions, handling instructions..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional information about this material..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading ? 'Adding...' : 'Add Raw Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
