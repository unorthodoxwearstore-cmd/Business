import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  Calculator,
  Package,
  Factory,
  Layers,
  Copy,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import BackButton from '@/components/BackButton';
import { SmartImportButton } from '@/components/import/SmartImportButton';
import SmartImportModal from '@/components/import/SmartImportModal';

interface BomItem {
  id: string;
  materialId: string;
  materialName: string;
  materialSku: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  totalCost: number;
  isOptional: boolean;
  notes?: string;
}

interface BillOfMaterials {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  version: string;
  status: 'draft' | 'active' | 'obsolete';
  description: string;
  outputQuantity: number;
  outputUnit: string;
  items: BomItem[];
  totalMaterialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  profitMargin: number;
  sellingPrice: number;
  createdBy: string;
  createdDate: string;
  lastModified: string;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  hasBom: boolean;
}

// Products will be loaded from API
const products: Product[] = [];

// Bills of Materials will be loaded from API
const billsOfMaterials: BillOfMaterials[] = [];

export default function BillOfMaterials() {
  const permissions = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBom, setSelectedBom] = useState<BillOfMaterials | null>(null);
  const [showCreateBom, setShowCreateBom] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'costing'>('overview');
  const [showImport, setShowImport] = useState(false);

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access Bill of Materials.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredBoms = billsOfMaterials.filter(bom => {
    const matchesSearch = bom.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.productSku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === 'all' || bom.productId === selectedProduct;
    const matchesStatus = selectedStatus === 'all' || bom.status === selectedStatus;
    return matchesSearch && matchesProduct && matchesStatus;
  });

  const statuses = ['all', 'draft', 'active', 'obsolete'];

  const getStatusBadge = (status: BillOfMaterials['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800', icon: Edit },
      active: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle },
      obsolete: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
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

  const calculateBomSummary = () => {
    const totalBoms = billsOfMaterials.length;
    const activeBoms = billsOfMaterials.filter(b => b.status === 'active').length;
    const totalValue = billsOfMaterials.reduce((sum, b) => sum + b.totalCost, 0);
    const avgCost = totalBoms > 0 ? totalValue / totalBoms : 0;

    return { totalBoms, activeBoms, totalValue, avgCost };
  };

  const summary = calculateBomSummary();

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
              <FileText className="w-6 h-6 text-white" />
            </div>
            Bill of Materials (BoM)
          </h1>
          <p className="text-gray-600 mt-1">Define and manage material composition for each product</p>
        </div>
        
        <div className="flex items-center gap-3">
          <SmartImportButton onImport={()=> setShowImport(true)} />
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button 
            onClick={() => setShowCreateBom(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create BoM
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total BoMs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalBoms}</div>
            <p className="text-xs text-muted-foreground">
              {summary.activeBoms} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products with BoM</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.hasBom).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {products.length} total products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total BoM Value</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined material costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.avgCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per BoM average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BoM List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Bills of Materials</CardTitle>
              <CardDescription>Manage product compositions and material requirements</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by product name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Products</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Status' : status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BoM Cards */}
              <div className="space-y-4">
                {filteredBoms.map((bom) => (
                  <Card 
                    key={bom.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedBom?.id === bom.id ? 'ring-2 ring-orange-500' : ''
                    }`}
                    onClick={() => setSelectedBom(bom)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{bom.productName}</h4>
                          <p className="text-sm text-gray-500">SKU: {bom.productSku} • Version: {bom.version}</p>
                        </div>
                        {getStatusBadge(bom.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{bom.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Materials:</span>
                          <span className="font-medium ml-1">{bom.items.length} items</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Material Cost:</span>
                          <span className="font-medium ml-1">{formatCurrency(bom.totalMaterialCost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Cost:</span>
                          <span className="font-bold ml-1 text-orange-600">{formatCurrency(bom.totalCost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Selling Price:</span>
                          <span className="font-bold ml-1 text-green-600">{formatCurrency(bom.sellingPrice)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-gray-500">
                        <span>Created: {formatDate(bom.createdDate)}</span>
                        <span>Modified: {formatDate(bom.lastModified)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredBoms.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No BoMs found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedProduct !== 'all' || selectedStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Start by creating your first Bill of Materials.'
                    }
                  </p>
                  <Button onClick={() => setShowCreateBom(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create BoM
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* BoM Details */}
        <div>
          {selectedBom ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    BoM Details
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{selectedBom.productName}</h3>
                    <p className="text-gray-600">{selectedBom.productSku} • {selectedBom.version}</p>
                    {getStatusBadge(selectedBom.status)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Output Quantity:</span>
                      <span className="font-medium">{selectedBom.outputQuantity} {selectedBom.outputUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Materials Count:</span>
                      <span className="font-medium">{selectedBom.items.length} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Material Cost:</span>
                      <span className="font-medium">{formatCurrency(selectedBom.totalMaterialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Labor Cost:</span>
                      <span className="font-medium">{formatCurrency(selectedBom.laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Overhead Cost:</span>
                      <span className="font-medium">{formatCurrency(selectedBom.overheadCost)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Total Cost:</span>
                      <span className="font-bold text-orange-600">{formatCurrency(selectedBom.totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profit Margin:</span>
                      <span className="font-medium">{selectedBom.profitMargin}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Selling Price:</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedBom.sellingPrice)}</span>
                    </div>
                  </div>

                  {selectedBom.approvedBy && (
                    <div className="p-3 bg-green-50 rounded">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Approved</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        By {selectedBom.approvedBy} on {formatDate(selectedBom.approvedDate!)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Material List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Materials Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedBom.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{item.materialName}</h5>
                          <p className="text-xs text-gray-500">SKU: {item.materialSku}</p>
                          <div className="text-xs text-gray-600 mt-1">
                            {item.quantity} {item.unitOfMeasure} × {formatCurrency(item.unitCost)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{formatCurrency(item.totalCost)}</div>
                          {item.isOptional && (
                            <Badge variant="outline" className="text-xs mt-1">Optional</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">BoM Details</h3>
                <p className="text-gray-500 text-sm">
                  Select a Bill of Materials from the list to view its details and material composition.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {showImport && (
        <SmartImportModal open={showImport} onClose={()=>setShowImport(false)} module={"manufacturer_bom"} />
      )}
    </div>
  );
}
