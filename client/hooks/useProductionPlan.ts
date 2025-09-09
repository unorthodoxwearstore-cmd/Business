import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductionPlanSchema, type ProductionPlanInput, type ProductionPlan } from '@/lib/validators/productionPlan';
import { productionPlanRepository } from '@/services/indexeddb/repositories/productionPlanRepository';
import { recipeRepository } from '@/services/indexeddb/repositories/recipeRepository';

export function useProductionPlans() {
  return useQuery({ queryKey: ['production_plans'], queryFn: () => productionPlanRepository.getAll() });
}

export function useAddProductionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductionPlanInput) => {
      const parsed = ProductionPlanSchema.parse(input);
      const recipe = await recipeRepository.getByProductId(parsed.productId);
      if (!recipe) throw new Error('No recipe exists for this product');
      const batchCost = (recipe.unitCost || 0) * parsed.quantity;
      const record: Omit<ProductionPlan, 'id'> = { ...parsed, status: 'Planned', batchCost } as any;
      return productionPlanRepository.add(record);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production_plans'] })
  });
}
