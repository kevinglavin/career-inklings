// INK-008: the recolored brand palette must drop the off-palette red and keep
// every colored pill/badge readable (AA, >= 4.5:1) with its chosen text color.
import { describe, expect, it } from 'vitest';
import { BRAND_COLORS, RIASEC_COLORS, contrastText } from '../constants';
import { RiasecType } from '../types';

const lum = (hex: string) => {
  const c = hex.replace('#', '');
  const ch = (i: number) => {
    const s = parseInt(c.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
};
const ratio = (a: string, b: string) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

describe('brand palette (INK-008)', () => {
  it('no longer contains the off-palette red #CF3339', () => {
    expect(Object.values(BRAND_COLORS)).not.toContain('#CF3339');
    expect((BRAND_COLORS as Record<string, string>).red).toBeUndefined();
  });

  it('uses Deep Blue #005677 as the primary', () => {
    expect(BRAND_COLORS.blue).toBe('#005677');
  });

  it('keeps every RIASEC pill AA (>= 4.5:1) with its contrast text color', () => {
    for (const type of Object.values(RiasecType)) {
      const bg = RIASEC_COLORS[type];
      const fg = contrastText(bg);
      expect(ratio(bg, fg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives every RIASEC type a distinct color', () => {
    const colors = Object.values(RiasecType).map(t => RIASEC_COLORS[t]);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
