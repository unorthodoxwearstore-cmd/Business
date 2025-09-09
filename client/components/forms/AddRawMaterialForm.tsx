import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RawMaterialSchema, type RawMaterialInput } from '@/lib/validators/rawMaterial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddRawMaterial } from '@/hooks/useRawMaterial';

const unitOptions = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'gm', label: 'Grams' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'ltr', label: 'Liters' }
];

export default function AddRawMaterialForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RawMaterialInput>({
    resolver: zodResolver(RawMaterialSchema),
    defaultValues: { unit: 'pcs' as any }
  });
  const quantity = watch('quantity');
  const totalPrice = watch('totalPrice');
  const unitPrice = useMemo(() => {
    if (!quantity || !totalPrice) return 0;
    if (quantity <= 0) return 0;
    return Number((totalPrice / quantity).toFixed(4));
  }, [quantity, totalPrice]);

  useEffect(() => {
    setValue('unitPrice' as any, unitPrice);
  }, [unitPrice, setValue]);

  const addMutation = useAddRawMaterial();

  const onSubmit = (data: RawMaterialInput) => {
    addMutation.mutate(data, { onSuccess: () => onSuccess?.() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Product name</Label>
        <Input {...register('name')} placeholder="e.g., Sugar" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      <div>
        <Label>Category</Label>
        <Input {...register('category')} placeholder="e.g., Sweeteners" />
        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Quantity</Label>
          <Input type="number" step="0.0001" {...register('quantity', { valueAsNumber: true })} placeholder="e.g., 500" />
          {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
        </div>
        <div>
          <Label>Unit</Label>
          <select {...register('unit')} className="w-full border rounded px-3 py-2">
            {unitOptions.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Total price paid</Label>
          <Input type="number" step="0.01" {...register('totalPrice', { valueAsNumber: true })} placeholder="e.g., 2500" />
          {errors.totalPrice && <p className="text-red-500 text-sm">{errors.totalPrice.message}</p>}
        </div>
        <div>
          <Label>Price per unit (auto)</Label>
          <Input value={unitPrice} disabled />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Warehouse (optional)</Label>
          <Input {...register('warehouse')} placeholder="e.g., Main Warehouse" />
        </div>
        <div>
          <Label>Expiry (optional)</Label>
          <Input type="date" {...register('expiry')} />
        </div>
      </div>
      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={addMutation.isPending}>
          {addMutation.isPending ? 'Saving...' : 'Add Raw Material'}
        </Button>
      </div>
    </form>
  );
}
