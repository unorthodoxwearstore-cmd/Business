import { getDB } from '@/services/indexeddb/db';

export interface ToBePaidEntry {
  id: string;
  invoiceId: string;
  customerNumber: string;
  amount: number;
  createdAt: string;
  status: 'pending' | 'paid';
}

export const toBePaidRepository = {
  async add(entry: Omit<ToBePaidEntry, 'id' | 'createdAt' | 'status'>): Promise<ToBePaidEntry> {
    const db = await getDB();
    const id = `tbp_${crypto.randomUUID()}`;
    const record: ToBePaidEntry = { id, createdAt: new Date().toISOString(), status: 'pending', ...entry };
    await db.put('to_be_paid', record);
    return record;
  },
  async update(entry: ToBePaidEntry): Promise<void> {
    const db = await getDB();
    await db.put('to_be_paid', entry);
  },
  async markPaid(id: string): Promise<void> {
    const db = await getDB();
    const existing = (await db.get('to_be_paid', id)) as ToBePaidEntry | undefined;
    if (existing) {
      existing.status = 'paid';
      await db.put('to_be_paid', existing);
    }
  },
  async getAll(): Promise<ToBePaidEntry[]> {
    const db = await getDB();
    return await db.getAll('to_be_paid');
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('to_be_paid', id);
  },
  async markPaidByInvoiceId(invoiceId: string): Promise<void> {
    const db = await getDB();
    const all = await db.getAll('to_be_paid');
    const match = all.find(e => e.invoiceId === invoiceId);
    if (match) {
      match.status = 'paid';
      await db.put('to_be_paid', match);
    }
  }
};
