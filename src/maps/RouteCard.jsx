import React from 'react';
import { formatLondonTime } from './time';

const labels = { car: '🚗 Car', walk: '🚶 Walk', cycle: '🚴 Cycle', bus_london: '🚌 London bus',
  bus_local: '🚌 Local bus', rail: '🚆 Rail', subway: '🚇 Underground' };

export default function RouteCard({ route, result, onSimulate, isSimulating, selected, onSelect }) {
  const earn = result?.creditDelta > 0;
  const neutral = result?.creditDelta === 0;
  const live = route.source === 'google';
  const sequence = route.segments ? route.segments.map(s => labels[s.mode]).join(' → ')
    : route.transport.map(s => s.vehicle || s.travelMode).join(' → ');
  const eta = live ? (route.durationMin === null ? 'Unavailable' : `${Math.ceil(route.durationMin)} min`)
    : `${route.durationMinLow}–${route.durationMinHigh} min (typical ${route.durationMin} min)`;
  return <article className={`min-w-0 bg-white rounded-xl border p-4 sm:p-6 shadow-sm transition-shadow ${selected ? 'border-primary-600 ring-2 ring-primary-500' : 'border-gray-200'}`} aria-label={`${route.label} route`}>
    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{route.label}</h3>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${!result || neutral ? 'bg-gray-100 text-gray-700' : earn ? 'bg-earn-100 text-earn-700' : 'bg-deduct-100 text-deduct-700'}`}>
        {!result ? 'Estimate unavailable' : earn ? 'Earn' : neutral ? 'Neutral' : 'Deduct'}</span>
    </div>
    <div className="text-sm text-gray-600 space-y-2 mb-4 break-words">
      <p>{live ? <><span translate="no" className="font-normal whitespace-nowrap">Google Maps</span> · Live route</> : 'Authored fixture · Demo'} · simulated completion</p>
      <p><span className="font-medium">Modes:</span> {sequence || 'Unavailable'}</p>
      <p><span className="font-medium">Distance:</span> {route.distanceKm === null ? 'Unavailable' : `${route.distanceKm.toFixed(2)} km`}</p>
      <p><span className="font-medium">Duration:</span> {eta}</p>
      {live && <p><span className="font-medium">Arrival:</span> {formatLondonTime(route.arrivalTime)}</p>}
      {live && route.transfers !== null && <>
        <p>Transfers: {route.transfers}</p>
        {route.transport.filter(t => t.travelMode === 'TRANSIT').map((t, i) => <p key={i}>
          {t.line || t.vehicle || 'Service details unavailable'}{t.from && ` · ${t.from}`}{t.to && ` → ${t.to}`}
          {t.departureTime && ` · departs ${formatLondonTime(t.departureTime)}`}
        </p>)}
      </>}
    </div>
    {result ? <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
      <p className="flex flex-wrap justify-between gap-1"><span>Estimated CO₂e:</span><strong>{result.emissionsKg.toFixed(5)} kg</strong></p>
      <p className="flex flex-wrap justify-between gap-1"><span>Emissions Charge:</span><strong>{result.emissionsCharge.toFixed(2)} credits</strong></p>
      <p className="flex flex-wrap justify-between gap-1"><span>Active Bonus:</span><strong className="text-earn-600">+{result.activeBonus.toFixed(2)} credits</strong></p>
      <p className={`flex flex-wrap justify-between gap-1 text-lg font-semibold pt-2 border-t border-gray-100 ${earn ? 'text-earn-600' : neutral ? 'text-gray-600' : 'text-deduct-600'}`}>
        <span>Expected Credit Change:</span><span>{earn ? '+' : ''}{result.creditDelta.toFixed(2)} credits</span></p>
    </div> : <p className="border-t pt-4 text-sm text-gray-600">Emissions estimate and credits unavailable. {route.unavailableReason}</p>}
    <button onClick={onSelect} aria-pressed={selected} className="mt-4 w-full py-2 px-4 border border-primary-600 text-primary-700 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500">
      {selected ? 'Viewing route' : 'View route'}</button>
    {live && route.geometry.length < 2 && <p className="text-sm text-gray-500 mt-2">Map path unavailable for this response.</p>}
    <button onClick={onSimulate} disabled={isSimulating || !result}
      className="mt-3 w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
      {isSimulating ? 'Simulating…' : result ? `Simulate Commute (${result.creditDelta > 0 ? '+' : ''}${result.creditDelta.toFixed(2)} credits)` : 'Simulation unavailable'}
    </button>
  </article>;
}
