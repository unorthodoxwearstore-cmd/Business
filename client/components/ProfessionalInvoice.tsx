import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Eye, 
  Printer, 
  Settings, 
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';
import { 
  InvoiceData, 
  InvoiceCustomization, 
  professionalInvoiceService 
} from '@/lib/professional-invoice-service';

interface ProfessionalInvoiceProps {
  invoiceData: InvoiceData;
  customization?: Partial<InvoiceCustomization>;
  onCustomizationChange?: (customization: Partial<InvoiceCustomization>) => void;
  showActions?: boolean;
  className?: string;
}

export default function ProfessionalInvoice({
  invoiceData,
  customization,
  onCustomizationChange,
  showActions = true,
  className = ""
}: ProfessionalInvoiceProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const config = {
    ...professionalInvoiceService.getDefaultCustomization(),
    ...professionalInvoiceService.loadCustomization(),
    ...customization
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const documentId = await professionalInvoiceService.downloadAndStoreInvoice(
        invoiceData,
        config,
        true // Store to Document Vault
      );

      toast({
        title: "Invoice Generated & Stored",
        description: `Invoice downloaded successfully${documentId ? ' and stored in Document Vault' : ''}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    const html = professionalInvoiceService.generateInvoiceHTML(invoiceData, config);
    setPreviewHTML(html);
    setShowPreview(true);
  };

  const handlePrint = () => {
    const html = professionalInvoiceService.generateInvoiceHTML(invoiceData, config);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Invoice Header */}
      <Card className="overflow-hidden">
        <div 
          className="h-2"
          style={{ backgroundColor: config.primaryColor }}
        />
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${config.primaryColor}20` }}
                >
                  <FileText className="w-6 h-6" style={{ color: config.primaryColor }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: config.primaryColor }}>
                    INVOICE
                  </h1>
                  <p className="text-sm text-gray-600">
                    Professional Invoice Template
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Invoice No:</span>
                  <span className="ml-2 font-semibold">{invoiceData.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{formatDate(invoiceData.invoiceDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Due Date:</span>
                  <span className="ml-2">{formatDate(invoiceData.dueDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-bold" style={{ color: config.primaryColor }}>
                    {formatCurrency(invoiceData.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Company & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.primaryColor }}
                />
                From
              </h3>
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-lg">{config.companyName}</div>
                <div className="text-gray-600 whitespace-pre-line">
                  {config.companyAddress}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {config.companyPhone}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {config.companyEmail}
                </div>
                {config.gstNumber && (
                  <div className="text-gray-600">
                    GST: {config.gstNumber}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.primaryColor }}
                />
                Bill To
              </h3>
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-lg">{invoiceData.customer.name}</div>
                <div className="text-gray-600 whitespace-pre-line">
                  {invoiceData.customer.address}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {invoiceData.customer.phone}
                </div>
                {invoiceData.customer.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {invoiceData.customer.email}
                  </div>
                )}
                {invoiceData.customer.gstNumber && (
                  <div className="text-gray-600">
                    GST: {invoiceData.customer.gstNumber}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.primaryColor }}
              />
              Items
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="grid grid-cols-12 gap-2 p-3 text-sm font-semibold text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                <div className="col-span-1">#</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-1 text-center">Unit</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-1 text-right">Disc%</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              
              {invoiceData.items.map((item, index) => (
                <div 
                  key={index}
                  className={`grid grid-cols-12 gap-2 p-3 text-sm border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <div className="col-span-1 text-gray-600">{index + 1}</div>
                  <div className="col-span-4">
                    <div className="font-medium">{item.description}</div>
                    {item.hsn && (
                      <div className="text-xs text-gray-500">HSN: {item.hsn}</div>
                    )}
                  </div>
                  <div className="col-span-1 text-center">{item.quantity}</div>
                  <div className="col-span-1 text-center">{item.unit}</div>
                  <div className="col-span-2 text-right font-mono">
                    {formatCurrency(item.rate)}
                  </div>
                  <div className="col-span-1 text-right">
                    {item.discount || 0}%
                  </div>
                  <div className="col-span-2 text-right font-mono font-semibold">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono">{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              
              {invoiceData.totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Discount:</span>
                  <span className="font-mono text-red-600">
                    -{formatCurrency(invoiceData.totalDiscount)}
                  </span>
                </div>
              )}
              
              {invoiceData.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax Amount:</span>
                  <span className="font-mono">{formatCurrency(invoiceData.taxAmount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div 
                className="flex justify-between p-3 rounded-lg text-white font-bold"
                style={{ backgroundColor: config.primaryColor }}
              >
                <span>Total Amount:</span>
                <span className="font-mono text-lg">
                  {formatCurrency(invoiceData.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div 
            className="p-4 rounded-lg border-l-4"
            style={{ 
              backgroundColor: `${config.primaryColor}10`,
              borderLeftColor: config.primaryColor 
            }}
          >
            <div className="font-semibold mb-2" style={{ color: config.primaryColor }}>
              Amount in Words:
            </div>
            <div className="text-sm italic">
              {invoiceData.totalInWords}
            </div>
          </div>

          {/* Notes */}
          {invoiceData.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes:</h3>
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                {invoiceData.notes}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {config.showTermsAndConditions && (
            <div>
              <h3 className="font-semibold mb-2">Terms & Conditions:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {config.termsAndConditions.map((term, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div 
                      className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-end pt-6 border-t">
            {invoiceData.bankDetails && (
              <div className="text-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Bank Details
                </h4>
                <div className="space-y-1 text-gray-600">
                  <div><strong>A/c Name:</strong> {invoiceData.bankDetails.accountName}</div>
                  <div><strong>A/c No:</strong> {invoiceData.bankDetails.accountNumber}</div>
                  <div><strong>Bank:</strong> {invoiceData.bankDetails.bankName}</div>
                  <div><strong>IFSC:</strong> {invoiceData.bankDetails.ifscCode}</div>
                </div>
              </div>
            )}
            
            <div className="text-right text-sm">
              <div className="mb-8">
                {config.signatureImage && (
                  <img 
                    src={config.signatureImage} 
                    alt="Signature" 
                    className="max-w-32 max-h-16 mb-2 ml-auto"
                  />
                )}
                <div className="border-t border-gray-400 w-32 ml-auto mb-2"></div>
              </div>
              <div className="font-semibold">{config.signatureName}</div>
              <div className="text-gray-600">{config.signatureDesignation}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Preview of your professional invoice before downloading
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewHTML}
              className="w-full h-[600px] border-0"
              title="Invoice Preview"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isGenerating}>
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
