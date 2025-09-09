import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Save, 
  X, 
  MapPin,
  Phone,
  Mail,
  User,
  Globe,
  CreditCard,
  Clock,
  Star
} from 'lucide-react';
import { branchService, Branch } from '@/lib/branch-service';

interface BranchProfileFormProps {
  branch?: Branch | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (branch: Branch) => void;
  mode: 'create' | 'edit';
}

export default function BranchProfileForm({
  branch,
  isOpen,
  onClose,
  onSave,
  mode
}: BranchProfileFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    managerId: '',
    managerName: '',
    timezone: '',
    gstNumber: '',
    panNumber: '',
    cinNumber: '',
    defaultCurrency: 'INR',
    status: 'active' as 'active' | 'inactive',
    isFavorite: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (branch && mode === 'edit') {
      setFormData({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        phone: branch.contact.phone,
        email: branch.contact.email || '',
        managerId: branch.managerId || '',
        managerName: branch.managerName || '',
        timezone: branch.timezone || '',
        gstNumber: branch.taxIds?.gstNumber || '',
        panNumber: branch.taxIds?.panNumber || '',
        cinNumber: branch.taxIds?.cinNumber || '',
        defaultCurrency: branch.defaultCurrency,
        status: branch.status,
        isFavorite: branch.isFavorite
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        managerId: '',
        managerName: '',
        timezone: '',
        gstNumber: '',
        panNumber: '',
        cinNumber: '',
        defaultCurrency: 'INR',
        status: 'active',
        isFavorite: false
      });
    }
    setErrors({});
  }, [branch, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Branch code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Branch code must contain only uppercase letters, numbers, hyphens, and underscores';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Check for duplicate branch code (exclude current branch if editing)
    const existingBranches = branchService.getAllBranches();
    const duplicateCode = existingBranches.find(b => 
      b.code.toLowerCase() === formData.code.toLowerCase() && 
      b.id !== branch?.id
    );
    
    if (duplicateCode) {
      newErrors.code = 'Branch code already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        address: formData.address.trim(),
        contact: {
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined
        },
        managerId: formData.managerId.trim() || undefined,
        managerName: formData.managerName.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
        taxIds: {
          gstNumber: formData.gstNumber.trim() || undefined,
          panNumber: formData.panNumber.trim() || undefined,
          cinNumber: formData.cinNumber.trim() || undefined
        },
        defaultCurrency: formData.defaultCurrency,
        status: formData.status,
        businessId: 'default-business', // TODO: Get from auth context
        createdBy: 'current-user', // TODO: Get from auth context
        totalStaff: branch?.totalStaff || 0,
        totalSales: branch?.totalSales || 0,
        totalRevenue: branch?.totalRevenue || 0,
        lastSaleDate: branch?.lastSaleDate,
        isFavorite: formData.isFavorite,
        displayOrder: branch?.displayOrder || 999
      };

      let savedBranch: Branch;
      
      if (mode === 'edit' && branch) {
        savedBranch = branchService.updateBranch(branch.id, branchData) || branch;
      } else {
        savedBranch = branchService.createBranch(branchData);
      }

      onSave(savedBranch);
      onClose();
    } catch (error) {
      console.error('Error saving branch:', error);
      setErrors({ general: 'Failed to save branch. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                {mode === 'create' ? 'Add New Branch' : 'Edit Branch Profile'}
              </CardTitle>
              <CardDescription>
                {mode === 'create' 
                  ? 'Create a new branch location for your business'
                  : 'Update branch information and settings'
                }
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Main Branch"
                    className={errors.name ? 'border-red-300' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Code *
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="MAIN"
                    className={errors.code ? 'border-red-300' : ''}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-600 mt-1">{errors.code}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Business Street, City, State - 123456"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Currency
                  </label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFavorite"
                  checked={formData.isFavorite}
                  onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isFavorite" className="text-sm text-gray-700 flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  Mark as favorite branch
                </label>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={errors.phone ? 'border-red-300' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="branch@company.com"
                    className={errors.email ? 'border-red-300' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager Name
                  </label>
                  <Input
                    value={formData.managerName}
                    onChange={(e) => handleInputChange('managerName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Timezone</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Mumbai">Asia/Mumbai (IST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Tax & Legal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <Input
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <Input
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value)}
                    placeholder="AAAAA0000A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CIN Number
                  </label>
                  <Input
                    value={formData.cinNumber}
                    onChange={(e) => handleInputChange('cinNumber', e.target.value)}
                    placeholder="U12345AB1234PTC123456"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Branch' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
