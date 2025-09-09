import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter,
  Calendar,
  Clock,
  User,
  Package,
  Factory,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Download,
  BarChart3,
  TrendingUp,
  Play,
  Pause,
  Square,
  Activity,
  Settings,
  Layers,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import BackButton from '@/components/BackButton';
import { SmartImportButton } from '@/components/import/SmartImportButton';
import SmartImportModal from '@/components/import/SmartImportModal';

interface ProductionLog {
  id: string;
  orderId: string;
  productName: string;
  productSku: string;
  quantityProduced: number;
  costPerUnit: number;
  totalCost: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  staffInitiated: string;
  staffCompleted?: string;
  batchNumber: string;
  materialBreakdown: MaterialUsed[];
  costBreakdown: ProductionCost;
  qualityCheck: QualityCheck;
  status: 'completed' | 'partial' | 'failed' | 'cancelled';
  notes?: string;
  wasteGenerated?: number;
  efficiency: number; // percentage
}

interface MaterialUsed {
  materialId: string;
  materialName: string;
  materialSku: string;
  quantityUsed: number;
  unitOfMeasure: string;
  unitCost: number;
  totalCost: number;
  wastage?: number;
}

interface ProductionCost {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  variance?: number; // difference from estimated cost
}

interface QualityCheck {
  passed: boolean;
  inspector: string;
  grade: 'A' | 'B' | 'C' | 'Reject';
  defectCount: number;
  notes?: string;
}

interface ProductionSummary {
  totalProduction: number;
  totalCost: number;
  avgCostPerUnit: number;
  totalWaste: number;
  avgEfficiency: number;
  qualityRate: number;
}

// Production logs will be loaded from API
const baseProductionLogs: ProductionLog[] = [];

// Production logs data will come from API

