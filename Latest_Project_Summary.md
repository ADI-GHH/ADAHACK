# Automated Carbon Bank — Current Project Summary and LLM Handoff

**Updated:** 3 October 2026 (Europe/London)  
**Workspace:** `C:\HACKATHONS\AdaHack`  
**Purpose:** A standalone account of the project, completed work, current implementation, verification, and remaining gaps so another LLM can propose an accurate next implementation prompt.

This document was rewritten after inspecting the current source, product plan, implementation instructions, README, and Google Maps integration report, and rerunning the tests and production build. Current source takes precedence over historical handoff claims. This workspace has no Git repository, so the development sequence below is reconstructed from files and reports rather than commit history.

## 1. Product concept and present status

Automated Carbon Bank is an employee commute comparison and rewards prototype for the **Hoppers Challenge: Sustainable Transport (Jane Street)**. The intended product gives employees a monthly Green Credit allowance, deducts credits for estimated commute emissions, rewards walking/cycling, and eventually converts positive month-end balances into workplace perks.

The implemented journey is:

**Compare authored or Google routes → inspect time/emissions/credit outcome → explicitly simulate a commute → update the credit balance → review the activity ledger.**

The current checkout is a locally running, responsive web demo with a tested scoring engine and an optional Google Maps planner. It starts with **100.00 credits**, defaults to **Demo** routes and **Normal** rates, and keeps all application data in React memory.

**Settlement, a separate redemption wallet, a perks store, and redemption are not implemented.** Wallet copy mentions month-end perks, but there is no corresponding functionality. Refreshing resets the balance, receipts, planner state, and rates.

“Automated Market Maker” is the product's incentive-pricing concept. There is no trading, liquidity pool, blockchain, cash conversion, or actual financial market.

## 2. Work completed so far

### A. Product and scoring specification

`Jane_Street_plan.md` sets out the proposed product, route comparison, mixed-mode emissions, daily incentives, trip evidence, monthly settlement, perks, fairness considerations, Google integration, and future tracking. It also includes acceptance scenarios and a presentation plan.

`AGENT_TASK.md` narrowed the initial implementation to a pure TypeScript scoring library. `CLAUDE.md` records hackathon constraints and the rule to preserve the emissions factors and economic calibration. `NOTES.md` records the initial engine assumptions.

These documents describe different stages: the product plan is broader than the code, and the original engine-only restriction is historical. Later instructions explicitly authorized the dashboard and Google integration.

### B. Scoring engine

Implemented `src/engine/types.ts`, `factors.ts`, `scoring.ts`, `fixtures.ts`, `index.ts`, and `scoring.test.ts`.

The engine provides supported transport modes, factor metadata, validation, segment emissions, emissions charges, capped active-travel bonuses, rounded net credits, five demo routes, and public exports. Its **28 original tests pass**. The Maps integration report records that the existing engine files were preserved.

### C. Dashboard and simulated trip flow

Built the Vite/React/Tailwind application with:

- Sticky title/header and Normal/High Demand rate controls.
- Green Credit Balance banner.
- Dark Firm-Wide Impact Dashboard.
- Route cards with transport sequence, distance, travel time, emissions, charge, active bonus, signed credit change, and Earn/Deduct/Neutral labels.
- Explicit Simulate Commute buttons.
- Activity Ledger with newest receipts first and net session change.
- Quick Summary table and calculation/rate explanations.
- Responsive layout, hover/focus styling, and source/demo notices.

Simulation takes a snapshot at click time, displays a 300 ms loading state, updates the balance, and records a receipt. One global in-flight guard prevents overlapping submissions; deliberate repeated simulations after completion remain allowed.

### D. Google Maps planner integration

Added `@vis.gl/react-google-maps` and the JavaScript/JSX modules in `src/maps/`. Added jsdom as a development dependency for DOM/interaction tests.

The integration was delivered in two phases: map/search shell, then route fetching, normalization, scoring, selection, and simulation plumbing. Demo remains usable without Google credentials.

Implemented:

