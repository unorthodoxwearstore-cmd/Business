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
  Zap
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import BackButton from '@/components/BackButton';

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  supplierId: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  totalValue: number;
  expiryDate?: string;
  batchNumber?: string;
  warehouse: string;
  warehouseId: string;
  lastPurchaseDate: string;
  lastUsedDate?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'reserved';
  qualityGrade: 'A' | 'B' | 'C';
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

const warehouses: Warehouse[] = [
  {
    id: '1',
    name: 'Main Warehouse',
    location: 'Industrial Area A',
    capacity: 10000,
    occupied: 7500,
    manager: 'Rajesh Kumar',
    isActive: true
  },
  {
    id: '2',
    name: 'Secondary Storage',
    location: 'Industrial Area B',
    capacity: 5000,
    occupied: 3200,
    manager: 'Priya Sharma',
    isActive: true
  }
];

const rawMaterials: RawMaterial[] = [
  {
    id: '1',
    name: 'Aluminum Sheets (5mm)',
    sku: 'AL-SH-5MM',
    category: 'Metals',
    supplier: 'MetalCorp Industries',
    supplierId: 'SUP-001',
    unitOfMeasure: 'kg',
    currentStock: 1250,
    minimumStock: 500,
    maximumStock: 2000,
    unitCost: 180,
    totalValue: 225000,
    batchNumber: 'BATCH-2024-001',
    warehouse: 'Main Warehouse',
    warehouseId: '1',
    lastPurchaseDate: '2024-01-10',
    lastUsedDate: '2024-01-14',
    status: 'in_stock',
    qualityGrade: 'A'
  },
  {
    id: '2',
    name: 'Steel Rods (10mm)',
    sku: 'ST-ROD-10MM',
    category: 'Metals',
    supplier: 'SteelWorks Ltd',
    supplierId: 'SUP-002',
    unitOfMeasure: 'pieces',
    currentStock: 450,
    minimumStock: 500,
    maximumStock: 1000,
    unitCost: 75,
    totalValue: 33750,
    batchNumber: 'BATCH-2024-002',
    warehouse: 'Main Warehouse',
    warehouseId: '1',
    lastPurchaseDate: '2024-01-08',
    lastUsedDate: '2024-01-13',
    status: 'low_stock',
    qualityGrade: 'A',
    notes: 'Need to reorder soon'
  },
  {
    id: '3',
    name: 'Polymer Granules',
    sku: 'POL-GRN-001',
    category: 'Plastics',
    supplier: 'PlasticTech Solutions',
    supplierId: 'SUP-003',
    unitOfMeasure: 'kg',
    currentStock: 0,
    minimumStock: 200,
    maximumStock: 800,
    unitCost: 120,
    totalValue: 0,
    expiryDate: '2024-12-31',
    batchNumber: 'BATCH-2024-003',
    warehouse: 'Secondary Storage',
    warehouseId: '2',
    lastPurchaseDate: '2023-12-15',
    status: 'out_of_stock',
    qualityGrade: 'B',
    notes: 'Urgent reorder required'
  },
  {
    id: '4',
    name: 'Chemical Adhesive X-Bond',
    sku: 'CHM-ADH-XB',
    category: 'Chemicals',
    supplier: 'ChemSupply Co',
    supplierId: 'SUP-004',
    unitOfMeasure: 'liters',
    currentStock: 85,
    minimumStock: 50,
    maximumStock: 200,
    unitCost: 450,
    totalValue: 38250,
    expiryDate: '2024-06-30',
    batchNumber: 'BATCH-2024-004',
    warehouse: 'Secondary Storage',
    warehouseId: '2',
    lastPurchaseDate: '2024-01-05',
    lastUsedDate: '2024-01-12',
    status: 'in_stock',
    qualityGrade: 'A'
  }
];

const sampleStockMovements: StockMovement[] = [
  {
    id: '1',
    materialId: '1',
    materialName: 'Aluminum Sheets (5mm)',
    type: 'consumption',
    quantity: -150,
    warehouse: 'Main Warehouse',
    reference: 'PROD-ORDER-001',
    date: '2024-01-14',
    performedBy: 'Production Team'
  },
  {
    id: '2',
    materialId: '2',
    materialName: 'Steel Rods (10mm)',
    type: 'purchase',
    quantity: 200,
    warehouse: 'Main Warehouse',
    reference: 'PO-2024-005',
    date: '2024-01-08',
    performedBy: 'Procurement'
  },
  {
    id: '3',
    materialId: '4',
    materialName: 'Chemical Adhesive X-Bond',
    type: 'consumption',
    quantity: -15,
    warehouse: 'Secondary Storage',
    reference: 'PROD-ORDER-002',
    date: '2024-01-12',
    performedBy: 'Production Team'
  }
];

