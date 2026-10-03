/**
 * Pure selector functions for company stats, leaderboard, high-carbon share, and daily rates.
 * These functions have no side effects and operate on snapshots.
 */

import { COMPANY_POLICY } from './companyPolicy.js';

const HIGH_CARBON_MODE = COMPANY_POLICY.HIGH_CARBON_MODE;

/**
 * Calculate high-carbon share from commute records
 * highCarbonShare = highCarbonCommuteCount / completedCommuteCount
 */
export function calculateHighCarbonShare(commuteRecords, policy = COMPANY_POLICY) {
  if (!commuteRecords || commuteRecords.length === 0) {
    return 0;
  }
  const completed = commuteRecords.filter(r => r.completed !== false);
  if (completed.length === 0) return 0;

  const highCarbonCount = completed.filter(r => r.mode === policy.HIGH_CARBON_MODE).length;
  return highCarbonCount / completed.length;
}

/**
 * Calculate daily rates from high-carbon share
 * pressure = clamp((highCarbonShare - 0.50) / 0.30, 0, 1)
 * multiplier = round to 2 decimals of 1 + 0.5 * pressure
 * dailyRates = { carMultiplier: multiplier, activeMultiplier: multiplier }
 * share <= 50% gives 1.00x
 * share >= 80% gives 1.50x
 */
export function calculateDailyRatesFromShare(highCarbonShare, policy = COMPANY_POLICY) {
  const pressure = Math.max(0, Math.min(1, (highCarbonShare - policy.TARGET_SHARE) / (policy.FULL_PENALTY_SHARE - policy.TARGET_SHARE)));
  const multiplier = Math.round((policy.MIN_MULTIPLIER + 0.5 * pressure) * 100) / 100;
  return {
    carMultiplier: multiplier,
    activeMultiplier: multiplier,
  };
}

/**
 * Get company-wide statistics from a snapshot
 */
export function getCompanyStats(snapshot) {
  const { employees, commuteRecords } = snapshot;

  const activeEmployees = employees.filter(e => e.tripsCompleted > 0).length;
  const totalEmployees = employees.length;

  const totalBalance = employees.reduce((sum, e) => sum + e.monthlyBalance, 0);
  const avgBalance = totalEmployees > 0 ? totalBalance / totalEmployees : 0;

  const totalTrips = employees.reduce((sum, e) => sum + e.tripsCompleted, 0);
  const totalActiveKm = employees.reduce((sum, e) => sum + e.activeKm, 0);
  const totalEmissionsKg = employees.reduce((sum, e) => sum + e.emissionsKg, 0);
  const totalHighCarbonTrips = employees.reduce((sum, e) => sum + e.highCarbonTrips, 0);

  const highCarbonShare = calculateHighCarbonShare(commuteRecords);
  const dailyRates = calculateDailyRatesFromShare(highCarbonShare);

  return {
    totalEmployees,
    activeEmployees,
    totalBalance,
    avgBalance: Math.round(avgBalance * 100) / 100,
    totalTrips,
    totalActiveKm: Math.round(totalActiveKm * 10) / 10,
    totalEmissionsKg: Math.round(totalEmissionsKg * 1000) / 1000,
    totalHighCarbonTrips,
    highCarbonShare: Math.round(highCarbonShare * 10000) / 10000,
    highCarbonSharePercent: Math.round(highCarbonShare * 100),
    dailyRates,
  };
}

/**
 * Get leaderboard rows from a snapshot
 * Ordered by monthly balance descending, with sensible tie-breakers:
 * 1. monthlyBalance (descending)
 * 2. monthlyCreditDelta (descending)
 * 3. tripsCompleted (descending)
 * 4. streak (descending)
 * 5. name (ascending)
 */
export function getLeaderboardRows(snapshot) {
  const { employees } = snapshot;

  return [...employees]
    .sort((a, b) => {
      // Primary: monthly balance descending
      if (b.monthlyBalance !== a.monthlyBalance) {
        return b.monthlyBalance - a.monthlyBalance;
      }
      // Tie-breaker 1: monthly credit delta descending
      if (b.monthlyCreditDelta !== a.monthlyCreditDelta) {
        return b.monthlyCreditDelta - a.monthlyCreditDelta;
      }
      // Tie-breaker 2: trips completed descending
      if (b.tripsCompleted !== a.tripsCompleted) {
        return b.tripsCompleted - a.tripsCompleted;
      }
      // Tie-breaker 3: streak descending
      if (b.streak !== a.streak) {
        return b.streak - a.streak;
      }
      // Tie-breaker 4: name ascending (stable)
      return a.name.localeCompare(b.name);
    })
    .map((emp, index) => ({
      rank: index + 1,
      id: emp.id,
      name: emp.name,
      department: emp.department,
      monthlyBalance: emp.monthlyBalance,
      monthlyCreditDelta: emp.monthlyCreditDelta,
      tripsCompleted: emp.tripsCompleted,
      activeKm: emp.activeKm,
      emissionsKg: emp.emissionsKg,
      highCarbonTrips: emp.highCarbonTrips,
      streak: emp.streak,
    }));
}

/** Department totals, ranked by average balance so team size does not decide rank. */
export function getDepartmentRows(snapshot) {
  const departments = new Map();
  for (const employee of getLeaderboardRows(snapshot)) {
    const row = departments.get(employee.department) || {
      department: employee.department, employees: 0, monthlyBalance: 0,
      monthlyCreditDelta: 0, activeKm: 0, emissionsKg: 0, highCarbonTrips: 0,
    };
    row.employees += 1;
    for (const field of ['monthlyBalance', 'monthlyCreditDelta', 'activeKm', 'emissionsKg', 'highCarbonTrips']) {
      row[field] += employee[field];
    }
    departments.set(employee.department, row);
  }
  return [...departments.values()].map(row => ({ ...row, avgBalance: row.monthlyBalance / row.employees }))
    .sort((a, b) => b.avgBalance - a.avgBalance || a.department.localeCompare(b.department))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
