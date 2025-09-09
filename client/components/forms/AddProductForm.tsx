import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema, type ProductInput } from '@/lib/validators/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddProduct } from '@/hooks/useProduct';

const unitOptions = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'gm', label: 'Grams' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'ltr', label: 'Liters' }
];

export default function AddProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: { unit: 'pcs' as any, orderQuantity: 1 }
  });
  const orderQuantity = watch('orderQuantity');
  const totalCost = watch('totalCost');
  const costPerUnit = useMemo(() => {
    if (!orderQuantity || !totalCost) return 0;
    if (orderQuantity <= 0) return 0;
    return Number((totalCost / orderQuantity).toFixed(4));
  }, [orderQuantity, totalCost]);

  useEffect(() => {
    setValue('costPerUnit' as any, costPerUnit);
  }, [costPerUnit, setValue]);

  const addMutation = useAddProduct();

  const onSubmit = (data: ProductInput) => {
    addMutation.mutate(data, { onSuccess: () => onSuccess?.() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Product name</Label>
        <Input {...register('name')} placeholder="e.g., Chocolate Bar" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>SKU (optional)</Label>
          <Input {...register('sku')} placeholder="e.g., CB-001" />
        </div>
        <div>
          <Label>Variant (optional)</Label>
          <Input {...register('variant')} placeholder="e.g., Dark" />
        </div>
      </div>
      <div>
        <Label>Category</Label>
        <Input {...register('category')} placeholder="e.g., Confectionery" />
        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Order quantity</Label>
          <Input type="number" step="0.0001" {...register('orderQuantity', { valueAsNumber: true })} />
          {errors.orderQuantity && <p className="text-red-500 text-sm">{errors.orderQuantity.message}</p>}
        </div>
        <div>
          <Label>Total cost</Label>
          <Input type="number" step="0.01" {...register('totalCost', { valueAsNumber: true })} />
          {errors.totalCost && <p className="text-red-500 text-sm">{errors.totalCost.message}</p>}
        </div>
        <div>
          <Label>Cost per unit (auto)</Label>
          <Input value={costPerUnit} disabled />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Unit</Label>
          <select {...register('unit')} className="w-full border rounded px-3 py-2">
            {unitOptions.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Expiry (optional)</Label>
          <Input type="date" {...register('expiry')} />
        </div>
      </div>
      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={addMutation.isPending}>
          {addMutation.isPending ? 'Saving...' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
}
