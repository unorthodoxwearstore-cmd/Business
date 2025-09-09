import { BusinessType } from '@shared/types';

export interface PaymentReminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  amount: number;
  dueDate: string;
  reminderType: 'approaching_due' | 'overdue';
  daysBefore?: number;
  daysOverdue?: number;
  status: 'pending' | 'sent' | 'acknowledged' | 'paid';
  sentAt?: string;
  acknowledgedAt?: string;
  paidAt?: string;
  message: string;
  paymentLink?: string;
  upiQrCode?: string;
}

export interface PaymentReminderConfig {
  isEnabled: boolean;
  approachingDueDays: number; // Days before due date to send reminder
  overdueDays: number[]; // Days after due date to send reminders
  messageTemplates: {
    approachingDue: string;
    overdue: string;
  };
  includePaymentLink: boolean;
  includeUpiQr: boolean;
  businessTypes: BusinessType[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

class PaymentReminderService {
  private config: PaymentReminderConfig;
  private reminders: PaymentReminder[] = [];
  private invoices: Invoice[] = [];

  constructor() {
    this.loadConfig();
    this.loadData();
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('payment_reminder_config');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    } else {
      this.config = {
        isEnabled: true,
        approachingDueDays: 3,
        overdueDays: [1, 3, 7, 15],
        messageTemplates: {
          approachingDue: "Hi {customerName},\n\nThis is a friendly reminder that your invoice {invoiceNumber} of ₹{amount} is due on {dueDate}.\n\nPlease make the payment to avoid any late fees.\n\nThank you!",
          overdue: "Hi {customerName},\n\nYour invoice {invoiceNumber} of ₹{amount} was due on {dueDate} and is now {daysOverdue} days overdue.\n\nPlease make the payment immediately.\n\nThank you!"
        },
        includePaymentLink: true,
        includeUpiQr: true,
        businessTypes: ['retailer', 'ecommerce', 'service', 'manufacturer', 'wholesaler', 'distributor', 'trader']
      };
      this.saveConfig();
    }
  }

  private loadData(): void {
    const savedReminders = localStorage.getItem('payment_reminders');
    const savedInvoices = localStorage.getItem('payment_invoices');
    
    if (savedReminders) {
      this.reminders = JSON.parse(savedReminders);
    }
    
    if (savedInvoices) {
      this.invoices = JSON.parse(savedInvoices);
    } else {
      // Generate some sample invoices for demonstration
      this.generateSampleInvoices();
    }
  }

  private saveConfig(): void {
    localStorage.setItem('payment_reminder_config', JSON.stringify(this.config));
  }

  private saveData(): void {
    localStorage.setItem('payment_reminders', JSON.stringify(this.reminders));
    localStorage.setItem('payment_invoices', JSON.stringify(this.invoices));
  }

  private generateSampleInvoices(): void {
    const now = new Date();
    const sampleInvoices: Invoice[] = [
      {
        id: 'inv_001',
        invoiceNumber: 'INV-2024-001',
        customerId: 'cust_001',
        customerName: 'Rajesh Kumar',
        customerPhone: '+91 98765 43210',
        customerEmail: 'rajesh@example.com',
        amount: 15000,
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
        status: 'pending',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'inv_002',
        invoiceNumber: 'INV-2024-002',
        customerId: 'cust_002',
        customerName: 'Priya Sharma',
        customerPhone: '+91 87654 32109',
        customerEmail: 'priya@example.com',
        amount: 8500,
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue by 1 day
        status: 'overdue',
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'inv_003',
        invoiceNumber: 'INV-2024-003',
        customerId: 'cust_003',
        customerName: 'Amit Patel',
        customerPhone: '+91 76543 21098',
        amount: 25000,
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Overdue by 5 days
        status: 'overdue',
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    this.invoices = sampleInvoices;
    this.saveData();
  }

  public getConfig(): PaymentReminderConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<PaymentReminderConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  public getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  public getReminders(): PaymentReminder[] {
    return [...this.reminders];
  }

  public addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    this.invoices.push(newInvoice);
    this.saveData();
    
    // Check if reminders need to be generated
    this.checkAndGenerateReminders();
    
    return newInvoice;
  }

  public updateInvoiceStatus(invoiceId: string, status: Invoice['status'], paidAt?: string): boolean {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return false;
    
    invoice.status = status;
    if (status === 'paid' && paidAt) {
      invoice.paidAt = paidAt;
      
      // Mark related reminders as paid
      this.reminders
        .filter(reminder => reminder.invoiceId === invoiceId)
        .forEach(reminder => {
          reminder.status = 'paid';
          reminder.paidAt = paidAt;
        });
    }
    
    this.saveData();
    return true;
  }

  public checkAndGenerateReminders(): PaymentReminder[] {
    if (!this.config.isEnabled) return [];
    
    const now = new Date();
    const newReminders: PaymentReminder[] = [];
    
    this.invoices
      .filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue')
      .forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check for approaching due date reminders
        if (daysDiff === -this.config.approachingDueDays) {
          const existingReminder = this.reminders.find(
            r => r.invoiceId === invoice.id && r.reminderType === 'approaching_due'
          );
          
          if (!existingReminder) {
            const reminder = this.createReminder(invoice, 'approaching_due');
            newReminders.push(reminder);
          }
        }
        
        // Check for overdue reminders
        if (daysDiff > 0 && this.config.overdueDays.includes(daysDiff)) {
          const existingReminder = this.reminders.find(
            r => r.invoiceId === invoice.id && 
            r.reminderType === 'overdue' && 
            r.daysOverdue === daysDiff
          );
          
          if (!existingReminder) {
            const reminder = this.createReminder(invoice, 'overdue', daysDiff);
            newReminders.push(reminder);
          }
        }
      });
    
    if (newReminders.length > 0) {
      this.reminders.push(...newReminders);
      this.saveData();
    }
    
    return newReminders;
  }

