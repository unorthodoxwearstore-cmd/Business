import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseSchema, type ExpenseInput, type Expense } from '@/lib/validators/expense';
import { expenseRepository } from '@/services/indexeddb/repositories/expenseRepository';

export const useExpenseStore = create<{ lastAddedId: string | null; setLastAddedId: (id: string | null) => void }>((set) => ({
  lastAddedId: null,
  setLastAddedId: (id) => set({ lastAddedId: id })
}));

export function useExpenses() {
  return useQuery({ queryKey: ['expenses'], queryFn: () => expenseRepository.listExpenses() });
}

export function useAddExpense() {
  const qc = useQueryClient();
  const setLast = useExpenseStore((s) => s.setLastAddedId);
  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const parsed = ExpenseSchema.parse(input);
      const record: Omit<Expense, 'id'> = {
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        dateISO: parsed.dateISO ?? new Date().toISOString(),
        id: '' as any
      } as any;
      const saved = await expenseRepository.addExpense(record as any);
      return saved;
    },
    onSuccess: (res) => {
      setLast(res.id);
      qc.invalidateQueries({ queryKey: ['expenses'] });
    }
  });
}
