export interface SpeechItem {
  name: string;
  qty: number;
  unit?: string;
  matchedStatus: 'matched' | 'new' | 'ambiguous';
  matchedProductId?: string;
  suggestions?: { id: string; name: string }[];
  sp?: number;
  expiry_date?: string;
  description?: string;
}

const numberWords: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'dus': 10
};

export function parseSpeechTranscript(text: string): { items: { qty: number; name: string; unit?: string }[], command?: 'undo'|'clear'|'finish'|'remove'|'none', targetName?: string } {
  const t = text.toLowerCase().trim();
  if (!t) return { items: [], command: 'none' };

  if (/(undo)/.test(t)) return { items: [], command: 'undo' };
  if (/(clear)/.test(t)) return { items: [], command: 'clear' };
  if (/(finish|stop)/.test(t)) return { items: [], command: 'finish' };
  if (/remove\s+([a-z0-9\s]+)/.test(t)) {
    const m = t.match(/remove\s+([a-z0-9\s]+)/);
    return { items: [], command: 'remove', targetName: m?.[1]?.trim() };
  }

  // Patterns like "add 3 pepsi" or "3 pepsi" or "3 pepsi 500 ml"
  const unitPattern = '(kg|kilogram|g|gram|gm|litre|ltr|ml|packet|box|bottle|pcs|piece|unit)';
  const re = new RegExp(`(?:(?:add)\s+)?((?:\\d+)|(?:${Object.keys(numberWords).join('|')}))\\s+([a-z0-9\s]+?)(?:\s+(?:${unitPattern}))?(?=,|\.|$)`, 'gi');
  const items: { qty: number; name: string; unit?: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const qRaw = m[1];
    const qty = (numberWords[qRaw] ?? parseInt(qRaw, 10)) || 1;
    const name = m[2].trim().replace(/\s{2,}/g, ' ');
    const unit = m[3]?.trim();
    if (name) items.push({ qty, name, unit });
  }
  // Also handle comma-separated phrases: "3 oreos, 5 lays"
  if (items.length === 0) {
    const parts = t.split(/[,;]+/);
    parts.forEach(p => {
      const mm = p.trim().match(new RegExp(`^((?:\\d+)|(?:${Object.keys(numberWords).join('|')}))\\s+(.+)$`));
      if (mm) {
        const qty = (numberWords[mm[1]] ?? parseInt(mm[1], 10)) || 1;
        const name = mm[2].trim();
        items.push({ qty, name });
      }
    });
  }

  return { items, command: 'none' };
}
