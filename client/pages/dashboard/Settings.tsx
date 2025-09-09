import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Building2,
  User,
  Bell,
  Shield,
  Globe,
  Smartphone,
  Download,
  Upload,
  Key,
  Database,
  Palette,
  CreditCard,
  Save,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import WhatsAppConfig from '@/components/WhatsAppConfig';
import BackButton from '@/components/BackButton';

export default function SettingsPage() {
  const permissions = usePermissions();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  if (!permissions.hasPermission('manage_settings')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access business settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            Business Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure your business preferences and system settings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {saved && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Settings Saved
            </Badge>
          )}
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription>Update your business details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" defaultValue="Tech Solutions Pvt Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <select
                    id="businessType"
                    defaultValue="retailer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="manufacturer">Manufacturer</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="retailer">Retailer</option>
                    <option value="distributor">Distributor</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="service">Service Provider</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input id="ownerName" defaultValue="Rajesh Kumar" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" placeholder="Enter GST number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="rajesh@techsolutions.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" defaultValue="+91 98765 43210" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>Configure currency, language, and location preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    defaultValue="INR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    defaultValue="en"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    defaultValue="Asia/Kolkata"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Asia/Kolkata">India Standard Time</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/London">Greenwich Mean Time</option>
                    <option value="Asia/Dubai">Gulf Standard Time</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                AI Assistant Configuration
              </CardTitle>
              <CardDescription>Configure your Google AI Studio integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiApiKey">Google AI Studio API Key</Label>
                <Input
                  id="aiApiKey"
                  type="password"
                  placeholder="Enter your API key"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  Get your API key from Google AI Studio to enable intelligent business insights.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="aiEnabled" defaultChecked />
                <Label htmlFor="aiEnabled">Enable AI Assistant</Label>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Integration */}
          <WhatsAppConfig />

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage passwords and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissions.isOwner ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerPassword">Owner Password</Label>
                    <Input id="ownerPassword" type="password" placeholder="Change owner password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffPassword">Staff Password</Label>
                    <Input id="staffPassword" type="password" placeholder="Change staff password" />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Password management is restricted to business owners only.</p>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="twoFactor" />
                  <Label htmlFor="twoFactor">Enable Two-Factor Authentication (Coming Soon)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="loginAlerts" defaultChecked />
                  <Label htmlFor="loginAlerts">Login Activity Alerts</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.isOwner ? (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Business Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Backup & Restore
                  </Button>
                </>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Data management operations are restricted to business owners only.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="orderNotifs" className="text-sm">New Orders</Label>
                <Switch id="orderNotifs" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="stockNotifs" className="text-sm">Low Stock Alerts</Label>
                <Switch id="stockNotifs" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="paymentNotifs" className="text-sm">Payment Updates</Label>
                <Switch id="paymentNotifs" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="systemNotifs" className="text-sm">System Updates</Label>
                <Switch id="systemNotifs" />
              </div>
            </CardContent>
          </Card>

          {/* Auto Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Auto Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoBackup" className="text-sm">Enable Auto Backup</Label>
                <Switch id="autoBackup" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backupFreq" className="text-sm">Backup Frequency</Label>
                <select
                  id="backupFreq"
                  defaultValue="daily"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Last backup: Jan 15, 2024 at 3:30 AM</p>
                <p>Next backup: Jan 16, 2024 at 3:30 AM</p>
              </div>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                App Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version</span>
                <span className="font-medium">2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build</span>
                <span className="font-medium">#2024.01.15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database</span>
                <span className="font-medium">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-medium">2.4 MB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
