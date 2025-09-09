import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart, Eye, EyeOff, ArrowLeft, Loader2, User, Building2, Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import { authService, StaffSigninData } from '@/lib/auth-service';
import { UserRole } from '@/shared/types';

const Signin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<StaffSigninData>({
    businessName: '',
    staffPassword: '',
    name: '',
    phone: '',
    role: 'staff',
    email: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fieldValidation, setFieldValidation] = useState<Record<string, boolean>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user) {
        // If already authenticated, redirect to dashboard
        // No bypass for owners - they should use their own sign-in
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate, location]);

  // Real-time form validation
  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateField = (field: keyof StaffSigninData, value: string): string => {
    switch (field) {
      case 'businessName':
        if (!value.trim()) return 'Business name is required';
        if (value.trim().length < 2) return 'Business name must be at least 2 characters';
        if (value.trim().length > 100) return 'Business name cannot exceed 100 characters';
        if (!/^[a-zA-Z0-9\s\-&.,()]+$/.test(value)) return 'Business name contains invalid characters';
        return '';

      case 'staffPassword':
        if (!value) return 'Staff password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (value.length > 50) return 'Password cannot exceed 50 characters';
        return '';

      case 'name':
        if (!value.trim()) return 'Your name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 50) return 'Name cannot exceed 50 characters';
        if (!/^[a-zA-Z\s.-]+$/.test(value.trim())) return 'Name can only contain letters, spaces, dots, and hyphens';
        return '';

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        if (value.length > 100) return 'Email cannot exceed 100 characters';
        return '';

      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        const cleanPhone = value.replace(/\s/g, '');
        if (!/^[\+]?[1-9][\d]{3,14}$/.test(cleanPhone)) return 'Invalid phone number format';
        if (cleanPhone.length < 7 || cleanPhone.length > 15) return 'Phone number must be 7-15 digits';
        return '';

      case 'role':
        const validRoles = authService.getAvailableRoles().map(r => r.value);
        if (!validRoles.includes(value as UserRole)) return 'Invalid role selection';
        return '';

      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const validation: Record<string, boolean> = {};

    // Validate each field
    Object.keys(formData).forEach(key => {
      const field = key as keyof StaffSigninData;
      const value = formData[field];
      const error = validateField(field, value);
      
      if (error) {
        errors[field] = error;
        validation[field] = false;
      } else {
        validation[field] = true;
      }
    });

    setValidationErrors(errors);
    setFieldValidation(validation);
    
    const isValid = Object.keys(errors).length === 0 && 
                   Object.values(formData).every(value => value.trim() !== '');
    
    setIsFormValid(isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      setError('Please correct all errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      // Additional security checks
      const trimmedData = {
        ...formData,
        businessName: formData.businessName.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      };

      // Prevent potential owner bypass attempts
      if (trimmedData.role === 'owner' || trimmedData.role === 'co_founder') {
        setError('Cannot sign in as owner or co-founder through staff login. Use the business owner sign-in.');
        return;
      }

      const ok = authService.verifyBusinessStaffPassword(trimmedData.businessName, trimmedData.staffPassword);
      if (!ok) {
        setError('Invalid business password. Please contact your business owner.');
        return;
      }
      const { staffRequestRepository } = await import('@/services/indexeddb/repositories/staffRequestRepository');
      await staffRequestRepository.add({ businessName: trimmedData.businessName, staffName: trimmedData.name, phone: trimmedData.phone, email: trimmedData.email, role: trimmedData.role, status: 'PENDING' } as any);
      navigate('/', { replace: true, state: { message: 'Request sent to owner for approval.' } });
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Sign in failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof StaffSigninData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear global error when user starts typing
    
    // Clear field-specific error when user starts correcting
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFieldIcon = (field: keyof StaffSigninData) => {
    if (!formData[field]) return null;
    
    const isValid = fieldValidation[field];
    if (isValid === undefined) return null;
    
    return isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const availableRoles = authService.getAvailableRoles();

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
          
          <h2 className="text-3xl font-bold text-gray-900">Join Your Business</h2>
          <p className="mt-2 text-gray-600">
            Connect to your business account as a team member
          </p>
        </div>

        {/* Staff Signin Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Staff Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Enter your business details and create your staff account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <strong>Security Notice:</strong> Join an existing business using the business name and staff password provided by your business owner. Owner access is restricted.
                </AlertDescription>
              </Alert>

              {/* Business Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <div className="relative">
                    <Input
                      id="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Enter the exact business name"
                      className={validationErrors.businessName ? 'border-red-500 pr-10' : fieldValidation.businessName ? 'border-green-500 pr-10' : 'pr-10'}
                      maxLength={100}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('businessName')}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Contact your business owner for the exact business name
                  </p>
                  {validationErrors.businessName && (
                    <p className="text-sm text-red-500">{validationErrors.businessName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffPassword">Business Password *</Label>
                  <div className="relative">
                    <Input
                      id="staffPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.staffPassword}
                      onChange={(e) => handleInputChange('staffPassword', e.target.value)}
                      placeholder="Enter staff password"
                      className={validationErrors.staffPassword ? 'border-red-500 pr-20' : fieldValidation.staffPassword ? 'border-green-500 pr-20' : 'pr-20'}
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {getFieldIcon('staffPassword')}
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Provided by your business owner
                  </p>
                  {validationErrors.staffPassword && (
                    <p className="text-sm text-red-500">{validationErrors.staffPassword}</p>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Your Information</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className={validationErrors.name ? 'border-red-500 pr-10' : fieldValidation.name ? 'border-green-500 pr-10' : 'pr-10'}
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('name')}
                    </div>
                  </div>
                  {validationErrors.name && (
                    <p className="text-sm text-red-500">{validationErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@domain.com"
                      className={validationErrors.email ? 'border-red-500 pr-10' : fieldValidation.email ? 'border-green-500 pr-10' : 'pr-10'}
                      maxLength={100}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('email')}
                    </div>
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={validationErrors.phone ? 'border-red-500 pr-10' : fieldValidation.phone ? 'border-green-500 pr-10' : 'pr-10'}
                      maxLength={20}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getFieldIcon('phone')}
                    </div>
                  </div>
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleInputChange('role', value as UserRole)}
                  >
                    <SelectTrigger className={validationErrors.role ? 'border-red-500' : fieldValidation.role ? 'border-green-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {role.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Select the role that best matches your responsibilities
                  </p>
                  {validationErrors.role && (
                    <p className="text-sm text-red-500">{validationErrors.role}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className={`w-full mt-6 ${isFormValid 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                  : 'bg-gray-400 cursor-not-allowed'
                } text-white`}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying & Joining...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Join Business as {availableRoles.find(r => r.value === formData.role)?.label}
                  </>
                )}
              </Button>

              {/* Form validation summary */}
              {!isFormValid && Object.values(formData).some(value => value.trim() !== '') && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {Object.keys(validationErrors).length > 0 
                      ? `Please fix ${Object.keys(validationErrors).length} error(s) above`
                      : 'Complete all required fields'
                    }
                  </p>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Starting a new business?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Create business account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signin;
