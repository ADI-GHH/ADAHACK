// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OriginSearch, RoutePaths, LiveMap } from './GoogleMapPanel';

const { map } = vi.hoisted(() => ({ map: { fitBounds: vi.fn() } }));
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }) => children, Map: ({ children }) => children,
  Marker: ({ position, title, icon }) => <span data-marker-lat={position.lat} data-marker-lng={position.lng} data-marker-icon={icon}>{title}</span>,
  useApiIsLoaded: () => true, useMap: () => map,
}));
let root, host, polylines;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  polylines = [];
  class Polyline {
    constructor(options) { this.options = options; this.setMap = vi.fn(); this.listener = { remove: vi.fn() }; polylines.push(this); }
    addListener(event, handler) { this.click = handler; return this.listener; }
  }
  class LatLngBounds { constructor() { this.points = []; } extend(point) { this.points.push(point); } }
  window.google = { maps: { Polyline, LatLngBounds } };
  map.fitBounds.mockClear();
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); delete window.google; delete window.gm_authFailure; });

it('fits the selected route, highlights it and removes old paths/listeners on selection and clear', async () => {
  const routes = ['a', 'b'].map(id => ({ id, geometry: [{ lat: 51.5, lng: -0.1 }, { lat: 51.51, lng: -0.11 }] }));
  const select = vi.fn();
  await act(async () => root.render(<RoutePaths routes={routes} selectedId="a" onSelect={select} />));
  expect(polylines[0].options.strokeWeight).toBe(6);
  expect(polylines[1].options.strokeWeight).toBe(3);
  expect(map.fitBounds.mock.calls[0][0].points).toEqual(routes[0].geometry);
  polylines[1].click(); expect(select).toHaveBeenCalledWith('b');
  await act(async () => root.render(<RoutePaths routes={routes} selectedId="b" onSelect={select} />));
  expect(polylines[0].setMap).toHaveBeenCalledWith(null);
  expect(polylines[0].listener.remove).toHaveBeenCalledOnce();
  expect(polylines[3].options.strokeWeight).toBe(6);
  await act(async () => root.render(<RoutePaths routes={[]} selectedId={null} onSelect={select} />));
  expect(polylines[3].setMap).toHaveBeenCalledWith(null);
  expect(polylines[3].listener.remove).toHaveBeenCalledOnce();
});

it('cleans autocomplete elements/listeners and ignores stale place details after editing or unmount', async () => {
  const elements = [];
  class FakeAutocomplete extends HTMLElement {
    constructor(options) { super(); this.options = options; elements.push(this); }
  }
  if (!customElements.get('test-place-autocomplete')) customElements.define('test-place-autocomplete', FakeAutocomplete);
  const ElementClass = customElements.get('test-place-autocomplete');
  window.google.maps.importLibrary = vi.fn(async () => ({ PlaceAutocompleteElement: ElementClass }));
  const onOriginChange = vi.fn(), onError = vi.fn();
  await act(async () => root.render(<React.StrictMode><OriginSearch onOriginChange={onOriginChange} onError={onError} /></React.StrictMode>));
  const element = host.querySelector('test-place-autocomplete');
  expect(host.querySelectorAll('test-place-autocomplete')).toHaveLength(1);
  expect(element.options.includedRegionCodes).toEqual(['gb']);
  let finish;
  const fields = new Promise(resolve => { finish = resolve; });
  const place = { fetchFields: vi.fn(() => fields), location: { toJSON: () => ({ lat: 51.51, lng: -0.1 }) }, formattedAddress: 'Selected home' };
  const event = new Event('gmp-select'); event.placePrediction = { toPlace: () => place };
  await act(async () => element.dispatchEvent(event));
  element.dispatchEvent(new Event('input', { bubbles: true }));
  await act(async () => finish());
  expect(onOriginChange.mock.calls.every(([value]) => value === null)).toBe(true);
  const fresh = new Event('gmp-select'); fresh.placePrediction = { toPlace: () => ({ ...place, fetchFields: vi.fn(async () => {}) }) };
  await act(async () => element.dispatchEvent(fresh));
  expect(onOriginChange).toHaveBeenLastCalledWith({ location: { lat: 51.51, lng: -0.1 }, label: 'Selected home' });
  await act(async () => root.render(null));
  expect(element.isConnected).toBe(false);
  onOriginChange.mockClear();
  element.dispatchEvent(fresh); element.dispatchEvent(new Event('input'));
  expect(onOriginChange).not.toHaveBeenCalled();
});

it('surfaces authentication errors and restores the previous global handler', async () => {
  const previous = vi.fn(), onError = vi.fn();
  window.gm_authFailure = previous;
  await act(async () => root.render(<LiveMap onError={onError} />));
  const marker = host.querySelector('[data-marker-lat]');
  expect(marker.dataset.markerLat).toBe('51.5165');
  expect(marker.dataset.markerLng).toBe('-0.0793');
  expect(marker.dataset.markerIcon).toContain('red-dot');
  expect(marker.textContent).toContain('Devonshire Square');
  window.gm_authFailure();
  expect(onError).toHaveBeenCalledWith(expect.stringContaining('permission denied'));
  expect(previous).toHaveBeenCalledOnce();
  await act(async () => root.render(null));
  expect(window.gm_authFailure).toBe(previous);
});
