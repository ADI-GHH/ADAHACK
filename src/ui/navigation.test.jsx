// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '../App';
import { resetMockCompanyDb } from '../data';

vi.mock('../maps/config', () => ({ MAPS_API_KEY: '', OFFICE_ADDRESS: 'Demo office' }));
let host, root;
const nav = id => host.querySelector(`#nav-${id}`);
const go = async id => { await act(async () => nav(id).click()); };
const button = (scope, text) => [...scope.querySelectorAll('button')].find(item => item.textContent.trim().includes(text));
const balance = () => host.querySelector('#screen-commute .credit-value .tabular-nums').textContent;

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  resetMockCompanyDb();
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<React.StrictMode><App /></React.StrictMode>));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });

it('opens Green Street with personal statistics followed by the map and only one visible screen', async () => {
  expect(host.querySelector('.brand').getAttribute('aria-label')).toBe('Green Street home');
  expect(host.querySelectorAll('.app-screen:not([hidden])')).toHaveLength(1);
  expect(host.querySelector('#screen-commute').hidden).toBe(false);
  const personal = host.querySelector('#screen-commute .personal-overview');
  const map = host.querySelector('[aria-label="Illustrated London demo map"]');
  expect(personal.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(balance()).toBe('100.00');
  for (const id of ['leaderboard', 'company', 'activity', 'commute']) {
    await go(id);
    expect(host.querySelectorAll('.app-screen:not([hidden])')).toHaveLength(1);
    expect(host.querySelector(`#screen-${id}`).hidden).toBe(false);
    expect(nav(id).getAttribute('aria-current')).toBe('page');
    expect(host.querySelectorAll('.bottom-navigation [aria-current="page"]')).toHaveLength(1);
  }
});

it('preserves selection, sorting, and click-time receipts across navigation and company changes', async () => {
  const cycle = host.querySelector('article[aria-label="Cycle route"]');
  await act(async () => button(cycle, 'View route').click());
  const sort = host.querySelector('select:has(option[value="credits-asc"])');
  await act(async () => { sort.value = 'credits-asc'; sort.dispatchEvent(new Event('change', { bubbles: true })); });
  await act(async () => button(cycle, 'Simulate Commute').click());
  await go('company');
  await act(async () => button(host.querySelector('#screen-company'), '85% car').click());
  await go('activity');
  await act(async () => vi.advanceTimersByTime(300));
  expect(balance()).toBe('102.00');
  expect(host.querySelector('[aria-label="Activity ledger"]').textContent).toContain('Normal (1.0x)');
  expect(host.querySelector('[aria-label="Activity ledger"]').textContent).toContain('1 trip completed');
  await go('leaderboard');
  await go('commute');
  expect(balance()).toBe('102.00');
  expect(button(cycle, 'Viewing route').getAttribute('aria-pressed')).toBe('true');
  expect(sort.value).toBe('credits-asc');
  expect(host.querySelector('article[aria-label="Car route"]').textContent).toContain('-7.50');
  expect(cycle.textContent).toContain('+3.00');
});

it('offers a working return to the planner from empty activity and the account button', async () => {
  await act(async () => host.querySelector('[aria-label="View your activity"]').click());
  expect(host.querySelector('#screen-activity').hidden).toBe(false);
  await act(async () => button(host.querySelector('#screen-activity'), 'Plan a commute').click());
  expect(host.querySelector('#screen-commute').hidden).toBe(false);
  expect(nav('commute').getAttribute('aria-current')).toBe('page');
});
