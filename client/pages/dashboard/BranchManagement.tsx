import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Phone,
  Mail,
  User,
  Globe,
  Star,
  StarOff,
  Power,
  PowerOff,
  Calendar,
  DollarSign,
  Users,
  Package,
  TrendingUp
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { branchService, Branch } from '@/lib/branch-service';
import { useBranchContext } from '@/lib/use-branch-context';
import BackButton from '@/components/BackButton';

export default function BranchManagement() {
  const permissions = usePermissions();
  const { canEditBranches, refreshBranches, toggleFavoriteBranch } = useBranchContext();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = () => {
    const allBranches = branchService.getAllBranches();
    setBranches(allBranches);
  };

  if (!canEditBranches) {
    return (
      <div className="p-6">
        <BackButton />
        <Card className="mt-4">
          <CardContent className="p-6 text-center">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to manage branches.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (branch.managerName && branch.managerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleFavorite = (branchId: string) => {
    toggleFavoriteBranch(branchId);
    loadBranches();
  };

  const handleToggleStatus = (branchId: string) => {
    const branch = branchService.getBranchById(branchId);
    if (branch) {
      const newStatus = branch.status === 'active' ? 'inactive' : 'active';
      branchService.updateBranch(branchId, { status: newStatus });
      loadBranches();
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    if (confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      branchService.deleteBranch(branchId);
      loadBranches();
    }
  };

  const getStatusBadge = (status: 'active' | 'inactive') => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
    ) : (
      <Badge variant="destructive" className="text-xs">Inactive</Badge>
    );
  };

  const stats = {
    total: branches.length,
    active: branches.filter(b => b.status === 'active').length,
    inactive: branches.filter(b => b.status === 'inactive').length,
    favorites: branches.filter(b => b.isFavorite).length,
    totalRevenue: branches.reduce((sum, b) => sum + b.totalRevenue, 0),
    totalStaff: branches.reduce((sum, b) => sum + b.totalStaff, 0)
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your business branches and locations
          </p>
        </div>
        
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Power className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <PowerOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Non-operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.favorites}</div>
            <p className="text-xs text-muted-foreground">
              Pinned branches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              Across all branches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All-time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branch Directory</CardTitle>
          <CardDescription>Manage branch profiles and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search branches by name, code, location, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBranches.map((branch) => (
              <Card key={branch.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {branch.code}
                          </Badge>
                          {getStatusBadge(branch.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleToggleFavorite(branch.id)}
                        className={`p-1 rounded hover:bg-gray-100 ${
                          branch.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                      >
                        {branch.isFavorite ? (
                          <Star className="w-4 h-4 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Address */}
                  {branch.address && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{branch.address}</span>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{branch.contact.phone}</span>
                    </div>
                    {branch.contact.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{branch.contact.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Manager */}
                  {branch.managerName && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Manager: {branch.managerName}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{branch.totalStaff}</div>
                      <div className="text-xs text-gray-500">Staff</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{branch.totalSales}</div>
                      <div className="text-xs text-gray-500">Sales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        ₹{(branch.totalRevenue / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBranch(branch)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBranch(branch);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(branch.id)}
                      className={branch.status === 'active' ? 'text-red-600' : 'text-green-600'}
                    >
                      {branch.status === 'active' ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredBranches.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'Start by adding your first branch location.'
                }
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Branch
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
