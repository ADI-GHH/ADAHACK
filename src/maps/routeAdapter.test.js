import { describe, expect, it } from 'vitest';
import { normalizeGoogleRoute } from './routeAdapter';
import { scoreTrip } from '../engine/index';

const context = { departureTime: '2026-10-03T08:00:00.000Z', direction: 'to-office' };
const point = (lat = 51.51, lng = -0.1) => ({ lat, lng });
const walk = metres => ({ travelMode: 'WALKING', distanceMeters: metres });
const ride = (vehicleType, metres, extras = {}) => ({ travelMode: 'TRANSIT', distanceMeters: metres,
  path: [point(), point(51.52)], transitDetails: {
    departureStop: { location: point() }, arrivalStop: { location: point(51.52) },
    transitLine: { shortName: '15', vehicle: { vehicleType }, agencies: [{ name: 'Transport for London', url: new URL('https://tfl.gov.uk/') }] }, ...extras,
  } });
const transit = steps => ({ distanceMeters: 10000, durationMillis: 3600000, path: [point(), point(51.52)],
  legs: [{ distanceMeters: 10000, steps }] });
const adapt = (route, mode = 'TRANSIT') => normalizeGoogleRoute(route, mode, context, 0);

describe('current Google Maps JavaScript Route adapter', () => {
  it.each([['DRIVING', 'car'], ['WALKING', 'walk'], ['BICYCLING', 'cycle']])('converts %s total once', (provider, engine) => {
    const route = adapt({ distanceMeters: 10000, durationMillis: 900000,
      legs: [{ distanceMeters: 10000, steps: [{ travelMode: provider, distanceMeters: 10000 }] }] }, provider);
    expect(route.segments).toEqual([{ mode: engine, distanceKm: 10 }]);
    expect(route.distanceKm).toBe(10);
    expect(route.durationMin).toBe(15);
    expect(route.arrivalTime).toBe('2026-10-03T08:15:00.000Z');
  });
  it('retains walking access and egress and full elapsed duration', () => {
    const route = adapt(transit([walk(600), ride('BUS', 9000), walk(400)]));
    expect(route.segments).toEqual([{ mode: 'walk', distanceKm: 0.6 }, { mode: 'bus_london', distanceKm: 9 }, { mode: 'walk', distanceKm: 0.4 }]);
    expect(route.durationMin).toBe(60);
    expect(scoreTrip(route.segments).creditDelta).toBe(-1.48);
  });
  it('maps heavy rail, commuter rail and subway, aggregating adjacent modes', () => {
    const route = adapt(transit([walk(500), ride('HEAVY_RAIL', 3000), ride('COMMUTER_TRAIN', 4000), ride('SUBWAY', 2000), walk(500)]));
    expect(route.segments.map(s => s.mode)).toEqual(['walk', 'rail', 'subway', 'walk']);
    expect(route.segments[1].distanceKm).toBe(7);
    expect(route.transfers).toBe(2);
    expect(route.transport).toHaveLength(5);
  });
  it.each(['FERRY', 'TRAM', 'LIGHT_RAIL', 'RAIL', 'OTHER', undefined])('rejects unsupported vehicle %s without scoring walking alone', vehicle => {
    const route = adapt(transit([walk(1000), ride(vehicle, 9000)]));
    expect(route.scorable).toBe(false);
    expect(route.segments).toBeNull();
    expect(route.distanceKm).toBe(10);
    expect(route.geometry).toHaveLength(2);
  });
  it.each([undefined, null, -1, NaN, Infinity, '9000'])('rejects invalid step distance %s', metres => {
    expect(adapt(transit([walk(1000), ride('SUBWAY', metres)])).scorable).toBe(false);
  });
  it.each([undefined, null, -1, NaN, Infinity, '10000'])('rejects invalid total distance %s', metres => {
    expect(adapt({ distanceMeters: metres, durationMillis: 10 }, 'DRIVING').scorable).toBe(false);
  });
  it('can use validated leg totals only when route total is absent', () => {
    expect(adapt({ durationMillis: 10, legs: [{ distanceMeters: 1500 }, { distanceMeters: 500 }] }, 'WALKING').segments).toEqual([{ mode: 'walk', distanceKm: 2 }]);
    expect(adapt({ durationMillis: 10, legs: [{ distanceMeters: 1500 }, {}] }, 'WALKING').scorable).toBe(false);
  });
  it('accepts explicit zero and rejects missing data', () => {
    expect(adapt({ distanceMeters: 0, durationMillis: 0 }, 'WALKING').scorable).toBe(true);
    expect(adapt(transit([])).scorable).toBe(false);
    expect(adapt({ distanceMeters: 1000 }, 'DRIVING').scorable).toBe(false);
  });
  it('allows only rounding-sized gaps and never fabricates missing distance', () => {
    expect(adapt(transit([walk(1000), ride('SUBWAY', 8999)])).scorable).toBe(true);
    expect(adapt(transit([walk(1000), ride('SUBWAY', 8500)])).scorable).toBe(false);
  });
  it('rejects a mixed portion in a supposedly direct route', () => {
    expect(adapt(transit([walk(1000), ride('FERRY', 9000)]), 'WALKING').scorable).toBe(false);
  });
  it('does not infer London bus eligibility from the destination', () => {
    const bus = ride('BUS', 9000);
    bus.transitDetails.transitLine.agencies = [{ name: 'National Express' }];
    expect(adapt(transit([walk(1000), bus])).scorable).toBe(false);
    bus.transitDetails.transitLine.agencies = [{ name: 'Transport for London' }];
    bus.path = [point(), point(52)];
    expect(adapt(transit([walk(1000), bus])).scorable).toBe(false);
    delete bus.path;
    expect(adapt(transit([walk(1000), bus])).scorable).toBe(false);
  });
  it('handles SDK coordinate objects and does not mutate its input', () => {
    const raw = transit([walk(1000), ride('SUBWAY', 9000)]);
    raw.path = [{ lat: () => 51.5, lng: () => -0.1 }, { lat: 51.51, lng: -0.11 }];
    const route = adapt(raw);
    route.geometry[0].lat = 0;
    route.segments[0].distanceKm = 99;
    expect(raw.path[0].lat()).toBe(51.5);
    expect(raw.legs[0].steps[0].distanceMeters).toBe(1000);
  });
});
