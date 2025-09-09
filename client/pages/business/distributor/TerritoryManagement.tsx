import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/lib/permissions';
import BackButton from '@/components/BackButton';
import { Search, MapPin, Users, Target, TrendingUp,
         Plus, Eye, Edit, BarChart3, Map } from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  code: string;
  region: string;
  state: string;
  districts: string[];
  cities: string[];
  pincodes: string[];
  assignedSalesman: string;
  salesmanPhone: string;
  targetSales: number;
  achievedSales: number;
  clientCount: number;
  activeClients: number;
  newClientsThisMonth: number;
  lastVisitDate: string;
  status: 'active' | 'inactive' | 'under_development';
  createdDate: string;
  notes?: string;
}

interface Client {
  id: string;
  name: string;
  type: 'retailer' | 'sub_distributor' | 'institutional';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  territory: string;
  status: 'active' | 'inactive' | 'prospect';
  lastOrderDate?: string;
  totalOrders: number;
  lifetimeValue: number;
  creditLimit: number;
  outstandingAmount: number;
  assignedSalesman: string;
}

interface SalesPerformance {
  territoryId: string;
  territoryName: string;
  salesmanName: string;
  monthlyTarget: number;
  monthlyAchieved: number;
  achievementPercentage: number;
  clientsVisited: number;
  newClients: number;
  ordersGenerated: number;
  averageOrderValue: number;
}

