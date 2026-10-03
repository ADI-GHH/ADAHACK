# Automated Carbon Bank

Vite + React dashboard with an authored fixture demo and an optional Google Maps commute planner. New integration code is JavaScript/JSX; the existing TypeScript scoring engine is unchanged.

## Run locally

```powershell
npm install
npm run dev
npm test
npm run build
npm run preview
```

The default Demo mode works without credentials. Balances and receipts live in React memory; refreshing the page resets the session.

## Google Maps setup

1. In your own Google Cloud project, configure billing and enable **Maps JavaScript API**, **Routes API**, and **Places API (New)**. No Cloud settings were changed by this integration. See Google's [Routes library setup](https://developers.google.com/maps/documentation/javascript/routes/start) and [Places widget prerequisites](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new).
2. Copy `.env.example` to `.env.local`. Set `VITE_GOOGLE_MAPS_API_KEY` locally, then restart Vite. Rebuild to change a production bundle. Do not share or commit the key.
3. Apply website/HTTP referrer restrictions for the exact origins you use, for example `http://localhost:5173/*`, `http://localhost:4173/*` for preview, and `https://your-domain.example/*`. Add `127.0.0.1` or different ports only if you use them. Apply API restrictions to the three APIs above. Follow [Google's API security guidance](https://developers.google.com/maps/api-security-best-practices).
4. Billing, usage limits and paid requests still apply. A comparison makes four routing requests plus autocomplete/place-detail usage and a map load; transit alternatives are requested when supported. Free usage caps are **not unlimited free routing**. Review [Routes usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing) and the relevant Maps/Places SKUs before using live mode.

`VITE_` variables are bundled into browser JavaScript. `.env.local` prevents accidental source-control inclusion; it does **not** turn the browser key into a server secret. `.gitignore` excludes local environment files and allows only the empty `.env.example` template.

The office defaults to **2½ Devonshire Square, London EC2M 4UJ**, the destination supplied by the user. Replace it with `VITE_OFFICE_ADDRESS` or edit `src/maps/config.js`.

## Planner behavior

- Choose Live, resolve a home/starting address from the Places suggestions, then click **Find routes**. Search is biased toward London and restricted to Great Britain. Typing does not fetch routes. Changing origin, time or direction clears previous results; Find routes commits the new choices.
- To home reverses the request's endpoints. Now is evaluated by Google when each request is sent: no previously captured departure timestamp is supplied. Scheduled times are parsed as Europe/London independently of the browser's timezone. Nonexistent spring DST times are rejected; an ambiguous autumn time uses its earlier occurrence. The four-mode comparison accepts future departures; transit-only historical requests are outside this UI's scope.
- Driving, transit, bicycling and walking requests run concurrently. Each mode reports its own loading, success, no-service, error or unscorable state. Successful modes survive other failures. No failed live result is replaced by a fixture; **Use demo routes** switches explicitly.
- One `@vis.gl/react-google-maps` provider loads the weekly Maps JavaScript SDK. Routing uses `google.maps.importLibrary('routes')` and `Route.computeRoutes()`, not REST, a dev proxy, or legacy DirectionsService. The implementation follows the current [JavaScript Route reference](https://developers.google.com/maps/documentation/javascript/reference/route), including `DRIVING`, `TRANSIT`, `BICYCLING`, `WALKING`, route `distanceMeters`, `durationMillis`, `path`, and leg/step fields. The field mask is in `src/maps/routeService.js`.
- Origin search uses `PlaceAutocompleteElement`, `gmp-select`, and `place.fetchFields()`. Elements and event listeners are removed on unmount. Current SDK unavailability produces a setup error and leaves Demo accessible; no competing legacy path is implemented.
- The JavaScript request mask is `['distanceMeters', 'durationMillis', 'path', 'legs']`. Requesting complete `legs` supplies the adapter's steps and transit details. Nested `legs.*` entries caused SDK `InvalidValueError` in the configured browser; REST-style `routes.*` masks are not used in this JavaScript call.
- Travel-mode values come from the loaded SDK's `TravelMode` enum. When it exposes `DRIVE`/`BICYCLE`/`WALK`, those values are preferred; the current documented JavaScript names `DRIVING`/`BICYCLING`/`WALKING` remain supported. Request-mode identifiers stay separate from engine transport modes, and direct steps using either naming convention are normalized consistently.
- **View route** and clicking a path select/highlight it and fit its bounds. They do not complete trips. Cards display returned durations and estimated arrivals, with supplied transit lines/stops/transfers. Demo cards retain their authored duration ranges and have no fabricated map paths.
- A red marker marks the office at the user-supplied Devonshire Square coordinates, latitude 51.5165, longitude -0.0793. This fixed building marker remains the office anchor in both directions; changing the configured address does not relocate it automatically. Google's route endpoint may be snapped to an accessible road rather than the exact building coordinates.
- The route comparison dropdown sorts signed credit changes descending (Credits Earned) or ascending (Credits Deducted). Unscorable routes remain visible after scored routes. Quick Summary follows the same ordering. Sorting does not refetch, complete a trip, change map selection or reset wallet/history state.
- Rate changes call the existing `scoreTrip` locally. Cards and Quick Summary use the same scored collection; physical emissions remain independent of incentives. **Simulate Commute** snapshots the current score/rates and updates the existing balance/ledger flow once per in-flight submission. Repeated simulations after completion remain possible. Live planning and simulated completion do not prove travel.

## Adapter and emissions boundaries

`src/maps/routeAdapter.js` is a pure adapter from the current Google JavaScript response to the existing `Segment[]` shape. It contains no scoring formula or new factor.

| Google meaning | Engine mode / policy |
| --- | --- |
| Driving / walking / ordinary bicycling | `car` / `walk` / `cycle`; validated route total used once |
| `HEAVY_RAIL`, `COMMUTER_TRAIN` | `rail` |
| `SUBWAY` | `subway` |
| Confirmed local London `BUS` | `bus_london`, subject to conservative eligibility below |
| Coach, unconfirmed bus, generic rail, tram/light rail, ferry, unknown/missing vehicle | Whole journey unscorable |

Bus eligibility requires TfL agency evidence (exact agency names or a `tfl.gov.uk` agency URL), bus-step geometry, departure/arrival stop coordinates, and every supplied bus-path point inside a conservative inner-London rectangle (latitude 51.45–51.58, longitude -0.30–0.03). This is a deliberately narrow modelling eligibility zone, not a complete London boundary. Valid London services outside the zone, incomplete coverage evidence, and non-TfL agency labels may remain unscorable. Google `BUS` alone cannot distinguish an ordinary local service from a coach, so the adapter does not automatically apply `bus_local` to other buses. No distance is allocated to a convenient factor to fill a gap.

Mixed transit parses every step, preserving walking access/transfers/egress and merging adjacent engine modes. Numeric metres are converted once. Missing, negative, nonnumeric and nonfinite distances are rejected. Explicit zero is accepted. Step sums must match each leg and the total within **max(20 metres, 1 metre per step/leg)**, allowing integer rounding without permitting material missing portions. Missing total distance can use validated leg totals; an explicitly invalid total cannot. Total elapsed provider duration supplies the arrival estimate, including waits/transfers; step moving durations are not substituted.

Any unsupported or invalid portion disables scoring and simulation for the entire journey while retaining available geometry/time/transport metadata. Public-transport factors already use passenger-km; no assumed occupancy division is added. Walk/cycle zero factors describe the existing transport-operation boundary, not zero lifecycle impact. Repository factor metadata still says **2026 factors unverified, check before demo**; this integration does not independently verify their provenance.

## Attribution and provider data

Google basemap attribution is retained. Live cards identify Google Maps as their route-data source, separately from this application's estimated emissions/credits. Geometry/provider responses are not saved in localStorage, a database, receipts, or a permanent archive. Comparisons/paths stay in session memory and clear on context/mode changes.

Receipts retain only a generic route label, source, simulated status, timestamp, aggregate scoring values and incentive multipliers. They exclude addresses, stops, lines, geometry, and request context. These minimal derived summaries are not a declaration that long-term retention is unrestricted. Before adding persistence or public deployment, resolve retention/derived-data requirements under the agreement applicable to the billing account, including EEA-specific conditions where applicable, and supply the required public Terms of Use and Privacy Policy. See [Routes policies](https://developers.google.com/maps/documentation/routes/policies) and [Maps JavaScript policies](https://developers.google.com/maps/documentation/javascript/policies).

## Verification and remaining checks

See [GOOGLE_MAPS_INTEGRATION_REPORT.md](GOOGLE_MAPS_INTEGRATION_REPORT.md) for results, changed files, external setup limitations, and existing issues left outside this task.