- Explicit Demo/Live switching.
- Places address selection biased toward London and restricted to Great Britain.
- Configurable office address.
- To office / To home requests with reversed endpoints.
- Now or future scheduled departure in Europe/London.
- Four concurrent routing modes and independent per-mode statuses.
- Transit alternatives when supplied.
- Pure provider-to-engine normalization with conservative emissions eligibility.
- Route polylines, selection, highlighting, bounds fitting, and cleanup.
- Local rescoring when incentive rates change.
- Shared route data for cards and Quick Summary.
- Immutable minimal simulated receipts, preserving balance/history across planner changes.
- Missing-key, SDK, quota, permission, and provider-error handling.
- Setup/behavior documentation and an integration report.

The integration report says the existing `WalletDashboard`, `ActivityLedger`, `TripHistoryItem`, and `CompanySummary` function bodies were preserved. Current interaction tests verify the implemented balance/history flow survives planner and rate changes.

### E. Subsequent Maps fixes and requested UI additions

The integration report records that the user confirmed the live map and Transit worked, while Car/Cycle/Walk produced provider errors. Follow-up changes:

1. Resolve travel-mode values from the loaded SDK enum, supporting both DRIVE/BICYCLE/WALK and DRIVING/BICYCLING/WALKING naming conventions.
2. For Now requests, omit a captured departure timestamp so SDK loading does not turn it into a past departure. The timestamp issue was a plausible diagnosis, not an observed root cause.
3. Add a red fixed office marker at the supplied Devonshire Square coordinates.
4. Add signed-credit sorting in both directions and synchronize Quick Summary ordering.
5. Replace rejected nested `legs.*` field masks with the JavaScript Route-level mask `['distanceMeters', 'durationMillis', 'path', 'legs']`, retaining full leg/step data.

These fixes are present in current source and covered by tests. This documentation pass did not perform live Google requests or confirm direct-mode success after the fixes.

## 3. Actual stack and execution model

| Area | Current implementation |
| --- | --- |
| Application | Vite 5 + React 19; JavaScript/JSX |
| Styling | Tailwind CSS v4 through `@tailwindcss/vite` |
| Engine | TypeScript under `src/engine/`; transpiled by Vite |
| Maps | `@vis.gl/react-google-maps` 1.10.1; weekly Google Maps JavaScript SDK |
| Testing | Vitest 2; jsdom for selected component tests |
| State/storage | Local React state/refs; no persistence |
| Backend/database | None |
| Authentication/tracking | None |
| Hosting/deployment | No deployment evidenced in this checkout |

`next` exists in package dependencies, and `CLAUDE.md` originally proposed Next.js, but the actual application is Vite. There are no Next.js pages, server routes, or Next.js build scripts.

`vite.config.js` uses React and Tailwind plugins and maps `@` to `src`. The application primarily uses relative imports. Do not restore an obsolete engine alias pointing at `dist/`.

`tsconfig.json` uses strict TypeScript, ES2020, ESNext modules, and bundler resolution. `npm run build` runs Vite rather than `tsc`; a successful production build does not by itself establish a separate full TypeScript type-check.

## 4. Project file map

