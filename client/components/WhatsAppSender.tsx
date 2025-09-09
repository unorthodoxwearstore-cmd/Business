import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { whatsappService, WhatsAppSendRequest } from '@/lib/whatsapp-service';
import { MessageCircle, Send, AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface WhatsAppSenderProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'invoice' | 'catalog' | 'quotation';
  documentId: string;
  documentTitle: string;
  documentContent: string;
  customers?: Customer[];
  defaultCustomer?: Customer;
  onConfigureClick?: () => void;
}

export default function WhatsAppSender({
  isOpen,
  onClose,
  documentType,
  documentId,
  documentTitle,
  documentContent,
  customers = [],
  defaultCustomer,
  onConfigureClick
}: WhatsAppSenderProps) {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(defaultCustomer || null);
  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(whatsappService.isConfigured());
  }, [isOpen]);

  useEffect(() => {
    if (defaultCustomer) {
      setSelectedCustomer(defaultCustomer);
      setCustomPhone('');
      setCustomName('');
    }
  }, [defaultCustomer]);

  useEffect(() => {
    // Generate default message
    const recipientName = selectedCustomer?.name || customName || 'Valued Customer';
    const defaultMessages = {
      invoice: `Hi ${recipientName},\n\nPlease find your invoice "${documentTitle}" attached.\n\nThank you for your business!`,
      catalog: `Hi ${recipientName},\n\nPlease find our latest product catalog attached.\n\nFeel free to contact us for any inquiries!`,
      quotation: `Hi ${recipientName},\n\nPlease find your quotation "${documentTitle}" attached.\n\nWe look forward to your response!`
    };
    
    setMessage(defaultMessages[documentType]);
  }, [documentType, documentTitle, selectedCustomer, customName]);

  const handleSend = async () => {
    const recipientName = selectedCustomer?.name || customName;
    const phoneNumber = selectedCustomer?.phone || customPhone;

    if (!recipientName || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please provide recipient name and phone number",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Missing Message",
        description: "Please provide a message to send",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const documentBuffer = whatsappService.generatePDFBuffer(documentContent, documentType);
      const filename = `${documentType}_${documentId}_${Date.now()}.pdf`;

      const request: WhatsAppSendRequest = {
        recipientName,
        phoneNumber,
        documentType,
        documentId,
        documentBuffer,
        filename,
        message
      };

      const result = await whatsappService.sendDocument(request);

      if (result.success) {
        toast({
          title: "Sent Successfully",
          description: result.message,
          variant: "default"
        });
        onClose();
      } else {
        toast({
          title: "Send Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(defaultCustomer || null);
    setCustomPhone('');
    setCustomName('');
    setMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isConfigured) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              WhatsApp Not Configured
            </DialogTitle>
            <DialogDescription>
              WhatsApp integration needs to be configured before you can send documents.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Please configure your WhatsApp Business API credentials in Settings to enable document sending.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={() => {
              handleClose();
              onConfigureClick?.();
            }}>
              <Settings className="w-4 h-4 mr-2" />
              Configure WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Send {documentType.charAt(0).toUpperCase() + documentType.slice(1)} via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Send "{documentTitle}" to a customer via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Selection */}
          {customers.length > 0 && (
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Select
                value={selectedCustomer?.id || ''}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setSelectedCustomer(null);
                  } else {
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer or enter custom details" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-sm text-muted-foreground">{customer.phone}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <span className="text-blue-600">Enter custom details...</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Customer Details */}
          {(!selectedCustomer || customers.length === 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customName">Customer Name</Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPhone">Phone Number</Label>
                <Input
                  id="customPhone"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          )}

          {/* Selected Customer Display */}
          {selectedCustomer && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{selectedCustomer.name}</strong>
                    <br />
                    <span className="text-sm">{selectedCustomer.phone}</span>
                  </div>
                  <Badge variant="secondary">Saved Customer</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              The {documentType} will be attached as a PDF to this message.
            </p>
          </div>

          {/* Document Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Document:</strong> {documentTitle}
              <br />
              <strong>Type:</strong> {documentType.toUpperCase()}
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send via WhatsApp
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
