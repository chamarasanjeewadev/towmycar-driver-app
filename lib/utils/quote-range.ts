export interface QuoteRangeResult {
  low: number;
  high: number;
}

export type QuotePosition = 'low' | 'in-range' | 'high';

const MOTORCYCLE_MAKES = [
  'honda', 'yamaha', 'kawasaki', 'suzuki', 'ducati',
  'harley', 'triumph', 'ktm', 'aprilia', 'royal enfield',
];

function inferBaseFee(make: string | null, weight: number | null): number {
  const makeLower = (make ?? '').toLowerCase();

  if (
    MOTORCYCLE_MAKES.some((m) => makeLower.includes(m)) &&
    (weight === null || weight < 500)
  ) {
    return 60;
  }

  if (weight && weight > 3500) return 150;
  if (weight && weight > 2000) return 90;

  return 75;
}

function getDistanceRate(distance: number): number {
  if (distance <= 10) return 0;
  if (distance <= 25) return 1.5;
  if (distance <= 50) return 1.75;
  if (distance <= 100) return 2.0;
  return 2.5;
}

export function calculateQuoteRange(
  distance: number | null,
  make: string | null,
  weight: number | null,
): QuoteRangeResult | null {
  if (distance === null || distance <= 0) return null;

  const baseFee = inferBaseFee(make, weight);
  const mileageCost = distance * getDistanceRate(distance);
  const withVat = (baseFee + mileageCost) * 1.2;

  return {
    low: Math.round(withVat * 0.85),
    high: Math.round(withVat * 1.15),
  };
}

export function getQuotePosition(
  amount: number,
  range: QuoteRangeResult,
): QuotePosition {
  if (amount < range.low) return 'low';
  if (amount > range.high) return 'high';
  return 'in-range';
}
