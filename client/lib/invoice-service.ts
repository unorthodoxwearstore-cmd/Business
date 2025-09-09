import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { authService } from './auth-service';

export interface InvoiceData {
  customerName: string;
  customerPhone: string;
  amount: number;
  description: string;
  invoiceDate: string;
  dueDate?: string;
  taxRate: number;
  receivedAmount: number;
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
  status: 'paid' | 'pending' | 'overdue';
  isDraft?: boolean;
}

export interface Invoice extends InvoiceData {
  id: string;
  invoiceNumber: string;
  businessName: string;
  businessType: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
}

class InvoiceService {
  private invoices: Invoice[] = [];
  private drafts: InvoiceData[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private generateInvoiceNumber(): string {
    const currentUser = authService.getCurrentUser();
    const year = new Date().getFullYear();
    const existingInvoices = this.invoices.filter(inv =>
      inv.invoiceNumber.startsWith(`INV-${year}`)
    );
    const nextNumber = existingInvoices.length + 1;
    return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private saveToStorage(): void {
    localStorage.setItem('hisaabb_invoices', JSON.stringify(this.invoices));
    localStorage.setItem('hisaabb_invoice_drafts', JSON.stringify(this.drafts));
  }

  private loadFromStorage(): void {
    try {
      const savedInvoices = localStorage.getItem('hisaabb_invoices');
      const savedDrafts = localStorage.getItem('hisaabb_invoice_drafts');
      
      if (savedInvoices) {
        this.invoices = JSON.parse(savedInvoices);
      }
      
      if (savedDrafts) {
        this.drafts = JSON.parse(savedDrafts);
      }
    } catch (error) {
      console.error('Error loading invoices from storage:', error);
      this.invoices = [];
      this.drafts = [];
    }
  }

  async createInvoice(data: InvoiceData): Promise<Invoice> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const invoice: Invoice = {
      ...data,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber: this.generateInvoiceNumber(),
      businessName: currentUser.businessName || 'Your Business',
      businessType: currentUser.businessType || 'business',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.invoices.push(invoice);
    this.saveToStorage();

    // Integrate with data manager for cross-module connectivity
    try {
      // Import data manager dynamically to avoid circular dependency
      const { dataManager } = await import('./data-manager');

      // Create sale record for analytics and reporting
      const saleRecord = {
        invoiceId: invoice.id,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        amount: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        status: 'completed' as const
      };

      dataManager.addSale(saleRecord);
    } catch (error) {
      console.warn('Failed to sync invoice with data manager:', error);
    }

    return invoice;
  }

  async saveDraft(data: InvoiceData): Promise<void> {
    const draft = {
      ...data,
      createdAt: new Date().toISOString()
    };

    this.drafts.push(draft);
    this.saveToStorage();
  }

  getInvoices(): Invoice[] {
    return [...this.invoices].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getDrafts(): InvoiceData[] {
    return [...this.drafts];
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices.find(inv => inv.id === id);
  }

  deleteInvoice(id: string): boolean {
    const index = this.invoices.findIndex(inv => inv.id === id);
    if (index > -1) {
      this.invoices.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteDraft(index: number): boolean {
    if (index >= 0 && index < this.drafts.length) {
      this.drafts.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  async generatePDF(invoice: Invoice): Promise<string> {
    // Create a temporary container for the invoice HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm';
    container.style.backgroundColor = 'white';
    container.style.padding = '20mm';
    container.style.fontFamily = 'Arial, sans-serif';

    const currentUser = authService.getCurrentUser();
    
    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <div>
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0;">INVOICE</h1>
            <p style="font-size: 16px; color: #6b7280; margin: 5px 0 0 0;">#${invoice.invoiceNumber}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 0;">${invoice.businessName}</h2>
            <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0; text-transform: capitalize;">${invoice.businessType} Business</p>
          </div>
        </div>

        <!-- Invoice Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0;">Bill To:</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 5px 0;">${invoice.customerName}</p>
              <p style="font-size: 14px; color: #6b7280; margin: 0;">Phone: ${invoice.customerPhone}</p>
            </div>
          </div>
          <div>
            <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0;">Invoice Details:</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">Invoice Date:</span>
                <span style="font-weight: 600;">${new Date(invoice.invoiceDate).toLocaleDateString()}</span>
              </div>
              ${invoice.dueDate ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280;">Due Date:</span>
                  <span style="font-weight: 600;">${new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Status:</span>
                <span style="font-weight: 600; color: ${invoice.status === 'paid' ? '#059669' : invoice.status === 'overdue' ? '#dc2626' : '#d97706'}; text-transform: capitalize;">${invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        ${invoice.description ? `
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">Description:</h3>
            <p style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 0; color: #374151;">${invoice.description}</p>
          </div>
        ` : ''}

        <!-- Amount Details -->
        <div style="background: #f9fafb; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280; font-size: 14px;">Subtotal:</span>
            <span style="font-weight: 600; font-size: 14px;">₹${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280; font-size: 14px;">Tax (${invoice.taxRate}% GST):</span>
            <span style="font-weight: 600; font-size: 14px;">₹${invoice.tax.toFixed(2)}</span>
          </div>
          <div style="border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 18px; font-weight: bold; color: #1f2937;">Total Amount:</span>
              <span style="font-size: 18px; font-weight: bold; color: #1f2937;">₹${invoice.total.toFixed(2)}</span>
            </div>
            ${invoice.receivedAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Received:</span>
                <span style="font-weight: 600; font-size: 14px; color: #059669;">₹${invoice.receivedAmount.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Balance Due:</span>
                <span style="font-weight: 600; font-size: 14px; color: ${invoice.balance === 0 ? '#059669' : '#dc2626'};">₹${invoice.balance.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Payment Status -->
        <div style="text-align: center; padding: 20px; background: ${invoice.status === 'paid' ? '#d1fae5' : invoice.status === 'overdue' ? '#fee2e2' : '#fef3c7'}; border-radius: 12px; margin-bottom: 30px;">
          <h3 style="margin: 0; font-size: 16px; color: ${invoice.status === 'paid' ? '#065f46' : invoice.status === 'overdue' ? '#7f1d1d' : '#92400e'}; text-transform: uppercase; letter-spacing: 1px;">
            ${invoice.status === 'paid' ? 'PAID IN FULL' : invoice.status === 'overdue' ? 'OVERDUE' : 'PAYMENT PENDING'}
          </h3>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Thank you for your business!</p>
          <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // Generate PDF
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 10;

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Convert to blob URL
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Update invoice with PDF URL
      const invoiceIndex = this.invoices.findIndex(inv => inv.id === invoice.id);
      if (invoiceIndex > -1) {
        this.invoices[invoiceIndex].pdfUrl = pdfUrl;
        this.saveToStorage();
      }

      return pdfUrl;
    } finally {
      document.body.removeChild(container);
    }
  }

  async downloadInvoice(invoice: Invoice): Promise<void> {
    const pdfUrl = invoice.pdfUrl || await this.generatePDF(invoice);
    
    // Create download link
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${invoice.invoiceNumber}_${invoice.customerName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getRecentInvoices(limit: number = 5): Invoice[] {
    return this.getInvoices().slice(0, limit);
  }

  getTotalSales(): number {
    return this.invoices.reduce((total, invoice) => total + invoice.total, 0);
  }

  getTotalPendingAmount(): number {
    return this.invoices.reduce((total, invoice) => total + invoice.balance, 0);
  }

  getPaidInvoicesCount(): number {
    return this.invoices.filter(invoice => invoice.status === 'paid').length;
  }

  getPendingInvoicesCount(): number {
    return this.invoices.filter(invoice => invoice.status === 'pending').length;
  }

  getOverdueInvoicesCount(): number {
    return this.invoices.filter(invoice => invoice.status === 'overdue').length;
  }

  updateInvoiceStatus(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.invoices.forEach(invoice => {
      if (invoice.balance === 0) {
        invoice.status = 'paid';
      } else if (invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          invoice.status = 'overdue';
        } else {
          invoice.status = 'pending';
        }
      } else {
        invoice.status = 'pending';
      }
    });

    this.saveToStorage();
  }
}

export const invoiceService = new InvoiceService();

// Update invoice statuses on service initialization
invoiceService.updateInvoiceStatus();
