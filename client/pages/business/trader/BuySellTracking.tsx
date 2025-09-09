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
import { authService } from '@/lib/auth-service';
import BackButton from '@/components/BackButton';
import { Search, ShoppingCart, Package, TrendingUp, DollarSign, 
         Plus, Eye, Calculator, BarChart3, Edit, Trash2, AlertTriangle,
         Download, Upload, RefreshCw, Settings } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  productName: string;
  productSku: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  partyName: string;
  partyPhone?: string;
  partyType: 'supplier' | 'customer';
  date: string;
  invoiceNumber: string;
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod: 'cash' | 'credit' | 'bank_transfer' | 'cheque' | 'upi';
  margin?: number;
  marginPercentage?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TraderInventory {
  id: string;
  productName: string;
  productSku: string;
  category: string;
  currentStock: number;
  unit: string;
  avgBuyPrice: number;
  lastBuyPrice: number;
  suggestedSellPrice: number;
  totalInvested: number;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
  supplier: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  totalBought: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
}

interface StockAdjustment {
  id: string;
  productSku: string;
  productName: string;
  adjustmentType: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason: string;
  oldStock: number;
  newStock: number;
  adjustedBy: string;
  date: string;
  notes?: string;
}

interface ProfitAnalysis {
  period: string;
  totalPurchases: number;
  totalSales: number;
  grossProfit: number;
  profitMargin: number;
  transactionCount: number;
  topSellingProduct: string;
  mostProfitableProduct: string;
}

