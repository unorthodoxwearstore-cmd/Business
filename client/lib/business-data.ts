import { BusinessType } from '@shared/types';
import { authService } from './auth-service';

export interface BusinessData {
  id: string;
  name: string;
  type: BusinessType;
  owner: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  currency: string;
  timezone: string;
  language: string;
}

// Default business data - in production this would come from a database
const getDefaultBusinessData = (): BusinessData => {
  const currentUser = authService.getCurrentUser();
  return {
    id: `business_${Date.now()}`,
    name: currentUser?.businessName || 'My Business',
    type: currentUser?.businessType || 'retailer',
    owner: currentUser?.name || 'Business Owner',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: '',
    gstNumber: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en'
  };
};

class BusinessDataService {
  private businessData: BusinessData;

  constructor() {
    this.loadBusinessData();
  }

  private loadBusinessData(): void {
    const savedData = localStorage.getItem('business_data');
    if (savedData) {
      this.businessData = { ...getDefaultBusinessData(), ...JSON.parse(savedData) };
    } else {
      this.businessData = getDefaultBusinessData();
      this.saveBusinessData();
    }
  }

  private saveBusinessData(): void {
    localStorage.setItem('business_data', JSON.stringify(this.businessData));
  }

  public getBusinessData(): BusinessData {
    return { ...this.businessData };
  }

  public updateBusinessData(updates: Partial<BusinessData>): void {
    this.businessData = { ...this.businessData, ...updates };
    this.saveBusinessData();
  }

  public getFormattedAddress(): string {
    return this.businessData.address;
  }

  public getContactInfo(): { phone: string; email: string } {
    return {
      phone: this.businessData.phone,
      email: this.businessData.email
    };
  }

  public getCurrencySymbol(): string {
    const currencySymbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };
    return currencySymbols[this.businessData.currency] || this.businessData.currency;
  }

  public formatCurrency(amount: number): string {
    const symbol = this.getCurrencySymbol();
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

const businessDataService = new BusinessDataService();

// Export both the service and a convenience function
export { businessDataService };
export const getBusinessData = () => businessDataService.getBusinessData();
export const updateBusinessData = (updates: Partial<BusinessData>) => businessDataService.updateBusinessData(updates);
export const formatCurrency = (amount: number) => businessDataService.formatCurrency(amount);
