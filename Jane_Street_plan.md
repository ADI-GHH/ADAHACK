# The Automated Carbon Bank — Hackathon Product Plan

**Status:** Proposed product and scoring plan for team review, before architecture.
**Prepared:** 3 October 2026.
**Audience:** Hackathon team and Claude Code.
**Working assumption:** A UK office, with London as the initial demo location; a 24–48 hour hackathon. Change these assumptions before choosing architecture if your event or office differs.

## 1. Product decision

Build an employee commute rewards app. Each employee receives a monthly Green Credit allowance. Completed commutes deduct credits in proportion to estimated transport emissions. Walking and ordinary cycling earn a distance-based bonus. A daily company-wide demand signal raises the cost of driving and the reward for active travel. Positive month-end balances become a separate wallet for optional workplace perks.

The core loop is:

1. Compare home-to-office or office-to-home routes.
2. See travel time, distance, estimated emissions and the expected credit change.
3. Choose a journey.
4. Complete it; the system calculates the result from accepted commute evidence.
5. Review the updated balance and explanation.
6. At month end, redeem the positive balance for a perk.

**One-sentence pitch:** “A commute rewards bank that shows the time and credit consequences of every route, then turns greener choices into useful workplace perks.”

### Alignment with the supplied challenge

The attached Jane Street brief asks for a program that encourages employees who typically drive to choose more sustainable transport. Its judging criteria cover teamwork, originality, sustainability fit, presentation and project quality. This project should demonstrate a working behavioral incentive, accurate calculations, useful route comparisons and a complete reward journey. Do not repeat the brief's global emissions percentage without separately verifying its year and definition; it is unnecessary to the demo.

### Naming the “market maker” accurately

Keep “Market Maker” as the product concept, but describe the implementation as an **automated incentive-pricing engine**. There is no token trading, liquidity pool, exchange, cash value or constant-product AMM. The company issues and funds credits and perks. Dynamic pricing changes incentives; it never changes the physical emissions estimate.

## 2. What is decided and what is assumed

| Item | Planning decision | Reason |
| --- | --- | --- |
| Starting allowance | 100 credits per full demo month | Preserves the proposed rewards-bank concept |
| Settlement unit | One complete, one-way commute | Supports different outbound and return choices |
| Base emissions metric | Estimated kg CO2e | Makes the greenhouse-gas boundary explicit |
| Initial supported modes | Car, walking, ordinary bicycle, bus and rail/subway | Covers the central commute choices |
| Mixed journeys | Calculate each transport portion separately | Walking to a bus stop must not be charged as a bus journey |
| Dynamic rates | Daily, published before commuting and frozen for that local day | Employees can decide using predictable rates |
| Demo location | London | Allows a coherent local bus/subway demonstration |
| Hackathon platform | Responsive web experience with transparent trip simulation | A complete, reliable demo is achievable |
| Real background tracking | Post-hackathon mobile milestone | Requires device-level permissions and validation |
| Reward fulfillment | Simulated company perks in the hackathon | Real room, compute and charity systems need company access |
| Architecture | Deferred to a separate document | This brief fixes behavior and scope first |

All scoring coefficients, thresholds, limits, perk costs and retention targets below are **proposed product settings**, not scientific measurements.

## 3. Users and journeys

### Employee

- Sets an office and home/origin, usual commute time and transport preferences.
- Compares feasible routes by duration, credit outcome and estimated emissions.
- Understands why today's driving price or cycling bonus differs from yesterday's.
- Sees trip evidence status, estimated versus settled results and balance history.
- Corrects a suspected transport classification.
- Redeems earned credit for an optional perk after month close.

### Company administrator / demo operator

- Configures the allowance, scoring policy and reward inventory.
- Reviews aggregate mode share and estimated emissions.
- Publishes a daily rate snapshot.
- Runs the demo scenarios and month-end settlement.
- Resolves corrections without editing transaction history invisibly.

The administrator must not receive employees' home addresses, raw location trails or fitness histories in the normal dashboard.

## 4. Scope and priorities

