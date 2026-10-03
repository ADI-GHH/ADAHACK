# Automated Carbon Bank - Hackathon Guidelines

## Project Context
- **Hackathon:** Hoppers Challenge: Sustainable Transport (Jane Street). Time is extremely limited (~7 hours).
- **App Type:** Locally running web application (MVP demo).
- **Goal:** Gamify sustainable commuting using a carbon bank/rewards system.
- **Core Loop:** Users compare routes -> see expected credits/emissions -> "complete" trip -> earn/lose credits -> redeem perks.

## Tech Stack
- **Framework:** Next.js (TypeScript) - perfect for a rapid, unified frontend and backend demo.
- **Styling:** Tailwind CSS (fast UI iteration).
- **Testing:** Vitest.
- **Data Persistence:** Keep it minimal. Use local JSON files, SQLite, or simple React state for the demo to save time. No complex DB setups.

## Strict Coding Rules for Claude
1. **NO Invented Emissions:** NEVER make up greenhouse gas (GHG) factors. Strictly use the UK Gov 2026 data provided in the spec (e.g., Car = 0.16591 kg/km, London Bus = 0.06360 kg/km, Walk/Cycle = 0).
2. **Follow the Math:** The formulas for `E_actual`, `E_baseline`, and `creditDelta` in `src/engine/scoring.ts` are absolute. Do not alter the economic calibration ($K=3.013682$).
3. **Mock First, API Second:** Rely heavily on `fixtures.ts` for route data during development to prevent hitting Google Maps API limits or wasting time on integration bugs. Only implement live API calls when explicitly requested.
4. **Test-Driven:** Run `npm test` after any change to the scoring engine.
5. **Scope Control (CRITICAL):** Do NOT build authentication, real GPS tracking, Strava integrations, or complex multi-user syncing unless directly instructed. Build a linear, clickable demo that proves the concept for the judges.

## Essential Commands
- **Test:** `npm test` or `npx vitest run`
- **Build Engine:** `npm run build`
- **Start Web Dev:** `npm run dev` (Once Next.js is initialized)