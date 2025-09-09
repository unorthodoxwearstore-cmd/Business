import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import Fuse from 'fuse.js';
import { inventoryService } from './inventory-service';
import { branchService } from './branch-service';

export type SmartImportSource = 'image' | 'file';
export type SmartImportModule =
  | 'inventory_products'
  | 'manufacturer_raw_materials'
  | 'manufacturer_bom'
  | 'sales_bulk_backfill'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'pending'
  | 'manufacturer_production_orders';

export interface ImportBatchSummary {
  id: string;
  module: SmartImportModule;
  createdAt: string;
  createdBy: string;
  branchId: string | null;
  sourceType: SmartImportSource;
  fileName: string;
  originalFileDataUrl?: string; // for traceability
  rowCounts: { imported: number; updated: number; skipped: number };
  errorsCsv?: string; // data URL for download
  mappingTemplateName?: string;
  notes?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number; // 0..1
}

export interface ImportRecord {
  [key: string]: any;
}

export interface ImportPlan {
  module: SmartImportModule;
  records: ImportRecord[];
  fieldMappings: FieldMapping[];
  batchFields?: Record<string, any>;
  conflictStrategy: 'create_update_skip' | 'replace_all' | 'merge';
}

const STORAGE_KEYS = {
  batches: 'hisaabb_import_batches',
  templates: 'hisaabb_import_templates',
};

