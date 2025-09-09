import { z } from 'zod';

export const ProductionPlanSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Select a product'),
  quantity: z.number().positive('Quantity must be > 0'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  assignee: z.string().optional(),
  status: z.enum(['Planned']).default('Planned'),
  batchCost: z.number().nonnegative().optional()
});

export type ProductionPlanInput = z.input<typeof ProductionPlanSchema>;
export type ProductionPlan = z.output<typeof ProductionPlanSchema> & { id: string; batchCost: number };
