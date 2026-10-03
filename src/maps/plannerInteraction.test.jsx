// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { resetMockCompanyDb } from '../data';

vi.mock('./config', () => ({ MAPS_API_KEY: 'test-key', OFFICE_ADDRESS: '20 Fenchurch Street, London EC3M 3BY' }));
vi.mock('./GoogleMapPanel', () => ({
  GoogleMapsProvider: ({ children }) => <>{children}</>,
  OriginSearch: ({ onOriginChange }) => <button onClick={() => onOriginChange({ label: 'Chosen home', location: { lat: 51.51, lng: -0.1 } })}>Select home</button>,
  LiveMap: ({ children }) => <div>{children}</div>,
  RoutePaths: ({ routes, selectedId }) => <output data-path={selectedId || ''}>{routes.find(r => r.id === selectedId)?.label || 'No path selected'}</output>,
}));

let host, root, computeRoutes;
const buttons = text => [...host.querySelectorAll('button')].filter(b => b.textContent.includes(text));
const click = async element => { await act(async () => element.click()); };
const changeShare = async share => {
  await click(host.querySelector('#nav-company'));
  await click(buttons(`${share}% car`)[0]);
  await click(host.querySelector('#nav-commute'));
};
const balance = () => host.querySelector('.tabular-nums').textContent;
const card = label => host.querySelector(`article[aria-label="${label} route"]`);
const routeData = (metres = 10000) => ({ distanceMeters: metres, durationMillis: 900000, path: [{ lat: 51.51, lng: -0.1 }, { lat: 51.52, lng: -0.11 }] });
async function find() {
  await click(buttons('Live')[0]);
  await click(buttons('Select home')[0]);
  await click(buttons('Find routes')[0]);
}

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-03T08:00:00Z'));
  resetMockCompanyDb();
  host = document.createElement('div'); document.body.append(host);
  computeRoutes = vi.fn(async request => request.travelMode === 'TRANSIT' ? { routes: [] } : { routes: [routeData()] });
  window.google = { maps: { importLibrary: vi.fn(async () => ({ Route: { computeRoutes } })) } };
  root = createRoot(host);
  await act(async () => root.render(<React.StrictMode><App /></React.StrictMode>));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); delete window.google; });