```text
AdaHack/
├── package.json / package-lock.json
├── vite.config.js / tsconfig.json / index.html
├── .gitignore
├── .env.local                         Local configuration; never copy its values into a handoff
├── Current_Project_Summary.md          This consolidated handoff
├── README.md                           Run/setup instructions and planner boundaries
├── GOOGLE_MAPS_INTEGRATION_REPORT.md   Integration history, verification, limitations
├── Jane_Street_plan.md                 Proposed product and business rules
├── CLAUDE.md                           Original hackathon guidelines
├── AGENT_TASK.md                       Original engine task/specification
├── NOTES.md                           Initial engine assumptions
├── instructions_google_maps_integration.md  Historical integration requirements
├── instruction                        Empty file in this checkout
├── src/
│   ├── main.jsx                       React entry; StrictMode; imports CSS
│   ├── App.jsx                        Wallet, company summary, rates, sorting,
│   │                                  simulation handler, ledger, summary, footer
│   ├── index.css                      Tailwind theme and Places sizing
│   ├── engine/
│   │   ├── types.ts                   Mode, Segment, RouteOption, DailyRates, ScoreResult
│   │   ├── factors.ts                 Factor records and getFactor()
│   │   ├── scoring.ts                 Constants, validation, scoreTrip()
│   │   ├── fixtures.ts                Five authored routes and scoreRoute()
│   │   ├── index.ts                   Public exports
│   │   └── scoring.test.ts
│   └── maps/
│       ├── config.js                  Browser key, office address/coordinates, map center
│       ├── time.js                    London scheduling/display and DST handling
│       ├── GoogleMapPanel.jsx         SDK provider, Places, map, marker, paths, cleanup
│       ├── CommutePlanner.jsx         Demo/Live, origin, direction, departure, statuses
│       ├── RouteCard.jsx              Route details, selection, simulation actions
│       ├── routeAdapter.js            Pure Google response → normalized route/segments
│       ├── routeService.js            Four-mode requests, SDK enums, field mask, errors
│       ├── useRoutePlanner.js         Planner state, stale-request guard, local scoring
│       ├── tripReceipt.js             Frozen aggregate simulation receipts
│       ├── routeAdapter.test.js
│       ├── routeService.test.js
│       ├── plannerInteraction.test.jsx
│       ├── noKey.test.jsx
│       └── mapLifecycle.test.jsx
├── dist/                              Generated production bundle
└── node_modules/                      Installed dependencies
```

The old summary listed `PROJECT_SUMMARY.md`, but that file is absent. The Maps docs/report reference `.env.example`, which is also absent in the current checkout. `.gitignore` excludes `.env*` except `.env.example`, plus `node_modules/`, `dist/`, and `*.local`.

## 5. Engine contract and exact calculation

Input:

```ts
type Mode = "car" | "walk" | "cycle" | "bus_london" | "bus_local" | "rail" | "subway";
type Segment = { mode: Mode; distanceKm: number };
type DailyRates = { carMultiplier: number; activeMultiplier: number };

scoreTrip(segments, rates = DEFAULT_RATES)
scoreRoute(route, rates) // delegates to scoreTrip(route.segments, rates)
```

Output: `emissionsKg`, `emissionsCharge`, `activeBonus`, `creditDelta`, and per-segment `breakdown` with mode, distance, and emissions.

### Factor table in current code

| Mode | kg CO₂e/km | Unit/boundary |
| --- | ---: | --- |
| `car` | 0.16591 | Vehicle km; assumes one occupant |
| `bus_london` | 0.06360 | Passenger km |
| `bus_local` | 0.10151 | Passenger km |
| `rail` | 0.03092 | Passenger km |
| `subway` | 0.01549 | Passenger km |
| `walk` | 0 | Transport-operation modelling convention |
| `cycle` | 0 | Transport-operation modelling convention |

Every factor record currently carries year 2026 and source text **“UK Government GHG conversion factors 2026 (unverified, check before demo)”**. The product plan claims workbook verification and lists source cells; the implementation still retains the unverified qualifier. This handoff has not independently verified the external workbook. Do not remove the qualifier or claim certified provenance on the strength of this summary.

No petrol/diesel/EV-specific modes or occupancy adjustment are implemented. Public-transport factors already use passenger-km. Walking/cycling zero values are a modelling boundary, not zero lifecycle impact.

### Constants and formula

```text
REFERENCE_CAR_KM_PER_DAY = 20
REFERENCE_CAR_CREDITS_PER_DAY = 10
K = 10 / (20 × 0.16591) = 3.013682116810319...
R = 0.25 credits per active km
R_CAP = 2.5 credits per trip before multiplier
DEFAULT_RATES = { carMultiplier: 1, activeMultiplier: 1 }

segmentEmissions = segment.distanceKm × getFactor(segment.mode)
emissionsKg = sum(segmentEmissions)
emissionsCharge = K × (carMultiplier × carEmissions + otherEmissions)
activeKm = sum(walk and cycle distances)
activeBonus = activeMultiplier × min(R × activeKm, R_CAP)
creditDelta = round2(activeBonus − emissionsCharge)
```

