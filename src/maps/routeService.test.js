import { describe, expect, it, vi } from 'vitest';
import { fetchGoogleRoutes, ROUTE_FIELDS, createRequestGuard, providerErrorMessage } from './routeService';
import { scoreRoutes } from './useRoutePlanner';
import { snapshotTrip } from './tripReceipt';
import { londonInputValue, parseLondonDeparture, formatLondonTime } from './time';

const context = { origin: { lat: 51.51, lng: -0.1 }, destination: 'London', departureTime: '2026-10-03T08:00:00Z', direction: 'to-office' };
const raw = { distanceMeters: 10000, durationMillis: 900000 };
describe('route request and scoring integration', () => {
  it.each([
    [{ DRIVE: 'DRIVE', BICYCLE: 'BICYCLE', WALK: 'WALK', TRANSIT: 'TRANSIT' }, ['DRIVE', 'TRANSIT', 'BICYCLE', 'WALK']],
    [{ DRIVING: 'DRIVING', BICYCLING: 'BICYCLING', WALKING: 'WALKING', TRANSIT: 'TRANSIT' }, ['DRIVING', 'TRANSIT', 'BICYCLING', 'WALKING']],
  ])('uses the enums exposed by the loaded SDK and normalizes its direct steps', async (sdkEnums, expected) => {
    const Route = { computeRoutes: vi.fn(async request => ({ routes: [{ ...raw,
      legs: [{ distanceMeters: 10000, steps: [{ travelMode: request.travelMode, distanceMeters: 10000 }] }],
    }] })) };
    const changes = vi.fn();
    await fetchGoogleRoutes(Route, { ...context, departureMode: 'now' }, changes, sdkEnums);
    expect(Route.computeRoutes.mock.calls.map(([request]) => request.travelMode)).toEqual(expected);
    expect(changes.mock.calls.filter(([mode]) => mode !== 'TRANSIT').every(([, result]) => result.status === 'success')).toBe(true);
    expect(changes.mock.calls.find(([mode]) => mode === 'DRIVING')[1].routes[0].segments).toEqual([{ mode: 'car', distanceKm: 10 }]);
  });
  it('lets the provider evaluate Now even when SDK loading made the original timestamp stale', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T08:00:05Z'));
    try {
      const Route = { computeRoutes: vi.fn(async request => {
        if (request.travelMode !== 'TRANSIT' && request.departureTime?.getTime() < Date.now()) throw { code: 'INVALID_ARGUMENT' };
        return request.travelMode === 'TRANSIT' ? { routes: [] } : { routes: [raw] };
      }) };
      const changes = vi.fn();
      await fetchGoogleRoutes(Route, { ...context, departureMode: 'now' }, changes);
      expect(Route.computeRoutes.mock.calls.every(([request]) => !('departureTime' in request))).toBe(true);
      expect(changes.mock.calls.filter(([mode]) => mode !== 'TRANSIT').every(([, result]) => result.status === 'success')).toBe(true);
      const car = changes.mock.calls.find(([mode]) => mode === 'DRIVING')[1].routes[0];
      expect(car.requestContext.departureTime).toBe('2026-10-03T08:00:05.000Z');
      expect(car.arrivalTime).toBe('2026-10-03T08:15:05.000Z');
    } finally { vi.useRealTimers(); }
  });
  it('uses supported JavaScript SDK fields and retains transit steps for scoring', async () => {
    const allowedFields = new Set(['distanceMeters', 'durationMillis', 'path', 'legs']);
    const Route = { computeRoutes: vi.fn(async request => {
      const invalid = request.fields.filter(field => !allowedFields.has(field));
      if (invalid.length) throw new Error(`InvalidValueError: in property fields: ${invalid.join(', ')}`);
      if (request.travelMode !== 'TRANSIT') return { routes: [raw] };
      return { routes: [{ ...raw, legs: [{ distanceMeters: 10000, steps: [
        { travelMode: 'WALKING', distanceMeters: 500 },
        { travelMode: 'TRANSIT', distanceMeters: 9000, transitDetails: {
          transitLine: { shortName: 'Central', vehicle: { vehicleType: 'SUBWAY' } },
        } },
        { travelMode: 'WALKING', distanceMeters: 500 },
      ] }] }] };
    }) };
    const changes = vi.fn();
    await fetchGoogleRoutes(Route, context, changes);
    expect(changes.mock.calls.every(([, result]) => result.status === 'success')).toBe(true);
    const transit = changes.mock.calls.find(([mode]) => mode === 'TRANSIT')[1].routes[0];
    expect(transit.segments).toEqual([
      { mode: 'walk', distanceKm: 0.5 }, { mode: 'subway', distanceKm: 9 }, { mode: 'walk', distanceKm: 0.5 },
    ]);
    expect(transit.transport[1].line).toBe('Central');
    expect(scoreRoutes([transit], { carMultiplier: 1, activeMultiplier: 1 })[0].result.creditDelta).toBeTypeOf('number');
  });
  it('starts all four modes concurrently and preserves successes through partial failure', async () => {
    let finish;
    const transit = new Promise(resolve => { finish = resolve; });
    const Route = { computeRoutes: vi.fn(request => {
      if (request.travelMode === 'TRANSIT') return transit;
      if (request.travelMode === 'BICYCLING') return Promise.reject({ code: 'PERMISSION_DENIED', message: 'secret key' });
      return Promise.resolve({ routes: [raw] });
    }) };
    const changes = vi.fn();
    const pending = fetchGoogleRoutes(Route, context, changes);
    expect(Route.computeRoutes).toHaveBeenCalledTimes(4);
    await Promise.resolve();
    expect(changes).toHaveBeenCalledWith('DRIVING', expect.objectContaining({ status: 'success' }));
    expect(changes).toHaveBeenCalledWith('BICYCLING', expect.objectContaining({ status: 'error' }));
    const request = Route.computeRoutes.mock.calls.find(([r]) => r.travelMode === 'TRANSIT')[0];
    expect(request.computeAlternativeRoutes).toBe(true);
    expect(request.fields).toEqual(ROUTE_FIELDS);
    expect(request.departureTime).toEqual(new Date(context.departureTime));
    finish({ routes: [] });
    await pending;
    expect(changes).toHaveBeenCalledWith('TRANSIT', { status: 'no-service', routes: [] });
    const route = changes.mock.calls.find(([mode]) => mode === 'DRIVING')[1].routes[0];
    const normal = scoreRoutes([route], { carMultiplier: 1, activeMultiplier: 1 })[0].result;
    const high = scoreRoutes([route], { carMultiplier: 1.5, activeMultiplier: 1.5 })[0].result;
    expect(normal.creditDelta).toBe(-5);
    expect(high.creditDelta).toBe(-7.5);
    expect(high.emissionsKg).toBe(normal.emissionsKg);
    expect(Route.computeRoutes).toHaveBeenCalledTimes(4);
  });
  it('invalidates pending requests synchronously', () => {
    const guard = createRequestGuard();
    const old = guard.next();
    const newer = guard.next();
    expect(guard.isCurrent(old)).toBe(false);
    expect(guard.isCurrent(newer)).toBe(true);
    guard.next();
    expect(guard.isCurrent(newer)).toBe(false);
  });
  it('creates immutable aggregate receipts with no provider geometry or context', () => {
    const route = { id: 'one', label: 'Cycle', source: 'google', scorable: true, segments: [{ mode: 'cycle', distanceKm: 8 }], requestContext: context, geometry: ['private'] };
    const rates = { carMultiplier: 1.5, activeMultiplier: 1.5 };
    const receipt = snapshotTrip(route, rates);
    route.segments[0].distanceKm = 10;
    rates.activeMultiplier = 1;
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(receipt.creditDelta).toBe(3);
    expect(receipt.activeMultiplier).toBe(1.5);
    expect(receipt.source).toBe('google');
    expect(receipt.simulated).toBe(true);
    expect(receipt.geometry).toBeUndefined();
    expect(receipt.requestContext).toBeUndefined();
    expect(() => snapshotTrip({ ...route, scorable: false }, rates)).toThrow();
  });
  it('sanitizes quota/permission failures without disclosing provider messages', () => {
    expect(providerErrorMessage({ code: 'RESOURCE_EXHAUSTED', message: 'key=private' })).toContain('quota');
    expect(providerErrorMessage({ code: 'PERMISSION_DENIED', message: 'key=private' })).toContain('permission');
    expect(providerErrorMessage({ message: 'key=private' })).not.toContain('private');
  });
});
describe('London times independently of host time zone', () => {
  it('handles GMT and BST', () => {
    expect(parseLondonDeparture('2026-10-03T09:00').toISOString()).toBe('2026-10-03T08:00:00.000Z');
    expect(parseLondonDeparture('2026-12-03T09:00').toISOString()).toBe('2026-12-03T09:00:00.000Z');
    expect(londonInputValue(new Date('2026-10-03T08:00:00Z'))).toBe('2026-10-03T09:00');
    expect(formatLondonTime('2026-10-03T08:00:00Z')).toContain('09:00');
  });
  it('rejects DST gaps and resolves autumn overlaps to the earlier occurrence', () => {
    expect(() => parseLondonDeparture('2026-03-29T01:30')).toThrow();
    expect(parseLondonDeparture('2026-10-25T01:30').toISOString()).toBe('2026-10-25T00:30:00.000Z');
    expect(() => parseLondonDeparture('bad')).toThrow();
  });
});
