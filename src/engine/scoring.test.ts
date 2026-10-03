import { describe, it, expect } from "vitest";
import { scoreTrip, scoreRoute, demoRoutes, DEFAULT_RATES } from "./index.js";

const HIGH_RATES = { carMultiplier: 1.5, activeMultiplier: 1.5 };

describe("scoreTrip - emissions and creditDelta", () => {
  it("1: car 10km normal", () => {
    const result = scoreTrip([{ mode: "car", distanceKm: 10 }], DEFAULT_RATES);
    expect(result.emissionsKg).toBeCloseTo(1.65910, 5);
    expect(result.creditDelta).toBe(-5.00);
  });

  it("2: car 10km high", () => {
    const result = scoreTrip([{ mode: "car", distanceKm: 10 }], HIGH_RATES);
    expect(result.emissionsKg).toBeCloseTo(1.65910, 5);
    expect(result.creditDelta).toBe(-7.50);
  });

  it("3: cycle 8km normal", () => {
    const result = scoreTrip([{ mode: "cycle", distanceKm: 8 }], DEFAULT_RATES);
    expect(result.emissionsKg).toBeCloseTo(0, 5);
    expect(result.creditDelta).toBe(2.00);
  });

  it("4: cycle 8km high", () => {
    const result = scoreTrip([{ mode: "cycle", distanceKm: 8 }], HIGH_RATES);
    expect(result.emissionsKg).toBeCloseTo(0, 5);
    expect(result.creditDelta).toBe(3.00);
  });

  it("5: walk 7km normal", () => {
    const result = scoreTrip([{ mode: "walk", distanceKm: 7 }], DEFAULT_RATES);
    expect(result.emissionsKg).toBeCloseTo(0, 5);
    expect(result.creditDelta).toBe(1.75);
  });

  it("6: walk 7km high", () => {
    const result = scoreTrip([{ mode: "walk", distanceKm: 7 }], HIGH_RATES);
    expect(result.emissionsKg).toBeCloseTo(0, 5);
    expect(result.creditDelta).toBe(2.63);
  });

  it("7: bus_london 10km normal", () => {
    const result = scoreTrip([{ mode: "bus_london", distanceKm: 10 }], DEFAULT_RATES);
    expect(result.emissionsKg).toBeCloseTo(0.63600, 5);
    expect(result.creditDelta).toBe(-1.92);
  });

  it("8: bus_london 10km high", () => {
    const result = scoreTrip([{ mode: "bus_london", distanceKm: 10 }], HIGH_RATES);
    expect(result.emissionsKg).toBeCloseTo(0.63600, 5);
    expect(result.creditDelta).toBe(-1.92);
  });

  it("9: rail 10km normal", () => {
    const result = scoreTrip([{ mode: "rail", distanceKm: 10 }], DEFAULT_RATES);
    expect(result.emissionsKg).toBeCloseTo(0.30920, 5);
    expect(result.creditDelta).toBe(-0.93);
  });

  it("10: walk 1 + bus_london 9 normal", () => {
    const result = scoreTrip(
      [{ mode: "walk", distanceKm: 1 }, { mode: "bus_london", distanceKm: 9 }],
      DEFAULT_RATES
    );
    expect(result.emissionsKg).toBeCloseTo(0.57240, 5);
    expect(result.creditDelta).toBe(-1.48);
  });

  it("11: walk 1 + bus_london 9 high", () => {
    const result = scoreTrip(
      [{ mode: "walk", distanceKm: 1 }, { mode: "bus_london", distanceKm: 9 }],
      HIGH_RATES
    );
    expect(result.emissionsKg).toBeCloseTo(0.57240, 5);
    expect(result.creditDelta).toBe(-1.35);
  });

  it("12: cycle 20km normal (cap applies)", () => {
    const result = scoreTrip([{ mode: "cycle", distanceKm: 20 }], DEFAULT_RATES);
    expect(result.emissionsKg).toBeCloseTo(0, 5);
    expect(result.creditDelta).toBe(2.50);
  });

  it("13: cycle 20km high (cap then multiplier)", () => {
    const result = scoreTrip([{ mode: "cycle", distanceKm: 20 }], HIGH_RATES);
    expect(result.emissionsKg).toBeCloseTo(0, 5);
    expect(result.creditDelta).toBe(3.75);
  });
});