Only `creditDelta` is rounded inside the engine. `round2` uses half-away-from-zero with a small floating-point epsilon and returns positive zero rather than `-0`. Duration does not affect scoring.

Segment lists must be nonempty. Distances must be numbers, finite, and at least zero; explicit zero is valid. Unsupported modes throw through `getFactor`. Multipliers must each be finite numbers between 1 and 1.5 inclusive.

Car multipliers affect only car emissions charges. Active multipliers affect walking/cycling bonuses. Bus/rail/subway charges stay at the base rate. Changing rates never changes physical emissions.

### Implemented rates versus planned daily-rate policy

The UI manually chooses `{carMultiplier: 1, activeMultiplier: 1}` or `{carMultiplier: 1.5, activeMultiplier: 1.5}`. The engine accepts intermediate values, but there is **no implemented driving-share calculator, telemetry aggregation, daily publisher, or automatic rate freeze**.

The product plan proposes:

```text
driving_share = car_km / total_km
M_car = M_active = 1 + 0.5 × clamp((driving_share − 0.50) / 0.30, 0, 1)
```

This is future policy, not an existing runtime calculation. At 78% share it would be about 1.4667× rather than the company's fixed 1.5× display.

## 6. Authored demo routes and verified reference numbers

Demo fixtures represent one imaginary commute. Their distances and duration ranges are authored examples, not provider data.

| Fixture | Segments | Typical time (range), minutes | Emissions, kg CO₂e | Normal credits | High credits |
| --- | --- | --- | ---: | ---: | ---: |
| Car | 10 km car | 25 (18–55) | 1.65910 | −5.00 | −7.50 |
| Bus (London) | 1 km walk + 9 km London bus | 38 (33–55) | 0.57240 | −1.48 | −1.35 |
| Rail | 1 km walk + 8 km rail + 1 km walk | 30 (27–45) | 0.24736 | −0.25 | 0.00 |
| Cycle | 8 km cycle | 30 (28–34) | 0 | +2.00 | +3.00 |
| Walk | 7 km walk | 85 (82–90) | 0 | +1.75 | +2.63 |

The old summary incorrectly gave −0.93 for the mixed Rail fixture. **−0.93 is the normal score for a separate rail-only 10 km engine test.** The actual mixed fixture earns walking bonuses.

Additional engine reference cases: 10 km London bus without walking scores −1.92 under either rate; 20 km cycling reaches the base cap of +2.50, or +3.75 at High rates.

Demo routes have no fabricated map geometry. The planner shows a map placeholder in Demo, and card durations retain their authored ranges.

## 7. Live Google planner behavior and boundaries

### Configuration and SDK path

`src/maps/config.js` reads:

- `VITE_GOOGLE_MAPS_API_KEY`: optional browser API key.
- `VITE_OFFICE_ADDRESS`: optional office-address override.
- Default office: **2½ Devonshire Square, London EC2M 4UJ**.
- Fixed office marker: **latitude 51.5165, longitude −0.0793**.
- Initial map center: latitude 51.5074, longitude −0.1278.

The Devonshire Square destination supersedes the historical integration prompt's 20 Fenchurch Street demo destination. Treat the current office/coordinates as user-supplied configuration, not independent verification of an employer's office.

Changing the address does **not** relocate the marker or update its fixed title automatically. Route endpoints can also be snapped to accessible roads.

One `APIProvider` loads the weekly JavaScript SDK in Live mode when a key is available. Address search uses `PlaceAutocompleteElement`, `gmp-select`, and `place.fetchFields()`. Routing imports the `routes` library and calls `Route.computeRoutes()`. There is no REST call, dev proxy, or legacy DirectionsService fallback.

### Interaction and request flow

Typing invalidates a resolved origin; selecting a suggestion supplies coordinates. Routes are fetched only after **Find routes**. Origin, direction, departure, or Demo/Live changes invalidate old comparisons and selection.

To home swaps request endpoints. Scheduled values are parsed as London wall-clock times regardless of browser timezone; nonexistent spring DST times are rejected and ambiguous autumn times use the earlier occurrence. Past scheduled departures are rejected for this four-mode UI. Now requests let Google evaluate departure time at request execution.

