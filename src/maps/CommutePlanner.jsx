import React from 'react';
import { MAPS_API_KEY, OFFICE_ADDRESS } from './config';
import { GoogleMapsProvider, OriginSearch, LiveMap, RoutePaths } from './GoogleMapPanel';
import { londonInputValue, parseLondonDeparture } from './time';
import DemoMap from './DemoMap';
import Icon from '../ui/Icon';

export default function CommutePlanner({ planner, children, active = true }) {
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
  const content = <div className="planner-layout">
    <div className="map-frame">
      <div className="map-toolbar"><div><Icon name="pin" size={17}/><h2>Your neighbourhood</h2></div>
        <div className="source-controls" role="group" aria-label="Route data source">
          {['demo', 'live'].map(value => <button key={value} aria-pressed={mode === value} onClick={() => switchMode(value)}>{value === 'demo' ? 'Demo' : 'Live'}</button>)}
        </div>
      </div>
      {live && MAPS_API_KEY ? <LiveMap onError={setError}>
        <RoutePaths routes={routes} selectedId={selectedId} onSelect={selectRoute} active={active}/>
      </LiveMap> : <DemoMap/>}
      <div className="map-caption"><span><span className="small-dot"/>{live && MAPS_API_KEY ? 'Google Maps · live route planning' : 'London · illustrated preview'}</span><span>Planning, at your pace</span></div>
    </div>

    <div className="planner-sheet">
      <div className="sheet-handle" aria-hidden="true"/>
      <div className="planner-controls">
        <div className="office-row"><span className="office-icon"><Icon name="company" size={18}/></span><div><span className="eyebrow">OFFICE DESTINATION</span><p>{OFFICE_ADDRESS}</p></div></div>
        {live && MAPS_API_KEY && <OriginSearch onOriginChange={changeOrigin} onError={setError}/>}
        {live && <form onSubmit={submit} className="journey-form">
          <label>Direction<select value={direction} onChange={e => changeContext(setDirection, e.target.value)}>
            <option value="to-office">To office</option><option value="to-home">To home</option></select></label>
          <label>Departure (Europe/London)<select value={departure ? 'scheduled' : 'now'} onChange={e => changeContext(setDeparture, e.target.value === 'now' ? '' : londonInputValue(new Date(Date.now() + 300000)))}>
            <option value="now">Now</option><option value="scheduled">Choose time</option></select>
            {departure && <input aria-label="Scheduled departure in London" type="datetime-local" value={departure} onChange={e => changeContext(setDeparture, e.target.value)}/>}</label>
          <button disabled={!origin || !MAPS_API_KEY} type="submit" className="primary-button">Find routes <Icon name="arrow" size={16}/></button>
        </form>}
        {live && origin && <p className="planner-helper">Selected starting address: {origin.label}. Click Find routes to apply your choices.</p>}
        {!live && <p className="planner-helper">Five sample ways to work. Switch to Live to plan from your address.</p>}
        {live && !MAPS_API_KEY && <p role="status" className="planner-warning">No Maps key configured. Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart Vite. Use demo routes to try the app.</p>}
        {live && (error || planner.error) && <p role="alert" className="planner-warning">{error || planner.error}</p>}
        {live && <button className="text-button" onClick={() => switchMode('demo')}>Use demo routes</button>}
        {live && <div aria-live="polite" className="mode-statuses">
          {Object.entries(byMode).map(([m, data]) => <p key={m}>{({ DRIVING: 'Car', TRANSIT: 'Transit', BICYCLING: 'Cycle', WALKING: 'Walk' })[m]}: {({ loading: 'Loading…', success: 'Routes returned', 'no-service': 'No service returned', error: 'Provider error', unscorable: 'Routes returned; emissions estimate unavailable' })[data.status]}{data.message && ` — ${data.message}`}</p>)}
        </div>}
      </div>
      {children}
    </div>
  </div>;
  return <section className="commute-planner" aria-label="Commute planner">{live && MAPS_API_KEY ? <GoogleMapsProvider onError={setError}>{content}</GoogleMapsProvider> : content}</section>;
}

