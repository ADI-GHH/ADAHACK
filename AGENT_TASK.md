# TASK FOR CODING AGENT: Scoring Engine (Step 1 only)

You are building the first module of a hackathon app that rewards employees for greener commutes (walking, cycling, public transport) over driving. **Your only job in this task is a small, tested TypeScript library that scores a trip.** Do not build anything else.

## Rules

- Do only what is in this file. No UI, no database, no server, no API calls, no authentication, no maps, no extra features.
- Write the tests first (section 6), then the code, then run the tests.
- Use no runtime dependencies. Dev dependencies allowed: `typescript`, `vitest`.
- If anything is ambiguous, pick the simplest reading, note it in a `NOTES.md`, and continue. Do not ask for permission on small choices.
- When finished, show the full test output and list the files you created.

## 1. Project setup

Create a Node project in the current folder:

- `package.json` with scripts: `"test": "vitest run"`, `"build": "tsc"`.
- `tsconfig.json` with `strict: true`, target ES2020, module ESNext, `outDir: dist`.
- Files:

```text
src/engine/types.ts
src/engine/factors.ts
src/engine/scoring.ts
src/engine/fixtures.ts
src/engine/scoring.test.ts
src/engine/index.ts        // re-exports everything public
NOTES.md
```

## 2. Types (`types.ts`)

```ts
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
```

Duration fields are carried for the future UI only. They must not affect scoring.

## 3. Emission factors (`factors.ts`)

Export a record keyed by `Mode` with `kgPerKm`, `unit`, `source`, `year`:

| Mode | kgPerKm | Unit |
| --- | ---: | --- |
| car | 0.16591 | vehicle km, assume 1 occupant |
| bus_london | 0.06360 | passenger km |
| bus_local | 0.10151 | passenger km |
| rail | 0.03092 | passenger km |
| subway | 0.01549 | passenger km |
| walk | 0 | modelling convention |
| cycle | 0 | modelling convention |

Source string for all: `"UK Government GHG conversion factors 2026 (unverified, check before demo)"`, year 2026.

Export a function `getFactor(mode: string): number` that **throws an Error** for any mode not in the table. A missing factor must never default to zero.

## 4. Scoring rules (`scoring.ts`)

Constants (export them):

```ts
export const REFERENCE_CAR_KM_PER_DAY = 20;
export const REFERENCE_CAR_CREDITS_PER_DAY = 10;
export const K = REFERENCE_CAR_CREDITS_PER_DAY / (REFERENCE_CAR_KM_PER_DAY * 0.16591); // ~3.013682
export const R = 0.25;       // credits per active km
export const R_CAP = 2.5;    // max active credits per one-way trip, before multiplier
export const DEFAULT_RATES: DailyRates = { carMultiplier: 1, activeMultiplier: 1 };
```

Export `scoreTrip(segments: Segment[], rates: DailyRates = DEFAULT_RATES): ScoreResult`.

Algorithm:

1. Validate: `segments` must be non-empty; every `distanceKm` must be finite and >= 0 (zero is allowed); multipliers must be finite and between 1 and 1.5 inclusive. Otherwise throw an Error with a clear message.
2. For each segment: `emissionsKg_i = distanceKm * getFactor(mode)`.
3. `emissionsKg` = sum of all segment emissions.
4. `emissionsCharge = K * ( carMultiplier * (emissions of car segments) + 1 * (emissions of all other segments) )`.
5. `activeKm` = sum of distance of `walk` and `cycle` segments.
6. `activeBonus = activeMultiplier * Math.min(R * activeKm, R_CAP)`.
7. `creditDelta = round2(activeBonus - emissionsCharge)`.
8. Return all values. Only `creditDelta` is rounded. Do **not** round per segment.

Rounding (`round2`): round half away from zero to 2 decimals, and avoid `-0`:

```ts
function round2(x: number): number {
  const r = Math.sign(x) * Math.round((Math.abs(x) + 1e-9) * 100) / 100;
  return r === 0 ? 0 : r;
}
```

Bus, rail and subway always use a multiplier of 1. Walking and cycling earn the same per km.

## 5. Fixtures (`fixtures.ts`)

Export `demoRoutes: RouteOption[]` for one imaginary ~10 km commute, clearly labelled as demo data in a comment:

- Car (10 km car): typical 25 min, low 18, high 55
- Bus (1 km walk + 9 km bus_london): typical 38, low 33, high 55
- Rail (1 km walk + 8 km rail + 1 km walk): typical 30, low 27, high 45
- Cycle (8 km cycle): typical 30, low 28, high 34
- Walk (7 km walk): typical 85, low 82, high 90

Also export `scoreRoute(route: RouteOption, rates?: DailyRates): ScoreResult` which calls `scoreTrip(route.segments, rates)`.

## 6. Tests (`scoring.test.ts`), write these first

Use `toBeCloseTo` for emissions (5 decimals) and exact equality for `creditDelta`. "High" means `{ carMultiplier: 1.5, activeMultiplier: 1.5 }`.

| # | Segments | Rates | emissionsKg | creditDelta |
| --- | --- | --- | ---: | ---: |
| 1 | car 10 | normal | 1.65910 | -5.00 |
| 2 | car 10 | high | 1.65910 | -7.50 |
| 3 | cycle 8 | normal | 0 | 2.00 |
| 4 | cycle 8 | high | 0 | 3.00 |
| 5 | walk 7 | normal | 0 | 1.75 |
| 6 | walk 7 | high | 0 | 2.63 |
| 7 | bus_london 10 | normal | 0.63600 | -1.92 |
| 8 | bus_london 10 | high | 0.63600 | -1.92 |
| 9 | rail 10 | normal | 0.30920 | -0.93 |
| 10 | walk 1 + bus_london 9 | normal | 0.57240 | -1.48 |
| 11 | walk 1 + bus_london 9 | high | 0.57240 | -1.35 |
| 12 | cycle 20 | normal | 0 | 2.50 (cap applies) |
| 13 | cycle 20 | high | 0 | 3.75 (cap then multiplier) |

Error tests (each must throw):
- empty segment list
- unknown mode (cast with `as any`)
- negative distance
- `NaN` or `Infinity` distance
- multiplier below 1 or above 1.5

Other tests:
- zero-distance segment is allowed and adds nothing
- `scoreRoute` on every item in `demoRoutes` returns a finite `creditDelta`
- car route scores lower than the cycle route on a normal day
- duration fields do not change the score (change them and compare)

## 7. Definition of done

- `npm test` passes with all tests above.
- `npm run build` succeeds with no TypeScript errors.
- `index.ts` exports types, constants, `getFactor`, `scoreTrip`, `scoreRoute`, `demoRoutes`.
- `NOTES.md` lists any assumptions you made (keep it short).

## 8. Do not do

Do not add a database, backend, frontend, map, Strava or fitness integration, leaderboard, monthly settlement, rewards, or a daily-rate calculator. These come in later tasks.