const TerritoryManagement: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Initialize with empty data - ready for Firebase integration
  useEffect(() => {
    const territories: Territory[] = [];
    const clients: Client[] = [];
    const salesPerformance: SalesPerformance[] = [];

    setTerritories(territories);
    setClients(clients);
    setSalesPerformance(salesPerformance);
    setLoading(false);
  }, []);

  const filteredTerritories = territories.filter(territory => {
    const matchesSearch = territory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         territory.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         territory.assignedSalesman.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = filterRegion === 'all' || territory.region === filterRegion;
    const matchesStatus = filterStatus === 'all' || territory.status === filterStatus;
    
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const getTerritoryClients = (territoryName: string) => {
    return clients.filter(client => client.territory === territoryName);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      under_development: 'bg-yellow-100 text-yellow-800',
      prospect: 'bg-blue-100 text-blue-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getClientTypeBadge = (type: string) => {
    const variants = {
      retailer: 'bg-blue-100 text-blue-800',
      sub_distributor: 'bg-purple-100 text-purple-800',
      institutional: 'bg-orange-100 text-orange-800'
    };
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

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

  const calculateAchievementPercentage = (achieved: number, target: number) => {
    return target > 0 ? (achieved / target) * 100 : 0;
  };

  const exportData = () => {
    if (!hasPermission('export_reports')) return;
    console.log('Exporting territory data...');
  };

  if (!hasPermission('view_territories')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to view territory management.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading territory management...</p>
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
            <CardTitle className="text-sm font-medium">Total Territories</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{territories.length}</div>
            <p className="text-xs text-muted-foreground">
              {territories.filter(t => t.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {territories.reduce((sum, t) => sum + t.clientCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {territories.reduce((sum, t) => sum + t.activeClients, 0)} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                territories.reduce((sum, t) => sum + calculateAchievementPercentage(t.achievedSales, t.targetSales), 0) / territories.length
              )}%
            </div>
            <p className="text-xs text-muted-foreground">Average across territories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {territories.reduce((sum, t) => sum + t.newClientsThisMonth, 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Territory Management</CardTitle>
              <CardDescription>
                Manage sales territories, assign salesmen and track client relationships
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('create_territory') && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Territory
                </Button>
              )}
              {hasPermission('export_reports') && (
                <Button variant="outline" onClick={exportData}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="territories" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="territories">Territories</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="territories" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search territories by name, code or salesman..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                    <SelectItem value="East">East</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="under_development">Under Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Territory Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTerritories.map((territory) => {
                  const achievementPercentage = calculateAchievementPercentage(territory.achievedSales, territory.targetSales);
                  
                  return (
                    <Card key={territory.id} className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedTerritory(territory)}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{territory.name}</CardTitle>
                            <div className="text-sm text-muted-foreground">
                              {territory.code} • {territory.region} Region
                            </div>
                            <Badge className={getStatusBadge(territory.status)}>
                              {territory.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {achievementPercentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Achievement</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Salesman</div>
                            <div className="font-medium">{territory.assignedSalesman}</div>
                            <div className="text-xs text-muted-foreground">{territory.salesmanPhone}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Location</div>
                            <div className="font-medium">{territory.state}</div>
                            <div className="text-xs text-muted-foreground">
                              {territory.cities.length} cities
                            </div>
                          </div>
                        </div>
                        
                        {/* Sales Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Sales Progress</span>
                            <span>{achievementPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                achievementPercentage >= 100 ? 'bg-green-500' :
                                achievementPercentage >= 75 ? 'bg-blue-500' :
                                achievementPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Achieved: {formatCurrency(territory.achievedSales)}</span>
                            <span>Target: {formatCurrency(territory.targetSales)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{territory.clientCount}</div>
                            <div className="text-muted-foreground">Total Clients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">{territory.activeClients}</div>
                            <div className="text-muted-foreground">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">{territory.newClientsThisMonth}</div>
                            <div className="text-muted-foreground">New This Month</div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3 text-xs text-muted-foreground">
                          Last visit: {formatDate(territory.lastVisitDate)} | 
                          Created: {formatDate(territory.createdDate)}
                        </div>
                        
                        {territory.notes && (
                          <div className="text-sm italic text-muted-foreground">
                            "{territory.notes}"
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1 h-3 w-3" />
                            View Details
                          </Button>
                          {hasPermission('edit_territory') && (
                            <Button size="sm" variant="outline">
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="clients" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">{client.contactPerson}</div>
                          <div className="flex gap-2">
                            <Badge className={getClientTypeBadge(client.type)}>
                              {client.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge className={getStatusBadge(client.status)}>
                              {client.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(client.lifetimeValue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Lifetime Value</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Territory:</span>
                          <span>{client.territory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Salesman:</span>
                          <span>{client.assignedSalesman}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Orders:</span>
                          <span>{client.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Outstanding:</span>
                          <span className={client.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(client.outstandingAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Credit Limit:</span>
                          <span>{formatCurrency(client.creditLimit)}</span>
                        </div>
                        {client.lastOrderDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Order:</span>
                            <span>{formatDate(client.lastOrderDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {client.address}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {salesPerformance.map((performance) => (
                  <Card key={performance.territoryId}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{performance.territoryName}</CardTitle>
                          <div className="text-sm text-muted-foreground">{performance.salesmanName}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            performance.achievementPercentage >= 100 ? 'text-green-600' :
                            performance.achievementPercentage >= 75 ? 'text-blue-600' :
                            'text-red-600'
                          }`}>
                            {performance.achievementPercentage}%
                          </div>
                          <div className="text-sm text-muted-foreground">Achievement</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Monthly Target</div>
                          <div className="font-semibold">{formatCurrency(performance.monthlyTarget)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Achieved</div>
                          <div className="font-semibold">{formatCurrency(performance.monthlyAchieved)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Clients Visited</div>
                          <div className="font-semibold">{performance.clientsVisited}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">New Clients</div>
                          <div className="font-semibold text-green-600">{performance.newClients}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Orders Generated</div>
                          <div className="font-semibold">{performance.ordersGenerated}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Order Value</div>
                          <div className="font-semibold">{formatCurrency(performance.averageOrderValue)}</div>
                        </div>
                      </div>
                      
                      {/* Achievement Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Monthly Progress</span>
                          <span>{performance.achievementPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              performance.achievementPercentage >= 100 ? 'bg-green-500' :
                              performance.achievementPercentage >= 75 ? 'bg-blue-500' :
                              performance.achievementPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(performance.achievementPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TerritoryManagement;
