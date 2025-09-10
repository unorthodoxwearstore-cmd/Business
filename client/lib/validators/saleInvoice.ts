import { z } from 'zod';

export const PaymentModeEnum = z.enum(['UPI', 'Card', 'Cash']);
export const PaymentStatusEnum = z.enum(['Paid', 'Pending']);

export const SaleInvoiceSchema = z.object({
  id: z.string().optional(),
  invoiceDate: z.string().optional(),
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive().default(1),
  sellingPricePerUnit: z.number().positive('Selling price per unit must be positive'),
  paymentMode: PaymentModeEnum,
  customerNumber: z.string().min(5, 'Customer number is required'),
  customerName: z.string().optional(),
  paymentStatus: PaymentStatusEnum.default('Paid'),
  totalAmount: z.number().nonnegative().optional()
});

export type SaleInvoiceInput = z.input<typeof SaleInvoiceSchema>;
export type SaleInvoice = z.output<typeof SaleInvoiceSchema> & { id: string; invoiceDate: string; totalAmount: number };