// PDF worker setup (vite builds worker automatically if path provided at runtime)
// @ts-ignore
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.js`;

export class ImportService {
  // Parse any supported file into rows
  async parseFile(file: File): Promise<{ rows: ImportRecord[]; fields: string[] }>{
    const ext = file.name.toLowerCase();
    if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv')) {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const fields = json.length > 0 ? Object.keys(json[0]) : [];
      return { rows: json, fields };
    }
    if (ext.endsWith('.pdf')) {
      const text = await this.extractPdfText(file);
      return this.rowsFromFreeText(text);
    }
    if (ext.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return this.rowsFromFreeText(result.value || '');
    }
    // Fallback: try as CSV via xlsx
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const fields = json.length > 0 ? Object.keys(json[0]) : [];
    return { rows: json, fields };
  }

  async parseImage(file: File): Promise<{ rows: ImportRecord[]; fields: string[] }>{
    const { data } = await Tesseract.recognize(file, 'eng');
    return this.rowsFromFreeText(data.text || '');
  }

  private rowsFromFreeText(text: string): { rows: ImportRecord[]; fields: string[] }{
    // Simple heuristic: try to detect table-like structures by lines and delimiters
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return { rows: [], fields: [] };

    // Detect delimiter from first non-empty line
    const candidateDelims = [',', '\t', ';', '|'];
    let headers: string[] = [];
    let dataRows: string[][] = [];

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      for (const d of candidateDelims) {
        const parts = line.split(d);
        if (parts.length >= 2) {
          const allRows = lines.map(l => l.split(d));
          headers = allRows[0].map((h, idx) => h?.toString().trim() || `col_${idx+1}`);
          dataRows = allRows.slice(1);
          const rows = dataRows.map(r => Object.fromEntries(r.map((v, idx) => [headers[idx] || `col_${idx+1}`, v?.toString().trim()])));
          return { rows, fields: headers };
        }
      }
    }

    // Fallback: each line as a single column "text"
    const rows = lines.map(t => ({ text: t }));
    return { rows, fields: ['text'] };
  }

  private async extractPdfText(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    const pdf = await getDocument({ data: buf }).promise;
    const maxPages = Math.min(pdf.numPages, 10);
    let text = '';
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it: any) => it.str).join(' ');
      text += pageText + '\n';
    }
    return text;
  }

  // Try to auto-map fields using fuzzy matching to expected target fields
  autoMapFields(sourceFields: string[], expectedTargets: string[]): FieldMapping[] {
    const fuse = new Fuse(expectedTargets.map(t => ({ key: t })), { keys: ['key'], includeScore: true, threshold: 0.4 });
    const mappings: FieldMapping[] = [];
    sourceFields.forEach(sf => {
      const q = sf.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const best = fuse.search(q)[0];
      if (best) {
        const target = best.item.key;
        const confidence = 1 - (best.score || 0);
        mappings.push({ sourceField: sf, targetField: target, confidence });
      }
    });
    return mappings;
  }

  // Templates
  saveTemplate(module: SmartImportModule, name: string, mappings: FieldMapping[]) {
    const all = this.getAllTemplates();
    const key = `${module}::${name}`;
    all[key] = mappings;
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(all));
  }

  getTemplate(module: SmartImportModule, name: string): FieldMapping[] | null {
    const all = this.getAllTemplates();
    const key = `${module}::${name}`;
    return all[key] || null;
  }

  getAllTemplates(): Record<string, FieldMapping[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.templates);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // Validation helpers
  validateRequired(record: ImportRecord, required: string[]): string[] {
    const errs: string[] = [];
    for (const f of required) {
      const v = record[f];
      if (v === undefined || v === null || `${v}`.trim() === '') {
        errs.push(`Missing required: ${f}`);
      }
    }
    return errs;
  }

  validateTypes(record: ImportRecord, types: Record<string, 'number' | 'string' | 'date'>): string[] {
    const errs: string[] = [];
    Object.entries(types).forEach(([field, type]) => {
      const v = record[field];
      if (v === undefined || v === null || v === '') return;
      if (type === 'number' && isNaN(Number(v))) errs.push(`Invalid number: ${field}`);
      if (type === 'date' && isNaN(new Date(v).getTime())) errs.push(`Invalid date: ${field}`);
    });
    return errs;
  }

  private recordActivity(summary: ImportBatchSummary) {
    const key = 'activity_logs';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    logs.unshift({ id: `act_${Date.now()}`, type: 'import', module: summary.module, createdAt: summary.createdAt, createdBy: summary.createdBy, link: `/imports/${summary.id}`, counts: summary.rowCounts, fileName: summary.fileName });
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 1000)));
  }

  private reduceProductStock(productId: string, qty: number) {
    let remaining = qty;
    const stock = inventoryService.getCurrentStock(productId);
    for (const batch of stock.batches) {
      if (remaining <= 0) break;
      const use = Math.min(batch.quantity, remaining);
      inventoryService.updateBatch(batch.id, { quantity: batch.quantity - use });
      remaining -= use;
    }
  }

  // Commit plan by module
  async commit(plan: ImportPlan): Promise<ImportBatchSummary> {
    const user = JSON.parse(localStorage.getItem('hisaabb_user') || '{}');
    const branchId = branchService.getCurrentBranchId();
    const batchId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let imported = 0, updated = 0, skipped = 0;
    const rowErrors: string[] = [];

    for (const rec of plan.records) {
      try {
        switch (plan.module) {
          case 'inventory_products': {
            const name = String(rec.product_name || '').trim();
            if (!name) throw new Error('product_name is required');
            const sp = rec.sp_per_unit !== undefined && rec.sp_per_unit !== '' ? Number(rec.sp_per_unit) : undefined;
            const qtyAdd = rec.qty_add ? Number(rec.qty_add) : 0;
            const expiry = rec.expiry_date ? new Date(rec.expiry_date).toISOString() : undefined;
            // Find existing by case-insensitive name
            const all = inventoryService.getProducts();
            const existing = all.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              if (sp !== undefined && !isNaN(sp)) {
                inventoryService.updateProduct(existing.id, { defaultSellingPrice: sp });
              }
              if (qtyAdd > 0) {
                inventoryService.addBatch({
                  batchNumber: `${existing.sku || existing.id}-${Date.now()}`,
                  productId: existing.id,
                  quantity: qtyAdd,
                  expiryDate: expiry,
                  costPrice: existing.defaultCostPrice || 0,
                  sellingPrice: sp ?? existing.defaultSellingPrice,
                  supplierName: plan.batchFields?.creditor_name
                });
              }
              updated++;
            } else {
              const newProd = inventoryService.addProduct({
                name,
                sku: `SKU-${Date.now()}`,
                category: 'General',
                description: rec.description || '',
                unit: 'unit',
                trackBatches: true,
                hasExpiry: Boolean(expiry),
                minimumStock: Number(rec.min_level || 0),
                maximumStock: undefined,
                defaultCostPrice: 0,
                defaultSellingPrice: sp || 0,
                gstRate: 0,
                hsnCode: undefined
              });
              if (qtyAdd > 0) {
                inventoryService.addBatch({
                  batchNumber: `${newProd.sku}-${Date.now()}`,
                  productId: newProd.id,
                  quantity: qtyAdd,
                  expiryDate: expiry,
                  costPrice: 0,
                  sellingPrice: sp || 0,
                  supplierName: plan.batchFields?.creditor_name
                });
              }
              imported++;
            }
            // Expense/Payable handling (batch-level)
            // Persist a simple expense and payable ledger for traceability
            if (plan.batchFields?.delivery_total_price) {
              this.recordExpense({
                module: plan.module,
                amount: Number(plan.batchFields.delivery_total_price),
                payment_mode: plan.batchFields.payment_mode,
                creditor_name: plan.batchFields.creditor_name
              });
              if (plan.batchFields.pending_amount) {
                this.recordPayable({
                  amount: Number(plan.batchFields.pending_amount),
                  party: plan.batchFields.creditor_name,
                });
              }
            }
            break;
          }
          case 'manufacturer_raw_materials': {
            const name = String(rec.rm_name || '').trim();
            if (!name) throw new Error('rm_name is required');
            // Store in localStorage under a key; simple structure
            const key = 'mfg_raw_materials';
            const list: any[] = JSON.parse(localStorage.getItem(key) || '[]');
            const idx = list.findIndex(r => String(r.name).toLowerCase() === name.toLowerCase());
            const qty = Number(rec.qty_purchase || 0);
            const total = rec.purchase_total_price ? Number(rec.purchase_total_price) : undefined;
            if (idx >= 0) {
              list[idx].currentStock = Number(list[idx].currentStock || 0) + qty;
              if (total) list[idx].lastPurchasePrice = total;
              if (rec.warehouse_location) list[idx].warehouse = rec.warehouse_location;
              updated++;
            } else {
              list.push({
                id: `rm_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                name,
                currentStock: qty,
                lastPurchasePrice: total || 0,
                warehouse: rec.warehouse_location || ''
              });
              imported++;
            }
            localStorage.setItem(key, JSON.stringify(list));
            // Expense/Payable
            if (total || plan.batchFields?.delivery_total_price) {
              const amount = total ?? Number(plan.batchFields?.delivery_total_price || 0);
              if (amount > 0) this.recordExpense({ module: plan.module, amount });
              if (plan.batchFields?.pending_amount) {
                this.recordPayable({ amount: Number(plan.batchFields.pending_amount), party: plan.batchFields.creditor_name });
              }
            }
            break;
          }
          case 'manufacturer_bom': {
            const fp = String(rec.finished_product || '').trim();
            if (!fp) throw new Error('finished_product is required');
            const key = 'mfg_boms';
            const list: any[] = JSON.parse(localStorage.getItem(key) || '[]');
            const existingIdx = list.findIndex((b: any) => b.finished_product.toLowerCase() === fp.toLowerCase());
            const material = {
              rm_name: rec.rm_name,
              rm_code: rec.rm_code,
              qty_per_unit: Number(rec.qty_per_unit || 0),
              overheads: rec.overheads ? Number(rec.overheads) : undefined,
              expected_yield_pct: rec.expected_yield_pct ? Number(rec.expected_yield_pct) : undefined
            };
            if (existingIdx >= 0) {
              if (plan.conflictStrategy === 'replace_all') {
                list[existingIdx] = { finished_product: fp, materials: [material] };
              } else {
                // merge
                const mats = list[existingIdx].materials || [];
                mats.push(material);
                list[existingIdx].materials = mats;
              }
              updated++;
            } else {
              list.push({ finished_product: fp, materials: [material] });
              imported++;
            }
            localStorage.setItem(key, JSON.stringify(list));
            break;
          }
          case 'customers': {
            const list = JSON.parse(localStorage.getItem('hisaabb_customers') || '[]');
            const phone = (rec.phone || '').toString().trim();
            const name = (rec.name || '').toString().trim();
            if (!name) throw new Error('name is required');
            let idx = -1;
            if (phone) idx = list.findIndex((c: any) => (c.phone||'').toString() === phone);
            if (idx === -1) idx = list.findIndex((c: any) => c.name?.toLowerCase() === name.toLowerCase() && (c.email||'').toLowerCase() === (rec.email||'').toString().toLowerCase());
            if (idx >= 0) {
              const c = list[idx];
              const updatedRec = { ...c };
              ['email','address','credit_limit','notes'].forEach(f => { if (rec[f] !== undefined && rec[f] !== '') (updatedRec as any)[f] = rec[f]; });
              list[idx] = updatedRec;
              updated++;
            } else {
              list.push({ id: `cust_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, name, phone, email: rec.email||'', address: rec.address||'', totalPurchases: 0, createdAt: new Date().toISOString() });
              imported++;
            }
            localStorage.setItem('hisaabb_customers', JSON.stringify(list));
            break;
          }
          case 'suppliers': {
            const key = 'hisaabb_vendors';
            const vendors: any[] = JSON.parse(localStorage.getItem(key) || '[]');
            const phone = (rec.phone || '').toString().trim();
            const name = (rec.name || '').toString().trim();
            if (!name) throw new Error('name is required');
            let idx = -1;
            if (phone) idx = vendors.findIndex((v:any) => (v.phone||'').toString() === phone);
            if (idx === -1) idx = vendors.findIndex((v:any) => v.name?.toLowerCase() === name.toLowerCase() && (v.email||'').toLowerCase() === (rec.email||'').toString().toLowerCase());
            if (idx >= 0) {
              const v = vendors[idx];
              const updatedV = { ...v };
              ['email','address','gstin','terms','notes'].forEach(f => { if (rec[f] !== undefined && rec[f] !== '') (updatedV as any)[f] = rec[f]; });
              vendors[idx] = updatedV;
              updated++;
            } else {
              vendors.push({ id: `ven_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, name, phone, email: rec.email||'', address: rec.address||'', gstin: rec.gstin||'', terms: rec.terms||'', notes: rec.notes||'', createdAt: new Date().toISOString(), totalOrders: 0, totalOrderValue: 0 });
              imported++;
            }
            localStorage.setItem(key, JSON.stringify(vendors));
            break;
          }
          case 'purchases': {
            const isRm = rec.is_rm === true || (plan.batchFields?.is_rm === true) || (typeof rec.is_rm === 'string' && rec.is_rm.toLowerCase() === 'true');
            const qty = Number(rec.qty || 0);
            const name = (rec.product_name || rec.rm_name || '').toString().trim();
            if (!name || qty <= 0) throw new Error('product_name/rm_name and qty required');
            if (isRm) {
              const key = 'mfg_raw_materials';
              const list: any[] = JSON.parse(localStorage.getItem(key) || '[]');
              const idx = list.findIndex((r:any) => r.name?.toLowerCase() === name.toLowerCase());
              if (idx >= 0) list[idx].currentStock = Number(list[idx].currentStock||0) + qty; else list.push({ id: `rm_${Date.now()}`, name, currentStock: qty });
              localStorage.setItem(key, JSON.stringify(list));
            } else {
              const prod = inventoryService.getProducts().find(p => p.name.toLowerCase() === name.toLowerCase());
              const product = prod || inventoryService.addProduct({ name, sku:`SKU-${Date.now()}`, category:'General', description:'', unit:'unit', trackBatches:true, hasExpiry:false, minimumStock:0, defaultCostPrice:0, defaultSellingPrice:0, gstRate:0 });
              inventoryService.addBatch({ batchNumber: `${product.sku}-${Date.now()}`, productId: product.id, quantity: qty, costPrice: Number(rec.final_purchase_amount||0)/(qty||1), sellingPrice: product.defaultSellingPrice, supplierName: rec.supplier_name, expiryDate: rec.due_date });
            }
            if (rec.final_purchase_amount) this.recordExpense({ module: plan.module, amount: Number(rec.final_purchase_amount), creditor_name: rec.supplier_name });
            if (rec.due_date || plan.batchFields?.pending_amount) {
              this.recordPayable({ amount: Number(plan.batchFields?.pending_amount || rec.final_purchase_amount || 0), party: rec.supplier_name });
            }
            imported++;
            break;
          }
          case 'sales_bulk_backfill': {
            const date = rec.date || rec['date/time'] || rec.datetime;
            const items = Array.isArray(rec.items) ? rec.items : (rec['line items'] || []);
            const productNames = items.length ? items : [{ product_name: rec.product_name, qty: rec.qty, sp_used: rec.sp_used }];
            let total = 0;
            const lines: any[] = [];
            productNames.forEach((li: any) => {
              const n = (li.product_name || '').toString().trim();
              const q = Number(li.qty||0);
              const sp = Number(li.sp_used||0);
              total += q * sp;
              const prod = inventoryService.getProducts().find(p => p.name.toLowerCase() === n.toLowerCase());
              if (prod) {
                this.reduceProductStock(prod.id, q);
                lines.push({ productId: prod.id, productName: prod.name, quantity: q, price: sp, total: q*sp });
              }
            });
            const sales = JSON.parse(localStorage.getItem('hisaabb_sales') || '[]');
            sales.push({ id:`sale_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, customerName: rec.customer_contact || 'Walk-in', total, date: date || new Date().toISOString(), lines });
            localStorage.setItem('hisaabb_sales', JSON.stringify(sales));
            imported++;
            break;
          }
          case 'pending': {
            const entries = JSON.parse(localStorage.getItem('pending_entries') || '[]');
            entries.push({ id:`pend_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, type: rec.type, party: rec.party, original_amount: Number(rec.original_amount||0), balance: Number(rec.balance||0), due_date: rec.due_date || '' });
            localStorage.setItem('pending_entries', JSON.stringify(entries));
            imported++;
            break;
          }
          case 'manufacturer_production_orders': {
            const fp = (rec.finished_product||'').toString().trim();
            const qty = Number(rec.qty_to_produce||0);
            if (!fp || qty<=0) throw new Error('finished_product and qty_to_produce required');
            const complete = Boolean(rec.complete_date);
            const prod = inventoryService.getProducts().find(p => p.name.toLowerCase() === fp.toLowerCase()) || inventoryService.addProduct({ name: fp, sku:`SKU-${Date.now()}`, category:'FG', description:'', unit:'unit', trackBatches:true, hasExpiry:false, minimumStock:0, defaultCostPrice:0, defaultSellingPrice:0, gstRate:0 });
            if (complete) {
              inventoryService.addBatch({ batchNumber: rec.batch_no||`FG-${Date.now()}`, productId: prod.id, quantity: Number(rec.good_output_units||qty), costPrice: 0, sellingPrice: prod.defaultSellingPrice, expiryDate: undefined });
              const boms = JSON.parse(localStorage.getItem('mfg_boms') || '[]');
              const bom = boms.find((b:any)=> b.finished_product?.toLowerCase() === fp.toLowerCase());
              if (bom) {
                const rmKey='mfg_raw_materials';
                const rms:any[] = JSON.parse(localStorage.getItem(rmKey)||'[]');
                (bom.materials||[]).forEach((m:any)=>{
                  const useQty = Number(m.qty_per_unit||0) * Number(rec.good_output_units||qty);
                  const idx = rms.findIndex((r:any)=> r.name?.toLowerCase() === (m.rm_name||'').toLowerCase());
                  if (idx>=0) rms[idx].currentStock = Math.max(0, Number(rms[idx].currentStock||0) - useQty);
                });
                localStorage.setItem(rmKey, JSON.stringify(rms));
              }
            }
            imported++;
            break;
          }
          default:
            skipped++;
        }
      } catch (e: any) {
        skipped++;
        rowErrors.push(e?.message || 'Unknown error');
      }
    }

    // Prepare errors CSV
    let errorsCsv: string | undefined;
    if (rowErrors.length) {
      const blob = new Blob([`row,error\n${rowErrors.map((e, i) => `${i+1},"${e.replace(/"/g, '""')}"`).join('\n')}`], { type: 'text/csv' });
      errorsCsv = URL.createObjectURL(blob);
    }

    const summary: ImportBatchSummary = {
      id: batchId,
      module: plan.module,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'User',
      branchId,
      sourceType: 'file',
      fileName: plan.batchFields?.__fileName || '',
      originalFileDataUrl: plan.batchFields?.__fileDataUrl,
      rowCounts: { imported, updated, skipped },
      errorsCsv,
      mappingTemplateName: plan.batchFields?.__templateName,
    };

    // Persist batch
    const batches = this.getBatches();
    batches.unshift(summary);
    localStorage.setItem(STORAGE_KEYS.batches, JSON.stringify(batches.slice(0, 500)));

    this.recordActivity(summary);

    return summary;
  }

  getBatches(): ImportBatchSummary[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.batches);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  recordExpense(data: { module: SmartImportModule; amount: number; payment_mode?: string; creditor_name?: string }){
    const key = 'expenses';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ id: `exp_${Date.now()}`, ...data, createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list));
  }

  recordPayable(data: { amount: number; party?: string }){
    const key = 'payables';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ id: `pay_${Date.now()}`, ...data, createdAt: new Date().toISOString(), status: 'pending' });
    localStorage.setItem(key, JSON.stringify(list));
  }
}

export const importService = new ImportService();
