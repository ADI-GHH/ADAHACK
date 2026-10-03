import React from 'react';
import { demoRoutes } from '../engine/fixtures';
import { scoreTrip } from '../engine/index';
import { createRequestGuard, fetchGoogleRoutes, ROUTING_MODES } from './routeService';

const fixtures = demoRoutes.map(route => ({ ...route, source: 'demo', scorable: true,
  distanceKm: route.segments.reduce((sum, segment) => sum + segment.distanceKm, 0), geometry: [] }));

export function scoreRoutes(routes, rates) {
  return routes.map(route => ({ route, result: route.scorable ? scoreTrip(route.segments, rates) : null }));
}

export function useRoutePlanner(rates) {
  const [mode, setMode] = React.useState('demo');
  const [byMode, setByMode] = React.useState({});
  const [selectedId, selectRoute] = React.useState(null);
  const [error, setError] = React.useState('');
  const guard = React.useRef(null);
  if (!guard.current) guard.current = createRequestGuard();
  React.useEffect(() => () => { guard.current.next(); }, []);
  const invalidate = React.useCallback(() => {
    guard.current.next();
    setByMode({});
    selectRoute(null);
    setError('');
  }, []);
  const changeMode = React.useCallback(value => { invalidate(); setMode(value); }, [invalidate]);
  const findRoutes = React.useCallback(async context => {
    const id = guard.current.next();
    selectRoute(null);
    setError('');
    setByMode(Object.fromEntries(ROUTING_MODES.map(m => [m, { status: 'loading', routes: [] }])));
    try {
      const { Route, TravelMode } = await window.google.maps.importLibrary('routes');
      if (!guard.current.isCurrent(id)) return;
      if (typeof Route?.computeRoutes !== 'function') {
        throw new Error('Routes library unavailable');
      }
      await fetchGoogleRoutes(Route, { ...context, requestId: id }, (travelMode, result) => {
        if (!guard.current.isCurrent(id)) return;
        setByMode(previous => ({ ...previous, [travelMode]: result }));
        if (result.routes.length) selectRoute(previous => previous || result.routes[0].id);
      }, TravelMode);
    } catch (error) {
      console.error("Google Maps API Error:", error);
      if (!guard.current.isCurrent(id)) return;
      const message = 'Current Google Maps Routes library unavailable. Check weekly SDK support, Maps JavaScript API, Routes API, billing and referrer restrictions. Use demo routes while resolving setup.';
      setError(message);
      setByMode(Object.fromEntries(ROUTING_MODES.map(m => [m, { status: 'error', routes: [], message }])));
    }
  }, []);
  const routes = React.useMemo(() => mode === 'demo' ? fixtures : ROUTING_MODES.flatMap(m => byMode[m]?.routes || []), [mode, byMode]);
  const scoredRoutes = React.useMemo(() => scoreRoutes(routes, rates), [routes, rates]);
  return { mode, changeMode, routes, scoredRoutes, byMode, selectedId, selectRoute, invalidate, findRoutes, error };
}
