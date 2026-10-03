/**
 * Mock Company Database - Public API
 * Exports all stable names for the company data layer
 */

// Policy
export { COMPANY_POLICY, HIGH_CARBON_MODE, TARGET_SHARE, FULL_PENALTY_SHARE, MAX_MULTIPLIER, MIN_MULTIPLIER, calculatePressure, calculateMultiplier } from './companyPolicy.js';

// Database
export { mockCompanyDb, subscribeCompanyDb, getCompanySnapshot, updateCommuteRecord, setCommuteMode, bulkSetCommuteShare, resetMockCompanyDb, NUM_EMPLOYEES } from './mockCompanyDb.js';

// Selectors
export { calculateHighCarbonShare, calculateDailyRatesFromShare, getCompanyStats, getLeaderboardRows, getDepartmentRows } from './selectors.js';
export { useCompanySnapshot } from './useCompanySnapshot.js';
