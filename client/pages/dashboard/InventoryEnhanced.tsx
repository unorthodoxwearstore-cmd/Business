import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Archive,
  TrendingDown,
  Calendar,
  Warehouse,
  Settings,
  MoreHorizontal,
  Download,
  Upload,
  Loader2,
  RefreshCw,
  StickyNote,
  Clock,
  Star,
  X,
  Check,
  Undo2,
  FileText,
  Tag,
  Mic
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { inventoryService } from '@/lib/inventory-service';
import { formatCurrency } from '@/lib/business-data';
import BackButton from '@/components/BackButton';
import { useEnhancedToast } from '@/components/EnhancedToast';
import { usePageShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { SmartImportButton } from '@/components/import/SmartImportButton';
import SmartImportModal from '@/components/import/SmartImportModal';
import SpeechAddPanel from '@/components/speech/SpeechAddPanel';
import SpeechReviewModal from '@/components/speech/SpeechReviewModal';
import AddProductForm from '@/components/forms/AddProductForm';
import AddRawMaterialForm from '@/components/forms/AddRawMaterialForm';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  lastUpdated: string;
  tags?: string[];
  notes?: string;
  starred?: boolean;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (items: Product[]) => void;
  requiresConfirm?: boolean;
  variant?: 'default' | 'destructive';
}

interface Filter {
  id: string;
  label: string;
  value: any;
  type: 'select' | 'range' | 'boolean';
  options?: { label: string; value: any }[];
}

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    sku: 'WBH-001',
    category: 'Electronics',
    price: 2999,
    stock: 45,
    minStock: 10,
    status: 'active',
    lastUpdated: '2024-01-15',
    tags: ['popular', 'wireless'],
    starred: true,
    notes: 'Best seller this month'
  },
  {
    id: '2',
    name: 'Cotton T-Shirt (Blue)',
    sku: 'CT-BLU-M',
    category: 'Clothing',
    price: 599,
    stock: 8,
    minStock: 10,
    status: 'active',
    lastUpdated: '2024-01-14',
    tags: ['clothing', 'cotton']
  },
  {
    id: '3',
    name: 'Stainless Steel Water Bottle',
    sku: 'SSWB-500',
    category: 'Home & Garden',
    price: 899,
    stock: 0,
    minStock: 5,
    status: 'out_of_stock',
    lastUpdated: '2024-01-13',
    tags: ['eco-friendly', 'steel']
  },
  {
    id: '4',
    name: 'Organic Green Tea (50 bags)',
    sku: 'OGT-50B',
    category: 'Food & Beverages',
    price: 349,
    stock: 22,
    minStock: 15,
    status: 'active',
    lastUpdated: '2024-01-12',
    tags: ['organic', 'tea'],
    starred: true
  },
  {
    id: '5',
    name: 'LED Desk Lamp',
    sku: 'LED-DL-001',
    category: 'Electronics',
    price: 1299,
    stock: 3,
    minStock: 8,
    status: 'active',
    lastUpdated: '2024-01-11',
    tags: ['led', 'office']
  }
];

