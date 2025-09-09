import React, { useState, useEffect } from 'react';
import { TrendingUp, User, Target, Clock, Award, BarChart3, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { staffService, StaffMember } from '@/lib/staff-service';
import { taskService } from '@/lib/task-service';
import { authService } from '@/lib/auth-service';
import BackButton from '@/components/BackButton';

interface PerformanceMetrics {
  staffId: string;
  staffName: string;
  role: string;
  tasksCompleted: number;
  tasksAssigned: number;
  salesAchieved: number;
  attendancePercentage: number;
  punctualityScore: number;
  productivityScore: number;
  overallRating: number;
  period: string;
}

interface KPITarget {
  type: 'tasks' | 'sales' | 'attendance' | 'custom';
  target: number;
  achieved: number;
  unit: string;
  label: string;
}

export default function PerformanceTracking() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const user = authService.getCurrentUser();
  const canViewAll = authService.hasPermission('performanceDashboard');

  useEffect(() => {
    loadStaff();
    loadPerformanceData();
    
    // Set default period to current month
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(currentPeriod);
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPerformanceData();
    }
  }, [selectedStaff, selectedPeriod]);

  const loadStaff = () => {
    const staffList = staffService.getStaffList();
    setStaff(staffList);
  };

  const loadPerformanceData = () => {
    setIsLoading(true);
    
    try {
      // Calculate performance metrics for staff
      const metrics: PerformanceMetrics[] = [];
      
      const targetStaff = selectedStaff && selectedStaff !== 'all' ?
        staff.filter(s => s.id === selectedStaff) :
        (canViewAll ? staff : staff.filter(s => s.id === user?.id));

      targetStaff.forEach(staffMember => {
        const taskStats = taskService.getTaskStats(staffMember.id);
        const attendanceRecords = staffService.getAttendanceRecords(staffMember.id);
        const commissionRecords = staffService.getCommissionRecords(staffMember.id, selectedPeriod);
        
        // Calculate attendance percentage for the period
        const periodStart = selectedPeriod ? new Date(`${selectedPeriod}-01`) : new Date();
        const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
        
        const periodAttendance = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= periodStart && recordDate <= periodEnd;
        });
        
        const workingDays = getWorkingDaysInPeriod(periodStart, periodEnd);
        const presentDays = periodAttendance.filter(r => r.status === 'present').length;
        const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
        
        // Calculate punctuality (percentage of on-time check-ins)
        const onTimeCheckins = periodAttendance.filter(record => {
          if (!record.checkIn) return false;
          const checkInTime = new Date(record.checkIn);
          const expectedTime = new Date(checkInTime);
          expectedTime.setHours(9, 0, 0, 0); // Assuming 9 AM start time
          return checkInTime <= expectedTime;
        }).length;
        
        const punctualityScore = presentDays > 0 ? (onTimeCheckins / presentDays) * 100 : 100;
        
        // Calculate sales achieved
        const salesAchieved = commissionRecords.reduce((total, record) => total + record.saleAmount, 0);
        
        // Calculate productivity score based on task completion rate
        const productivityScore = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;
        
        // Calculate overall rating (weighted average)
        const overallRating = (
          (attendancePercentage * 0.25) +
          (punctualityScore * 0.25) +
          (productivityScore * 0.3) +
          (Math.min(salesAchieved / 10000, 1) * 20) // Max 20 points for sales
        );

        metrics.push({
          staffId: staffMember.id,
          staffName: staffMember.name,
          role: staffMember.role,
          tasksCompleted: taskStats.completed,
          tasksAssigned: taskStats.total,
          salesAchieved,
          attendancePercentage: Math.round(attendancePercentage),
          punctualityScore: Math.round(punctualityScore),
          productivityScore: Math.round(productivityScore),
          overallRating: Math.round(overallRating),
          period: selectedPeriod
        });
      });
      
      setPerformanceData(metrics);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkingDaysInPeriod = (start: Date, end: Date): number => {
    let count = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number): { label: string; className: string } => {
    if (score >= 90) return { label: 'Excellent', className: 'bg-green-100 text-green-800' };
    if (score >= 75) return { label: 'Good', className: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { label: 'Average', className: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', className: 'bg-red-100 text-red-800' };
  };

  const getRoleKPIs = (role: string): KPITarget[] => {
    const baseKPIs = [
      { type: 'attendance' as const, target: 95, achieved: 0, unit: '%', label: 'Attendance Rate' },
      { type: 'tasks' as const, target: 20, achieved: 0, unit: 'tasks', label: 'Tasks Completed' }
    ];

    const salesRoles = ['sales_executive', 'sales_staff'];
    if (salesRoles.includes(role)) {
      baseKPIs.push({
        type: 'sales' as const,
        target: 50000,
        achieved: 0,
        unit: '₹',
        label: 'Sales Target'
      });
    }

    return baseKPIs;
  };

  const generatePeriodOptions = (): { value: string; label: string }[] => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to access performance tracking.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <BackButton className="mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Tracking</h1>
          <p className="text-gray-600">Monitor staff performance and productivity metrics</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        {canViewAll && (
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map(staffMember => (
                <SelectItem key={staffMember.id} value={staffMember.id}>
                  {staffMember.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            {generatePeriodOptions().map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={loadPerformanceData} disabled={isLoading}>
          <Filter className="h-4 w-4 mr-2" />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="kpis">KPIs & Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceData.map((metrics) => (
              <Card key={metrics.staffId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{metrics.staffName}</CardTitle>
                      <p className="text-sm text-gray-600 capitalize">{metrics.role.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getPerformanceColor(metrics.overallRating)}`}>
                        {metrics.overallRating}
                      </div>
                      <Badge className={getPerformanceBadge(metrics.overallRating).className}>
                        {getPerformanceBadge(metrics.overallRating).label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Attendance</span>
                      <span className={getPerformanceColor(metrics.attendancePercentage)}>
                        {metrics.attendancePercentage}%
                      </span>
                    </div>
                    <Progress value={metrics.attendancePercentage} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Punctuality</span>
                      <span className={getPerformanceColor(metrics.punctualityScore)}>
                        {metrics.punctualityScore}%
                      </span>
                    </div>
                    <Progress value={metrics.punctualityScore} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tasks</span>
                      <span>{metrics.tasksCompleted}/{metrics.tasksAssigned}</span>
                    </div>
                    <Progress 
                      value={metrics.tasksAssigned > 0 ? (metrics.tasksCompleted / metrics.tasksAssigned) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  {metrics.salesAchieved > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                        <span>Sales: ₹{metrics.salesAchieved.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {performanceData.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No performance data available for the selected period.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Detailed Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Staff Member</th>
                      <th className="text-center p-3">Overall Rating</th>
                      <th className="text-center p-3">Attendance</th>
                      <th className="text-center p-3">Punctuality</th>
                      <th className="text-center p-3">Tasks</th>
                      <th className="text-center p-3">Productivity</th>
                      <th className="text-center p-3">Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((metrics) => (
                      <tr key={metrics.staffId} className="border-b">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{metrics.staffName}</div>
                            <div className="text-gray-500 capitalize">{metrics.role.replace('_', ' ')}</div>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <div className={`font-bold ${getPerformanceColor(metrics.overallRating)}`}>
                            {metrics.overallRating}
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <span className={getPerformanceColor(metrics.attendancePercentage)}>
                            {metrics.attendancePercentage}%
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={getPerformanceColor(metrics.punctualityScore)}>
                            {metrics.punctualityScore}%
                          </span>
                        </td>
                        <td className="text-center p-3">
                          {metrics.tasksCompleted}/{metrics.tasksAssigned}
                        </td>
                        <td className="text-center p-3">
                          <span className={getPerformanceColor(metrics.productivityScore)}>
                            {metrics.productivityScore}%
                          </span>
                        </td>
                        <td className="text-center p-3">
                          ₹{metrics.salesAchieved.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          {/* KPI Tracking */}
          {performanceData.map((metrics) => {
            const kpis = getRoleKPIs(metrics.role);
            // Update KPI achieved values based on actual performance
            kpis.forEach(kpi => {
              switch (kpi.type) {
                case 'attendance':
                  kpi.achieved = metrics.attendancePercentage;
                  break;
                case 'tasks':
                  kpi.achieved = metrics.tasksCompleted;
                  break;
                case 'sales':
                  kpi.achieved = metrics.salesAchieved;
                  break;
              }
            });

            return (
              <Card key={metrics.staffId}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    {metrics.staffName} - KPIs & Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kpis.map((kpi, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{kpi.label}</span>
                          <Badge variant="outline">
                            {kpi.unit === '₹' ? `₹${kpi.achieved.toLocaleString()}` : `${kpi.achieved}${kpi.unit === '%' ? '%' : ` ${kpi.unit}`}`}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Target: {kpi.unit === '₹' ? `₹${kpi.target.toLocaleString()}` : `${kpi.target}${kpi.unit === '%' ? '%' : ` ${kpi.unit}`}`}</span>
                            <span>{Math.round((kpi.achieved / kpi.target) * 100)}%</span>
                          </div>
                          <Progress value={Math.min((kpi.achieved / kpi.target) * 100, 100)} className="h-2" />
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {kpi.achieved >= kpi.target ? 
                            '🎯 Target achieved!' : 
                            `${kpi.target - kpi.achieved} ${kpi.unit === '₹' ? '₹' : kpi.unit === '%' ? 'percentage points' : kpi.unit} to go`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
