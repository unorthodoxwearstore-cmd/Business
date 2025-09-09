import { UserRole } from '@shared/types';

export interface BusinessDocument {
  id: string;
  type: 'invoice' | 'purchase_order' | 'quotation' | 'receipt' | 'contract' | 'certificate' | 'report' | 'other';
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string; // For actual file storage
  fileContent?: string; // For base64 content storage
  documentNumber?: string; // Invoice number, PO number, etc.
  amount?: number; // For financial documents
  currency: string;
  customerName?: string;
  vendorName?: string;
  customerPhone?: string;
  vendorPhone?: string;
  date: string;
  dueDate?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'active' | 'expired';
  tags: string[];
  category: string;
  businessType: string;
  branchId?: string;
  departmentId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  accessLevel: 'public' | 'restricted' | 'confidential';
  allowedRoles: UserRole[];
  allowedUsers?: string[];
  sharedWith?: {
    userId: string;
    userName: string;
    shareDate: string;
    permissions: 'view' | 'download' | 'edit';
  }[];
  version: number;
  parentDocumentId?: string; // For document versions
  metadata?: {
    gstNumber?: string;
    taxAmount?: string;
    discountAmount?: string;
    totalBeforeTax?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    approvedBy?: string;
    approvedAt?: string;
  };
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  path: string;
  color: string;
  icon: string;
  documentCount: number;
  createdBy: string;
  createdAt: string;
  accessLevel: 'public' | 'restricted' | 'confidential';
  allowedRoles: UserRole[];
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: 'created' | 'viewed' | 'downloaded' | 'shared' | 'updated' | 'deleted' | 'moved';
  details?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DocumentSearch {
  query?: string;
  type?: string;
  dateRange?: { start: string; end: string };
  amountRange?: { min: number; max: number };
  status?: string;
  tags?: string[];
  customerName?: string;
  vendorName?: string;
  createdBy?: string;
  category?: string;
  folderId?: string;
}

class DocumentVaultService {
  private readonly DOCUMENTS_KEY = 'hisaabb_documents';
  private readonly FOLDERS_KEY = 'hisaabb_document_folders';
  private readonly ACTIVITIES_KEY = 'hisaabb_document_activities';

  // Initialize default folders
  private initializeDefaultFolders(): DocumentFolder[] {
    return [
      {
        id: 'invoices',
        name: 'Invoices',
        description: 'All sales invoices and billing documents',
        path: '/invoices',
        color: 'bg-blue-100 text-blue-800',
        icon: 'FileText',
        documentCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        accessLevel: 'restricted',
        allowedRoles: ['owner', 'co_founder', 'manager', 'accountant', 'sales_executive']
      },
      {
        id: 'purchase-orders',
        name: 'Purchase Orders',
        description: 'Purchase orders and procurement documents',
        path: '/purchase-orders',
        color: 'bg-green-100 text-green-800',
        icon: 'ShoppingCart',
        documentCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        accessLevel: 'restricted',
        allowedRoles: ['owner', 'co_founder', 'manager', 'accountant']
      },
      {
        id: 'quotations',
        name: 'Quotations',
        description: 'Price quotations and estimates',
        path: '/quotations',
        color: 'bg-yellow-100 text-yellow-800',
        icon: 'Calculator',
        documentCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        accessLevel: 'restricted',
        allowedRoles: ['owner', 'co_founder', 'manager', 'sales_executive']
      },
      {
        id: 'receipts',
        name: 'Receipts',
        description: 'Payment receipts and acknowledgments',
        path: '/receipts',
        color: 'bg-purple-100 text-purple-800',
        icon: 'Receipt',
        documentCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        accessLevel: 'restricted',
        allowedRoles: ['owner', 'co_founder', 'manager', 'accountant']
      },
      {
        id: 'contracts',
        name: 'Contracts & Agreements',
        description: 'Legal contracts and business agreements',
        path: '/contracts',
        color: 'bg-red-100 text-red-800',
        icon: 'FileCheck',
        documentCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        accessLevel: 'confidential',
        allowedRoles: ['owner', 'co_founder']
      },
      {
        id: 'certificates',
        name: 'Certificates & Licenses',
        description: 'Business licenses, certificates, and permits',
        path: '/certificates',
        color: 'bg-orange-100 text-orange-800',
        icon: 'Award',
        documentCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        accessLevel: 'restricted',
        allowedRoles: ['owner', 'co_founder', 'manager']
      },
      {
        id: 'reports',
        name: 'Reports',
        description: 'Business reports and analytics documents',
        path: '/reports',
        color: 'bg-indigo-100 text-indigo-800',
        icon: 'BarChart3',
        documentCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        accessLevel: 'restricted',
        allowedRoles: ['owner', 'co_founder', 'manager', 'accountant']
      }
    ];
  }

