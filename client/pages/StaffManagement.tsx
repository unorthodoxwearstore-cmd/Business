import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, UserX, UserCheck, Phone, Mail, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { staffService, StaffMember } from '@/lib/staff-service';
import { authService } from '@/lib/auth-service';
import { UserRole } from '@/shared/types';

interface AddStaffFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId?: string;
  branchName?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState<AddStaffFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    branchId: '',
    branchName: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });

  const user = authService.getCurrentUser();
  const businessData = authService.getBusinessData();

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    const staffList = staffService.getStaffList();
    setStaff(staffList);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const emergencyContact = formData.emergencyContactName && formData.emergencyContactPhone ? {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relation: formData.emergencyContactRelation || 'Unknown'
      } : undefined;

      const staffData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        branchId: formData.branchId || undefined,
        branchName: formData.branchName || undefined,
        address: formData.address || undefined,
        emergencyContact,
        joinDate: new Date().toISOString().split('T')[0],
        permissions: authService.getPermissionsForRole ? authService.getPermissionsForRole(formData.role) : []
      };

      const result = await staffService.addStaff(staffData);
      
      if (result.success) {
        loadStaff();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to add staff member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsLoading(true);
    setError('');

    try {
      const emergencyContact = formData.emergencyContactName && formData.emergencyContactPhone ? {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relation: formData.emergencyContactRelation || 'Unknown'
      } : undefined;

      const updates = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        branchId: formData.branchId || undefined,
        branchName: formData.branchName || undefined,
        address: formData.address || undefined,
        emergencyContact
      };

      const result = await staffService.updateStaff(editingStaff.id, updates);
      
      if (result.success) {
        loadStaff();
        setEditingStaff(null);
        resetForm();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to update staff member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendStaff = async (staffId: string) => {
    const result = await staffService.suspendStaff(staffId);
    if (result.success) {
      loadStaff();
    }
  };

  const handleReactivateStaff = async (staffId: string) => {
    const result = await staffService.reactivateStaff(staffId);
    if (result.success) {
      loadStaff();
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) {
      const result = await staffService.removeStaff(staffId);
      if (result.success) {
        loadStaff();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      branchId: '',
      branchName: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: ''
    });
    setError('');
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      branchId: staffMember.branchId || '',
      branchName: staffMember.branchName || '',
      address: staffMember.address || '',
      emergencyContactName: staffMember.emergencyContact?.name || '',
      emergencyContactPhone: staffMember.emergencyContact?.phone || '',
      emergencyContactRelation: staffMember.emergencyContact?.relation || ''
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      owner: 'bg-purple-100 text-purple-800',
      co_founder: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      staff: 'bg-gray-100 text-gray-800',
      accountant: 'bg-green-100 text-green-800',
      sales_executive: 'bg-orange-100 text-orange-800',
      sales_staff: 'bg-orange-100 text-orange-800',
      inventory_manager: 'bg-teal-100 text-teal-800',
      delivery_staff: 'bg-indigo-100 text-indigo-800',
      hr: 'bg-pink-100 text-pink-800',
      production: 'bg-yellow-100 text-yellow-800',
      store_staff: 'bg-cyan-100 text-cyan-800'
    };
    return variants[role] || variants.staff;
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      owner: 'Owner',
      co_founder: 'Co-Founder',
      manager: 'Manager',
      staff: 'Staff',
      accountant: 'Accountant',
      sales_executive: 'Sales Executive',
      sales_staff: 'Sales Staff',
      inventory_manager: 'Inventory Manager',
      delivery_staff: 'Delivery Staff',
      hr: 'HR Staff',
      production: 'Production Staff',
      store_staff: 'Store Staff'
    };
    return labels[role] || 'Staff';
  };

  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staffMember.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staffMember.phone.includes(searchQuery);
    
    const matchesRole = roleFilter === 'all' || staffMember.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || staffMember.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const availableRoles = user?.businessType ? staffService.getAvailableRolesForBusiness(user.businessType) : [];

  if (!user || !authService.hasPermission('manage_team')) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            You don't have permission to access staff management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your team members, roles, and permissions</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4">
              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branchId">Branch ID</Label>
                  <Input
                    id="branchId"
                    type="text"
                    value={formData.branchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Optional"
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Emergency Contact (Optional)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Name</Label>
                    <Input
                      id="emergencyContactName"
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelation">Relation</Label>
                    <Input
                      id="emergencyContactRelation"
                      type="text"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Staff'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {availableRoles.map(role => (
              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staffMember) => (
          <Card key={staffMember.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {staffMember.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                    <Badge className={getRoleBadge(staffMember.role)}>
                      {getRoleLabel(staffMember.role)}
                    </Badge>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openEditDialog(staffMember)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {staffMember.status === 'active' ? (
                      <DropdownMenuItem onClick={() => handleSuspendStaff(staffMember.id)}>
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReactivateStaff(staffMember.id)}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleRemoveStaff(staffMember.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={getStatusBadge(staffMember.status)}>
                  {staffMember.status.charAt(0).toUpperCase() + staffMember.status.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {staffMember.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {staffMember.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Joined {new Date(staffMember.joinDate).toLocaleDateString()}
                </div>
                {staffMember.branchName && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {staffMember.branchName}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No staff members found.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role *</Label>
                <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-branchId">Branch ID</Label>
                <Input
                  id="edit-branchId"
                  type="text"
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="edit-branchName">Branch Name</Label>
                <Input
                  id="edit-branchName"
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Optional"
                rows={2}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-emergencyContactName">Name</Label>
                  <Input
                    id="edit-emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-emergencyContactPhone">Phone</Label>
                  <Input
                    id="edit-emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-emergencyContactRelation">Relation</Label>
                  <Input
                    id="edit-emergencyContactRelation"
                    type="text"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingStaff(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Staff'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
