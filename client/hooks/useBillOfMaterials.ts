import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillOfMaterialsSchema, type BillOfMaterialsInput, type BillOfMaterials } from '@/lib/validators/billOfMaterials';
import { billOfMaterialsRepository } from '@/services/indexeddb/repositories/billOfMaterialsRepository';
import { rawMaterialRepository } from '@/services/indexeddb/repositories/rawMaterialRepository';

export const useBOMStore = create<{ lastAddedId: string | null; setLastAddedId: (id: string | null) => void }>((set) => ({
  lastAddedId: null,
  setLastAddedId: (id) => set({ lastAddedId: id })
}));

export function useBOMs() {
  return useQuery({
    queryKey: ['boms'],
    queryFn: () => billOfMaterialsRepository.getAll()
  });
}

export function useAddBOM() {
  const qc = useQueryClient();
  const setLast = useBOMStore((s) => s.setLastAddedId);
  return useMutation({
    mutationFn: async (input: BillOfMaterialsInput) => {
      const parsed = BillOfMaterialsSchema.parse(input);
      const materials = await rawMaterialRepository.getAll();
      const breakdown = parsed.components.map(c => {
        const mat = materials.find(m => m.id === c.materialId);
        const unitCost = mat?.unitPrice ?? 0;
        const cost = unitCost * c.quantity;
        return { materialId: c.materialId, unitCost, quantity: c.quantity, cost };
      });
      const totalRawMaterialCost = breakdown.reduce((s, b) => s + b.cost, 0);
      const manufacturingCostPerUnit = parsed.outputUnits > 0 ? totalRawMaterialCost / parsed.outputUnits : 0;
      const record: Omit<BillOfMaterials, 'id'> = {
        name: parsed.name,
        components: parsed.components,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        outputUnits: parsed.outputUnits,
        totalRawMaterialCost,
        manufacturingCostPerUnit,
        breakdown
      } as Omit<BillOfMaterials, 'id'>;
      return billOfMaterialsRepository.add(record);
    },
    onSuccess: (res) => {
      setLast(res.id);
      qc.invalidateQueries({ queryKey: ['boms'] });
    }
  });
}
