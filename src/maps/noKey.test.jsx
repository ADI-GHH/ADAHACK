// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import App from '../App';
vi.mock('./config', () => ({ MAPS_API_KEY: '', OFFICE_ADDRESS: 'Demo office' }));
it('never loads Google without a key and keeps fixture simulation available', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  const button = text => [...host.querySelectorAll('button')].find(b => b.textContent.includes(text));
  try {
    await act(async () => root.render(<App />));
    await act(async () => button('Live').click());
    expect(host.textContent).toContain('No Maps key configured');
    expect(button('Find routes').disabled).toBe(true);
    expect(document.querySelector('script[src*="maps.googleapis"]')).toBeNull();
    await act(async () => button('Use demo routes').click());
    await act(async () => button('Simulate Commute (-5.00').click());
    await act(async () => vi.advanceTimersByTime(300));
    expect(host.querySelector('.tabular-nums').textContent).toBe('95.00');
    expect(host.textContent).toContain('Car · Demo · simulated');
  } finally { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); }
});
