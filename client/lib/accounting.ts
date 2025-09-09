import type { SaleInvoice } from '@/lib/validators/saleInvoice';
import type { Expense } from '@/lib/validators/expense';

export function sumReceivables(invoices: SaleInvoice[]): number {
  return (invoices || []).filter(i => i.paymentStatus === 'Pending').reduce((s, i) => s + (i.totalAmount || 0), 0);
}

export function sumExpenses(expenses: Expense[]): number {
  return (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
}
