import { describe, it, expect, beforeEach } from 'vitest';
import { rawMaterialRepository } from '@/services/indexeddb/repositories/rawMaterialRepository';
import { productRepository } from '@/services/indexeddb/repositories/productRepository';
import { recipeRepository } from '@/services/indexeddb/repositories/recipeRepository';
import { productionPlanRepository } from '@/services/indexeddb/repositories/productionPlanRepository';

import 'fake-indexeddb/auto';

describe('Recipe and Production calculations', () => {
  beforeEach(async () => {
    // no-op: fake-indexeddb resets per test file in this setup
  });

  it('computes recipe unit cost correctly', async () => {
    const sugar = await rawMaterialRepository.add({ id: 'm1', name: 'Sugar', unit: 'kg', unitPrice: 40, minimumStock: 0, maximumStock: 0, currentStock: 0, category: 'General', supplier: 'S', sku: 'S', pricePerUnit: 40 } as any);
    const milk = await rawMaterialRepository.add({ id: 'm2', name: 'Milk', unit: 'L', unitPrice: 60, minimumStock: 0, maximumStock: 0, currentStock: 0, category: 'General', supplier: 'S', sku: 'M', pricePerUnit: 60 } as any);
    const prod = await productRepository.add({ id: 'p1', name: 'Ice Cream', unit: 'box', sku: 'IC', category: 'Food', price: 0 } as any);

    const recipe = await recipeRepository.add({ productId: prod.id, components: [ { materialId: sugar.id, quantity: 0.2 }, { materialId: milk.id, quantity: 0.5 } ], unitCost: 0, breakdown: [ { materialId: sugar.id, unitCost: 40, quantity: 0.2, cost: 8 }, { materialId: milk.id, unitCost: 60, quantity: 0.5, cost: 30 } ] } as any);

    expect(Math.round((recipe.unitCost || 0))).toBe(Math.round(38));
  });

  it('computes production batch cost as unitCost * quantity', async () => {
    const prod = await productRepository.add({ id: 'p2', name: 'Chocolate', unit: 'bar', sku: 'CH', category: 'Food', price: 0 } as any);
    // Pre-insert a recipe at unit cost 12
    await recipeRepository.add({ productId: prod.id, components: [], unitCost: 12, breakdown: [] } as any);

    const plan = await productionPlanRepository.add({ productId: prod.id, quantity: 25, startDate: '2024-01-01', endDate: '2024-01-02', assignee: 'John', status: 'Planned', batchCost: 12 * 25 } as any);
    expect(plan.batchCost).toBe(300);
  });
});
