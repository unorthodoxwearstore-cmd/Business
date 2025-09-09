import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  Users,
  CalendarDays,
  Timer,
  Star
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import BackButton from '@/components/BackButton';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
  isActive: boolean;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: string[]; // service IDs
  workingHours: {
    [key: string]: { start: string; end: string; isWorking: boolean };
  };
}

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  rating?: number;
  review?: string;
}

const services: Service[] = [];

const staff: Staff[] = [];

const bookings: Booking[] = [];

export default function BookingScheduling() {
  const permissions = usePermissions();
  const [selectedDate, setSelectedDate] = useState('2024-01-16');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  if (!permissions.hasPermission('assignTasksOrRoutes')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access booking & scheduling.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesDate = viewMode === 'list' || booking.date === selectedDate;
    const matchesStaff = selectedStaff === 'all' || booking.staffId === selectedStaff;
    const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerPhone.includes(searchTerm) ||
                         booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesStaff && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Booking['status']) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      completed: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: XCircle },
      no_show: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800', icon: XCircle }
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

  const getPaymentStatusBadge = (status: Booking['paymentStatus']) => {
    const paymentConfig = {
      pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      paid: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      refunded: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = paymentConfig[status];
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}:00`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 18) slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getBookingForSlot = (time: string, staffId: string) => {
    return filteredBookings.find(booking => 
      booking.staffId === staffId && 
      booking.startTime <= time && 
      booking.endTime > time
    );
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Booking & Scheduling
          </h1>
          <p className="text-gray-600 mt-1">Manage customer bookings and staff schedules</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-r-none"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <Users className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button 
            onClick={() => setShowAddBooking(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter(b => b.date === selectedDate).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {bookings.filter(b => b.date === selectedDate && b.status === 'confirmed').length} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                bookings
                  .filter(b => b.date === selectedDate && b.paymentStatus === 'paid')
                  .reduce((sum, b) => sum + b.price, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.length > 0 ? (bookings
                .filter(b => b.rating)
                .reduce((sum, b) => sum + (b.rating || 0), 0) /
                bookings.filter(b => b.rating).length || 0
              ).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {viewMode === 'calendar' && (
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44"
                />
              </div>
            )}
            
            <div className="space-y-1 flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by customer name, phone, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label>Staff</Label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 w-40"
              >
                <option value="all">All Staff</option>
                {staff.map(staffMember => (
                  <option key={staffMember.id} value={staffMember.id}>{staffMember.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 w-36"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardHeader>
            <CardTitle>Schedule for {formatDate(selectedDate)}</CardTitle>
            <CardDescription>View and manage today's appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="font-medium text-center">Time</div>
                  {staff.map(staffMember => (
                    <div key={staffMember.id} className="font-medium text-center p-2 bg-green-50 rounded">
                      <div>{staffMember.name}</div>
                      <div className="text-xs text-gray-500">{staffMember.services.length} services</div>
                    </div>
                  ))}
                </div>
                
                {/* Time Slots */}
                <div className="space-y-2">
                  {getTimeSlots().map(time => (
                    <div key={time} className="grid grid-cols-4 gap-4">
                      <div className="text-sm text-gray-600 text-center py-2 font-medium">
                        {formatTime(time)}
                      </div>
                      {staff.map(staffMember => {
                        const booking = getBookingForSlot(time, staffMember.id);
                        return (
                          <div key={staffMember.id} className="min-h-[60px]">
                            {booking ? (
                              <Card 
                                className={`cursor-pointer hover:shadow-md transition-shadow ${
                                  booking.status === 'confirmed' ? 'border-green-200 bg-green-50' :
                                  booking.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                                  booking.status === 'completed' ? 'border-blue-200 bg-blue-50' :
                                  'border-red-200 bg-red-50'
                                }`}
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <CardContent className="p-2">
                                  <div className="text-sm font-medium">{booking.serviceName}</div>
                                  <div className="text-xs text-gray-600">{booking.customerName}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    {getStatusBadge(booking.status)}
                                    <span className="text-xs font-medium">{formatCurrency(booking.price)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowAddBooking(true)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>Complete list of bookings and appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{booking.serviceName}</h4>
                        <p className="text-sm text-gray-600">{booking.customerName} • {booking.customerPhone}</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium ml-1">{formatDate(booking.date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium ml-1">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Staff:</span>
                        <span className="font-medium ml-1">{booking.staffName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium ml-1">{formatCurrency(booking.price)}</span>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Notes:</strong> {booking.notes}
                      </div>
                    )}
                    
                    {booking.rating && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center">
                          {Array.from({ length: booking.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        {booking.review && (
                          <span className="text-sm text-gray-600">"{booking.review}"</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedStaff !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start by creating your first booking.'
                  }
                </p>
                <Button onClick={() => setShowAddBooking(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Booking
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg m-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Booking Details
                <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{selectedBooking.serviceName}</h3>
                <p className="text-gray-600">{selectedBooking.duration} minutes • {formatCurrency(selectedBooking.price)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.customerPhone}</span>
                </div>
                {selectedBooking.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedBooking.customerEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(selectedBooking.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {getStatusBadge(selectedBooking.status)}
                {getPaymentStatusBadge(selectedBooking.paymentStatus)}
              </div>

              {selectedBooking.notes && (
                <div className="p-3 bg-gray-50 rounded">
                  <strong>Notes:</strong> {selectedBooking.notes}
                </div>
              )}

              {selectedBooking.rating && (
                <div className="p-3 bg-blue-50 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <strong>Rating:</strong>
                    <div className="flex">
                      {Array.from({ length: selectedBooking.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  {selectedBooking.review && <p>"{selectedBooking.review}"</p>}
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Booking
                </Button>
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Customer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
