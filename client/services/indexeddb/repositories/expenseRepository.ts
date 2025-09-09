import { getDB } from '@/services/indexeddb/db';
import type { Expense } from '@/lib/validators/expense';

export const expenseRepository = {
  async addExpense(exp: Omit<Expense, 'id' | 'dateISO'> & { dateISO?: string }): Promise<Expense> {
    const db = await getDB();
    const id = `exp_${crypto.randomUUID()}`;
    const record: Expense = { id, dateISO: exp.dateISO ?? new Date().toISOString(), amount: exp.amount, category: exp.category, description: exp.description };
    await db.put('expenses', record);
    return record;
  },
  async listExpenses(): Promise<Expense[]> {
    const db = await getDB();
    const all = await db.getAll('expenses');
    return all.sort((a,b)=> b.dateISO.localeCompare(a.dateISO));
  }
};
