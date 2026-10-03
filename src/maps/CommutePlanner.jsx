import React from 'react';
import { MAPS_API_KEY, OFFICE_ADDRESS } from './config';
import { GoogleMapsProvider, OriginSearch, LiveMap, RoutePaths } from './GoogleMapPanel';
import { londonInputValue, parseLondonDeparture } from './time';

export default function CommutePlanner({ planner, children }) {
  const { mode, changeMode: onModeChange, invalidate, findRoutes, byMode, routes, selectedId, selectRoute } = planner;
  const [origin, setOrigin] = React.useState(null);
  const [direction, setDirection] = React.useState('to-office');
  const [departure, setDeparture] = React.useState('');
  const [error, setError] = React.useState('');
  const live = mode === 'live';
  const changeOrigin = React.useCallback(value => { setOrigin(value); invalidate(); setError(''); }, [invalidate]);
  const changeContext = (setter, value) => { setter(value); invalidate(); setError(''); };
  const switchMode = value => { setError(''); onModeChange(value); };
  const submit = event => {
    event.preventDefault();
    if (!origin) return;
    try {
      const date = departure ? parseLondonDeparture(departure) : new Date();
      if (departure && date.getTime() < Date.now()) throw new Error('Choose now or a future departure for this four-mode comparison.');
      setError('');
      findRoutes({ origin: direction === 'to-office' ? origin.location : OFFICE_ADDRESS,
        destination: direction === 'to-office' ? OFFICE_ADDRESS : origin.location,
        departureTime: date.toISOString(), departureMode: departure ? 'scheduled' : 'now', direction });
    } catch (err) { setError(err.message); }
  };
  const content = <>
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Commute Planner</h2>
        <div className="flex gap-2" role="group" aria-label="Route data source">
          {['demo', 'live'].map(value => <button key={value} aria-pressed={mode === value} onClick={() => switchMode(value)}
            className={`px-4 py-2 rounded-lg border ${mode === value ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}>{value === 'demo' ? 'Demo' : 'Live'}</button>)}
        </div>
      </div>
      <p className="text-sm text-gray-600 break-words">Demo office destination: {OFFICE_ADDRESS}</p>
      {live && MAPS_API_KEY && <OriginSearch onOriginChange={changeOrigin} onError={setError} />}
      {live && <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
        <label className="text-sm font-medium min-w-0">Direction<select value={direction} onChange={e => changeContext(setDirection, e.target.value)} className="block w-full mt-1 border rounded-lg p-2">
          <option value="to-office">To office</option><option value="to-home">To home</option></select></label>
        <label className="text-sm font-medium min-w-0 max-w-full">Departure (Europe/London)
          <select value={departure ? 'scheduled' : 'now'} onChange={e => changeContext(setDeparture, e.target.value === 'now' ? '' : londonInputValue(new Date(Date.now() + 300000)))} className="block w-full mt-1 border rounded-lg p-2">
            <option value="now">Now</option><option value="scheduled">Choose time</option></select>
          {departure && <input aria-label="Scheduled departure in London" type="datetime-local" value={departure} onChange={e => changeContext(setDeparture, e.target.value)} className="block w-full max-w-full mt-1 border rounded-lg p-2" />}</label>
        <button disabled={!origin || !MAPS_API_KEY} type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Find routes</button>
      </form>}
      {live && origin && <p className="text-sm text-gray-600 break-words">Selected starting address: {origin.label}. Click Find routes to apply your choices.</p>}
      {!live && <p className="text-sm text-gray-600">Authored demo routes. No live map or address requests.</p>}
      {live && !MAPS_API_KEY && <p role="status" className="text-sm text-amber-800">No Maps key configured. Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart Vite. Use demo routes to try the app.</p>}
      {live && (error || planner.error) && <p role="alert" className="text-sm text-deduct-700">{error || planner.error}</p>}
      {live && <button className="text-sm text-primary-700 underline" onClick={() => switchMode('demo')}>Use demo routes</button>}
      {live && <div aria-live="polite" className="space-y-1 text-sm text-gray-600">
        {Object.entries(byMode).map(([m, data]) => <p key={m}>{({ DRIVING: 'Car', TRANSIT: 'Transit', BICYCLING: 'Cycle', WALKING: 'Walk' })[m]}: {({ loading: 'Loading…', success: 'Routes returned', 'no-service': 'No service returned', error: 'Provider error', unscorable: 'Routes returned; emissions estimate unavailable' })[data.status]}{data.message && ` — ${data.message}`}</p>)}
      </div>}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="order-1 lg:order-2 min-w-0">{live && MAPS_API_KEY ? <LiveMap onError={setError}>
        <RoutePaths routes={routes} selectedId={selectedId} onSelect={selectRoute} />
      </LiveMap> :
        <div className="h-[340px] rounded-xl border border-gray-200 bg-primary-50 flex items-center justify-center p-8 text-center text-gray-600" role="region" aria-label="Map placeholder">
          {live ? 'Configure Google Maps to view live paths.' : 'Demo fixtures have no map geometry. Choose Live to plan a real route.'}</div>}</div>
      <div className="order-2 lg:order-1 min-w-0">{children}</div>
    </div>
  </>;
  return <section className="mb-10" aria-label="Commute planner">{live && MAPS_API_KEY ? <GoogleMapsProvider onError={setError}>{content}</GoogleMapsProvider> : content}</section>;
}
