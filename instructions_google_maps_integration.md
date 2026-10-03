You are modifying an existing working hackathon application, not starting a new project. Implement a live Google Maps commute planner in the Automated Carbon Bank. Inspect the repository first, give a brief implementation outline, then complete the work and verification. Do not stop after planning or ask routine confirmation between phases. Do not deploy or change Google Cloud billing/account settings.

### 1\. Existing project and scope

The supplied handoff reports this stack:

*   Vite and React 19, pure JavaScript/JSX.
    
*   Tailwind CSS v4.
    
*   Vitest, with 28 core tests reported passing. Verify the actual baseline; do not assume the report remains current.
    
*   In-memory React state and authored fixtures; no backend or database.
    
*   Pure scoring engine under src/engine/, reportedly containing factors.js, scoring.js and fixtures.js.
    
*   scoreTrip(segments, rates) reportedly accepts entries such as { mode: 'car', distanceKm: 10 }. Inspect actual exports, supported modes, return fields and rate shape before coding.
    
*   Existing route cards, rate toggles, commute balance, simulated completion handler, activity ledger, quick-summary table, company dashboard and month-end/perk features.
    

Preserve JavaScript, Tailwind, in-memory state, existing scoring semantics and working reward flow. Do not introduce TypeScript, Next.js, a database, auth, a new global state framework or a backend for this browser SDK integration. Do not perform a broad refactor or upgrade unrelated dependencies.

Primary scope: map, origin input, route retrieval, provider-response normalization and wiring live routes into existing scoring, route cards, quick summary and commute simulation.

Protect the Wallet Dashboard, Activity Ledger, Company Summary, month-close and perk-redemption behavior. Minimal changes to pass route data through their existing interfaces are permitted. Do not redesign them or change their business rules. Never reset balances/history/wallets when an origin, selected route, live/demo setting or rate toggle changes.

Inspect repository instructions, package scripts and working-tree changes. Preserve unrelated user edits. Read relevant files rather than assuming component names or file organization. Keep all currently working import/CSS setup intact, including any necessary React imports. Do not reintroduce a stale @engine alias pointing to a dead dist/ directory.

### 2\. Visual context and target

The current screenshots show a centered light dashboard with green balance banner, dark firm-wide summary, white route cards, green simulate buttons, ledger and summary table. Normal and high-demand toggles sit near the header. There is currently no map or origin search.

Keep that visual style. Upgrade only the Route Comparison area into a commute planner:

*   Origin/address search at the top.
    
*   Configurable fixed London office destination, initially **20 Fenchurch Street, London EC3M 3BY as a demo destination**. This address has not been verified here as Jane Street's actual office; do not label it “verified Jane Street office”. Keep it easy to replace.
    
*   Optional direction control for “To office” and “To home”, using the same chosen origin and configured office. Reverse the request endpoints, not just the drawn path.
    
*   Departure-time input defaulting to now; format times in Europe/London, including daylight saving.
    
*   Desktop: route list and map side by side within the existing page width.
    
*   Mobile: search, map, then route list; avoid horizontal overflow.
    
*   Selected card visibly highlights its path on the map and fits the route bounds.
    
*   A separate “View route”/selection action must not complete a trip. Keep “Simulate Commute” explicit.
    

Each successful card must show the actual returned mode sequence, distance, estimated duration, arrival time, estimated kg CO2e, emissions charge, active bonus and signed expected credit delta. Transit cards should show lines and transfers where supplied. Do not retain the fixture's duration ranges for live routes or invent fares or services.

Derive headers such as route count and commute distance from current data; remove the fixed “5 routes for your ~10 km commute” claim in live mode. Do not manufacture separate Bus/Rail cards if the returned services do not contain those modes. Multiple transit alternatives can produce multiple cards when returned.

### 3\. Google integration choice and configuration

Prefer one map wrapper: @vis.gl/react-google-maps. Reuse a compatible existing wrapper if already installed rather than adding a second loader. Use the current Maps JavaScript Routes library and Places Autocomplete implementation supported by the chosen version/account.

Verify current official Google docs before coding. Preferred browser routing path: import the routes library and use its Route.computeRoutes() capability. Use current Places Autocomplete, such as PlaceAutocompleteElement or a documented current autocomplete implementation. Integrate its DOM lifecycle and events correctly with React; remove listeners/elements on unmount.

Do not mix legacy DirectionsService field names with the current JavaScript Route response or REST response. In particular, Google travel-mode constants and engine transport identifiers are separate concepts. Follow the actual selected SDK's enum values and request/response fields. Do not assume that REST DRIVE and JavaScript DRIVING are interchangeable.

Do not call raw REST Routes endpoints from the browser with a pretend secret or rely on a Vite dev proxy that disappears after build. The browser SDK is the intended no-backend solution. If the preferred SDK is unavailable in the configured environment, document the exact limitation and leave the working demo available. Only choose a supported legacy browser approach after checking availability and explaining the fallback; do not implement competing API paths unnecessarily.