Requests for driving, transit, bicycling, and walking start concurrently. Driving requests use `TRAFFIC_AWARE`; transit requests ask for alternatives. Mode values resolve through available SDK enums. The current field mask is:

```js
['distanceMeters', 'durationMillis', 'path', 'legs']
```

The service reports loading, success, no-service, provider error, or unscorable per mode. Successful results remain available when another mode fails. Failed live results are never silently replaced with fixtures; **Use demo routes** is explicit.

A monotonically increasing guard prevents old results from overwriting a changed context and invalidates pending results on unmount. Rate changes rescore existing segments locally without more Google requests.

### Route display, selection, and sorting

Live records contain an ID, label/source, cloned request context, distance, elapsed duration/arrival, geometry, transport details, transfer count, eligibility, and normalized segments or an unavailable reason.

Cards show returned time/distance, supplied line/stop metadata, scoring, and simulated-completion labels. Arrival uses provider total elapsed duration, including waits/transfers. No fixture ETA ranges or invented fares are applied to live routes.

View route and polyline clicks select/highlight paths and fit bounds. Selection does not update money/history. Unscorable routes can retain map/time metadata but cannot be simulated.

Cards and Quick Summary share the same scored collection and order:

- Credits Earned: signed delta descending.
- Credits Deducted: signed delta ascending, placing the most negative first.
- Unscorable entries after scored entries.

Sorting does not refetch, simulate, change selected route, or reset financial state. Desktop places the list beside the map; mobile places the map before the list. Map heights are 340/460/540 px by breakpoint.

### Adapter eligibility and distance integrity

`routeAdapter.js` contains provider parsing, not a duplicate emissions/credit formula.

| Provider transport | Engine handling |
| --- | --- |
| Direct driving/walking/ordinary cycling | `car` / `walk` / `cycle`; use total distance once |
| `HEAVY_RAIL`, `COMMUTER_TRAIN` | `rail` |
| `SUBWAY` | `subway` |
| Eligible confirmed London `BUS` | `bus_london` |
| Unconfirmed bus/coach, generic rail, tram/light rail, ferry, unknown | Entire journey unscorable |

A bus requires TfL agency evidence, bus-step geometry, departure/arrival stop coordinates, and all supplied path/stop points within latitude **51.45–51.58**, longitude **−0.30–0.03**. This conservative inner-London rectangle is not a complete London boundary. Legitimate services can be rejected when evidence is insufficient or outside the zone.

Although the engine supports `bus_local`, the live adapter does not assign it to arbitrary Google BUS results because local bus versus coach is ambiguous.

Transit parsing preserves walking access, transfers, and egress, and merges adjacent equal engine modes. Numeric metres are converted once. Missing/invalid/negative/nonfinite/nonnumeric distances are rejected. Explicit zero is valid. A missing total may be reconstructed from validated leg totals; an explicitly invalid total may not.

Transit step sums must reconcile with leg/route totals within **max(20 metres, 1 metre per step/leg as appropriate)**. Material gaps are rejected rather than allocated to a convenient factor. Missing/invalid total duration also makes a route unscorable. Direct routes use validated totals rather than adding step distances again.

## 8. Balance, completion, receipts, and provider data

`App.jsx` owns rates, balance, history, sort order, and simulation state. `useRoutePlanner` owns route source/results/selection separately, which lets planner changes preserve financial state.

`snapshotTrip()` calls the engine at click time and freezes a receipt containing:

- UUID and Europe/London timestamp.
- Generic route label with Demo/Live and simulated status.
- Source and `simulated: true`.
- Aggregate emissions, charge, bonus, and net delta.
- Both incentive multipliers.

Receipts omit segments, distances, origin/destination addresses, stops/lines, geometry, raw responses, and request context. They therefore are not a full auditable trip/segment ledger.

After 300 ms, the current balance receives the frozen delta and is rounded to two decimals; the receipt is prepended to history. Later route or rate changes do not alter it. Unmount cleanup clears a pending simulation timer.

