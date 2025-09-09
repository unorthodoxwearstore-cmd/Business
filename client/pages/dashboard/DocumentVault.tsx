import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/lib/permissions';
import { authService } from '@/lib/auth-service';
import BackButton from '@/components/BackButton';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Share, 
  Eye, 
  Trash2,
  Upload,
  FolderOpen,
  Lock,
  Unlock,
  Calendar,
  User,
  DollarSign,
  FileImage,
  FileSpreadsheet,
  File,
  Folder,
  FolderPlus,
  Edit,
  Shield,
  Activity,
  Archive,
  Filter,
  MoreVertical,
  Copy,
  Move,
  History
} from 'lucide-react';

interface BusinessDocument {
  id: string;
  type: 'invoice' | 'purchase_order' | 'quotation' | 'receipt' | 'contract' | 'certificate' | 'report' | 'other';
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileContent?: string; // Base64 encoded content
  documentNumber?: string;
  amount?: number;
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
  folderId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  accessLevel: 'public' | 'restricted' | 'confidential';
  allowedRoles: string[];
  allowedUsers?: string[];
  sharedWith?: {
    userId: string;
    userName: string;
    shareDate: string;
    permissions: 'view' | 'download' | 'edit';
  }[];
  version: number;
  parentDocumentId?: string;
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

interface DocumentFolder {
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
  allowedRoles: string[];
}

interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: 'created' | 'viewed' | 'downloaded' | 'shared' | 'updated' | 'deleted' | 'moved';
  details?: string;
  timestamp: string;
}

interface DocumentFilters {
  type: string;
  accessLevel: string;
  dateRange: string;
  status: string;
  folderId: string;
}

