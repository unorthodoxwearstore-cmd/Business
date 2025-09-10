import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/useProduct';
import { useRawMaterials } from '@/hooks/useRawMaterial';
import { useAddRecipe, useDeleteRecipe, useRecipes } from '@/hooks/useRecipe';
import BackButton from '@/components/BackButton';

export default function RecipePage() {
  const { data: products } = useProducts();
  const { data: materials } = useRawMaterials();
  const { data: recipes } = useRecipes();
  const addRecipe = useAddRecipe();
  const delRecipe = useDeleteRecipe();

  const [productId, setProductId] = useState('');
  const [components, setComponents] = useState<{ materialId: string; quantity: number }[]>([]);

  const currentCost = useMemo(() => {
    const mats = materials || [];
    const breakdown = components.map(c => {
      const m = mats.find(mm => mm.id === c.materialId);
      const unitCost = m?.unitPrice ?? 0;
      const cost = unitCost * (c.quantity || 0);
      return { cost };
    });
    return breakdown.reduce((s, b) => s + b.cost, 0);
  }, [components, materials]);

  const addRow = () => setComponents(prev => [...prev, { materialId: '', quantity: 1 }]);
  const updateRow = (idx: number, patch: Partial<{ materialId: string; quantity: number }>) =>
    setComponents(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const removeRow = (idx: number) => setComponents(prev => prev.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || components.length === 0) return;
    await addRecipe.mutateAsync({ productId, components } as any);
    setProductId('');
    setComponents([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
        <BackButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input placeholder="Enter product name" value={productId} onChange={e => setProductId(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Raw Materials</Label>
                <Button type="button" size="sm" onClick={addRow}>Add Material</Button>
              </div>
              {components.length === 0 && (
                <div className="text-sm text-gray-500">Add materials to build your recipe.</div>
              )}
              {components.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <Select value={row.materialId} onValueChange={(v)=>updateRow(idx,{ materialId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                    <SelectContent>
                      {(materials || []).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} step="0.01" value={row.quantity || 0} onChange={e=>updateRow(idx,{ quantity: Number(e.target.value) })} />
                  <Button type="button" variant="outline" onClick={()=>removeRow(idx)}>Remove</Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">Cost to Make 1 Unit: <span className="font-semibold">{new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR' }).format(currentCost)}</span></div>
              <Button type="submit" disabled={!productId || components.length === 0 || addRecipe.isPending}>{addRecipe.isPending ? 'Saving...' : 'Save Recipe'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          {(recipes || []).length === 0 ? (
            <div className="text-sm text-gray-500">No recipes yet.</div>
          ) : (
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">Breakdown</th>
                    <th className="p-2 text-right">Unit Cost</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(recipes || []).map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{(products || []).find(p => p.id === r.productId)?.name || r.productId}</td>
                      <td className="p-2">
                        {(r.breakdown || []).map(b => {
                          const m = (materials || []).find(mm => mm.id === b.materialId);
                          return <div key={b.materialId}>{m?.name || b.materialId}: {b.quantity} × {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(b.unitCost)} = {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(b.cost)}</div>
                        })}
                      </td>
                      <td className="p-2 text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(r.unitCost || 0)}</td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="ghost" onClick={()=>delRecipe.mutate(r.id)}>Delete</Button>
                      </td>
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
