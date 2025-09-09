import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventoryService } from '@/lib/inventory-service';
import { SpeechItem } from '@/lib/speech-parser';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  open: boolean;
  onClose: () => void;
  items: SpeechItem[];
}

export const SpeechReviewModal: React.FC<Props> = ({ open, onClose, items }) => {
  const [rows, setRows] = useState<SpeechItem[]>(items);
  const [batch, setBatch] = useState<{ delivery_total_price?: string; payment_mode?: string; pending_amount?: string; creditor_name?: string }>({});
  const hasAmbiguous = useMemo(() => rows.some(r => r.matchedStatus === 'ambiguous'), [rows]);

  const approve = () => {
    rows.forEach(r => {
      // increase stock; create product if new
      if (r.matchedStatus === 'matched' && r.matchedProductId) {
        // add batch
        inventoryService.addBatch({
          batchNumber: `${r.matchedProductId}-${Date.now()}`,
          productId: r.matchedProductId,
          quantity: r.qty,
          sellingPrice: 0,
          costPrice: 0,
          expiryDate: r.expiry_date,
          supplierName: batch.creditor_name
        });
      } else if (r.matchedStatus === 'new') {
        const newP = inventoryService.addProduct({
          name: r.name,
          sku: `SKU-${Date.now()}`,
          category: 'General',
          description: r.description || '',
          unit: 'unit',
          trackBatches: true,
          hasExpiry: Boolean(r.expiry_date),
          minimumStock: 0,
          maximumStock: undefined,
          defaultCostPrice: 0,
          defaultSellingPrice: r.sp || 0,
          gstRate: 0,
          hsnCode: undefined
        });
        inventoryService.addBatch({
          batchNumber: `${newP.sku}-${Date.now()}`,
          productId: newP.id,
          quantity: r.qty,
          sellingPrice: r.sp || 0,
          costPrice: 0,
          expiryDate: r.expiry_date,
          supplierName: batch.creditor_name
        });
      }
    });

    // expenses/payables (batch-level)
    if (batch.delivery_total_price) {
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      expenses.push({ id: `exp_${Date.now()}`, amount: Number(batch.delivery_total_price), payment_mode: batch.payment_mode, createdAt: new Date().toISOString() });
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
    if (batch.pending_amount) {
      const pays = JSON.parse(localStorage.getItem('payables') || '[]');
      pays.push({ id: `pay_${Date.now()}`, amount: Number(batch.pending_amount), party: batch.creditor_name, createdAt: new Date().toISOString(), status: 'pending' });
      localStorage.setItem('payables', JSON.stringify(pays));
    }

    // success toast via custom event
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: 'Added products from speech', description: `Added ${rows.length} items.` } }));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o)=> !o ? onClose() : null}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review & Approve</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="overflow-auto border rounded max-h-80">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Product</th>
                  <th className="px-2 py-1 text-left">Qty</th>
                  <th className="px-2 py-1 text-left">SP</th>
                  <th className="px-2 py-1 text-left">Expiry</th>
                  <th className="px-2 py-1 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1">{r.name}</td>
                    <td className="px-2 py-1"><Input type="number" value={r.qty} onChange={e=>{
                      const v = Number(e.target.value) || 0; setRows(prev => prev.map((x,i)=> i===idx?{...x, qty:v}:x));
                    }}/></td>
                    <td className="px-2 py-1"><Input type="number" value={r.sp || ''} onChange={e=>{
                      const v = Number(e.target.value) || 0; setRows(prev => prev.map((x,i)=> i===idx?{...x, sp:v}:x));
                    }}/></td>
                    <td className="px-2 py-1"><Input type="date" value={r.expiry_date || ''} onChange={e=>{
                      const v = e.target.value; setRows(prev => prev.map((x,i)=> i===idx?{...x, expiry_date:v}:x));
                    }}/></td>
                    <td className="px-2 py-1"><Input value={r.description || ''} onChange={e=>{
                      const v = e.target.value; setRows(prev => prev.map((x,i)=> i===idx?{...x, description:v}:x));
                    }}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="delivery_total_price" onChange={e=>setBatch(prev=>({...prev,delivery_total_price:e.target.value}))}/>
            <Input placeholder="payment_mode" onChange={e=>setBatch(prev=>({...prev,payment_mode:e.target.value}))}/>
            <Input placeholder="pending_amount" onChange={e=>setBatch(prev=>({...prev,pending_amount:e.target.value}))}/>
            <Input placeholder="creditor_name" onChange={e=>setBatch(prev=>({...prev,creditor_name:e.target.value}))}/>
          </div>

          {hasAmbiguous && (
            <Alert><AlertDescription className="text-red-600">Resolve ambiguities before approval.</AlertDescription></Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={approve} disabled={rows.length===0 || hasAmbiguous}>Approve & Commit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpeechReviewModal;