const DocumentVault: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [activities, setActivities] = useState<DocumentActivity[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({
    type: 'all',
    accessLevel: 'all',
    dateRange: 'all',
    status: 'all',
    folderId: 'all'
  });
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BusinessDocument | null>(null);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  
  // Form states
  const [documentForm, setDocumentForm] = useState({
    type: 'other' as const,
    title: '',
    description: '',
    documentNumber: '',
    amount: '',
    currency: 'INR',
    customerName: '',
    vendorName: '',
    customerPhone: '',
    vendorPhone: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'active' as const,
    tags: '',
    category: '',
    accessLevel: 'public' as const,
    allowedRoles: [] as string[],
    folderId: ''
  });
  
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    parentFolderId: '',
    color: '#3b82f6',
    icon: 'folder',
    accessLevel: 'public' as const,
    allowedRoles: [] as string[]
  });

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // Load documents from localStorage
    const savedDocuments = localStorage.getItem('insygth_documents');
    const documentsData = savedDocuments ? JSON.parse(savedDocuments) : [];
    
    // Load folders from localStorage
    const savedFolders = localStorage.getItem('insygth_document_folders');
    const foldersData = savedFolders ? JSON.parse(savedFolders) : [];
    
    // Load activities from localStorage
    const savedActivities = localStorage.getItem('insygth_document_activities');
    const activitiesData = savedActivities ? JSON.parse(savedActivities) : [];
    
    // Filter documents based on user permissions
    const accessibleDocuments = documentsData.filter((doc: BusinessDocument) => 
      hasDocumentAccess(doc)
    );
    
    // Filter folders based on user permissions
    const accessibleFolders = foldersData.filter((folder: DocumentFolder) => 
      hasFolderAccess(folder)
    );
    
    // Update folder document counts
    const updatedFolders = accessibleFolders.map((folder: DocumentFolder) => ({
      ...folder,
      documentCount: accessibleDocuments.filter((doc: BusinessDocument) => doc.folderId === folder.id).length
    }));
    
    setDocuments(accessibleDocuments);
    setFolders(updatedFolders);
    setActivities(activitiesData);
    setLoading(false);
  };

  const saveDocuments = (documentsData: BusinessDocument[]) => {
    localStorage.setItem('insygth_documents', JSON.stringify(documentsData));
  };

  const saveFolders = (foldersData: DocumentFolder[]) => {
    localStorage.setItem('insygth_document_folders', JSON.stringify(foldersData));
  };

  const saveActivities = (activitiesData: DocumentActivity[]) => {
    localStorage.setItem('insygth_document_activities', JSON.stringify(activitiesData));
  };

  // Permission checking functions
  const hasDocumentAccess = (document: BusinessDocument): boolean => {
    if (!currentUser) return false;
    
    // Owner and co-founder have access to all documents
    if (['owner', 'co_founder'].includes(currentUser.role)) return true;
    
    // Check if user created the document
    if (document.createdBy === currentUser.id) return true;
    
    // Check access level
    if (document.accessLevel === 'public') return true;
    
    // Check role-based access
    if (document.allowedRoles.includes(currentUser.role)) return true;
    
    // Check user-specific access
    if (document.allowedUsers?.includes(currentUser.id)) return true;
    
    // Check if document is shared with user
    if (document.sharedWith?.some(share => share.userId === currentUser.id)) return true;
    
    return false;
  };

  const hasFolderAccess = (folder: DocumentFolder): boolean => {
    if (!currentUser) return false;
    
    // Owner and co-founder have access to all folders
    if (['owner', 'co_founder'].includes(currentUser.role)) return true;
    
    // Check if user created the folder
    if (folder.createdBy === currentUser.id) return true;
    
    // Check access level
    if (folder.accessLevel === 'public') return true;
    
    // Check role-based access
    if (folder.allowedRoles.includes(currentUser.role)) return true;
    
    return false;
  };

  const canEditDocument = (document: BusinessDocument): boolean => {
    if (!currentUser) return false;
    
    // Owner and co-founder can edit all documents
    if (['owner', 'co_founder'].includes(currentUser.role)) return true;
    
    // Document creator can edit
    if (document.createdBy === currentUser.id) return true;
    
    // Check if user has edit permissions through sharing
    const shareInfo = document.sharedWith?.find(share => share.userId === currentUser.id);
    if (shareInfo && shareInfo.permissions === 'edit') return true;
    
    return false;
  };

  const canDeleteDocument = (document: BusinessDocument): boolean => {
    if (!currentUser) return false;
    
    // Owner and co-founder can delete all documents
    if (['owner', 'co_founder'].includes(currentUser.role)) return true;
    
    // Document creator can delete
    if (document.createdBy === currentUser.id) return true;
    
    return false;
  };

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      
      setDocumentForm(prev => ({
        ...prev,
        title: documentForm.title || file.name.split('.')[0],
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileContent
      }));
    };
    
    reader.readAsDataURL(file);
  };

  // Document CRUD operations
  const handleCreateDocument = () => {
    const validation = validateDocumentForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) return;

    const newDocument: BusinessDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: documentForm.type,
      title: documentForm.title,
      description: documentForm.description,
      fileName: fileInputRef.current?.files?.[0]?.name || 'document',
      fileSize: fileInputRef.current?.files?.[0]?.size || 0,
      mimeType: fileInputRef.current?.files?.[0]?.type || 'application/octet-stream',
      fileContent: documentForm.fileContent,
      documentNumber: documentForm.documentNumber,
      amount: documentForm.amount ? parseFloat(documentForm.amount) : undefined,
      currency: documentForm.currency,
      customerName: documentForm.customerName,
      vendorName: documentForm.vendorName,
      customerPhone: documentForm.customerPhone,
      vendorPhone: documentForm.vendorPhone,
      date: documentForm.date,
      dueDate: documentForm.dueDate,
      status: documentForm.status,
      tags: documentForm.tags ? documentForm.tags.split(',').map(tag => tag.trim()) : [],
      category: documentForm.category,
      businessType: currentUser.businessType,
      folderId: documentForm.folderId || undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessLevel: documentForm.accessLevel,
      allowedRoles: documentForm.allowedRoles,
      version: 1
    };

    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    saveDocuments(updatedDocuments);
    
    // Log activity
    logActivity(newDocument.id, 'created', `Document "${newDocument.title}" created`);
    
    resetDocumentForm();
    setUploadDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    if (!canDeleteDocument(document)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete this document",
        variant: "destructive"
      });
      return;
    }

    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    saveDocuments(updatedDocuments);
    
    // Log activity
    logActivity(documentId, 'deleted', `Document "${document.title}" deleted`);
    
    toast({
      title: "Success",
      description: "Document deleted successfully",
    });
  };

  // Folder CRUD operations
  const handleCreateFolder = () => {
    const validation = validateFolderForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) return;

    const parentPath = folderForm.parentFolderId ? 
      folders.find(f => f.id === folderForm.parentFolderId)?.path || '' : '';
    
    const newFolder: DocumentFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: folderForm.name,
      description: folderForm.description,
      parentFolderId: folderForm.parentFolderId || undefined,
      path: parentPath ? `${parentPath}/${folderForm.name}` : folderForm.name,
      color: folderForm.color,
      icon: folderForm.icon,
      documentCount: 0,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      accessLevel: folderForm.accessLevel,
      allowedRoles: folderForm.allowedRoles
    };

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
    resetFolderForm();
    setFolderDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Folder created successfully",
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    const folderDocuments = documents.filter(doc => doc.folderId === folderId);
    if (folderDocuments.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete folder with documents. Move documents first.",
        variant: "destructive"
      });
      return;
    }

    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
    
    toast({
      title: "Success",
      description: "Folder deleted successfully",
    });
  };

  // Activity logging
  const logActivity = (documentId: string, action: DocumentActivity['action'], details?: string) => {
    if (!currentUser) return;

    const activity: DocumentActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    const updatedActivities = [activity, ...activities].slice(0, 1000); // Keep last 1000 activities
    setActivities(updatedActivities);
    saveActivities(updatedActivities);
  };

  // Document actions
  const handleViewDocument = (document: BusinessDocument) => {
    logActivity(document.id, 'viewed', `Document "${document.title}" viewed`);
    
    if (document.fileContent) {
      // Open in new tab
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${document.title}</title></head>
            <body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
              <h1>${document.title}</h1>
              <p><strong>Type:</strong> ${document.type}</p>
              <p><strong>Date:</strong> ${formatDate(document.date)}</p>
              ${document.amount ? `<p><strong>Amount:</strong> ${formatCurrency(document.amount)}</p>` : ''}
              ${document.description ? `<p><strong>Description:</strong> ${document.description}</p>` : ''}
              <hr>
              <iframe src="${document.fileContent}" width="100%" height="600px" frameborder="0"></iframe>
            </body>
          </html>
        `);
      }
    }
  };

  const handleDownloadDocument = (document: BusinessDocument) => {
    if (!document.fileContent) {
      toast({
        title: "Download Error",
        description: "File content not available",
        variant: "destructive"
      });
      return;
    }

    logActivity(document.id, 'downloaded', `Document "${document.title}" downloaded`);
    
    // Create download link
    const link = document.createElement('a');
    link.href = document.fileContent;
    link.download = document.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "Document downloaded successfully",
    });
  };

  // Validation functions
  const validateDocumentForm = () => {
    const errors: string[] = [];
    
    if (!documentForm.title.trim()) errors.push('Document title is required');
    if (!documentForm.date) errors.push('Document date is required');
    if (!documentForm.category.trim()) errors.push('Category is required');
    
    if (!fileInputRef.current?.files?.[0] && !documentForm.fileContent) {
      errors.push('Please select a file to upload');
    }
    
    if (documentForm.amount && parseFloat(documentForm.amount) < 0) {
      errors.push('Amount cannot be negative');
    }
    
    if (documentForm.customerPhone && !/^\d{10}$/.test(documentForm.customerPhone.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid 10-digit customer phone number');
    }
    
    if (documentForm.vendorPhone && !/^\d{10}$/.test(documentForm.vendorPhone.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid 10-digit vendor phone number');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateFolderForm = () => {
    const errors: string[] = [];
    
    if (!folderForm.name.trim()) errors.push('Folder name is required');
    
    // Check for duplicate folder names in the same parent
    const existingFolder = folders.find(folder => 
      folder.name.toLowerCase() === folderForm.name.toLowerCase() &&
      folder.parentFolderId === folderForm.parentFolderId &&
      folder.id !== editingFolder?.id
    );
    
    if (existingFolder) {
      errors.push('Folder with this name already exists in the same location');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Form reset functions
  const resetDocumentForm = () => {
    setDocumentForm({
      type: 'other',
      title: '',
      description: '',
      documentNumber: '',
      amount: '',
      currency: 'INR',
      customerName: '',
      vendorName: '',
      customerPhone: '',
      vendorPhone: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'active',
      tags: '',
      category: '',
      accessLevel: 'public',
      allowedRoles: [],
      folderId: ''
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetFolderForm = () => {
    setFolderForm({
      name: '',
      description: '',
      parentFolderId: '',
      color: '#3b82f6',
      icon: 'folder',
      accessLevel: 'public',
      allowedRoles: []
    });
  };

  // Filter and search functions
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         document.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.type === 'all' || document.type === filters.type;
    const matchesAccessLevel = filters.accessLevel === 'all' || document.accessLevel === filters.accessLevel;
    const matchesStatus = filters.status === 'all' || document.status === filters.status;
    const matchesFolder = filters.folderId === 'all' || document.folderId === filters.folderId ||
                         (filters.folderId === 'root' && !document.folderId);
    
    // Date range filtering
    let matchesDateRange = true;
    if (filters.dateRange !== 'all') {
      const docDate = new Date(document.date);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          matchesDateRange = docDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = docDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = docDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDateRange = docDate >= yearAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesAccessLevel && matchesStatus && matchesFolder && matchesDateRange;
  });

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getAccessLevelBadge = (accessLevel: string) => {
    const variants = {
      public: 'bg-green-100 text-green-800',
      restricted: 'bg-yellow-100 text-yellow-800',
      confidential: 'bg-red-100 text-red-800'
    };
    return variants[accessLevel as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  // Permission check
  if (!hasPermission('view_orders')) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <BackButton />
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">You don't have permission to view document vault.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading document vault...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredDocuments.length} visible to you
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folders.length}</div>
            <p className="text-xs text-muted-foreground">
              Organized storage
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((sum, doc) => sum + doc.fileSize, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total file size
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Actions today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Document Vault</CardTitle>
              <CardDescription>
                Centralized document storage with role-based access control and audit trail
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('create_product') && (
                <>
                  <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => { resetFolderForm(); setEditingFolder(null); }}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingFolder ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="folderName">Folder Name *</Label>
                          <Input
                            id="folderName"
                            value={folderForm.name}
                            onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter folder name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="folderDescription">Description</Label>
                          <Textarea
                            id="folderDescription"
                            value={folderForm.description}
                            onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Folder description"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentFolder">Parent Folder</Label>
                          <Select value={folderForm.parentFolderId} onValueChange={(value) => setFolderForm(prev => ({ ...prev, parentFolderId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent folder (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Root (No parent)</SelectItem>
                              {folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>{folder.path}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="folderAccessLevel">Access Level</Label>
                          <Select value={folderForm.accessLevel} onValueChange={(value: 'public' | 'restricted' | 'confidential') => setFolderForm(prev => ({ ...prev, accessLevel: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public - All users can access</SelectItem>
                              <SelectItem value="restricted">Restricted - Limited role access</SelectItem>
                              <SelectItem value="confidential">Confidential - Owner/Co-founder only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="folderColor">Folder Color</Label>
                          <Input
                            id="folderColor"
                            type="color"
                            value={folderForm.color}
                            onChange={(e) => setFolderForm(prev => ({ ...prev, color: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateFolder}>
                          {editingFolder ? 'Update' : 'Create'} Folder
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetDocumentForm()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Upload New Document</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="fileUpload">Select File *</Label>
                          <Input
                            id="fileUpload"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                          />
                          <p className="text-xs text-muted-foreground">
                            Supported: PDF, Word, Excel, PowerPoint, Images (Max 10MB)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="docTitle">Document Title *</Label>
                          <Input
                            id="docTitle"
                            value={documentForm.title}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter document title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="docType">Document Type</Label>
                          <Select value={documentForm.type} onValueChange={(value: BusinessDocument['type']) => setDocumentForm(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="invoice">Invoice</SelectItem>
                              <SelectItem value="purchase_order">Purchase Order</SelectItem>
                              <SelectItem value="quotation">Quotation</SelectItem>
                              <SelectItem value="receipt">Receipt</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="certificate">Certificate</SelectItem>
                              <SelectItem value="report">Report</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="docNumber">Document Number</Label>
                          <Input
                            id="docNumber"
                            value={documentForm.documentNumber}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                            placeholder="e.g., INV-001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="docCategory">Category *</Label>
                          <Input
                            id="docCategory"
                            value={documentForm.category}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g., Finance, Legal, Operations"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="docDate">Document Date *</Label>
                          <Input
                            id="docDate"
                            type="date"
                            value={documentForm.date}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={documentForm.dueDate}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={documentForm.amount}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerName">Customer Name</Label>
                          <Input
                            id="customerName"
                            value={documentForm.customerName}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, customerName: e.target.value }))}
                            placeholder="Customer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vendorName">Vendor Name</Label>
                          <Input
                            id="vendorName"
                            value={documentForm.vendorName}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, vendorName: e.target.value }))}
                            placeholder="Vendor name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="docFolder">Folder</Label>
                          <Select value={documentForm.folderId} onValueChange={(value) => setDocumentForm(prev => ({ ...prev, folderId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select folder (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Root (No folder)</SelectItem>
                              {folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>{folder.path}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accessLevel">Access Level</Label>
                          <Select value={documentForm.accessLevel} onValueChange={(value: 'public' | 'restricted' | 'confidential') => setDocumentForm(prev => ({ ...prev, accessLevel: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public - All users can access</SelectItem>
                              <SelectItem value="restricted">Restricted - Limited role access</SelectItem>
                              <SelectItem value="confidential">Confidential - Owner/Co-founder only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={documentForm.status} onValueChange={(value: BusinessDocument['status']) => setDocumentForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="tags">Tags (comma-separated)</Label>
                          <Input
                            id="tags"
                            value={documentForm.tags}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="e.g., urgent, financial, approved"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={documentForm.description}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Document description"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateDocument}>
                          Upload Document
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documents">Documents ({filteredDocuments.length})</TabsTrigger>
              <TabsTrigger value="folders">Folders ({folders.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
            </TabsList>
            
            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents by title, description, tags, or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="purchase_order">Purchase Order</SelectItem>
                    <SelectItem value="quotation">Quotation</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.accessLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, accessLevel: value }))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Access Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDocuments.map((document) => (
                  <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getFileIcon(document.mimeType)}
                            <CardTitle className="text-lg truncate">{document.title}</CardTitle>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {document.fileName} • {formatFileSize(document.fileSize)}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className={getStatusBadge(document.status)}>
                              {document.status.toUpperCase()}
                            </Badge>
                            <Badge className={getAccessLevelBadge(document.accessLevel)}>
                              {document.accessLevel === 'public' ? <Unlock className="w-3 h-3 mr-1" /> : 
                               document.accessLevel === 'restricted' ? <Shield className="w-3 h-3 mr-1" /> :
                               <Lock className="w-3 h-3 mr-1" />}
                              {document.accessLevel.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="capitalize">{document.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{document.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{formatDate(document.date)}</span>
                        </div>
                        {document.amount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(document.amount)}
                            </span>
                          </div>
                        )}
                        {document.customerName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span className="truncate">{document.customerName}</span>
                          </div>
                        )}
                        {document.vendorName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vendor:</span>
                            <span className="truncate">{document.vendorName}</span>
                          </div>
                        )}
                      </div>
                      
                      {document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {document.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{document.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {document.description && (
                        <div className="text-sm italic text-muted-foreground">
                          "{document.description}"
                        </div>
                      )}
                      
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        <div>Created by: {document.createdByName}</div>
                        <div>Date: {formatDate(document.createdAt)}</div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDocument(document)}>
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(document)}>
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                        {canDeleteDocument(document) && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredDocuments.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No documents found. Upload your first document to get started.
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Folders Tab */}
            <TabsContent value="folders" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.map((folder) => (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: folder.color + '20' }}
                        >
                          <Folder className="h-5 w-5" style={{ color: folder.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{folder.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {folder.documentCount} documents
                          </div>
                        </div>
                      </div>
                      
                      {folder.description && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          {folder.description}
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center justify-between">
                        <Badge className={getAccessLevelBadge(folder.accessLevel)}>
                          {folder.accessLevel === 'public' ? <Unlock className="w-3 h-3 mr-1" /> : 
                           folder.accessLevel === 'restricted' ? <Shield className="w-3 h-3 mr-1" /> :
                           <Lock className="w-3 h-3 mr-1" />}
                          {folder.accessLevel.toUpperCase()}
                        </Badge>
                        
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setFilters(prev => ({ ...prev, folderId: folder.id }))}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {hasPermission('edit_product') && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        Created: {formatDate(folder.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {folders.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No folders created yet. Create your first folder to organize documents.
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-4">
                {activities.slice(0, 50).map((activity) => {
                  const document = documents.find(doc => doc.id === activity.documentId);
                  return (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{activity.userName}</span>
                              <span className="text-sm text-muted-foreground">
                                {activity.action} {document ? `"${document.title}"` : 'a document'}
                              </span>
                            </div>
                            {activity.details && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {activity.details}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              {new Date(activity.timestamp).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {activities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentVault;
