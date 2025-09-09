import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, Save, CheckCircle, XCircle } from 'lucide-react';
import { importService, SmartImportModule, SmartImportSource, FieldMapping, ImportRecord, ImportPlan } from '@/lib/import-service';

interface Props {
  open: boolean;
  onClose: () => void;
  module: SmartImportModule;
}

const REQUIRED_FIELDS: Record<SmartImportModule, string[]> = {
  inventory_products: ['product_name', 'sp_per_unit'],
  manufacturer_raw_materials: ['rm_name', 'qty_purchase'],
  manufacturer_bom: ['finished_product', 'rm_name', 'qty_per_unit'],
  sales_bulk_backfill: ['date', 'product_name', 'qty'],
  customers: ['name'],
  suppliers: ['name'],
  purchases: ['product_name', 'qty'],
  pending: ['type', 'party', 'original_amount', 'balance'],
  manufacturer_production_orders: ['finished_product', 'qty_to_produce', 'batch_no', 'start_date']
};

const TARGET_FIELDS_HINTS: Record<SmartImportModule, string[]> = {
  inventory_products: ['product_name','sp_per_unit','qty_add','expiry_date','description','min_level','delivery_total_price','payment_mode','pending_amount','creditor_name'],
  manufacturer_raw_materials: ['rm_name','qty_purchase','purchase_total_price','warehouse_location','delivery_total_price','pending_amount','creditor_name'],
  manufacturer_bom: ['finished_product','rm_name','rm_code','qty_per_unit','overheads','expected_yield_pct'],
  sales_bulk_backfill: ['invoice_no','date','product_name','qty','sp_used','total','salesperson','customer_contact'],
  customers: ['name','phone','email','address','credit_limit','notes'],
  suppliers: ['name','phone','email','address','gstin','terms','notes'],
  purchases: ['product_name','qty','final_purchase_amount','due_date','supplier_name','is_rm'],
  pending: ['type','party','original_amount','balance','due_date'],
  manufacturer_production_orders: ['finished_product','qty_to_produce','batch_no','start_date','eta','complete_date','good_output_units','wastage_units','auto_deduct_rm']
};

