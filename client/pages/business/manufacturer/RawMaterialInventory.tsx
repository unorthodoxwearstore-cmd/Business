import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Package2,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Factory,
  Truck,
  BarChart3,
  Filter,
  Download,
  Upload,
  Building2,
  Calendar,
  Scale,
  Zap,
  IndianRupee,
  Calculator,
  TrendingUp
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import BackButton from '@/components/BackButton';
import { SmartImportButton } from '@/components/import/SmartImportButton';
import SmartImportModal from '@/components/import/SmartImportModal';

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  supplierId: string;
  unitOfMeasure: 'mg' | 'ml' | 'kg' | 'ltr' | 'pcs' | 'gm';
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  pricePerUnit: number; // Auto-calculated cost per unit (e.g., ₹0.12 per mg)
  totalValue: number;
  lastPurchasePrice: number; // Price paid for last purchase quantity
  lastPurchaseQuantity: number; // Quantity of last purchase
  lastPurchaseDate: string;
  expiryDate?: string;
  batchNumber?: string;
  warehouse: string;
  warehouseId: string;
  lastUsedDate?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'reserved';
  qualityGrade: 'A' | 'B' | 'C';
  notes?: string;
  avgCostPerUnit: number; // Average cost across all batches
  purchaseHistory: PurchaseHistory[];
}

interface PurchaseHistory {
  id: string;
  date: string;
  quantity: number;
  totalPrice: number;
  pricePerUnit: number;
  supplier: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  type: 'purchase' | 'consumption' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  warehouse: string;
  reference: string;
  date: string;
  costPerUnit?: number;
  totalCost?: number;
  notes?: string;
  performedBy: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  occupied: number;
  manager: string;
  isActive: boolean;
}

const unitOptions = [
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'gm', label: 'Grams (gm)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'ltr', label: 'Liters (ltr)' },
  { value: 'pcs', label: 'Pieces (pcs)' }
];

// Warehouses will be loaded from API
const warehouses: Warehouse[] = [];

// Raw materials will be loaded from API
const rawMaterials: RawMaterial[] = [];

