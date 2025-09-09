import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RawMaterialSchema, type RawMaterialInput, type RawMaterial } from '@/lib/validators/rawMaterial';
import { rawMaterialRepository } from '@/services/indexeddb/repositories/rawMaterialRepository';

export const useRawMaterialStore = create<{ lastAddedId: string | null; setLastAddedId: (id: string | null) => void }>((set) => ({
  lastAddedId: null,
  setLastAddedId: (id) => set({ lastAddedId: id })
}));

export function useRawMaterials() {
  return useQuery({
    queryKey: ['raw_materials'],
    queryFn: () => rawMaterialRepository.getAll()
  });
}

export function useAddRawMaterial() {
  const qc = useQueryClient();
  const setLast = useRawMaterialStore((s) => s.setLastAddedId);
  return useMutation({
    mutationFn: async (input: RawMaterialInput) => {
      const parsed = RawMaterialSchema.parse(input);
      const unitPrice = parsed.quantity > 0 ? parsed.totalPrice / parsed.quantity : 0;
      const record: Omit<RawMaterial, 'id'> = {
        name: parsed.name,
        category: parsed.category,
        unit: parsed.unit,
        quantity: parsed.quantity,
        warehouse: parsed.warehouse ?? '',
        expiry: parsed.expiry,
        totalPrice: parsed.totalPrice,
        unitPrice,
        createdAt: new Date().toISOString()
      };
      return rawMaterialRepository.add(record);
    },
    onSuccess: (res) => {
      setLast(res.id);
      qc.invalidateQueries({ queryKey: ['raw_materials'] });
    }
  });
}