| Priority | Deliverable | Completion condition |
| --- | --- | --- |
| P0 | Onboarding and commute direction | User can compare both directions using separate times |
| P0 | Route list and details | Distance, ETA, mode segments, emissions and signed credit change appear |
| P0 | Source-backed emissions and points | Calculations use the factor records in section 6 |
| P0 | Daily rate engine | Normal and high-driving scenarios change the correct incentives |
| P0 | Trip completion and ledger | Accepted completion updates balance once, with a breakdown |
| P0 | Monthly settlement and redemption | Closing balance creates a wallet; one perk can be redeemed |
| P0 | Reliable demo mode | Entire journey works without third-party credentials |
| P1 | Live Google map and routing | Real routes replace authored fixtures when credentials exist |
| P1 | Company summary | Aggregate mode share, participation and estimated emissions |
| P1 | Foreground location capture | Works while the web page is open, with permission |
| P2 | Personal fitness connection concept | Clearly marked future integration; no fake connected status |
| P2 | Optional department leaderboard | Uses eligible first-party records and opt-in participation |

**Exclude from the hackathon:** employee trading, blockchain, cash redemption, a complete native app, continuous passive mode detection, live room/cluster scheduling, real donations, arbitrary global transport coverage, food/manufacturing lifecycle estimates, route safety guarantees and machine-learning model training.

If time is short, finish the bank-to-redemption flow before adding a live map. A map alone does not demonstrate the product.

## 5. Route experience and screen requirements

### 5.1 Home / bank dashboard

Show the current month, remaining allowance, last completed trip, daily rates, next commute and month-end reward preview. Keep the current commute balance separate from previously settled redemption credits.

Example copy: “Driving is 1.5× today. Active travel bonuses are 1.5×. Based on recent company commute patterns; rates are fixed for today.”

### 5.2 Commute planner

Use a Google Maps-style comparison pattern: route cards alongside the map on desktop and a scrollable sheet beneath it on mobile. Use your own visual identity. A user can switch direction, set departure or desired arrival time, and sort by fastest, lowest estimated emissions or best credit result.

Every route card must show:

- Transport icons and sequence, such as walk → bus → walk.
- Total distance and duration, including transfer/waiting time where provided.
- Arrival time and departure time in the office's timezone.
- Transit line and transfer count when supplied.
- **Expected credit change**, with “Earn” or “Deduct” written out.
- Estimated kg CO2e and an estimate label.
- Rate date, quote time and relevant verification status.
- Fare only when the provider supplies it; otherwise “Fare unavailable”.

Expanded details show distance and estimated emissions per segment, emission factors, emissions charge, active bonus, multiplier and net result. A mixed journey may have a net deduction even though its walking portion earns a small bonus.

Only recommend feasible, returned routes. Never invent a bus service, safe cycle path, guaranteed accessibility or realtime departure. If coverage is missing, say that no route was returned for that mode.

### 5.3 Trip screen

States: planned → in progress → completed pending evidence → accepted and settled. Alternative states: needs review, cancelled or rejected. Route selection by itself earns nothing. A selected transport mode is intent, not evidence of the actual mode used.

In demo mode, “Simulate completed commute” supplies authored trip evidence and visibly labels the result as simulated. Optional foreground tracking has explicit Start and Stop controls.

### 5.4 Activity and calculation history

Show each trip's direction, date, accepted transport portions, distance, evidence type, emissions estimate and credit delta. Include an expandable “How this was calculated” panel and a correction action. Do not hide deductions after the balance becomes negative.

### 5.5 Rewards

Show settled redeemable credits, reward cost, inventory, expiry and redemption status. Example **demo-only** costs: 20 credits for a meeting-room priority voucher, 50 for a charity-allocation vote, 75 for a compute-priority voucher. These are proposed settings, not real company policies.

Explain exactly what a voucher grants. Do not imply unlimited cluster priority, displaced essential bookings or a cash donation equal to the points spent.

### 5.6 Company summary

Show recent driving share, rate rationale, verified commute count and aggregate estimated emissions. Keep estimated savings separate from actual emissions, and simulated records separate from real records.

## 6. Emissions evidence and accounting boundary

### 6.1 Source of truth

