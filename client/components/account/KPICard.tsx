import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function KPICard({ title, amount, accent }: { title: string; amount: number; accent?: 'blue'|'red'|'green' }) {
  const color = accent === 'red' ? 'text-red-600' : accent === 'green' ? 'text-green-600' : 'text-blue-600';
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{formatCurrency(amount)}</div>
      </CardContent>
    </Card>
  );
}