export const SmartImportModal: React.FC<Props> = ({ open, onClose, module }) => {
  const [step, setStep] = useState<'upload'|'map'|'preview'|'conflicts'|'commit'|'summary'>('upload');
  const [source, setSource] = useState<SmartImportSource>('file');
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<ImportRecord[]>([]);
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [batchFields, setBatchFields] = useState<Record<string, any>>({});
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<any>(null);
  const [templateName, setTemplateName] = useState('');
  const [progress, setProgress] = useState(0);

  const required = REQUIRED_FIELDS[module];
  const targetHints = TARGET_FIELDS_HINTS[module];

  const handleChooseSource = (s: SmartImportSource) => {
    setSource(s);
  };

  const handleFile = async (f: File) => {
    setError('');
    setFile(f);
    setLoading(true);
    try {
      // store data url for traceability
      const reader = new FileReader();
      reader.onload = () => setFileDataUrl(reader.result as string);
      reader.readAsDataURL(f);

      let parsed;
      if (source === 'image') parsed = await importService.parseImage(f);
      else parsed = await importService.parseFile(f);
      setRawRows(parsed.rows);
      setSourceFields(parsed.fields);
      setMappings(importService.autoMapFields(parsed.fields, targetHints));
      setStep('map');
    } catch (e: any) {
      setError(e?.message || 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const mappedRows: ImportRecord[] = useMemo(() => {
    if (!rawRows.length || !mappings.length) return [];
    const mapDict: Record<string,string> = {};
    mappings.forEach(m => { mapDict[m.sourceField] = m.targetField; });
    return rawRows.map(r => {
      const out: ImportRecord = {};
      Object.entries(r).forEach(([k,v]) => {
        const target = mapDict[k] || k;
        out[target] = v;
      });
      return out;
    });
  }, [rawRows, mappings]);

  const validationErrors: string[][] = useMemo(() => {
    return mappedRows.map(r => {
      const errs: string[] = [];
      errs.push(...importService.validateRequired(r, required));
      errs.push(...importService.validateTypes(r, Object.fromEntries(targetHints.map(f => [f, f.includes('date') ? 'date' : (f.includes('qty')||f.includes('price')||f.includes('amount') ? 'number' : 'string')])) as any));
      return errs;
    });
  }, [mappedRows, required, targetHints]);

  const hasErrors = validationErrors.some(e => e.length > 0);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    importService.saveTemplate(module, templateName.trim(), mappings);
  };

  const handleCommit = async () => {
    setLoading(true);
    setProgress(10);
    try {
      const plan: ImportPlan = {
        module,
        records: mappedRows,
        fieldMappings: mappings,
        batchFields: { ...batchFields, __fileName: file?.name, __fileDataUrl: fileDataUrl, __templateName: templateName || undefined },
        conflictStrategy: 'create_update_skip'
      };
      setProgress(30);
      const res = await importService.commit(plan);
      setProgress(100);
      setSummary(res);
      setStep('summary');
    } catch (e: any) {
      setError(e?.message || 'Commit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o ? onClose() : null}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Smart Import</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={source==='file'?'default':'outline'} onClick={() => handleChooseSource('file')}>From File</Button>
              <Button variant={source==='image'?'default':'outline'} onClick={() => handleChooseSource('image')}>From Image</Button>
            </div>
            <div className="border rounded p-6 text-center">
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-600 mb-2">Upload {source==='file' ? 'CSV/Excel/Word/PDF' : 'JPG/PNG/PDF (scanned)'} file</p>
              <Input type="file" accept={source==='file' ? '.csv,.xlsx,.xls,.pdf,.docx' : 'image/*,.pdf'} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
              {loading && <div className="mt-3 flex items-center justify-center text-blue-600"><Loader2 className="w-4 h-4 animate-spin mr-2"/>Analyzing...</div>}
              {error && <Alert className="mt-3"><AlertDescription className="text-red-600">{error}</AlertDescription></Alert>}
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Map Fields</h3>
              <div className="flex gap-2">
                <Input placeholder="Save mapping as..." value={templateName} onChange={(e)=>setTemplateName(e.target.value)} className="w-48" />
                <Button variant="outline" onClick={handleSaveTemplate}><Save className="w-4 h-4 mr-2"/>Save Template</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sourceFields.map(sf => {
                const m = mappings.find(mm => mm.sourceField === sf) || { sourceField: sf, targetField: '', confidence: 0 };
                return (
                  <div key={sf} className="flex items-center gap-2">
                    <div className="flex-1"><Input value={sf} readOnly /></div>
                    <div className="w-6 text-center text-xs text-gray-500">→</div>
                    <div className="flex-1">
                      <Select value={m.targetField} onValueChange={(val)=>{
                        setMappings(prev => prev.map(p => p.sourceField === sf ? { ...p, targetField: val } : p));
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                        <SelectContent>
                          {targetHints.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={()=>setStep('upload')}>Back</Button>
              <Button onClick={()=>setStep('preview')}>Next: Preview & Clean</Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3">
            <h3 className="font-medium">Preview & Clean</h3>
            <div className="overflow-auto border rounded max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {targetHints.map(h => <th key={h} className="text-left px-2 py-1 border-b">{h}</th>)}
                    <th className="px-2 py-1 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.map((r, idx) => (
                    <tr key={idx} className={validationErrors[idx]?.length ? 'bg-red-50' : ''}>
                      {targetHints.map(h => (
                        <td key={h} className="px-2 py-1 border-b">
                          <Input value={r[h] ?? ''} onChange={(e)=>{
                            const val = e.target.value;
                            (r as any)[h] = val;
                          }} />
                        </td>
                      ))}
                      <td className="px-2 py-1 border-b text-right">
                        <Button variant="ghost" size="sm" onClick={()=>{ mappedRows.splice(idx,1); }}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasErrors && (
              <Alert>
                <AlertDescription className="text-red-600">Some rows have errors. Fix inline or export errors CSV after commit summary.</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Batch fields common UI */}
              {module==='inventory_products' && (
                <>
                  <Input placeholder="delivery_total_price" onChange={e=>setBatchFields(prev=>({...prev,delivery_total_price:e.target.value}))} />
                  <Input placeholder="payment_mode" onChange={e=>setBatchFields(prev=>({...prev,payment_mode:e.target.value}))} />
                  <Input placeholder="pending_amount" onChange={e=>setBatchFields(prev=>({...prev,pending_amount:e.target.value}))} />
                  <Input placeholder="creditor_name" onChange={e=>setBatchFields(prev=>({...prev,creditor_name:e.target.value}))} />
                </>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={()=>setStep('map')}>Back</Button>
              <Button onClick={()=>setStep('conflicts')}>Next: Resolve Conflicts</Button>
            </div>
          </div>
        )}

        {step === 'conflicts' && (
          <div className="space-y-4">
            <h3 className="font-medium">Resolve Conflicts</h3>
            <p className="text-sm text-gray-600">Existing records will be updated. No overwrites unless you choose Replace.</p>
            <div className="flex gap-2">
              <Button onClick={()=>setStep('commit')}>Continue</Button>
            </div>
          </div>
        )}

        {step === 'commit' && (
          <div className="space-y-4">
            <h3 className="font-medium">Commit Import</h3>
            <Progress value={progress} />
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={()=>setStep('conflicts')}>Back</Button>
              <Button disabled={loading} onClick={handleCommit}><Upload className="w-4 h-4 mr-2"/>Commit</Button>
            </div>
          </div>
        )}

        {step === 'summary' && summary && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5"/><span>Import Completed</span></div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 border rounded">Imported: <b>{summary.rowCounts.imported}</b></div>
              <div className="p-3 border rounded">Updated: <b>{summary.rowCounts.updated}</b></div>
              <div className="p-3 border rounded">Skipped: <b>{summary.rowCounts.skipped}</b></div>
            </div>
            {summary.errorsCsv && (
              <a href={summary.errorsCsv} target="_blank" className="inline-flex items-center text-red-600 text-sm"><XCircle className="w-4 h-4 mr-1"/>Download Errors CSV</a>
            )}
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SmartImportModal;
