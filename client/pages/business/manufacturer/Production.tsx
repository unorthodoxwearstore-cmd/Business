import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/useProduct';
import { useRecipes } from '@/hooks/useRecipe';
import { useAddProductionPlan, useProductionPlans } from '@/hooks/useProductionPlan';

export default function ProductionPage() {
  const { data: products } = useProducts();
  const { data: recipes } = useRecipes();
  const { data: plans } = useProductionPlans();
  const addPlan = useAddProductionPlan();

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState('');

  const unitCost = useMemo(() => (recipes || []).find(r => r.productId === productId)?.unitCost || 0, [recipes, productId]);
  const batchCost = useMemo(() => unitCost * (quantity || 0), [unitCost, quantity]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPlan.mutateAsync({ productId, quantity, startDate, endDate, assignee } as any);
    setProductId(''); setQuantity(1); setStartDate(''); setEndDate(''); setAssignee('');
  };

  const recipeExists = !!(recipes || []).find(r => r.productId === productId);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Production</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Production Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Select product (must have recipe)" /></SelectTrigger>
                <SelectContent>
                  {(products || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity to Produce</Label>
              <Input type="number" min={1} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Assign Staff (optional)</Label>
              <Input value={assignee} onChange={e=>setAssignee(e.target.value)} placeholder="Staff name" />
            </div>
            <div className="md:col-span-2 flex items-center justify-between pt-2">
              <div className="text-sm">Batch Cost: <span className="font-semibold">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(batchCost)}</span></div>
              <Button type="submit" disabled={!productId || !recipeExists || !startDate || !endDate || addPlan.isPending}>{addPlan.isPending ? 'Saving...' : 'Create Plan'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {(plans || []).length === 0 ? (
            <div className="text-sm text-gray-500">No plans yet.</div>
          ) : (
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2 text-right">Total Cost</th>
                    <th className="p-2 text-left">Dates</th>
                    <th className="p-2 text-left">Assignee</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(plans || []).map(pl => (
                    <tr key={pl.id} className="border-t">
                      <td className="p-2">{(products || []).find(p => p.id === pl.productId)?.name || pl.productId}</td>
                      <td className="p-2 text-right">{pl.quantity}</td>
                      <td className="p-2 text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(pl.batchCost || 0)}</td>
                      <td className="p-2">{pl.startDate} → {pl.endDate}</td>
                      <td className="p-2">{pl.assignee || '-'}</td>
                      <td className="p-2">{pl.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
