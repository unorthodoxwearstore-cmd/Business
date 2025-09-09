import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum(['Salary','Bills','Miscellaneous']);

export const ExpenseSchema = z.object({
  id: z.string().optional(),
  amount: z.number().min(0, 'Amount must be >= 0'),
  category: ExpenseCategoryEnum,
  description: z.string().optional(),
  dateISO: z.string().optional()
});

export type ExpenseInput = z.input<typeof ExpenseSchema>;
export type Expense = z.output<typeof ExpenseSchema> & { id: string; dateISO: string };