describe("scoreTrip - error cases", () => {
  it("throws on empty segment list", () => {
    expect(() => scoreTrip([], DEFAULT_RATES)).toThrow("Segments must be non-empty");
  });

  it("throws on unknown mode", () => {
    expect(() => scoreTrip([{ mode: "unknown" as any, distanceKm: 10 }], DEFAULT_RATES)).toThrow("Unknown mode");
  });

  it("throws on negative distance", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: -1 }], DEFAULT_RATES)).toThrow("distanceKm must be a finite number >= 0");
  });

  it("throws on NaN distance", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: NaN }], DEFAULT_RATES)).toThrow("distanceKm must be a finite number >= 0");
  });

  it("throws on Infinity distance", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: Infinity }], DEFAULT_RATES)).toThrow("distanceKm must be a finite number >= 0");
  });

  it("throws on carMultiplier below 1", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: 10 }], { carMultiplier: 0.5, activeMultiplier: 1 })).toThrow("carMultiplier must be a finite number between 1 and 1.5");
  });

  it("throws on carMultiplier above 1.5", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: 10 }], { carMultiplier: 2, activeMultiplier: 1 })).toThrow("carMultiplier must be a finite number between 1 and 1.5");
  });

  it("throws on activeMultiplier below 1", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: 10 }], { carMultiplier: 1, activeMultiplier: 0.5 })).toThrow("activeMultiplier must be a finite number between 1 and 1.5");
  });

  it("throws on activeMultiplier above 1.5", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: 10 }], { carMultiplier: 1, activeMultiplier: 2 })).toThrow("activeMultiplier must be a finite number between 1 and 1.5");
  });

  it("throws on NaN carMultiplier", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: 10 }], { carMultiplier: NaN, activeMultiplier: 1 })).toThrow("carMultiplier must be a finite number between 1 and 1.5");
  });

  it("throws on Infinity carMultiplier", () => {
    expect(() => scoreTrip([{ mode: "car", distanceKm: 10 }], { carMultiplier: Infinity, activeMultiplier: 1 })).toThrow("carMultiplier must be a finite number between 1 and 1.5");
  });
});

describe("scoreTrip - other cases", () => {
  it("allows zero-distance segment", () => {
    const result = scoreTrip([{ mode: "car", distanceKm: 0 }], DEFAULT_RATES);
    expect(result.emissionsKg).toBe(0);
    expect(result.creditDelta).toBe(0);
  });

  it("scoreRoute on every demo route returns finite creditDelta", () => {
    for (const route of demoRoutes) {
      const result = scoreRoute(route);
      expect(Number.isFinite(result.creditDelta)).toBe(true);
    }
  });

  it("car route scores lower than cycle route on normal day", () => {
    const carRoute = demoRoutes.find((r) => r.id === "car")!;
    const cycleRoute = demoRoutes.find((r) => r.id === "cycle")!;
    const carResult = scoreRoute(carRoute);
    const cycleResult = scoreRoute(cycleRoute);
    expect(carResult.creditDelta).toBeLessThan(cycleResult.creditDelta);
  });

  it("duration fields do not change the score", () => {
    const baseRoute = demoRoutes[1]; // bus route
    const result1 = scoreRoute(baseRoute);

    // Create a copy with different duration fields
    const modifiedRoute: typeof baseRoute = {
      ...baseRoute,
      durationMin: 100,
      durationMinLow: 50,
      durationMinHigh: 200,
    };
    const result2 = scoreRoute(modifiedRoute);

    expect(result1.creditDelta).toBe(result2.creditDelta);
    expect(result1.emissionsKg).toBe(result2.emissionsKg);
    expect(result1.emissionsCharge).toBe(result2.emissionsCharge);
    expect(result1.activeBonus).toBe(result2.activeBonus);
  });
});