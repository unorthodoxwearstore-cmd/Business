import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, MapPin, Plus, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { staffService, AttendanceRecord, LeaveRequest } from '@/lib/staff-service';
import { authService } from '@/lib/auth-service';
import BackButton from '@/components/BackButton';

interface LeaveFormData {
  type: 'sick' | 'casual' | 'annual' | 'emergency' | 'maternity' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
}

export default function AttendanceManagement() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [staffFilter, setstaffFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [leaveFormData, setLeaveFormData] = useState<LeaveFormData>({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const user = authService.getCurrentUser();
  const canManageAll = authService.hasPermission('hrAndStaffAttendance');

  useEffect(() => {
    loadAttendanceData();
    loadLeaveRequests();
    checkTodayAttendance();
  }, []);

  const loadAttendanceData = () => {
    const records = staffService.getAttendanceRecords(
      canManageAll ? staffFilter : user?.id,
      dateFilter ? dateFilter : undefined
    );
    setAttendanceRecords(records);
  };

  const loadLeaveRequests = () => {
    const requests = staffService.getLeaveRequests(canManageAll ? staffFilter : user?.id);
    setLeaveRequests(requests);
  };

  const checkTodayAttendance = () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceRecords.find(record => 
      record.staffId === user.id && record.date === today
    );
    
    setTodayRecord(todayRecord || null);
    setIsCheckedIn(!!todayRecord?.checkIn && !todayRecord?.checkOut);
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Get location if available
      let location;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location'
          };
        } catch (geoError) {
          // Location permission denied or error, proceed without location
        }
      }

      const result = await staffService.checkIn(location);
      
      if (result.success) {
        loadAttendanceData();
        checkTodayAttendance();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to check in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await staffService.checkOut();
      
      if (result.success) {
        loadAttendanceData();
        checkTodayAttendance();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to check out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!leaveFormData.startDate || !leaveFormData.endDate || !leaveFormData.reason.trim()) {
        setError('All fields are required');
        return;
      }

      const startDate = new Date(leaveFormData.startDate);
      const endDate = new Date(leaveFormData.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (days <= 0) {
        setError('End date must be after start date');
        return;
      }

      const leaveData = {
        ...leaveFormData,
        days
      };

      const result = await staffService.submitLeaveRequest(leaveData);
      
      if (result.success) {
        loadLeaveRequests();
        setIsLeaveDialogOpen(false);
        resetLeaveForm();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to submit leave request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    if (!user) return;
    
    const result = await staffService.approveLeaveRequest(leaveId, user.id);
    if (result.success) {
      loadLeaveRequests();
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    const result = await staffService.rejectLeaveRequest(leaveId, reason);
    if (result.success) {
      loadLeaveRequests();
    }
  };

  const resetLeaveForm = () => {
    setLeaveFormData({
      type: 'casual',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setError('');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      early_leave: 'bg-orange-100 text-orange-800',
      holiday: 'bg-blue-100 text-blue-800',
      leave: 'bg-purple-100 text-purple-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getLeaveStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to access attendance management.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <BackButton className="mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Attendance & Leave</h1>
          <p className="text-gray-600">Track attendance and manage leave requests</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            Current Time: {getCurrentTime()}
          </div>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {/* Check In/Out Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  {todayRecord ? (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Checked in at {formatTime(todayRecord.checkIn!)}
                      </div>
                      {todayRecord.checkOut && (
                        <div className="flex items-center text-sm">
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          Checked out at {formatTime(todayRecord.checkOut)}
                        </div>
                      )}
                      {todayRecord.workingHours > 0 && (
                        <div className="text-sm text-gray-600">
                          Working hours: {todayRecord.workingHours.toFixed(1)} hours
                        </div>
                      )}
                      {todayRecord.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {todayRecord.location.address}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">No attendance record for today</div>
                  )}
                </div>
                
                <div className="space-x-2">
                  {!todayRecord?.checkIn ? (
                    <Button onClick={handleCheckIn} disabled={isLoading}>
                      {isLoading ? 'Checking in...' : 'Check In'}
                    </Button>
                  ) : !todayRecord?.checkOut ? (
                    <Button onClick={handleCheckOut} disabled={isLoading} variant="outline">
                      {isLoading ? 'Checking out...' : 'Check Out'}
                    </Button>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      Completed for today
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          {canManageAll && (
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-xs">
                <Input
                  placeholder="Staff ID filter..."
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                />
              </div>
              <div className="flex-1 max-w-xs">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <Button onClick={loadAttendanceData}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          )}

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{formatDate(record.date)}</div>
                      <div className="text-sm text-gray-600">
                        {record.checkIn && `In: ${formatTime(record.checkIn)}`}
                        {record.checkOut && ` • Out: ${formatTime(record.checkOut)}`}
                      </div>
                      {record.workingHours > 0 && (
                        <div className="text-sm text-gray-600">
                          {record.workingHours.toFixed(1)} hours worked
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right space-y-2">
                      <Badge className={getStatusBadge(record.status)}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                      {record.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          Location tracked
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {attendanceRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No attendance records found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Leave Requests</h2>
            
            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetLeaveForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Leave Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitLeave} className="space-y-4">
                  <div>
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select 
                      value={leaveFormData.type} 
                      onValueChange={(value: any) => setLeaveFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={leaveFormData.startDate}
                        onChange={(e) => setLeaveFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={leaveFormData.endDate}
                        onChange={(e) => setLeaveFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={leaveFormData.reason}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Please provide reason for leave..."
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Leave Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{request.staffName}</span>
                        <Badge className={getLeaveStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {request.type.replace('_', ' ')} • {request.days} day{request.days > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </div>
                      <div className="text-sm">{request.reason}</div>
                      {request.rejectionReason && (
                        <div className="text-sm text-red-600">
                          Rejection reason: {request.rejectionReason}
                        </div>
                      )}
                    </div>
                    
                    {canManageAll && request.status === 'pending' && (
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveLeave(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectLeave(request.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {leaveRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No leave requests found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
