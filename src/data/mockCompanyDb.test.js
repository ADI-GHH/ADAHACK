/**
 * Tests for the mock company database layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockCompanyDb,
  subscribeCompanyDb,
  getCompanySnapshot,
  updateCommuteRecord,
  setCommuteMode,
  bulkSetCommuteShare,
  resetMockCompanyDb,
  NUM_EMPLOYEES,
  _getInternalState,
} from './mockCompanyDb.js';
import {
  calculateHighCarbonShare,
  calculateDailyRatesFromShare,
  getCompanyStats,
  getLeaderboardRows,
} from './selectors.js';
import { COMPANY_POLICY } from './companyPolicy.js';
import { scoreTrip } from '../engine/scoring';

describe('Mock Company Database', () => {
  beforeEach(() => {
    resetMockCompanyDb();
  });

  describe('Employee count', () => {
    it('has exactly 247 active employees', () => {
      const snapshot = getCompanySnapshot();
      expect(snapshot.employees.length).toBe(NUM_EMPLOYEES);
      expect(NUM_EMPLOYEES).toBe(247);
      expect(getCompanyStats(snapshot).activeEmployees).toBe(247);
    });

    it('all employees have required fields', () => {
      const snapshot = getCompanySnapshot();
      for (const emp of snapshot.employees) {
        expect(emp).toHaveProperty('id');
        expect(emp).toHaveProperty('name');
        expect(emp).toHaveProperty('department');
        expect(emp).toHaveProperty('monthlyBalance');
        expect(emp).toHaveProperty('monthlyCreditDelta');
        expect(emp).toHaveProperty('tripsCompleted');
        expect(emp).toHaveProperty('activeKm');
        expect(emp).toHaveProperty('emissionsKg');
        expect(emp).toHaveProperty('highCarbonTrips');
        expect(emp).toHaveProperty('streak');
        expect(typeof emp.id).toBe('string');
        expect(emp.id).toMatch(/^emp-\d{4}$/);
      }
    });

    it('employees have unique IDs', () => {
      const snapshot = getCompanySnapshot();
      const ids = snapshot.employees.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Deterministic reset', () => {
    it('produces identical data after reset', () => {
      const snapshot1 = getCompanySnapshot();
      resetMockCompanyDb();
      const snapshot2 = getCompanySnapshot();

      expect(snapshot1.employees.length).toBe(snapshot2.employees.length);
      for (let i = 0; i < snapshot1.employees.length; i++) {
        expect(snapshot1.employees[i].id).toBe(snapshot2.employees[i].id);
        expect(snapshot1.employees[i].name).toBe(snapshot2.employees[i].name);
        expect(snapshot1.employees[i].monthlyBalance).toBe(snapshot2.employees[i].monthlyBalance);
      }
    });

    it('commute records are deterministic after reset', () => {
      const snapshot1 = getCompanySnapshot();
      resetMockCompanyDb();
      const snapshot2 = getCompanySnapshot();

      expect(snapshot1.commuteRecords.length).toBe(snapshot2.commuteRecords.length);
      for (let i = 0; i < snapshot1.commuteRecords.length; i++) {
        expect(snapshot1.commuteRecords[i].id).toBe(snapshot2.commuteRecords[i].id);
        expect(snapshot1.commuteRecords[i].employeeId).toBe(snapshot2.commuteRecords[i].employeeId);
        expect(snapshot1.commuteRecords[i].mode).toBe(snapshot2.commuteRecords[i].mode);
      }
    });
  });

  describe('High-carbon share calculation', () => {
    it('calculates share correctly from commute records', () => {
      const snapshot = getCompanySnapshot();
      const share = calculateHighCarbonShare(snapshot.commuteRecords);
      expect(share).toBeGreaterThanOrEqual(0);
      expect(share).toBeLessThanOrEqual(1);
    });

    it('returns 0 for empty records', () => {
      const share = calculateHighCarbonShare([]);
      expect(share).toBe(0);
    });

    it('only counts completed records', () => {
      const records = [
        { mode: 'car', completed: true },
        { mode: 'car', completed: true },
        { mode: 'walk', completed: true },
        { mode: 'car', completed: false },
      ];
      const share = calculateHighCarbonShare(records);
      expect(share).toBe(2 / 3);
    });
  });

  describe('Daily rates from share', () => {
    it('50% share gives 1.00x multiplier', () => {
      const rates = calculateDailyRatesFromShare(0.50);
      expect(rates.carMultiplier).toBe(1.00);
      expect(rates.activeMultiplier).toBe(1.00);
    });

    it('share below 50% gives 1.00x multiplier', () => {
      const rates = calculateDailyRatesFromShare(0.30);
      expect(rates.carMultiplier).toBe(1.00);
      expect(rates.activeMultiplier).toBe(1.00);

      const rates2 = calculateDailyRatesFromShare(0.49);
      expect(rates2.carMultiplier).toBe(1.00);
    });

    it('80% share gives 1.50x multiplier', () => {
      const rates = calculateDailyRatesFromShare(0.80);
      expect(rates.carMultiplier).toBe(1.50);
      expect(rates.activeMultiplier).toBe(1.50);
    });

    it('share above 80% gives 1.50x multiplier', () => {
      const rates = calculateDailyRatesFromShare(0.90);
      expect(rates.carMultiplier).toBe(1.50);
      expect(rates.activeMultiplier).toBe(1.50);

      const rates2 = calculateDailyRatesFromShare(1.0);
      expect(rates2.carMultiplier).toBe(1.50);
    });

    it('65% share gives about 1.25x multiplier', () => {
      const rates = calculateDailyRatesFromShare(0.65);
      // pressure = (0.65 - 0.50) / 0.30 = 0.5
      // multiplier = 1 + 0.5 * 0.5 = 1.25
      expect(rates.carMultiplier).toBe(1.25);
      expect(rates.activeMultiplier).toBe(1.25);
    });

    it('70% share gives about 1.33x multiplier', () => {
      const rates = calculateDailyRatesFromShare(0.70);
      // pressure = (0.70 - 0.50) / 0.30 = 0.666...
      // multiplier = 1 + 0.5 * 0.666... = 1.333... -> 1.33
      expect(rates.carMultiplier).toBe(1.33);
      expect(rates.activeMultiplier).toBe(1.33);
    });

    it('75% share gives about 1.42x multiplier', () => {
      const rates = calculateDailyRatesFromShare(0.75);
      // pressure = (0.75 - 0.50) / 0.30 = 0.833...
      // multiplier = 1 + 0.5 * 0.833... = 1.416... -> 1.42
      expect(rates.carMultiplier).toBe(1.42);
      expect(rates.activeMultiplier).toBe(1.42);
    });
  });

  describe('Company stats', () => {
    it('returns all expected fields', () => {
      const snapshot = getCompanySnapshot();
      const stats = getCompanyStats(snapshot);

      expect(stats).toHaveProperty('totalEmployees');
      expect(stats).toHaveProperty('activeEmployees');
      expect(stats).toHaveProperty('totalBalance');
      expect(stats).toHaveProperty('avgBalance');
      expect(stats).toHaveProperty('totalTrips');
      expect(stats).toHaveProperty('totalActiveKm');
      expect(stats).toHaveProperty('totalEmissionsKg');
      expect(stats).toHaveProperty('totalHighCarbonTrips');
      expect(stats).toHaveProperty('highCarbonShare');
      expect(stats).toHaveProperty('highCarbonSharePercent');
      expect(stats).toHaveProperty('dailyRates');
    });

    it('totalEmployees equals 247', () => {
      const snapshot = getCompanySnapshot();
      const stats = getCompanyStats(snapshot);
      expect(stats.totalEmployees).toBe(247);
    });

    it('dailyRates matches calculated rates from share', () => {
      const snapshot = getCompanySnapshot();
      const stats = getCompanyStats(snapshot);
      const expectedRates = calculateDailyRatesFromShare(stats.highCarbonShare);
      expect(stats.dailyRates.carMultiplier).toBe(expectedRates.carMultiplier);
      expect(stats.dailyRates.activeMultiplier).toBe(expectedRates.activeMultiplier);
    });
  });

  describe('Leaderboard ordering', () => {
    it('orders by monthly balance descending', () => {
      const snapshot = getCompanySnapshot();
      const rows = getLeaderboardRows(snapshot);

      for (let i = 1; i < rows.length; i++) {
        expect(rows[i - 1].monthlyBalance).toBeGreaterThanOrEqual(rows[i].monthlyBalance);
      }
    });

    it('uses monthlyCreditDelta as first tie-breaker', () => {
      const snapshot = getCompanySnapshot();
      const rows = getLeaderboardRows(snapshot);

      for (let i = 1; i < rows.length; i++) {
        if (rows[i - 1].monthlyBalance === rows[i].monthlyBalance) {
          expect(rows[i - 1].monthlyCreditDelta).toBeGreaterThanOrEqual(rows[i].monthlyCreditDelta);
        }
      }
    });

    it('uses tripsCompleted as second tie-breaker', () => {
      const snapshot = getCompanySnapshot();
      const rows = getLeaderboardRows(snapshot);

      for (let i = 1; i < rows.length; i++) {
        if (rows[i - 1].monthlyBalance === rows[i].monthlyBalance &&
            rows[i - 1].monthlyCreditDelta === rows[i].monthlyCreditDelta) {
          expect(rows[i - 1].tripsCompleted).toBeGreaterThanOrEqual(rows[i].tripsCompleted);
        }
      }
    });

    it('uses streak as third tie-breaker', () => {
      const snapshot = getCompanySnapshot();
      const rows = getLeaderboardRows(snapshot);

      for (let i = 1; i < rows.length; i++) {
        if (rows[i - 1].monthlyBalance === rows[i].monthlyBalance &&
            rows[i - 1].monthlyCreditDelta === rows[i].monthlyCreditDelta &&
            rows[i - 1].tripsCompleted === rows[i].tripsCompleted) {
          expect(rows[i - 1].streak).toBeGreaterThanOrEqual(rows[i].streak);
        }
      }
    });

    it('uses name as final tie-breaker', () => {
      const snapshot = getCompanySnapshot();
      const rows = getLeaderboardRows(snapshot);

      for (let i = 1; i < rows.length; i++) {
        if (rows[i - 1].monthlyBalance === rows[i].monthlyBalance &&
            rows[i - 1].monthlyCreditDelta === rows[i].monthlyCreditDelta &&
            rows[i - 1].tripsCompleted === rows[i].tripsCompleted &&
            rows[i - 1].streak === rows[i].streak) {
          expect(rows[i - 1].name.localeCompare(rows[i].name)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('includes rank starting at 1', () => {
      const snapshot = getCompanySnapshot();
      const rows = getLeaderboardRows(snapshot);
      expect(rows[0].rank).toBe(1);
      expect(rows[rows.length - 1].rank).toBe(rows.length);
    });

    it('includes all employee fields', () => {
      const snapshot = getCompanySnapshot();
      const rows = getLeaderboardRows(snapshot);
      const row = rows[0];
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('name');
      expect(row).toHaveProperty('department');
      expect(row).toHaveProperty('monthlyBalance');
      expect(row).toHaveProperty('monthlyCreditDelta');
      expect(row).toHaveProperty('tripsCompleted');
      expect(row).toHaveProperty('activeKm');
      expect(row).toHaveProperty('emissionsKg');
      expect(row).toHaveProperty('highCarbonTrips');
      expect(row).toHaveProperty('streak');
    });
  });

  describe('Subscription mechanism', () => {
    it('calls listener on database changes', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeCompanyDb(listener);

      // Make a change
      const snapshot = getCompanySnapshot();
      const recordId = snapshot.commuteRecords[0].id;
      setCommuteMode(recordId, 'walk');

      expect(listener).toHaveBeenCalledTimes(1);
      const calledSnapshot = listener.mock.calls[0][0];
      expect(calledSnapshot).toHaveProperty('employees');
      expect(calledSnapshot).toHaveProperty('commuteRecords');

      unsubscribe();
    });

    it('listener can unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeCompanyDb(listener);

      unsubscribe();

      const snapshot = getCompanySnapshot();
      const recordId = snapshot.commuteRecords[0].id;
      setCommuteMode(recordId, 'walk');

      expect(listener).not.toHaveBeenCalled();
    });

    it('multiple listeners all get called', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      subscribeCompanyDb(listener1);
      subscribeCompanyDb(listener2);

      const snapshot = getCompanySnapshot();
      const recordId = snapshot.commuteRecords[0].id;
      setCommuteMode(recordId, 'walk');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('throws if listener is not a function', () => {
      expect(() => subscribeCompanyDb('not a function')).toThrow('Listener must be a function');
      expect(() => subscribeCompanyDb(null)).toThrow('Listener must be a function');
    });
  });

  describe('Update helpers', () => {
    it('updateCommuteRecord modifies record and notifies', () => {
      const listener = vi.fn();
      subscribeCompanyDb(listener);

      const snapshot = getCompanySnapshot();
      const recordId = snapshot.commuteRecords[0].id;
      updateCommuteRecord(recordId, { distanceKm: 99.9 });

      const updatedSnapshot = getCompanySnapshot();
      const updatedRecord = updatedSnapshot.commuteRecords.find(r => r.id === recordId);
      expect(updatedRecord.distanceKm).toBe(99.9);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('setCommuteMode changes mode and recalculates distance/isHighCarbon', () => {
      const listener = vi.fn();
      subscribeCompanyDb(listener);

      const snapshot = getCompanySnapshot();
      const recordId = snapshot.commuteRecords[0].id;
      const originalMode = snapshot.commuteRecords[0].mode;

      setCommuteMode(recordId, 'walk');

      const updatedSnapshot = getCompanySnapshot();
      const updatedRecord = updatedSnapshot.commuteRecords.find(r => r.id === recordId);
      expect(updatedRecord.mode).toBe('walk');
      expect(updatedRecord.isHighCarbon).toBe(false);
      expect(updatedRecord.distanceKm).toBeGreaterThan(0);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('setCommuteMode throws for invalid mode', () => {
      const snapshot = getCompanySnapshot();
      const recordId = snapshot.commuteRecords[0].id;
      expect(() => setCommuteMode(recordId, 'invalid_mode')).toThrow('Invalid mode');
    });

    it('setCommuteMode throws for non-existent record', () => {
      expect(() => setCommuteMode('non-existent-id', 'walk')).toThrow('Commute record not found');
    });

    it('bulkSetCommuteShare sets target share for a day', () => {
      const listener = vi.fn();
      subscribeCompanyDb(listener);

      const snapshot = getCompanySnapshot();
      const day = snapshot.commuteRecords[0].date;
      const dayRecords = snapshot.commuteRecords.filter(r => r.date === day);

      bulkSetCommuteShare({ mode: 'car', share: 1.0, day });

      const updatedSnapshot = getCompanySnapshot();
      const updatedDayRecords = updatedSnapshot.commuteRecords.filter(r => r.date === day);
      const carCount = updatedDayRecords.filter(r => r.mode === 'car').length;
      expect(carCount).toBe(updatedDayRecords.length);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('bulkSetCommuteShare throws for invalid share', () => {
      const snapshot = getCompanySnapshot();
      const day = snapshot.commuteRecords[0].date;
      expect(() => bulkSetCommuteShare({ mode: 'car', share: 1.5, day })).toThrow('Share must be between 0 and 1');
      expect(() => bulkSetCommuteShare({ mode: 'car', share: -0.1, day })).toThrow('Share must be between 0 and 1');
    });

    it('bulkSetCommuteShare throws for invalid mode', () => {
      const snapshot = getCompanySnapshot();
      const day = snapshot.commuteRecords[0].date;
      expect(() => bulkSetCommuteShare({ mode: 'invalid', share: 0.5, day })).toThrow('Invalid mode');
    });

    it('bulkSetCommuteShare throws for day with no records', () => {
      expect(() => bulkSetCommuteShare({ mode: 'car', share: 0.5, day: '1900-01-01' })).toThrow('No commute records found for day');
    });
  });

  describe('Changing commute records updates company stats', () => {
    it('keeps a stable snapshot until a mutation, preserving prior published records and employee totals', () => {
      const before = getCompanySnapshot();
      expect(getCompanySnapshot()).toBe(before);
      const record = before.commuteRecords[0];
      const employee = before.employees.find(e => e.id === record.employeeId);
      const originalScore = scoreTrip([{ mode: record.mode, distanceKm: record.distanceKm }]);
      const replacementScore = scoreTrip([{ mode: 'car', distanceKm: 100 }]);
      updateCommuteRecord(record.id, { mode: 'car', distanceKm: 100 });
      const after = getCompanySnapshot();
      expect(after).not.toBe(before);
      expect(getCompanySnapshot()).toBe(after);
      expect(before.commuteRecords[0]).toBe(record);
      expect(record.distanceKm).not.toBe(100);
      const updated = after.employees.find(e => e.id === employee.id);
      expect(updated.monthlyCreditDelta).toBeCloseTo(employee.monthlyCreditDelta - originalScore.creditDelta + replacementScore.creditDelta, 2);
      expect(updated.monthlyBalance).toBeCloseTo(100 + updated.monthlyCreditDelta, 2);
      expect(updated.emissionsKg).toBeCloseTo(employee.emissionsKg - originalScore.emissionsKg + replacementScore.emissionsKg, 3);
      expect(updated.highCarbonTrips).toBe(employee.highCarbonTrips + (record.mode === 'car' ? 0 : 1));
    });

    it('changes the company-wide completed mix in one notification and keeps totals consistent', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeCompanyDb(listener);
      bulkSetCommuteShare({ mode: 'car', share: 0.65 });
      unsubscribe();
      const snapshot = getCompanySnapshot();
      const stats = getCompanyStats(snapshot);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(stats.highCarbonSharePercent).toBe(65);
      expect(stats.dailyRates).toEqual({ carMultiplier: 1.25, activeMultiplier: 1.25 });
      expect(stats.totalTrips).toBe(snapshot.commuteRecords.filter(r => r.completed !== false).length);
      expect(stats.totalHighCarbonTrips).toBe(snapshot.commuteRecords.filter(r => r.completed !== false && r.mode === 'car').length);
      expect(stats.activeEmployees).toBe(247);
    });

    it('excludes incomplete commutes from company aggregates and rejects invalid edits without publishing', () => {
      const snapshot = getCompanySnapshot();
      const record = snapshot.commuteRecords[0];
      expect(() => updateCommuteRecord(record.id, { distanceKm: NaN })).toThrow();
      expect(getCompanySnapshot()).toBe(snapshot);
      updateCommuteRecord(record.id, { completed: false });
      const stats = getCompanyStats(getCompanySnapshot());
      expect(stats.totalTrips).toBe(getCompanyStats(snapshot).totalTrips - 1);
    });

    it('changing a record to car increases high-carbon share', () => {
      const snapshot1 = getCompanySnapshot();
      const stats1 = getCompanyStats(snapshot1);
      const share1 = stats1.highCarbonShare;

      const recordId = snapshot1.commuteRecords.find(r => r.mode !== 'car').id;
      setCommuteMode(recordId, 'car');

      const snapshot2 = getCompanySnapshot();
      const stats2 = getCompanyStats(snapshot2);
      const share2 = stats2.highCarbonShare;

      expect(share2).toBeGreaterThan(share1);
    });

    it('changing a record from car to walk decreases high-carbon share', () => {
      const snapshot1 = getCompanySnapshot();
      const stats1 = getCompanyStats(snapshot1);
      const share1 = stats1.highCarbonShare;

      const recordId = snapshot1.commuteRecords.find(r => r.mode === 'car').id;
      setCommuteMode(recordId, 'walk');

      const snapshot2 = getCompanySnapshot();
      const stats2 = getCompanyStats(snapshot2);
      const share2 = stats2.highCarbonShare;

      expect(share2).toBeLessThan(share1);
    });
  });
});
