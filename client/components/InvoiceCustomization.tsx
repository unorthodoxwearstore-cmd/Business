import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Palette, 
  Upload, 
  Save, 
  RotateCcw, 
  Eye,
  Image as ImageIcon,
  Building,
  FileText,
  Signature
} from 'lucide-react';
import { 
  InvoiceCustomization, 
  InvoiceData,
  professionalInvoiceService 
} from '@/lib/professional-invoice-service';
import ProfessionalInvoice from './ProfessionalInvoice';

interface InvoiceCustomizationProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customization: InvoiceCustomization) => void;
  currentCustomization?: Partial<InvoiceCustomization>;
}

export default function InvoiceCustomizationModal({
  isOpen,
  onClose,
  onSave,
  currentCustomization
}: InvoiceCustomizationProps) {
  const [customization, setCustomization] = useState<InvoiceCustomization>(
    professionalInvoiceService.getDefaultCustomization()
  );
  const [previewData, setPreviewData] = useState<InvoiceData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const loaded = professionalInvoiceService.loadCustomization();
      setCustomization({ ...loaded, ...currentCustomization });
      generatePreviewData();
    }
  }, [isOpen, currentCustomization]);

  const generatePreviewData = (): InvoiceData => {
    // Generate preview data for invoice template
    const previewData: InvoiceData = {
      id: 'preview-001',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        name: 'ABC Corporation Ltd',
        address: '123 Business Street\nCommercial District\nMumbai, MH - 400001',
        phone: '+91 98765 43210',
        email: 'contact@abccorp.com',
        gstNumber: '27ABCDE1234F1Z5'
      },
      items: [
        {
          id: '1',
          description: 'Premium Product XYZ',
          hsn: '1234',
          quantity: 2,
          unit: 'pcs',
          rate: 15000,
          discount: 5,
          amount: 28500
        },
        {
          id: '2',
          description: 'Professional Service ABC',
          quantity: 5,
          unit: 'hrs',
          rate: 2000,
          amount: 10000
        },
        {
          id: '3',
          description: 'Consultation Fee',
          quantity: 1,
          unit: 'session',
          rate: 5000,
          amount: 5000
        }
      ],
      subtotal: 43500,
      totalDiscount: 1500,
      taxAmount: 7560,
      totalAmount: 49560,
      totalInWords: 'Forty Nine Thousand Five Hundred Sixty Rupees Only',
      notes: 'Thank you for your business. Please pay within the due date to avoid late fees.',
      bankDetails: {
        accountName: 'Your Company Name',
        accountNumber: '1234567890',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0001234',
        branch: 'Business Park Branch'
      }
    };
    
    setPreviewData(mockData);
    return mockData;
  };

  const handleInputChange = (field: keyof InvoiceCustomization, value: any) => {
    setCustomization(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTermsChange = (index: number, value: string) => {
    const newTerms = [...customization.termsAndConditions];
    newTerms[index] = value;
    handleInputChange('termsAndConditions', newTerms);
  };

  const addTerm = () => {
    handleInputChange('termsAndConditions', [
      ...customization.termsAndConditions,
      'New term...'
    ]);
  };

  const removeTerm = (index: number) => {
    const newTerms = customization.termsAndConditions.filter((_, i) => i !== index);
    handleInputChange('termsAndConditions', newTerms);
  };

  const handleImageUpload = (field: 'logoUrl' | 'signatureImage', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleInputChange(field, result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    professionalInvoiceService.saveCustomization(customization);
    onSave(customization);
    toast({
      title: "Customization Saved",
      description: "Your invoice template has been customized successfully",
      variant: "default"
    });
    onClose();
  };

  const handleReset = () => {
    const defaults = professionalInvoiceService.getDefaultCustomization();
    setCustomization(defaults);
    toast({
      title: "Reset to Defaults",
      description: "Invoice customization has been reset to default values",
      variant: "default"
    });
  };

  const colorPresets = [
    { name: 'Corporate Blue', primary: '#2563eb', secondary: '#64748b' },
    { name: 'Professional Green', primary: '#059669', secondary: '#6b7280' },
    { name: 'Executive Purple', primary: '#7c3aed', secondary: '#6b7280' },
    { name: 'Modern Orange', primary: '#ea580c', secondary: '#6b7280' },
    { name: 'Classic Black', primary: '#1f2937', secondary: '#6b7280' },
    { name: 'Elegant Teal', primary: '#0d9488', secondary: '#6b7280' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Invoice Customization
          </DialogTitle>
          <DialogDescription>
            Customize your invoice template with your brand colors, logo, and company information
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customization Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="signature">Signature</TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={customization.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Enter your company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyAddress">Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={customization.companyAddress}
                        onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                        placeholder="Enter your complete address"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="companyPhone">Phone</Label>
                        <Input
                          id="companyPhone"
                          value={customization.companyPhone}
                          onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyEmail">Email</Label>
                        <Input
                          id="companyEmail"
                          value={customization.companyEmail}
                          onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                          placeholder="Email address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="companyWebsite">Website (Optional)</Label>
                        <Input
                          id="companyWebsite"
                          value={customization.companyWebsite || ''}
                          onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                          placeholder="www.yourcompany.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                        <Input
                          id="gstNumber"
                          value={customization.gstNumber || ''}
                          onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                          placeholder="GST registration number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="logo">Company Logo</Label>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload('logoUrl', file);
                          }}
                          className="hidden"
                          id="logoUpload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('logoUpload')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                        {customization.logoUrl && (
                          <div className="mt-2">
                            <img
                              src={customization.logoUrl}
                              alt="Logo Preview"
                              className="max-w-32 max-h-16 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Colors & Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Color Presets</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {colorPresets.map((preset, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleInputChange('primaryColor', preset.primary);
                              handleInputChange('secondaryColor', preset.secondary);
                            }}
                            className="justify-start"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <span className="text-xs">{preset.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            id="primaryColor"
                            value={customization.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={customization.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            placeholder="#2563eb"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            id="secondaryColor"
                            value={customization.secondaryColor}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={customization.secondaryColor}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                            placeholder="#64748b"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="footerText">Footer Text (Optional)</Label>
                      <Textarea
                        id="footerText"
                        value={customization.footerText || ''}
                        onChange={(e) => handleInputChange('footerText', e.target.value)}
                        placeholder="Additional footer information"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Terms & Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showTerms"
                        checked={customization.showTermsAndConditions}
                        onCheckedChange={(checked) => handleInputChange('showTermsAndConditions', checked)}
                      />
                      <Label htmlFor="showTerms">Show Terms & Conditions</Label>
                    </div>

                    {customization.showTermsAndConditions && (
                      <div className="space-y-3">
                        {customization.termsAndConditions.map((term, index) => (
                          <div key={index} className="flex gap-2">
                            <Textarea
                              value={term}
                              onChange={(e) => handleTermsChange(index, e.target.value)}
                              placeholder={`Term ${index + 1}`}
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTerm(index)}
                              className="mt-1"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addTerm}
                          className="w-full"
                        >
                          Add Term
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signature" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Signature className="w-5 h-5" />
                      Authorized Signatory
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="signatureName">Signatory Name</Label>
                        <Input
                          id="signatureName"
                          value={customization.signatureName}
                          onChange={(e) => handleInputChange('signatureName', e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signatureDesignation">Designation</Label>
                        <Input
                          id="signatureDesignation"
                          value={customization.signatureDesignation}
                          onChange={(e) => handleInputChange('signatureDesignation', e.target.value)}
                          placeholder="Job title"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signatureImage">Signature Image (Optional)</Label>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload('signatureImage', file);
                          }}
                          className="hidden"
                          id="signatureUpload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('signatureUpload')?.click()}
                          className="w-full"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Upload Signature
                        </Button>
                        {customization.signatureImage && (
                          <div className="mt-2">
                            <img
                              src={customization.signatureImage}
                              alt="Signature Preview"
                              className="max-w-32 max-h-16 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </h3>
            </div>
            
            {previewData && (
              <div className="border rounded-lg overflow-hidden bg-white">
                <ProfessionalInvoice
                  invoiceData={previewData}
                  customization={customization}
                  showActions={false}
                  className="scale-75 origin-top-left transform"
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
