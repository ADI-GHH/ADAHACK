import React from 'react';
import { COMPANY_POLICY, bulkSetCommuteShare, resetMockCompanyDb } from '../data';
import { K, R } from '../engine';

export default function CompanyDashboard({ stats }) {
  const rates = stats.dailyRates;
  const target = COMPANY_POLICY.TARGET_SHARE * 100;
  const fullPenalty = COMPANY_POLICY.FULL_PENALTY_SHARE * 100;
  const exceedsLimit = stats.highCarbonShare > COMPANY_POLICY.TARGET_SHARE;
  return <section className="company-dashboard mb-8 space-y-4" aria-labelledby="company-summary-heading">
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 id="company-summary-heading" className="text-xl font-semibold text-gray-900">Firm-Wide Impact Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Automated incentive pricing from the mock company database.</p>
        </div>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">Mock company data</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-600">High-carbon commute share</h3>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${exceedsLimit ? 'text-amber-700' : 'text-primary-700'}`}>
            {stats.highCarbonSharePercent}%
          </p>
          <p className="mt-2 text-xs text-gray-600">Policy limit: {target}% · car commutes / completed commutes</p>
          <div role="progressbar" aria-label="High-carbon commute share" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={stats.highCarbonSharePercent} className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div className={exceedsLimit ? 'h-full bg-amber-500' : 'h-full bg-primary-500'} style={{ width: `${stats.highCarbonSharePercent}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
          <h3 className="text-sm font-medium text-gray-600">Calculated next-day multiplier</h3>
          <p className="mt-2 text-3xl font-bold tabular-nums text-primary-700">{rates.carMultiplier.toFixed(2)}×</p>
          <p className="mt-2 text-xs text-gray-600">Car charges and walking/cycling rewards</p>
          <p className="mt-2 text-xs text-gray-600">Active: {(R * rates.activeMultiplier).toFixed(3)} credits/km · car: {(K * rates.carMultiplier).toFixed(2)} credits/kg CO₂e</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-600">Active employees</h3>
          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">{stats.activeEmployees}</p>
          <p className="mt-2 text-xs text-gray-600">Of {stats.totalEmployees} generated employees · {stats.totalTrips.toLocaleString('en-GB')} completed mock commutes</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-600">Estimated mock commute emissions</h3>
          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">{stats.totalEmissionsKg.toLocaleString('en-GB', { maximumFractionDigits: 2 })}<span className="ml-1 text-sm font-medium">kg</span></p>
          <p className="mt-2 text-xs text-gray-600">CO₂e this demo period · {stats.totalActiveKm.toLocaleString('en-GB')} active km</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">Above {target}% high-carbon share, rates start increasing. At {fullPenalty}% or more, they reach {COMPANY_POLICY.MAX_MULTIPLIER.toFixed(1)}×. Public transport charges stay at base rate.</p>
      <p className="mt-2 text-xs text-gray-500">For this hackathon, the calculated next-day quote applies immediately to route estimates. Recorded trip receipts keep their original rate.</p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4" aria-label="Company demo controls">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Internal demo controls</h3>
          <p className="text-xs text-gray-500 mt-1">Rewrite the mock period's commute mix. No real employee data.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Mock car share presets">
          {[40, 50, 65, 78, 85].map(share => <button key={share} type="button"
            aria-pressed={stats.highCarbonSharePercent === share}
            onClick={() => bulkSetCommuteShare({ mode: COMPANY_POLICY.HIGH_CARBON_MODE, share: share / 100 })}
            className={`rounded-lg border px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary-500 ${stats.highCarbonSharePercent === share ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {share}% car
          </button>)}
          <button type="button" onClick={resetMockCompanyDb} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Reset company demo</button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">Whole commutes are rounded to the closest mix. Historical company balances use base rates; your personal balance and activity ledger are preserved.</p>
    </div>
  </section>;
}
