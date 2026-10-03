import React from 'react';

const paths = {
  commute: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/></>,
  activity: <><path d="M4 5v5h5"/><path d="M5 10a8 8 0 1 1 0 5"/><path d="M12 8v5l3 2"/></>,
  leaderboard: <><path d="M8 3h8v6a4 4 0 0 1-8 0Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 13v5m-4 3h8m-8-3h8"/></>,
  company: <><path d="M5 21V7l8-4v18m0-11h6v11M3 21h18"/><path d="M8 8h2m-2 4h2m-2 4h2m6-3h1m-1 4h1"/></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  walk: <><circle cx="13" cy="4" r="2"/><path d="m7 12 3-5 4 1 3 5m-5-5-2 7-4 6m4-6 5 6"/></>,
  cycle: <><circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 6-10 8 10H5l-3-8h4m8-5h3l2 3"/></>,
  car: <><path d="m4 10 2-5h12l2 5M3 10h18v8H3Zm2 8v3m14-3v3M6 14h2m8 0h2"/></>,
  transit: <><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M9 3v7m-1 8-2 3m10-3 2 3M8 14h1m6 0h1"/></>,
  leaf: <><path d="M19 3c-7 0-14 2-14 9a6 6 0 0 0 6 6c7 0 8-8 8-15Z"/><path d="m4 21 10-10"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  focus: <><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
};

export default function Icon({ name, size = 22, className = '' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name] || paths.commute}</svg>;
}

export function StreetMark() {
  return <img className="brand-mark" src="/green-street.svg" width="36" height="36" alt="" aria-hidden="true"/>;
}
