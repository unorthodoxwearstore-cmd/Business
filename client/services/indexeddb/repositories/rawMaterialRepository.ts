import { getDB } from '@/services/indexeddb/db';
import type { RawMaterial } from '@/lib/validators/rawMaterial';

export const rawMaterialRepository = {
  async add(material: Omit<RawMaterial, 'id'>): Promise<RawMaterial> {
    const db = await getDB();
    const id = `rm_${crypto.randomUUID()}`;
    const record: RawMaterial = { ...material, id };
    await db.put('raw_materials', record);
    return record;
  },
  async update(material: RawMaterial): Promise<void> {
    const db = await getDB();
    await db.put('raw_materials', material);
  },
  async getAll(): Promise<RawMaterial[]> {
    const db = await getDB();
    return await db.getAll('raw_materials');
  },
  async getById(id: string): Promise<RawMaterial | undefined> {
    const db = await getDB();
    return await db.get('raw_materials', id);
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('raw_materials', id);
  }
};