  // Document Management
  getAllDocuments(): BusinessDocument[] {
    const documents = localStorage.getItem(this.DOCUMENTS_KEY);
    return documents ? JSON.parse(documents) : [];
  }

  getDocumentById(id: string): BusinessDocument | null {
    const documents = this.getAllDocuments();
    return documents.find(doc => doc.id === id) || null;
  }

  addDocument(documentData: Omit<BusinessDocument, 'id' | 'createdAt' | 'updatedAt' | 'version'>): { success: boolean; document?: BusinessDocument; message: string } {
    try {
      const documents = this.getAllDocuments();
      
      const document: BusinessDocument = {
        ...documentData,
        id: Date.now().toString(),
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      documents.push(document);
      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents));
      
      // Log activity
      this.logActivity({
        documentId: document.id,
        action: 'created',
        details: `Document "${document.title}" was created`
      });

      // Update folder document count
      this.updateFolderCount();
      
      return { success: true, document, message: 'Document added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add document' };
    }
  }

  updateDocument(id: string, updates: Partial<BusinessDocument>): { success: boolean; document?: BusinessDocument; message: string } {
    try {
      const documents = this.getAllDocuments();
      const index = documents.findIndex(doc => doc.id === id);
      
      if (index === -1) {
        return { success: false, message: 'Document not found' };
      }

      const updatedDocument = {
        ...documents[index],
        ...updates,
        version: documents[index].version + 1,
        updatedAt: new Date().toISOString()
      };

      documents[index] = updatedDocument;
      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents));
      
      // Log activity
      this.logActivity({
        documentId: id,
        action: 'updated',
        details: `Document "${updatedDocument.title}" was updated`
      });
      
