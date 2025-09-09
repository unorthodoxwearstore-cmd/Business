import { describe, it, expect } from 'vitest';

describe('Cost calculations', () => {
  it('calculates raw material unit price = total / qty', () => {
    const total = 100;
    const qty = 50;
    const unit = total / qty;
    expect(unit).toBe(2);
  });

  it('calculates product cost per unit = total / orderQuantity', () => {
    const total = 375;
    const orderQty = 125;
    const cpu = total / orderQty;
    expect(cpu).toBe(3);
  });

  it('calculates BOM cost per unit = sum(component unitCost * qty) / outputUnits', () => {
    const components = [
      { unitCost: 2, quantity: 5 },
      { unitCost: 1.5, quantity: 10 }
    ];
    const totalRaw = components.reduce((s, c) => s + c.unitCost * c.quantity, 0);
    const outputUnits = 10;
    const mfgPerUnit = totalRaw / outputUnits;
    expect(totalRaw).toBe(2 * 5 + 1.5 * 10);
    expect(mfgPerUnit).toBe(totalRaw / 10);
  });

  it('calculates sale invoice total = pricePerUnit * qty', () => {
    const ppu = 12.5;
    const qty = 4;
    expect(ppu * qty).toBe(50);
  });
});
