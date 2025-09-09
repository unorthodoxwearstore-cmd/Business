import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  ShoppingBag,
  Star,
  Filter,
  Download,
  UserPlus,
  MapPin,
  CreditCard
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { dataManager } from '@/lib/data-manager';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  dateOfBirth?: string;
  joinedDate: string;
  lastPurchase: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  preferredCategories: string[];
  status: 'active' | 'inactive' | 'vip';
  notes?: string;
}

interface Purchase {
  id: string;
  date: string;
  amount: number;
  items: number;
  paymentMethod: string;
}

// No mock data - load real data

export default function CustomerDatabase() {
  const permissions = usePermissions();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Record<string, Purchase[]>>({});
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    dateOfBirth: ''
  });

  useEffect(() => {
    // Load real customers from data manager
    const allCustomers = dataManager.getAllCustomers();
    const transformedCustomers = allCustomers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: '',
      gstNumber: '',
      dateOfBirth: '',
      joinedDate: c.createdAt,
      lastPurchase: c.lastPurchaseDate || c.createdAt,
      totalOrders: 0, // Calculate from sales
      totalSpent: c.totalPurchases,
      averageOrderValue: c.totalPurchases,
      loyaltyPoints: c.loyaltyPoints || 0,
      preferredCategories: [],
      status: 'active' as const,
      notes: ''
    }));
    setCustomers(transformedCustomers);
  }, []);

  if (!permissions.hasPermission('viewAddEditOrders')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access customer database.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Customer['status']) => {
    const statusConfig = {
      active: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      inactive: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      vip: { variant: 'default' as const, color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        {status === 'vip' && <Star className="w-3 h-3 mr-1" />}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const handleAddCustomer = () => {
    try {
      if (!newCustomer.name || !newCustomer.phone) {
        toast({
          title: "Validation Error",
          description: "Name and phone are required fields.",
          variant: "destructive"
        });
        return;
      }

      const customer = dataManager.addCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email
      });

      // Reload customers
      const allCustomers = dataManager.getAllCustomers();
      const transformedCustomers = allCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: '',
        gstNumber: '',
        dateOfBirth: '',
        joinedDate: c.createdAt,
        lastPurchase: c.lastPurchaseDate || c.createdAt,
        totalOrders: 0,
        totalSpent: c.totalPurchases,
        averageOrderValue: c.totalPurchases,
        loyaltyPoints: c.loyaltyPoints || 0,
        preferredCategories: [],
        status: 'active' as const,
        notes: ''
      }));
      setCustomers(transformedCustomers);

      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
        dateOfBirth: ''
      });
      setShowAddCustomer(false);

      toast({
        title: "Customer Added ✅",
        description: `${customer.name} has been added to your customer database.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            Customer Database
          </h1>
          <p className="text-gray-600 mt-1">Manage customer information, history, and relationships</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => setShowAddCustomer(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {customers.filter(c => c.status === 'vip').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High-value customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customers.length > 0 ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Search and manage your customer database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customers by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="vip">VIP</option>
                  </select>
                  
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{customer.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </span>
                          {customer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(customer.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Orders:</span>
                        <span className="font-medium ml-1">{customer.totalOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Spent:</span>
                        <span className="font-medium ml-1">{formatCurrency(customer.totalSpent)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Order:</span>
                        <span className="font-medium ml-1">{formatCurrency(customer.averageOrderValue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Points:</span>
                        <span className="font-medium ml-1">{customer.loyaltyPoints}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {customers.length === 0 ? 'No Customers Yet' : 'No Customers Found'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {customers.length === 0
                      ? 'Start building your customer database by adding your first customer.'
                      : 'No customers found matching your criteria.'}
                  </p>
                  {customers.length === 0 && (
                    <Button onClick={() => setShowAddCustomer(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add First Customer
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Details */}
        <div>
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Customer Details
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{selectedCustomer.name}</h3>
                    {getStatusBadge(selectedCustomer.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Joined {formatDate(selectedCustomer.joinedDate)}</span>
                    </div>
                  </div>

                  {selectedCustomer.gstNumber && (
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      <strong>GST:</strong> {selectedCustomer.gstNumber}
                    </div>
                  )}

                  {selectedCustomer.notes && (
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <strong>Notes:</strong> {selectedCustomer.notes}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purchase Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</div>
                      <div className="text-gray-600">Total Orders</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(selectedCustomer.totalSpent)}</div>
                      <div className="text-gray-600">Total Spent</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Order Value:</span>
                      <span className="font-medium">{formatCurrency(selectedCustomer.averageOrderValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Loyalty Points:</span>
                      <span className="font-medium">{selectedCustomer.loyaltyPoints}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Purchase:</span>
                      <span className="font-medium">{formatDate(selectedCustomer.lastPurchase)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Preferred Categories:</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCustomer.preferredCategories.map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Purchases */}
              {purchaseHistory[selectedCustomer.id] && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Purchases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {purchaseHistory[selectedCustomer.id].map((purchase) => (
                        <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{formatCurrency(purchase.amount)}</div>
                            <div className="text-sm text-gray-600">
                              {purchase.items} items • {purchase.paymentMethod}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(purchase.date)}
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
                <h3 className="font-medium text-gray-900 mb-2">Customer Details</h3>
                <p className="text-gray-500 text-sm">
                  Select a customer from the list to view their details and purchase history.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Add New Customer</CardTitle>
              <CardDescription>Enter customer information to add them to your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="Customer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  placeholder="customer@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  placeholder="Customer address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={newCustomer.gstNumber}
                  onChange={(e) => setNewCustomer({...newCustomer, gstNumber: e.target.value})}
                  placeholder="GST number (optional)"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddCustomer}
                  className="flex-1"
                  disabled={!newCustomer.name || !newCustomer.phone}
                >
                  Add Customer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddCustomer(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