  private createReminder(invoice: Invoice, type: 'approaching_due' | 'overdue', daysOverdue?: number): PaymentReminder {
    const template = this.config.messageTemplates[type];
    const dueDate = new Date(invoice.dueDate);
    
    let message = template
      .replace('{customerName}', invoice.customerName)
      .replace('{invoiceNumber}', invoice.invoiceNumber)
      .replace('{amount}', invoice.amount.toString())
      .replace('{dueDate}', dueDate.toLocaleDateString());
    
    if (type === 'overdue' && daysOverdue) {
      message = message.replace('{daysOverdue}', daysOverdue.toString());
    }
    
    const reminder: PaymentReminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      reminderType: type,
      daysOverdue: type === 'overdue' ? daysOverdue : undefined,
      daysBefore: type === 'approaching_due' ? this.config.approachingDueDays : undefined,
      status: 'pending',
      message
    };
    
    if (this.config.includePaymentLink) {
      reminder.paymentLink = `https://pay.example.com/invoice/${invoice.id}`;
    }
    
    if (this.config.includeUpiQr) {
      reminder.upiQrCode = this.generateUpiQrCode(invoice);
    }
    
    return reminder;
  }

  private generateUpiQrCode(invoice: Invoice): string {
    // In a real implementation, this would generate an actual UPI QR code
    // For now, we'll return a placeholder UPI string
    return `upi://pay?pa=business@upi&pn=Business&am=${invoice.amount}&cu=INR&tn=Payment for ${invoice.invoiceNumber}`;
  }

  public async sendReminder(reminderId: string): Promise<{ success: boolean; message: string }> {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (!reminder) {
      return { success: false, message: 'Reminder not found' };
    }
    
    if (reminder.status !== 'pending') {
      return { success: false, message: 'Reminder already sent' };
    }
    
    try {
      // Simulate sending notification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate occasional failures (5% chance)
      if (Math.random() < 0.05) {
        return { success: false, message: 'Failed to send reminder. Please try again.' };
      }
      
      reminder.status = 'sent';
      reminder.sentAt = new Date().toISOString();
      this.saveData();
      
      return { success: true, message: 'Payment reminder sent successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to send reminder' };
    }
  }

  public markReminderAcknowledged(reminderId: string): boolean {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (!reminder) return false;
    
    reminder.status = 'acknowledged';
    reminder.acknowledgedAt = new Date().toISOString();
    this.saveData();
    
    return true;
  }

  public getPendingReminders(): PaymentReminder[] {
    return this.reminders.filter(r => r.status === 'pending');
  }

  public getDueInvoices(): Invoice[] {
    const now = new Date();
    return this.invoices.filter(invoice => {
      if (invoice.status !== 'pending') return false;
      const dueDate = new Date(invoice.dueDate);
      const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= this.config.approachingDueDays;
    });
  }

  public getOverdueInvoices(): Invoice[] {
    const now = new Date();
    return this.invoices.filter(invoice => {
      if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
      const dueDate = new Date(invoice.dueDate);
      return now > dueDate;
    });
  }
}

export const paymentReminderService = new PaymentReminderService();
