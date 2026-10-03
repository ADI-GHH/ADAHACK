/**
 * Mock company database layer with pub/sub for reactive UI updates.
 * Implements a deterministic in-memory database for 247 employees with commute records.
 */

import { COMPANY_POLICY } from './companyPolicy.js';
import { scoreTrip, DEFAULT_RATES } from '../engine/scoring';

// ============================================================================
// Deterministic pseudo-random generation for reproducible data
// ============================================================================

function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded RNG for deterministic data generation
const SEED = 0xC0FFEE;
let rng = mulberry32(SEED);

function resetRng() {
  rng = mulberry32(SEED);
}

function randomInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((rng() * (max - min) + min) * factor) / factor;
}

function pickRandom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// Constants and configuration
// ============================================================================

export const NUM_EMPLOYEES = 247;

const DEPARTMENTS = [
  'Engineering', 'Trading', 'Research', 'Operations', 'Risk',
  'Compliance', 'Finance', 'HR', 'Legal', 'IT', 'Quantitative Research'
];

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph',
  'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy',
  'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna',
  'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda',
  'George', 'Melissa', 'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca',
  'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen',
  'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna',
  'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Nicole', 'Scott', 'Emma',
  'Brandon', 'Helen', 'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine',
  'Alexander', 'Debra', 'Patrick', 'Rachel', 'Frank', 'Carolyn', 'Raymond', 'Janet',
  'Jack', 'Maria', 'Dennis', 'Heather', 'Jerry', 'Diane', 'Tyler', 'Ruth'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
  'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
  'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward'
];

const MODES = ['car', 'walk', 'cycle', 'bus_london', 'bus_local', 'rail', 'subway'];
const HIGH_CARBON_MODE = COMPANY_POLICY.HIGH_CARBON_MODE;

// Distance ranges per mode (km)
const MODE_DISTANCES = {
  car: { min: 5, max: 25 },
  walk: { min: 1, max: 5 },
  cycle: { min: 3, max: 15 },
  bus_london: { min: 5, max: 20 },
  bus_local: { min: 5, max: 20 },
  rail: { min: 10, max: 40 },
  subway: { min: 5, max: 20 },
};

// ============================================================================
// Generate employee data
// ============================================================================

function generateEmployees() {
  resetRng();
  const employees = [];
  const usedNames = new Set();

  for (let i = 0; i < NUM_EMPLOYEES; i++) {
    let firstName, lastName, fullName;
    do {
      firstName = pickRandom(FIRST_NAMES);
      lastName = pickRandom(LAST_NAMES);
      fullName = `${firstName} ${lastName}`;
    } while (usedNames.has(fullName) && usedNames.size < FIRST_NAMES.length * LAST_NAMES.length);
    usedNames.add(fullName);

    const department = pickRandom(DEPARTMENTS);
    const baseBalance = randomFloat(-50, 200, 2);
    const monthlyDelta = randomFloat(-30, 50, 2);
    const tripsCompleted = randomInt(0, 30);
    const activeKm = randomFloat(0, 100, 1);
    const emissionsKg = randomFloat(0, 80, 3);
    const highCarbonTrips = randomInt(0, Math.max(0, tripsCompleted - 5));
    const streak = randomInt(0, 14);

    employees.push({
      id: `emp-${String(i + 1).padStart(4, '0')}`,
      name: fullName,
      department,
      monthlyBalance: baseBalance,
      monthlyCreditDelta: monthlyDelta,
      tripsCompleted,
      activeKm,
      emissionsKg,
      highCarbonTrips,
      streak,
    });
  }

  return employees;
}

// ============================================================================
// Generate commute records
// ============================================================================

function generateCommuteRecords(employees, days = 22) {
  resetRng();
  const records = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // For each day in the month (working days)
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - dayOffset));
    const dayKey = date.toISOString().split('T')[0];

    // Each employee has 0-2 commutes per day (to/from work)
    for (const emp of employees) {
      const numCommutes = randomInt(0, 2);
      for (let c = 0; c < numCommutes; c++) {
        const mode = pickRandom(MODES);
        const distRange = MODE_DISTANCES[mode];
        const distanceKm = randomFloat(distRange.min, distRange.max, 2);
        const isHighCarbon = mode === HIGH_CARBON_MODE;

        records.push({
          id: `comm-${emp.id}-${dayKey}-${c}`,
          employeeId: emp.id,
          date: dayKey,
          mode,
          distanceKm,
          isHighCarbon,
          completed: true,
        });
      }
    }
  }

  return records;
}

// ============================================================================
// Initial state
// ============================================================================

let employees = generateEmployees();
let commuteRecords = generateCommuteRecords(employees);
let listeners = new Set();
let snapshot;

