import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/lib/permissions';
import { Search, Truck, MapPin, Calendar, Clock,
         Package, Plus, Eye, Download, AlertTriangle } from 'lucide-react';
import BackButton from '@/components/BackButton';

interface TransportLog {
  id: string;
  transportId: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  totalDistance: number;
  estimatedCost: number;
  actualCost?: number;
  fuelCost: number;
  tollCharges: number;
  shipments: TransportShipment[];
  remarks?: string;
  createdBy: string;
}

interface TransportShipment {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  packages: number;
  weight: number;
  value: number;
  deliveryStatus: 'pending' | 'in_transit' | 'delivered' | 'returned';
  deliveryTime?: string;
  receivedBy?: string;
  notes?: string;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  driver: string;
  status: 'available' | 'in_transit' | 'maintenance';
}

interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  estimatedDuration: number;
  stops: string[];
}

const TransportLogs: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [transportLogs, setTransportLogs] = useState<TransportLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedLog, setSelectedLog] = useState<TransportLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRoute, setFilterRoute] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Simulated data
  useEffect(() => {
    const mockVehicles: Vehicle[] = [
      {
        id: '1',
        vehicleNumber: 'MH-01-AB-1234',
        vehicleType: 'Truck',
        capacity: 5000,
        driver: 'Raj Kumar',
        status: 'available'
      },
      {
        id: '2',
        vehicleNumber: 'MH-02-CD-5678',
        vehicleType: 'Mini Truck',
        capacity: 2000,
        driver: 'Suresh Patil',
        status: 'in_transit'
      },
      {
        id: '3',
        vehicleNumber: 'KA-03-EF-9012',
        vehicleType: 'Van',
        capacity: 1000,
        driver: 'Ramesh Singh',
        status: 'maintenance'
      }
    ];

    const mockRoutes: Route[] = [
      {
        id: '1',
        name: 'Mumbai to Pune',
        startPoint: 'Mumbai Central Warehouse',
        endPoint: 'Pune Distribution Center',
        distance: 150,
        estimatedDuration: 4,
        stops: ['Lonavala', 'Khandala']
      },
      {
        id: '2',
        name: 'Mumbai to Nashik',
        startPoint: 'Mumbai Central Warehouse',
        endPoint: 'Nashik Hub',
        distance: 220,
        estimatedDuration: 6,
        stops: ['Kasara', 'Igatpuri']
      },
      {
        id: '3',
        name: 'Local Mumbai',
        startPoint: 'Mumbai Central Warehouse',
        endPoint: 'Mumbai Local Distribution',
        distance: 50,
        estimatedDuration: 3,
        stops: ['Andheri', 'Bandra', 'Worli']
      }
    ];

    const mockTransportLogs: TransportLog[] = [
      {
        id: '1',
        transportId: 'TRP-2024-001',
        vehicleNumber: 'MH-01-AB-1234',
        driverName: 'Raj Kumar',
        driverPhone: '+91-9876543210',
        routeName: 'Mumbai to Pune',
        startLocation: 'Mumbai Central Warehouse',
        endLocation: 'Pune Distribution Center',
        startDate: '2024-01-15T08:00:00',
        expectedEndDate: '2024-01-15T12:00:00',
        actualEndDate: '2024-01-15T12:30:00',
        status: 'delivered',
        totalDistance: 150,
        estimatedCost: 8000,
        actualCost: 8500,
        fuelCost: 3500,
        tollCharges: 500,
        shipments: [
          {
            id: '1',
            invoiceNumber: 'INV-2024-001',
            customerName: 'ABC Electronics Ltd',
            customerAddress: 'Shop 15, FC Road, Pune',
            packages: 10,
            weight: 500,
            value: 125000,
            deliveryStatus: 'delivered',
            deliveryTime: '2024-01-15T14:00:00',
            receivedBy: 'John Smith',
            notes: 'Delivered in good condition'
          },
          {
            id: '2',
            invoiceNumber: 'INV-2024-003',
            customerName: 'Retail Solutions Pune',
            customerAddress: '234 MG Road, Pune',
            packages: 5,
            weight: 200,
            value: 50000,
            deliveryStatus: 'delivered',
            deliveryTime: '2024-01-15T15:30:00',
            receivedBy: 'Mary Wilson'
          }
        ],
        remarks: 'Smooth delivery, slight delay due to traffic',
        createdBy: 'Transport Manager'
      },
      {
        id: '2',
        transportId: 'TRP-2024-002',
        vehicleNumber: 'MH-02-CD-5678',
        driverName: 'Suresh Patil',
        driverPhone: '+91-9876543211',
        routeName: 'Mumbai to Nashik',
        startLocation: 'Mumbai Central Warehouse',
        endLocation: 'Nashik Hub',
        startDate: '2024-01-16T06:00:00',
        expectedEndDate: '2024-01-16T12:00:00',
        status: 'in_transit',
        totalDistance: 220,
        estimatedCost: 12000,
        fuelCost: 5000,
        tollCharges: 800,
        shipments: [
          {
            id: '1',
            invoiceNumber: 'INV-2024-004',
            customerName: 'Nashik Distributors',
            customerAddress: 'Industrial Area, Nashik',
            packages: 15,
            weight: 800,
            value: 200000,
            deliveryStatus: 'in_transit'
          }
        ],
        createdBy: 'Transport Manager'
      },
      {
        id: '3',
        transportId: 'TRP-2024-003',
        vehicleNumber: 'KA-03-EF-9012',
        driverName: 'Ramesh Singh',
        driverPhone: '+91-9876543212',
        routeName: 'Local Mumbai',
        startLocation: 'Mumbai Central Warehouse',
        endLocation: 'Mumbai Local Distribution',
        startDate: '2024-01-17T09:00:00',
        expectedEndDate: '2024-01-17T17:00:00',
        status: 'scheduled',
        totalDistance: 50,
        estimatedCost: 3000,
        fuelCost: 1200,
        tollCharges: 0,
        shipments: [
          {
            id: '1',
            invoiceNumber: 'INV-2024-005',
            customerName: 'Local Retail Chain',
            customerAddress: 'Multiple locations in Mumbai',
            packages: 8,
            weight: 300,
            value: 75000,
            deliveryStatus: 'pending'
          }
        ],
        createdBy: 'Transport Manager'
      }
    ];

    setVehicles(mockVehicles);
    setRoutes(mockRoutes);
    setTransportLogs(mockTransportLogs);
    setLoading(false);
  }, []);

  const filteredLogs = transportLogs.filter(log => {
    const matchesSearch = log.transportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.driverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesRoute = filterRoute === 'all' || log.routeName === filterRoute;
    
    return matchesSearch && matchesStatus && matchesRoute;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      delayed: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getDeliveryStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      returned: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateTotalShipmentValue = (shipments: TransportShipment[]) => {
    return shipments.reduce((sum, shipment) => sum + shipment.value, 0);
  };

  const calculateTotalPackages = (shipments: TransportShipment[]) => {
    return shipments.reduce((sum, shipment) => sum + shipment.packages, 0);
  };

  const calculateTotalWeight = (shipments: TransportShipment[]) => {
    return shipments.reduce((sum, shipment) => sum + shipment.weight, 0);
  };

  const exportLogs = () => {
    if (!hasPermission('export_reports')) return;
    console.log('Exporting transport logs...');
  };

  if (!hasPermission('view_transport')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to view transport logs.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading transport logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transports</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transportLogs.filter(log => log.status === 'in_transit').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently on road</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transportLogs.filter(log => 
                log.status === 'delivered' && 
                new Date(log.actualEndDate || '').toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transportLogs.reduce((sum, log) => sum + log.totalDistance, 0)} km
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transport Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(transportLogs.reduce((sum, log) => sum + (log.actualCost || log.estimatedCost), 0))}
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
              <CardTitle>Transport Logs</CardTitle>
              <CardDescription>
                Track vehicle movements, deliveries and transport operations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('create_transport') && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Transport
                </Button>
              )}
              {hasPermission('export_reports') && (
                <Button variant="outline" onClick={exportLogs}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logs">Transport Logs</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by transport ID, vehicle or driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRoute} onValueChange={setFilterRoute}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routes</SelectItem>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.name}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transport Log Cards */}
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{log.transportId}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {log.vehicleNumber} - {log.driverName}
                          </div>
                          <Badge className={getStatusBadge(log.status)}>
                            {log.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(calculateTotalShipmentValue(log.shipments))}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {calculateTotalPackages(log.shipments)} packages
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Route</div>
                          <div className="font-medium">{log.routeName}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.totalDistance} km
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Start Time</div>
                          <div className="font-medium">{formatDateTime(log.startDate)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            {log.status === 'delivered' ? 'Delivered' : 'Expected'}
                          </div>
                          <div className="font-medium">
                            {log.actualEndDate ? 
                              formatDateTime(log.actualEndDate) : 
                              formatDateTime(log.expectedEndDate)
                            }
                          </div>
                          {log.status === 'delivered' && log.actualEndDate && 
                           new Date(log.actualEndDate) > new Date(log.expectedEndDate) && (
                            <div className="text-xs text-orange-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Delayed
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-2">Shipments ({log.shipments.length})</div>
                        <div className="space-y-2">
                          {log.shipments.map((shipment) => (
                            <div key={shipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="space-y-1">
                                <div className="font-medium">{shipment.invoiceNumber}</div>
                                <div className="text-xs text-muted-foreground">
                                  {shipment.customerName}
                                </div>
                                <div className="text-xs">
                                  {shipment.packages} packages • {shipment.weight} kg
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <Badge className={getDeliveryStatusBadge(shipment.deliveryStatus)}>
                                  {shipment.deliveryStatus.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <div className="text-sm font-medium">
                                  {formatCurrency(shipment.value)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Estimated Cost</div>
                            <div className="font-medium">{formatCurrency(log.estimatedCost)}</div>
                          </div>
                          {log.actualCost && (
                            <div>
                              <div className="text-muted-foreground">Actual Cost</div>
                              <div className="font-medium">{formatCurrency(log.actualCost)}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-muted-foreground">Fuel Cost</div>
                            <div className="font-medium">{formatCurrency(log.fuelCost)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Toll Charges</div>
                            <div className="font-medium">{formatCurrency(log.tollCharges)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {log.remarks && (
                        <div className="border-t pt-3">
                          <div className="text-sm">
                            <div className="text-muted-foreground">Remarks:</div>
                            <div className="italic">{log.remarks}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>
                          <Eye className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                        {hasPermission('edit_transport') && log.status !== 'delivered' && (
                          <Button size="sm" variant="outline">
                            Update Status
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="vehicles" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{vehicle.vehicleNumber}</CardTitle>
                          <div className="text-sm text-muted-foreground">{vehicle.vehicleType}</div>
                        </div>
                        <Badge className={getStatusBadge(vehicle.status)}>
                          {vehicle.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Driver:</span>
                          <span>{vehicle.driver}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span>{vehicle.capacity} kg</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="routes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route) => (
                  <Card key={route.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <CardDescription>
                        {route.distance} km • {route.estimatedDuration} hours
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Start Point:</div>
                          <div>{route.startPoint}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Point:</div>
                          <div>{route.endPoint}</div>
                        </div>
                        {route.stops.length > 0 && (
                          <div>
                            <div className="text-muted-foreground">Stops:</div>
                            <div>{route.stops.join(', ')}</div>
                          </div>
                        )}
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

export default TransportLogs;