      return { success: true, document: updatedDocument, message: 'Document updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update document' };
    }
  }

  deleteDocument(id: string): { success: boolean; message: string } {
    try {
      const documents = this.getAllDocuments();
      const document = documents.find(doc => doc.id === id);
      
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const filteredDocuments = documents.filter(doc => doc.id !== id);
      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(filteredDocuments));
      
      // Log activity
      this.logActivity({
        documentId: id,
        action: 'deleted',
        details: `Document "${document.title}" was deleted`
      });

      // Update folder document count
      this.updateFolderCount();
      
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to delete document' };
    }
  }

  // Folder Management
  getAllFolders(): DocumentFolder[] {
    const folders = localStorage.getItem(this.FOLDERS_KEY);
    const existingFolders = folders ? JSON.parse(folders) : [];
    
    // Initialize default folders if none exist
    if (existingFolders.length === 0) {
      const defaultFolders = this.initializeDefaultFolders();
      localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(defaultFolders));
      return defaultFolders;
    }
    
    return existingFolders;
  }

  createFolder(folderData: Omit<DocumentFolder, 'id' | 'createdAt' | 'documentCount'>): { success: boolean; folder?: DocumentFolder; message: string } {
    try {
      const folders = this.getAllFolders();
      
      const folder: DocumentFolder = {
        ...folderData,
        id: Date.now().toString(),
        documentCount: 0,
        createdAt: new Date().toISOString()
      };

      folders.push(folder);
      localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
      
      return { success: true, folder, message: 'Folder created successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to create folder' };
    }
  }

  private updateFolderCount(): void {
    const documents = this.getAllDocuments();
    const folders = this.getAllFolders();
    
    folders.forEach(folder => {
      folder.documentCount = documents.filter(doc => doc.category === folder.id).length;
    });
    
    localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
  }

  // Search and Filter
  searchDocuments(searchParams: DocumentSearch, userRole: UserRole, userId: string): BusinessDocument[] {
    const documents = this.getAllDocuments();
    
    return documents.filter(document => {
      // Check access permissions
      const hasAccess = this.hasDocumentAccess(document, userRole, userId);
      if (!hasAccess) return false;

      // Text search
      const matchesQuery = !searchParams.query || 
        document.title.toLowerCase().includes(searchParams.query.toLowerCase()) ||
        document.description?.toLowerCase().includes(searchParams.query.toLowerCase()) ||
        document.documentNumber?.toLowerCase().includes(searchParams.query.toLowerCase()) ||
        document.customerName?.toLowerCase().includes(searchParams.query.toLowerCase()) ||
        document.vendorName?.toLowerCase().includes(searchParams.query.toLowerCase());

      // Filter by type
      const matchesType = !searchParams.type || document.type === searchParams.type;

      // Filter by date range
      const matchesDateRange = !searchParams.dateRange || 
        (document.date >= searchParams.dateRange.start && 
         document.date <= searchParams.dateRange.end);

      // Filter by amount range
      const matchesAmountRange = !searchParams.amountRange || !document.amount ||
        (document.amount >= searchParams.amountRange.min && 
         document.amount <= searchParams.amountRange.max);

      // Filter by status
      const matchesStatus = !searchParams.status || document.status === searchParams.status;

      // Filter by tags
      const matchesTags = !searchParams.tags?.length || 
        searchParams.tags.some(tag => document.tags.includes(tag));

      // Filter by customer
      const matchesCustomer = !searchParams.customerName || 
        document.customerName?.toLowerCase().includes(searchParams.customerName.toLowerCase());

      // Filter by vendor
      const matchesVendor = !searchParams.vendorName || 
        document.vendorName?.toLowerCase().includes(searchParams.vendorName.toLowerCase());

      // Filter by creator
      const matchesCreator = !searchParams.createdBy || 
        document.createdBy === searchParams.createdBy;

      // Filter by category/folder
      const matchesCategory = !searchParams.category || 
        document.category === searchParams.category;

      return matchesQuery && matchesType && matchesDateRange && 
             matchesAmountRange && matchesStatus && matchesTags && 
             matchesCustomer && matchesVendor && matchesCreator && matchesCategory;
    });
  }

  // Access Control
  hasDocumentAccess(document: BusinessDocument, userRole: UserRole, userId: string): boolean {
    // System admins (owner, co_founder) have access to all documents
    if (userRole === 'owner' || userRole === 'co_founder') {
      return true;
    }

    // Check if user role is in allowed roles
    if (document.allowedRoles.includes(userRole)) {
      return true;
    }

    // Check if user is specifically allowed
    if (document.allowedUsers?.includes(userId)) {
      return true;
    }

    // Check if document was created by the user
    if (document.createdBy === userId) {
      return true;
    }

    // Check if document is shared with the user
    if (document.sharedWith?.some(share => share.userId === userId)) {
      return true;
    }

    return false;
  }

  shareDocument(documentId: string, userId: string, userName: string, permissions: 'view' | 'download' | 'edit'): { success: boolean; message: string } {
    try {
      const documents = this.getAllDocuments();
      const index = documents.findIndex(doc => doc.id === documentId);
      
      if (index === -1) {
        return { success: false, message: 'Document not found' };
      }

      const document = documents[index];
      if (!document.sharedWith) {
        document.sharedWith = [];
      }

      // Check if already shared
      const existingShare = document.sharedWith.find(share => share.userId === userId);
      if (existingShare) {
        existingShare.permissions = permissions;
        existingShare.shareDate = new Date().toISOString();
      } else {
        document.sharedWith.push({
          userId,
          userName,
          shareDate: new Date().toISOString(),
          permissions
        });
      }

      documents[index] = document;
      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents));
      
      // Log activity
      this.logActivity({
        documentId,
        action: 'shared',
        details: `Document shared with ${userName} with ${permissions} permissions`
      });
      
      return { success: true, message: 'Document shared successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to share document' };
    }
  }

  // Activity Logging
  private logActivity(activityData: Omit<DocumentActivity, 'id' | 'userId' | 'userName' | 'timestamp'>): void {
    try {
      const activities = this.getAllActivities();
      const currentUser = JSON.parse(localStorage.getItem('hisaabb_current_user') || '{}');
      
      const activity: DocumentActivity = {
        ...activityData,
        id: Date.now().toString(),
        userId: currentUser.id || 'system',
        userName: currentUser.name || 'System',
        timestamp: new Date().toISOString()
      };

      activities.push(activity);
      
      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }
      
      localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to log document activity:', error);
    }
  }

  getAllActivities(): DocumentActivity[] {
    const activities = localStorage.getItem(this.ACTIVITIES_KEY);
    return activities ? JSON.parse(activities) : [];
  }

  getDocumentActivities(documentId: string): DocumentActivity[] {
    const activities = this.getAllActivities();
    return activities.filter(activity => activity.documentId === documentId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Download tracking
  trackDocumentView(documentId: string): void {
    this.logActivity({
      documentId,
      action: 'viewed',
      details: 'Document was viewed'
    });
  }

  trackDocumentDownload(documentId: string): void {
    this.logActivity({
      documentId,
      action: 'downloaded',
      details: 'Document was downloaded'
    });
  }

  // Analytics
  getDocumentAnalytics(): {
    totalDocuments: number;
    documentsByType: { type: string; count: number }[];
    documentsByMonth: { month: string; count: number }[];
    mostAccessedDocuments: { document: BusinessDocument; accessCount: number }[];
    documentsByStatus: { status: string; count: number }[];
    storageUsed: number;
  } {
    const documents = this.getAllDocuments();
    const activities = this.getAllActivities();

    // Documents by type
    const typeCount: { [key: string]: number } = {};
    documents.forEach(doc => {
      typeCount[doc.type] = (typeCount[doc.type] || 0) + 1;
    });
    const documentsByType = Object.entries(typeCount).map(([type, count]) => ({ type, count }));

    // Documents by month for the last 12 months
    const now = new Date();
    const documentsByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthDocs = documents.filter(doc => {
        const createdDate = new Date(doc.createdAt);
        return createdDate.getMonth() === date.getMonth() && 
               createdDate.getFullYear() === date.getFullYear();
      }).length;

      documentsByMonth.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: monthDocs
      });
    }

    // Most accessed documents
    const accessCounts: { [key: string]: number } = {};
    activities.filter(activity => activity.action === 'viewed' || activity.action === 'downloaded')
             .forEach(activity => {
               accessCounts[activity.documentId] = (accessCounts[activity.documentId] || 0) + 1;
             });

    const mostAccessedDocuments = documents
      .map(doc => ({
        document: doc,
        accessCount: accessCounts[doc.id] || 0
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Documents by status
    const statusCount: { [key: string]: number } = {};
    documents.forEach(doc => {
      statusCount[doc.status] = (statusCount[doc.status] || 0) + 1;
    });
    const documentsByStatus = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

    // Storage used (approximation based on file sizes)
    const storageUsed = documents.reduce((total, doc) => total + doc.fileSize, 0);

    return {
      totalDocuments: documents.length,
      documentsByType,
      documentsByMonth,
      mostAccessedDocuments,
      documentsByStatus,
      storageUsed
    };
  }

  // Auto-add invoice/document when created from other modules
  autoAddInvoice(invoiceData: {
    invoiceNumber: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    date: string;
    dueDate?: string;
    status: string;
    createdBy: string;
    createdByName: string;
  }): { success: boolean; message: string } {
    return this.addDocument({
      type: 'invoice',
      title: `Invoice #${invoiceData.invoiceNumber}`,
      description: `Sales invoice for ${invoiceData.customerName}`,
      fileName: `invoice-${invoiceData.invoiceNumber}.pdf`,
      fileSize: 0, // Will be updated when actual file is generated
      mimeType: 'application/pdf',
      documentNumber: invoiceData.invoiceNumber,
      amount: invoiceData.amount,
      currency: 'INR',
      customerName: invoiceData.customerName,
      customerPhone: invoiceData.customerPhone,
      date: invoiceData.date,
      dueDate: invoiceData.dueDate,
      status: invoiceData.status as any,
      tags: ['auto-generated', 'invoice'],
      category: 'invoices',
      businessType: 'general',
      createdBy: invoiceData.createdBy,
      createdByName: invoiceData.createdByName,
      accessLevel: 'restricted',
      allowedRoles: ['owner', 'co_founder', 'manager', 'accountant', 'sales_executive']
    });
  }
}

export const documentVaultService = new DocumentVaultService();
