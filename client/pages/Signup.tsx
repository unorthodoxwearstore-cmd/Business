import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2, Crown, Shield } from 'lucide-react';
import { BusinessType } from '@shared/types';
import { authService, OwnerSignupData } from '@/lib/auth-service';

const businessTypeOptions: { value: BusinessType; label: string; description: string }[] = [
  {
    value: 'manufacturer',
    label: 'Manufacturer',
    description: 'Production, inventory, and supply chain management'
  },
  {
    value: 'retailer',
    label: 'Retailer',
    description: 'Point of sale, customer management, and inventory'
  },
  {
    value: 'wholesaler',
    label: 'Wholesaler',
    description: 'Bulk sales, distributor relations, and logistics'
  }
];

export default function Signup() {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedBusinessType = location.state?.businessType;

  const [formData, setFormData] = useState<OwnerSignupData>({
    businessName: '',
    businessType: preselectedBusinessType || ('retailer' as BusinessType),
    ownerName: '',
    email: '',
    phone: '',
    ownerPassword: '',
    staffPassword: ''
  });

  const [confirmOwnerPassword, setConfirmOwnerPassword] = useState('');
  const [confirmStaffPassword, setConfirmStaffPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      errors.businessName = 'Business name is required';
    }
    if (!formData.ownerName.trim()) {
      errors.ownerName = 'Owner name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{3,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Invalid phone number format';
    }
    if (!formData.ownerPassword) {
      errors.ownerPassword = 'Owner password is required';
    } else if (formData.ownerPassword.length < 8) {
      errors.ownerPassword = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    if (formData.ownerPassword !== confirmOwnerPassword) {
      errors.confirmOwnerPassword = 'Passwords do not match';
    }
    if (!formData.staffPassword) {
      errors.staffPassword = 'Staff password is required';
    } else if (formData.staffPassword.length < 8) {
      errors.staffPassword = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    if (formData.staffPassword !== confirmStaffPassword) {
      errors.confirmStaffPassword = 'Passwords do not match';
    }
    if (formData.ownerPassword === formData.staffPassword) {
      errors.staffPassword = 'Staff password must be different from owner password';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.ownerSignup(formData);

      if (result.success && result.user) {
        // Auto-login successful - redirect to business-type specific dashboard
        const dashboardRoute = authService.getBusinessDashboardRoute(
          result.user.businessType, 
          result.user.role
        );
        navigate(dashboardRoute, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Account creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof OwnerSignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedBusinessType = businessTypeOptions.find(
    option => option.value === formData.businessType
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <PieChart className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Insygth
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">Create Your Business</h2>
          <p className="mt-2 text-gray-600">
            Start your digital business journey in minutes
          </p>
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              Business Owner Registration
            </CardTitle>
            <CardDescription className="text-center">
              Complete registration to create your business and get instant access
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {/* Business Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Enter your business name"
                    className={validationErrors.businessName ? 'border-red-500' : ''}
                  />
                  {validationErrors.businessName && (
                    <p className="text-sm text-red-500">{validationErrors.businessName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleInputChange('businessType', value as BusinessType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBusinessType && (
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedBusinessType.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Owner Information */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Owner Information</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    placeholder="Enter owner's full name"
                    className={validationErrors.ownerName ? 'border-red-500' : ''}
                  />
                  {validationErrors.ownerName && (
                    <p className="text-sm text-red-500">{validationErrors.ownerName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="owner@business.com"
                    className={validationErrors.email ? 'border-red-500' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={validationErrors.phone ? 'border-red-500' : ''}
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500">{validationErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Password Setup */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Security Setup</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Create two secure passwords: one for owners and one for staff members.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Owner Password *</Label>
                  <div className="relative">
                    <Input
                      id="ownerPassword"
                      type={showOwnerPassword ? 'text' : 'password'}
                      value={formData.ownerPassword}
                      onChange={(e) => handleInputChange('ownerPassword', e.target.value)}
                      placeholder="Create a secure owner password"
                      className={validationErrors.ownerPassword ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    >
                      {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                  {validationErrors.ownerPassword && (
                    <p className="text-sm text-red-500">{validationErrors.ownerPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmOwnerPassword">Confirm Owner Password *</Label>
                  <Input
                    id="confirmOwnerPassword"
                    type={showOwnerPassword ? 'text' : 'password'}
                    value={confirmOwnerPassword}
                    onChange={(e) => setConfirmOwnerPassword(e.target.value)}
                    placeholder="Confirm your owner password"
                    className={validationErrors.confirmOwnerPassword ? 'border-red-500' : ''}
                  />
                  {validationErrors.confirmOwnerPassword && (
                    <p className="text-sm text-red-500">{validationErrors.confirmOwnerPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffPassword">Staff Password *</Label>
                  <div className="relative">
                    <Input
                      id="staffPassword"
                      type={showStaffPassword ? 'text' : 'password'}
                      value={formData.staffPassword}
                      onChange={(e) => handleInputChange('staffPassword', e.target.value)}
                      placeholder="Create staff access password"
                      className={validationErrors.staffPassword ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                    >
                      {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Staff will use this password to join your business
                  </p>
                  {validationErrors.staffPassword && (
                    <p className="text-sm text-red-500">{validationErrors.staffPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmStaffPassword">Confirm Staff Password *</Label>
                  <Input
                    id="confirmStaffPassword"
                    type={showStaffPassword ? 'text' : 'password'}
                    value={confirmStaffPassword}
                    onChange={(e) => setConfirmStaffPassword(e.target.value)}
                    placeholder="Confirm staff password"
                    className={validationErrors.confirmStaffPassword ? 'border-red-500' : ''}
                  />
                  {validationErrors.confirmStaffPassword && (
                    <p className="text-sm text-red-500">{validationErrors.confirmStaffPassword}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Business...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Business & Start
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have a business?{' '}
                <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                  Staff sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
