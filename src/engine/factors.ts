import type { Mode } from "./types.js";

export const EMISSION_FACTORS: Record<Mode, { kgPerKm: number; unit: string; source: string; year: number }> = {
  car: {
    kgPerKm: 0.16591,
    unit: "vehicle km, assume 1 occupant",
    source: "UK Government GHG conversion factors 2026 (unverified, check before demo)",
    year: 2026,
  },
  bus_london: {
    kgPerKm: 0.06360,
    unit: "passenger km",
    source: "UK Government GHG conversion factors 2026 (unverified, check before demo)",
    year: 2026,
  },
  bus_local: {
    kgPerKm: 0.10151,
    unit: "passenger km",
    source: "UK Government GHG conversion factors 2026 (unverified, check before demo)",
    year: 2026,
  },
  rail: {
    kgPerKm: 0.03092,
    unit: "passenger km",
    source: "UK Government GHG conversion factors 2026 (unverified, check before demo)",
    year: 2026,
  },
  subway: {
    kgPerKm: 0.01549,
    unit: "passenger km",
    source: "UK Government GHG conversion factors 2026 (unverified, check before demo)",
    year: 2026,
  },
  walk: {
    kgPerKm: 0,
    unit: "modelling convention",
    source: "UK Government GHG conversion factors 2026 (unverified, check before demo)",
    year: 2026,
  },
  cycle: {
    kgPerKm: 0,
    unit: "modelling convention",
    source: "UK Government GHG conversion factors 2026 (unverified, check before demo)",
    year: 2026,
  },
};

export function getFactor(mode: string): number {
  const key = mode as Mode;
  if (!(key in EMISSION_FACTORS)) {
    throw new Error(`Unknown mode: ${mode}`);
  }
  return EMISSION_FACTORS[key].kgPerKm;
}