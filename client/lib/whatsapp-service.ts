import { getBusinessData } from './business-data';

export interface WhatsAppConfig {
  apiKey: string;
  instanceId: string;
  isEnabled: boolean;
  webhookUrl?: string;
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'document' | 'image';
  content: string;
  filename?: string;
  caption?: string;
  documentBuffer?: ArrayBuffer;
}

export interface WhatsAppSendRequest {
  recipientName: string;
  phoneNumber: string;
  documentType: 'invoice' | 'catalog' | 'quotation';
  documentId: string;
  documentBuffer: ArrayBuffer;
  filename: string;
  message?: string;
}

class WhatsAppService {
  private config: WhatsAppConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('whatsapp_config');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  public saveConfig(config: WhatsAppConfig): void {
    this.config = config;
    localStorage.setItem('whatsapp_config', JSON.stringify(config));
  }

  public getConfig(): WhatsAppConfig | null {
    return this.config;
  }

  public isConfigured(): boolean {
    return !!(this.config?.apiKey && this.config?.instanceId && this.config?.isEnabled);
  }

  public formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    
    // If already has country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned;
    }
    
    // For other country codes, return as is
    return cleaned;
  }

  public async sendDocument(request: WhatsAppSendRequest): Promise<{ success: boolean; message: string; messageId?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'WhatsApp integration is not configured. Please configure it in Settings.'
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);
      
      // Create default message based on document type
      const defaultMessages = {
        invoice: `Hi ${request.recipientName},\n\nPlease find your invoice attached.\n\nThank you for your business!\n\n${getBusinessData().name}`,
        catalog: `Hi ${request.recipientName},\n\nPlease find our latest product catalog attached.\n\nFeel free to contact us for any inquiries!\n\n${getBusinessData().name}`,
        quotation: `Hi ${request.recipientName},\n\nPlease find your quotation attached.\n\nWe look forward to your response!\n\n${getBusinessData().name}`
      };

      const message = request.message || defaultMessages[request.documentType];

      // In a real implementation, this would call the actual WhatsApp Business API
      // For now, we'll simulate the API call
      const response = await this.simulateWhatsAppAPI({
        to: formattedPhone,
        type: 'document',
        content: message,
        filename: request.filename,
        documentBuffer: request.documentBuffer,
        caption: message
      });

      if (response.success) {
        // Log the activity
        this.logWhatsAppActivity({
          recipientName: request.recipientName,
          phoneNumber: formattedPhone,
          documentType: request.documentType,
          documentId: request.documentId,
          sentAt: new Date().toISOString(),
          messageId: response.messageId
        });

        return {
          success: true,
          message: `${request.documentType.charAt(0).toUpperCase() + request.documentType.slice(1)} sent successfully to ${request.recipientName}`,
          messageId: response.messageId
        };
      } else {
        return {
          success: false,
          message: response.error || 'Failed to send document via WhatsApp'
        };
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        message: 'Failed to send document. Please try again.'
      };
    }
  }

  private async simulateWhatsAppAPI(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'WhatsApp API temporarily unavailable'
      };
    }

    // Simulate successful response
    return {
      success: true,
      messageId: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private logWhatsAppActivity(activity: {
    recipientName: string;
    phoneNumber: string;
    documentType: string;
    documentId: string;
    sentAt: string;
    messageId?: string;
  }): void {
    const activities = this.getWhatsAppActivities();
    activities.unshift(activity);
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(100);
    }
    
    localStorage.setItem('whatsapp_activities', JSON.stringify(activities));
  }

  public getWhatsAppActivities(): any[] {
    const activities = localStorage.getItem('whatsapp_activities');
    return activities ? JSON.parse(activities) : [];
  }

  public async sendTextMessage(to: string, message: string): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'WhatsApp integration is not configured.'
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const response = await this.simulateWhatsAppAPI({
        to: formattedPhone,
        type: 'text',
        content: message
      });

      return {
        success: response.success,
        message: response.success ? 'Message sent successfully' : (response.error || 'Failed to send message')
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send message. Please try again.'
      };
    }
  }

  public generatePDFBuffer(content: string, type: 'invoice' | 'catalog' | 'quotation'): ArrayBuffer {
    // In a real implementation, this would use a PDF library like jsPDF or PDFKit
    // For now, we'll create a simple text representation
    const pdfContent = `${type.toUpperCase()}\n\n${content}\n\nGenerated by ${getBusinessData().name}`;
    const encoder = new TextEncoder();
    return encoder.encode(pdfContent).buffer;
  }
}

export const whatsappService = new WhatsAppService();
