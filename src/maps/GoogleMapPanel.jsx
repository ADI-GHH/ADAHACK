import React from 'react';
import { APIProvider, Map, Marker, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { LONDON_CENTER, MAPS_API_KEY, OFFICE_POSITION } from './config';

export function GoogleMapsProvider({ children, onError, apiKey = MAPS_API_KEY }) {
  return <APIProvider apiKey={apiKey} version="weekly" region="GB" language="en-GB"
    onError={() => onError('Google Maps could not load. Check your connection and API setup in README.')}>{children}</APIProvider>;
}

export function OriginSearch({ onOriginChange, onError, disabled }) {
  const loaded = useApiIsLoaded();
  const host = React.useRef(null);
  React.useEffect(() => {
    if (!loaded) return;
    let active = true;
    let element;
    let revision = 0;
    const invalidate = () => { revision += 1; onOriginChange(null); };
    const select = async ({ placePrediction }) => {
      const current = ++revision;
      onOriginChange(null);
      try {
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
        if (!active || current !== revision) return;
        if (!place.location) throw new Error('Missing location');
        onOriginChange({ location: place.location.toJSON(), label: place.formattedAddress || place.displayName });
      } catch {
        if (active && current === revision) onError('Could not resolve this place. Check Places API (New), billing and referrer restrictions.');
      }
    };
    const error = () => onError('Place search failed. Check Places API (New), billing, quota and referrer restrictions.');
    window.google.maps.importLibrary('places').then(({ PlaceAutocompleteElement }) => {
      if (!active) return;
      element = new PlaceAutocompleteElement({
        includedRegionCodes: ['gb'], locationBias: { center: LONDON_CENTER, radius: 50000 },
      });
      element.setAttribute('aria-label', 'Home or starting address');
      element.placeholder = 'Search your home or starting address';
      element.addEventListener('gmp-select', select);
      element.addEventListener('gmp-error', error);
      element.addEventListener('input', invalidate);
      host.current.append(element);
    }).catch(() => { if (active) error(); });
    return () => {
      active = false;
      element?.removeEventListener('gmp-select', select);
      element?.removeEventListener('gmp-error', error);
      element?.removeEventListener('input', invalidate);
      element?.remove();
    };
  }, [loaded, onOriginChange, onError]);
  return <div><p className="text-sm font-medium mb-2" id="origin-label">Home or starting address</p>
    <div ref={host} aria-labelledby="origin-label" className="origin-search min-w-0" inert={disabled ? true : undefined} />
    {!loaded && <p className="text-sm text-gray-500">Loading address search…</p>}</div>;
}

function AuthWatch({ onError }) {
  React.useEffect(() => {
    const previous = window.gm_authFailure;
    const handler = () => { onError('Google Maps permission denied. Check the browser key, enabled APIs, billing and HTTP referrer restrictions.'); previous?.(); };
    window.gm_authFailure = handler;
    return () => { if (window.gm_authFailure === handler) window.gm_authFailure = previous; };
  }, [onError]);
  return null;
}

export function LiveMap({ onError, children }) {
  return <div className="live-map" role="region" aria-label="Commute route map">
    <AuthWatch onError={onError} />
    <div className="live-map-viewport">
      <Map defaultCenter={LONDON_CENTER} defaultZoom={11} gestureHandling="cooperative" mapTypeControl={false} streetViewControl={false}>
        <Marker position={OFFICE_POSITION} title="Office: 2½ Devonshire Square, London EC2M 4UJ"
          icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png" />
        {children}
      </Map>
    </div>
    <p className="live-map-helper">Select “View route” to highlight a path. Planning does not verify travel.</p>
  </div>;
}

export function RoutePaths({ routes, selectedId, onSelect, active = true }) {
  const map = useMap();
  React.useEffect(() => {
    if (!map) return;
    const { Polyline, LatLngBounds } = window.google.maps;
    const paths = routes.filter(r => r.geometry.length > 1).map(route => {
      const selected = route.id === selectedId;
      const path = new Polyline({ map, path: route.geometry, strokeColor: selected ? '#15803d' : '#64748b',
        strokeOpacity: selected ? 1 : 0.4, strokeWeight: selected ? 6 : 3, zIndex: selected ? 10 : 1 });
      const listener = path.addListener('click', () => onSelect(route.id));
      return { path, listener };
    });
    const selected = routes.find(r => r.id === selectedId);
    if (selected?.geometry.length > 1) {
      const bounds = new LatLngBounds();
      selected.geometry.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 48);
    }
    return () => paths.forEach(({ path, listener }) => { listener.remove(); path.setMap(null); });
  }, [map, routes, selectedId, onSelect, active]);
  return null;
}
