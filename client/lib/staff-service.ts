import { UserRole, BusinessType, StaffMember, AttendanceRecord, LeaveRequest, StaffPerformance, TaskAssignment, SalesCommission, StaffSchedule, BranchAccess } from '@/shared/types';
import { notificationService } from '@/lib/notification-service';
import { authService } from '@/lib/auth-service';

class StaffService {
  private readonly STAFF_KEY = 'hisaabb_staff_data';
  private readonly ATTENDANCE_KEY = 'hisaabb_attendance_data';
  private readonly LEAVE_KEY = 'hisaabb_leave_data';
  private readonly PERFORMANCE_KEY = 'hisaabb_performance_data';
  private readonly TASKS_KEY = 'hisaabb_tasks_data';
  private readonly COMMISSION_KEY = 'hisaabb_commission_data';
  private readonly SCHEDULE_KEY = 'hisaabb_schedule_data';
  private readonly BRANCH_ACCESS_KEY = 'hisaabb_branch_access_data';

  // In-memory databases (production would use real database)
  private staffDatabase = new Map<string, StaffMember>();
  private attendanceDatabase = new Map<string, AttendanceRecord>();
  private leaveDatabase = new Map<string, LeaveRequest>();
  private performanceDatabase = new Map<string, StaffPerformance>();
  private tasksDatabase = new Map<string, TaskAssignment>();
  private commissionDatabase = new Map<string, SalesCommission>();
  private scheduleDatabase = new Map<string, StaffSchedule>();
  private branchAccessDatabase = new Map<string, BranchAccess>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const staffData = localStorage.getItem(this.STAFF_KEY);
      if (staffData) {
        const staff = JSON.parse(staffData);
        staff.forEach((member: StaffMember) => {
          this.staffDatabase.set(member.id, member);
        });
      }

      const attendanceData = localStorage.getItem(this.ATTENDANCE_KEY);
      if (attendanceData) {
        const attendance = JSON.parse(attendanceData);
        attendance.forEach((record: AttendanceRecord) => {
          this.attendanceDatabase.set(record.id, record);
        });
      }

      const leaveData = localStorage.getItem(this.LEAVE_KEY);
      if (leaveData) {
        const leaves = JSON.parse(leaveData);
        leaves.forEach((leave: LeaveRequest) => {
          this.leaveDatabase.set(leave.id, leave);
        });
      }

      const performanceData = localStorage.getItem(this.PERFORMANCE_KEY);
      if (performanceData) {
        const performance = JSON.parse(performanceData);
        performance.forEach((perf: StaffPerformance) => {
          this.performanceDatabase.set(perf.id, perf);
        });
      }