export default function RawMaterialTracking() {
  const permissions = usePermissions();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'movements' | 'warehouses'>('materials');

  // Load real data
  useEffect(() => {
    // This would load real warehouses and raw materials from the data management system
    setLoading(false);
  }, []);

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access raw material tracking.</p>
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
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            Raw Material Stock Tracking
          </h1>
          <p className="text-gray-600 mt-1">Monitor quantity, suppliers, and expiry with multi-warehouse synchronization</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
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
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Active Warehouses</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.filter(w => w.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              Multi-location tracking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {[
          { id: 'materials', label: 'Raw Materials', icon: Package2 },
          { id: 'movements', label: 'Stock Movements', icon: Truck },
          { id: 'warehouses', label: 'Warehouses', icon: Building2 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Materials Inventory</CardTitle>
            <CardDescription>Monitor and manage raw material stock levels</CardDescription>
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
                  className="cursor-pointer hover:shadow-lg transition-shadow"
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
                        <span className="text-gray-500">Min Stock:</span>
                        <span className="font-medium">{material.minimumStock} {material.unitOfMeasure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unit Cost:</span>
                        <span className="font-medium">{formatCurrency(material.unitCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Value:</span>
                        <span className="font-bold text-green-600">{formatCurrency(material.totalValue)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{material.warehouse}</span>
                        <span>Supplier: {material.supplier}</span>
                      </div>
                      {material.expiryDate && (
                        <div className="mt-1 text-xs text-orange-600">
                          Expires: {formatDate(material.expiryDate)}
                        </div>
                      )}
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
      )}

      {/* Stock Movements Tab */}
      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Movements</CardTitle>
            <CardDescription>Track all material transactions and transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleStockMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      movement.type === 'purchase' ? 'bg-green-100 text-green-600' :
                      movement.type === 'consumption' ? 'bg-red-100 text-red-600' :
                      movement.type === 'transfer' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {movement.type === 'purchase' ? <Plus className="w-5 h-5" /> :
                       movement.type === 'consumption' ? <Factory className="w-5 h-5" /> :
                       movement.type === 'transfer' ? <Truck className="w-5 h-5" /> :
                       <Edit className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{movement.materialName}</h4>
                      <p className="text-sm text-gray-500">
                        {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)} • {movement.warehouse}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(movement.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Management</CardTitle>
            <CardDescription>Monitor warehouse capacity and inventory distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {warehouses.map((warehouse) => (
                <Card key={warehouse.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{warehouse.name}</h4>
                        <p className="text-sm text-gray-500">{warehouse.location}</p>
                        <p className="text-sm text-gray-500">Manager: {warehouse.manager}</p>
                      </div>
                      <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Capacity Utilization:</span>
                        <span className="font-medium">
                          {warehouse.occupied} / {warehouse.capacity} units
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            (warehouse.occupied / warehouse.capacity) > 0.9 ? 'bg-red-500' :
                            (warehouse.occupied / warehouse.capacity) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(warehouse.occupied / warehouse.capacity) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {((warehouse.occupied / warehouse.capacity) * 100).toFixed(1)}% occupied
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Details Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Material Details
                <Button variant="ghost" size="sm" onClick={() => setSelectedMaterial(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-lg">{selectedMaterial.name}</h3>
                <p className="text-gray-600">SKU: {selectedMaterial.sku} • Category: {selectedMaterial.category}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Stock</Label>
                  <div className="text-2xl font-bold">{selectedMaterial.currentStock} {selectedMaterial.unitOfMeasure}</div>
                </div>
                <div className="space-y-2">
                  <Label>Total Value</Label>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedMaterial.totalValue)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Minimum Stock</Label>
                  <p>{selectedMaterial.minimumStock} {selectedMaterial.unitOfMeasure}</p>
                </div>
                <div>
                  <Label>Maximum Stock</Label>
                  <p>{selectedMaterial.maximumStock} {selectedMaterial.unitOfMeasure}</p>
                </div>
                <div>
                  <Label>Unit Cost</Label>
                  <p>{formatCurrency(selectedMaterial.unitCost)}</p>
                </div>
                <div>
                  <Label>Quality Grade</Label>
                  <p>Grade {selectedMaterial.qualityGrade}</p>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <p>{selectedMaterial.supplier}</p>
                </div>
                <div>
                  <Label>Warehouse</Label>
                  <p>{selectedMaterial.warehouse}</p>
                </div>
              </div>
              
              {selectedMaterial.expiryDate && (
                <div className="p-3 bg-orange-50 rounded">
                  <Label>Expiry Date</Label>
                  <p className="text-orange-600 font-medium">{formatDate(selectedMaterial.expiryDate)}</p>
                </div>
              )}
              
              {selectedMaterial.notes && (
                <div className="p-3 bg-gray-50 rounded">
                  <Label>Notes</Label>
                  <p>{selectedMaterial.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Material
                </Button>
                <Button variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Actions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
