import React from 'react';
import { DEFAULT_RATES } from './engine/index';
import CommutePlanner from './maps/CommutePlanner';
import RouteCard from './maps/RouteCard';
import { useRoutePlanner } from './maps/useRoutePlanner';
import { snapshotTrip } from './maps/tripReceipt';


function RateBadge({ rates }) {
  const isHigh = rates.carMultiplier > 1 || rates.activeMultiplier > 1;
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${isHigh ? 'bg-amber-50 border border-amber-200' : 'bg-primary-50 border border-primary-200'}`}>
      <span className="text-sm font-medium">
        {isHigh ? '⚡ High Demand Day' : '✓ Normal Day'}
      </span>
      <span className="text-xs px-2 py-0.5 rounded bg-white/70">
        Car: {rates.carMultiplier}x | Active: {rates.activeMultiplier}x
      </span>
    </div>
  );
}

function WalletDashboard({ balance }) {
  const isPositive = balance >= 0;
  return (
    <div className={`bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg ${isPositive ? '' : 'from-deduct-600 to-deduct-700'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-primary-100 text-sm font-medium uppercase tracking-wider mb-1">Green Credit Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold tabular-nums">{balance.toFixed(2)}</span>
            <span className="text-primary-200 text-lg self-end mb-1">Credits</span>
          </div>
          <p className="mt-2 text-primary-200 text-sm">
            {isPositive
              ? '🎉 Surplus! Redeem for perks at month-end.'
              : '⚠️ Deficit. Greener commutes will restore your balance.'
            }
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className={`w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center ${isPositive ? 'bg-white/10' : 'bg-white/5'}`}>
            <span className="text-3xl">{isPositive ? '💚' : '💔'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripHistoryItem({ trip }) {
  const isEarn = trip.creditDelta > 0;
  const isNeutral = trip.creditDelta === 0;
  const rateLabel = trip.carMultiplier > 1 ? 'High (1.5x)' : 'Normal (1.0x)';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isEarn ? 'bg-earn-100' : isNeutral ? 'bg-gray-100' : 'bg-deduct-100'}`}>
            <span className="text-xl">{isEarn ? '🎉' : isNeutral ? '➖' : '💸'}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{trip.routeLabel}</h4>
            <p className="text-sm text-gray-500">{trip.timestamp}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">CO₂e:</span>
            <span>{trip.emissionsKg.toFixed(5)} kg</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Rate:</span>
            <span className="px-2 py-0.5 text-xs rounded bg-gray-100">{rateLabel}</span>
          </div>
          <div className={`flex items-center gap-1 font-semibold ${isEarn ? 'text-earn-600' : isNeutral ? 'text-gray-600' : 'text-deduct-600'}`}>
            <span>{isEarn ? '+' : ''}{trip.creditDelta.toFixed(2)} credits</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanySummary() {
  return (
    <section className="mb-8" aria-labelledby="company-summary-heading">
      <div className="bg-gray-950 rounded-2xl p-6 sm:p-8 border border-gray-800 shadow-xl overflow-hidden relative">
        {/* Subtle grid background for quant aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 id="company-summary-heading" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Firm-Wide Impact Dashboard
              </h2>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Automated Market Maker — Real-time incentive calibration
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-gray-300">LIVE</span>
            </div>
          </div>

          {/* Three metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric 1: Driving Share */}
            <div className="group relative bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-amber-500/50 transition-all duration-300">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">⚠ Alert</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚗</span>
                <h3 className="text-gray-300 font-medium text-sm">Yesterday's Firm-Wide Driving Share</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums text-amber-400">78%</span>
                <span className="text-gray-500 text-sm">Target: ≤50%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-1000"
                  style={{ width: '78%' }}
                ></div>
              </div>
              <p className="mt-3 text-sm text-amber-300 flex items-center gap-1">
                <span>⚠</span> Exceeds 50% target — algorithmic adjustment triggered for today
              </p>
            </div>

            {/* Metric 2: Algorithmic Adjustment */}
            <div className="group relative bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded">Active</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <h3 className="text-gray-300 font-medium text-sm">Today's Algorithmic Adjustment</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums text-emerald-400">+1.5x</span>
                <span className="text-gray-500 text-sm">Multiplier</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">+</span>
                  <span>Active transit bonus: <span className="font-mono text-white">0.25 → 0.375</span> credits/km</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">−</span>
                  <span>Car emissions charge: <span className="font-mono text-white">3.01 → 4.52</span> × kg CO₂e</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-emerald-300 flex items-center gap-1">
                <span>↑</span> Auto-calibrated from yesterday's 78% driving share
              </p>
            </div>

            {/* Metric 3: CO2e Avoided */}
            <div className="group relative bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌿</span>
                <h3 className="text-gray-300 font-medium text-sm">Total Firm CO₂e Avoided This Month</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums text-primary-400">1,240</span>
                <span className="text-gray-500 text-sm">kg CO₂e</span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs">≈</span>
                  <span>3,100 car commutes avoided</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs">≈</span>
                  <span>56 mature trees' annual absorption</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs">≈</span>
                  <span>£18,600 social cost of carbon saved</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-primary-300 flex items-center gap-1">
                <span>📈</span> Tracked from 247 active employees this month
              </p>
            </div>
          </div>

          {/* Explanation banner */}
          <div className="mt-8 p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
                <div>
                  <p className="font-medium text-white">How the Automated Market Maker Works</p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    The system monitors firm-wide commute patterns daily. When driving share exceeds 50%, it automatically
                    increases both the <span className="text-emerald-400 font-medium">active travel reward</span> and the
                    <span className="text-red-400 font-medium">driving emissions penalty</span> by 50% for the next day.
                    This creates a direct financial incentive for employees to shift modes — no manager intervention required.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center px-4 py-2 bg-gray-800 rounded-lg">
                  <p className="text-gray-400">Yesterday</p>
                  <p className="font-bold text-amber-400 text-lg">78% drove</p>
                </div>
                <span className="text-gray-500">→</span>
                <div className="text-center px-4 py-2 bg-gray-800 rounded-lg">
                  <p className="text-gray-400">Today</p>
                  <p className="font-bold text-emerald-400 text-lg">1.5× rates</p>
                </div>
                <span className="text-gray-500">→</span>
                <div className="text-center px-4 py-2 bg-gray-800 rounded-lg">
                  <p className="text-gray-400">Tomorrow</p>
                  <p className="font-bold text-primary-400 text-lg">Recalibrates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActivityLedger({ tripHistory }) {
  if (tripHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No trips recorded yet</h3>
        <p className="text-gray-500">Click "Simulate Commute" on a route above to record your first trip.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Activity Ledger</h2>
        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
          {tripHistory.length} trip{tripHistory.length !== 1 ? 's' : ''} completed
        </span>
      </div>
      <div className="space-y-3">
        {tripHistory.map((trip, index) => (
          <TripHistoryItem key={trip.id} trip={trip} />
        ))}
      </div>
      {/* Running total */}
      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Net change this session:</span>
          <span className="font-bold text-lg text-gray-900">
            {tripHistory.reduce((sum, t) => sum + t.creditDelta, 0) > 0 ? '+' : ''}
            {tripHistory.reduce((sum, t) => sum + t.creditDelta, 0).toFixed(2)} credits
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [rates, setRates] = React.useState(DEFAULT_RATES);
  const [balance, setBalance] = React.useState(100.00);
  const [tripHistory, setTripHistory] = React.useState([]);
  const [simulatingRouteId, setSimulatingRouteId] = React.useState(null);
  const simulation = React.useRef(null);
  React.useEffect(() => () => { clearTimeout(simulation.current); }, []);
  const planner = useRoutePlanner(rates);
  const { scoredRoutes, mode: plannerMode } = planner;
  const [routeSort, setRouteSort] = React.useState('credits-desc');
  const displayedRoutes = React.useMemo(() => [...scoredRoutes].sort((a, b) => {
    if (!a.result) return b.result ? 1 : 0;
    if (!b.result) return -1;
    return routeSort === 'credits-desc'
      ? b.result.creditDelta - a.result.creditDelta
      : a.result.creditDelta - b.result.creditDelta;
  }), [scoredRoutes, routeSort]);

  const handleSimulate = (route) => {
    if (simulation.current !== null || !route.scorable) return;
    const receipt = snapshotTrip(route, rates);
    setSimulatingRouteId(route.id);

    // Small delay for visual feedback
    simulation.current = setTimeout(() => {
      setBalance(previous => Math.round((previous + receipt.creditDelta) * 100) / 100);
      setTripHistory(prev => [receipt, ...prev]);
      setSimulatingRouteId(null);
      simulation.current = null;
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automated Carbon Bank</h1>
              <p className="text-sm text-gray-500 mt-1">Commute Comparison Dashboard</p>
            </div>
            <RateBadge rates={rates} />
          </div>
        </div>

        {/* Rate Toggle */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4 border-t border-gray-100">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rate"
                checked={rates.carMultiplier === 1}
                onChange={() => setRates(DEFAULT_RATES)}
                className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Normal Rates (1.0x)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rate"
                checked={rates.carMultiplier === 1.5}
                onChange={() => setRates({ carMultiplier: 1.5, activeMultiplier: 1.5 })}
                className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">High Demand Rates (1.5x)</span>
            </label>
            <div className="flex-1 min-w-[200px]"></div>
            <div className="text-xs text-gray-500">
              Rates frozen for today. Based on recent company commute patterns.
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet / Bank Dashboard */}
        <section className="mb-8">
          <WalletDashboard balance={balance} />
        </section>

        {/* Company Summary Dashboard */}
        <CompanySummary />

        {/* Route Comparison Grid */}
        <CommutePlanner planner={planner}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Route Comparison</h2>
            <p className="text-sm text-gray-500">
              {scoredRoutes.length} {plannerMode === 'demo' ? 'demo routes' : 'live routes'}
            </p>
          </div>

          <label className="block mb-6">
            <span className="sr-only">Sort routes by credit change</span>
            <select value={routeSort} onChange={e => setRouteSort(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="credits-desc">Sort by: Credits Earned (High to Low)</option>
              <option value="credits-asc">Sort by: Credits Deducted (Low to High)</option>
            </select>
          </label>

          <div className="grid grid-cols-1 gap-4">
            {displayedRoutes.map(({ route, result }) => (
              <RouteCard
                key={route.id}
                route={route}
                result={result}
                onSimulate={() => handleSimulate(route)}
                isSimulating={simulatingRouteId !== null}
                selected={planner.selectedId === route.id}
                onSelect={() => planner.selectRoute(route.id)}
              />
            ))}
          </div>
        </CommutePlanner>

        {/* Activity Ledger */}
        <section className="mb-10">
          <ActivityLedger tripHistory={tripHistory} />
        </section>

        {/* Summary Table */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 font-medium">Distance</th>
                  <th className="pb-2 font-medium">CO₂e (kg)</th>
                  <th className="pb-2 font-medium">Charge</th>
                  <th className="pb-2 font-medium">Bonus</th>
                  <th className="pb-2 font-medium">Net Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedRoutes.map(({ route, result }) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{route.label} <span className="text-xs text-gray-500">({route.source === 'google' ? 'Live' : 'Demo'})</span></td>
                    <td className="py-3 text-gray-600">
                      {route.distanceKm === null ? 'Unavailable' : `${route.distanceKm.toFixed(2)} km`}
                    </td>
                    <td className="py-3 text-gray-600">{result ? result.emissionsKg.toFixed(5) : 'Unavailable'}</td>
                    <td className="py-3 text-gray-600">{result ? result.emissionsCharge.toFixed(2) : 'Unavailable'}</td>
                    <td className="py-3 text-earn-600">{result ? `+${result.activeBonus.toFixed(2)}` : 'Unavailable'}</td>
                    <td className={`py-3 font-medium ${result?.creditDelta > 0 ? 'text-earn-600' : !result || result.creditDelta === 0 ? 'text-gray-600' : 'text-deduct-600'}`}>
                      {result ? `${result.creditDelta > 0 ? '+' : ''}${result.creditDelta.toFixed(2)}` : 'Unavailable'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Info Panel */}
        <section className="p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Emissions Charge</h4>
              <p>Based on UK Gov 2026 factors. Car segments multiplied by daily demand rate. Other modes at base rate.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Active Bonus</h4>
              <p>Walking & cycling earn 0.25 credits/km, capped at 2.5 credits/trip before multiplier.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Daily Rates</h4>
              <p>Normal: 1.0x. High demand (≥80% driving): 1.5x for car charges and active bonuses.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>{plannerMode === 'demo' ? 'Demo mode — using authored route fixtures.' : 'Live route planning — completion is still simulated.'} Firm-wide metrics are hardcoded demo data.</p>
          <p className="mt-1">Source: UK Government GHG Conversion Factors 2026 (unverified, check before demo)</p>
        </div>
      </footer>
    </div>
  );
}
