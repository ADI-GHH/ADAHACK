import React from 'react';
import { formatLondonTime } from './time';
import Icon from '../ui/Icon';

const labels = { car: 'Car', walk: 'Walk', cycle: 'Cycle', bus_london: 'London bus',
  bus_local: 'Local bus', rail: 'Rail', subway: 'Underground' };

export default function RouteCard({ route, result, onSimulate, isSimulating, selected, onSelect }) {
  const earn = result?.creditDelta > 0;
  const neutral = result?.creditDelta === 0;
  const live = route.source === 'google';
  const sequence = route.segments ? route.segments.map(s => labels[s.mode]).join(' → ')
    : route.transport.map(s => s.vehicle || s.travelMode).join(' → ');
  const eta = live ? (route.durationMin === null ? 'Unavailable' : `${Math.ceil(route.durationMin)} min`)
    : `${route.durationMinLow}–${route.durationMinHigh} min (typical ${route.durationMin} min)`;
  const dominant = route.segments?.find(segment => segment.mode !== 'walk')?.mode || route.segments?.[0]?.mode;
  const icon = dominant === 'cycle' ? 'cycle' : dominant === 'walk' ? 'walk' : dominant === 'car' ? 'car' : 'transit';
  return <article className={`route-card ${selected ? 'selected' : ''}`} aria-label={`${route.label} route`}>
    <div className="route-card-heading">
      <span className={`mode-icon mode-${icon}`}><Icon name={icon} size={22}/></span>
      <div><h3>{route.label}</h3><span>{route.durationMin === null ? 'Time unavailable' : `${Math.ceil(route.durationMin)} min`} · {route.distanceKm === null ? 'Distance unavailable' : `${route.distanceKm.toFixed(2)} km`}</span></div>
      <div className={`route-net ${earn ? 'positive' : neutral ? 'neutral' : 'negative'}`}>
        <strong>{result ? `${earn ? '+' : ''}${result.creditDelta.toFixed(2)}` : '—'}</strong><span>{!result ? 'Unavailable' : earn ? 'Earn' : neutral ? 'Neutral' : 'Deduct'}{result ? ' credits' : ''}</span>
      </div>
    </div>
    <div className="route-card-actions">
      <button onClick={onSelect} aria-pressed={selected} className="view-route-button">{selected ? <><Icon name="check" size={15}/>Viewing route</> : <>View route<Icon name="arrow" size={15}/></>}</button>
      <button onClick={onSimulate} disabled={isSimulating || !result} className="simulate-button">
        {isSimulating ? 'Simulating…' : result ? `Simulate Commute (${result.creditDelta > 0 ? '+' : ''}${result.creditDelta.toFixed(2)} credits)` : 'Simulation unavailable'}
      </button>
    </div>
    <details className="route-breakdown"><summary>Journey details <span>{live ? 'Google Maps' : 'Demo fixture'}</span></summary>
      <div className="route-details">
        <p>{live ? <><span translate="no">Google Maps</span> · Live route</> : 'Authored fixture · Demo'} · simulated completion</p>
        <p><span>Modes:</span> {sequence || 'Unavailable'}</p>
        <p><span>Distance:</span> {route.distanceKm === null ? 'Unavailable' : `${route.distanceKm.toFixed(2)} km`}</p>
        <p><span>Duration:</span> {eta}</p>
        {live && <p><span>Arrival:</span> {formatLondonTime(route.arrivalTime)}</p>}
        {live && route.transfers !== null && <>
          <p>Transfers: {route.transfers}</p>
          {route.transport.filter(t => t.travelMode === 'TRANSIT').map((t, i) => <p key={i}>
            {t.line || t.vehicle || 'Service details unavailable'}{t.from && ` · ${t.from}`}{t.to && ` → ${t.to}`}
            {t.departureTime && ` · departs ${formatLondonTime(t.departureTime)}`}
          </p>)}
        </>}
        {result && <>
          <p><span>Estimated CO₂e:</span> <strong>{result.emissionsKg.toFixed(5)} kg</strong></p>
          <p><span>Emissions Charge:</span> <strong>{result.emissionsCharge.toFixed(2)} credits</strong></p>
          <p><span>Active Bonus:</span> <strong>+{result.activeBonus.toFixed(2)} credits</strong></p>
          <p><span>Expected Credit Change:</span> <strong>{earn ? '+' : ''}{result.creditDelta.toFixed(2)} credits</strong></p>
        </>}
      </div>
    </details>
    {!result && <p className="route-unavailable">Emissions estimate and credits unavailable. {route.unavailableReason}</p>}
    {live && route.geometry.length < 2 && <p className="route-unavailable">Map path unavailable for this response.</p>}
  </article>;
}

