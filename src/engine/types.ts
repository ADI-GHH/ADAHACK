export type Mode = "car" | "walk" | "cycle" | "bus_london" | "bus_local" | "rail" | "subway";

export type Segment = { mode: Mode; distanceKm: number };

export type RouteOption = {
  id: string;
  label: string;
  segments: Segment[];
  durationMin: number;
  durationMinLow: number;   // optimistic total time
  durationMinHigh: number;  // pessimistic total time
};

export type DailyRates = { carMultiplier: number; activeMultiplier: number };

export type BreakdownItem = { mode: Mode; distanceKm: number; emissionsKg: number };

export type ScoreResult = {
  emissionsKg: number;       // full precision, not rounded
  emissionsCharge: number;   // credits, full precision
  activeBonus: number;       // credits, full precision
  creditDelta: number;       // rounded to 2 decimals, positive = user earns credits
  breakdown: BreakdownItem[];
};