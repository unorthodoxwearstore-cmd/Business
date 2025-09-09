import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  Eye,
  UserCheck,
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  Phone,
  Mail,
  Crown,
  User,
  Shield
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { dataManager, StaffMember, Task } from '@/lib/data-manager';
import { usePermissions } from '@/lib/permissions';
import { UserRole } from '@shared/types';
import { authService } from '@/lib/auth-service';

const StaffManagementSystem: React.FC = () => {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    role: 'staff' as UserRole,
    phone: '',
    email: '',
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchQuery, roleFilter, statusFilter]);

  const loadData = () => {
    try {
      const allStaff = dataManager.getAllStaff();
      const allTasks = dataManager.getAllTasks();
      setStaff(allStaff);
      setTasks(allTasks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(member => member.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(member => !member.isActive);
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = () => {
    try {
      // Create staff member through auth service for proper integration
      const newStaff = dataManager.addStaffMember(formData);
      setStaff(prev => [...prev, newStaff]);
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Staff member added successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive"
      });
    }
  };

  const handleEditStaff = () => {
    if (!editingStaff) return;

    try {
      // Update staff member data
      const updatedStaff = {
        ...editingStaff,
        ...formData
      };
      
      setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
      
      // Save to data manager
      const allStaff = staff.map(s => s.id === updatedStaff.id ? updatedStaff : s);
      localStorage.setItem('hisaabb_staff', JSON.stringify(allStaff));
      
      setShowEditDialog(false);
      setEditingStaff(null);
      resetForm();
      toast({
        title: "Success",
        description: "Staff member updated successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateStaff = (staffId: string) => {
    try {
      setStaff(prev => prev.map(s => 
        s.id === staffId ? { ...s, isActive: false } : s
      ));
      
      // Save to data manager
      const allStaff = staff.map(s => s.id === staffId ? { ...s, isActive: false } : s);
      localStorage.setItem('hisaabb_staff', JSON.stringify(allStaff));
      
      toast({
        title: "Success",
        description: "Staff member deactivated successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate staff member",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'staff',
      phone: '',
      email: '',
      joinDate: new Date().toISOString().split('T')[0],
      isActive: true
    });
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      role: staffMember.role,
      phone: staffMember.phone,
      email: staffMember.email || '',
      joinDate: staffMember.joinDate,
      isActive: staffMember.isActive
    });
    setShowEditDialog(true);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
      case 'co_founder':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'accountant':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'sales_executive':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleColors = {
      owner: 'bg-yellow-100 text-yellow-800',
      co_founder: 'bg-yellow-100 text-yellow-800',
      manager: 'bg-blue-100 text-blue-800',
      accountant: 'bg-green-100 text-green-800',
      sales_executive: 'bg-purple-100 text-purple-800',
      staff: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getStaffTasks = (staffId: string) => {
    return tasks.filter(task => task.assignedTo === staffId);
  };

  // Calculate stats
  const activeStaff = staff.filter(s => s.isActive).length;
  const totalCommissions = staff.reduce((sum, s) => sum + (s.commissionEarned || 0), 0);
  const totalSales = staff.reduce((sum, s) => sum + (s.totalSales || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const roleOptions: UserRole[] = ['staff', 'sales_executive', 'accountant', 'manager'];

  if (!permissions.hasPermission('manage_team')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="text-center p-8">
            <CardContent>
              <Users className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to manage staff members.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">Manage your team members and their performance</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Enter staff member details to add them to your team
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date *</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddStaff}
                  disabled={!formData.name || !formData.phone || !formData.role}
                >
                  Add Staff Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Active Staff</p>
                  <p className="text-2xl font-bold text-blue-900">{activeStaff}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Commissions</p>
                  <p className="text-2xl font-bold text-green-900">₹{totalCommissions.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Team Sales</p>
                  <p className="text-2xl font-bold text-purple-900">₹{totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-lg border-0 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Completed Tasks</p>
                  <p className="text-2xl font-bold text-orange-900">{completedTasks}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search staff by name, phone, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roleOptions.map(role => (
                      <SelectItem key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        {filteredStaff.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? "No staff members match your current filters."
                : "Start building your team by adding your first staff member."
              }
            </p>
            {(!searchQuery && roleFilter === 'all' && statusFilter === 'all') && (
              <Button onClick={() => setShowAddDialog(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Staff Member
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((staffMember) => {
              const memberTasks = getStaffTasks(staffMember.id);
              const completedTasksCount = memberTasks.filter(t => t.status === 'completed').length;
              const pendingTasksCount = memberTasks.filter(t => ['pending', 'in-progress'].includes(t.status)).length;

              return (
                <Card key={staffMember.id} className="card-hover shadow-md border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(staffMember.role)}
                          <div>
                            <h3 className="font-semibold text-gray-900">{staffMember.name}</h3>
                            <p className="text-sm text-gray-500">{staffMember.phone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(staffMember);
                            setShowViewDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(staffMember)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate Staff Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate {staffMember.name}? They will no longer have access to the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeactivateStaff(staffMember.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Role:</span>
                        {getRoleBadge(staffMember.role)}
                      </div>
                      
                      {staffMember.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{staffMember.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(staffMember.joinDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Sales:</span>
                        <span className="font-semibold text-green-600">₹{(staffMember.totalSales || 0).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-semibold text-green-600">₹{(staffMember.commissionEarned || 0).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tasks:</span>
                        <div className="flex gap-2">
                          <span className="text-green-600">{completedTasksCount} done</span>
                          <span className="text-yellow-600">{pendingTasksCount} pending</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge variant={staffMember.isActive ? "default" : "secondary"}>
                          {staffMember.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Staff Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member details
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-joinDate">Join Date *</Label>
                <Input
                  id="edit-joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditStaff}
                disabled={!formData.name || !formData.phone || !formData.role}
              >
                Update Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Staff Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Staff Member Details</DialogTitle>
              <DialogDescription>
                {selectedStaff && `${selectedStaff.name} - ${selectedStaff.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
              </DialogDescription>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-3">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedStaff.name}</p>
                      <p><strong>Phone:</strong> {selectedStaff.phone}</p>
                      {selectedStaff.email && <p><strong>Email:</strong> {selectedStaff.email}</p>}
                      <p><strong>Join Date:</strong> {new Date(selectedStaff.joinDate).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2">
                        <strong>Role:</strong> {getRoleBadge(selectedStaff.role)}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>Status:</strong> 
                        <Badge variant={selectedStaff.isActive ? "default" : "secondary"}>
                          {selectedStaff.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Performance Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total Sales:</strong> ₹{(selectedStaff.totalSales || 0).toFixed(2)}</p>
                      <p><strong>Commission Earned:</strong> ₹{(selectedStaff.commissionEarned || 0).toFixed(2)}</p>
                      <p><strong>Tasks Completed:</strong> {selectedStaff.tasksCompleted || 0}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recent Tasks</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getStaffTasks(selectedStaff.id).slice(0, 5).map((task) => (
                      <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-gray-600">{task.description}</p>
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                    {getStaffTasks(selectedStaff.id).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No tasks assigned</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffManagementSystem;