export default function InventoryEnhanced() {
  const permissions = usePermissions();
  const enhancedToast = useEnhancedToast();
  
  // State management
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<{ action: string; data: any }[]>([]);
  const [autoSaving, setAutoSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; product: Product } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importSource, setImportSource] = useState<'image'|'file'>('file');
  const [showSpeech, setShowSpeech] = useState(false);
  const [speechItems, setSpeechItems] = useState<any[]>([]);
  const [showSpeechReview, setShowSpeechReview] = useState(false);
  const [headerSticky, setHeaderSticky] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addTab, setAddTab] = useState<'finished'|'raw'>('finished');

  // Enhanced state
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [quickFilters, setQuickFilters] = useState({
    starred: false,
    lowStock: false,
    outOfStock: false,
    recentlyUpdated: false
  });

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    stockRange: { min: 0, max: 1000 },
    dateRange: { start: '', end: '' },
    tags: [] as string[]
  });

  // Initialize keyboard shortcuts
  usePageShortcuts('inventory');

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
      
      // Quick filters
      const matchesStarred = !quickFilters.starred || product.starred;
      const matchesLowStock = !quickFilters.lowStock || product.stock <= product.minStock;
      const matchesOutOfStock = !quickFilters.outOfStock || product.stock === 0;
      const matchesRecentlyUpdated = !quickFilters.recentlyUpdated || 
        new Date(product.lastUpdated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Advanced filters
      const matchesPriceRange = product.price >= advancedFilters.priceRange.min && 
                               product.price <= advancedFilters.priceRange.max;
      const matchesStockRange = product.stock >= advancedFilters.stockRange.min && 
                               product.stock <= advancedFilters.stockRange.max;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesStarred && 
             matchesLowStock && matchesOutOfStock && matchesRecentlyUpdated && 
             matchesPriceRange && matchesStockRange;
    });

    // Sort by starred first, then by name
    return filtered.sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchTerm, selectedCategory, selectedStatus, quickFilters, advancedFilters]);

  // Bulk selection callback (memoized to prevent unnecessary re-renders)
  const handleSelectionChange = useCallback((selectedIds: string[], selectedItems: any[]) => {
    console.log('Selection changed:', selectedIds, selectedItems);
  }, []);

  // Bulk selection
  const bulkSelection = useBulkSelection({
    items: filteredProducts,
    getItemId: (item) => item.id,
    onSelectionChange: handleSelectionChange
  });

  useEffect(() => {
    // Load data from inventory service (only once on mount)
    setLowStockProducts(inventoryService.getLowStockProducts());
    setExpiryAlerts(inventoryService.getExpiryAlerts(false));

    // Load recent items (only once on mount)
    const stored = localStorage.getItem('recent_inventory_items');
    if (stored) {
      setRecentItems(JSON.parse(stored));
    }
  }, []); // Run only once on mount

  useEffect(() => {
    // Setup event listeners for custom events
    const handleAddNewProduct = () => {
      enhancedToast.info('Add Product', 'Feature coming soon!');
    };

    const handleSelectAll = () => {
      bulkSelection.toggleAll();
    };

    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setHeaderSticky(scrolled);
    };

    window.addEventListener('addNewProduct', handleAddNewProduct);
    window.addEventListener('selectAll', handleSelectAll);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('addNewProduct', handleAddNewProduct);
      window.removeEventListener('selectAll', handleSelectAll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Run only once on mount, don't include bulkSelection as dependency

  // Categories and statistics
  const categories = Array.from(new Set(products.map(p => p.category)));
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const starredCount = products.filter(p => p.starred).length;

  // Action handlers
  const handleViewProduct = useCallback((product: Product) => {
    // Add to recent items
    const newRecent = [product.id, ...recentItems.filter(id => id !== product.id)].slice(0, 10);
    setRecentItems(newRecent);
    localStorage.setItem('recent_inventory_items', JSON.stringify(newRecent));
    
    enhancedToast.info('Product Viewed', `Viewing details for ${product.name}`);
  }, [recentItems]);

  const handleToggleStar = useCallback((product: Product) => {
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, starred: !p.starred } : p
    ));
    
    enhancedToast.success(
      `${product.starred ? 'Removed from' : 'Added to'} favorites`,
      product.name,
      [{
        label: 'Undo',
        action: () => handleToggleStar(product)
      }]
    );
  }, []);

  const handleBulkAction = useCallback(async (action: string, selectedItems: Product[]) => {
    setIsLoading(true);
    
    try {
      switch (action) {
        case 'star':
          setProducts(prev => prev.map(p => 
            selectedItems.find(s => s.id === p.id) ? { ...p, starred: true } : p
          ));
          enhancedToast.bulkAction(selectedItems.length, 'starred');
          break;
          
        case 'unstar':
          setProducts(prev => prev.map(p => 
            selectedItems.find(s => s.id === p.id) ? { ...p, starred: false } : p
          ));
          enhancedToast.bulkAction(selectedItems.length, 'unstarred');
          break;
          
        case 'activate':
          setProducts(prev => prev.map(p => 
            selectedItems.find(s => s.id === p.id) ? { ...p, status: 'active' as const } : p
          ));
          enhancedToast.bulkAction(selectedItems.length, 'activated');
          break;
          
        case 'deactivate':
          setProducts(prev => prev.map(p => 
            selectedItems.find(s => s.id === p.id) ? { ...p, status: 'inactive' as const } : p
          ));
          enhancedToast.bulkAction(selectedItems.length, 'deactivated');
          break;
          
        case 'delete':
          if (window.confirm(`Delete ${selectedItems.length} products permanently?`)) {
            const deletedIds = selectedItems.map(p => p.id);
            setProducts(prev => prev.filter(p => !deletedIds.includes(p.id)));
            enhancedToast.bulkAction(selectedItems.length, 'deleted');
          }
          break;
          
        case 'export':
          // Simulate export
          await new Promise(resolve => setTimeout(resolve, 1000));
          enhancedToast.success('Export Complete', `${selectedItems.length} products exported to CSV`);
          break;
      }
      
      bulkSelection.deselectAll();
    } catch (error) {
      enhancedToast.error('Action Failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  }, [bulkSelection]);

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    {
      id: 'star',
      label: 'Add to Favorites',
      icon: <Star className="w-4 h-4" />,
      action: (items) => handleBulkAction('star', items)
    },
    {
      id: 'unstar',
      label: 'Remove from Favorites',
      icon: <Star className="w-4 h-4" />,
      action: (items) => handleBulkAction('unstar', items)
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: <CheckCircle className="w-4 h-4" />,
      action: (items) => handleBulkAction('activate', items)
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: <Archive className="w-4 h-4" />,
      action: (items) => handleBulkAction('deactivate', items)
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Download className="w-4 h-4" />,
      action: (items) => handleBulkAction('export', items)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      action: (items) => handleBulkAction('delete', items),
      variant: 'destructive',
      requiresConfirm: true
    }
  ];

  // Helper functions
  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (stock: number, minStock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= minStock) return 'text-orange-600';
    return 'text-green-600';
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setQuickFilters({
      starred: false,
      lowStock: false,
      outOfStock: false,
      recentlyUpdated: false
    });
    setAdvancedFilters({
      priceRange: { min: 0, max: 10000 },
      stockRange: { min: 0, max: 1000 },
      dateRange: { start: '', end: '' },
      tags: []
    });
  };

  // Permission check
  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access inventory management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' ||
    Object.values(quickFilters).some(Boolean) || 
    advancedFilters.priceRange.min > 0 || advancedFilters.priceRange.max < 10000 ||
    advancedFilters.stockRange.min > 0 || advancedFilters.stockRange.max < 1000;

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header with Back Button */}
      <div className={`bg-white border rounded-lg p-4 transition-all ${headerSticky ? 'sticky top-4 z-40 shadow-lg' : ''}`}>
        <div className="flex flex-col gap-4">
          <BackButton />
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                Inventory Management
                {autoSaving && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                )}
              </h1>
              <div className="text-gray-600 mt-1 flex items-center gap-4">
                <span>Manage products, stock levels, and inventory alerts</span>
                <Badge variant="outline" className="text-xs">
                  {filteredProducts.length} of {products.length} products
                </Badge>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {undoStack.length > 0 && (
                <Button variant="outline" size="sm">
                  <Undo2 className="w-4 h-4 mr-2" />
                  Undo
                </Button>
              )}
              
              <Button variant="outline" onClick={() => window.location.href = '/dashboard/inventory-batches'}>
                <Calendar className="w-4 h-4 mr-2" />
                Batch Tracking
              </Button>

              <SmartImportButton onImport={(t)=>{ setImportSource(t); setShowImport(true); }} />

              <Button onClick={()=>setShowSpeech(true)}>
                <Mic className="w-4 h-4 mr-2" />
                Add by Speech
              </Button>

              <Button onClick={() => { setAddTab('finished'); setShowAddDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
                <Badge variant="outline" className="ml-2 text-xs">N</Badge>
              </Button>
            </div>
          </div>

          {/* Search and Quick Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by name, SKU, or tags... (Press '/' to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Quick Filter Chips */}
            <div className="flex gap-2">
              <Button
                variant={quickFilters.starred ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilters(prev => ({ ...prev, starred: !prev.starred }))}
              >
                <Star className="w-3 h-3 mr-1" />
                Starred ({starredCount})
              </Button>
              
              <Button
                variant={quickFilters.lowStock ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilters(prev => ({ ...prev, lowStock: !prev.lowStock }))}
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                Low Stock ({lowStockCount})
              </Button>
              
              <Button
                variant={quickFilters.outOfStock ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilters(prev => ({ ...prev, outOfStock: !prev.outOfStock }))}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Out of Stock ({outOfStockCount})
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-filter-toggle
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <Badge variant="outline" className="ml-2 text-xs">F</Badge>
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range (₹)</label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Min" 
                        value={advancedFilters.priceRange.min} 
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: Number(e.target.value) }
                        }))}
                      />
                      <Input 
                        type="number" 
                        placeholder="Max" 
                        value={advancedFilters.priceRange.max} 
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, max: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Stock Range</label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Min" 
                        value={advancedFilters.stockRange.min} 
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          stockRange: { ...prev.stockRange, min: Number(e.target.value) }
                        }))}
                      />
                      <Input 
                        type="number" 
                        placeholder="Max" 
                        value={advancedFilters.stockRange.max} 
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          stockRange: { ...prev.stockRange, max: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0 || expiryAlerts.length > 0) && (
        <div className="space-y-4">
          {outOfStockCount > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-800">
                    {outOfStockCount} product(s) are out of stock!
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-200"
                      onClick={() => setQuickFilters(prev => ({ ...prev, outOfStock: true }))}
                    >
                      View Products
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                      Bulk Restock
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {lowStockCount > outOfStockCount && (
            <Alert className="border-orange-200 bg-orange-50">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-orange-800">
                    {lowStockCount - outOfStockCount} product(s) are running low on stock
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-orange-600 border-orange-200"
                      onClick={() => setQuickFilters(prev => ({ ...prev, lowStock: true }))}
                    >
                      Review Stock
                    </Button>
                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
                      Generate Purchase Orders
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {expiryAlerts.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-800">
                    {expiryAlerts.length} product batch(es) are expiring soon
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-yellow-600 border-yellow-200"
                    onClick={() => window.location.href = '/dashboard/inventory-batches'}
                  >
                    View Batches
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Enhanced Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTab('all')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold mt-2">{products.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredProducts.length} filtered
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setQuickFilters(prev => ({ ...prev, lowStock: true }))}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">{lowStockCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Needs attention
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setQuickFilters(prev => ({ ...prev, outOfStock: true }))}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold mt-2 text-red-600">{outOfStockCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Urgent restocking
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Inventory worth
                </p>
              </div>
              <Warehouse className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items Quick Access */}
      {recentItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recently Viewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentItems.slice(0, 5).map(id => {
                const product = products.find(p => p.id === id);
                if (!product) return null;
                
                return (
                  <Button
                    key={id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProduct(product)}
                    className="whitespace-nowrap"
                  >
                    <Package className="w-3 h-3 mr-1" />
                    {product.name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Selection Bar */}
      {bulkSelection.selectedItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {bulkSelection.selectedItems.length} item{bulkSelection.selectedItems.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {bulkActions.map(action => (
                    <Button
                      key={action.id}
                      variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => action.action(bulkSelection.selectedItems)}
                      disabled={isLoading}
                    >
                      {action.icon}
                      <span className="ml-1">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={bulkSelection.deselectAll}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Product List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Product Inventory
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Manage your product catalog and stock levels
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <SmartImportButton onImport={(t)=>{ setImportSource(t); setShowImport(true); }} />
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={bulkSelection.isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = bulkSelection.isPartiallySelected;
              }}
              onChange={() => bulkSelection.toggleAll()}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              Select all ({filteredProducts.length} products)
            </span>
            <Badge variant="outline" className="text-xs ml-auto">
              Ctrl+A
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Products List */}
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                  bulkSelection.isSelected(product) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, product });
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={bulkSelection.isSelected(product)}
                    onChange={() => bulkSelection.toggleItem(product)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  
                  {/* Product Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center relative ${
                    product.status === 'out_of_stock' ? 'bg-red-100 text-red-600' :
                    product.stock <= product.minStock ? 'bg-orange-100 text-orange-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <Package className="w-6 h-6" />
                    {product.starred && (
                      <Star className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{product.name}</p>
                      {product.starred && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-2">
                      SKU: {product.sku} • Category: {product.category}
                      {product.notes && (
                        <>
                          <StickyNote className="w-3 h-3 inline mx-1" />
                          {product.notes}
                        </>
                      )}
                    </p>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-sm font-medium">
                        Price: {formatCurrency(product.price)}
                      </span>
                      <span className={`text-sm font-medium ${getStockStatusColor(product.stock, product.minStock)}`}>
                        Stock: {product.stock} units
                      </span>
                      <Badge className={getStatusColor(product.status)}>
                        {product.status.replace('_', ' ')}
                      </Badge>
                      
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex gap-1">
                          {product.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleStar(product)}
                  >
                    <Star className={`w-4 h-4 ${product.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProduct(product)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">
                  {hasActiveFilters ? 'No products match your filters' : 'No products found'}
                </h3>
                <p className="text-sm mb-4">
                  {hasActiveFilters 
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by adding your first product'
                  }
                </p>
                {hasActiveFilters ? (
                  <Button onClick={clearAllFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear all filters
                  </Button>
                ) : (
                  <div className="flex gap-2 justify-center">
                    <Button onClick={()=>setShowSpeech(true)}>
                      <Mic className="w-4 h-4 mr-2" />
                      Add by Speech
                    </Button>
                    <SmartImportButton onImport={(t)=>{ setImportSource(t); setShowImport(true); }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border rounded-lg shadow-lg z-50 py-2 min-w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onBlur={() => setContextMenu(null)}
          tabIndex={-1}
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              handleViewProduct(contextMenu.product);
              setContextMenu(null);
            }}
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              setContextMenu(null);
            }}
          >
            <Edit className="w-4 h-4" />
            Edit Product
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              handleToggleStar(contextMenu.product);
              setContextMenu(null);
            }}
          >
            <Star className="w-4 h-4" />
            {contextMenu.product.starred ? 'Remove from' : 'Add to'} Favorites
          </button>
          <hr className="my-1" />
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
            onClick={() => {
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete Product
          </button>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* Smart Import Modal */}
      {showImport && (
        <SmartImportModal open={showImport} onClose={()=>setShowImport(false)} module={"inventory_products"} />
      )}

      {/* Add Product/Raw Material Dialog with Tabs */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Choose what you want to add and fill in details. Unit costs auto-calculate.</DialogDescription>
          </DialogHeader>
          <Tabs value={addTab} onValueChange={(v)=>setAddTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="finished">Finished Product</TabsTrigger>
              <TabsTrigger value="raw">Raw Material</TabsTrigger>
            </TabsList>
            <TabsContent value="finished">
              <AddProductForm onSuccess={()=>setShowAddDialog(false)} />
            </TabsContent>
            <TabsContent value="raw">
              <AddRawMaterialForm onSuccess={()=>setShowAddDialog(false)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Speech Add Panels */}
      {showSpeech && (
        <SpeechAddPanel open={showSpeech} onClose={()=>setShowSpeech(false)} onFinish={(items)=>{ setSpeechItems(items); setShowSpeech(false); setShowSpeechReview(true); }} />
      )}
      {showSpeechReview && (
        <SpeechReviewModal open={showSpeechReview} onClose={()=>setShowSpeechReview(false)} items={speechItems as any} />
      )}
    </div>
  );
}