Use import.meta.env.VITE\_GOOGLE\_MAPS\_API\_KEY, supplied through .env.local. Provide .env.example with an empty placeholder and setup instructions. Ensure local secrets are ignored by git. Never print, embed in fixtures, commit or include the actual key in screenshots. Explain that a Vite-prefixed key is visible in the browser bundle and must be restricted; .env.local does not make it a server secret.

Document API enablement and billing requirements for the exact implementation, localhost/deployed-domain HTTP referrer restrictions and API restrictions. Explain that free caps are not unlimited free routing. Do not auto-enable APIs, broaden restrictions or modify billing. No key should still yield a functional fixture demo.

Keep Google attribution visible. Avoid storing provider responses/paths in localStorage or permanently archiving live routes. Route comparisons and polylines may remain transient in React memory for the session; document applicable provider retention/display constraints. Existing trip receipts should use the minimum summary data permitted by the applicable terms; flag any unresolved retention requirement rather than declaring unrestricted storage safe.

### 4\. Route fetching and partial failure

After the user selects a resolved place and clicks “Find routes”, request driving, transit, bicycle and walking options concurrently using Promise.allSettled or an equivalent per-mode result strategy. Request transit alternatives where supported; availability is not guaranteed. Bias autocomplete to the London/UK demo area while still handling unsupported routes honestly.

Fetch routes on committed origin/time/direction changes, not every keystroke. Never refetch Google just because the normal/high incentive toggle changes; rescore existing normalized segments locally.

Request a documented minimal field set covering geometry, total distance/duration, legs/steps, step travel mode, per-step distance and transit details. Use the actual current SDK field syntax. Include total duration with transit waits/transfers where supplied; do not calculate arrival solely from moving steps.

Maintain a monotonically increasing request identifier or equivalent latest-request guard. Older results must not overwrite a newer origin/time/direction. Clear obsolete route selection/path when the request context changes. Ignore late results after unmount. Avoid duplicate loads/requests caused by React StrictMode as far as practical.

Handle each mode independently: loading, success, no service, provider error and unscorable data. A single unavailable cycling route must not remove valid transit or car routes. Failure should not blank the app. Surface actionable missing-key/API/billing/referrer issues without revealing credentials.

Expose an explicit Demo / Live mode. Demo continues to use authored fixtures. No implicit substitution of a fixture into a failed live-mode card; offer a clearly labeled “Use demo routes” action instead. Preserve finance/history state when changing modes. Mark data provenance at the route/card and completion-receipt level where it fits existing interfaces.

### 5\. Critical provider-to-engine adapter

Implement a pure, independently testable adapter between the chosen Google response and the existing engine. Keep provider parsing outside scoreTrip and UI components. Suggested module names are examples; use the repository's conventions.

Return a consistent UI route record containing an ID, title, source, request context, total distanceKm, total duration, transport metadata, geometry and segments. Call the actual existing scoring engine with segments and current rates; do not recreate its emissions or points formula inside the adapter.

Transport mapping targets, subject to checking actual engine identifiers:

Provider meaningEngine targetDrivingcarWalkingwalkOrdinary bicyclingcycleSupported local London busbus\_londonHeavy rail / commuter trainrailSubway / London Undergroundsubway

Do not apply the London bus factor to every bus solely because the destination is London: outside-London portions or nonlocal coaches need an appropriate supported factor, otherwise show “Emissions estimate unavailable”. Do not map tram, light rail, ferry, generic ambiguous rail or an unknown transit vehicle to the nearest convenient factor. Do not add invented emissions factors. If a supported official factor already exists, use its documented mapping.

For direct single-mode routes, use the validated total/leg distance once; do not count both leg totals and their steps. For mixed transit routes, parse each transport step, convert numeric metres to km once and retain walking access, transfer and egress portions. Merge adjacent equal modes if useful, preserving aggregate distances.

Reject negative, nonnumeric, NaN, infinite and missing distances. An explicit zero may be valid; a missing value is not zero. Do not parse localized distance strings or infer distance from duration. Check the summed segment distance against the provider's total within a documented rounding tolerance; flag material gaps rather than fabricating allocations.

Any unsupported or missing-data portion makes the full journey unscorable. Still display its map/time information when available, but show unavailable emissions/points and disable its simulation. Never silently omit a ferry or unknown mode and reward the walking remainder.

Use public-transport passenger-km factors as the engine defines them; do not divide them by an assumed bus/train occupancy again. Ordinary walking/cycling zero values mean the existing transport-operation boundary, not zero lifecycle footprint.

### 6\. Dynamic scoring and existing completion flow

Preserve all current engine coefficients, factors, caps, precision and rounding. Keep physical emissions independent of rate toggles. In the current screenshots, normal/high car charge changes from 5.00 to 7.50 on a 10 km fixture; cycling bonus changes from 2.00 to 3.00 on the 8 km fixture. These are reference fixtures, not hardcoded expectations for every live route.