// Employee summaries belong to this database, not to the dashboard. Historical
// mock commutes use base rates; publishing a next-day quote never reprices them.
function refreshSnapshot() {
  const totals = new Map(employees.map(employee => [employee.id, {
    tripsCompleted: 0, activeKm: 0, emissionsKg: 0,
    highCarbonTrips: 0, monthlyCreditDelta: 0, streak: 0,
  }]));
  const completed = commuteRecords.filter(record => record.completed !== false)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const record of completed) {
    const total = totals.get(record.employeeId);
    if (!total) continue;
    const score = scoreTrip([{ mode: record.mode, distanceKm: record.distanceKm }], DEFAULT_RATES);
    const highCarbon = record.mode === HIGH_CARBON_MODE;
    total.tripsCompleted += 1;
    total.activeKm += record.mode === 'walk' || record.mode === 'cycle' ? record.distanceKm : 0;
    total.emissionsKg += score.emissionsKg;
    total.highCarbonTrips += highCarbon ? 1 : 0;
    total.monthlyCreditDelta += score.creditDelta;
    // Consecutive completed non-car commutes, ending at the most recent trip.
    total.streak = highCarbon ? 0 : total.streak + 1;
  }
  employees = employees.map(employee => {
    const total = totals.get(employee.id);
    const monthlyCreditDelta = Math.round(total.monthlyCreditDelta * 100) / 100;
    return { ...employee, ...total, monthlyCreditDelta,
      monthlyBalance: Math.round((100 + monthlyCreditDelta) * 100) / 100,
      activeKm: Math.round(total.activeKm * 10) / 10,
      emissionsKg: Math.round(total.emissionsKg * 1000) / 1000 };
  });
  // Stable between mutations for React.useSyncExternalStore. Mutations replace
  // records and employee objects so previously published snapshots stay intact.
  snapshot = Object.freeze({ employees: Object.freeze([...employees]),
    commuteRecords: Object.freeze([...commuteRecords]), timestamp: Date.now() });
}

refreshSnapshot();

// ============================================================================
// Pub/Sub mechanism
// ============================================================================

function notify() {
  refreshSnapshot();
  const snapshot = getCompanySnapshot();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (e) {
      console.error('Company DB listener error:', e);
    }
  }
}

export function subscribeCompanyDb(listener) {
  if (typeof listener !== 'function') {
    throw new Error('Listener must be a function');
  }
  listeners.add(listener);
  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

// ============================================================================
// Core data access
// ============================================================================

export function getCompanySnapshot() {
  return snapshot;
}

export function resetMockCompanyDb() {
  resetRng();
  employees = generateEmployees();
  commuteRecords = generateCommuteRecords(employees);
  notify();
}

// ============================================================================
// Update helpers
// ============================================================================

export function updateCommuteRecord(recordId, patch) {
  const index = commuteRecords.findIndex(r => r.id === recordId);
  if (index === -1) {
    throw new Error(`Commute record not found: ${recordId}`);
  }
  const updated = { ...commuteRecords[index], ...patch };
  // Validate before committing so an invalid edit cannot poison the store or
  // leave the published snapshot behind its internal records.
  scoreTrip([{ mode: updated.mode, distanceKm: updated.distanceKm }], DEFAULT_RATES);
  if (!employees.some(employee => employee.id === updated.employeeId)) throw new Error('Unknown employee');
  if (typeof updated.date !== 'string') throw new Error('Commute date must be a string');
  commuteRecords[index] = { ...updated, isHighCarbon: updated.mode === HIGH_CARBON_MODE };
  notify();
}

export function setCommuteMode(recordId, mode) {
  if (!MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Must be one of: ${MODES.join(', ')}`);
  }
  const index = commuteRecords.findIndex(r => r.id === recordId);
  if (index === -1) {
    throw new Error(`Commute record not found: ${recordId}`);
  }
  const distRange = MODE_DISTANCES[mode];
  const distanceKm = randomFloat(distRange.min, distRange.max, 2);
  const isHighCarbon = mode === HIGH_CARBON_MODE;

  commuteRecords[index] = {
    ...commuteRecords[index],
    mode,
    distanceKm,
    isHighCarbon,
  };
  notify();
}

export function bulkSetCommuteShare({ mode, share, day }) {
  if (!MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Must be one of: ${MODES.join(', ')}`);
  }
  if (typeof share !== 'number' || !Number.isFinite(share) || share < 0 || share > 1) {
    throw new Error('Share must be between 0 and 1');
  }

  // Omit day to change the same company-wide completed-record window used by
  // selectors. Keep the existing day-specific mutation available to callers.
  const dayRecords = commuteRecords.filter(r => r.completed !== false && (day === undefined || r.date === day));
  if (dayRecords.length === 0) {
    throw new Error(`No commute records found for day: ${day}`);
  }

  const targetCount = Math.round(dayRecords.length * share);
  const shuffled = shuffleArray([...dayRecords]);
  const updates = new Map();

  for (let i = 0; i < dayRecords.length; i++) {
    const record = shuffled[i];
    const newMode = i < targetCount ? mode : pickRandom(MODES.filter(m => m !== mode));
    const distRange = MODE_DISTANCES[newMode];
    const distanceKm = randomFloat(distRange.min, distRange.max, 2);
    const isHighCarbon = newMode === HIGH_CARBON_MODE;

    updates.set(record.id, { ...record, mode: newMode, distanceKm, isHighCarbon });
  }
  commuteRecords = commuteRecords.map(record => updates.get(record.id) || record);
  notify();
}

// ============================================================================
// Database object export (for convenience)
// ============================================================================

export const mockCompanyDb = {
  subscribe: subscribeCompanyDb,
  getSnapshot: getCompanySnapshot,
  updateRecord: updateCommuteRecord,
  setMode: setCommuteMode,
  bulkSetShare: bulkSetCommuteShare,
  reset: resetMockCompanyDb,
};

// ============================================================================
// Expose internal state for testing (not for production use)
// ============================================================================

export function _getInternalState() {
  return { employees, commuteRecords, listeners: listeners.size };
}
