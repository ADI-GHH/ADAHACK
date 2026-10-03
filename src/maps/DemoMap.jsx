import React from 'react';
import Icon from '../ui/Icon';

// Authored schematic, not provider tiles, a real route, or a user's GPS location.
export default function DemoMap() {
  const [zoom, setZoom] = React.useState(1);
  const streets = [
    'M-30 95 270 135 570 75 1030 130', 'M-30 220 220 240 510 195 1030 250',
    'M-30 365 230 320 540 335 1040 355', 'M-20 590 330 565 600 625 1020 560',
    'M110-20 160 205 95 375 185 700', 'M330-20 300 215 370 370 345 700',
    'M525-20 480 230 545 425 540 700', 'M740-20 705 215 740 395 780 700',
    'M950-20 905 225 980 420 925 700', 'M-20 35 465 430 1000 655',
    'M270-20 585 250 1060 530', 'M0 505 360 215 700-20',
    'M600 700 760 470 1040 330',
  ];
  return <div className="demo-map" role="region" aria-label="Illustrated London demo map">
    <svg className="city-illustration" viewBox="0 0 1000 660" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1000" height="660" fill="#edece3"/>
      <g style={{ transform: `translate(500px, 330px) scale(${zoom}) translate(-500px, -330px)` }}>
        <g fill="#e0e1d8" stroke="#e8e9e0" strokeWidth="4">
          {Array.from({ length: 9 }, (_, column) => Array.from({ length: 6 }, (_, row) =>
            <rect key={`${column}-${row}`} x={column * 125 - 20} y={row * 125 - 25} width={83} height={72} rx="8" transform={`rotate(${column % 2 ? -8 : 8} ${column * 125} ${row * 125})`}/>))}
        </g>
        <path d="m70 200 148 20 25 73-150 18Z" fill="#c2d8ac"/>
        <path d="m595 92 85 9-11 78-79-9Z" fill="#c2d8ac"/>
        <path d="m785 542 140-27 27 130-143 5Z" fill="#c2d8ac"/>
        <g stroke="#d3d4c9" strokeWidth="21" fill="none">{streets.map((d,i)=><path d={d} key={i}/>)}</g>
        <g stroke="#fafaf4" strokeWidth="16" fill="none">{streets.map((d,i)=><path d={d} key={i}/>)}</g>
        <path d="M-30 450C110 490 190 485 300 459S450 399 550 437 635 541 760 493 840 440 1030 463" stroke="#a7cbd0" strokeWidth="76" fill="none"/>
        <path d="M-30 450C110 490 190 485 300 459S450 399 550 437 635 541 760 493 840 440 1030 463" stroke="#b9d8da" strokeWidth="65" fill="none"/>
        <g stroke="#cdcec1" strokeWidth="17"><path d="m300 420 24 90"/><path d="m542 395 29 100"/><path d="m742 435 27 109"/></g>
        <g stroke="#fafaf4" strokeWidth="12"><path d="m300 420 24 90"/><path d="m542 395 29 100"/><path d="m742 435 27 109"/></g>
        <g fill="#8c9684" fontFamily="Manrope, sans-serif" fontSize="13" fontWeight="650" letterSpacing="2">
          <text x="240" y="185">CLERKENWELL</text><text x="736" y="65">SHOREDITCH</text>
          <text x="454" y="313">THE CITY</text><text x="475" y="594">SOUTHWARK</text>
          <text x="66" y="405">HOLBORN</text><text x="846" y="397">WHITECHAPEL</text>
        </g>
        <text x="616" y="137" textAnchor="middle" fill="#719166" fontSize="9" fontFamily="Manrope, sans-serif">FINSBURY</text>
        <text x="616" y="151" textAnchor="middle" fill="#719166" fontSize="9" fontFamily="Manrope, sans-serif">SQUARE</text>
        <text x="245" y="474" fill="#729ea5" fontFamily="Manrope, sans-serif" fontSize="12" transform="rotate(-9 245 474)" letterSpacing="5">RIVER THAMES</text>
        <circle cx="684" cy="272" r="43" fill="#cbe998" opacity=".45"/>
        <circle cx="684" cy="272" r="23" fill="#173e2e" stroke="#fff" strokeWidth="5"/>
        <path d="M678 281v-18h12v18m-15 0h18m-12-14h2m-2 5h2m-2 5h2" fill="none" stroke="#dcf4aa" strokeWidth="2" strokeLinecap="round"/>
        <g transform="translate(611 204)">
          <rect width="146" height="36" rx="14" fill="#173e2e"/>
          <path d="m64 35 9 10 9-10" fill="#173e2e"/>
          <text x="73" y="25" textAnchor="middle" fill="#f4f8e9" fontFamily="Manrope, sans-serif" fontSize="19" fontWeight="700">Office</text>
        </g>
      </g>
    </svg>
    <div className="map-place-label"><span className="eyebrow">THE NEIGHBOURHOOD</span><strong>London.</strong></div>
    <div className="map-compass" aria-hidden="true"><span>N</span>↑</div>
    <div className="map-zoom-controls">
      <button aria-label="Zoom in on demo map" disabled={zoom >= 1.8} onClick={() => setZoom(value => Math.min(1.8, value + .2))}><Icon name="plus" size={19}/></button>
      <button aria-label="Zoom out on demo map" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .2))}><Icon name="minus" size={19}/></button>
      <button aria-label="Reset demo map view" onClick={() => setZoom(1)}><Icon name="focus" size={19}/></button>
    </div>
    <span className="map-demo-caption">Illustrated demo map · no live route geometry</span>
  </div>;
}
