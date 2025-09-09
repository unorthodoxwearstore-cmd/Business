import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSchema, type ProductInput, type Product } from '@/lib/validators/product';
import { productRepository } from '@/services/indexeddb/repositories/productRepository';

export const useProductStore = create<{ lastAddedId: string | null; setLastAddedId: (id: string | null) => void }>((set) => ({
  lastAddedId: null,
  setLastAddedId: (id) => set({ lastAddedId: id })
}));

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productRepository.getAll()
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  const setLast = useProductStore((s) => s.setLastAddedId);
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const parsed = ProductSchema.parse(input);
      const costPerUnit = parsed.orderQuantity > 0 ? parsed.totalCost / parsed.orderQuantity : 0;
      const record: Omit<Product, 'id'> = {
        name: parsed.name,
        sku: parsed.sku,
        category: parsed.category,
        variant: parsed.variant,
        orderQuantity: parsed.orderQuantity,
        totalCost: parsed.totalCost,
        costPerUnit,
        expiry: parsed.expiry,
        unit: parsed.unit ?? 'pcs'
      };
      return productRepository.add(record);
    },
    onSuccess: (res) => {
      setLast(res.id);
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
}
