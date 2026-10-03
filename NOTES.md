# Implementation Notes

## Assumptions Made

1. **Mode validation**: `getFactor()` throws on any mode not explicitly listed in the EMISSION_FACTORS table. This includes case sensitivity - modes must match exactly (e.g., "bus_london" not "bus-london" or "bus_london ").

2. **Zero distance segments**: Allowed per spec ("zero is allowed"). They contribute 0 emissions, 0 active km, and appear in the breakdown.

3. **Rounding function**: Used the exact `round2` implementation from the spec with half-away-from-zero and `-0` avoidance.

4. **Bus/rail/subway multiplier**: These always use multiplier of 1 (not carMultiplier). Only "car" segments get carMultiplier applied.

5. **Active modes**: Only "walk" and "cycle" count toward activeKm for the activeBonus calculation.

6. **Duration fields**: Carried in RouteOption but never used in scoring, as specified.

7. **HIGH_RATES**: Defined as `{ carMultiplier: 1.5, activeMultiplier: 1.5 }` for test cases.

8. **Module system**: Used ES modules (`type: "module"` in package.json) with `.js` extensions in imports for Node/TypeScript compatibility.

9. **Error messages**: Used clear, descriptive error messages for validation failures as required by the spec.

## Files Created

- `package.json` - Node project config with test/build scripts
- `tsconfig.json` - TypeScript config (strict, ES2020, ESNext modules)
- `src/engine/types.ts` - Type definitions
- `src/engine/factors.ts` - Emission factors and getFactor()
- `src/engine/scoring.ts` - Scoring logic and constants
- `src/engine/fixtures.ts` - Demo routes and scoreRoute()
- `src/engine/index.ts` - Public re-exports
- `src/engine/scoring.test.ts` - 28 test cases (all passing)
- `NOTES.md` - This file