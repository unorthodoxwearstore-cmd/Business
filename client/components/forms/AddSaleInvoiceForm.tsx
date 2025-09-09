import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaleInvoiceSchema, type SaleInvoiceInput } from '@/lib/validators/saleInvoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddSaleInvoice } from '@/hooks/useSaleInvoice';
import { useProducts } from '@/hooks/useProduct';

export default function AddSaleInvoiceForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data: products } = useProducts();
  const [search, setSearch] = useState('');
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SaleInvoiceInput>({
    resolver: zodResolver(SaleInvoiceSchema),
    defaultValues: { invoiceDate: new Date().toISOString(), paymentMode: 'Cash' as any, paymentStatus: 'Paid' as any, quantity: 1 }
  });
  const productId = watch('productId');
  const sellingPricePerUnit = watch('sellingPricePerUnit');
  const quantity = watch('quantity') ?? 1;

  useEffect(() => {
    if (productId) {
      const p = (products || []).find(p => p.id === productId);
      if (p && !sellingPricePerUnit) {
        setValue('sellingPricePerUnit' as any, p.costPerUnit);
      }
    }
  }, [productId, products, sellingPricePerUnit, setValue]);

  const filteredProducts = useMemo(() => {
    const list = products || [];
    return list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const total = useMemo(() => {
    if (!sellingPricePerUnit) return 0;
    return Number(((sellingPricePerUnit ?? 0) * (quantity ?? 1)).toFixed(2));
  }, [sellingPricePerUnit, quantity]);

  const addMutation = useAddSaleInvoice();
  const onSubmit = (data: SaleInvoiceInput) => {
    addMutation.mutate(data, { onSuccess: () => onSuccess?.() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Invoice date</Label>
        <Input type="date" {...register('invoiceDate')} />
      </div>

      <div>
        <Label>Product</Label>
        <Input placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
        <select {...register('productId')} className="w-full border rounded px-3 py-2">
          <option value="">Select product</option>
          {(filteredProducts || []).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.productId && <p className="text-red-500 text-sm">{errors.productId.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Quantity</Label>
          <Input type="number" step="1" {...register('quantity', { valueAsNumber: true })} />
          {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
        </div>
        <div>
          <Label>Selling price per unit</Label>
          <Input type="number" step="0.01" {...register('sellingPricePerUnit', { valueAsNumber: true })} />
          {errors.sellingPricePerUnit && <p className="text-red-500 text-sm">{errors.sellingPricePerUnit.message}</p>}
        </div>
        <div>
          <Label>Total (auto)</Label>
          <Input value={total} disabled />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Payment mode</Label>
          <select {...register('paymentMode')} className="w-full border rounded px-3 py-2">
            <option value="GPay">GPay</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
        <div>
          <Label>Payment status</Label>
          <select {...register('paymentStatus')} className="w-full border rounded px-3 py-2">
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Customer number</Label>
          <Input {...register('customerNumber')} placeholder="e.g., +9199XXXXXXX" />
          {errors.customerNumber && <p className="text-red-500 text-sm">{errors.customerNumber.message}</p>}
        </div>
        <div>
          <Label>Customer name (optional)</Label>
          <Input {...register('customerName')} />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={addMutation.isPending}>
          {addMutation.isPending ? 'Saving...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
