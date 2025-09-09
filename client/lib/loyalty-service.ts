import { BusinessType } from '@shared/types';

export interface LoyaltyConfig {
  isEnabled: boolean;
  pointsEarningRate: number; // Points per rupee spent
  pointsRedemptionRate: number; // Rupees per point when redeeming
  minimumPointsToRedeem: number;
  maximumRedemptionPercentage: number; // Max % of bill that can be paid with points
  pointsExpiryDays: number; // 0 means no expiry
  welcomeBonusPoints: number;
  tierThresholds: {
    bronze: { minSpent: number; multiplier: number };
    silver: { minSpent: number; multiplier: number };
    gold: { minSpent: number; multiplier: number };
    platinum: { minSpent: number; multiplier: number };
  };
  businessTypes: BusinessType[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  joinedAt: string;
  totalSpent: number;
  totalVisits: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentPoints: number;
  lastVisit?: string;
  birthDate?: string;
  preferences?: string[];
}

export interface PointsTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjustment';
  points: number;
  invoiceId?: string;
  invoiceAmount?: number;
  description: string;
  expiryDate?: string;
  createdAt: string;
  createdBy: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: 'discount_percentage' | 'discount_fixed' | 'free_product' | 'cashback';
  value: number; // Percentage, fixed amount, or product value
  productId?: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  applicableCustomerTiers: ('bronze' | 'silver' | 'gold' | 'platinum')[];
  createdAt: string;
}

export interface RedemptionRequest {
  id: string;
  customerId: string;
  customerName: string;
  rewardId?: string;
  pointsToRedeem: number;
  cashValue: number;
  type: 'cash_discount' | 'reward_redemption';
  status: 'pending' | 'approved' | 'redeemed' | 'cancelled';
  invoiceId?: string;
  createdAt: string;
  redeemedAt?: string;
  redeemedBy?: string;
}

class LoyaltyService {
  private config: LoyaltyConfig;
  private customers: Customer[] = [];
  private pointsTransactions: PointsTransaction[] = [];
  private rewards: LoyaltyReward[] = [];
  private redemptionRequests: RedemptionRequest[] = [];

