export type DecimalSeparator = ',' | '.';

export interface ParsedAmount {
  value: number;
  unit: string;
  decimal: DecimalSeparator;
  spaced: boolean;
}

const AMOUNT_PATTERN = /^(\d+(?:[.,]\d+)?)(\s*)([^\s\d.,-]+)?$/;

/** Factor that converts one unit into another (both lowercase). */
const UNIT_FACTORS: Record<string, Record<string, number>> = {
  g: { kg: 1 / 1000 },
  kg: { g: 1000 },
  ml: { l: 1 / 1000 },
  l: { ml: 1000 },
};

export function formatAmount(value: number, decimal: DecimalSeparator = ','): string {
  return String(Math.round(value * 100) / 100).replace('.', decimal);
}

export function parseAmount(quantity: string): ParsedAmount | undefined {
  const match = AMOUNT_PATTERN.exec(quantity.trim());
  if (!match) {
    return undefined;
  }
  const [, number, space, unit = ''] = match;
  return {
    value: Number(number.replace(',', '.')),
    unit,
    decimal: number.includes('.') ? '.' : ',',
    spaced: space.length > 0 && unit !== '',
  };
}

export function addAmounts(target: string, source: string): string | undefined {
  const base = parseAmount(target);
  const extra = parseAmount(source);
  if (!base || !extra) {
    return undefined;
  }
  const from = extra.unit.toLowerCase();
  const to = base.unit.toLowerCase();
  const factor = from === to ? 1 : UNIT_FACTORS[from]?.[to];
  if (factor === undefined) {
    return undefined;
  }
  const sum = formatAmount(base.value + extra.value * factor, base.decimal);
  return base.unit ? `${sum}${base.spaced ? ' ' : ''}${base.unit}` : sum;
}
