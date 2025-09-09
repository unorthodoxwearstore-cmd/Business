import { getDB } from '@/services/indexeddb/db';
import type { StaffRequest } from '@/lib/validators/staffRequest';

export const staffRequestRepository = {
  async add(req: Omit<StaffRequest, 'id' | 'createdAt'>): Promise<StaffRequest> {
    const db = await getDB();
    const id = `sr_${crypto.randomUUID()}`;
    const record: StaffRequest = { ...req, id, createdAt: new Date().toISOString() } as StaffRequest;
    await db.put('staff_requests', record);
    return record;
  },
  async getAll(): Promise<StaffRequest[]> {
    const db = await getDB();
    return await db.getAll('staff_requests');
  },
  async update(req: StaffRequest): Promise<void> {
    const db = await getDB();
    await db.put('staff_requests', req);
  },
  async approve(id: string): Promise<StaffRequest | undefined> {
    const db = await getDB();
    const req = await db.get('staff_requests', id) as StaffRequest | undefined;
    if (!req) return undefined;
    const updated = { ...req, status: 'ACTIVE' as const };
    await db.put('staff_requests', updated);
    return updated;
  },
  async reject(id: string, reason?: string): Promise<StaffRequest | undefined> {
    const db = await getDB();
    const req = await db.get('staff_requests', id) as StaffRequest | undefined;
    if (!req) return undefined;
    const updated = { ...req, status: 'REJECTED' as const, reason };
    await db.put('staff_requests', updated);
    return updated;
  }
};
