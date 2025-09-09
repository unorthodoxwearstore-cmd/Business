import { getDB } from '@/services/indexeddb/db';
import type { BillOfMaterials } from '@/lib/validators/billOfMaterials';

export const billOfMaterialsRepository = {
  async add(bom: Omit<BillOfMaterials, 'id'>): Promise<BillOfMaterials> {
    const db = await getDB();
    const id = `bom_${crypto.randomUUID()}`;
    const record: BillOfMaterials = { ...bom, id } as BillOfMaterials;
    await db.put('boms', record);
    return record;
  },
  async update(bom: BillOfMaterials): Promise<void> {
    const db = await getDB();
    await db.put('boms', bom);
  },
  async getAll(): Promise<BillOfMaterials[]> {
    const db = await getDB();
    return await db.getAll('boms');
  },
  async getById(id: string): Promise<BillOfMaterials | undefined> {
    const db = await getDB();
    return await db.get('boms', id);
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('boms', id);
  }
};
