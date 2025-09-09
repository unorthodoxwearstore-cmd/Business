import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { rawMaterialRepository } from '@/services/indexeddb/repositories/rawMaterialRepository';
import { productRepository } from '@/services/indexeddb/repositories/productRepository';
import { billOfMaterialsRepository } from '@/services/indexeddb/repositories/billOfMaterialsRepository';
import { saleInvoiceRepository } from '@/services/indexeddb/repositories/saleInvoiceRepository';
import { toBePaidRepository } from '@/services/indexeddb/repositories/toBePaidRepository';

// Note: fake-indexeddb/auto provides an in-memory IndexedDB implementation

describe('IndexedDB repositories', () => {
  beforeEach(async () => {
    // No-op: each test starts with empty in-memory DB by default
  });

  it('persists and retrieves raw materials', async () => {
    const saved = await rawMaterialRepository.add({
      name: 'Sugar',
      category: 'Sweeteners',
      unit: 'gm',
      quantity: 500,
      totalPrice: 250,
      unitPrice: 0.5,
      warehouse: 'Main',
      createdAt: new Date().toISOString(),
      expiry: undefined
    });
    const all = await rawMaterialRepository.getAll();
    expect(all.find(m => m.id === saved.id)).toBeTruthy();
  });

  it('persists and retrieves products', async () => {
    const saved = await productRepository.add({
      name: 'Chocolate Bar',
      sku: 'CB-001',
      category: 'Confectionery',
      variant: 'Dark',
      orderQuantity: 100,
      totalCost: 500,
      costPerUnit: 5,
      unit: 'pcs',
      expiry: undefined
    });
    const one = await productRepository.getById(saved.id);
    expect(one?.name).toBe('Chocolate Bar');
  });

  it('persists and retrieves BOMs', async () => {
    const bom = await billOfMaterialsRepository.add({
      name: 'Chocolate Bar Recipe',
      components: [{ materialId: 'rm1', quantity: 2 }],
      outputUnits: 10,
      totalRawMaterialCost: 20,
      manufacturingCostPerUnit: 2,
      breakdown: [{ materialId: 'rm1', unitCost: 10, quantity: 2, cost: 20 }],
      startDate: undefined,
      endDate: undefined
    } as any);
    const all = await billOfMaterialsRepository.getAll();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].name).toBe('Chocolate Bar Recipe');
  });

  it('persists invoices and adds to to-be-paid when pending', async () => {
    const inv = await saleInvoiceRepository.add({
      invoiceDate: new Date().toISOString(),
      productId: 'p1',
      quantity: 2,
      sellingPricePerUnit: 50,
      paymentMode: 'Cash',
      customerNumber: '+9199XXXX',
      customerName: 'John',
      paymentStatus: 'Paid',
      totalAmount: 100
    } as any);
    const got = await saleInvoiceRepository.getById(inv.id);
    expect(got?.totalAmount).toBe(100);

    const pending = await toBePaidRepository.add({ invoiceId: inv.id, customerNumber: inv.customerNumber, amount: 100 });
    expect(pending.status).toBe('pending');
  });
});