export default function ProductionLogs() {
  const permissions = usePermissions();
  const [productionLogs] = useState<ProductionLog[]>(baseProductionLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedLog, setSelectedLog] = useState<ProductionLog | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'product' | 'quantity' | 'cost'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showImport, setShowImport] = useState(false);

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access production logs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredLogs = productionLogs.filter(log => {
    const matchesSearch = log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesProduct = selectedProduct === 'all' || log.productName === selectedProduct;
    const matchesDateRange = (!dateRange.from || log.date >= dateRange.from) &&
                            (!dateRange.to || log.date <= dateRange.to);
    return matchesSearch && matchesStatus && matchesProduct && matchesDateRange;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'date':
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
        break;
      case 'product':
        aVal = a.productName;
        bVal = b.productName;
        break;
      case 'quantity':
        aVal = a.quantityProduced;
        bVal = b.quantityProduced;
        break;
      case 'cost':
        aVal = a.totalCost;
        bVal = b.totalCost;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const uniqueProducts = Array.from(new Set(productionLogs.map(log => log.productName)));
  const statuses = ['all', 'completed', 'partial', 'failed', 'cancelled'];

  const getStatusBadge = (status: ProductionLog['status']) => {
    const statusConfig = {
      completed: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle },
      partial: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      failed: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      cancelled: { variant: 'destructive' as const, color: 'bg-gray-100 text-gray-800', icon: Square }
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

  const getQualityBadge = (grade: QualityCheck['grade']) => {
    const gradeColors = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-yellow-100 text-yellow-800',
      C: 'bg-orange-100 text-orange-800',
      Reject: 'bg-red-100 text-red-800'
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

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01 ${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateSummary = (): ProductionSummary => {
    const completedLogs = productionLogs.filter(log => log.status === 'completed');
    const totalProduction = completedLogs.reduce((sum, log) => sum + log.quantityProduced, 0);
    const totalCost = productionLogs.reduce((sum, log) => sum + log.totalCost, 0);
    const avgCostPerUnit = totalCost / totalProduction || 0;
    const totalWaste = productionLogs.reduce((sum, log) => sum + (log.wasteGenerated || 0), 0);
    const avgEfficiency = productionLogs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / productionLogs.length || 0;
    const qualityPassedLogs = productionLogs.filter(log => log.qualityCheck.passed);
    const qualityRate = (qualityPassedLogs.length / productionLogs.length) * 100 || 0;

    return {
      totalProduction,
      totalCost,
      avgCostPerUnit,
      totalWaste,
      avgEfficiency,
      qualityRate
    };
  };

  const summary = calculateSummary();

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
            Production Logs
          </h1>
          <p className="text-gray-600 mt-1">Complete production history with cost tracking and quality analysis</p>
        </div>
        
        <div className="flex items-center gap-3">
          <SmartImportButton onImport={()=> setShowImport(true)} />
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Production</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalProduction.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCost)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Cost/Unit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.avgCostPerUnit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.avgEfficiency.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Rate</p>
                <p className="text-2xl font-bold text-green-600">{summary.qualityRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Logs List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Production History
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="product">Sort by Product</option>
                    <option value="quantity">Sort by Quantity</option>
                    <option value="cost">Sort by Cost</option>
                  </select>
                </div>
              </CardTitle>
              <CardDescription>Track all production activities with detailed cost and quality metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by product, SKU, order ID, or batch number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Status' : status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Products</option>
                    {uniqueProducts.map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                  
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    placeholder="From date"
                  />
                  
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="To date"
                  />
                </div>
              </div>

              {/* Production Log Cards */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {sortedLogs.map((log) => (
                  <Card 
                    key={log.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                      log.status === 'completed' ? 'border-l-green-500' :
                      log.status === 'partial' ? 'border-l-yellow-500' :
                      log.status === 'failed' ? 'border-l-red-500' : 'border-l-gray-500'
                    } ${selectedLog?.id === log.id ? 'ring-2 ring-orange-500' : ''}`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{log.productName}</h4>
                          <p className="text-sm text-gray-500">
                            {log.orderId} • Batch: {log.batchNumber} • {formatDate(log.date)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(log.status)}
                          {getQualityBadge(log.qualityCheck.grade)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Quantity:</span>
                          <span className="font-medium ml-1">{log.quantityProduced} units</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Cost:</span>
                          <span className="font-bold ml-1 text-blue-600">{formatCurrency(log.totalCost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium ml-1">{formatDuration(log.duration)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Efficiency:</span>
                          <span className="font-medium ml-1">{log.efficiency}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-gray-500">
                        <span>Started: {formatTime(log.startTime)} by {log.staffInitiated}</span>
                        <span>
                          {log.endTime && `Ended: ${formatTime(log.endTime)}`}
                          {log.staffCompleted && ` by ${log.staffCompleted}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {sortedLogs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No production logs found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedStatus !== 'all' || selectedProduct !== 'all' || dateRange.from || dateRange.to
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Production logs will appear here once manufacturing begins.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Log Details */}
        <div>
          {selectedLog ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Production Details
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{selectedLog.productName}</h3>
                    <p className="text-gray-600">{selectedLog.productSku}</p>
                    <div className="flex gap-2 mt-2">
                      {getStatusBadge(selectedLog.status)}
                      {getQualityBadge(selectedLog.qualityCheck.grade)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order ID:</span>
                      <span className="font-medium">{selectedLog.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Batch Number:</span>
                      <span className="font-medium">{selectedLog.batchNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity Produced:</span>
                      <span className="font-medium">{selectedLog.quantityProduced} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Production Date:</span>
                      <span className="font-medium">{formatDate(selectedLog.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{formatDuration(selectedLog.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Efficiency:</span>
                      <span className="font-medium">{selectedLog.efficiency}%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded">
                    <h4 className="font-medium mb-3">Cost Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Material Cost:</span>
                        <span className="font-medium">{formatCurrency(selectedLog.costBreakdown.materialCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor Cost:</span>
                        <span className="font-medium">{formatCurrency(selectedLog.costBreakdown.laborCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overhead Cost:</span>
                        <span className="font-medium">{formatCurrency(selectedLog.costBreakdown.overheadCost)}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold">
                        <span>Total Cost:</span>
                        <span className="text-blue-600">{formatCurrency(selectedLog.costBreakdown.totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per Unit:</span>
                        <span className="font-medium">{formatCurrency(selectedLog.costPerUnit)}</span>
                      </div>
                      {selectedLog.costBreakdown.variance && (
                        <div className="flex justify-between">
                          <span>Cost Variance:</span>
                          <span className={`font-medium ${selectedLog.costBreakdown.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {selectedLog.costBreakdown.variance > 0 ? '+' : ''}{formatCurrency(selectedLog.costBreakdown.variance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded">
                    <h4 className="font-medium mb-3">Quality Check</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Inspector:</span>
                        <span className="font-medium">{selectedLog.qualityCheck.inspector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Grade:</span>
                        <span className="font-medium">{selectedLog.qualityCheck.grade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Defects Found:</span>
                        <span className="font-medium">{selectedLog.qualityCheck.defectCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Passed:</span>
                        <span className={`font-medium ${selectedLog.qualityCheck.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedLog.qualityCheck.passed ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {selectedLog.qualityCheck.notes && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">{selectedLog.qualityCheck.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLog.notes && (
                    <div className="p-3 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">Production Notes</h4>
                      <p className="text-sm text-gray-600">{selectedLog.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Material Usage */}
              {selectedLog.materialBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Material Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLog.materialBreakdown.map((material) => (
                        <div key={material.materialId} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{material.materialName}</h5>
                            <p className="text-xs text-gray-500">SKU: {material.materialSku}</p>
                            <div className="text-xs text-gray-600 mt-1">
                              Used: {material.quantityUsed} {material.unitOfMeasure}
                            </div>
                            {material.wastage && (
                              <div className="text-xs text-red-500">
                                Wastage: {material.wastage} {material.unitOfMeasure}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{formatCurrency(material.totalCost)}</div>
                            <div className="text-xs text-gray-500">
                              @ {formatCurrency(material.unitCost)}/{material.unitOfMeasure}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Production Log Details</h3>
                <p className="text-gray-500 text-sm">
                  Select a production log from the list to view detailed information about materials used, costs, and quality checks.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
