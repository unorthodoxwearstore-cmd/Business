import { getDB } from '@/services/indexeddb/db';
import type { SaleInvoice } from '@/lib/validators/saleInvoice';

export const saleInvoiceRepository = {
  async add(invoice: Omit<SaleInvoice, 'id'>): Promise<SaleInvoice> {
    const db = await getDB();
    const id = `inv_${crypto.randomUUID()}`;
    const record: SaleInvoice = { ...invoice, id } as SaleInvoice;
    await db.put('sale_invoices', record);
    return record;
  },
  async update(invoice: SaleInvoice): Promise<void> {
    const db = await getDB();
    await db.put('sale_invoices', invoice);
  },
  async getAll(): Promise<SaleInvoice[]> {
    const db = await getDB();
    return await db.getAll('sale_invoices');
  },
  async getById(id: string): Promise<SaleInvoice | undefined> {
    const db = await getDB();
    return await db.get('sale_invoices', id);
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('sale_invoices', id);
  }
};
