import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { useSaleInvoices } from '@/hooks/useSaleInvoice';
import { saleInvoiceRepository } from '@/services/indexeddb/repositories/saleInvoiceRepository';
import { toBePaidRepository } from '@/services/indexeddb/repositories/toBePaidRepository';

export default function PendingSalesTable({ onChanged }: { onChanged?: ()=>void }) {
  const { data: invoices, refetch } = useSaleInvoices();
  const [search, setSearch] = useState('');

  const pending = useMemo(() => {
    const list = (invoices || []).filter(inv => inv.paymentStatus === 'Pending');
    if (!search) return list;
    return list.filter(inv => (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) || (inv.customerNumber || '').toLowerCase().includes(search.toLowerCase()));
  }, [invoices, search]);

  const markPaid = async (id: string) => {
    const inv = (invoices || []).find(i => i.id === id);
    if (!inv) return;
    await saleInvoiceRepository.update({ ...inv, paymentStatus: 'Paid' });
    await toBePaidRepository.markPaidByInvoiceId(inv.id);
    await refetch();
    onChanged?.();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Pending Sales</h3>
        <Input placeholder="Filter by customer..." value={search} onChange={e=>setSearch(e.target.value)} className="w-56" />
      </div>
      {pending.length === 0 ? (
        <div className="text-sm text-gray-500 py-4">No receivables pending.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(inv => (
                <tr key={inv.id} className="border-t">
                  <td className="p-2">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-2">{inv.customerName || inv.customerNumber}</td>
                  <td className="p-2 text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(inv.totalAmount)}</td>
                  <td className="p-2 text-right"><Button size="sm" onClick={()=>markPaid(inv.id)}>Mark Paid</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
