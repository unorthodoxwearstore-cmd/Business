import { z } from 'zod';
import type { UserRole } from '@shared/types';

export const StaffRequestSchema = z.object({
  id: z.string().optional(),
  businessName: z.string().min(1),
  staffName: z.string().min(1),
  phone: z.string().min(3),
  email: z.string().email(),
  role: z.custom<UserRole>(),
  status: z.enum(['PENDING','ACTIVE','REJECTED']).default('PENDING'),
  reason: z.string().optional(),
  createdAt: z.string().optional()
});

export type StaffRequestInput = z.input<typeof StaffRequestSchema>;
export type StaffRequest = z.output<typeof StaffRequestSchema> & { id: string; createdAt: string };
