import React, { useState, useEffect } from 'react';
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
import { dataManager } from '@/lib/data-manager';
import BackButton from '@/components/BackButton';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  Gift,
  TrendingUp,
  Star,
  MessageCircle,
  Clock,
  DollarSign,
  Bell,
  AlertTriangle,
  CheckCircle,
  User,
  Heart,
  ShoppingCart,
  Activity,
  Filter,
  Download,
  UserPlus,
  History,
  Target,
  BarChart3
} from 'lucide-react';
import { SmartImportButton } from '@/components/import/SmartImportButton';
import SmartImportModal from '@/components/import/SmartImportModal';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dateOfBirth?: string;
  anniversary?: string;
  company?: string;
  designation?: string;
  source: 'website' | 'referral' | 'advertisement' | 'walk_in' | 'social_media' | 'other';
  segment: 'high_value' | 'medium_value' | 'low_value' | 'vip' | 'new' | 'at_risk';
  status: 'active' | 'inactive' | 'prospect' | 'lead' | 'lost';
  preferredContactMethod: 'phone' | 'email' | 'whatsapp' | 'sms';
  tags: string[];
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  loyaltyPoints: number;
  creditLimit?: number;
  paymentTerms?: string;
  gstNumber?: string;
  businessType?: string;
  referredBy?: string;
}

interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'call' | 'email' | 'meeting' | 'order' | 'complaint' | 'feedback' | 'follow_up' | 'support';
  subject: string;
  description: string;
  outcome: 'successful' | 'unsuccessful' | 'pending' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  completedDate?: string;
  nextActionRequired?: string;
  nextActionDate?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

interface FollowUpReminder {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  type: 'call' | 'email' | 'meeting' | 'order_follow_up' | 'birthday' | 'anniversary' | 'payment_reminder' | 'service_reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  dueTime?: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  completedNotes?: string;
}

interface CustomerFilters {
  segment: string;
  status: string;
  source: string;
  tags: string;
  lastContactDays: string;
}

