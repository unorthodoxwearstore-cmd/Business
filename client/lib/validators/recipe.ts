import { z } from 'zod';

export const RecipeComponentSchema = z.object({
  materialId: z.string().min(1),
  quantity: z.number().positive()
});

export const RecipeSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Select a finished product'),
  components: z.array(RecipeComponentSchema).min(1, 'Add at least one raw material'),
  unitCost: z.number().nonnegative().optional(),
  breakdown: z.array(z.object({ materialId: z.string(), unitCost: z.number(), quantity: z.number(), cost: z.number() })).optional()
});

export type RecipeInput = z.input<typeof RecipeSchema>;
export type Recipe = z.output<typeof RecipeSchema> & { id: string; unitCost: number; breakdown: { materialId: string; unitCost: number; quantity: number; cost: number }[] };
