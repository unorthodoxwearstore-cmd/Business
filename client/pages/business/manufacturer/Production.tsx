import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRawMaterials } from '@/hooks/useRawMaterial';
import { useProducts } from '@/hooks/useProduct';
import { useRecipes } from '@/hooks/useRecipe';
import { useAddProductionPlan, useProductionPlans } from '@/hooks/useProductionPlan';
import BackButton from '@/components/BackButton';

export default function ProductionPage() {
  const { data: products } = useProducts();
  const { data: recipes } = useRecipes();
  const { data: materials } = useRawMaterials();
  const { data: plans } = useProductionPlans();
  const addPlan = useAddProductionPlan();

  const [recipeId, setRecipeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [assigneeInput, setAssigneeInput] = useState('');
  const [misc, setMisc] = useState(false);

  const selectedRecipe = useMemo(() => (recipes || []).find(r => r.id === recipeId), [recipes, recipeId]);
  const productId = selectedRecipe?.productId || '';

  const computed = useMemo(() => {
    if (!selectedRecipe) return { base: 0, total: 0, rows: [] as { materialId: string; name: string; required: number; unit: string; unitCost: number; cost: number; available: number; ok: boolean }[] };
    const mats = materials || [];
    const rows = (selectedRecipe.breakdown || []).map(b => {
      const mat = mats.find(m => m.id === b.materialId);
      const required = (b.quantity || 0) * (quantity || 0);
      const available = mat?.quantity ?? 0;
      const unitCost = mat?.unitPrice ?? b.unitCost ?? 0;
      const cost = unitCost * required;
      return { materialId: b.materialId, name: mat?.name || b.materialId, required, unit: mat?.unit || 'pcs', unitCost, cost, available, ok: available >= required };
    });
    const base = rows.reduce((s, r) => s + r.cost, 0);
    const total = misc ? base * 1.075 : base;
    return { base, total, rows };
  }, [selectedRecipe, materials, quantity, misc]);

  const addAssignee = () => {
    const v = assigneeInput.trim();
    if (!v) return;
    if (!assignees.includes(v)) setAssignees(prev => [...prev, v]);
    setAssigneeInput('');
  };
  const removeAssignee = (name: string) => setAssignees(prev => prev.filter(a => a !== name));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !startDate || quantity <= 0) return;
    const safeEnd = endDate || startDate; // keep schema unchanged
    const assignee = assignees.join(', ');
    await addPlan.mutateAsync({ productId, quantity, startDate, endDate: safeEnd, assignee } as any);
    setRecipeId(''); setQuantity(1); setStartDate(''); setEndDate(''); setAssignees([]); setMisc(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Production Planning</h1>
        <BackButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Production</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Recipe</Label>
              <Select value={recipeId} onValueChange={setRecipeId}>
                <SelectTrigger><SelectValue placeholder="Select recipe" /></SelectTrigger>
                <SelectContent>
                  {(recipes || []).map(r => {
                    const prodName = (products || []).find(p => p.id === r.productId)?.name || r.productId;
                    return <SelectItem key={r.id} value={r.id}>{prodName}</SelectItem>;
                  })}
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
              <Label>End Date (optional)</Label>
              <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label>Assigned Staff (optional)</Label>
              <div className="flex gap-2">
                <Input value={assigneeInput} onChange={e=>setAssigneeInput(e.target.value)} placeholder="Type a name and press Add" />
                <Button type="button" variant="outline" onClick={addAssignee}>Add</Button>
              </div>
              {assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignees.map(a => (
                    <span key={a} className="px-2 py-1 border rounded text-xs bg-gray-50">
                      {a} <button onClick={()=>removeAssignee(a)} className="ml-1 text-gray-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input id="misc" type="checkbox" checked={misc} onChange={e=>setMisc(e.target.checked)} />
              <Label htmlFor="misc">Add 7.5% miscellaneous cost</Label>
            </div>

            {selectedRecipe && (
              <div className="md:col-span-2 mt-4 border rounded p-3">
                <div className="font-medium mb-2">Recipe Breakdown</div>
                <div className="text-sm text-gray-600 mb-2">Product: {(products||[]).find(p=>p.id===selectedRecipe.productId)?.name || selectedRecipe.productId}</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 text-left">Material</th>
                        <th className="p-2 text-right">Required</th>
                        <th className="p-2 text-right">Unit Cost</th>
                        <th className="p-2 text-right">Line Cost</th>
                        <th className="p-2 text-left">Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computed.rows.map(r => (
                        <tr key={r.materialId} className="border-t">
                          <td className="p-2">{r.name}</td>
                          <td className="p-2 text-right">{r.required.toFixed(2)} {r.unit}</td>
                          <td className="p-2 text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(r.unitCost)}</td>
                          <td className="p-2 text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(r.cost)}</td>
                          <td className="p-2">{r.ok ? <span className="text-green-600">In stock ({r.available})</span> : <span className="text-red-600">Shortfall ({r.available} / {r.required.toFixed(2)})</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-6 mt-3 text-sm">
                  <div>Base cost: <span className="font-semibold">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(computed.base)}</span></div>
                  <div>Total cost: <span className="font-semibold">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(computed.total)}</span></div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex items-center justify-between pt-2">
              <div className="text-sm">Total Production Cost: <span className="font-semibold">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(computed.total)}</span></div>
              <Button type="submit" disabled={!selectedRecipe || !startDate || addPlan.isPending}>{addPlan.isPending ? 'Saving...' : 'Create Production Order'}</Button>
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
