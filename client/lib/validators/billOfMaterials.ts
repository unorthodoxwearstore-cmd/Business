import { z } from 'zod';

export const BomComponentSchema = z.object({
  materialId: z.string().min(1),
  quantity: z.number().positive()
});

export const BillOfMaterialsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'BOM name is required'),
  components: z.array(BomComponentSchema).min(1, 'Select at least one raw material'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  outputUnits: z.number().positive('Output units must be positive'),
  totalRawMaterialCost: z.number().nonnegative().optional(),
  manufacturingCostPerUnit: z.number().nonnegative().optional(),
  breakdown: z.array(z.object({ materialId: z.string(), unitCost: z.number(), quantity: z.number(), cost: z.number() })).optional()
});

export type BomComponent = z.infer<typeof BomComponentSchema>;
export type BillOfMaterialsInput = z.input<typeof BillOfMaterialsSchema>;
export type BillOfMaterials = z.output<typeof BillOfMaterialsSchema> & { id: string; totalRawMaterialCost: number; manufacturingCostPerUnit: number; breakdown: { materialId: string; unitCost: number; quantity: number; cost: number }[] };
