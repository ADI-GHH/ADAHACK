const londonParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function londonInputValue(date = new Date()) {
  const parts = Object.fromEntries(londonParts.formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// Resolve a London wall-clock value independently of the browser's time zone.
// Reject the spring DST gap; pick the earlier occurrence in the autumn overlap.
export function parseLondonDeparture(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Choose a valid departure time.');
  const utc = new Date(`${value}:00Z`).getTime();
  const candidates = [utc - 3600000, utc].map(ms => new Date(ms));
  const date = candidates.find(d => Number.isFinite(d.getTime()) && londonInputValue(d) === value);
  if (!date) throw new Error('This London time does not exist. Choose another time.');
  return date;
}

export function formatLondonTime(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(value));
}