  constructor() {
    this.loadConfig();
    this.loadData();
    this.generateSampleData();
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('loyalty_config');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    } else {
      this.config = {
        isEnabled: true,
        pointsEarningRate: 1, // 1 point per rupee
        pointsRedemptionRate: 1, // 1 rupee per point
        minimumPointsToRedeem: 100,
        maximumRedemptionPercentage: 50,
        pointsExpiryDays: 365, // 1 year
        welcomeBonusPoints: 100,
        tierThresholds: {
          bronze: { minSpent: 0, multiplier: 1.0 },
          silver: { minSpent: 10000, multiplier: 1.2 },
          gold: { minSpent: 50000, multiplier: 1.5 },
          platinum: { minSpent: 100000, multiplier: 2.0 }
        },
        businessTypes: ['retailer', 'ecommerce', 'service']
      };
      this.saveConfig();
    }
  }

  private loadData(): void {
    const savedCustomers = localStorage.getItem('loyalty_customers');
    const savedTransactions = localStorage.getItem('loyalty_transactions');
    const savedRewards = localStorage.getItem('loyalty_rewards');
    const savedRedemptions = localStorage.getItem('loyalty_redemptions');

    if (savedCustomers) this.customers = JSON.parse(savedCustomers);
    if (savedTransactions) this.pointsTransactions = JSON.parse(savedTransactions);
    if (savedRewards) this.rewards = JSON.parse(savedRewards);
    if (savedRedemptions) this.redemptionRequests = JSON.parse(savedRedemptions);
  }

  private saveConfig(): void {
    localStorage.setItem('loyalty_config', JSON.stringify(this.config));
  }

  private saveData(): void {
    localStorage.setItem('loyalty_customers', JSON.stringify(this.customers));
    localStorage.setItem('loyalty_transactions', JSON.stringify(this.pointsTransactions));
    localStorage.setItem('loyalty_rewards', JSON.stringify(this.rewards));
    localStorage.setItem('loyalty_redemptions', JSON.stringify(this.redemptionRequests));
  }

  private generateSampleData(): void {
    // Sample data generation removed for production
    if (false && this.customers.length === 0) {
      const now = new Date();
      
      // Sample customers
      const sampleCustomers: Customer[] = [
        {
          id: 'cust_001',
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          email: 'rajesh@example.com',
          joinedAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          totalSpent: 75000,
          totalVisits: 45,
          loyaltyTier: 'gold',
          totalPointsEarned: 90000,
          totalPointsRedeemed: 15000,
          currentPoints: 75000,
          lastVisit: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          birthDate: '1985-03-15',
          preferences: ['electronics', 'books']
        },
        {
          id: 'cust_002',
          name: 'Priya Sharma',
          phone: '+91 87654 32109',
          email: 'priya@example.com',
          joinedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          totalSpent: 25000,
          totalVisits: 18,
          loyaltyTier: 'silver',
          totalPointsEarned: 30000,
          totalPointsRedeemed: 5000,
          currentPoints: 25000,
          lastVisit: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          birthDate: '1990-07-22',
          preferences: ['fashion', 'beauty']
        },
        {
          id: 'cust_003',
          name: 'Amit Patel',
          phone: '+91 76543 21098',
          joinedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          totalSpent: 8500,
          totalVisits: 8,
          loyaltyTier: 'bronze',
          totalPointsEarned: 8600, // includes welcome bonus
          totalPointsRedeemed: 0,
          currentPoints: 8600,
          lastVisit: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          preferences: ['groceries', 'home']
        }
      ];

      // Sample rewards
      const sampleRewards: LoyaltyReward[] = [
        {
          id: 'reward_001',
          title: '10% Off Next Purchase',
          description: 'Get 10% discount on your next purchase',
          pointsCost: 500,
          type: 'discount_percentage',
          value: 10,
          isActive: true,
          validFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          usageLimit: 100,
          usageCount: 15,
          applicableCustomerTiers: ['bronze', 'silver', 'gold', 'platinum'],
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'reward_002',
          title: '₹100 Cash Discount',
          description: 'Get ₹100 off on purchases above ₹1000',
          pointsCost: 1000,
          type: 'discount_fixed',
          value: 100,
          isActive: true,
          validFrom: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          usageLimit: 50,
          usageCount: 8,
          applicableCustomerTiers: ['silver', 'gold', 'platinum'],
          createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'reward_003',
          title: 'Free Premium Service',
          description: 'Complimentary premium service worth ₹500',
          pointsCost: 2500,
          type: 'free_product',
          value: 500,
          isActive: true,
          validFrom: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          usageLimit: 20,
          usageCount: 2,
          applicableCustomerTiers: ['gold', 'platinum'],
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      this.customers = sampleCustomers;
      this.rewards = sampleRewards;
      this.saveData();
    }
  }

  public getConfig(): LoyaltyConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<LoyaltyConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  public getCustomers(): Customer[] {
    return [...this.customers].sort((a, b) => b.totalSpent - a.totalSpent);
  }

  public getCustomerById(customerId: string): Customer | undefined {
    return this.customers.find(c => c.id === customerId);
  }

  public addCustomer(customer: Omit<Customer, 'id' | 'joinedAt' | 'totalSpent' | 'totalVisits' | 'loyaltyTier' | 'totalPointsEarned' | 'totalPointsRedeemed' | 'currentPoints'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: `cust_${Date.now()}`,
      joinedAt: new Date().toISOString(),
      totalSpent: 0,
      totalVisits: 0,
      loyaltyTier: 'bronze',
      totalPointsEarned: this.config.welcomeBonusPoints,
      totalPointsRedeemed: 0,
      currentPoints: this.config.welcomeBonusPoints
    };

    this.customers.push(newCustomer);

    // Add welcome bonus transaction
    if (this.config.welcomeBonusPoints > 0) {
      this.addPointsTransaction({
        customerId: newCustomer.id,
        type: 'bonus',
        points: this.config.welcomeBonusPoints,
        description: 'Welcome bonus for new customer',
        createdBy: 'system'
      });
    }

    this.saveData();
    return newCustomer;
  }

  public updateCustomer(customerId: string, updates: Partial<Customer>): boolean {
    const customerIndex = this.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return false;

    this.customers[customerIndex] = { ...this.customers[customerIndex], ...updates };
    this.saveData();
    return true;
  }

  public calculatePointsForPurchase(amount: number, customerId: string): number {
    const customer = this.getCustomerById(customerId);
    if (!customer) return 0;

    const tierMultiplier = this.config.tierThresholds[customer.loyaltyTier].multiplier;
    return Math.floor(amount * this.config.pointsEarningRate * tierMultiplier);
  }

  public awardPointsForPurchase(customerId: string, invoiceId: string, amount: number): PointsTransaction | null {
    if (!this.config.isEnabled) return null;

    const customer = this.getCustomerById(customerId);
    if (!customer) return null;

    const pointsEarned = this.calculatePointsForPurchase(amount, customerId);
    
    // Update customer stats
    customer.totalSpent += amount;
    customer.totalVisits += 1;
    customer.totalPointsEarned += pointsEarned;
    customer.currentPoints += pointsEarned;
    customer.lastVisit = new Date().toISOString();

    // Update loyalty tier
    customer.loyaltyTier = this.calculateLoyaltyTier(customer.totalSpent);

    // Create points transaction
    const transaction = this.addPointsTransaction({
      customerId,
      type: 'earned',
      points: pointsEarned,
      invoiceId,
      invoiceAmount: amount,
      description: `Points earned for purchase ${invoiceId}`,
      createdBy: 'system'
    });

    this.saveData();
    return transaction;
  }

  private calculateLoyaltyTier(totalSpent: number): Customer['loyaltyTier'] {
    const thresholds = this.config.tierThresholds;
    
    if (totalSpent >= thresholds.platinum.minSpent) return 'platinum';
    if (totalSpent >= thresholds.gold.minSpent) return 'gold';
    if (totalSpent >= thresholds.silver.minSpent) return 'silver';
    return 'bronze';
  }

  public addPointsTransaction(transaction: Omit<PointsTransaction, 'id' | 'createdAt'>): PointsTransaction {
    const newTransaction: PointsTransaction = {
      ...transaction,
      id: `pts_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    // Set expiry date for earned points
    if (transaction.type === 'earned' && this.config.pointsExpiryDays > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.config.pointsExpiryDays);
      newTransaction.expiryDate = expiryDate.toISOString();
    }

    this.pointsTransactions.unshift(newTransaction);

    // Keep only last 1000 transactions
    if (this.pointsTransactions.length > 1000) {
      this.pointsTransactions = this.pointsTransactions.slice(0, 1000);
    }

    this.saveData();
    return newTransaction;
  }

  public getPointsTransactions(customerId?: string): PointsTransaction[] {
    let transactions = [...this.pointsTransactions];
    
    if (customerId) {
      transactions = transactions.filter(t => t.customerId === customerId);
    }

    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public redeemPoints(customerId: string, pointsToRedeem: number, type: 'cash_discount' | 'reward_redemption', rewardId?: string): RedemptionRequest | null {
    const customer = this.getCustomerById(customerId);
    if (!customer) return null;

    if (customer.currentPoints < pointsToRedeem) return null;
    if (pointsToRedeem < this.config.minimumPointsToRedeem) return null;

    const cashValue = pointsToRedeem * this.config.pointsRedemptionRate;

    const redemptionRequest: RedemptionRequest = {
      id: `red_${Date.now()}`,
      customerId,
      customerName: customer.name,
      rewardId,
      pointsToRedeem,
      cashValue,
      type,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.redemptionRequests.push(redemptionRequest);
    this.saveData();

    return redemptionRequest;
  }

  public approveRedemption(redemptionId: string, approvedBy: string): boolean {
    const redemption = this.redemptionRequests.find(r => r.id === redemptionId);
    if (!redemption || redemption.status !== 'pending') return false;

    const customer = this.getCustomerById(redemption.customerId);
    if (!customer || customer.currentPoints < redemption.pointsToRedeem) return false;

    // Update customer points
    customer.currentPoints -= redemption.pointsToRedeem;
    customer.totalPointsRedeemed += redemption.pointsToRedeem;

    // Update redemption status
    redemption.status = 'approved';
    redemption.redeemedAt = new Date().toISOString();
    redemption.redeemedBy = approvedBy;

    // Create points transaction
    this.addPointsTransaction({
      customerId: redemption.customerId,
      type: 'redeemed',
      points: -redemption.pointsToRedeem,
      description: `Points redeemed for ${redemption.type === 'cash_discount' ? 'cash discount' : 'reward'}`,
      createdBy: approvedBy
    });

    this.saveData();
    return true;
  }

  public getRedemptionRequests(status?: RedemptionRequest['status']): RedemptionRequest[] {
    let requests = [...this.redemptionRequests];
    
    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRewards(): LoyaltyReward[] {
    return [...this.rewards].filter(r => r.isActive);
  }

  public addReward(reward: Omit<LoyaltyReward, 'id' | 'usageCount' | 'createdAt'>): LoyaltyReward {
    const newReward: LoyaltyReward = {
      ...reward,
      id: `reward_${Date.now()}`,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };

    this.rewards.push(newReward);
    this.saveData();
    return newReward;
  }

  public getCustomerEligibleRewards(customerId: string): LoyaltyReward[] {
    const customer = this.getCustomerById(customerId);
    if (!customer) return [];

    return this.getRewards().filter(reward => {
      const tierEligible = reward.applicableCustomerTiers.includes(customer.loyaltyTier);
      const pointsEligible = customer.currentPoints >= reward.pointsCost;
      const validDate = new Date() >= new Date(reward.validFrom) && 
                       (!reward.validUntil || new Date() <= new Date(reward.validUntil));
      const usageAvailable = !reward.usageLimit || reward.usageCount < reward.usageLimit;

      return tierEligible && pointsEligible && validDate && usageAvailable;
    });
  }

  public getTopCustomers(limit: number = 10): Customer[] {
    return this.getCustomers()
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  public getCustomersByTier(tier: Customer['loyaltyTier']): Customer[] {
    return this.customers.filter(c => c.loyaltyTier === tier);
  }

  public calculateMaxRedemptionForBill(customerId: string, billAmount: number): number {
    const customer = this.getCustomerById(customerId);
    if (!customer) return 0;

    const maxRedemptionValue = (billAmount * this.config.maximumRedemptionPercentage) / 100;
    const maxPointsFromValue = Math.floor(maxRedemptionValue / this.config.pointsRedemptionRate);
    
    return Math.min(customer.currentPoints, maxPointsFromValue);
  }

  public expireOldPoints(): number {
    if (this.config.pointsExpiryDays === 0) return 0;

    const now = new Date();
    let totalExpiredPoints = 0;

    this.pointsTransactions
      .filter(t => t.type === 'earned' && t.expiryDate && new Date(t.expiryDate) < now)
      .forEach(transaction => {
        const customer = this.getCustomerById(transaction.customerId);
        if (customer && customer.currentPoints >= transaction.points) {
          customer.currentPoints -= transaction.points;
          totalExpiredPoints += transaction.points;

          // Create expiry transaction
          this.addPointsTransaction({
            customerId: transaction.customerId,
            type: 'expired',
            points: -transaction.points,
            description: `Points expired from transaction ${transaction.id}`,
            createdBy: 'system'
          });
        }
      });

    if (totalExpiredPoints > 0) {
      this.saveData();
    }

    return totalExpiredPoints;
  }

  public getLoyaltyStats(): {
    totalCustomers: number;
    activeCustomers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    averagePointsPerCustomer: number;
    tierDistribution: { bronze: number; silver: number; gold: number; platinum: number };
  } {
    const totalCustomers = this.customers.length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeCustomers = this.customers.filter(c => 
      c.lastVisit && new Date(c.lastVisit) > thirtyDaysAgo
    ).length;

    const totalPointsIssued = this.customers.reduce((sum, c) => sum + c.totalPointsEarned, 0);
    const totalPointsRedeemed = this.customers.reduce((sum, c) => sum + c.totalPointsRedeemed, 0);
    const averagePointsPerCustomer = totalCustomers > 0 ? totalPointsIssued / totalCustomers : 0;

    const tierDistribution = {
      bronze: this.customers.filter(c => c.loyaltyTier === 'bronze').length,
      silver: this.customers.filter(c => c.loyaltyTier === 'silver').length,
      gold: this.customers.filter(c => c.loyaltyTier === 'gold').length,
      platinum: this.customers.filter(c => c.loyaltyTier === 'platinum').length
    };

    return {
      totalCustomers,
      activeCustomers,
      totalPointsIssued,
      totalPointsRedeemed,
      averagePointsPerCustomer,
      tierDistribution
    };
  }
}

export const loyaltyService = new LoyaltyService();