describe('planner UI and protected finance integration', () => {
  it('preserves resolved live routes, selection and click-time rates across the new screen navigation', async () => {
    await find();
    await click(card('Cycle').querySelector('button'));
    const selected = host.querySelector('output').dataset.path;
    await click(host.querySelector('#nav-leaderboard'));
    expect(host.querySelector('#screen-commute').hidden).toBe(true);
    await changeShare(65);
    expect(host.querySelector('#screen-commute').hidden).toBe(false);
    expect(host.querySelector('output').dataset.path).toBe(selected);
    expect(card('Car').textContent).toContain('-6.25 credits');
    expect(computeRoutes).toHaveBeenCalledTimes(4);
    await click([...card('Car').querySelectorAll('button')].find(b => b.textContent.includes('Simulate')));
    await changeShare(85);
    await click(host.querySelector('#nav-activity'));
    await act(async () => vi.advanceTimersByTime(300));
    expect(balance()).toBe('93.75');
    expect(host.querySelector('[aria-label="Activity ledger"]').textContent).toContain('Adjusted (1.25x)');
    expect(computeRoutes).toHaveBeenCalledTimes(4);
  });
  it('sorts cards and summary in both directions without fetching, completing, or changing selection', async () => {
    await find();
    const sort = host.querySelector('select:has(option[value="credits-asc"])');
    const names = () => [...host.querySelectorAll('article h3')].map(h => h.textContent);
    expect(names()).toEqual(['Cycle', 'Walk', 'Car']);
    const selected = host.querySelector('output').dataset.path;
    await act(async () => { sort.value = 'credits-asc'; sort.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(names()).toEqual(['Car', 'Cycle', 'Walk']);
    expect(host.querySelector('tbody tr td').textContent).toContain('Car');
    expect(host.querySelector('output').dataset.path).toBe(selected);
    expect(balance()).toBe('100.00');
    expect(computeRoutes).toHaveBeenCalledTimes(4);
    await changeShare(85);
    expect(names()[0]).toBe('Car');
    expect(card('Car').textContent).toContain('-7.50 credits');
    expect(computeRoutes).toHaveBeenCalledTimes(4);
    await act(async () => { sort.value = 'credits-desc'; sort.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(names()).toEqual(['Cycle', 'Walk', 'Car']);
  });
  it('selects a map path without completing a trip and rescores locally', async () => {
    await find();
    expect(computeRoutes).toHaveBeenCalledTimes(4);
    const before = balance();
    const oldPath = host.querySelector('output').dataset.path;
    await click(card('Cycle').querySelector('button'));
    expect(host.querySelector('output').dataset.path).not.toBe(oldPath);
    expect(balance()).toBe(before);
    expect(host.textContent).toContain('No trips recorded yet');
    await changeShare(85);
    expect(card('Car').textContent).toContain('-7.50 credits');
    expect(card('Cycle').textContent).toContain('+3.75 credits');
    expect(host.querySelector('tbody').textContent).toContain('-7.50');
    expect(computeRoutes).toHaveBeenCalledTimes(4);
  });
  it('simulates displayed current score once per flight and preserves receipts and balance through changes', async () => {
    await find();
    await changeShare(85);
    const simulate = [...card('Car').querySelectorAll('button')].find(b => b.textContent.includes('Simulate'));
    await act(async () => { simulate.click(); simulate.click(); });
    await changeShare(40);
    await click(buttons('Use demo routes')[0]);
    await act(async () => vi.advanceTimersByTime(300));
    expect(balance()).toBe('92.50');
    expect(host.textContent).toContain('1 trip completed');
    expect(host.textContent).toContain('Car · Live route · simulated');
    expect(host.textContent).toContain('High (1.5x)');
    await click([...card('Cycle').querySelectorAll('button')].find(b => b.textContent.includes('Simulate')));
    await act(async () => vi.advanceTimersByTime(300));
    expect(balance()).toBe('94.50');
    expect(host.textContent).toContain('2 trips completed');
  });
  it('keeps successful modes through quota failures and returns to a working demo', async () => {
    computeRoutes.mockImplementation(async request => {
      if (request.travelMode === 'BICYCLING') throw { code: 'RESOURCE_EXHAUSTED', message: 'private credential' };
      return request.travelMode === 'TRANSIT' ? { routes: [] } : { routes: [routeData()] };
    });
    await find();
    expect(card('Car')).not.toBeNull();
    expect(card('Walk')).not.toBeNull();
    expect(card('Cycle')).toBeNull();
    expect(host.textContent).toContain('quota exceeded');
    expect(host.textContent).not.toContain('private credential');
    await click(buttons('Use demo routes')[0]);
    expect(host.querySelectorAll('article')).toHaveLength(5);
    expect(balance()).toBe('100.00');
  });
  it('ignores older responses after a new request and reverses endpoints', async () => {
    let release;
    const old = new Promise(resolve => { release = resolve; });
    computeRoutes.mockImplementation(() => old);
    await find();
    await act(async () => {
      const direction = host.querySelector('select');
      direction.value = 'to-home'; direction.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(host.querySelector('output').dataset.path).toBe('');
    computeRoutes.mockImplementation(async request => request.travelMode === 'TRANSIT' ? { routes: [] } : { routes: [routeData(2000)] });
    await click(buttons('Find routes')[0]);
    expect(computeRoutes.mock.calls.at(-1)[0].origin).toBe('20 Fenchurch Street, London EC3M 3BY');
    expect(computeRoutes.mock.calls.at(-1)[0].destination).toEqual({ lat: 51.51, lng: -0.1 });
    expect(card('Car').textContent).toContain('2.00 km');
    await act(async () => release({ routes: [routeData(99000)] }));
    expect(card('Car').textContent).toContain('2.00 km');
    expect(card('Car').textContent).not.toContain('99.00 km');
  });
  it('displays unscorable journeys without a reward button', async () => {
    computeRoutes.mockImplementation(async request => ({ routes: [request.travelMode === 'DRIVING' ? { ...routeData(), distanceMeters: undefined } : routeData()] }));
    await find();
    expect(card('Car').textContent).toContain('Emissions estimate and credits unavailable');
    expect([...host.querySelectorAll('article h3')].map(h => h.textContent)).toEqual(['Cycle', 'Walk', 'Car', 'Transit']);
    expect([...card('Car').querySelectorAll('button')].find(b => b.textContent.includes('Simulation')).disabled).toBe(true);
  });
  it('reports unavailable Routes SDK without replacing live cards with fixtures', async () => {
    window.google.maps.importLibrary.mockResolvedValue({});
    await find();
    expect(host.textContent).toContain('Routes library unavailable');
    expect(host.querySelectorAll('article')).toHaveLength(0);
    await click(buttons('Use demo routes')[0]);
    expect(host.querySelectorAll('article')).toHaveLength(5);
  });
});
