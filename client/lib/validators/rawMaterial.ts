import { z } from 'zod';

export const unitEnum = z.enum(['pcs', 'gm', 'kg', 'ml', 'ltr']);

export const RawMaterialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: unitEnum,
  quantity: z.number().positive('Quantity must be positive'),
  warehouse: z.string().optional().default(''),
  expiry: z.string().optional(),
  totalPrice: z.number().nonnegative('Price must be >= 0'),
  unitPrice: z.number().nonnegative().optional(),
  createdAt: z.string().optional()
}).refine((data) => data.quantity > 0, { message: 'Quantity must be positive', path: ['quantity'] });

export type RawMaterialInput = z.input<typeof RawMaterialSchema>;
export type RawMaterial = z.output<typeof RawMaterialSchema> & { id: string; unitPrice: number; };
