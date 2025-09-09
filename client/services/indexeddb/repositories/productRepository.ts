import { getDB } from '@/services/indexeddb/db';
import type { Product } from '@/lib/validators/product';

export const productRepository = {
  async add(product: Omit<Product, 'id'>): Promise<Product> {
    const db = await getDB();
    const id = `p_${crypto.randomUUID()}`;
    const record: Product = { ...product, id };
    await db.put('products', record);
    return record;
  },
  async update(product: Product): Promise<void> {
    const db = await getDB();
    await db.put('products', product);
  },
  async getAll(): Promise<Product[]> {
    const db = await getDB();
    return await db.getAll('products');
  },
  async getById(id: string): Promise<Product | undefined> {
    const db = await getDB();
    return await db.get('products', id);
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('products', id);
  }
};
