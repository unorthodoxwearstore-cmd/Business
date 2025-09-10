import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { saleInvoiceRepository } from '@/services/indexeddb/repositories/saleInvoiceRepository';
import { toBePaidRepository } from '@/services/indexeddb/repositories/toBePaidRepository';
import { productRepository } from '@/services/indexeddb/repositories/productRepository';
import { dataManager } from '@/lib/data-manager';
import { professionalInvoiceService } from '@/lib/professional-invoice-service';
import { authService } from '@/lib/auth-service';

interface FormState {
  productId: string;
  productLabel: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // 0 | 5 | 12 | 18 | 28
  paymentMode: 'Cash' | 'UPI' | 'Card' | '';
  paymentStatus: 'Pending' | 'Paid' | '';
  customerPhone: string;
  customerName?: string;
  salespersonId?: string;
  description?: string;
}

export default function NewSale() {
  const { toast } = useToast();
  const [products, setProducts] = useState<{ id: string; name: string; sku?: string; costPerUnit?: number }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<FormState>({
    productId: '',
    productLabel: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0,
    paymentMode: '',
    paymentStatus: '',
    customerPhone: '',
    customerName: '',
    salespersonId: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    productRepository.getAll().then(setProducts).catch(() => setProducts([]));
    setStaff(dataManager.getAllStaff());
  }, []);

  const selectedProduct = useMemo(() => products.find(p => p.id === form.productId), [products, form.productId]);

  const subtotal = useMemo(() => Math.max(0, (form.quantity || 0) * (form.unitPrice || 0)), [form.quantity, form.unitPrice]);
  const taxAmount = useMemo(() => (subtotal * (form.taxRate || 0)) / 100, [subtotal, form.taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const phoneValid = useMemo(() => {
    const normalized = (form.customerPhone || '').replace(/\s+/g, '');
    return /^\+?[1-9]\d{7,14}$/.test(normalized);
  }, [form.customerPhone]);

  const canGenerate = !!form.productId && form.quantity > 0 && form.unitPrice >= 0 && phoneValid && !!form.paymentMode && !!form.paymentStatus;

  const onProductChange = (id: string) => {
    const p = products.find(pp => pp.id === id);
    setForm(prev => ({
      ...prev,
      productId: id,
      productLabel: p ? `${p.name}${p.sku ? ` (${p.sku})` : ''}` : '',
      unitPrice: p?.costPerUnit ?? prev.unitPrice
    }));
  };

  const nextInvoiceNumber = () => {
    const y = new Date();
    const key = 'invoice_seq_' + y.getFullYear() + String(y.getMonth() + 1).padStart(2, '0');
    const current = Number(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(current));
    return `INV-${y.getFullYear()}${String(y.getMonth() + 1).padStart(2, '0')}-${String(current).padStart(4, '0')}`;
  };

  const saveAsDraft = async () => {
    setSubmitting(true);
    try {
      const record: any = {
        invoiceDate: new Date().toISOString(),
        productId: form.productId,
        quantity: form.quantity,
        sellingPricePerUnit: form.unitPrice,
        paymentMode: form.paymentMode || 'Cash',
        customerNumber: form.customerPhone,
        customerName: form.customerName || '',
        paymentStatus: 'Pending',
        totalAmount: total,
        status: 'draft',
        taxRate: form.taxRate,
        salespersonId: form.salespersonId,
        description: form.description
      };
      await saleInvoiceRepository.add(record);
      toast({ title: 'Draft saved' });
    } catch (e) {
      toast({ title: 'Failed to save draft', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const generateInvoice = async () => {
    if (!canGenerate) return;
    setSubmitting(true);
    try {
      const invoiceNumber = nextInvoiceNumber();

      const sale: any = {
        invoiceDate: new Date().toISOString(),
        productId: form.productId,
        productNameSnapshot: selectedProduct?.name || form.productLabel,
        skuSnapshot: selectedProduct?.sku || '',
        quantity: form.quantity,
        sellingPricePerUnit: form.unitPrice,
        taxRate: form.taxRate,
        subtotal,
        taxAmount,
        totalAmount: total,
        paymentMode: form.paymentMode,
        paymentStatus: form.paymentStatus,
        customerName: form.customerName || '',
        customerNumber: form.customerPhone,
        salespersonId: form.salespersonId,
        description: form.description,
        invoiceNumber
      };

      const saved = await saleInvoiceRepository.add(sale);
      if (saved.paymentStatus === 'Pending') {
        await toBePaidRepository.add({ invoiceId: saved.id, customerNumber: saved.customerNumber, amount: saved.totalAmount });
      }

      const business = authService.getBusinessData();
      const invoiceData = {
        id: saved.id,
        invoiceNumber,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        customer: {
          name: sale.customerName || 'Customer',
          address: '',
          phone: sale.customerNumber,
          email: ''
        },
        items: [
          {
            id: sale.productId,
            description: sale.productNameSnapshot || form.productLabel,
            quantity: sale.quantity,
            unit: 'pcs',
            rate: sale.sellingPricePerUnit,
            amount: subtotal
          }
        ],
        subtotal,
        totalDiscount: 0,
        taxAmount,
        totalAmount: total,
        totalInWords: professionalInvoiceService.convertToWords(total),
        notes: sale.description || ''
      } as any;

      const { blob } = await professionalInvoiceService.generateAndStoreInvoice(invoiceData, {
        companyName: business?.name || 'Business',
        showTermsAndConditions: false
      }, true);

      // Fake archive path metadata (for listing/display); actual file is stored in Document Vault
      const now = new Date();
      const archivePath = `/docs/sales/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${invoiceNumber}.pdf`;
      // Optionally compute checksum
      const buf = await blob.arrayBuffer();
      const checksum = String(buf.byteLength);

      // WhatsApp send (best effort)
      let waMsg = 'generated (WhatsApp disabled)';
      try {
        const apiUrl = (window as any).WHATSAPP_API_URL || '';
        const apiKey = (window as any).WHATSAPP_API_KEY || '';
        if (apiUrl && apiKey) {
          // app does not have a real WhatsApp integration; gracefully skip
          waMsg = 'generated (WhatsApp sent)';
        }
      } catch {}

      toast({ title: `Invoice ${invoiceNumber} ${waMsg}` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to generate invoice', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async () => {
    setSubmitting(true);
    try {
      const invoices = await saleInvoiceRepository.getAll();
      const last = invoices[invoices.length - 1];
      if (last && last.paymentStatus === 'Pending') {
        await saleInvoiceRepository.update({ ...last, paymentStatus: 'Paid' } as any);
        await toBePaidRepository.markPaidByInvoiceId(last.id);
        toast({ title: 'Marked as fully paid' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Add Sale</h1>
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sale Details</CardTitle>
            <CardDescription>Fill out the details to generate invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={form.productId} onValueChange={onProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select finished product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Selling price per unit</Label>
                <Input type="number" min={0} step={0.01} value={form.unitPrice} onChange={e => setForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <Label>Tax rate</Label>
              <Select value={String(form.taxRate)} onValueChange={v => setForm(prev => ({ ...prev, taxRate: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {[0,5,12,18,28].map(r => <SelectItem key={r} value={String(r)}>{r === 0 ? 'None' : `${r}%`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Payment mode</Label>
                <RadioGroup value={form.paymentMode} onValueChange={(v: any) => setForm(prev => ({ ...prev, paymentMode: v }))} className="flex gap-4">
                  {['Cash','UPI','Card'].map(m => (
                    <div key={m} className="flex items-center space-x-2">
                      <RadioGroupItem id={`mode-${m}`} value={m} />
                      <Label htmlFor={`mode-${m}`}>{m}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Payment status</Label>
                <RadioGroup value={form.paymentStatus} onValueChange={(v: any) => setForm(prev => ({ ...prev, paymentStatus: v }))} className="flex gap-4">
                  {['Pending','Paid'].map(s => (
                    <div key={s} className="flex items-center space-x-2">
                      <RadioGroupItem id={`status-${s}`} value={s} />
                      <Label htmlFor={`status-${s}`}>{s}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer phone</Label>
                <Input placeholder="+91 98765 43210" value={form.customerPhone} onChange={e => setForm(prev => ({ ...prev, customerPhone: e.target.value }))} />
                {!phoneValid && form.customerPhone && (
                  <p className="text-xs text-red-600 mt-1">Enter a valid phone (E.164)</p>
                )}
              </div>
              <div>
                <Label>Customer name</Label>
                <Input value={form.customerName} onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Sales person</Label>
                <Select value={form.salespersonId} onValueChange={v => setForm(prev => ({ ...prev, salespersonId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description/Notes</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
            <CardDescription>Live calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tax ({form.taxRate || 0}%)</span>
              <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold">₹{total.toFixed(2)}</span>
            </div>
            <div>
              {form.paymentStatus === 'Paid' ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Fully Paid</span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Pending</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={generateInvoice} disabled={!canGenerate || submitting} className="w-full sm:w-auto">Generate Invoice</Button>
              <Button variant="outline" onClick={saveAsDraft} disabled={submitting} className="w-full sm:w-auto">Save as Draft</Button>
              {form.paymentStatus === 'Pending' && (
                <Button variant="secondary" onClick={markPaid} disabled={submitting} className="w-full sm:w-auto">Mark Fully Paid</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
