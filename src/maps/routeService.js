import { normalizeGoogleRoute } from './routeAdapter';

export const ROUTING_MODES = ['DRIVING', 'TRANSIT', 'BICYCLING', 'WALKING'];
const MODE_ENUM_KEYS = {
  DRIVING: ['DRIVE', 'DRIVING'], TRANSIT: ['TRANSIT'],
  BICYCLING: ['BICYCLE', 'BICYCLING'], WALKING: ['WALK', 'WALKING'],
};
// The JS SDK accepts Route-level field names. Request full legs to receive steps
// and transit details; nested legs.* masks fail SDK validation. REST routes.*
// masks and duration are not the JavaScript durationMillis/legs contract.
export const ROUTE_FIELDS = ['distanceMeters', 'durationMillis', 'path', 'legs'];

export function providerErrorMessage(error) {
  // Never echo raw provider messages: they may contain request URLs or credentials.
  const code = String(error?.code || '').toUpperCase();
  if (/RESOURCE_EXHAUSTED|OVER_QUERY_LIMIT|429/.test(code)) return 'Google Maps quota exceeded. Check usage and quota in Google Cloud, or use demo routes.';
  if (/PERMISSION|DENIED|AUTH|403/.test(code)) return 'Google Maps permission denied. Check enabled APIs, billing and browser-key referrer/API restrictions.';
  if (/INVALID|400/.test(code)) return 'Google Maps rejected this request. Check endpoints, departure time and API configuration.';
  return 'Google Maps routing failed. Check connection, enabled APIs, billing, quota and referrer restrictions, or use demo routes.';
}

export async function fetchGoogleRoutes(Route, context, onModeResult, TravelMode = {}) {
  if (typeof Route?.computeRoutes !== 'function') throw new Error('Routes library unavailable');
  return Promise.allSettled(ROUTING_MODES.map(async travelMode => {
    let result;
    try {
      // Use modern names if the loaded SDK exposes them; otherwise use its
      // documented JS names. Never force REST-only strings into the JS SDK.
      const sdkMode = MODE_ENUM_KEYS[travelMode].map(key => TravelMode[key]).find(Boolean) || travelMode;
      // "Now" must be evaluated at the provider request, not before SDK loading.
      // Past departures are only accepted for transit, so omit them for Now.
      const useProviderNow = context.departureMode === 'now';
      const routeContext = useProviderNow ? { ...context, departureTime: new Date().toISOString() } : context;
      const response = await Route.computeRoutes({
        origin: context.origin, destination: context.destination,
        travelMode: sdkMode,
        ...(!useProviderNow ? { departureTime: new Date(context.departureTime) } : {}),
        ...(travelMode === 'DRIVING' ? { routingPreference: 'TRAFFIC_AWARE' } : {}),
        ...(travelMode === 'TRANSIT' ? { computeAlternativeRoutes: true } : {}),
        fields: ROUTE_FIELDS, language: 'en-GB', region: 'uk',
      });
      const routes = (response.routes || []).map((raw, index) => normalizeGoogleRoute(raw, travelMode, routeContext, index));
      result = { status: !routes.length ? 'no-service' : routes.every(r => !r.scorable) ? 'unscorable' : 'success', routes };
    } catch (error) {
      console.error("Google Maps API Error:", error);
      result = { status: 'error', routes: [], message: providerErrorMessage(error) };
    }
    onModeResult(travelMode, result);
    return result;
  }));
}

// Invalidate synchronously from input events, including while libraries are still loading.
export function createRequestGuard() {
  let current = 0;
  return { next: () => ++current, isCurrent: id => id === current };
}