      const tasksData = localStorage.getItem(this.TASKS_KEY);
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        tasks.forEach((task: TaskAssignment) => {
          this.tasksDatabase.set(task.id, task);
        });
      }

      const commissionData = localStorage.getItem(this.COMMISSION_KEY);
      if (commissionData) {
        const commissions = JSON.parse(commissionData);
        commissions.forEach((commission: SalesCommission) => {
          this.commissionDatabase.set(commission.id, commission);
        });
      }

      const scheduleData = localStorage.getItem(this.SCHEDULE_KEY);
      if (scheduleData) {
        const schedules = JSON.parse(scheduleData);
        schedules.forEach((schedule: StaffSchedule) => {
          this.scheduleDatabase.set(schedule.id, schedule);
        });
      }

      const branchAccessData = localStorage.getItem(this.BRANCH_ACCESS_KEY);
      if (branchAccessData) {
        const branchAccess = JSON.parse(branchAccessData);
        branchAccess.forEach((access: BranchAccess) => {
          this.branchAccessDatabase.set(`${access.staffId}_${access.branchId}`, access);
        });
      }
    } catch (error) {
      console.error('Error loading staff data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STAFF_KEY, JSON.stringify(Array.from(this.staffDatabase.values())));
      localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(Array.from(this.attendanceDatabase.values())));
      localStorage.setItem(this.LEAVE_KEY, JSON.stringify(Array.from(this.leaveDatabase.values())));
      localStorage.setItem(this.PERFORMANCE_KEY, JSON.stringify(Array.from(this.performanceDatabase.values())));
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(Array.from(this.tasksDatabase.values())));
      localStorage.setItem(this.COMMISSION_KEY, JSON.stringify(Array.from(this.commissionDatabase.values())));
      localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(Array.from(this.scheduleDatabase.values())));
      localStorage.setItem(this.BRANCH_ACCESS_KEY, JSON.stringify(Array.from(this.branchAccessDatabase.values())));
    } catch (error) {
      console.error('Error saving staff data to storage:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Staff Management Methods
  async addStaff(staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; staff?: StaffMember; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied' };
      }

      // Validation
      if (!staffData.name.trim()) {
        return { success: false, message: 'Staff name is required' };
      }

      if (!this.validateEmail(staffData.email)) {
        return { success: false, message: 'Invalid email format' };
      }

      if (!this.validatePhone(staffData.phone)) {
        return { success: false, message: 'Invalid phone number format' };
      }

      // Check for duplicates within the same business
      for (const staff of this.staffDatabase.values()) {
        if (staff.businessId === user.businessId) {
          if (staff.email.toLowerCase() === staffData.email.toLowerCase()) {
            return { success: false, message: 'A staff member with this email already exists' };
          }
          if (staff.phone === staffData.phone) {
            return { success: false, message: 'A staff member with this phone number already exists' };
          }
        }
      }

      const staffId = this.generateId();
      const now = new Date().toISOString();

      const newStaff: StaffMember = {
        ...staffData,
        id: staffId,
        businessId: user.businessId,
        createdAt: now,
        updatedAt: now,
        status: 'active'
      };

      this.staffDatabase.set(staffId, newStaff);
      this.saveToStorage();

      notificationService.success('Staff Added', `${staffData.name} has been added to your team`);
      return { success: true, staff: newStaff, message: 'Staff member added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add staff member' };
    }
  }

  async updateStaff(staffId: string, updates: Partial<StaffMember>): Promise<{ success: boolean; staff?: StaffMember; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied' };
      }

      const staff = this.staffDatabase.get(staffId);
      if (!staff || staff.businessId !== user.businessId) {
        return { success: false, message: 'Staff member not found' };
      }

      const updatedStaff: StaffMember = {
        ...staff,
        ...updates,
        id: staffId,
        businessId: staff.businessId,
        createdAt: staff.createdAt,
        updatedAt: new Date().toISOString()
      };

      this.staffDatabase.set(staffId, updatedStaff);
      this.saveToStorage();

      notificationService.success('Staff Updated', `${updatedStaff.name}'s profile has been updated`);
      return { success: true, staff: updatedStaff, message: 'Staff member updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update staff member' };
    }
  }

  async removeStaff(staffId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied' };
      }

      const staff = this.staffDatabase.get(staffId);
      if (!staff || staff.businessId !== user.businessId) {
        return { success: false, message: 'Staff member not found' };
      }

      this.staffDatabase.delete(staffId);
      this.saveToStorage();

      notificationService.info('Staff Removed', `${staff.name} has been removed from your team`);
      return { success: true, message: 'Staff member removed successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to remove staff member' };
    }
  }

  async suspendStaff(staffId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied' };
      }

      return await this.updateStaff(staffId, { status: 'suspended' });
    } catch (error) {
      return { success: false, message: 'Failed to suspend staff member' };
    }
  }

  async reactivateStaff(staffId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied' };
      }

      return await this.updateStaff(staffId, { status: 'active' });
    } catch (error) {
      return { success: false, message: 'Failed to reactivate staff member' };
    }
  }

  getStaffList(branchId?: string): StaffMember[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    let staff = Array.from(this.staffDatabase.values())
      .filter(member => member.businessId === user.businessId);

    if (branchId) {
      staff = staff.filter(member => member.branchId === branchId);
    }

    // Sort by name
    return staff.sort((a, b) => a.name.localeCompare(b.name));
  }

  getStaffById(staffId: string): StaffMember | null {
    const user = authService.getCurrentUser();
    if (!user) return null;

    const staff = this.staffDatabase.get(staffId);
    return (staff && staff.businessId === user.businessId) ? staff : null;
  }

  // Attendance Management
  async checkIn(location?: { lat: number; lng: number; address: string }): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // Check if already checked in today
      const existingRecord = Array.from(this.attendanceDatabase.values())
        .find(record => record.staffId === user.id && record.date === today);

      if (existingRecord && existingRecord.checkIn) {
        return { success: false, message: 'Already checked in today' };
      }

      const recordId = this.generateId();
      const attendanceRecord: AttendanceRecord = {
        id: recordId,
        staffId: user.id,
        date: today,
        checkIn: now,
        workingHours: 0,
        status: 'present',
        location
      };

      this.attendanceDatabase.set(recordId, attendanceRecord);
      this.saveToStorage();

      notificationService.success('Checked In', 'You have successfully checked in for today');
      return { success: true, message: 'Checked in successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to check in' };
    }
  }

  async checkOut(): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // Find today's attendance record
      const existingRecord = Array.from(this.attendanceDatabase.values())
        .find(record => record.staffId === user.id && record.date === today);

      if (!existingRecord || !existingRecord.checkIn) {
        return { success: false, message: 'No check-in found for today' };
      }

      if (existingRecord.checkOut) {
        return { success: false, message: 'Already checked out today' };
      }

      // Calculate working hours
      const checkInTime = new Date(existingRecord.checkIn);
      const checkOutTime = new Date(now);
      const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        checkOut: now,
        workingHours: Math.round(workingHours * 100) / 100
      };

      this.attendanceDatabase.set(existingRecord.id, updatedRecord);
      this.saveToStorage();

      notificationService.success('Checked Out', `You worked ${workingHours.toFixed(1)} hours today`);
      return { success: true, message: 'Checked out successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to check out' };
    }
  }

  getAttendanceRecords(staffId?: string, startDate?: string, endDate?: string): AttendanceRecord[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    let records = Array.from(this.attendanceDatabase.values());

    // Filter by staff ID if provided (managers can view all, staff can only view their own)
    if (staffId) {
      if (!authService.hasPermission('hrAndStaffAttendance') && staffId !== user.id) {
        return [];
      }
      records = records.filter(record => record.staffId === staffId);
    } else {
      // If no staff ID provided, show user's own records
      records = records.filter(record => record.staffId === user.id);
    }

    // Filter by date range
    if (startDate) {
      records = records.filter(record => record.date >= startDate);
    }
    if (endDate) {
      records = records.filter(record => record.date <= endDate);
    }

    return records.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Leave Management
  async submitLeaveRequest(leaveData: Omit<LeaveRequest, 'id' | 'staffId' | 'staffName' | 'status' | 'createdAt'>): Promise<{ success: boolean; leave?: LeaveRequest; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const leaveId = this.generateId();
      const now = new Date().toISOString();

      const leaveRequest: LeaveRequest = {
        ...leaveData,
        id: leaveId,
        staffId: user.id,
        staffName: user.name,
        status: 'pending',
        createdAt: now
      };

      this.leaveDatabase.set(leaveId, leaveRequest);
      this.saveToStorage();

      notificationService.success('Leave Request Submitted', 'Your leave request has been submitted for approval');
      return { success: true, leave: leaveRequest, message: 'Leave request submitted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to submit leave request' };
    }
  }

  async approveLeaveRequest(leaveId: string, approverId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('hrAndStaffAttendance')) {
        return { success: false, message: 'Permission denied' };
      }

      const leave = this.leaveDatabase.get(leaveId);
      if (!leave) {
        return { success: false, message: 'Leave request not found' };
      }

      const updatedLeave: LeaveRequest = {
        ...leave,
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date().toISOString()
      };

      this.leaveDatabase.set(leaveId, updatedLeave);
      this.saveToStorage();

      notificationService.success('Leave Approved', `Leave request for ${leave.staffName} has been approved`);
      return { success: true, message: 'Leave request approved successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to approve leave request' };
    }
  }

  async rejectLeaveRequest(leaveId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || !authService.hasPermission('hrAndStaffAttendance')) {
        return { success: false, message: 'Permission denied' };
      }

      const leave = this.leaveDatabase.get(leaveId);
      if (!leave) {
        return { success: false, message: 'Leave request not found' };
      }

      const updatedLeave: LeaveRequest = {
        ...leave,
        status: 'rejected',
        rejectionReason: reason
      };

      this.leaveDatabase.set(leaveId, updatedLeave);
      this.saveToStorage();

      notificationService.info('Leave Rejected', `Leave request for ${leave.staffName} has been rejected`);
      return { success: true, message: 'Leave request rejected' };
    } catch (error) {
      return { success: false, message: 'Failed to reject leave request' };
    }
  }

  getLeaveRequests(staffId?: string): LeaveRequest[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    let requests = Array.from(this.leaveDatabase.values());

    if (staffId) {
      if (!authService.hasPermission('hrAndStaffAttendance') && staffId !== user.id) {
        return [];
      }
      requests = requests.filter(request => request.staffId === staffId);
    } else {
      // If no staff ID provided and user is not manager, show only their own requests
      if (!authService.hasPermission('hrAndStaffAttendance')) {
        requests = requests.filter(request => request.staffId === user.id);
      }
    }

    return requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Commission Management
  async addSalesCommission(commissionData: Omit<SalesCommission, 'id' | 'createdAt'>): Promise<{ success: boolean; commission?: SalesCommission; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || (!authService.hasPermission('manage_team') && !authService.hasPermission('financialReports'))) {
        return { success: false, message: 'Permission denied' };
      }

      const commissionId = this.generateId();
      const now = new Date().toISOString();

      const commission: SalesCommission = {
        ...commissionData,
        id: commissionId,
        createdAt: now
      };

      this.commissionDatabase.set(commissionId, commission);
      this.saveToStorage();

      notificationService.success('Commission Added', `Commission for ${commissionData.staffName} has been recorded`);
      return { success: true, commission, message: 'Commission added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add commission' };
    }
  }

  async markCommissionPaid(commissionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || (!authService.hasPermission('manage_team') && !authService.hasPermission('financialReports'))) {
        return { success: false, message: 'Permission denied' };
      }

      const commission = this.commissionDatabase.get(commissionId);
      if (!commission) {
        return { success: false, message: 'Commission record not found' };
      }

      const updatedCommission: SalesCommission = {
        ...commission,
        status: 'paid',
        paidDate: new Date().toISOString(),
        paidBy: user.id
      };

      this.commissionDatabase.set(commissionId, updatedCommission);
      this.saveToStorage();

      notificationService.success('Commission Paid', `Commission payment for ${commission.staffName} has been marked as paid`);
      return { success: true, message: 'Commission marked as paid' };
    } catch (error) {
      return { success: false, message: 'Failed to update commission status' };
    }
  }

  getCommissionRecords(staffId?: string, period?: string): SalesCommission[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    let records = Array.from(this.commissionDatabase.values());

    if (staffId) {
      if (!authService.hasPermission('financialReports') && staffId !== user.id) {
        return [];
      }
      records = records.filter(record => record.staffId === staffId);
    } else {
      // If no staff ID provided and user is sales staff, show only their own records
      if (user.role === 'sales_staff' || user.role === 'sales_executive') {
        records = records.filter(record => record.staffId === user.id);
      }
    }

    if (period) {
      records = records.filter(record => record.period === period);
    }

    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Role-based features availability
  getAvailableRolesForBusiness(businessType: BusinessType): { value: UserRole; label: string }[] {
    const baseRoles = [
      { value: 'manager' as UserRole, label: 'Manager' },
      { value: 'staff' as UserRole, label: 'General Staff' },
      { value: 'accountant' as UserRole, label: 'Accountant' },
      { value: 'sales_executive' as UserRole, label: 'Sales Executive' },
      { value: 'inventory_manager' as UserRole, label: 'Inventory Manager' },
      { value: 'delivery_staff' as UserRole, label: 'Delivery Staff' },
      { value: 'hr' as UserRole, label: 'HR Staff' },
      { value: 'store_staff' as UserRole, label: 'Store Staff' },
      { value: 'sales_staff' as UserRole, label: 'Sales Staff' }
    ];

    // Add production staff for manufacturers
    if (businessType === 'manufacturer') {
      baseRoles.push({ value: 'production' as UserRole, label: 'Production Staff' });
    }

    return baseRoles;
  }

  isCommissionAvailableForBusiness(businessType: BusinessType): boolean {
    return ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader'].includes(businessType);
  }
}

export const staffService = new StaffService();
export type { StaffMember, AttendanceRecord, LeaveRequest, StaffPerformance, TaskAssignment, SalesCommission };
