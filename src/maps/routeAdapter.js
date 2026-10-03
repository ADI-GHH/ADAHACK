// Only the current Maps JavaScript Route shape is accepted here, never REST or DirectionsService.
const DIRECT_MODES = { DRIVING: 'car', DRIVE: 'car', WALKING: 'walk', WALK: 'walk', BICYCLING: 'cycle', BICYCLE: 'cycle' };
const TITLES = { DRIVING: 'Car', WALKING: 'Walk', BICYCLING: 'Cycle', TRANSIT: 'Transit' };
const validNumber = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const toleranceMeters = count => Math.max(20, count); // 20 m or 1 m per rounded step/leg.

function distance(value) {
  if (!validNumber(value)) throw new Error('Missing or invalid numeric distance.');
  return value;
}

function reconcile(sum, total, count) {
  if (Math.abs(sum - total) > toleranceMeters(count)) throw new Error('Transport portions do not account for the full route distance.');
}

export function coordinate(point) {
  if (!point) return null;
  const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
  const lng = typeof point.lng === 'function' ? point.lng() : point.lng;
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

function path(points) {
  if (!Array.isArray(points)) return [];
  const converted = points.map(coordinate);
  return converted.every(Boolean) ? converted : [];
}

// A deliberately conservative inner-London eligibility zone, not a London-wide boundary.
// Require TfL agency evidence AND the entire supplied bus path/stops within this zone.
function londonBus(step) {
  const details = step.transitDetails;
  const agencies = details?.transitLine?.agencies || [];
  const tfl = agencies.some(agency => {
    if (/^(transport for london|tfl|london buses)$/i.test(agency.name?.trim() || '')) return true;
    try { const host = new URL(agency.url).hostname; return host === 'tfl.gov.uk' || host.endsWith('.tfl.gov.uk'); } catch { return false; }
  });
  const geometry = path(step.path);
  const points = [...geometry, coordinate(details?.departureStop?.location), coordinate(details?.arrivalStop?.location)];
  return tfl && geometry.length >= 2 && points.every(p => p && p.lat >= 51.45 && p.lat <= 51.58 && p.lng >= -0.30 && p.lng <= 0.03);
}

function stepMode(step) {
  if (DIRECT_MODES[step.travelMode]) return DIRECT_MODES[step.travelMode];
  if (step.travelMode !== 'TRANSIT') throw new Error(`Unsupported travel mode: ${step.travelMode || 'missing'}.`);
  const vehicle = step.transitDetails?.transitLine?.vehicle?.vehicleType;
  if (vehicle === 'SUBWAY') return 'subway';
  if (vehicle === 'HEAVY_RAIL' || vehicle === 'COMMUTER_TRAIN') return 'rail';
  if (vehicle === 'BUS' && londonBus(step)) return 'bus_london';
  throw new Error(vehicle === 'BUS' ? 'Bus service or London coverage could not be confirmed.' : `Unsupported transit vehicle: ${vehicle || 'missing'}.`);
}

function transportStep(step) {
  const details = step.transitDetails;
  return {
    travelMode: step.travelMode || 'Unknown', vehicle: details?.transitLine?.vehicle?.vehicleType,
    line: details?.transitLine?.shortName || details?.transitLine?.name,
    from: details?.departureStop?.name, to: details?.arrivalStop?.name,
    departureTime: details?.departureTime instanceof Date ? details.departureTime.toISOString() : null,
    arrivalTime: details?.arrivalTime instanceof Date ? details.arrivalTime.toISOString() : null,
  };
}

export function normalizeGoogleRoute(raw, travelMode, requestContext, index = 0) {
  const legs = Array.isArray(raw?.legs) ? raw.legs : [];
  const steps = legs.flatMap(leg => Array.isArray(leg.steps) ? leg.steps : []);
  const durationMillis = validNumber(raw?.durationMillis) ? raw.durationMillis : null;
  const departure = new Date(requestContext.departureTime).getTime();
  const arrival = durationMillis !== null && Number.isFinite(departure) ? departure + durationMillis : NaN;
  const route = {
    id: `google-${requestContext.requestId || 0}-${travelMode}-${index}`,
    label: `${TITLES[travelMode] || travelMode}${index ? ` alternative ${index + 1}` : ''}`,
    source: 'google', requestContext: structuredClone(requestContext),
    distanceKm: null, durationMillis, durationMin: durationMillis === null ? null : durationMillis / 60000,
    arrivalTime: Number.isFinite(arrival) && Math.abs(arrival) <= 8640000000000000 ? new Date(arrival).toISOString() : null,
    transport: steps.map(transportStep), transfers: travelMode === 'TRANSIT' ? Math.max(0, steps.filter(s => s.travelMode === 'TRANSIT').length - 1) : null,
    geometry: path(raw?.path), segments: null, scorable: false, unavailableReason: '',
  };
  try {
    const total = raw?.distanceMeters === undefined && legs.length
      ? legs.reduce((sum, leg) => sum + distance(leg.distanceMeters), 0) : distance(raw?.distanceMeters);
    route.distanceKm = total / 1000;
    if (durationMillis === null) throw new Error('Missing or invalid total duration.');
    let segments;
    if (DIRECT_MODES[travelMode]) {
      if (steps.some(step => DIRECT_MODES[step.travelMode] !== DIRECT_MODES[travelMode])) throw new Error('Route contains an unexpected transport portion.');
      if (legs.length) reconcile(legs.reduce((sum, leg) => sum + distance(leg.distanceMeters), 0), total, legs.length);
      segments = [{ mode: DIRECT_MODES[travelMode], distanceKm: total / 1000 }];
    } else if (travelMode === 'TRANSIT') {
      if (!legs.length) throw new Error('Missing transit legs.');
      segments = [];
      for (const leg of legs) {
        if (!Array.isArray(leg.steps) || !leg.steps.length) throw new Error('Missing transport steps.');
        let legSum = 0;
        for (const step of leg.steps) {
          const metres = distance(step.distanceMeters);
          const mode = stepMode(step);
          legSum += metres;
          const previous = segments.at(-1);
          if (previous?.mode === mode) previous.distanceKm += metres / 1000;
          else segments.push({ mode, distanceKm: metres / 1000 });
        }
        reconcile(legSum, distance(leg.distanceMeters), leg.steps.length);
      }
      reconcile(segments.reduce((sum, segment) => sum + segment.distanceKm * 1000, 0), total, steps.length);
    } else throw new Error('Unsupported requested travel mode.');
    route.segments = segments;
    route.scorable = true;
  } catch (error) {
    route.unavailableReason = error.message;
  }
  return route;
}
