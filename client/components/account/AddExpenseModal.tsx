import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema, ExpenseCategoryEnum, type ExpenseInput } from '@/lib/validators/expense';
import { useAddExpense } from '@/hooks/useExpense';
import { useToast } from '@/hooks/use-toast';

export default function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseInput>({ resolver: zodResolver(ExpenseSchema), defaultValues: { amount: 0 } as any });
  const addMutation = useAddExpense();

  const onSubmit = (data: ExpenseInput) => {
    addMutation.mutate(data, {
      onSuccess: () => { toast({ title: 'Expense added' }); reset(); onClose(); },
      onError: () => { toast({ title: 'Failed to add expense', variant: 'destructive' }); }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record an outgoing payment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
          </div>
          <div>
            <Label>Category</Label>
            <select {...register('category')} className="w-full border rounded px-3 py-2">
              {ExpenseCategoryEnum.options.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input {...register('description')} />
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
