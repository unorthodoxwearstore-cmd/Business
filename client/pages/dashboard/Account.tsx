import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import KPICard from '@/components/account/KPICard';
import PendingSalesTable from '@/components/account/PendingSalesTable';
import ExpenseList from '@/components/account/ExpenseList';
import AddExpenseModal from '@/components/account/AddExpenseModal';
import { useSaleInvoices } from '@/hooks/useSaleInvoice';
import { useExpenses } from '@/hooks/useExpense';
import { useState, useMemo } from 'react';

export default function AccountPage() {
  const { data: invoices, refetch: refetchInvoices } = useSaleInvoices();
  const { data: expenses } = useExpenses();
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => {
    const receivable = (invoices || []).filter(i => i.paymentStatus === 'Pending').reduce((s, i) => s + (i.totalAmount || 0), 0);
    const paid = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    return { receivable, paid };
  }, [invoices, expenses]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Account</h1>
        <Button onClick={()=>setOpen(true)}>Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard title="Amount to be RECEIVED" amount={totals.receivable} accent="green" />
        <KPICard title="Amount to be PAID" amount={totals.paid} accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingSalesTable onChanged={()=>refetchInvoices()} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseList />
          </CardContent>
        </Card>
      </div>

      <AddExpenseModal open={open} onClose={()=>setOpen(false)} />
    </div>
  );
}
