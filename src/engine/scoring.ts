import type { Segment, ScoreResult, BreakdownItem, DailyRates, Mode } from "./types.js";
import { getFactor } from "./factors.js";

export const REFERENCE_CAR_KM_PER_DAY = 20;
export const REFERENCE_CAR_CREDITS_PER_DAY = 10;
export const K = REFERENCE_CAR_CREDITS_PER_DAY / (REFERENCE_CAR_KM_PER_DAY * 0.16591); // ~3.013682
export const R = 0.25;       // credits per active km
export const R_CAP = 2.5;    // max active credits per one-way trip, before multiplier
export const DEFAULT_RATES: DailyRates = { carMultiplier: 1, activeMultiplier: 1 };

function round2(x: number): number {
  const r = Math.sign(x) * Math.round((Math.abs(x) + 1e-9) * 100) / 100;
  return r === 0 ? 0 : r;
}

export function scoreTrip(segments: Segment[], rates: DailyRates = DEFAULT_RATES): ScoreResult {
  // Validate segments
  if (!segments || segments.length === 0) {
    throw new Error("Segments must be non-empty");
  }

  // Validate rates
  if (typeof rates.carMultiplier !== "number" || !isFinite(rates.carMultiplier) || rates.carMultiplier < 1 || rates.carMultiplier > 1.5) {
    throw new Error("carMultiplier must be a finite number between 1 and 1.5");
  }
  if (typeof rates.activeMultiplier !== "number" || !isFinite(rates.activeMultiplier) || rates.activeMultiplier < 1 || rates.activeMultiplier > 1.5) {
    throw new Error("activeMultiplier must be a finite number between 1 and 1.5");
  }

  const breakdown: BreakdownItem[] = [];
  let emissionsKg = 0;
  let carEmissionsKg = 0;
  let otherEmissionsKg = 0;
  let activeKm = 0;

  for (const segment of segments) {
    const { mode, distanceKm } = segment;

    // Validate distance
    if (typeof distanceKm !== "number" || !isFinite(distanceKm) || distanceKm < 0) {
      throw new Error("distanceKm must be a finite number >= 0");
    }

    const factor = getFactor(mode);
    const segmentEmissionsKg = distanceKm * factor;

    breakdown.push({ mode, distanceKm, emissionsKg: segmentEmissionsKg });
    emissionsKg += segmentEmissionsKg;

    if (mode === "car") {
      carEmissionsKg += segmentEmissionsKg;
    } else {
      otherEmissionsKg += segmentEmissionsKg;
    }

    if (mode === "walk" || mode === "cycle") {
      activeKm += distanceKm;
    }
  }

  const emissionsCharge = K * (rates.carMultiplier * carEmissionsKg + 1 * otherEmissionsKg);
  const activeBonus = rates.activeMultiplier * Math.min(R * activeKm, R_CAP);
  const creditDelta = round2(activeBonus - emissionsCharge);

  return {
    emissionsKg,
    emissionsCharge,
    activeBonus,
    creditDelta,
    breakdown,
  };
}