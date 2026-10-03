import React from 'react';
import { useCompanySnapshot, getCompanyStats } from './data';
import CompanyDashboard from './company/CompanyDashboard';
import Leaderboard from './company/Leaderboard';
import CommutePlanner from './maps/CommutePlanner';
import RouteCard from './maps/RouteCard';
import { useRoutePlanner } from './maps/useRoutePlanner';
import { snapshotTrip } from './maps/tripReceipt';
import Icon, { StreetMark } from './ui/Icon';

const screens = [
  { id: 'commute', label: 'Commute', icon: 'commute' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { id: 'company', label: 'Company', icon: 'company' },
];
const signed = value => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;

function PersonalStats({ balance, tripHistory, rates }) {
  const emissions = tripHistory.reduce((total, trip) => total + trip.emissionsKg, 0);
  const earned = tripHistory.reduce((total, trip) => total + Math.max(0, trip.creditDelta), 0);
  return <section className="personal-overview" aria-label="Your session statistics">
    <div className="credit-card">
      <div className="credit-card-top"><span className="eyebrow">YOUR GREEN CREDITS</span><Icon name="leaf" size={21}/></div>
      <div className="credit-value"><span className="tabular-nums">{balance.toFixed(2)}</span><span>credits</span></div>
      <div className="credit-card-bottom"><span>This session</span><span>100 opening credits <Icon name="arrow" size={14}/></span></div>
    </div>
    <div className="personal-metrics">
      <div><span className="stat-icon"><Icon name="commute"/></span><strong>{tripHistory.length}</strong><span>Commutes</span></div>
      <div><span className="stat-icon"><Icon name="leaderboard"/></span><strong>{signed(earned)}</strong><span>Credits earned</span></div>
      <div><span className="stat-icon"><Icon name="leaf"/></span><strong>{emissions.toFixed(2)}<small>kg</small></strong><span>Est. CO₂e</span></div>
      <p className="personal-stat-note"><span className="small-dot"/>{rates.carMultiplier.toFixed(2)}× company rate · all trips simulated</p>
    </div>
  </section>;
}

function TripHistoryItem({ trip }) {
  const earn = trip.creditDelta > 0;
  const rateLabel = trip.carMultiplier === 1 ? 'Normal (1.0x)' : trip.carMultiplier === 1.5 ? 'High (1.5x)' : `Adjusted (${trip.carMultiplier.toFixed(2)}x)`;
  return <div className="history-item">
    <div className={`history-icon ${earn ? 'positive' : ''}`}><Icon name={earn ? 'leaf' : 'commute'}/></div>
    <div className="history-description"><h4>{trip.routeLabel}</h4><p>{trip.timestamp}</p>
      <p>CO₂e: {trip.emissionsKg.toFixed(5)} kg · <span>{rateLabel}</span></p></div>
    <strong className={earn ? 'text-earn-700' : trip.creditDelta < 0 ? 'text-deduct-600' : ''}>{signed(trip.creditDelta)}<small>credits</small></strong>
  </div>;
}

function ActivityLedger({ tripHistory, onPlan }) {
  return <section className="activity-ledger" aria-label="Activity ledger">
    <div className="section-heading"><h2>Activity Ledger</h2><span className="quiet-pill">{tripHistory.length} trip{tripHistory.length !== 1 ? 's' : ''} completed</span></div>
    {tripHistory.length === 0 ? <div className="empty-activity">
      <div className="empty-activity-icon"><Icon name="activity" size={34}/></div>
      <h3>No trips recorded yet</h3><p>Your first greener commute starts on the map.<br/>Simulate a route to see it here.</p>
      <button className="primary-button" onClick={onPlan}>Plan a commute <Icon name="arrow" size={17}/></button>
    </div> : <>
      <div className="history-list">{tripHistory.map(trip => <TripHistoryItem key={trip.id} trip={trip}/>)}</div>
      <div className="ledger-total"><span>Net change this session:</span><strong>{signed(tripHistory.reduce((total, trip) => total + trip.creditDelta, 0))} credits</strong></div>
    </>}
  </section>;
}

function QuickSummary({ routes }) {
  return <section className="quick-summary">
    <h2 className="sr-only">Quick Summary</h2>
    <details><summary>Compare the numbers <span>Quick Summary</span></summary>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr>{['Route', 'Distance', 'CO₂e (kg)', 'Charge', 'Bonus', 'Net Change'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{routes.map(({ route, result }) => <tr key={route.id}>
          <td>{route.label} <span className="text-xs text-gray-500">({route.source === 'google' ? 'Live' : 'Demo'})</span></td>
          <td>{route.distanceKm === null ? 'Unavailable' : `${route.distanceKm.toFixed(2)} km`}</td>
          <td>{result ? result.emissionsKg.toFixed(5) : 'Unavailable'}</td>
          <td>{result ? result.emissionsCharge.toFixed(2) : 'Unavailable'}</td>
          <td>{result ? `+${result.activeBonus.toFixed(2)}` : 'Unavailable'}</td>
          <td>{result ? signed(result.creditDelta) : 'Unavailable'}</td>
        </tr>)}</tbody>
      </table></div>
    </details>
  </section>;
}

export default function App() {
  const companySnapshot = useCompanySnapshot();
  const companyStats = React.useMemo(() => getCompanyStats(companySnapshot), [companySnapshot]);
  const rates = companyStats.dailyRates;
  const [balance, setBalance] = React.useState(100.00);
  const [tripHistory, setTripHistory] = React.useState([]);
  const [simulatingRouteId, setSimulatingRouteId] = React.useState(null);
  const [activeScreen, setActiveScreen] = React.useState('commute');
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
    simulation.current = setTimeout(() => {
      setBalance(previous => Math.round((previous + receipt.creditDelta) * 100) / 100);
      setTripHistory(prev => [receipt, ...prev]);
      setSimulatingRouteId(null);
      simulation.current = null;
    }, 300);
  };

  return <div className="green-street-app">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="app-header">
      <button className="brand" aria-label="Green Street home" onClick={() => setActiveScreen('commute')}><StreetMark/><span>green street<span className="brand-dot">.</span></span></button>
      <div className="header-location"><Icon name="pin" size={15}/><span>London</span><span className="header-divider"/><span>Commute demo</span></div>
      <button className="account-button" onClick={() => setActiveScreen('activity')} aria-label="View your activity"><span>Your space</span><span className="account-avatar">You</span></button>
    </header>

    <main id="main-content" className="app-content" tabIndex={-1}>
      {/* Keep screens mounted: tab changes preserve the origin, map, quotes and scroll positions. */}
      <div id="screen-commute" className="app-screen commute-screen" hidden={activeScreen !== 'commute'} aria-labelledby="nav-commute">
        <div className="screen-inner">
          <div className="home-title"><div><p className="eyebrow">A LITTLE BETTER, EVERY JOURNEY</p><h1>Your commute.<br className="mobile-break"/> Your way.</h1></div>
            <span className="session-label"><span className="small-dot"/>Your session, at a glance</span></div>
          <PersonalStats balance={balance} tripHistory={tripHistory} rates={rates}/>
          <CommutePlanner planner={planner} active={activeScreen === 'commute'}>
            <div className="route-list-header"><div><p className="eyebrow">PICK YOUR PACE</p><h2>Route Comparison</h2></div><span className="quiet-pill">{scoredRoutes.length} {plannerMode === 'demo' ? 'demo routes' : 'live routes'}</span></div>
            <label className="route-sort"><span className="sr-only">Sort routes by credit change</span>
              <select value={routeSort} onChange={event => setRouteSort(event.target.value)}>
                <option value="credits-desc">Sort by: Credits Earned (High to Low)</option>
                <option value="credits-asc">Sort by: Credits Deducted (Low to High)</option>
              </select></label>
            <div className="route-card-list">{displayedRoutes.map(({ route, result }) => <RouteCard key={route.id}
              route={route} result={result} onSimulate={() => handleSimulate(route)}
              isSimulating={simulatingRouteId !== null} selected={planner.selectedId === route.id}
              onSelect={() => planner.selectRoute(route.id)}/>)}</div>
          </CommutePlanner>
          <QuickSummary routes={displayedRoutes}/>
          <p className="home-footnote">Route estimates, real choices. Completion is simulated. <button onClick={() => setActiveScreen('company')}>About the rates <Icon name="arrow" size={13}/></button></p>
        </div>
      </div>

      <div id="screen-activity" className="app-screen" hidden={activeScreen !== 'activity'} aria-labelledby="nav-activity">
        <div className="screen-inner secondary-screen">
          <div className="page-heading"><p className="eyebrow">YOUR FOOTPRINT</p><h1>One journey at a time.</h1><p>Your balance and trips, all in one place.</p></div>
          <PersonalStats balance={balance} tripHistory={tripHistory} rates={rates}/>
          <ActivityLedger tripHistory={tripHistory} onPlan={() => setActiveScreen('commute')}/>
          <p className="screen-disclaimer">Session history · simulated trips · resets on refresh</p>
        </div>
      </div>

      <div id="screen-leaderboard" className="app-screen" hidden={activeScreen !== 'leaderboard'} aria-labelledby="nav-leaderboard">
        <div className="screen-inner secondary-screen">
          <div className="page-heading"><p className="eyebrow">THE GREENER CROWD</p><h1>A little friendly competition.</h1><p>{companyStats.activeEmployees} generated commuters. Every choice adds up.</p></div>
          <Leaderboard snapshot={companySnapshot}/>
        </div>
      </div>

      <div id="screen-company" className="app-screen" hidden={activeScreen !== 'company'} aria-labelledby="nav-company">
        <div className="screen-inner secondary-screen">
          <div className="page-heading"><p className="eyebrow">THE BIGGER PICTURE</p><h1>Greener, together.</h1><p>The mock company's commute mix sets the next-day incentive.</p></div>
          <CompanyDashboard stats={companyStats}/>
          <section className="how-it-works"><h2>How your credits work</h2><div>
            <p><strong>Emissions charge</strong>Car charges use the company multiplier. Public transport stays at the base charge.</p>
            <p><strong>Active bonus</strong>Walking and cycling earn 0.25 credits/km, capped at 2.5 per trip before the multiplier.</p>
            <p><strong>Company rates</strong>Above 50% high-carbon commute share, rates increase gradually. At 80% or more they reach 1.5×.</p>
          </div><p className="factor-note">Source: UK Government GHG Conversion Factors 2026 (unverified, check before demo). Calculated next-day rates apply immediately to estimates in this demo.</p></section>
        </div>
      </div>
    </main>

    <nav className="bottom-navigation" aria-label="Main navigation">
      {screens.map(screen => <button key={screen.id} id={`nav-${screen.id}`} aria-controls={`screen-${screen.id}`}
        aria-current={activeScreen === screen.id ? 'page' : undefined} onClick={() => setActiveScreen(screen.id)}>
        <span className="nav-icon"><Icon name={screen.icon} size={23}/></span><span>{screen.label}</span>
      </button>)}
    </nav>
  </div>;
}

