import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SaleInvoiceSchema, type SaleInvoiceInput, type SaleInvoice } from '@/lib/validators/saleInvoice';
import { saleInvoiceRepository } from '@/services/indexeddb/repositories/saleInvoiceRepository';
import { toBePaidRepository } from '@/services/indexeddb/repositories/toBePaidRepository';
import { sendInvoiceViaWhatsApp } from '@/services/whatsapp';

export const useSaleInvoiceStore = create<{ lastAddedId: string | null; setLastAddedId: (id: string | null) => void }>((set) => ({
  lastAddedId: null,
  setLastAddedId: (id) => set({ lastAddedId: id })
}));

export function useSaleInvoices() {
  return useQuery({
    queryKey: ['sale_invoices'],
    queryFn: () => saleInvoiceRepository.getAll()
  });
}

export function useAddSaleInvoice() {
  const qc = useQueryClient();
  const setLast = useSaleInvoiceStore((s) => s.setLastAddedId);
  return useMutation({
    mutationFn: async (input: SaleInvoiceInput) => {
      const parsed = SaleInvoiceSchema.parse(input);
      const totalAmount = parsed.sellingPricePerUnit * (parsed.quantity ?? 1);
      const record: Omit<SaleInvoice, 'id'> = {
        invoiceDate: parsed.invoiceDate ?? new Date().toISOString(),
        productId: parsed.productId,
        quantity: parsed.quantity ?? 1,
        sellingPricePerUnit: parsed.sellingPricePerUnit,
        paymentMode: parsed.paymentMode,
        customerNumber: parsed.customerNumber,
        customerName: parsed.customerName,
        paymentStatus: parsed.paymentStatus ?? 'Paid',
        totalAmount
      } as Omit<SaleInvoice, 'id'>;
      const saved = await saleInvoiceRepository.add(record);
      if (saved.paymentStatus === 'Pending') {
        await toBePaidRepository.add({ invoiceId: saved.id, customerNumber: saved.customerNumber, amount: saved.totalAmount });
      }
      return saved;
    },
    onSuccess: (res) => {
      setLast(res.id);
      qc.invalidateQueries({ queryKey: ['sale_invoices'] });
      qc.invalidateQueries({ queryKey: ['to_be_paid'] });
    }
  });
}

export function useToBePaidList() {
  return useQuery({ queryKey: ['to_be_paid'], queryFn: () => toBePaidRepository.getAll() });
}

export function useSendInvoice() {
  return useMutation({
    mutationFn: (vars: { invoiceId: string; customerNumber: string }) => sendInvoiceViaWhatsApp(vars.invoiceId, vars.customerNumber)
  });
}
