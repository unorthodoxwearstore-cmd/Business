import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseSpeechTranscript, SpeechItem } from '@/lib/speech-parser';
import { inventoryService } from '@/lib/inventory-service';
import Fuse from 'fuse.js';
import { Mic, Square, Undo2, Trash2, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onFinish: (items: SpeechItem[]) => void;
}

export const SpeechAddPanel: React.FC<Props> = ({ open, onClose, onFinish }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [items, setItems] = useState<SpeechItem[]>([]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;
    const w: any = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'en-IN';
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t + ' ';
          handleUtterance(t);
        } else {
          setTranscript(t);
        }
      }
    };
    recognitionRef.current = recog;
  }, [open]);

  const findMatches = (name: string): { status: 'matched'|'new'|'ambiguous'; id?: string; suggestions?: {id: string; name: string}[] } => {
    const all = inventoryService.getProducts();
    const exact = all.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (exact) return { status: 'matched', id: exact.id };
    const prefix = all.find(p => p.name.toLowerCase().startsWith(name.toLowerCase()));
    if (prefix) return { status: 'matched', id: prefix.id };
    const fuse = new Fuse(all, { keys: ['name'], threshold: 0.4 });
    const results = fuse.search(name).slice(0, 3).map(r => ({ id: r.item.id, name: r.item.name }));
    if (results.length === 1) return { status: 'matched', id: results[0].id };
    if (results.length > 1) return { status: 'ambiguous', suggestions: results };
    return { status: 'new' };
  };

  const handleUtterance = (t: string) => {
    const parsed = parseSpeechTranscript(t);
    if (parsed.command === 'undo') {
      setItems(prev => prev.slice(0, -1));
      return;
    }
    if (parsed.command === 'clear') {
      setItems([]);
      return;
    }
    if (parsed.command === 'finish') {
      setListening(false);
      onFinish(items);
      return;
    }
    if (parsed.command === 'remove' && parsed.targetName) {
      setItems(prev => prev.filter(i => !i.name.toLowerCase().includes(parsed.targetName!.toLowerCase())));
      return;
    }
    if (parsed.items.length) {
      const adds = parsed.items.map(it => {
        const match = findMatches(it.name);
        return {
          name: it.name,
          qty: it.qty,
          unit: it.unit,
          matchedStatus: match.status,
          matchedProductId: match.id,
          suggestions: match.suggestions
        } as SpeechItem;
      });
      // merge duplicates by name
      const merged: Record<string, SpeechItem> = {};
      [...items, ...adds].forEach(it => {
        const key = it.name.toLowerCase();
        if (!merged[key]) merged[key] = { ...it };
        else merged[key].qty += it.qty;
      });
      setItems(Object.values(merged));
    }
  };

  const start = () => { setListening(true); recognitionRef.current?.start?.(); };
  const stop = () => { setListening(false); recognitionRef.current?.stop?.(); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <Card className="w-full max-w-3xl m-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Add by Speech
            <div className="flex gap-2">
              {!listening ? (
                <Button onClick={start}><Mic className="w-4 h-4 mr-2"/>Start</Button>
              ) : (
                <Button variant="destructive" onClick={stop}><Square className="w-4 h-4 mr-2"/>Stop</Button>
              )}
              <Button variant="outline" onClick={() => setItems(prev => prev.slice(0,-1))}><Undo2 className="w-4 h-4 mr-2"/>Undo</Button>
              <Button variant="outline" onClick={() => setItems([])}><Trash2 className="w-4 h-4 mr-2"/>Clear All</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 text-sm text-gray-600">{transcript}</div>
          <div className="border rounded max-h-72 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Product</th>
                  <th className="px-2 py-1 text-left">Qty</th>
                  <th className="px-2 py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className={it.matchedStatus==='ambiguous'?'bg-yellow-50': (it.matchedStatus==='new'?'bg-blue-50':'')}>
                    <td className="px-2 py-1">{it.name}</td>
                    <td className="px-2 py-1">{it.qty} {it.unit || ''}</td>
                    <td className="px-2 py-1">{it.matchedStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => onFinish(items)} disabled={items.length === 0 || items.some(i => i.matchedStatus==='ambiguous')}>
              <Check className="w-4 h-4 mr-2"/>Finish & Review
            </Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpeechAddPanel;
