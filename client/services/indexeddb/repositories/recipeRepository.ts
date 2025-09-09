import { getDB } from '@/services/indexeddb/db';
import type { Recipe } from '@/lib/validators/recipe';

export const recipeRepository = {
  async add(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    const db = await getDB();
    const id = `recipe_${crypto.randomUUID()}`;

    let unitCost = recipe.unitCost ?? 0;
    let breakdown = recipe.breakdown ?? [];

    // Compute unitCost from provided breakdown if needed
    if ((!unitCost || unitCost === 0) && breakdown.length > 0) {
      unitCost = breakdown.reduce((sum, row) => sum + (row.cost ?? 0), 0);
    }

    // If still missing, derive breakdown and unitCost from raw materials and component quantities
    if ((!unitCost || unitCost === 0) && breakdown.length === 0 && recipe.components?.length) {
      const computed = [] as { materialId: string; unitCost: number; quantity: number; cost: number }[];
      for (const c of recipe.components) {
        const material = await rawMaterialRepository.getById(c.materialId);
        const perUnit = (material as any)?.unitPrice ?? (material as any)?.pricePerUnit ?? 0;
        const cost = perUnit * c.quantity;
        computed.push({ materialId: c.materialId, unitCost: perUnit, quantity: c.quantity, cost });
      }
      breakdown = computed;
      unitCost = computed.reduce((sum, row) => sum + row.cost, 0);
    }

    const record: Recipe = { ...(recipe as any), id, unitCost, breakdown } as Recipe;
    await db.put('recipes', record);
    return record;
  },
  async update(recipe: Recipe): Promise<void> {
    const db = await getDB();
    await db.put('recipes', recipe);
  },
  async getAll(): Promise<Recipe[]> {
    const db = await getDB();
    return await db.getAll('recipes');
  },
  async getByProductId(productId: string): Promise<Recipe | undefined> {
    const list = await this.getAll();
    return list.find(r => r.productId === productId);
  },
  async getById(id: string): Promise<Recipe | undefined> {
    const db = await getDB();
    return await db.get('recipes', id);
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('recipes', id);
  }
};
