import { z } from 'zod';
import { unitEnum } from './rawMaterial';

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  variant: z.string().optional(),
  orderQuantity: z.number().positive('Order quantity must be positive'),
  totalCost: z.number().nonnegative(),
  costPerUnit: z.number().nonnegative().optional(),
  expiry: z.string().optional(),
  unit: unitEnum.optional().default('pcs')
});

export type ProductInput = z.input<typeof ProductSchema>;
export type Product = z.output<typeof ProductSchema> & { id: string; costPerUnit: number };
