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
import { authService } from '@/lib/auth-service';
import BackButton from '@/components/BackButton';
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Package,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  Truck,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  Upload,
  Globe,
  User,
  CreditCard,
  Archive
} from 'lucide-react';
import { SmartImportButton } from '@/components/import/SmartImportButton';
import SmartImportModal from '@/components/import/SmartImportModal';

interface Vendor {
  id: string;
  name: string;
  companyName?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstNumber?: string;
  panNumber?: string;
  vendorType: 'raw_material' | 'finished_goods' | 'services' | 'equipment' | 'other';
  category: string;
  rating: number; // 1-5 stars
  isActive: boolean;
  isPreferred: boolean;
  creditLimit: number;
  paymentTerms: string;
  deliveryTerms: string;
  currency: string;
  website?: string;
  notes: string;
  tags: string[];
  businessTypes: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalOrderValue: number;
  averageDeliveryTime: number;
  qualityScore: number;
  priceCompetitiveness: number;
}

interface VendorOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'credit' | 'advance';
  items: {
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    receivedQuantity?: number;
    status: 'pending' | 'delivered' | 'partial' | 'cancelled';
  }[];
  shippingAddress: string;
  terms: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface VendorFilters {
  type: string;
  status: 'all' | 'active' | 'inactive';
  relationship: string;
  rating: number;
  businessType: string;
}

