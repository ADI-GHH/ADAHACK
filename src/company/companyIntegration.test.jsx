// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { getCompanySnapshot, getCompanyStats, getLeaderboardRows, getDepartmentRows,
  bulkSetCommuteShare, updateCommuteRecord, resetMockCompanyDb } from '../data';
import { _getInternalState } from '../data/mockCompanyDb';

vi.mock('../maps/config', () => ({ MAPS_API_KEY: '', OFFICE_ADDRESS: 'Demo office' }));

let host, root;
const button = text => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text);
const click = async element => { await act(async () => element.click()); };
const card = name => host.querySelector(`article[aria-label="${name} route"]`);
const metric = label => [...host.querySelectorAll('#company-summary-heading + p, h3')]
  .find(element => element.textContent === label)?.parentElement;
const leaderboard = () => host.querySelector('section[aria-labelledby="leaderboard-heading"]');
const summary = () => [...host.querySelectorAll('section')].find(section => section.querySelector('h2')?.textContent === 'Quick Summary');
const mix = async share => { await act(async () => bulkSetCommuteShare({ mode: 'car', share })); };

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-03T08:00:00Z'));
  resetMockCompanyDb();
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<React.StrictMode><App /></React.StrictMode>));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove(); vi.useRealTimers();
});