const CRM: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  
  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({
    segment: 'all',
    status: 'all',
    source: 'all',
    tags: 'all',
    lastContactDays: 'all'
  });
  
  // Dialog states
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingInteraction, setEditingInteraction] = useState<CustomerInteraction | null>(null);
  const [editingReminder, setEditingReminder] = useState<FollowUpReminder | null>(null);
  
  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    anniversary: '',
    company: '',
    designation: '',
    source: 'walk_in' as const,
    segment: 'new' as const,
    status: 'prospect' as const,
    preferredContactMethod: 'phone' as const,
    tags: '',
    notes: '',
    creditLimit: '',
    paymentTerms: '',
    gstNumber: '',
    businessType: '',
    referredBy: ''
  });
  
  const [interactionForm, setInteractionForm] = useState({
    customerId: '',
    type: 'call' as const,
    subject: '',
    description: '',
    outcome: 'pending' as const,
    priority: 'medium' as const,
    scheduledDate: '',
    nextActionRequired: '',
    nextActionDate: ''
  });
  
  const [reminderForm, setReminderForm] = useState({
    customerId: '',
    title: '',
    description: '',
    type: 'call' as const,
    priority: 'medium' as const,
    dueDate: '',
    dueTime: '',
    assignedTo: ''
  });

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // Load customers from localStorage
    const savedCustomers = localStorage.getItem('insygth_customers');
    const customersData = savedCustomers ? JSON.parse(savedCustomers) : [];
    
    // Load interactions from localStorage
    const savedInteractions = localStorage.getItem('insygth_customer_interactions');
    const interactionsData = savedInteractions ? JSON.parse(savedInteractions) : [];
    
    // Load reminders from localStorage
    const savedReminders = localStorage.getItem('insygth_follow_up_reminders');
    const remindersData = savedReminders ? JSON.parse(savedReminders) : [];
    
    // Enhance customers with calculated data
    const enhancedCustomers = customersData.map((customer: Customer) => {
      const customerInteractions = interactionsData.filter((interaction: CustomerInteraction) => 
        interaction.customerId === customer.id
      );
      
      const lastInteraction = customerInteractions
        .filter((i: CustomerInteraction) => i.completedDate)
        .sort((a: CustomerInteraction, b: CustomerInteraction) => 
          new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime()
        )[0];
      
      return {
        ...customer,
        lastContactDate: lastInteraction?.completedDate
      };
    });
    
    setCustomers(enhancedCustomers);
    setInteractions(interactionsData);
    setReminders(remindersData);
    setLoading(false);
  };

  const saveCustomers = (customersData: Customer[]) => {
    localStorage.setItem('insygth_customers', JSON.stringify(customersData));
  };

  const saveInteractions = (interactionsData: CustomerInteraction[]) => {
    localStorage.setItem('insygth_customer_interactions', JSON.stringify(interactionsData));
  };

  const saveReminders = (remindersData: FollowUpReminder[]) => {
    localStorage.setItem('insygth_follow_up_reminders', JSON.stringify(remindersData));
  };

  // Customer CRUD operations
  const handleCreateCustomer = () => {
    const validation = validateCustomerForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) return;

    // Check for duplicate customers
    const existingCustomer = customers.find(c => 
      c.phone === customerForm.phone || 
      (customerForm.email && c.email === customerForm.email)
    );
    
    if (existingCustomer) {
      toast({
        title: "Duplicate Customer",
        description: "Customer with this phone or email already exists",
        variant: "destructive"
      });
      return;
    }

    const newCustomer: Customer = {
      id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customerForm.name,
      email: customerForm.email,
      phone: customerForm.phone,
      alternatePhone: customerForm.alternatePhone,
      address: customerForm.address,
      city: customerForm.city,
      state: customerForm.state,
      pincode: customerForm.pincode,
      dateOfBirth: customerForm.dateOfBirth,
      anniversary: customerForm.anniversary,
      company: customerForm.company,
      designation: customerForm.designation,
      source: customerForm.source,
      segment: customerForm.segment,
      status: customerForm.status,
      preferredContactMethod: customerForm.preferredContactMethod,
      tags: customerForm.tags ? customerForm.tags.split(',').map(tag => tag.trim()) : [],
      notes: customerForm.notes,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      loyaltyPoints: 0,
      creditLimit: customerForm.creditLimit ? parseFloat(customerForm.creditLimit) : undefined,
      paymentTerms: customerForm.paymentTerms,
      gstNumber: customerForm.gstNumber,
      businessType: customerForm.businessType,
      referredBy: customerForm.referredBy
    };

    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
    
    // Create welcome follow-up reminder
    createWelcomeReminder(newCustomer);
    
    resetCustomerForm();
    setCustomerDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Customer added successfully",
    });
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer) return;

    const validation = validateCustomerForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const updatedCustomers = customers.map(customer => 
      customer.id === editingCustomer.id 
        ? {
            ...customer,
            name: customerForm.name,
            email: customerForm.email,
            phone: customerForm.phone,
            alternatePhone: customerForm.alternatePhone,
            address: customerForm.address,
            city: customerForm.city,
            state: customerForm.state,
            pincode: customerForm.pincode,
            dateOfBirth: customerForm.dateOfBirth,
            anniversary: customerForm.anniversary,
            company: customerForm.company,
            designation: customerForm.designation,
            source: customerForm.source,
            segment: customerForm.segment,
            status: customerForm.status,
            preferredContactMethod: customerForm.preferredContactMethod,
            tags: customerForm.tags ? customerForm.tags.split(',').map(tag => tag.trim()) : [],
            notes: customerForm.notes,
            creditLimit: customerForm.creditLimit ? parseFloat(customerForm.creditLimit) : undefined,
            paymentTerms: customerForm.paymentTerms,
            gstNumber: customerForm.gstNumber,
            businessType: customerForm.businessType,
            referredBy: customerForm.referredBy,
            updatedAt: new Date().toISOString()
          }
        : customer
    );

    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
    resetCustomerForm();
    setEditingCustomer(null);
    setCustomerDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Customer updated successfully",
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    const relatedInteractions = interactions.filter(interaction => interaction.customerId === customerId);
    const relatedReminders = reminders.filter(reminder => reminder.customerId === customerId);
    
    if (relatedInteractions.length > 0 || relatedReminders.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete customer with existing interactions or reminders. Archive customer instead.",
        variant: "destructive"
      });
      return;
    }

    const updatedCustomers = customers.filter(customer => customer.id !== customerId);
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
    
    toast({
      title: "Success",
      description: "Customer deleted successfully",
    });
  };

  // Interaction CRUD operations
  const handleCreateInteraction = () => {
    const validation = validateInteractionForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) return;

    const newInteraction: CustomerInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: interactionForm.customerId,
      type: interactionForm.type,
      subject: interactionForm.subject,
      description: interactionForm.description,
      outcome: interactionForm.outcome,
      priority: interactionForm.priority,
      scheduledDate: interactionForm.scheduledDate,
      completedDate: interactionForm.outcome !== 'pending' && interactionForm.outcome !== 'scheduled' ? 
        new Date().toISOString() : undefined,
      nextActionRequired: interactionForm.nextActionRequired,
      nextActionDate: interactionForm.nextActionDate,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedInteractions = [...interactions, newInteraction];
    setInteractions(updatedInteractions);
    saveInteractions(updatedInteractions);
    
    // Create follow-up reminder if needed
    if (interactionForm.nextActionRequired && interactionForm.nextActionDate) {
      createFollowUpReminder(newInteraction);
    }
    
    resetInteractionForm();
    setInteractionDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Interaction recorded successfully",
    });
  };

  // Follow-up reminder CRUD operations
  const handleCreateReminder = () => {
    const validation = validateReminderForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) return;

    const customer = customers.find(c => c.id === reminderForm.customerId);
    if (!customer) return;

    const newReminder: FollowUpReminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: reminderForm.customerId,
      customerName: customer.name,
      title: reminderForm.title,
      description: reminderForm.description,
      type: reminderForm.type,
      priority: reminderForm.priority,
      dueDate: reminderForm.dueDate,
      dueTime: reminderForm.dueTime,
      status: 'pending',
      assignedTo: reminderForm.assignedTo || currentUser.id,
      assignedToName: currentUser.name, // This should be looked up based on assignedTo
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
    resetReminderForm();
    setReminderDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Follow-up reminder created successfully",
    });
  };

  const handleCompleteReminder = (reminderId: string, notes?: string) => {
    if (!currentUser) return;

    const updatedReminders = reminders.map(reminder => 
      reminder.id === reminderId 
        ? {
            ...reminder,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            completedBy: currentUser.id,
            completedNotes: notes
          }
        : reminder
    );

    setReminders(updatedReminders);
    saveReminders(updatedReminders);
    
    toast({
      title: "Success",
      description: "Reminder marked as completed",
    });
  };

  // Utility functions for creating automatic reminders
  const createWelcomeReminder = (customer: Customer) => {
    if (!currentUser) return;

    const welcomeReminder: FollowUpReminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: customer.id,
      customerName: customer.name,
      title: `Welcome call for ${customer.name}`,
      description: `Make a welcome call to new customer ${customer.name} to introduce our services and answer any questions.`,
      type: 'call',
      priority: 'medium',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      dueTime: '10:00',
      status: 'pending',
      assignedTo: currentUser.id,
      assignedToName: currentUser.name,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    const updatedReminders = [...reminders, welcomeReminder];
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const createFollowUpReminder = (interaction: CustomerInteraction) => {
    if (!currentUser || !interaction.nextActionDate || !interaction.nextActionRequired) return;

    const customer = customers.find(c => c.id === interaction.customerId);
    if (!customer) return;

    const followUpReminder: FollowUpReminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: interaction.customerId,
      customerName: customer.name,
      title: interaction.nextActionRequired,
      description: `Follow-up action required: ${interaction.nextActionRequired}`,
      type: 'follow_up',
      priority: interaction.priority,
      dueDate: interaction.nextActionDate,
      status: 'pending',
      assignedTo: currentUser.id,
      assignedToName: currentUser.name,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    const updatedReminders = [...reminders, followUpReminder];
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  // Validation functions
  const validateCustomerForm = () => {
    const errors: string[] = [];
    
    if (!customerForm.name.trim()) errors.push('Customer name is required');
    if (!customerForm.phone.trim()) errors.push('Phone number is required');
    
    if (customerForm.phone && !/^\d{10}$/.test(customerForm.phone.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid 10-digit phone number');
    }
    
    if (customerForm.alternatePhone && !/^\d{10}$/.test(customerForm.alternatePhone.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid 10-digit alternate phone number');
    }
    
    if (customerForm.email && !/\S+@\S+\.\S+/.test(customerForm.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (customerForm.pincode && !/^\d{6}$/.test(customerForm.pincode)) {
      errors.push('Please enter a valid 6-digit pincode');
    }
    
    if (customerForm.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(customerForm.gstNumber)) {
      errors.push('Please enter a valid GST number');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateInteractionForm = () => {
    const errors: string[] = [];
    
    if (!interactionForm.customerId) errors.push('Customer selection is required');
    if (!interactionForm.subject.trim()) errors.push('Subject is required');
    if (!interactionForm.description.trim()) errors.push('Description is required');
    
    if (interactionForm.nextActionDate && !interactionForm.nextActionRequired.trim()) {
      errors.push('Next action required when next action date is specified');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateReminderForm = () => {
    const errors: string[] = [];
    
    if (!reminderForm.customerId) errors.push('Customer selection is required');
    if (!reminderForm.title.trim()) errors.push('Title is required');
    if (!reminderForm.description.trim()) errors.push('Description is required');
    if (!reminderForm.dueDate) errors.push('Due date is required');
    
    return { isValid: errors.length === 0, errors };
  };

  // Form reset functions
  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      dateOfBirth: '',
      anniversary: '',
      company: '',
      designation: '',
      source: 'walk_in',
      segment: 'new',
      status: 'prospect',
      preferredContactMethod: 'phone',
      tags: '',
      notes: '',
      creditLimit: '',
      paymentTerms: '',
      gstNumber: '',
      businessType: '',
      referredBy: ''
    });
  };

  const resetInteractionForm = () => {
    setInteractionForm({
      customerId: '',
      type: 'call',
      subject: '',
      description: '',
      outcome: 'pending',
      priority: 'medium',
      scheduledDate: '',
      nextActionRequired: '',
      nextActionDate: ''
    });
  };

  const resetReminderForm = () => {
    setReminderForm({
      customerId: '',
      title: '',
      description: '',
      type: 'call',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      assignedTo: ''
    });
  };

  // Edit handlers
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      alternatePhone: customer.alternatePhone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      dateOfBirth: customer.dateOfBirth || '',
      anniversary: customer.anniversary || '',
      company: customer.company || '',
      designation: customer.designation || '',
      source: customer.source,
      segment: customer.segment,
      status: customer.status,
      preferredContactMethod: customer.preferredContactMethod,
      tags: customer.tags.join(', '),
      notes: customer.notes,
      creditLimit: customer.creditLimit?.toString() || '',
      paymentTerms: customer.paymentTerms || '',
      gstNumber: customer.gstNumber || '',
      businessType: customer.businessType || '',
      referredBy: customer.referredBy || ''
    });
    setCustomerDialogOpen(true);
  };

  // Filter and search functions
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSegment = filters.segment === 'all' || customer.segment === filters.segment;
    const matchesStatus = filters.status === 'all' || customer.status === filters.status;
    const matchesSource = filters.source === 'all' || customer.source === filters.source;
    
    // Tag filtering
    const matchesTags = filters.tags === 'all' || 
                       customer.tags.some(tag => tag.toLowerCase().includes(filters.tags.toLowerCase()));
    
    // Last contact filtering
    let matchesLastContact = true;
    if (filters.lastContactDays !== 'all' && customer.lastContactDate) {
      const daysDiff = Math.floor((Date.now() - new Date(customer.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
      switch (filters.lastContactDays) {
        case '7':
          matchesLastContact = daysDiff <= 7;
          break;
        case '30':
          matchesLastContact = daysDiff <= 30;
          break;
        case '90':
          matchesLastContact = daysDiff <= 90;
          break;
        case 'never':
          matchesLastContact = !customer.lastContactDate;
          break;
      }
    }
    
    return matchesSearch && matchesSegment && matchesStatus && matchesSource && matchesTags && matchesLastContact;
  });

  // Get overdue reminders
  const overdueReminders = reminders.filter(reminder => 
    reminder.status === 'pending' && 
    new Date(reminder.dueDate) < new Date()
  );

  // Get today's reminders
  const todaysReminders = reminders.filter(reminder => 
    reminder.status === 'pending' && 
    reminder.dueDate === new Date().toISOString().split('T')[0]
  );

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

  const getSegmentBadge = (segment: string) => {
    const variants = {
      vip: 'bg-purple-100 text-purple-800',
      high_value: 'bg-green-100 text-green-800',
      medium_value: 'bg-blue-100 text-blue-800',
      low_value: 'bg-yellow-100 text-yellow-800',
      new: 'bg-gray-100 text-gray-800',
      at_risk: 'bg-red-100 text-red-800'
    };
    return variants[segment as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      prospect: 'bg-blue-100 text-blue-800',
      lead: 'bg-yellow-100 text-yellow-800',
      lost: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return variants[priority as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const exportData = () => {
    if (!hasPermission('export_reports')) return;
    
    const data = {
      customers: filteredCustomers,
      interactions,
      reminders,
      exportDate: new Date().toISOString(),
      summary: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        pendingReminders: reminders.filter(r => r.status === 'pending').length,
        overdueReminders: overdueReminders.length
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "CRM data exported successfully",
    });
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
            <p className="text-muted-foreground">You don't have permission to view CRM.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading CRM...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Alert for overdue reminders */}
      {overdueReminders.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">
                You have {overdueReminders.length} overdue reminder{overdueReminders.length > 1 ? 's' : ''}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setActiveTab('reminders')}
                className="ml-auto"
              >
                View Reminders
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Reminders</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysReminders.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdueReminders.length} overdue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer lifetime value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                customers.length > 0 ? 
                customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length : 
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Customer Relationship Management</CardTitle>
              <CardDescription>
                Manage customer relationships, track interactions, and schedule follow-ups
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <SmartImportButton onImport={()=> setShowImport(true)} />
              {hasPermission('create_product') && (
                <>
                  <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { resetCustomerForm(); setEditingCustomer(null); }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customerName">Customer Name *</Label>
                          <Input
                            id="customerName"
                            value={customerForm.name}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter customer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={customerForm.phone}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="10-digit phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={customerForm.email}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="customer@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alternatePhone">Alternate Phone</Label>
                          <Input
                            id="alternatePhone"
                            value={customerForm.alternatePhone}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, alternatePhone: e.target.value }))}
                            placeholder="Alternate phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={customerForm.company}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="designation">Designation</Label>
                          <Input
                            id="designation"
                            value={customerForm.designation}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, designation: e.target.value }))}
                            placeholder="Job title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={customerForm.city}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={customerForm.state}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="State"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={customerForm.pincode}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, pincode: e.target.value }))}
                            placeholder="6-digit pincode"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="source">Source</Label>
                          <Select value={customerForm.source} onValueChange={(value: Customer['source']) => setCustomerForm(prev => ({ ...prev, source: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="referral">Referral</SelectItem>
                              <SelectItem value="advertisement">Advertisement</SelectItem>
                              <SelectItem value="walk_in">Walk-in</SelectItem>
                              <SelectItem value="social_media">Social Media</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="segment">Segment</Label>
                          <Select value={customerForm.segment} onValueChange={(value: Customer['segment']) => setCustomerForm(prev => ({ ...prev, segment: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="high_value">High Value</SelectItem>
                              <SelectItem value="medium_value">Medium Value</SelectItem>
                              <SelectItem value="low_value">Low Value</SelectItem>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="at_risk">At Risk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={customerForm.status} onValueChange={(value: Customer['status']) => setCustomerForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="prospect">Prospect</SelectItem>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preferredContactMethod">Preferred Contact</Label>
                          <Select value={customerForm.preferredContactMethod} onValueChange={(value: Customer['preferredContactMethod']) => setCustomerForm(prev => ({ ...prev, preferredContactMethod: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={customerForm.dateOfBirth}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="anniversary">Anniversary</Label>
                          <Input
                            id="anniversary"
                            type="date"
                            value={customerForm.anniversary}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, anniversary: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gstNumber">GST Number</Label>
                          <Input
                            id="gstNumber"
                            value={customerForm.gstNumber}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                            placeholder="15-digit GST number"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2 lg:col-span-3">
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={customerForm.address}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Complete address"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2 lg:col-span-3">
                          <Label htmlFor="tags">Tags (comma-separated)</Label>
                          <Input
                            id="tags"
                            value={customerForm.tags}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="e.g., vip, bulk-buyer, regular"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2 lg:col-span-3">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={customerForm.notes}
                            onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about the customer"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}>
                          {editingCustomer ? 'Update' : 'Create'} Customer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => { resetReminderForm(); setEditingReminder(null); }}>
                        <Bell className="mr-2 h-4 w-4" />
                        Add Reminder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Follow-up Reminder</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reminderCustomer">Customer *</Label>
                          <Select value={reminderForm.customerId} onValueChange={(value) => setReminderForm(prev => ({ ...prev, customerId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name} - {customer.phone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reminderTitle">Title *</Label>
                          <Input
                            id="reminderTitle"
                            value={reminderForm.title}
                            onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Follow-up call"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reminderType">Type</Label>
                          <Select value={reminderForm.type} onValueChange={(value: FollowUpReminder['type']) => setReminderForm(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Phone Call</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="order_follow_up">Order Follow-up</SelectItem>
                              <SelectItem value="birthday">Birthday</SelectItem>
                              <SelectItem value="anniversary">Anniversary</SelectItem>
                              <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                              <SelectItem value="service_reminder">Service Reminder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reminderPriority">Priority</Label>
                          <Select value={reminderForm.priority} onValueChange={(value: FollowUpReminder['priority']) => setReminderForm(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="reminderDueDate">Due Date *</Label>
                            <Input
                              id="reminderDueDate"
                              type="date"
                              value={reminderForm.dueDate}
                              onChange={(e) => setReminderForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reminderDueTime">Due Time</Label>
                            <Input
                              id="reminderDueTime"
                              type="time"
                              value={reminderForm.dueTime}
                              onChange={(e) => setReminderForm(prev => ({ ...prev, dueTime: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reminderDescription">Description *</Label>
                          <Textarea
                            id="reminderDescription"
                            value={reminderForm.description}
                            onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what needs to be done"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateReminder}>
                          Create Reminder
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {hasPermission('export_reports') && (
                <Button variant="outline" onClick={exportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customers">Customers ({filteredCustomers.length})</TabsTrigger>
              <TabsTrigger value="reminders">
                Reminders ({reminders.filter(r => r.status === 'pending').length})
                {overdueReminders.length > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800">{overdueReminders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="interactions">Interactions ({interactions.length})</TabsTrigger>
            </TabsList>
            
            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers by name, phone, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filters.segment} onValueChange={(value) => setFilters(prev => ({ ...prev, segment: value }))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="high_value">High Value</SelectItem>
                    <SelectItem value="medium_value">Medium Value</SelectItem>
                    <SelectItem value="low_value">Low Value</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.lastContactDays} onValueChange={(value) => setFilters(prev => ({ ...prev, lastContactDays: value }))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Last Contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="never">Never contacted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{customer.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {customer.company && `${customer.company} • `}{customer.phone}
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getSegmentBadge(customer.segment)}>
                              {customer.segment.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge className={getStatusBadge(customer.status)}>
                              {customer.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Spent</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-2">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.city && customer.state && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.city}, {customer.state}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Orders</div>
                          <div className="font-medium">{customer.totalOrders}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Order</div>
                          <div className="font-medium">{formatCurrency(customer.averageOrderValue)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Loyalty Points</div>
                          <div className="font-medium">{customer.loyaltyPoints}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Source</div>
                          <div className="font-medium capitalize">{customer.source.replace('_', ' ')}</div>
                        </div>
                      </div>
                      
                      {customer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {customer.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{customer.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        <div>Added: {formatDate(customer.createdAt)}</div>
                        {customer.lastContactDate && (
                          <div>Last contact: {formatDate(customer.lastContactDate)}</div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {hasPermission('edit_product') && (
                          <Button size="sm" variant="outline" onClick={() => handleEditCustomer(customer)}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        {hasPermission('delete_product') && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteCustomer(customer.id)}
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
                {filteredCustomers.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No customers found. Add your first customer to get started.
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Reminders Tab */}
            <TabsContent value="reminders" className="space-y-4">
              <div className="space-y-4">
                {reminders.filter(r => r.status === 'pending').map((reminder) => {
                  const isOverdue = new Date(reminder.dueDate) < new Date();
                  const isToday = reminder.dueDate === new Date().toISOString().split('T')[0];
                  
                  return (
                    <Card key={reminder.id} className={`${isOverdue ? 'border-red-200 bg-red-50' : isToday ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{reminder.title}</div>
                              <Badge className={getPriorityBadge(reminder.priority)}>
                                {reminder.priority.toUpperCase()}
                              </Badge>
                              {isOverdue && <Badge className="bg-red-100 text-red-800">OVERDUE</Badge>}
                              {isToday && <Badge className="bg-yellow-100 text-yellow-800">TODAY</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Customer: {reminder.customerName}
                            </div>
                            <div className="text-sm">
                              {reminder.description}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(reminder.dueDate)}
                                {reminder.dueTime && ` at ${reminder.dueTime}`}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {reminder.assignedToName}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteReminder(reminder.id, 'Completed manually')}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Complete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {reminders.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending reminders. Great job staying on top of follow-ups!
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Interactions Tab */}
            <TabsContent value="interactions" className="space-y-4">
              <div className="space-y-4">
                {interactions.slice(0, 20).map((interaction) => {
                  const customer = customers.find(c => c.id === interaction.customerId);
                  return (
                    <Card key={interaction.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="font-medium">{interaction.subject}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer?.name} • {interaction.type.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="text-sm">{interaction.description}</div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div>By: {interaction.createdByName}</div>
                              <div>{formatDate(interaction.createdAt)}</div>
                              <Badge className={getPriorityBadge(interaction.priority)}>
                                {interaction.priority.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {interactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No interactions recorded yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {showImport && (
        <SmartImportModal open={showImport} onClose={()=>setShowImport(false)} module={"customers"} />
      )}
    </div>
  );
};

export default CRM;