Live planning and simulated completion do not prove actual travel. Duplicate clicks during one submission are blocked, but there is no durable trip identity/deduplication, commute-frequency limit, evidence acceptance, or real tracking.

Provider route data stays in session memory; there is no localStorage/database/archive. Google basemap attribution and card source labels are retained. The existing README records unresolved provider retention/derived-data requirements before persistence/public deployment; this handoff does not establish permission for permanent storage.

## 9. Company dashboard: implemented display versus real data

`CompanySummary()` is a static authored demo, independent of rates, planner routes, and receipts. It displays:

- Yesterday's driving share: **78%**, target ≤50%.
- Today's adjustment: **1.5×**, active rate 0.25 → 0.375 credits/km, car charge coefficient 3.01 → 4.52.
- Avoided emissions: **1,240 kg**.
- Equivalences: **3,100 car commutes**, **56 mature trees**, **£18,600 social cost**.
- **247 active employees** and an animated **LIVE** indicator.
- “Yesterday → Today → Tomorrow” incentive explanation.

None is computed from actual company data. The page footer identifies firm-wide metrics as hardcoded demo data.

Known inconsistencies remain: 1.5× appears even when Normal is selected; company copy describes an above-50% binary trigger while other copy says ≥80%; the proposed formula ramps between those thresholds. Avoid treating the company claims/equivalences as validated measurements. Existing reports also flag dark-card contrast as a polish issue; it was not visually rechecked here.

## 10. Verification performed for this handoff

On 3 October 2026, the current checkout passed:

| Check | Result |
| --- | --- |
| `npm test` | **78/78 tests; 6/6 files passed** |
| `npm run build` | Success; 51 modules transformed |
| JS bundle | 312.77 kB; gzip 96.36 kB |
| CSS bundle | 27.52 kB; gzip 5.73 kB |
| HTML output | 0.41 kB; gzip 0.28 kB |

Test distribution:

| Test file | Tests |
| --- | ---: |
| Engine scoring | 28 |
| Route adapter | 29 |
| Route service, receipts, London time | 10 |
| Planner/financial interactions | 7 |
| Map and Places lifecycle | 3 |
| No-key fallback | 1 |

Coverage includes scoring examples/validation/caps, unit conversion/no double counting, mixed transit, eligibility, unsupported portions, rounding-sized distance gaps, SDK enum variants, field-mask contract, Now timestamps, concurrent/partial failures, stale results, endpoint reversal, local rescoring, route selection without balance change, sorting, immutable receipts, in-flight/repeated simulation, no-key fallback, unavailable SDK, DST, and lifecycle cleanup.

Test stderr contains deliberately induced provider-error logs; these are expected failure scenarios, not failed tests. UI error text is sanitized, but current service/hook code logs raw errors with `console.error`; credential-safe console logging remains a review item.

Historical reports contain **73**, **74**, and **78** test totals from different stages. The fresh result above is the current total.

This pass did not start an interactive browser or make genuine Google requests. It establishes automated behavior/build success, not desktop/mobile pixel quality or live API success. The previous report's initial “no key configured” statement is historical; `.env.local` now exists, but its credentials were not inspected or exposed and API enablement/billing/referrer acceptance were not verified.

The integration report previously recorded **5 npm audit advisories** in the existing Vite/Vitest toolchain (3 moderate, 1 high, 1 critical). That audit was not rerun for this documentation change; treat its count as historical and recheck for a maintenance task.

## 11. Running and configuring the existing app

From the project directory:

```powershell
npm install
npm run dev
npm test
npm run build
npm run preview
```

Standard Vite defaults are localhost:5173 for development and localhost:4173 for preview, unless another port is selected. Demo requires no API key. Existing dependencies are already installed in this workspace.

The repository's live setup instructions call for a Google Cloud project with billing and Maps JavaScript API, Routes API, and Places API (New) enabled. Browser keys need website/referrer and API restrictions for actual dev/preview/deployed origins. The integration did not modify Google Cloud settings or deploy the app.