describe('company database dashboard integration', () => {
  it('shows computed mock statistics, 247 active employees, and truthful policy copy', async () => {
    await click(host.querySelector('#nav-company'));
    const stats = getCompanyStats(getCompanySnapshot());
    expect(stats.activeEmployees).toBe(247);
    expect(metric('Active employees').querySelector('p').textContent).toBe('247');
    expect(metric('High-carbon commute share').textContent).toContain(`${stats.highCarbonSharePercent}%`);
    expect(metric('High-carbon commute share').textContent).toContain('Policy limit: 50%');
    expect(metric('Calculated next-day multiplier').textContent).toContain(`${stats.dailyRates.carMultiplier.toFixed(2)}×`);
    expect(metric('Estimated mock commute emissions').textContent).toContain(stats.totalEmissionsKg.toLocaleString('en-GB', { maximumFractionDigits: 2 }));
    expect(host.textContent).toContain('Above 50% high-carbon share, rates start increasing. At 80% or more');
    expect(host.textContent).toContain('Mock company data');
    expect(host.textContent).not.toContain('LIVE');
    expect(host.textContent).not.toContain('car commutes avoided');
  });

  it('writes all demo presets to the database and derives the displayed multiplier', async () => {
    await click(host.querySelector('#nav-company'));
    for (const [percent, multiplier] of [[40, '1.00'], [50, '1.00'], [65, '1.25'], [78, '1.47'], [85, '1.50']]) {
      await click(button(`${percent}% car`));
      const stats = getCompanyStats(getCompanySnapshot());
      expect(stats.highCarbonSharePercent).toBe(percent);
      expect(stats.dailyRates.carMultiplier.toFixed(2)).toBe(multiplier);
      expect(metric('Calculated next-day multiplier').querySelector('p').textContent).toBe(`${multiplier}×`);
      expect(metric('High-carbon commute share').querySelector('p').textContent).toBe(`${percent}%`);
      expect(button(`${percent}% car`).getAttribute('aria-pressed')).toBe('true');
    }
  });

  it('rescores cards and Quick Summary from external DB changes without changing physical emissions or transit charge', async () => {
    const emissions = name => [...card(name).querySelectorAll('p')].find(p => p.textContent.includes('Estimated CO₂e:')).textContent;
    const charge = name => [...card(name).querySelectorAll('p')].find(p => p.textContent.includes('Emissions Charge:')).textContent;
    const originalEmissions = ['Car', 'Cycle', 'Walk', 'Bus (London)', 'Rail'].map(emissions);
    const busCharge = charge('Bus (London)');
    const railCharge = charge('Rail');
    await mix(0.65);
    expect(card('Car').textContent).toContain('-6.25 credits');
    expect(card('Cycle').textContent).toContain('+2.50 credits');
    expect(card('Walk').textContent).toContain('+2.19 credits');
    expect(summary().textContent).toContain('-6.25');
    await mix(0.85);
    expect(card('Car').textContent).toContain('-7.50 credits');
    expect(card('Cycle').textContent).toContain('+3.00 credits');
    expect(summary().textContent).toContain('+3.00');
    expect(['Car', 'Cycle', 'Walk', 'Bus (London)', 'Rail'].map(emissions)).toEqual(originalEmissions);
    expect(charge('Bus (London)')).toBe(busCharge);
    expect(charge('Rail')).toBe(railCharge);
    expect(host.querySelector('.tabular-nums').textContent).toBe('100.00');
    expect(host.textContent).toContain('No trips recorded yet');
  });

  it('ranks generated employees and updates their rows after record mutation', async () => {
    await click(host.querySelector('#nav-leaderboard'));
    const verifyRows = () => {
      const expected = getLeaderboardRows(getCompanySnapshot()).slice(0, 10);
      const rows = [...leaderboard().querySelectorAll('tbody tr')];
      expect(rows).toHaveLength(10);
      rows.forEach((row, index) => {
        const cells = [...row.children].map(cell => cell.textContent);
        const employee = expected[index];
        expect(cells).toEqual([String(employee.rank), employee.name, employee.department,
          employee.monthlyBalance.toFixed(2), `${employee.monthlyCreditDelta > 0 ? '+' : ''}${employee.monthlyCreditDelta.toFixed(2)}`,
          employee.activeKm.toFixed(1), employee.emissionsKg.toFixed(3), String(employee.highCarbonTrips), String(employee.streak)]);
      });
    };
    verifyRows();
    const initial = leaderboard().querySelector('tbody').textContent;
    const snapshot = getCompanySnapshot();
    const leader = getLeaderboardRows(snapshot)[0];
    const commute = snapshot.commuteRecords.find(record => record.employeeId === leader.id);
    await act(async () => updateCommuteRecord(commute.id, { mode: 'car', distanceKm: 1000 }));
    verifyRows();
    expect(leaderboard().querySelector('tbody').textContent).not.toBe(initial);
    await mix(0.85);
    verifyRows();
    const companyMixRows = leaderboard().querySelector('tbody').textContent;
    await mix(0.40);
    verifyRows();
    expect(leaderboard().querySelector('tbody').textContent).not.toBe(companyMixRows);
  });

  it('shows department aggregation and reacts to the same database changes', async () => {
    await click(host.querySelector('#nav-leaderboard'));
    await click(button('Departments'));
    const verify = () => {
      const departments = getDepartmentRows(getCompanySnapshot());
      const rows = [...leaderboard().querySelectorAll('tbody tr')];
      expect(rows).toHaveLength(departments.length);
      expect(rows[0].children[1].textContent).toBe(departments[0].department);
      expect(rows[0].children[3].textContent).toBe(departments[0].avgBalance.toFixed(2));
      expect(departments.reduce((total, department) => total + department.employees, 0)).toBe(247);
    };
    verify();
    const oldRows = leaderboard().querySelector('tbody').textContent;
    await mix(0.85);
    verify();
    expect(leaderboard().querySelector('tbody').textContent).not.toBe(oldRows);
  });

  it('keeps the click-time receipt, balance, selection and ledger through rate changes and company reset', async () => {
    await mix(0.65);
    await click([...card('Car').querySelectorAll('button')].find(b => b.textContent.includes('Simulate Commute')));
    await mix(0.85); // During the in-flight delay: do not change the receipt.
    await act(async () => vi.advanceTimersByTime(300));
    expect(host.querySelector('.tabular-nums').textContent).toBe('93.75');
    expect(host.textContent).toContain('Adjusted (1.25x)');
    const ledger = () => [...host.querySelectorAll('section')].find(section => section.querySelector('h2')?.textContent === 'Activity Ledger');
    const receiptText = ledger().textContent;
    await click(card('Cycle').querySelector('button'));
    await click(button('Reset company demo'));
    expect(card('Cycle').querySelector('button').getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.tabular-nums').textContent).toBe('93.75');
    expect(ledger().textContent).toBe(receiptText);
    expect(card('Car').textContent).toContain('-5.00 credits');
    expect(host.textContent).toContain('1 trip completed');
  });

  it('keeps the no-key fixture demo usable after company changes and unsubscribes on unmount', async () => {
    expect(_getInternalState().listeners).toBe(1); // StrictMode cleans its first subscription.
    await mix(0.85);
    await click(button('Live'));
    expect(host.textContent).toContain('No Maps key configured');
    expect(button('Find routes').disabled).toBe(true);
    expect(document.querySelector('script[src*="maps.googleapis"]')).toBeNull();
    await click(button('Use demo routes'));
    await click([...card('Cycle').querySelectorAll('button')].find(b => b.textContent.includes('Simulate Commute')));
    await act(async () => vi.advanceTimersByTime(300));
    expect(host.querySelector('.tabular-nums').textContent).toBe('103.00');
    expect(host.textContent).toContain('Cycle · Demo · simulated');
    await act(async () => root.unmount());
    expect(_getInternalState().listeners).toBe(0);
  });
});
