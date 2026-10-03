/**
 * Company policy constants for the Automated Market Maker incentive system.
 * These define how the daily rates are calculated from the firm-wide high-carbon share.
 */

/** The mode considered "high-carbon" for share calculations */
export const HIGH_CARBON_MODE = 'car';

/** Target high-carbon share threshold (50%) */
export const TARGET_SHARE = 0.50;

/** Full penalty threshold (80%) */
export const FULL_PENALTY_SHARE = 0.80;

/** Maximum multiplier (1.5x at 80%+ share) */
export const MAX_MULTIPLIER = 1.5;

/** Minimum multiplier (1.0x at 50% or below share) */
export const MIN_MULTIPLIER = 1.0;

/** Pressure calculation: how far above target, scaled to [0, 1] */
export function calculatePressure(highCarbonShare) {
  if (highCarbonShare <= TARGET_SHARE) return 0;
  if (highCarbonShare >= FULL_PENALTY_SHARE) return 1;
  return (highCarbonShare - TARGET_SHARE) / (FULL_PENALTY_SHARE - TARGET_SHARE);
}

/** Calculate multiplier from pressure, rounded to 2 decimal places */
export function calculateMultiplier(pressure) {
  const raw = MIN_MULTIPLIER + 0.5 * pressure;
  return Math.round(raw * 100) / 100;
}

/** Full policy object for export */
export const COMPANY_POLICY = {
  HIGH_CARBON_MODE,
  TARGET_SHARE,
  FULL_PENALTY_SHARE,
  MAX_MULTIPLIER,
  MIN_MULTIPLIER,
  calculatePressure,
  calculateMultiplier,
};