If local setup is needed, `.env.local` uses these names; never include an actual key in shared documentation:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=
VITE_OFFICE_ADDRESS=2½ Devonshire Square, London EC2M 4UJ
```

Restart Vite after env changes; rebuild production bundles to update their configuration. `VITE_` values are visible in browser bundles. Local env exclusion does not make a browser key a server secret.

The documented instruction to copy `.env.example` cannot currently be followed because that template is absent. Restoring an empty template is a small outstanding setup fix.

Each comparison makes four routing requests plus map/autocomplete/place-detail use; retries or new comparisons add requests. README links the relevant official setup/security/billing/policy documentation. This summary does not independently revalidate current external pricing or API terms.

## 12. What is incomplete or intentionally outside current scope

| Area | Current gap |
| --- | --- |
| Monthly settlement | No calendar month, close operation, reconciliation window, transfer, reset, or idempotency |
| Redemption | No separate settled wallet, store, inventory, expiry, vouchers, purchases, refunds, or fulfillment |
| Onboarding/profile | No saved home/work profile or onboarding workflow; Live origin/direction controls exist |
| Daily-rate automation | Manual Normal/High toggle; no company-distance aggregation, policy computation, publication/date snapshot |
| Company metrics | Hardcoded display; no real employee dataset or aggregation |
| Durable ledger | Session aggregate receipts only; no persistence, adjustments, segment detail, or evidence records |
| Trip verification | All completion simulated; no GPS, motion inference, accepted evidence, or corrections |
| Live Maps validation | Follow-up direct modes and field-mask fix still need observed browser checks |
| Setup/docs | Missing `.env.example`; historical conflicting claims/counts persist in other files |
| Source provenance | Factor metadata retains unverified status |
| UI completeness | No expanded per-segment calculation/correction panel, fare model, fastest/lowest-emissions sort, or arrival-time routing |
| Production readiness | No auth, backend, multi-user sync, deployment, device tracking, or public product/legal pages |

The product plan proposes transferring **the entire positive closing balance**, `max(0, closingBalance)`, into a separate redemption wallet and resetting the next month's allowance to 100. It does not specify redeeming only `balance − 100`. This is a proposed business rule; neither settlement variant exists in current code.

The broader plan also proposes reward expiry, inventory, correction records, attendance/fairness policies, and future evidence integrations. Those are requirements for future work, not completed features.

## 13. Guardrails and guidance for the next LLM

Generate the next prompt against this checkout's actual Vite/React application.

- Preserve the current engine's factors, formula, precision, rounding, active cap, and car/active multiplier separation unless a new task explicitly changes policy.
- Do not invent emissions factors or approximate unsupported live transport with a convenient supported factor.
- Keep a usable authored Demo path and explicit provider-source labels.
- Preserve wallet/history through sorting, rate changes, route selection, origin/direction changes, and Demo/Live switching.
- Keep route selection separate from simulation; keep simulation clearly labeled.
- Retain JavaScript/JSX for new UI/Maps code and the existing TypeScript engine. Do not migrate to Next.js just because it appears in historical guidance/dependencies.
- Run existing tests and build after implementation; scoring changes require the engine tests.
- Do not add authentication, GPS/background tracking, Strava, complex syncing, or new infrastructure without task scope authorizing them.
- Do not expose local env values, perform deployment, or change billing/account settings as an incidental step.
- Treat `AGENT_TASK.md` and the Maps prompt as historical task boundaries, and `Jane_Street_plan.md` as intended product behavior rather than proof of implementation.
- Inspect current source before making changes; there is no Git baseline available in this workspace.

**Likely next substantial product slice:** implement month-end settlement and one simulated perk redemption, preserving existing scoring/planner behavior. The plan gives the starting business rule, but persistent storage, correction handling, attendance policy, and reward inventory need explicit scope choices.

**Useful smaller follow-ups:** restore the env template; verify live direct modes and mobile/desktop Maps behavior; reconcile company-rate copy and demo labeling; validate factor provenance; review raw error logging and toolchain advisories.

For any next prompt, state the concrete outcome, protected existing behavior, modules to extend, relevant business rules, automated acceptance cases, and live/manual verification limits. Do not mark settlement, redemption, automatic daily rates, tracking, or measured company impact as already complete.

