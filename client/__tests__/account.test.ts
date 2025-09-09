import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { ExpenseSchema } from '@/lib/validators/expense';
import { expenseRepository } from '@/services/indexeddb/repositories/expenseRepository';
import { sumReceivables, sumExpenses } from '@/lib/accounting';

describe('Expense schema', () => {
  it('validates amount >= 0 and category', () => {
    const ok = ExpenseSchema.safeParse({ amount: 0, category: 'Salary' });
    expect(ok.success).toBe(true);
    const bad = ExpenseSchema.safeParse({ amount: -1, category: 'Salary' });
    expect(bad.success).toBe(false);
  });
});

describe('Expense repository', () => {
  it('adds and lists expenses newest-first', async () => {
    const a = await expenseRepository.addExpense({ amount: 10, category: 'Bills', description: 'bill1' } as any);
    const b = await expenseRepository.addExpense({ amount: 20, category: 'Salary', description: 'sal' } as any);
    const list = await expenseRepository.listExpenses();
    expect(list[0].id).toBe(b.id);
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Totals calculators', () => {
  it('sums receivables from pending invoices', () => {
    const invoices: any[] = [
      { totalAmount: 100, paymentStatus: 'Pending' },
      { totalAmount: 50, paymentStatus: 'Paid' },
      { totalAmount: 25, paymentStatus: 'Pending' }
    ];
    expect(sumReceivables(invoices as any)).toBe(125);
  });
  it('sums expenses', () => {
    const exps: any[] = [ { amount: 10 }, { amount: 15.5 } ];
    expect(sumExpenses(exps as any)).toBe(25.5);
  });
});
