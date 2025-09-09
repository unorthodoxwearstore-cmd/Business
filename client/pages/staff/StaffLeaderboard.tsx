import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, User, Calendar, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { staffService, StaffMember } from '@/lib/staff-service';
import { taskService } from '@/lib/task-service';
import { authService } from '@/lib/auth-service';

interface LeaderboardEntry {
  staffId: string;
  staffName: string;
  role: string;
  totalScore: number;
  salesScore: number;
  taskScore: number;
  attendanceScore: number;
  productivityScore: number;
  position: number;
  positionChange: number;
  salesAmount: number;
  tasksCompleted: number;
  attendancePercentage: number;
  avatar?: string;
}

export default function StaffLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const user = authService.getCurrentUser();
  const canViewAll = authService.hasPermission('performanceDashboard');

  useEffect(() => {
    loadStaff();
    generateLeaderboard();
  }, [selectedPeriod, selectedMetric]);

  const loadStaff = () => {
    const staffList = staffService.getStaffList();
    setStaff(staffList);
  };

  const generateLeaderboard = () => {
    setIsLoading(true);

    try {
      const entries: LeaderboardEntry[] = [];

      staff.forEach((staffMember, index) => {
        // Get performance data
        const taskStats = taskService.getTaskStats(staffMember.id);
        const attendanceRecords = staffService.getAttendanceRecords(staffMember.id);
        const commissionRecords = staffService.getCommissionRecords(staffMember.id);

        // Calculate metrics based on selected period
        const now = new Date();
        let startDate: Date;
        
        switch (selectedPeriod) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Filter records by period
        const periodAttendance = attendanceRecords.filter(record => 
          new Date(record.date) >= startDate
        );
        const periodCommissions = commissionRecords.filter(record => 
          new Date(record.saleDate) >= startDate
        );

        // Calculate scores (0-100 each)
        const salesAmount = periodCommissions.reduce((sum, record) => sum + record.saleAmount, 0);
        const salesScore = Math.min((salesAmount / 100000) * 100, 100); // Max at 1L sales

        const taskCompletionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;
        const taskScore = taskCompletionRate;

        const workingDays = getWorkingDaysInPeriod(startDate, now);
        const presentDays = periodAttendance.filter(r => r.status === 'present').length;
        const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
        const attendanceScore = attendancePercentage;

        // Productivity based on tasks completed per day
        const avgTasksPerDay = taskStats.completed / Math.max(1, getWorkingDaysInPeriod(startDate, now));
        const productivityScore = Math.min(avgTasksPerDay * 20, 100); // Max at 5 tasks per day

        // Overall score (weighted average)
        const totalScore = (
          salesScore * 0.3 +
          taskScore * 0.25 +
          attendanceScore * 0.25 +
          productivityScore * 0.2
        );

        entries.push({
          staffId: staffMember.id,
          staffName: staffMember.name,
          role: staffMember.role,
          totalScore: Math.round(totalScore),
          salesScore: Math.round(salesScore),
          taskScore: Math.round(taskScore),
          attendanceScore: Math.round(attendanceScore),
          productivityScore: Math.round(productivityScore),
          position: 0, // Will be calculated after sorting
          positionChange: 0, // Would need historical data
          salesAmount,
          tasksCompleted: taskStats.completed,
          attendancePercentage: Math.round(attendancePercentage)
        });
      });

      // Sort by selected metric
      let sortedEntries: LeaderboardEntry[];
      switch (selectedMetric) {
        case 'sales':
          sortedEntries = entries.sort((a, b) => b.salesScore - a.salesScore);
          break;
        case 'tasks':
          sortedEntries = entries.sort((a, b) => b.taskScore - a.taskScore);
          break;
        case 'attendance':
          sortedEntries = entries.sort((a, b) => b.attendanceScore - a.attendanceScore);
          break;
        case 'productivity':
          sortedEntries = entries.sort((a, b) => b.productivityScore - a.productivityScore);
          break;
        default:
          sortedEntries = entries.sort((a, b) => b.totalScore - a.totalScore);
      }

      // Assign positions
      sortedEntries.forEach((entry, index) => {
        entry.position = index + 1;
      });

      setLeaderboard(sortedEntries);
    } catch (error) {
      console.error('Error generating leaderboard:', error);
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

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{position}</div>;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): { label: string; className: string } => {
    if (score >= 90) return { label: 'Excellent', className: 'bg-green-100 text-green-800' };
    if (score >= 75) return { label: 'Good', className: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { label: 'Average', className: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', className: 'bg-red-100 text-red-800' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!user || !canViewAll) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>You don't have permission to view the staff leaderboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Leaderboard</h1>
          <p className="text-gray-600">Performance rankings and achievements</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ranking By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall Performance</SelectItem>
            <SelectItem value="sales">Sales Performance</SelectItem>
            <SelectItem value="tasks">Task Completion</SelectItem>
            <SelectItem value="attendance">Attendance</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 Performers */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {leaderboard.slice(0, 3).map((entry, index) => (
            <Card key={entry.staffId} className={`${index === 0 ? 'ring-2 ring-yellow-400' : ''} hover:shadow-lg transition-shadow`}>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getRankIcon(entry.position)}
                </div>
                <CardTitle className="text-lg">{entry.staffName}</CardTitle>
                <Badge variant="outline" className="capitalize">
                  {entry.role.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <div>
                  <div className={`text-3xl font-bold ${getScoreColor(entry.totalScore)}`}>
                    {entry.totalScore}
                  </div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
                
                <Badge className={getScoreBadge(entry.totalScore).className}>
                  {getScoreBadge(entry.totalScore).label}
                </Badge>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-semibold">{formatCurrency(entry.salesAmount)}</div>
                    <div className="text-gray-500">Sales</div>
                  </div>
                  <div>
                    <div className="font-semibold">{entry.tasksCompleted}</div>
                    <div className="text-gray-500">Tasks</div>
                  </div>
                  <div>
                    <div className="font-semibold">{entry.attendancePercentage}%</div>
                    <div className="text-gray-500">Attendance</div>
                  </div>
                  <div>
                    <div className="font-semibold">{entry.productivityScore}</div>
                    <div className="text-gray-500">Productivity</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Complete Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <div key={entry.staffId} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(entry.position)}
                  </div>
                  
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-900">{entry.staffName}</div>
                    <div className="text-sm text-gray-500 capitalize">{entry.role.replace('_', ' ')}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(entry.totalScore)}`}>
                      {entry.totalScore}
                    </div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatCurrency(entry.salesAmount)}</div>
                    <div className="text-xs text-gray-500">Sales</div>
                    <div className="w-16 mt-1">
                      <Progress value={entry.salesScore} className="h-1" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold">{entry.tasksCompleted}</div>
                    <div className="text-xs text-gray-500">Tasks</div>
                    <div className="w-16 mt-1">
                      <Progress value={entry.taskScore} className="h-1" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold">{entry.attendancePercentage}%</div>
                    <div className="text-xs text-gray-500">Attendance</div>
                    <div className="w-16 mt-1">
                      <Progress value={entry.attendanceScore} className="h-1" />
                    </div>
                  </div>

                  <div className="text-center">
                    <Badge className={getScoreBadge(entry.totalScore).className}>
                      {getScoreBadge(entry.totalScore).label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
              <p className="text-gray-500">Staff performance will appear here once data is available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