Rescore every available route when rates change, and update the route cards and Quick Summary from the same current route collection. Clicking Simulate must use the selected route's latest eligible segments/current scoring snapshot, not stale fixture data or a previous closure's rate.

At completion, snapshot the trip summary, score, selected rate and source so later rate/origin changes do not mutate previous receipts. Use the existing completion handler and finance-state updates. Prevent accidental duplicate submissions from one in-flight click, but preserve the app's existing intentional repeated-demo behavior; do not introduce a new real-world daily commute cap in this task.

Live route planning is still only planning. A simulated commute using a live route remains simulated completion; it does not prove GPS travel or automatic verification. Keep that distinction in labels. No background tracking, fitness integration, employee trading or new incentive model is in scope.

### 7\. Implement in two continuous phases

**Phase A: map and search shell.** Inspect baseline, install only necessary dependencies, add API/provider loading, destination configuration, origin selection, accessible map shell and clear live/demo/error states. Verify the app still builds and all existing demo interactions work.

**Phase B: live routes and adapter.** Add concurrent route fetching, normalization, map selection/cleanup, local scoring, summary synchronization and completion plumbing. Then test and visually verify the completed experience. Proceed from A to B without waiting for routine permission.

If credentials are missing, complete all implementation, adapter tests, mocked integration checks, demo fallback and setup documentation. Clearly state that live API verification remains untested rather than claiming success or stopping all work.

### 8\. Verification and definition of done

Run existing tests and the production build using repository scripts. Add meaningful adapter tests and targeted interaction tests for the integration:

*   Direct car/walk/cycle metres-to-km conversion with no double-counting.
    
*   A walking → bus → walking response with every portion preserved.
    
*   Rail/subway vehicle mapping and adjacent-segment aggregation.
    
*   Unknown vehicle and absent/invalid distance produce an unscorable route.
    
*   One mode's failure preserves successful modes.
    
*   A late response cannot overwrite a newer request.
    
*   Rate changes rescore locally without another routing request.
    
*   Selecting a route changes the path but does not change balance.
    
*   Simulation uses the displayed score and stores an immutable receipt.
    
*   No key / quota / permission failure preserves the working demo.
    

Use browser inspection if available to check desktop and mobile sizes, map height, overflowing controls, visible attribution, autocomplete keyboard use, selected-route styling and browser console errors. If browser tools are unavailable, report that visual verification limitation. Do not claim a live request worked without observing it.

Do not delete or weaken existing tests to make the build pass. Do not add a new test framework solely for this task. If baseline tests already fail, distinguish those failures from regressions.

Deliver working changes plus a short setup/readme section. In your final report, list changed files, tests/build results, required Google setup, live-verification status and any blockers. Include an explicit confirmation that existing wallet/settlement/redemption behavior was preserved, if verified.

### 9\. Existing issues to report separately, not fix in this scope

The screenshots/handoff reveal these review items. They are not authorization to rewrite protected features:

1.  Company Summary says yesterday's 78% driving produces 1.5× even in the Normal Day screenshot. It also describes an above-50% binary trigger, while other copy says high demand starts at 80%. Do not infer or silently replace the implemented rate policy.
    
2.  The “LIVE” label, 1,240 kg avoided, 247 employees, tree equivalence, commute equivalence and social-cost number are described as hardcoded demo metrics. They must not be represented in your new planner as actual measured live company data.
    
3.  The dark company-summary emissions figure has poor contrast in the screenshots. Leave its redesign for a separate polish task.
    
4.  Gemini describes redeeming only balance - 100, whereas the earlier product brief transfers the entire positive closing balance. Inspect actual behavior and report the discrepancy; preserve it in this integration.
    
5.  The PDF does not visibly include the wallet/store described by the handoff, and its source footer says the factors are unverified. Verify repository reality; do not claim screenshots prove those features or factor provenance.
    

### 10\. Documentation starting points

Check these current official/provider-owned pages and their applicable version details:

*   Maps JavaScript Routes overview: [https://developers.google.com/maps/documentation/javascript/routes/overview](https://developers.google.com/maps/documentation/javascript/routes/overview)
    
*   Routes JavaScript reference: [https://developers.google.com/maps/documentation/javascript/reference/route](https://developers.google.com/maps/documentation/javascript/reference/route)
    
*   Current Place Autocomplete: [https://developers.google.com/maps/documentation/javascript/place-autocomplete-new](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new)
    
*   Google API security guidance: [https://developers.google.com/maps/api-security-best-practices](https://developers.google.com/maps/api-security-best-practices)
    
*   Google routing policies: [https://developers.google.com/maps/documentation/routes/policies](https://developers.google.com/maps/documentation/routes/policies)
    
*   React map wrapper: [https://visgl.github.io/react-google-maps/docs/get-started](https://visgl.github.io/react-google-maps/docs/get-started)
    

Choose the smallest implementation that satisfies this task. Preserve the working demo, complete the live planner where configured, and make unfinished external setup explicit.