import { getDB } from '@/services/indexeddb/db';
import type { Recipe } from '@/lib/validators/recipe';

export const recipeRepository = {
  async add(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    const db = await getDB();
    const id = `recipe_${crypto.randomUUID()}`;
    const record: Recipe = { ...recipe, id } as Recipe;
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