const BuySellTracking: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<TraderInventory[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Dialog states
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Form states
  const [transactionForm, setTransactionForm] = useState({
    type: 'buy' as const,
    productName: '',
    productSku: '',
    category: '',
    quantity: '',
    unit: 'pieces',
    unitPrice: '',
    partyName: '',
    partyPhone: '',
    partyType: 'supplier' as const,
    invoiceNumber: '',
    paymentStatus: 'paid' as const,
    paymentMethod: 'cash' as const,
    notes: ''
  });
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    productSku: '',
    adjustmentType: 'increase' as const,
    quantity: '',
    reason: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // Load from localStorage with trader prefix
    const savedTransactions = localStorage.getItem('trader_transactions');
    const transactionsData = savedTransactions ? JSON.parse(savedTransactions) : [];
    
    const savedInventory = localStorage.getItem('trader_inventory');
    const inventoryData = savedInventory ? JSON.parse(savedInventory) : [];
    
    const savedAdjustments = localStorage.getItem('trader_stock_adjustments');
    const adjustmentsData = savedAdjustments ? JSON.parse(savedAdjustments) : [];
    
    setTransactions(transactionsData);
    setInventory(inventoryData);
    setStockAdjustments(adjustmentsData);
    
    // Calculate profit analysis from real data
    calculateProfitAnalysis(transactionsData);
    setLoading(false);
  };

  const saveTransactions = (transactionsData: Transaction[]) => {
    localStorage.setItem('trader_transactions', JSON.stringify(transactionsData));
  };

  const saveInventory = (inventoryData: TraderInventory[]) => {
    localStorage.setItem('trader_inventory', JSON.stringify(inventoryData));
  };

  const saveStockAdjustments = (adjustmentsData: StockAdjustment[]) => {
    localStorage.setItem('trader_stock_adjustments', JSON.stringify(adjustmentsData));
  };

  const calculateProfitAnalysis = (transactionsData: Transaction[]) => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    const periods = [currentMonth, lastMonth];
    const analysis: ProfitAnalysis[] = [];
    
    periods.forEach(period => {
      const periodTransactions = transactionsData.filter(t => 
        t.date.startsWith(period)
      );
      
      const purchases = periodTransactions.filter(t => t.type === 'buy');
      const sales = periodTransactions.filter(t => t.type === 'sell');
      
      const totalPurchases = purchases.reduce((sum, t) => sum + t.totalAmount, 0);
      const totalSales = sales.reduce((sum, t) => sum + t.totalAmount, 0);
      const grossProfit = sales.reduce((sum, t) => sum + (t.margin || 0), 0);
      const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
      
      // Find top selling and most profitable products
      const productSales = sales.reduce((acc, t) => {
        acc[t.productName] = (acc[t.productName] || 0) + t.quantity;
        return acc;
      }, {} as Record<string, number>);
      
      const productProfit = sales.reduce((acc, t) => {
        acc[t.productName] = (acc[t.productName] || 0) + (t.margin || 0);
        return acc;
      }, {} as Record<string, number>);
      
      const topSellingProduct = Object.keys(productSales).reduce((a, b) => 
        productSales[a] > productSales[b] ? a : b, ''
      ) || 'N/A';
      
      const mostProfitableProduct = Object.keys(productProfit).reduce((a, b) => 
        productProfit[a] > productProfit[b] ? a : b, ''
      ) || 'N/A';
      
      analysis.push({
        period: period === currentMonth ? `${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (Current)` : 
                `${lastMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        totalPurchases,
        totalSales,
        grossProfit,
        profitMargin,
        transactionCount: periodTransactions.length,
        topSellingProduct,
        mostProfitableProduct
      });
    });
    
    setProfitAnalysis(analysis);
  };

  // Transaction CRUD operations
  const handleCreateTransaction = () => {
    const validation = validateTransactionForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const totalAmount = parseFloat(transactionForm.quantity) * parseFloat(transactionForm.unitPrice);
    
    const newTransaction: Transaction = {
      id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: transactionForm.type,
      productName: transactionForm.productName,
      productSku: transactionForm.productSku.toUpperCase(),
      category: transactionForm.category,
      quantity: parseInt(transactionForm.quantity),
      unit: transactionForm.unit,
      unitPrice: parseFloat(transactionForm.unitPrice),
      totalAmount,
      partyName: transactionForm.partyName,
      partyPhone: transactionForm.partyPhone,
      partyType: transactionForm.type === 'buy' ? 'supplier' : 'customer',
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: transactionForm.invoiceNumber,
      paymentStatus: transactionForm.paymentStatus,
      paymentMethod: transactionForm.paymentMethod,
      notes: transactionForm.notes,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calculate margin for sell transactions
    if (newTransaction.type === 'sell') {
      const inventoryItem = inventory.find(item => item.productSku === newTransaction.productSku);
      if (inventoryItem) {
        const costPrice = inventoryItem.avgBuyPrice;
        newTransaction.margin = (newTransaction.unitPrice - costPrice) * newTransaction.quantity;
        newTransaction.marginPercentage = ((newTransaction.unitPrice - costPrice) / newTransaction.unitPrice) * 100;
      }
    }

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
    
    // Update inventory
    updateInventoryFromTransaction(newTransaction);
    
    resetTransactionForm();
    setTransactionDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Transaction created successfully",
    });
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction) return;

    const validation = validateTransactionForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const totalAmount = parseFloat(transactionForm.quantity) * parseFloat(transactionForm.unitPrice);

    const updatedTransactions = transactions.map(transaction => 
      transaction.id === editingTransaction.id 
        ? {
            ...transaction,
            productName: transactionForm.productName,
            productSku: transactionForm.productSku.toUpperCase(),
            category: transactionForm.category,
            quantity: parseInt(transactionForm.quantity),
            unit: transactionForm.unit,
            unitPrice: parseFloat(transactionForm.unitPrice),
            totalAmount,
            partyName: transactionForm.partyName,
            partyPhone: transactionForm.partyPhone,
            invoiceNumber: transactionForm.invoiceNumber,
            paymentStatus: transactionForm.paymentStatus,
            paymentMethod: transactionForm.paymentMethod,
            notes: transactionForm.notes,
            updatedAt: new Date().toISOString()
          }
        : transaction
    );

    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
    resetTransactionForm();
    setEditingTransaction(null);
    setTransactionDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Transaction updated successfully",
    });
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const updatedTransactions = transactions.filter(transaction => transaction.id !== transactionId);
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
    
    toast({
      title: "Success",
      description: "Transaction deleted successfully",
    });
  };

  // Manual Stock Adjustment
  const handleStockAdjustment = () => {
    const validation = validateAdjustmentForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const inventoryItem = inventory.find(item => item.productSku === adjustmentForm.productSku);
    if (!inventoryItem) {
      toast({
        title: "Error",
        description: "Product not found in inventory",
        variant: "destructive"
      });
      return;
    }

    const adjustmentQuantity = parseInt(adjustmentForm.quantity);
    const oldStock = inventoryItem.currentStock;
    let newStock = oldStock;

    if (adjustmentForm.adjustmentType === 'increase') {
      newStock = oldStock + adjustmentQuantity;
    } else if (adjustmentForm.adjustmentType === 'decrease') {
      newStock = Math.max(0, oldStock - adjustmentQuantity);
    } else if (adjustmentForm.adjustmentType === 'correction') {
      newStock = adjustmentQuantity;
    }

    const stockAdjustment: StockAdjustment = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productSku: adjustmentForm.productSku,
      productName: inventoryItem.productName,
      adjustmentType: adjustmentForm.adjustmentType,
      quantity: adjustmentQuantity,
      reason: adjustmentForm.reason,
      oldStock,
      newStock,
      adjustedBy: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      notes: adjustmentForm.notes
    };

    // Update inventory
    const updatedInventory = inventory.map(item => 
      item.productSku === adjustmentForm.productSku 
        ? {
            ...item,
            currentStock: newStock,
            status: newStock === 0 ? 'out_of_stock' as const : 
                   newStock <= item.minStockLevel ? 'low_stock' as const : 'in_stock' as const,
            updatedAt: new Date().toISOString()
          }
        : item
    );

    const updatedAdjustments = [...stockAdjustments, stockAdjustment];

    setInventory(updatedInventory);
    setStockAdjustments(updatedAdjustments);
    saveInventory(updatedInventory);
    saveStockAdjustments(updatedAdjustments);
    
    resetAdjustmentForm();
    setAdjustmentDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Stock adjustment applied successfully",
    });
  };

  const updateInventoryFromTransaction = (transaction: Transaction) => {
    const existingItem = inventory.find(item => item.productSku === transaction.productSku);
    
    if (existingItem) {
      // Update existing inventory item
      const updatedInventory = inventory.map(item => {
        if (item.productSku === transaction.productSku) {
          let newStock = item.currentStock;
          let newTotalInvested = item.totalInvested;
          let newAvgBuyPrice = item.avgBuyPrice;
          
          if (transaction.type === 'buy') {
            newStock += transaction.quantity;
            newTotalInvested += transaction.totalAmount;
            // Recalculate average buy price
            const totalQuantityBought = item.totalBought + transaction.quantity;
            const totalInvestment = item.totalInvested + transaction.totalAmount;
            newAvgBuyPrice = totalInvestment / totalQuantityBought;
          } else {
            newStock = Math.max(0, newStock - transaction.quantity);
            newTotalInvested = newStock * item.avgBuyPrice;
          }
          
          return {
            ...item,
            currentStock: newStock,
            totalInvested: newTotalInvested,
            avgBuyPrice: newAvgBuyPrice,
            lastBuyPrice: transaction.type === 'buy' ? transaction.unitPrice : item.lastBuyPrice,
            lastPurchaseDate: transaction.type === 'buy' ? transaction.date : item.lastPurchaseDate,
            lastSaleDate: transaction.type === 'sell' ? transaction.date : item.lastSaleDate,
            totalBought: transaction.type === 'buy' ? item.totalBought + transaction.quantity : item.totalBought,
            totalSold: transaction.type === 'sell' ? item.totalSold + transaction.quantity : item.totalSold,
            status: newStock === 0 ? 'out_of_stock' as const : 
                   newStock <= item.minStockLevel ? 'low_stock' as const : 'in_stock' as const,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      
      setInventory(updatedInventory);
      saveInventory(updatedInventory);
    } else if (transaction.type === 'buy') {
      // Create new inventory item for buy transactions
      const newInventoryItem: TraderInventory = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productName: transaction.productName,
        productSku: transaction.productSku,
        category: transaction.category,
        currentStock: transaction.quantity,
        unit: transaction.unit,
        avgBuyPrice: transaction.unitPrice,
        lastBuyPrice: transaction.unitPrice,
        suggestedSellPrice: transaction.unitPrice * 1.2, // 20% markup
        totalInvested: transaction.totalAmount,
        lastPurchaseDate: transaction.date,
        supplier: transaction.partyName,
        status: 'in_stock',
        minStockLevel: 5,
        maxStockLevel: 100,
        reorderPoint: 10,
        totalBought: transaction.quantity,
        totalSold: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedInventory = [...inventory, newInventoryItem];
      setInventory(updatedInventory);
      saveInventory(updatedInventory);
    }
    
    // Recalculate profit analysis
    calculateProfitAnalysis([...transactions, transaction]);
  };

  // Validation functions
  const validateTransactionForm = () => {
    const errors: string[] = [];
    
    if (!transactionForm.productName.trim()) errors.push('Product name is required');
    if (!transactionForm.productSku.trim()) errors.push('Product SKU is required');
    if (!transactionForm.category.trim()) errors.push('Category is required');
    if (!transactionForm.quantity || parseInt(transactionForm.quantity) <= 0) errors.push('Valid quantity is required');
    if (!transactionForm.unitPrice || parseFloat(transactionForm.unitPrice) <= 0) errors.push('Valid unit price is required');
    if (!transactionForm.partyName.trim()) errors.push('Party name is required');
    if (!transactionForm.invoiceNumber.trim()) errors.push('Invoice number is required');
    
    if (transactionForm.partyPhone && !/^\d{10}$/.test(transactionForm.partyPhone.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid 10-digit phone number');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateAdjustmentForm = () => {
    const errors: string[] = [];
    
    if (!adjustmentForm.productSku.trim()) errors.push('Product SKU is required');
    if (!adjustmentForm.quantity || parseInt(adjustmentForm.quantity) <= 0) errors.push('Valid quantity is required');
    if (!adjustmentForm.reason.trim()) errors.push('Reason is required');
    
    return { isValid: errors.length === 0, errors };
  };

  // Form reset functions
  const resetTransactionForm = () => {
    setTransactionForm({
      type: 'buy',
      productName: '',
      productSku: '',
      category: '',
      quantity: '',
      unit: 'pieces',
      unitPrice: '',
      partyName: '',
      partyPhone: '',
      partyType: 'supplier',
      invoiceNumber: '',
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      productSku: '',
      adjustmentType: 'increase',
      quantity: '',
      reason: '',
      notes: ''
    });
  };

  // Edit handlers
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      productName: transaction.productName,
      productSku: transaction.productSku,
      category: transaction.category,
      quantity: transaction.quantity.toString(),
      unit: transaction.unit,
      unitPrice: transaction.unitPrice.toString(),
      partyName: transaction.partyName,
      partyPhone: transaction.partyPhone || '',
      partyType: transaction.partyType,
      invoiceNumber: transaction.invoiceNumber,
      paymentStatus: transaction.paymentStatus,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes || ''
    });
    setTransactionDialogOpen(true);
  };

  // Filter functions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || transaction.paymentStatus === filterStatus;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
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
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      buy: 'bg-red-100 text-red-800',
      sell: 'bg-green-100 text-green-800'
    };
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const calculateTotalInvestment = () => {
    return inventory.reduce((sum, item) => sum + item.totalInvested, 0);
  };

  const calculateTotalStock = () => {
    return inventory.reduce((sum, item) => sum + item.currentStock, 0);
  };

  const exportData = () => {
    if (!hasPermission('export_reports')) return;
    
    const data = {
      transactions: filteredTransactions,
      inventory,
      stockAdjustments,
      profitAnalysis,
      exportDate: new Date().toISOString(),
      summary: {
        totalTransactions: transactions.length,
        totalInvestment: calculateTotalInvestment(),
        totalStockItems: inventory.length
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trader-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Trading data exported successfully",
    });
  };

  // Permission check
  if (!hasPermission('view_inventory')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to view buy-sell tracking.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading buy-sell tracking...</p>
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
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalInvestment())}</div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateTotalStock()}</div>
            <p className="text-xs text-muted-foreground">
              {inventory.filter(i => i.status === 'in_stock').length} products available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {profitAnalysis.length > 0 && formatCurrency(profitAnalysis[0].grossProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {profitAnalysis.length > 0 && `${profitAnalysis[0].profitMargin.toFixed(2)}%`} margin
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === 'buy').length} buys, {transactions.filter(t => t.type === 'sell').length} sells
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Buy-Sell Tracking & Inventory Management</CardTitle>
              <CardDescription>
                Track purchase and sales transactions with real-time inventory and profit analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('create_product') && (
                <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetTransactionForm(); setEditingTransaction(null); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="transactionType">Transaction Type</Label>
                        <Select value={transactionForm.type} onValueChange={(value: 'buy' | 'sell') => setTransactionForm(prev => ({ ...prev, type: value, partyType: value === 'buy' ? 'supplier' : 'customer' }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy (Purchase)</SelectItem>
                            <SelectItem value="sell">Sell (Sale)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productName">Product Name *</Label>
                        <Input
                          id="productName"
                          value={transactionForm.productName}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, productName: e.target.value }))}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productSku">Product SKU *</Label>
                        <Input
                          id="productSku"
                          value={transactionForm.productSku}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, productSku: e.target.value.toUpperCase() }))}
                          placeholder="e.g., PROD-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Smartphones">Smartphones</SelectItem>
                            <SelectItem value="Laptops">Laptops</SelectItem>
                            <SelectItem value="Appliances">Appliances</SelectItem>
                            <SelectItem value="Fashion">Fashion</SelectItem>
                            <SelectItem value="Books">Books</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={transactionForm.quantity}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Select value={transactionForm.unit} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, unit: value }))}>
                          <SelectTrigger>
                            <SelectValue />
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
                        <Label htmlFor="unitPrice">Unit Price *</Label>
                        <Input
                          id="unitPrice"
                          type="number"
                          value={transactionForm.unitPrice}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partyName">{transactionForm.type === 'buy' ? 'Supplier' : 'Customer'} Name *</Label>
                        <Input
                          id="partyName"
                          value={transactionForm.partyName}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, partyName: e.target.value }))}
                          placeholder={`Enter ${transactionForm.type === 'buy' ? 'supplier' : 'customer'} name`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partyPhone">Phone Number</Label>
                        <Input
                          id="partyPhone"
                          value={transactionForm.partyPhone}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, partyPhone: e.target.value }))}
                          placeholder="10-digit phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                        <Input
                          id="invoiceNumber"
                          value={transactionForm.invoiceNumber}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          placeholder="e.g., INV-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentStatus">Payment Status</Label>
                        <Select value={transactionForm.paymentStatus} onValueChange={(value: 'paid' | 'pending' | 'partial') => setTransactionForm(prev => ({ ...prev, paymentStatus: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select value={transactionForm.paymentMethod} onValueChange={(value: 'cash' | 'credit' | 'bank_transfer' | 'cheque' | 'upi') => setTransactionForm(prev => ({ ...prev, paymentMethod: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={transactionForm.notes}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes..."
                          rows={2}
                        />
                      </div>
                      {transactionForm.quantity && transactionForm.unitPrice && (
                        <div className="md:col-span-2 p-3 bg-muted rounded-lg">
                          <div className="text-sm font-medium">Total Amount: {formatCurrency(parseFloat(transactionForm.quantity || '0') * parseFloat(transactionForm.unitPrice || '0'))}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}>
                        {editingTransaction ? 'Update' : 'Create'} Transaction
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {hasPermission('edit_product') && (
                <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => resetAdjustmentForm()}>
                      <Settings className="mr-2 h-4 w-4" />
                      Stock Adjustment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manual Stock Adjustment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="adjustProductSku">Product SKU *</Label>
                        <Select value={adjustmentForm.productSku} onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, productSku: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map(item => (
                              <SelectItem key={item.id} value={item.productSku}>
                                {item.productName} ({item.productSku}) - Current: {item.currentStock}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustmentType">Adjustment Type *</Label>
                        <Select value={adjustmentForm.adjustmentType} onValueChange={(value: 'increase' | 'decrease' | 'correction') => setAdjustmentForm(prev => ({ ...prev, adjustmentType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="increase">Increase Stock</SelectItem>
                            <SelectItem value="decrease">Decrease Stock</SelectItem>
                            <SelectItem value="correction">Stock Correction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustQuantity">
                          {adjustmentForm.adjustmentType === 'correction' ? 'Correct Stock To *' : 'Quantity *'}
                        </Label>
                        <Input
                          id="adjustQuantity"
                          type="number"
                          value={adjustmentForm.quantity}
                          onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustReason">Reason *</Label>
                        <Select value={adjustmentForm.reason} onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, reason: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Physical Count Correction">Physical Count Correction</SelectItem>
                            <SelectItem value="Damaged Goods">Damaged Goods</SelectItem>
                            <SelectItem value="Expired Products">Expired Products</SelectItem>
                            <SelectItem value="Theft/Loss">Theft/Loss</SelectItem>
                            <SelectItem value="System Error">System Error</SelectItem>
                            <SelectItem value="Return to Supplier">Return to Supplier</SelectItem>
                            <SelectItem value="Free Samples">Free Samples</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustNotes">Additional Notes</Label>
                        <Textarea
                          id="adjustNotes"
                          value={adjustmentForm.notes}
                          onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional details about the adjustment..."
                          rows={2}
                        />
                      </div>
                      {adjustmentForm.productSku && adjustmentForm.quantity && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium mb-1">Preview:</div>
                            {(() => {
                              const item = inventory.find(i => i.productSku === adjustmentForm.productSku);
                              if (!item) return null;
                              
                              const adjustmentQuantity = parseInt(adjustmentForm.quantity || '0');
                              const oldStock = item.currentStock;
                              let newStock = oldStock;
                              
                              if (adjustmentForm.adjustmentType === 'increase') {
                                newStock = oldStock + adjustmentQuantity;
                              } else if (adjustmentForm.adjustmentType === 'decrease') {
                                newStock = Math.max(0, oldStock - adjustmentQuantity);
                              } else if (adjustmentForm.adjustmentType === 'correction') {
                                newStock = adjustmentQuantity;
                              }
                              
                              return (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Current Stock: <span className="font-medium">{oldStock}</span></div>
                                  <div>New Stock: <span className="font-medium">{newStock}</span></div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleStockAdjustment}>
                        Apply Adjustment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {hasPermission('export_reports') && (
                <Button variant="outline" onClick={exportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
              <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
              <TabsTrigger value="adjustments">Adjustments ({stockAdjustments.length})</TabsTrigger>
              <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
            </TabsList>
            
            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, SKU or party name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Smartphones">Smartphones</SelectItem>
                    <SelectItem value="Laptops">Laptops</SelectItem>
                    <SelectItem value="Appliances">Appliances</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{transaction.productName}</CardTitle>
                            <Badge className={getTransactionTypeBadge(transaction.type)}>
                              {transaction.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.productSku} • {transaction.category}
                          </div>
                          <div className="text-sm">
                            {transaction.type === 'buy' ? 'From: ' : 'To: '}{transaction.partyName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(transaction.totalAmount)}
                          </div>
                          <Badge className={getStatusBadge(transaction.paymentStatus)}>
                            {transaction.paymentStatus.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Quantity</div>
                          <div className="font-medium">
                            {transaction.quantity} {transaction.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Unit Price</div>
                          <div className="font-medium">{formatCurrency(transaction.unitPrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Date</div>
                          <div className="font-medium">{formatDate(transaction.date)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Payment Method</div>
                          <div className="font-medium capitalize">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      
                      {transaction.type === 'sell' && transaction.margin && (
                        <div className="border-t pt-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Profit Margin</div>
                              <div className="font-medium text-green-600">
                                {formatCurrency(transaction.margin)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Margin %</div>
                              <div className="font-medium text-green-600">
                                {transaction.marginPercentage?.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Invoice: {transaction.invoiceNumber}
                        </span>
                        <span className="text-muted-foreground">
                          By: {transaction.createdBy}
                        </span>
                      </div>
                      
                      {transaction.notes && (
                        <div className="text-sm italic text-muted-foreground">
                          Note: {transaction.notes}
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                        {hasPermission('edit_product') && (
                          <Button size="sm" variant="outline" onClick={() => handleEditTransaction(transaction)}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        {hasPermission('delete_product') && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteTransaction(transaction.id)}
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
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found. Create your first transaction to get started.
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {inventory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{item.productName}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {item.productSku} • {item.category}
                          </div>
                          <Badge className={getStatusBadge(item.status)}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">In Stock</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Avg Buy Price</div>
                          <div className="font-medium">{formatCurrency(item.avgBuyPrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Suggested Sell</div>
                          <div className="font-medium text-green-600">
                            {formatCurrency(item.suggestedSellPrice)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Invested</div>
                          <div className="font-medium">{formatCurrency(item.totalInvested)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Expected Profit</div>
                          <div className="font-medium text-green-600">
                            {formatCurrency((item.suggestedSellPrice - item.avgBuyPrice) * item.currentStock)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Supplier:</span>
                          <span>{item.supplier}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Bought:</span>
                          <span>{item.totalBought}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Sold:</span>
                          <span>{item.totalSold}</span>
                        </div>
                        {item.lastPurchaseDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Last Purchase:</span>
                            <span>{formatDate(item.lastPurchaseDate)}</span>
                          </div>
                        )}
                        {item.lastSaleDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Last Sale:</span>
                            <span>{formatDate(item.lastSaleDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      {item.currentStock <= item.minStockLevel && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          Low stock alert! Below minimum level of {item.minStockLevel}
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Calculator className="mr-1 h-3 w-3" />
                          Calculate Margin
                        </Button>
                        {hasPermission('create_product') && (
                          <Button size="sm">
                            <Plus className="mr-1 h-3 w-3" />
                            Sell
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {inventory.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No inventory items found. Add buy transactions to populate your inventory.
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Stock Adjustments Tab */}
            <TabsContent value="adjustments" className="space-y-4">
              <div className="space-y-4">
                {stockAdjustments.map((adjustment) => (
                  <Card key={adjustment.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="font-medium">{adjustment.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {adjustment.productSku}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={adjustment.adjustmentType === 'increase' ? 'default' : 
                                           adjustment.adjustmentType === 'decrease' ? 'destructive' : 'secondary'}>
                              {adjustment.adjustmentType.toUpperCase()}
                            </Badge>
                            <span className="text-sm">{adjustment.reason}</span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm text-muted-foreground">Stock Change</div>
                          <div className="font-medium">
                            {adjustment.oldStock} → {adjustment.newStock}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(adjustment.date)}
                          </div>
                        </div>
                      </div>
                      {adjustment.notes && (
                        <div className="mt-3 text-sm italic text-muted-foreground">
                          Notes: {adjustment.notes}
                        </div>
                      )}
                      <div className="mt-3 text-xs text-muted-foreground">
                        Adjusted by: {adjustment.adjustedBy}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {stockAdjustments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No stock adjustments made yet.
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Profit Analysis Tab */}
            <TabsContent value="profit" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profitAnalysis.map((analysis, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{analysis.period}</CardTitle>
                      <CardDescription>Profit and performance analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Purchases</div>
                          <div className="font-semibold text-red-600">
                            {formatCurrency(analysis.totalPurchases)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Sales</div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(analysis.totalSales)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Gross Profit</div>
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(analysis.grossProfit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Profit Margin</div>
                          <div className="font-semibold text-blue-600">
                            {analysis.profitMargin.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Transactions</div>
                          <div className="font-semibold">{analysis.transactionCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Top Selling</div>
                          <div className="font-semibold">{analysis.topSellingProduct}</div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="text-sm">
                          <div className="text-muted-foreground">Most Profitable Product:</div>
                          <div className="font-medium text-green-600">
                            {analysis.mostProfitableProduct}
                          </div>
                        </div>
                      </div>
                      
                      {/* Profit Margin Visual */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Profit Margin</span>
                          <span>{analysis.profitMargin.toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              analysis.profitMargin >= 20 ? 'bg-green-500' :
                              analysis.profitMargin >= 10 ? 'bg-blue-500' :
                              analysis.profitMargin >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(analysis.profitMargin * 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {profitAnalysis.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No profit analysis available. Add transactions to generate insights.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuySellTracking;