Use the [UK Government 2026 greenhouse-gas conversion factors](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2026), published 11 June 2026. The full workbook is the numeric source. The automated flat file was corrected in July; use that revision if importing the flat file. [S1]

The following values were checked directly in the [2026 full workbook](https://assets.publishing.service.gov.uk/media/6a29392bade52dc0882218a8/ghg-conversion-factors-2026-full-set.xlsx). Cells refer to the worksheet **Business travel- land**:

| Mode / selection | kg CO2e per unit | Unit | Cell |
| --- | ---: | --- | --- |
| Average car, unknown fuel | 0.16591 | vehicle km | X53 |
| Average petrol car | 0.16152 | vehicle km | H53 |
| Average diesel car | 0.17265 | vehicle km | D53 |
| Average battery electric car | 0.02951 | vehicle km | AF53 |
| Local London bus | 0.06360 | passenger km | D80 |
| Average local bus | 0.10151 | passenger km | D81 |
| National rail | 0.03092 | passenger km | D87 |
| London Underground | 0.01549 | passenger km | D90 |

Walking and ordinary cycling use **0 within the chosen transport-operation boundary** as an explicit modeling convention; this is not a government factor or a claim of zero lifecycle impact. [S1, S2]

### 6.2 What the MVP estimates

Estimate transport-operation emissions, including electricity generation for electric transport. Exclude upstream fuel production, vehicle manufacture, infrastructure, food and equipment. Avoid mixing this boundary with full lifecycle figures. Electric cars must not inherit a zero-tailpipe factor as their complete transport estimate. [S2]

This is a commute comparison estimate, not a measured personal carbon footprint, certified carbon offset or corporate reporting inventory.

### 6.3 Per-segment formula

For each contiguous transport portion `i`:

```text
d_i = distance in kilometres
f_i = appropriate factor in kg CO2e per vehicle-km or passenger-km
n_i = accepted occupants if the factor is per vehicle-km; otherwise 1

E_i = d_i × f_i / n_i
E_trip = sum(E_i)
```

For the hackathon, default car occupancy to 1 and label this assumption. Keep carpool rewards outside P0 because verifying shared occupancy is additional work. Never divide a bus or rail passenger-km factor by the vehicle's passenger count again.

Use the actual distance for each portion; do not multiply the entire walking-plus-bus route by the bus factor. Google transit instructions may contain several steps of the same mode; normalize adjacent steps into transport portions without losing their distances.

### 6.4 Factor records and missing data

Each factor needs a stable identifier, mode, region, vehicle/fuel category, value, unit, boundary, source URL, worksheet/cell, release year and verification date. Maintain versioned factor sets. A trip retains its factor-version reference after annual updates.

Missing factor is not zero. Use a documented broader category only when defensible and visibly labeled; otherwise mark the estimate unavailable and hold settlement for review. No guessed number, including an invented e-bike or operator-specific bus factor, may silently enter the production calculation.

Add more modes only after their factors and mappings have been verified. Apply UK factors to the UK pilot; a deployment elsewhere needs an appropriate regional set.

## 7. Recommended points formula

### 7.1 Design choice

Use an emissions deduction plus an active-distance bonus. Keep the physical estimate independent of company behavior. Duration affects route usefulness but does not itself earn points: waiting in traffic should not create rewards.

```text
emissions_charge = k × sum(M_mode(i, day) × E_i)
active_bonus = M_active(day) × min(r × eligible_active_km, R_cap)

credit_delta = active_bonus - emissions_charge
new_balance = old_balance + credit_delta
```

`eligible_active_km` is accepted walking plus ordinary cycling distance within a legitimate home↔office journey. For rewards, cap it at the shorter of accepted active distance and a reasonable direct active-route distance between the commute endpoints. Record excess distance for emissions where applicable, but do not reward recreational loops. When a reference route is unavailable, the trip needs review rather than an arbitrary fallback cap.

### 7.2 Proposed calibration

| Parameter | Default | Meaning |
| --- | ---: | --- |
| Monthly opening allowance | 100 credits | Full demo month |
| Reference daily car distance | 20 km | Two 10 km one-way commutes |
| Reference daily car deduction | 10 credits | Normal-day target |
| `k` | `10 / (20 × 0.16591)` = approximately 3.013682 credits/kg CO2e | Emissions-to-credits conversion |
| `r` | 0.25 credits/eligible active km | Distance-based walking/cycling incentive |
| `R_cap` | 2.5 credits per one-way trip before multiplier | At most 5 active credits per normal round trip |
| Rewardable commute count | At most 2 one-way journeys per office-local day | Outbound and return; extra travel does not create repeated bonuses |
| Dynamic multiplier range | 1.0–1.5 | Bounded and easy to explain |

The 10-credit driving target is a **daily round-trip** target at the reference distance, not a fixed charge for every journey. A normal 10 km one-way average-car trip costs 5 credits. Different distances and car categories produce different values.

Walking and cycling receive the same bonus per eligible kilometre. A bicycle's shorter travel time improves the route choice but does not justify inventing a different physical emissions value. The earlier “walking deducts points” example is replaced with an active-travel bonus to match the agreed concept.

### 7.3 Daily demand multiplier

The office's actual Tuesday driving share is unavailable on Tuesday morning. Forecast demand using accepted first-party commutes from the previous five completed office-local days. Freeze the rate at 06:00 local time for the entire date. Quotes before publication use the base rate and are marked provisional; users must refresh them after publication before starting a rewardable trip.

```text
s = accepted car-containing commutes / all accepted commutes
q = clamp((s - 0.50) / 0.30, 0, 1)

M_car = 1 + 0.5 × q
M_active = 1 + 0.5 × q
M_bus = M_rail = M_subway = 1
```

A mixed car journey counts once as car-containing; unknown, rejected and pending trips are excluded. Use the base multiplier when the history contains fewer than 20 accepted commutes. Synthetic demo history is a separate, visibly marked dataset.

At driving share 50% or less, all rates are normal. At 65%, car and active multipliers are 1.25. At 80% or more, they are 1.5. Thus the reference daily car deduction becomes 15 credits and the capped daily active bonus becomes 7.5 credits. All car categories, including EVs, share the demand multiplier, but their emissions charges differ.

This is a company behavior signal, not a measurement of current road congestion or bus occupancy. Do not pretend Google traffic changes the government factor. Do not reprice a completed trip based on behavior observed later that day.

### 7.4 Quote and settlement behavior

- Store the quote's date, rate/policy version and factor-version references.
- Freeze the multiplier for the journey's local start date, including an overnight journey.
- Settle against accepted distance and transport portions, not merely the selected route.
- A deviation may change the final credit result; explain the difference to the user.
- Cancelled or uncompleted trips post no commute credit transaction.
- Corrections reverse the previous result and post a replacement using the original date's policy.
- Calculate at full precision, sum at trip level and post once to 0.01 credit using a consistent decimal rounding rule. Never round every navigation step individually.

### 7.5 Worked route examples

These are **authored illustrative journeys**, not Google-returned routes. Durations illustrate the interface; distance and credits are calculated using the listed factors. Assume accepted one-way travel, car occupancy 1 and active-distance eligibility equal to the displayed active distance.

| Journey | Illustrative duration | Estimated kg CO2e | Normal-day delta | High-driving-day delta |
| --- | --- | ---: | ---: | ---: |
| Average car, 10 km | 25 min | 1.65910 | −5.00 | −7.50 |
| Walk, 7 km | 85 min | 0 in chosen boundary | +1.75 | +2.63 |
| Cycle, 8 km | 30 min | 0 in chosen boundary | +2.00 | +3.00 |
| London bus, 10 km | 40 min | 0.63600 | −1.92 | −1.92 |
| National rail, 10 km | 20 min | 0.30920 | −0.93 | −0.93 |
| Walk 1 km + London bus 9 km | 35 min | 0.57240 | −1.48 | −1.35 |

Mixed journey calculation on a normal day:

```text
emissions = (1 × 0) + (9 × 0.06360) = 0.57240 kg CO2e
charge = 3.013682... × 0.57240 = 1.725031... credits
bonus = 0.25 × 1 = 0.25 credits
net = 0.25 - 1.725031... = -1.475031... → Deduct 1.48 credits
```

The walking portion reduces the net charge by earning a bonus; the bus portion contributes emissions. There is no need to invent a walking emissions deduction.

### 7.6 Monthly calibration and limitations

For 20 office days, two identical 10 km one-way trips per day, normal rates throughout and trip-level rounding:

| Transport | Posted daily delta | Closing balance from 100 |
| --- | ---: | ---: |
| Average car | −10.00 | −100.00 |
| London bus | −3.84 | +23.20 |
| National rail | −1.86 | +62.80 |
| Walking or ordinary cycling | +5.00 | +200.00 |

**Do not promise every bus rider a surplus.** The UK average local-bus factor gives a greater charge than London's; at this distance its posted monthly deduction is 122.40 credits. Longer journeys can also exhaust the allowance. For a non-London pilot, explicitly recalibrate the allowance or coefficient against local commute scenarios—for example 125 starting credits for this particular average-bus scenario—before launch. Never change emissions factors to force a preferred outcome.

Distance-sensitive deductions disadvantage people with fewer transport alternatives. Keep this visible as a pilot design question. The company should decide how disability, caring responsibilities, shift work, leave, office attendance and poor transit access affect allowances. Preserve actual emissions estimates even if approved credit adjustments provide accommodation.

## 8. Month-end settlement and perk rules

### 8.1 Two balances

The current month's commute balance may become negative so emissions-related activity remains visible. Negative credits are not financial debt and do not carry into next month's opening allowance.

At the end of the office-local calendar month:

```text
month_closing_balance = opening allowance + all posted commute/adjustment deltas
redeemable_transfer = max(0, month_closing_balance)
next_month_opening_balance = configured monthly allowance
```

Close after a proposed 48-hour reconciliation window. Evidence accepted during this window belongs to its original commute month. Later approved corrections adjust that month's settlement and the redemption wallet through explicit adjustment records; do not silently recompute spent rewards.

During reconciliation, display “Settlement pending”. Monthly close is automatic in the eventual product; the demo uses a clock advance or admin control to invoke the same business rules.

### 8.2 Redemption

- Employee chooses which perk to buy; calculation and credit transfer are automatic.
- Spend only from settled redeemable credits, not projected month-end values.
- Demo credits expire after 90 days; show the expiry and spend the earliest-expiring credits first.
- A redemption must debit the wallet and reserve inventory together, once.
- If fulfillment fails, release the reservation and refund with a visible transaction.
- A request retry must not buy the same voucher twice.
- At zero or negative month close, transfer zero; ordinary workplace access remains available.

Unused starting allowance is redeemable under the original concept. This means absence or remote work can leave a surplus without a greener commute. Demonstrate only the clearly specified full-attendance scenario at the hackathon. Before a pilot, adopt a published attendance/leave policy, such as an allowance prorated by expected office days plus an eligibility rule for unverified scheduled days. Never assume that an untracked trip was a car journey or deduct automatically for missing evidence.

Compute-priority perks need a sustainability check: prioritize existing approved work within existing capacity, rather than rewarding additional compute consumption. Charity perks allocate a capped company budget; points are not carbon offsets or money.

## 9. Google Maps integration plan

### 9.1 What to use

Use a Google map for display and the current Routes API for routes, distances and durations. A map rendering API does not itself provide route distances. Make separate mode requests for DRIVE, WALK, BICYCLE and TRANSIT; inspect actual returned transport types. Transit responses can include walking portions and line/stop details. Alternative transit routes are available when the service returns them. [S3, S4]

Do not require a fixed number of alternatives. Recompute office→home independently using the return departure time; reversing an outbound polyline does not give a valid return service.

Request only fields needed for the interface and calculation. Keep transit wait/transfer time in total travel time but give it no transport-distance emissions or bonus. Treat Google distance as an estimate, not evidence of what the employee travelled. If segment distances are absent, do not allocate distance arbitrarily and present the result as exact.

### 9.2 Is it free?

Google Maps Platform has product-specific monthly free usage caps and pay-as-you-go charges beyond them. At the research date, the global list shows 10,000 free monthly events for Dynamic Maps and Compute Routes Essentials, and 5,000 for Compute Routes Pro. The first paid tier is respectively USD 7, USD 5 and USD 10 per 1,000 events. These are separate SKUs, not a single shared pool. [S5]

Compute Routes is billed per request; traffic-aware features can trigger Pro. Set up billing and appropriate API keys, restrict keys by API and allowed origin/application, and verify the SKU triggered by the chosen request. Do not describe route distances as unconditionally free. [S6]

Budget example: four mode requests × two directions × 100 users × 20 days = **16,000 route requests/month**, before retries or repeated searches. Map loads, geocoding and address autocomplete are additional usage. Debounce inputs and avoid refreshing all modes continuously. Configure quotas and monitor actual usage; budget alerts alone do not stop charges.

### 9.3 Data and fallback

Respect Google attribution and applicable storage/display rules. Do not archive live provider route responses as permanent fixtures or assume long-term route-distance retention is permitted. Design lasting trip evidence from first-party observations and preserve only provider content allowed by the relevant agreement. Check applicability of EEA terms using the billing account location. [S7]

Demo fallback: authored route/segment fixtures with synthetic coordinates and explicit “Demo routes” labeling. Keep them distinguishable from live results. An external Google Maps link can assist navigation, but does not supply an embedded route comparison or return route-distance data to the app.

## 10. Tracking and fitness integrations

### 10.1 Honest hackathon tracking

The web Geolocation standard delivers updates to active visible documents; a web/PWA demo should not claim dependable tracking while closed or in the background. [S8]

P0 supplies simulation evidence. P1 may add foreground location capture. Selection, elapsed time or a start/end location alone cannot reliably distinguish a bicycle, bus and car.

### 10.2 Real-world mobile milestone

Evaluate a mobile approach only in the architecture phase. Its product requirements are opt-in location/motion access, commute-window detection, home/office geofences, battery-conscious sampling, pause controls and an evidence-confidence assessment. Test on actual devices, including permission revocation, locked screens, missing GPS, tunnels and offline travel.

Use multiple signals for mode inference, such as motion patterns and consistency with transit corridors. Treat ambiguous results as reviewable. Do not market a chosen numerical confidence threshold as calibrated until validated against labeled real trips.

GPS alone cannot reliably identify petrol versus EV or vehicle occupancy; those require separate accepted profile/evidence rules. Support manual corrections so a mode-classification error does not remove a perk unfairly.

### 10.3 Strava and fitness providers

Strava is useful as a potential source of the user's recorded walking/cycling activity, not a universal automatic commute detector. Access requires user authorization; webhooks can signal activity changes and app limits constrain usage. [S9, S10]

Its current API policy restricts displaying user data to others, aggregation and storage. Do not assume permission to feed imported activities or derived rewards into an employer dashboard, company demand rates, shared leaderboard or permanent monthly ledger. Confirm that the exact use case and retention are permitted before implementation; otherwise omit this integration. [S11]

Plan Strava as an optional, policy-gated, personal-only experiment after the core demo. Do not build a nonfunctional “Connect” button presented as live. Fitness data should supplement compatible first-party evidence only if that use is authorized. Deduplicate the same trip across device capture and imports, and handle activity edits/deletions and disconnects.

Other tracker/health ecosystems need separate permission, partner-access and device-feasibility checks in the architecture phase. Steps alone do not identify a home-to-office commute or its mode sequence. Do not request unrelated medical or heart-rate data for this product.

## 11. Integrity, privacy and fairness requirements

- Accepted journeys must match a home↔office direction and reasonable time/distance envelope.
- Do not reward the same trip twice because of an import, retry or repeated completion event.
- Reward only eligible commute active distance; flag loops and implausible speed jumps for review.
- Keep a trip's emissions record even when its incentive bonus is capped.
- Do not label self-reported evidence as automatically verified.
- Unknown mode means pending review, not default driving and not zero emissions.
- Offer origin privacy, permission withdrawal, tracking pause and account deletion controls.
- Share aggregate company data only when group size is sufficiently large; proposed demo minimum is 10 distinct employees, not 10 trips.
- Keep leaderboards optional, avoid negative-balance shaming and exclude provider data without permission.
- Proposed pilot target: raw first-party location retained for at most seven days, subject to a documented dispute/deletion policy. Separate necessary summary records from raw trails and define their retention before rollout.

These are product requirements. A real workplace launch needs its own privacy and employee-policy review; this hackathon brief does not establish a legal basis for employee monitoring.

## 12. Functional acceptance criteria

| Scenario | Required result |
| --- | --- |
| 10 km average-car one-way trip, normal rate | 1.65910 estimated kg CO2e and −5.00 credits |
| Same trip at 80% recent driving share | Same emissions, −7.50 credits |
| 8 km ordinary cycling trip, normal/high rate | +2.00 / +3.00 credits |
| 1 km walk + 9 km London bus | 0.57240 kg CO2e and −1.48 normal-day credits |
| 10 km average local bus outside London | Use average/local factor; never silently substitute London |
| Duplicate completion event | One posting and one emissions record |
| Extra noncommute loop | No added active bonus |
| Missing factor or ambiguous mode | Clearly unavailable/pending; no silent zero |
| Return trip | New direction/time-specific route calculation |
| Mid-trip rate publication or midnight | Original start-date rate remains applicable |
| Closed month with negative balance | Zero transfer and fresh next-month allowance |
| Closed month with +23.20 | Exactly 23.20 transfers once to redeemable wallet |
| Duplicate close or redemption request | No duplicate transfer or inventory reservation |
| Evidence corrected after close | Visible adjustment; previous record remains auditable |
| Maps unavailable | Demo fixtures or clear error; no fake live results |
| Location permission denied | Planner remains usable; tracking status is explicit |

Verification should prioritize these business behaviors and one complete user journey. It should not merely test that a UI renders the same hardcoded values it contains.

## 13. Hackathon work plan

Use these as work packages, assigning people according to actual team size. The time allocation is a suggested distribution of available build time, not a confirmed event schedule.

| Stage | Approximate share | Output / checkpoint |
| --- | ---: | --- |
| Product lock | 10% | Confirm defaults, demo office, evidence mode and perk examples |
| Architecture next | 10% | Select stack, external services, boundaries and implementation sequence |
| Core bank and calculation | 25% | Versioned factors, route scoring, daily rates, trip history and balances |
| Employee experience | 25% | Planner, map/fixtures, trip result and reward screens |
| Settlement and robustness | 15% | Month close, redemption, deduplication and edge cases |
| Demo preparation | 15% | Integration checks, rehearsal, screenshots and source explanation |

Potential team responsibilities: route experience; emissions/scoring/ledger; settlement/rewards/company summaries; integration/verification/presentation. A small team can combine roles. Define shared example journeys and expected outputs first so work remains consistent.

At the halfway point, require a complete path using fixtures. At three-quarters time, stop adding features and exercise failures. Keep working evidence of contributions for the teamwork judging criterion.

## 14. Three-minute presentation plan

1. **Problem:** Employees want practical reasons to switch from driving; points with no meaningful reward are weak motivation.
2. **Morning decision:** Show one origin and multiple routes with time, emissions and credit outcomes.
3. **Dynamic incentive:** Switch synthetic recent driving share from 50% to 80%; the reference car charge rises and cycling bonus increases. State that rates use earlier company patterns.
4. **Completed journey:** Simulate a mixed walking/bus commute and expand its source-backed calculation.
5. **Month-end value:** Advance the demo clock, transfer the surplus and redeem one available perk.
6. **Credibility:** Show official factor provenance and explicitly distinguish the working demo from planned background tracking and company integrations.

Demo numbers, account states and reward inventory must be reproducible after reset. Synthetic driving share may be changed through a clearly labeled demo control, never represented as live employee telemetry.

## 15. Success metrics

- Planner-to-completed-commute conversion.
- Share of accepted commutes containing a car, compared with a baseline period.
- Sustainable-mode adoption and repeat participation.
- Reward redemption rate and funded perk cost.
- Classification correction rate and incomplete-evidence rate.
- Route lookup latency and provider usage/cost.
- Estimated emissions under a consistent factor set and accounting boundary.

If showing “emissions avoided”, calculate `reference_solo_car_route_km × reference_car_factor − actual_trip_emissions` for the same commute direction and frequency. Preserve negative differences. Call this **estimated difference versus a solo-car scenario**; it does not prove the employee would otherwise have driven. Do not use dynamic points as a carbon-saving measure or double-count a shared car journey across participants.

## 16. Planning checkpoint before architecture

Proceed with the defaults in this brief unless the team changes them. Before architecture, record:

- Actual hackathon duration and available team skills.
- Demo office/country and the Google billing account region.
- Whether live API keys are available, with a fixture fallback regardless.
- Whether the goal is a web demonstration or a device-tested mobile prototype.
- Whether 100 credits and the London calibration suit the chosen office.
- The final rewards and how many are available in the demo.

The next architecture document should select the stack, define module responsibilities and data relationships, specify provider and device interfaces, choose persistence/authentication, map business operations to API contracts, address rate publication and month-close scheduling, define secret handling, and produce an ordered implementation checklist. Do not choose those details implicitly inside this product plan.

## 17. Claude Code handoff prompt

Copy this prompt with this file into the project:

> Read automated-carbon-bank-plan.md as the product and business-rule brief. First produce ARCHITECTURE.md for team review; do not start implementation yet. Use the defaults unless I give you corrections, and explicitly record assumptions. Design a complete hackathon MVP with route comparison, source-backed segment emissions, dynamic daily incentives, accepted-trip settlement, an auditable credit ledger, monthly transfer and perk redemption. Support a clearly labeled fixture/demo mode that works without external credentials. Keep the emissions metric independent of incentive multipliers. Preserve the specified units, factor provenance, decimal rounding, original-day rates and idempotency rules. Do not claim background browser tracking or live company/fitness integrations. In architecture, propose the smallest suitable stack, separate optional provider integrations, explain Google billing and content-retention constraints, and map every P0 acceptance criterion to the implementation plan. Treat true passive mobile tracking and Strava use as separate feasibility milestones. List material unresolved decisions without blocking the architecture draft on routine choices. After the architecture is accepted, implement the MVP in small vertical slices and verify the business scenarios plus the full demo journey.

## 18. Sources and verification notes

Research checked on 3 October 2026. APIs, terms and prices may change; recheck before integration or rollout. Numeric emissions values above were read from the full workbook, not recalled or invented. Calculated examples use those values and explicitly proposed credit coefficients. All fixture distances/times are illustrative.

- **[S1]** [UK Government: Greenhouse gas reporting conversion factors 2026](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2026), including the linked full workbook and July flat-file correction.
- **[S2]** [2026 methodology paper](https://assets.publishing.service.gov.uk/media/6a2940543b15d05a7ce3202e/2026-GHG-conversion-factors-methodology-report.pdf), transport methodology and electric-vehicle component treatment.
- **[S3]** [Google Routes API: Get a transit route](https://developers.google.com/maps/documentation/routes/transit-route).
- **[S4]** [Google Routes API: Get alternative routes](https://developers.google.com/maps/documentation/routes/alternative-routes).
- **[S5]** [Google Maps Platform global pricing list](https://developers.google.com/maps/billing-and-pricing/pricing).
- **[S6]** [Google Routes API usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing).
- **[S7]** [Google Routes API policies and attributions](https://developers.google.com/maps/documentation/routes/policies).
- **[S8]** [W3C Geolocation specification](https://www.w3.org/TR/geolocation/), request-position and visible-document requirements.
- **[S9]** [Strava developer getting-started guide](https://developers.strava.com/docs/getting-started/).
- **[S10]** [Strava webhooks](https://developers.strava.com/docs/webhooks/) and [rate limits](https://developers.strava.com/docs/rate-limits/).
- **[S11]** [Strava API Policy](https://www.strava.com/legal/api_policy), especially display, aggregation and retention restrictions.
- **Challenge source:** supplied Jane Street(1).docx, Hoppers Challenge: Sustainable transport. No sponsorship or endorsement of this proposed app is implied.
