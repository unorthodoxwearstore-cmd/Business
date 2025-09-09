import { getDB } from '@/services/indexeddb/db';
import type { ProductionPlan } from '@/lib/validators/productionPlan';

export const productionPlanRepository = {
  async add(plan: Omit<ProductionPlan, 'id'>): Promise<ProductionPlan> {
    const db = await getDB();
    const id = `plan_${crypto.randomUUID()}`;
    const record: ProductionPlan = { ...plan, id } as ProductionPlan;
    await db.put('production_plans', record);
    return record;
  },
  async update(plan: ProductionPlan): Promise<void> {
    const db = await getDB();
    await db.put('production_plans', plan);
  },
  async getAll(): Promise<ProductionPlan[]> {
    const db = await getDB();
    return await db.getAll('production_plans');
  },
  async getById(id: string): Promise<ProductionPlan | undefined> {
    const db = await getDB();
    return await db.get('production_plans', id);
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('production_plans', id);
  }
};
