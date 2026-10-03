import type { RouteOption, ScoreResult, DailyRates } from "./types.js";
import { scoreTrip } from "./scoring.js";

// Demo data for one imaginary ~10 km commute
export const demoRoutes: RouteOption[] = [
  {
    id: "car",
    label: "Car",
    segments: [{ mode: "car", distanceKm: 10 }],
    durationMin: 25,
    durationMinLow: 18,
    durationMinHigh: 55,
  },
  {
    id: "bus",
    label: "Bus (London)",
    segments: [
      { mode: "walk", distanceKm: 1 },
      { mode: "bus_london", distanceKm: 9 },
    ],
    durationMin: 38,
    durationMinLow: 33,
    durationMinHigh: 55,
  },
  {
    id: "rail",
    label: "Rail",
    segments: [
      { mode: "walk", distanceKm: 1 },
      { mode: "rail", distanceKm: 8 },
      { mode: "walk", distanceKm: 1 },
    ],
    durationMin: 30,
    durationMinLow: 27,
    durationMinHigh: 45,
  },
  {
    id: "cycle",
    label: "Cycle",
    segments: [{ mode: "cycle", distanceKm: 8 }],
    durationMin: 30,
    durationMinLow: 28,
    durationMinHigh: 34,
  },
  {
    id: "walk",
    label: "Walk",
    segments: [{ mode: "walk", distanceKm: 7 }],
    durationMin: 85,
    durationMinLow: 82,
    durationMinHigh: 90,
  },
];

export function scoreRoute(route: RouteOption, rates?: DailyRates): ScoreResult {
  return scoreTrip(route.segments, rates);
}