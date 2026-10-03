# Google Maps integration report — 3 October 2026

Both phases were completed continuously. No deployment, billing/account changes, backend, authentication, GPS tracking, new factors, or scoring-engine changes were made.

## Changed files

- `package.json`, `package-lock.json`: added `@vis.gl/react-google-maps` 1.10.1 and development-only `jsdom` for interaction tests under the existing Vitest framework. Other direct dependency ranges were preserved.
- `.gitignore`, `.env.example`: local-secret exclusions, empty browser-key template and configurable demo office.
- `src/App.jsx`: planner integration, shared current route collection for cards/summary, existing simulation plumbing with in-flight guard and immutable score receipt. Wallet/ledger/company component bodies are unchanged.
- `src/index.css`: narrow-screen sizing for the Places web component.
- `src/maps/config.js`, `time.js`: key/destination configuration and Europe/London time handling.
- `src/maps/GoogleMapPanel.jsx`, `CommutePlanner.jsx`, `RouteCard.jsx`: loader, current Places lifecycle, responsive controls/map/cards, explicit data source, selectable paths and errors.
- `src/maps/routeAdapter.js`, `routeService.js`, `useRoutePlanner.js`, `tripReceipt.js`: provider normalization, independent concurrent mode results, latest-request guards, local scoring and minimum session receipt.
- `src/maps/routeAdapter.test.js`, `routeService.test.js`, `plannerInteraction.test.jsx`, `noKey.test.jsx`, `mapLifecycle.test.jsx`: adapter and integration verification.
- `README.md`, this report: setup, implementation boundaries, provider constraints and verification notes.

## Checks

Baseline: `npm test` passed 28/28 engine tests; `npm run build` passed. Phase A also passed all 28 original tests and production build before proceeding to Phase B.

Final: `npm test` passed **73/73 tests across 6 files**, including all original 28 engine tests. `npm run build` passed. Tests cover unit conversion/no double counting, mixed transit, conservative bus eligibility, rail/subway mapping, unsupported/missing/invalid portions, partial failures, stale requests, local rescoring, selection without financial effects, exact simulation snapshot, immutable receipts, repeated simulations, no-key fallback, unavailable SDK, London DST, map cleanup and Places lifecycle cleanup.

`WalletDashboard`, `ActivityLedger`, `TripHistoryItem`, and `CompanySummary` were compared with the saved initial source and their complete function bodies are unchanged. Interaction tests confirm balance/history survive rate, route, direction and Demo/Live changes; completion keeps the existing rounding/update behavior and initial 100-credit balance. All existing engine files are unchanged.

There is no `.git` repository in the supplied workspace, so Git status/diff checks were unavailable. The task worked against the supplied files and preserved unrelated component bodies and configuration.

## Live and visual verification

Follow-up routing/map/sorting update: the user confirmed the live map and Transit routes work, but reported Provider errors for Car/Cycle/Walk. Mode values now resolve through the loaded SDK enum, preferring `DRIVE`/`BICYCLE`/`WALK` only when exposed and otherwise using the documented JavaScript names. The adapter accepts either direct-step naming convention. “Now” requests omit the captured timestamp so SDK loading cannot turn it into a past departure (only transit supports past departures); scheduled requests retain their chosen time. This timestamp issue is a plausible cause of the reported failures, not a verified diagnosis without the actual error object. A red fixed office marker and both signed-credit sorting orders were added, with unscorable cards last and summary order synchronized. **78/78 tests and the production build pass.** The agent has not observed live direct-mode success after this update. Wallet, ledger and engine business rules remain unchanged.

Follow-up field-mask correction: the configured browser rejected nested `legs.*` mask entries. `routeService.js` now requests the documented JavaScript Route-level mask `['distanceMeters', 'durationMillis', 'path', 'legs']`, preserving full leg/step data for the existing adapter. No REST `routes.*` prefix or REST `duration` field was introduced. The SDK-contract regression check includes walking → subway → walking normalization and scoring. After this correction, all **74/74 tests** and the production build pass. Actual live browser success after the fix has not been observed by this agent.

**No Google API key was configured**, so no genuine route request, autocomplete suggestion, map rendering, billing/referrer acceptance or quota behavior was observed. These remain external verification steps after setup. Mocked SDK data uses the documented current JavaScript response shape; it is not presented as a captured live response.

**Browser inspection tools were unavailable.** Responsive structure, fixed map heights, controls, path selection/cleanup, authentication handling and autocomplete lifecycle were checked in source and DOM tests. Actual desktop/mobile pixels, Google attribution placement, autocomplete keyboard behavior and browser console remain to be checked with a configured key. Do not treat jsdom as visual verification.

Manual check after setup: select a London origin using the keyboard; compare to-office/to-home and Now/scheduled results; select each path; change rates without new network requests; simulate and confirm receipt/balance; change origin while a request runs; return to Demo. At 375px and desktop widths, inspect overflow, map height, selected styling, readable provider attribution and the console. Unsupported journeys must show unavailable estimates and disabled simulation.

## Google setup and limitations

Configure `.env.local`, billing, Maps JavaScript API, Routes API, Places API (New), and browser HTTP referrer/API restrictions as described in README. Billing/free caps are finite. Current weekly SDK support is required; unsupported accounts/environments expose a clear setup error with Demo available. No legacy fallback was needed or added. Bus eligibility intentionally excludes unconfirmed/outside-zone services. Persistent live receipts require a separate review of applicable provider retention/derived-data terms.

## Existing issues left outside scope

1. Company Summary's fixed 78%/1.5× and above-50% trigger text conflicts with Normal selection and other 80% copy. Its existing policy and hardcoded metrics were preserved; the planner/footer explicitly identify company metrics as demo data.
2. “LIVE”, 1,240 kg, 247 employees and the tree/commute/social-cost equivalences remain authored company-demo claims, not measurements from the new planner. Existing dark-card contrast was not redesigned.
3. **No month-close, settlement, perks store or redemption implementation exists in this checkout.** Neither “balance minus 100” nor entire-positive-balance settlement can be verified here. No such feature was changed or introduced; wallet balance and ledger behavior that actually exists were preserved and tested.
4. Factor source strings explicitly retain the unverified-provenance qualifier. No PDF/screenshots were supplied in this workspace to verify the reported wallet/store appearance or factor provenance.
5. `npm audit` reports **5 advisories** (3 moderate, 1 high, 1 critical) in the existing Vite/Vitest toolchain and its dependencies (`vite`, `vitest`, `vite-node`, `@vitest/mocker`, `esbuild`). No advisory names the new Maps wrapper or jsdom. Fixes recommend unrelated major upgrades; those were left for separate maintenance as instructed.
