import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RecipeSchema, type RecipeInput, type Recipe } from '@/lib/validators/recipe';
import { recipeRepository } from '@/services/indexeddb/repositories/recipeRepository';
import { rawMaterialRepository } from '@/services/indexeddb/repositories/rawMaterialRepository';
import { notificationService } from '@/lib/notification-service';
import { notificationsApi } from '@/lib/notifications-api';

export function computeRecipeUnitCost(components: { materialId: string; quantity: number }[], materials: { id: string; unitPrice: number }[]) {
  const breakdown = components.map(c => {
    const mat = materials.find(m => m.id === c.materialId);
    const unitCost = mat?.unitPrice ?? 0;
    const cost = unitCost * c.quantity;
    return { materialId: c.materialId, unitCost, quantity: c.quantity, cost };
  });
  const unitCost = breakdown.reduce((s, b) => s + b.cost, 0);
  return { unitCost, breakdown };
}

export function useRecipes() {
  return useQuery({ queryKey: ['recipes'], queryFn: () => recipeRepository.getAll() });
}

export function useAddRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecipeInput) => {
      const parsed = RecipeSchema.parse(input);
      const materials = await rawMaterialRepository.getAll();
      const { unitCost, breakdown } = computeRecipeUnitCost(parsed.components, materials);
      const record: Omit<Recipe, 'id'> = { productId: parsed.productId, components: parsed.components, unitCost, breakdown } as any;
      const saved = await recipeRepository.add(record);
      try {
        notificationService.success('Recipe created', 'Recipe has been created successfully');
        notificationsApi.create({
          type: 'recipe',
          title: 'Recipe created',
          message: `A recipe for selected product was created (unit cost ${unitCost.toFixed(2)})`,
          link: '/dashboard/manufacturer/recipe',
        });
      } catch {}
      return saved;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] })
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipe: Recipe) => {
      await recipeRepository.update(recipe);
      return recipe;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] })
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => recipeRepository.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] })
  });
}