const VendorManagement: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  
  // State management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vendors');
  const [showImport, setShowImport] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<VendorFilters>({
    type: 'all',
    status: 'all',
    relationship: 'all',
    rating: 0,
    businessType: 'all'
  });
  
  // Dialog states
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // Form states
  const [vendorForm, setVendorForm] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    gstNumber: '',
    panNumber: '',
    vendorType: 'finished_goods' as const,
    category: '',
    rating: 5,
    isActive: true,
    isPreferred: false,
    creditLimit: '',
    paymentTerms: 'NET 30',
    deliveryTerms: 'FOB',
    currency: 'INR',
    website: '',
    notes: '',
    tags: '',
    businessTypes: [] as string[],
    qualityScore: 5,
    priceCompetitiveness: 5,
    averageDeliveryTime: 7
  });

  // Check business type compatibility
  const currentUser = authService.getCurrentUser();
  const businessTypesWithVendors = ['manufacturer', 'wholesaler', 'distributor', 'retailer', 'trader'];
  const isBusinessTypeSupported = businessTypesWithVendors.includes(currentUser?.businessType || '');

  useEffect(() => {
    if (isBusinessTypeSupported) {
      loadData();
    }
  }, [isBusinessTypeSupported]);

  const loadData = () => {
    setLoading(true);
    
    // Load vendors from localStorage
    const savedVendors = localStorage.getItem('insygth_vendors');
    const vendorsData = savedVendors ? JSON.parse(savedVendors) : [];
    
    // Load orders from localStorage
    const savedOrders = localStorage.getItem('insygth_vendor_orders');
    const ordersData = savedOrders ? JSON.parse(savedOrders) : [];
    
    setVendors(vendorsData);
    setOrders(ordersData);
    setLoading(false);
  };

  const saveVendors = (vendorsData: Vendor[]) => {
    localStorage.setItem('insygth_vendors', JSON.stringify(vendorsData));
  };

  const saveOrders = (ordersData: VendorOrder[]) => {
    localStorage.setItem('insygth_vendor_orders', JSON.stringify(ordersData));
  };

  // Vendor CRUD operations
  const handleCreateVendor = () => {
    const validation = validateVendorForm();
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

    // Check for duplicate vendors
    const existingVendor = vendors.find(v => 
      v.phone === vendorForm.phone || 
      (vendorForm.email && v.email === vendorForm.email) ||
      (vendorForm.gstNumber && v.gstNumber === vendorForm.gstNumber)
    );
    
    if (existingVendor) {
      toast({
        title: "Duplicate Vendor",
        description: "Vendor with this phone, email, or GST number already exists",
        variant: "destructive"
      });
      return;
    }

    const newVendor: Vendor = {
      id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: vendorForm.name,
      companyName: vendorForm.companyName,
      contactPerson: vendorForm.contactPerson,
      phone: vendorForm.phone,
      email: vendorForm.email,
      address: vendorForm.address,
      city: vendorForm.city,
      state: vendorForm.state,
      pincode: vendorForm.pincode,
      country: vendorForm.country,
      gstNumber: vendorForm.gstNumber,
      panNumber: vendorForm.panNumber,
      vendorType: vendorForm.vendorType,
      category: vendorForm.category,
      rating: vendorForm.rating,
      isActive: vendorForm.isActive,
      isPreferred: vendorForm.isPreferred,
      creditLimit: parseFloat(vendorForm.creditLimit) || 0,
      paymentTerms: vendorForm.paymentTerms,
      deliveryTerms: vendorForm.deliveryTerms,
      currency: vendorForm.currency,
      website: vendorForm.website,
      notes: vendorForm.notes,
      tags: vendorForm.tags ? vendorForm.tags.split(',').map(tag => tag.trim()) : [],
      businessTypes: vendorForm.businessTypes,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOrders: 0,
      totalOrderValue: 0,
      averageDeliveryTime: vendorForm.averageDeliveryTime,
      qualityScore: vendorForm.qualityScore,
      priceCompetitiveness: vendorForm.priceCompetitiveness
    };

    const updatedVendors = [...vendors, newVendor];
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    resetVendorForm();
    setVendorDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Vendor created successfully",
    });
  };

  const handleUpdateVendor = () => {
    if (!editingVendor) return;

    const validation = validateVendorForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const updatedVendors = vendors.map(vendor => 
      vendor.id === editingVendor.id 
        ? {
            ...vendor,
            name: vendorForm.name,
            companyName: vendorForm.companyName,
            contactPerson: vendorForm.contactPerson,
            phone: vendorForm.phone,
            email: vendorForm.email,
            address: vendorForm.address,
            city: vendorForm.city,
            state: vendorForm.state,
            pincode: vendorForm.pincode,
            country: vendorForm.country,
            gstNumber: vendorForm.gstNumber,
            panNumber: vendorForm.panNumber,
            vendorType: vendorForm.vendorType,
            category: vendorForm.category,
            rating: vendorForm.rating,
            isActive: vendorForm.isActive,
            isPreferred: vendorForm.isPreferred,
            creditLimit: parseFloat(vendorForm.creditLimit) || 0,
            paymentTerms: vendorForm.paymentTerms,
            deliveryTerms: vendorForm.deliveryTerms,
            currency: vendorForm.currency,
            website: vendorForm.website,
            notes: vendorForm.notes,
            tags: vendorForm.tags ? vendorForm.tags.split(',').map(tag => tag.trim()) : [],
            businessTypes: vendorForm.businessTypes,
            averageDeliveryTime: vendorForm.averageDeliveryTime,
            qualityScore: vendorForm.qualityScore,
            priceCompetitiveness: vendorForm.priceCompetitiveness,
            updatedAt: new Date().toISOString()
          }
        : vendor
    );

    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    resetVendorForm();
    setEditingVendor(null);
    setVendorDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Vendor updated successfully",
    });
  };

  const handleDeleteVendor = (vendorId: string) => {
    const relatedOrders = orders.filter(order => order.vendorId === vendorId);
    if (relatedOrders.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete vendor with existing orders. Archive vendor instead.",
        variant: "destructive"
      });
      return;
    }

    const updatedVendors = vendors.filter(vendor => vendor.id !== vendorId);
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    
    toast({
      title: "Success",
      description: "Vendor deleted successfully",
    });
  };

  const handleToggleVendorStatus = (vendorId: string) => {
    const updatedVendors = vendors.map(vendor => 
      vendor.id === vendorId 
        ? { ...vendor, isActive: !vendor.isActive, updatedAt: new Date().toISOString() }
        : vendor
    );

    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    
    toast({
      title: "Success",
      description: "Vendor status updated successfully",
    });
  };

  // Validation
  const validateVendorForm = () => {
    const errors: string[] = [];
    
    if (!vendorForm.name.trim()) errors.push('Vendor name is required');
    if (!vendorForm.contactPerson.trim()) errors.push('Contact person is required');
    if (!vendorForm.phone.trim()) errors.push('Phone number is required');
    if (!vendorForm.address.trim()) errors.push('Address is required');
    if (!vendorForm.city.trim()) errors.push('City is required');
    if (!vendorForm.state.trim()) errors.push('State is required');
    if (!vendorForm.pincode.trim()) errors.push('Pincode is required');
    if (!vendorForm.category.trim()) errors.push('Category is required');
    
    if (vendorForm.phone && !/^\d{10}$/.test(vendorForm.phone.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid 10-digit phone number');
    }
    
    if (vendorForm.email && !/\S+@\S+\.\S+/.test(vendorForm.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (vendorForm.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(vendorForm.gstNumber)) {
      errors.push('Please enter a valid GST number');
    }
    
    if (vendorForm.pincode && !/^\d{6}$/.test(vendorForm.pincode)) {
      errors.push('Please enter a valid 6-digit pincode');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Form management
  const resetVendorForm = () => {
    setVendorForm({
      name: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      gstNumber: '',
      panNumber: '',
      vendorType: 'finished_goods',
      category: '',
      rating: 5,
      isActive: true,
      isPreferred: false,
      creditLimit: '',
      paymentTerms: 'NET 30',
      deliveryTerms: 'FOB',
      currency: 'INR',
      website: '',
      notes: '',
      tags: '',
      businessTypes: [],
      qualityScore: 5,
      priceCompetitiveness: 5,
      averageDeliveryTime: 7
    });
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      companyName: vendor.companyName || '',
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email || '',
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      pincode: vendor.pincode,
      country: vendor.country,
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
      vendorType: vendor.vendorType,
      category: vendor.category,
      rating: vendor.rating,
      isActive: vendor.isActive,
      isPreferred: vendor.isPreferred,
      creditLimit: vendor.creditLimit.toString(),
      paymentTerms: vendor.paymentTerms,
      deliveryTerms: vendor.deliveryTerms,
      currency: vendor.currency,
      website: vendor.website || '',
      notes: vendor.notes,
      tags: vendor.tags.join(', '),
      businessTypes: vendor.businessTypes,
      qualityScore: vendor.qualityScore,
      priceCompetitiveness: vendor.priceCompetitiveness,
      averageDeliveryTime: vendor.averageDeliveryTime
    });
    setVendorDialogOpen(true);
  };

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.phone.includes(searchTerm) ||
                         (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.type === 'all' || vendor.vendorType === filters.type;
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && vendor.isActive) ||
                         (filters.status === 'inactive' && !vendor.isActive);
    const matchesRating = filters.rating === 0 || vendor.rating >= filters.rating;
    const matchesBusinessType = filters.businessType === 'all' || vendor.businessTypes.includes(filters.businessType);
    
    return matchesSearch && matchesType && matchesStatus && matchesRating && matchesBusinessType;
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

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getStatusBadge = (vendor: Vendor) => {
    if (!vendor.isActive) {
      return <Badge variant="destructive" className="text-xs">Inactive</Badge>;
    }
    if (vendor.isPreferred) {
      return <Badge className="bg-purple-100 text-purple-800 text-xs">Preferred</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>;
  };

  const getVendorTypeBadge = (type: string) => {
    const typeColors = {
      'raw_material': 'bg-brown-100 text-brown-800',
      'finished_goods': 'bg-blue-100 text-blue-800',
      'services': 'bg-purple-100 text-purple-800',
      'equipment': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800';
  };

  const exportData = () => {
    if (!hasPermission('export_reports')) return;
    
    const data = {
      vendors: filteredVendors,
      orders,
      exportDate: new Date().toISOString(),
      summary: {
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.isActive).length,
        preferredVendors: vendors.filter(v => v.isPreferred).length,
        totalOrders: orders.length
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Vendor data exported successfully",
    });
  };

  // Business type check
  if (!isBusinessTypeSupported) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <BackButton />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-96 text-center">
            <Building className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor Management Not Available</h3>
            <p className="text-gray-500">
              Vendor management features are not applicable for your business type: {currentUser?.businessType}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Available for: Manufacturer, Wholesaler, Distributor, Retailer, Trader
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permission check
  if (!hasPermission('view_inventory')) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <BackButton />
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">You don't have permission to view vendor management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading vendor management...</p>
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
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">
              {vendors.filter(v => v.isActive).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferred Vendors</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.filter(v => v.isPreferred).length}</div>
            <p className="text-xs text-muted-foreground">
              {vendors.filter(v => v.isPreferred && v.isActive).length} active preferred
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {orders.filter(o => o.status === 'delivered').length} delivered
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, o) => sum + o.totalAmount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>
                Manage supplier relationships, track performance, and handle vendor orders
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <SmartImportButton onImport={()=> setShowImport(true)} />
              {hasPermission('create_product') && (
                <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetVendorForm(); setEditingVendor(null); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vendorName">Vendor Name *</Label>
                        <Input
                          id="vendorName"
                          value={vendorForm.name}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter vendor name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={vendorForm.companyName}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="Company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person *</Label>
                        <Input
                          id="contactPerson"
                          value={vendorForm.contactPerson}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                          placeholder="Contact person name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={vendorForm.phone}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="10-digit phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={vendorForm.email}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="vendor@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vendorType">Vendor Type</Label>
                        <Select value={vendorForm.vendorType} onValueChange={(value: 'raw_material' | 'finished_goods' | 'services' | 'equipment' | 'other') => setVendorForm(prev => ({ ...prev, vendorType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="raw_material">Raw Material</SelectItem>
                            <SelectItem value="finished_goods">Finished Goods</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Input
                          id="category"
                          value={vendorForm.category}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="e.g., Electronics, Textiles"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={vendorForm.city}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={vendorForm.state}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={vendorForm.pincode}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, pincode: e.target.value }))}
                          placeholder="6-digit pincode"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          value={vendorForm.gstNumber}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                          placeholder="15-digit GST number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Number</Label>
                        <Input
                          id="panNumber"
                          value={vendorForm.panNumber}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                          placeholder="10-character PAN"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="creditLimit">Credit Limit</Label>
                        <Input
                          id="creditLimit"
                          type="number"
                          value={vendorForm.creditLimit}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select value={vendorForm.paymentTerms} onValueChange={(value) => setVendorForm(prev => ({ ...prev, paymentTerms: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COD">Cash on Delivery</SelectItem>
                            <SelectItem value="NET 15">NET 15 Days</SelectItem>
                            <SelectItem value="NET 30">NET 30 Days</SelectItem>
                            <SelectItem value="NET 45">NET 45 Days</SelectItem>
                            <SelectItem value="NET 60">NET 60 Days</SelectItem>
                            <SelectItem value="Advance">Advance Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={vendorForm.website}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://vendor.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rating">Rating (1-5)</Label>
                        <Select value={vendorForm.rating.toString()} onValueChange={(value) => setVendorForm(prev => ({ ...prev, rating: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Star</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={vendorForm.isPreferred}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, isPreferred: e.target.checked }))}
                          />
                          Preferred Vendor
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={vendorForm.isActive}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          />
                          Active Status
                        </Label>
                      </div>
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <Label htmlFor="address">Address *</Label>
                        <Textarea
                          id="address"
                          value={vendorForm.address}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Complete address"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={vendorForm.tags}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="e.g., quality, fast-delivery, cost-effective"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={vendorForm.notes}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes about the vendor"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setVendorDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={editingVendor ? handleUpdateVendor : handleCreateVendor}>
                        {editingVendor ? 'Update' : 'Create'} Vendor
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
              <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            </TabsList>
            
            {/* Vendors Tab */}
            <TabsContent value="vendors" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vendors by name, contact, phone, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Vendor Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="finished_goods">Finished Goods</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.rating.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, rating: parseInt(value) }))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Min Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Ratings</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredVendors.map((vendor) => (
                  <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{vendor.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {vendor.contactPerson}
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(vendor)}
                            <Badge className={getVendorTypeBadge(vendor.vendorType)}>
                              {vendor.vendorType.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {getRatingStars(vendor.rating)}
                          </div>
                          <div className="text-sm text-muted-foreground">{vendor.rating}/5</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{vendor.phone}</span>
                        </div>
                        {vendor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{vendor.email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <span className="text-xs">{vendor.city}, {vendor.state}</span>
                        </div>
                        {vendor.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs truncate">{vendor.website}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Category</div>
                          <div className="font-medium">{vendor.category}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Payment Terms</div>
                          <div className="font-medium">{vendor.paymentTerms}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Orders</div>
                          <div className="font-medium">{vendor.totalOrders}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Order Value</div>
                          <div className="font-medium text-green-600">
                            {formatCurrency(vendor.totalOrderValue)}
                          </div>
                        </div>
                      </div>
                      
                      {vendor.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {vendor.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {vendor.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{vendor.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        Created: {formatDate(vendor.createdAt)}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {hasPermission('edit_product') && (
                          <Button size="sm" variant="outline" onClick={() => handleEditVendor(vendor)}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        {hasPermission('edit_product') && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleToggleVendorStatus(vendor.id)}
                            className={vendor.isActive ? "text-orange-600" : "text-green-600"}
                          >
                            <Archive className="mr-1 h-3 w-3" />
                            {vendor.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                        {hasPermission('delete_product') && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteVendor(vendor.id)}
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
                {filteredVendors.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No vendors found. Add your first vendor to get started.
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="font-medium">Order #{order.orderNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.vendorName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={order.status === 'delivered' ? 'default' : 
                                           order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                              {order.status.toUpperCase()}
                            </Badge>
                            <Badge variant={order.priority === 'urgent' ? 'destructive' : 
                                           order.priority === 'high' ? 'default' : 'secondary'}>
                              {order.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(order.orderDate)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-muted-foreground">Expected Delivery:</span>
                            <span className="ml-2">{formatDate(order.expectedDeliveryDate)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment:</span>
                            <span className="ml-2 capitalize">{order.paymentStatus}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {order.items.length} items • Created by {order.createdByName}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No vendor orders found.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {showImport && (
        <SmartImportModal open={showImport} onClose={()=>setShowImport(false)} module={"suppliers"} />
      )}
    </div>
  );
};

export default VendorManagement;