export default function RawMaterialInventory() {
  const permissions = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseFormData, setPurchaseFormData] = useState({
    materialId: '',
    materialName: '',
    quantity: '',
    totalPrice: '',
    supplier: '',
    batchNumber: '',
    expiryDate: '',
    notes: ''
  });
  const [showImport, setShowImport] = useState(false);

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access raw material inventory.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredMaterials = rawMaterials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesWarehouse = selectedWarehouse === 'all' || material.warehouseId === selectedWarehouse;
    const matchesStatus = selectedStatus === 'all' || material.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
  });

  const categories = ['all', ...Array.from(new Set(rawMaterials.map(m => m.category)))];
  const statuses = ['all', 'in_stock', 'low_stock', 'out_of_stock', 'expired', 'reserved'];

  const getStatusBadge = (status: RawMaterial['status']) => {
    const statusConfig = {
      in_stock: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle },
      low_stock: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      out_of_stock: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      expired: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: Clock },
      reserved: { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800', icon: Clock }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getQualityBadge = (grade: RawMaterial['qualityGrade']) => {
    const gradeColors = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-yellow-100 text-yellow-800',
      C: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${gradeColors[grade]}`}>
        Grade {grade}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePurchaseSubmit = () => {
    const quantity = parseFloat(purchaseFormData.quantity);
    const totalPrice = parseFloat(purchaseFormData.totalPrice);
    const pricePerUnit = totalPrice / quantity;
    
    // In a real application, this would make an API call to save the purchase
    console.log('New Purchase:', {
      ...purchaseFormData,
      quantity,
      totalPrice,
      pricePerUnit,
      date: new Date().toISOString().split('T')[0]
    });

    // Reset form and close modal
    setPurchaseFormData({
      materialId: '',
      materialName: '',
      quantity: '',
      totalPrice: '',
      supplier: '',
      batchNumber: '',
      expiryDate: '',
      notes: ''
    });
    setShowPurchaseForm(false);
  };

  const totalInventoryValue = rawMaterials.reduce((sum, material) => sum + material.totalValue, 0);
  const lowStockItems = rawMaterials.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock').length;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <BackButton />
      </div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Package2 className="w-6 h-6 text-white" />
            </div>
            Raw Material Inventory
          </h1>
          <p className="text-gray-600 mt-1">Track prices, costs per unit, and automated inventory valuation</p>
        </div>
        
        <div className="flex items-center gap-3">
          <SmartImportButton onImport={() => setShowImport(true)} />
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            onClick={() => setShowAddMaterial(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawMaterials.length}</div>
            <p className="text-xs text-muted-foreground">
              {rawMaterials.filter(m => m.status === 'in_stock').length} in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost Tracking</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(rawMaterials.length > 0 ? totalInventoryValue / rawMaterials.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per material average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Raw Materials with Price Tracking
            <Button 
              onClick={() => setShowPurchaseForm(true)}
              variant="outline"
              className="ml-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Purchase
            </Button>
          </CardTitle>
          <CardDescription>Automatic unit cost calculation and inventory valuation</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials by name, SKU, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card 
                key={material.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500"
                onClick={() => setSelectedMaterial(material)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{material.name}</h4>
                      <p className="text-sm text-gray-500">SKU: {material.sku}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(material.status)}
                      {getQualityBadge(material.qualityGrade)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Stock:</span>
                      <span className="font-medium">{material.currentStock} {material.unitOfMeasure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price per {material.unitOfMeasure}:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(material.pricePerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Cost:</span>
                      <span className="font-medium text-gray-700">{formatCurrency(material.avgCostPerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Value:</span>
                      <span className="font-bold text-green-600">{formatCurrency(material.totalValue)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{material.warehouse}</span>
                      <span>Last Purchase: {formatDate(material.lastPurchaseDate)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Last bought: {material.lastPurchaseQuantity} {material.unitOfMeasure} for {formatCurrency(material.lastPurchasePrice)}
                    </div>
                  </div>
                  
                  {/* Stock Level Indicator */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Stock Level</span>
                      <span>{((material.currentStock / material.maximumStock) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          material.currentStock <= material.minimumStock ? 'bg-red-500' :
                          material.currentStock <= material.minimumStock * 1.5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((material.currentStock / material.maximumStock) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12">
              <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== 'all' || selectedWarehouse !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding your first raw material to the inventory.'
                }
              </p>
              <Button onClick={() => setShowAddMaterial(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Raw Material
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Record New Purchase
                <Button variant="ghost" size="sm" onClick={() => setShowPurchaseForm(false)}>
                  ×
                </Button>
              </CardTitle>
              <CardDescription>
                Enter purchase details to automatically calculate cost per unit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="material">Select Material</Label>
                  <select
                    id="material"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={purchaseFormData.materialId}
                    onChange={(e) => {
                      const selectedMat = rawMaterials.find(m => m.id === e.target.value);
                      setPurchaseFormData(prev => ({
                        ...prev,
                        materialId: e.target.value,
                        materialName: selectedMat?.name || '',
                        supplier: selectedMat?.supplier || ''
                      }));
                    }}
                  >
                    <option value="">Choose material...</option>
                    {rawMaterials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={purchaseFormData.supplier}
                    onChange={(e) => setPurchaseFormData(prev => ({...prev, supplier: e.target.value}))}
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity Purchased</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={purchaseFormData.quantity}
                    onChange={(e) => setPurchaseFormData(prev => ({...prev, quantity: e.target.value}))}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="totalPrice">Total Price Paid (₹)</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    value={purchaseFormData.totalPrice}
                    onChange={(e) => setPurchaseFormData(prev => ({...prev, totalPrice: e.target.value}))}
                    placeholder="Amount paid"
                  />
                </div>
                <div>
                  <Label>Cost per Unit</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm">
                    {purchaseFormData.quantity && purchaseFormData.totalPrice 
                      ? formatCurrency(parseFloat(purchaseFormData.totalPrice) / parseFloat(purchaseFormData.quantity))
                      : '₹0.00'
                    }
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={purchaseFormData.batchNumber}
                    onChange={(e) => setPurchaseFormData(prev => ({...prev, batchNumber: e.target.value}))}
                    placeholder="Batch/Lot number"
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={purchaseFormData.expiryDate}
                    onChange={(e) => setPurchaseFormData(prev => ({...prev, expiryDate: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={purchaseFormData.notes}
                  onChange={(e) => setPurchaseFormData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Additional notes about this purchase"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handlePurchaseSubmit}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!purchaseFormData.materialId || !purchaseFormData.quantity || !purchaseFormData.totalPrice}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Record Purchase & Update Costs
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPurchaseForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Material Details Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Material Details & Cost History
                <Button variant="ghost" size="sm" onClick={() => setSelectedMaterial(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h3 className="font-medium text-lg mb-4">{selectedMaterial.name}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">SKU:</span>
                      <span>{selectedMaterial.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span>{selectedMaterial.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Stock:</span>
                      <span className="font-medium">{selectedMaterial.currentStock} {selectedMaterial.unitOfMeasure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Price per {selectedMaterial.unitOfMeasure}:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(selectedMaterial.pricePerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Average Cost per {selectedMaterial.unitOfMeasure}:</span>
                      <span className="font-medium">{formatCurrency(selectedMaterial.avgCostPerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Inventory Value:</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedMaterial.totalValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div>
                  <h4 className="font-medium mb-4">Current Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedMaterial.status)}
                      {getQualityBadge(selectedMaterial.qualityGrade)}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Supplier:</span>
                      <span className="ml-2">{selectedMaterial.supplier}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Warehouse:</span>
                      <span className="ml-2">{selectedMaterial.warehouse}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Last Purchase:</span>
                      <span className="ml-2">{formatDate(selectedMaterial.lastPurchaseDate)}</span>
                    </div>
                    {selectedMaterial.notes && (
                      <div className="p-3 bg-gray-50 rounded text-sm">
                        <span className="text-gray-500">Notes:</span>
                        <p className="mt-1">{selectedMaterial.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-medium mb-4">Purchase History & Cost Tracking</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-2 text-left">Date</th>
                        <th className="border border-gray-200 p-2 text-left">Quantity</th>
                        <th className="border border-gray-200 p-2 text-left">Total Price</th>
                        <th className="border border-gray-200 p-2 text-left">Price per Unit</th>
                        <th className="border border-gray-200 p-2 text-left">Supplier</th>
                        <th className="border border-gray-200 p-2 text-left">Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMaterial.purchaseHistory.map((purchase) => (
                        <tr key={purchase.id}>
                          <td className="border border-gray-200 p-2">{formatDate(purchase.date)}</td>
                          <td className="border border-gray-200 p-2">{purchase.quantity} {selectedMaterial.unitOfMeasure}</td>
                          <td className="border border-gray-200 p-2 font-medium">{formatCurrency(purchase.totalPrice)}</td>
                          <td className="border border-gray-200 p-2 font-bold text-blue-600">{formatCurrency(purchase.pricePerUnit)}</td>
                          <td className="border border-gray-200 p-2">{purchase.supplier}</td>
                          <td className="border border-gray-200 p-2">{purchase.batchNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Material
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setPurchaseFormData(prev => ({
                      ...prev,
                      materialId: selectedMaterial.id,
                      materialName: selectedMaterial.name,
                      supplier: selectedMaterial.supplier
                    }));
                    setSelectedMaterial(null);
                    setShowPurchaseForm(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showImport && (
        <SmartImportModal open={showImport} onClose={()=>setShowImport(false)} module={"manufacturer_raw_materials"} />
      )}
    </div>
  );
}
