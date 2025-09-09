import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BillOfMaterialsSchema, type BillOfMaterialsInput } from '@/lib/validators/billOfMaterials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddBOM } from '@/hooks/useBillOfMaterials';
import { useRawMaterials } from '@/hooks/useRawMaterial';

export default function AddBillOfMaterialsForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data: materials } = useRawMaterials();
  const [search, setSearch] = useState('');
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BillOfMaterialsInput>({
    resolver: zodResolver(BillOfMaterialsSchema),
    defaultValues: { components: [], outputUnits: 1 }
  });
  const components = watch('components') || [];

  const filteredMaterials = useMemo(() => {
    const list = materials || [];
    return list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [materials, search]);

  const addComponent = (materialId: string) => {
    const exists = components.find(c => c.materialId === materialId);
    if (exists) return;
    setValue('components', [...components, { materialId, quantity: 1 }]);
  };
  const updateQuantity = (materialId: string, qty: number) => {
    setValue('components', components.map(c => c.materialId === materialId ? { ...c, quantity: qty } : c));
  };
  const removeComponent = (materialId: string) => {
    setValue('components', components.filter(c => c.materialId !== materialId));
  };

  const addMutation = useAddBOM();
  const onSubmit = (data: BillOfMaterialsInput) => {
    addMutation.mutate(data, { onSuccess: () => onSuccess?.() });
  };

  const previewCost = useMemo(() => {
    const list = materials || [];
    const rows = components.map(c => {
      const mat = list.find(m => m.id === c.materialId);
      const unitCost = mat?.unitPrice ?? 0;
      return { name: mat?.name || c.materialId, quantity: c.quantity, unitCost, cost: unitCost * c.quantity };
    });
    const total = rows.reduce((s, r) => s + r.cost, 0);
    const outputUnits = watch('outputUnits') || 1;
    const perUnit = outputUnits > 0 ? total / outputUnits : 0;
    return { rows, total, perUnit };
  }, [components, materials, watch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>BOM name</Label>
        <Input {...register('name')} placeholder="e.g., Chocolate Bar Recipe" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label>Select raw materials</Label>
        <Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
        <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
          {(filteredMaterials || []).map(m => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span>{m.name}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => addComponent(m.id)}>Add</Button>
            </div>
          ))}
          {filteredMaterials && filteredMaterials.length === 0 && <div className="text-xs text-gray-500">No materials found</div>}
        </div>
      </div>

      {components.length > 0 && (
        <div className="space-y-2">
          <Label>Selected materials</Label>
          {components.map(c => {
            const mat = (materials || []).find(m => m.id === c.materialId);
            return (
              <div key={c.materialId} className="grid grid-cols-6 gap-2 items-center">
                <div className="col-span-3 text-sm">{mat?.name || c.materialId}</div>
                <div className="col-span-2">
                  <Input type="number" step="0.0001" value={c.quantity} onChange={e => updateQuantity(c.materialId, parseFloat(e.target.value))} />
                </div>
                <div>
                  <Button type="button" variant="outline" onClick={() => removeComponent(c.materialId)}>Remove</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <Label>Output units</Label>
          <Input type="number" step="1" {...register('outputUnits', { valueAsNumber: true })} />
          {errors.outputUnits && <p className="text-red-500 text-sm">{errors.outputUnits.message}</p>}
        </div>
        <div>
          <Label>Cost per unit (auto)</Label>
          <Input value={previewCost.perUnit.toFixed(4)} disabled />
        </div>
      </div>

      <div className="bg-gray-50 rounded p-3 text-sm">
        <div className="flex justify-between mb-1"><span>Total raw material cost</span><span>{previewCost.total.toFixed(2)}</span></div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={addMutation.isPending}>
          {addMutation.isPending ? 'Saving...' : 'Create BOM'}
        </Button>
      </div>
    </form>
  );
}
