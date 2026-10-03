import { scoreTrip } from '../engine/index';

export function snapshotTrip(route, rates, now = new Date()) {
  if (!route.scorable || !route.segments?.length) throw new Error('This route cannot be simulated.');
  const result = scoreTrip(route.segments, rates);
  // Keep only aggregate scoring values, source and a generic label in the session ledger.
  // No provider addresses, stop/line data, geometry, response or request context in receipts.
  return Object.freeze({
    id: globalThis.crypto.randomUUID(),
    timestamp: now.toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
    routeLabel: `${route.label} · ${route.source === 'google' ? 'Live route' : 'Demo'} · simulated`,
    source: route.source, simulated: true,
    emissionsKg: result.emissionsKg, emissionsCharge: result.emissionsCharge,
    activeBonus: result.activeBonus, creditDelta: result.creditDelta,
    carMultiplier: rates.carMultiplier, activeMultiplier: rates.activeMultiplier,
  });
}
