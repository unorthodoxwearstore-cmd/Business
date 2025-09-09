import { BusinessType } from '@shared/types';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  anniversary?: string;
  companyName?: string;
  gstNumber?: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
  loyaltyPoints?: number;
  tags: string[];
  isHighValue: boolean;
  customerType: 'individual' | 'business';
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CustomerPurchase {
  id: string;
  customerId: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  products: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  paymentMethod: 'cash' | 'credit' | 'bank_transfer' | 'upi' | 'card';
  status: 'completed' | 'pending' | 'cancelled';
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  customerName: string;
  type: 'call' | 'meeting' | 'email' | 'whatsapp' | 'visit';
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedBy: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  reminders: {
    id: string;
    type: 'email' | 'notification' | 'sms';
    beforeMinutes: number;
    sent: boolean;
    sentAt?: string;
  }[];
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'call' | 'meeting' | 'email' | 'whatsapp' | 'visit' | 'purchase' | 'complaint' | 'inquiry';
  title: string;
  description: string;
  date: string;
  staffId: string;
  staffName: string;
  outcome: 'positive' | 'neutral' | 'negative';
  followUpRequired: boolean;
  nextFollowUpDate?: string;
  attachments?: string[];
}

export interface CustomerTag {
  id: string;
  name: string;
  color: string;
  description: string;
  isSystem: boolean;
  createdBy: string;
  createdAt: string;
}

class CRMService {
  private readonly STORAGE_KEY = 'hisaabb_crm_data';
  private readonly CUSTOMERS_KEY = 'hisaabb_customers';
  private readonly PURCHASES_KEY = 'hisaabb_customer_purchases';
  private readonly FOLLOWUPS_KEY = 'hisaabb_customer_followups';
  private readonly INTERACTIONS_KEY = 'hisaabb_customer_interactions';
  private readonly TAGS_KEY = 'hisaabb_customer_tags';

  // Initialize default tags
  private initializeDefaultTags(): CustomerTag[] {
    return [
      {
        id: 'high-value',
        name: 'High Value',
        color: 'bg-green-100 text-green-800',
        description: 'Customers with high purchase value',
        isSystem: true,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      },
      {
        id: 'vip',
        name: 'VIP',
        color: 'bg-purple-100 text-purple-800',
        description: 'VIP customers requiring special attention',
        isSystem: true,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      },
      {
        id: 'regular',
        name: 'Regular',
        color: 'bg-blue-100 text-blue-800',
        description: 'Regular customers',
        isSystem: true,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      },
      {
        id: 'new',
        name: 'New Customer',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'New customers (within 30 days)',
        isSystem: true,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      },
      {
        id: 'inactive',
        name: 'Inactive',
        color: 'bg-red-100 text-red-800',
        description: 'Customers with no recent purchases',
        isSystem: true,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      }
    ];
  }

  // Customer Management
  getAllCustomers(): Customer[] {
    const customers = localStorage.getItem(this.CUSTOMERS_KEY);
    return customers ? JSON.parse(customers) : [];
  }

  getCustomerById(id: string): Customer | null {
    const customers = this.getAllCustomers();
    return customers.find(customer => customer.id === id) || null;
  }

  addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; customer?: Customer; message: string } {
    try {
      const customers = this.getAllCustomers();
      
      // Check for duplicate phone numbers
      const existingCustomer = customers.find(c => c.phone === customerData.phone);
      if (existingCustomer) {
        return { success: false, message: 'Customer with this phone number already exists' };
      }

      const customer: Customer = {
        ...customerData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      customers.push(customer);
      localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
      
      return { success: true, customer, message: 'Customer added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add customer' };
    }
  }

  updateCustomer(id: string, updates: Partial<Customer>): { success: boolean; customer?: Customer; message: string } {
    try {
      const customers = this.getAllCustomers();
      const index = customers.findIndex(customer => customer.id === id);
      
      if (index === -1) {
        return { success: false, message: 'Customer not found' };
      }

      const updatedCustomer = {
        ...customers[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      customers[index] = updatedCustomer;
      localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
      
      return { success: true, customer: updatedCustomer, message: 'Customer updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update customer' };
    }
  }

  deleteCustomer(id: string): { success: boolean; message: string } {
    try {
      const customers = this.getAllCustomers();
      const filteredCustomers = customers.filter(customer => customer.id !== id);
      
      localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(filteredCustomers));
      return { success: true, message: 'Customer deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to delete customer' };
    }
  }

  // Purchase History
  getCustomerPurchases(customerId: string): CustomerPurchase[] {
    const purchases = localStorage.getItem(this.PURCHASES_KEY);
    const allPurchases: CustomerPurchase[] = purchases ? JSON.parse(purchases) : [];
    return allPurchases.filter(purchase => purchase.customerId === customerId);
  }

  addCustomerPurchase(purchase: Omit<CustomerPurchase, 'id'>): { success: boolean; message: string } {
    try {
      const purchases = this.getCustomerPurchases('');
      const newPurchase: CustomerPurchase = {
        ...purchase,
        id: Date.now().toString()
      };

      purchases.push(newPurchase);
      localStorage.setItem(this.PURCHASES_KEY, JSON.stringify(purchases));

      // Update customer's total purchases and last purchase date
      const customer = this.getCustomerById(purchase.customerId);
      if (customer) {
        this.updateCustomer(customer.id, {
          totalPurchases: customer.totalPurchases + purchase.amount,
          lastPurchaseDate: purchase.date
        });
      }

      return { success: true, message: 'Purchase added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add purchase' };
    }
  }

  // Follow-up Management
  getAllFollowUps(): CustomerFollowUp[] {
    const followUps = localStorage.getItem(this.FOLLOWUPS_KEY);
    return followUps ? JSON.parse(followUps) : [];
  }

  getCustomerFollowUps(customerId: string): CustomerFollowUp[] {
    const followUps = this.getAllFollowUps();
    return followUps.filter(followUp => followUp.customerId === customerId);
  }

  addFollowUp(followUpData: Omit<CustomerFollowUp, 'id' | 'createdAt'>): { success: boolean; followUp?: CustomerFollowUp; message: string } {
    try {
      const followUps = this.getAllFollowUps();
      
      const followUp: CustomerFollowUp = {
        ...followUpData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      followUps.push(followUp);
      localStorage.setItem(this.FOLLOWUPS_KEY, JSON.stringify(followUps));
      
      return { success: true, followUp, message: 'Follow-up scheduled successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to schedule follow-up' };
    }
  }

  updateFollowUp(id: string, updates: Partial<CustomerFollowUp>): { success: boolean; message: string } {
    try {
      const followUps = this.getAllFollowUps();
      const index = followUps.findIndex(followUp => followUp.id === id);
      
      if (index === -1) {
        return { success: false, message: 'Follow-up not found' };
      }

      followUps[index] = { ...followUps[index], ...updates };
      localStorage.setItem(this.FOLLOWUPS_KEY, JSON.stringify(followUps));
      
      return { success: true, message: 'Follow-up updated successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to update follow-up' };
    }
  }

  // Customer Interactions
  addInteraction(interaction: Omit<CustomerInteraction, 'id'>): { success: boolean; message: string } {
    try {
      const interactions = this.getAllInteractions();
      const newInteraction: CustomerInteraction = {
        ...interaction,
        id: Date.now().toString()
      };

      interactions.push(newInteraction);
      localStorage.setItem(this.INTERACTIONS_KEY, JSON.stringify(interactions));
      
      return { success: true, message: 'Interaction recorded successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to record interaction' };
    }
  }

  getAllInteractions(): CustomerInteraction[] {
    const interactions = localStorage.getItem(this.INTERACTIONS_KEY);
    return interactions ? JSON.parse(interactions) : [];
  }

  getCustomerInteractions(customerId: string): CustomerInteraction[] {
    const interactions = this.getAllInteractions();
    return interactions.filter(interaction => interaction.customerId === customerId);
  }

  // Tags Management
  getAllTags(): CustomerTag[] {
    const tags = localStorage.getItem(this.TAGS_KEY);
    const existingTags = tags ? JSON.parse(tags) : [];
    
    // Initialize default tags if none exist
    if (existingTags.length === 0) {
      const defaultTags = this.initializeDefaultTags();
      localStorage.setItem(this.TAGS_KEY, JSON.stringify(defaultTags));
      return defaultTags;
    }
    
    return existingTags;
  }

  addTag(tagData: Omit<CustomerTag, 'id' | 'createdAt'>): { success: boolean; tag?: CustomerTag; message: string } {
    try {
      const tags = this.getAllTags();
      
      // Check for duplicate names
      const existingTag = tags.find(tag => tag.name.toLowerCase() === tagData.name.toLowerCase());
      if (existingTag) {
        return { success: false, message: 'Tag with this name already exists' };
      }

      const tag: CustomerTag = {
        ...tagData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      tags.push(tag);
      localStorage.setItem(this.TAGS_KEY, JSON.stringify(tags));
      
      return { success: true, tag, message: 'Tag created successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to create tag' };
    }
  }

  // Search and Filter
  searchCustomers(query: string, filters?: {
    tags?: string[];
    customerType?: 'individual' | 'business';
    isHighValue?: boolean;
    dateRange?: { start: string; end: string };
  }): Customer[] {
    const customers = this.getAllCustomers();
    
    return customers.filter(customer => {
      // Text search
      const matchesSearch = query === '' || 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query.toLowerCase()) ||
        customer.companyName?.toLowerCase().includes(query.toLowerCase());

      // Filter by tags
      const matchesTags = !filters?.tags?.length || 
        filters.tags.some(tag => customer.tags.includes(tag));

      // Filter by customer type
      const matchesType = !filters?.customerType || 
        customer.customerType === filters.customerType;

      // Filter by high value status
      const matchesHighValue = filters?.isHighValue === undefined || 
        customer.isHighValue === filters.isHighValue;

      // Filter by date range
      const matchesDateRange = !filters?.dateRange || 
        (customer.createdAt >= filters.dateRange.start && 
         customer.createdAt <= filters.dateRange.end);

      return matchesSearch && matchesTags && matchesType && matchesHighValue && matchesDateRange;
    });
  }

  // Analytics
  getCustomerAnalytics(): {
    totalCustomers: number;
    newCustomersThisMonth: number;
    highValueCustomers: number;
    averagePurchaseValue: number;
    topCustomersByValue: { customer: Customer; totalValue: number }[];
    customersByMonth: { month: string; count: number }[];
  } {
    const customers = this.getAllCustomers();
    const purchases = localStorage.getItem(this.PURCHASES_KEY);
    const allPurchases: CustomerPurchase[] = purchases ? JSON.parse(purchases) : [];

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const newCustomersThisMonth = customers.filter(customer => {
      const createdDate = new Date(customer.createdAt);
      return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
    }).length;

    const highValueCustomers = customers.filter(customer => customer.isHighValue).length;

    const totalPurchaseValue = allPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
    const averagePurchaseValue = allPurchases.length > 0 ? totalPurchaseValue / allPurchases.length : 0;

    // Top customers by purchase value
    const customerTotals = customers.map(customer => ({
      customer,
      totalValue: customer.totalPurchases
    })).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);

    // Customers by month for the last 12 months
    const customersByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(thisYear, thisMonth - i, 1);
      const monthCustomers = customers.filter(customer => {
        const createdDate = new Date(customer.createdAt);
        return createdDate.getMonth() === date.getMonth() && 
               createdDate.getFullYear() === date.getFullYear();
      }).length;

      customersByMonth.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: monthCustomers
      });
    }

    return {
      totalCustomers: customers.length,
      newCustomersThisMonth,
      highValueCustomers,
      averagePurchaseValue,
      topCustomersByValue: customerTotals,
      customersByMonth
    };
  }

  // Upcoming follow-ups and birthday reminders
  getUpcomingEvents(): {
    followUps: CustomerFollowUp[];
    birthdays: { customer: Customer; daysUntil: number }[];
    anniversaries: { customer: Customer; daysUntil: number }[];
  } {
    const followUps = this.getAllFollowUps()
      .filter(followUp => followUp.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 10);

    const customers = this.getAllCustomers();
    const now = new Date();
    const thisYear = now.getFullYear();

    const birthdays = customers
      .filter(customer => customer.dateOfBirth)
      .map(customer => {
        const birthDate = new Date(customer.dateOfBirth!);
        const thisYearBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());
        
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(thisYear + 1);
        }
        
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { customer, daysUntil };
      })
      .filter(item => item.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const anniversaries = customers
      .filter(customer => customer.anniversary)
      .map(customer => {
        const anniversaryDate = new Date(customer.anniversary!);
        const thisYearAnniversary = new Date(thisYear, anniversaryDate.getMonth(), anniversaryDate.getDate());
        
        if (thisYearAnniversary < now) {
          thisYearAnniversary.setFullYear(thisYear + 1);
        }
        
        const daysUntil = Math.ceil((thisYearAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { customer, daysUntil };
      })
      .filter(item => item.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      followUps,
      birthdays,
      anniversaries
    };
  }
}

export const crmService = new CRMService();
