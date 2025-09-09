import { useMemo, useState } from 'react';
import { useExpenses } from '@/hooks/useExpense';
import { ExpenseCategoryEnum } from '@/lib/validators/expense';

export default function ExpenseList() {
  const { data: expenses } = useExpenses();
  const [category, setCategory] = useState<'All'|typeof ExpenseCategoryEnum._type>('All' as any);

  const filtered = useMemo(() => {
    if (!expenses) return [];
    if (category === 'All') return expenses;
    return expenses.filter(e => e.category === category);
  }, [expenses, category]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Expenses</h3>
        <select value={category as any} onChange={e=>setCategory(e.target.value as any)} className="border rounded px-3 py-2 text-sm">
          <option>All</option>
          {ExpenseCategoryEnum.options.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-sm text-gray-500 py-4">No expenses recorded yet.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => (
                <tr key={exp.id} className="border-t">
                  <td className="p-2">{new Date(exp.dateISO).toLocaleDateString('en-IN')}</td>
                  <td className="p-2">{exp.category}</td>
                  <td className="p-2 text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(exp.amount)}</td>
                  <td className="p-2">{exp.description || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
