import { memo } from 'react';

interface ShipSVGProps {
  shipId: string;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Shared gradient definitions                                        */
/* ------------------------------------------------------------------ */
function ShipDefs({ id }: { id: string }) {
  return (
    <defs>
      {/* Hull body gradient – dark steel */}
      <linearGradient id={`${id}-hull`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a6e7f" />
        <stop offset="40%" stopColor="#4a5c6b" />
        <stop offset="100%" stopColor="#3a4a58" />
      </linearGradient>
      {/* Deck surface */}
      <linearGradient id={`${id}-deck`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#607888" />
        <stop offset="100%" stopColor="#506878" />
      </linearGradient>
      {/* Superstructure */}
      <linearGradient id={`${id}-super`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8899a8" />
        <stop offset="100%" stopColor="#6a7a88" />
      </linearGradient>
      {/* Turret */}
      <linearGradient id={`${id}-turret`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#556672" />
        <stop offset="100%" stopColor="#3e4e5a" />
      </linearGradient>
      {/* Dark accent */}
      <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a4a55" />
        <stop offset="100%" stopColor="#2a3a45" />
      </linearGradient>
      {/* Wake / water line */}
      <linearGradient id={`${id}-wake`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2a5a6a" stopOpacity="0" />
        <stop offset="30%" stopColor="#3a7a8a" stopOpacity="0.3" />
        <stop offset="70%" stopColor="#3a7a8a" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#2a5a6a" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/*  CARRIER  (5 cells)                                                 */
/* ------------------------------------------------------------------ */
function CarrierSVG({ className, style }: Omit<ShipSVGProps, 'shipId'>) {
  const id = 'carrier';
  return (
    <svg viewBox="0 0 500 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <ShipDefs id={id} />

      {/* Water wake */}
      <ellipse cx="480" cy="50" rx="25" ry="35" fill={`url(#${id}-wake)`} opacity="0.4" />

      {/* Hull */}
      <path
        d="M 15,28 L 440,12 Q 475,18 490,50 Q 475,82 440,88 L 15,72 Q 5,50 15,28 Z"
        fill={`url(#${id}-hull)`}
        stroke="#2d3d4d"
        strokeWidth="1.5"
      />

      {/* Flight deck surface */}
      <path
        d="M 25,30 L 430,16 Q 465,22 478,50 Q 465,78 430,84 L 25,70 Q 14,50 25,30 Z"
        fill={`url(#${id}-deck)`}
        opacity="0.9"
      />

      {/* Angled flight deck marking */}
      <line x1="180" y1="68" x2="380" y2="28" stroke="#8a9aaa" strokeWidth="1" strokeDasharray="8,4" opacity="0.5" />

      {/* Center runway line */}
      <line x1="40" y1="50" x2="460" y2="50" stroke="#9ab0c0" strokeWidth="0.8" strokeDasharray="12,6" opacity="0.4" />

      {/* Catapult tracks */}
      <line x1="35" y1="38" x2="160" y2="34" stroke="#7a8a98" strokeWidth="1.2" opacity="0.5" />
      <line x1="35" y1="62" x2="160" y2="58" stroke="#7a8a98" strokeWidth="1.2" opacity="0.5" />

      {/* Island superstructure (starboard) */}
      <rect x="240" y="18" width="60" height="22" rx="3" fill={`url(#${id}-super)`} stroke="#4a5a68" strokeWidth="1" />
      {/* Bridge windows */}
      <rect x="248" y="22" width="44" height="6" rx="1" fill="#2a3a4a" opacity="0.7" />
      {/* Radar mast on island */}
      <rect x="265" y="14" width="3" height="6" fill="#6a7a88" />
      <circle cx="266.5" cy="12" r="4" fill="none" stroke="#7a8a98" strokeWidth="1" opacity="0.7" />
      {/* Funnel */}
      <rect x="285" y="20" width="8" height="16" rx="1" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.5" />

      {/* Aircraft elevator outlines */}
      <rect x="100" y="35" width="30" height="30" rx="2" fill="none" stroke="#6a7a88" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
      <rect x="340" y="35" width="30" height="30" rx="2" fill="none" stroke="#6a7a88" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />

      {/* Aircraft silhouettes on deck */}
      <g opacity="0.3" fill="#4a5a68">
        <polygon points="60,42 68,38 68,46" />
        <rect x="63" y="40" width="10" height="4" rx="1" />
        <polygon points="140,55 148,51 148,59" />
        <rect x="143" y="53" width="10" height="4" rx="1" />
        <polygon points="400,42 408,38 408,46" />
        <rect x="403" y="40" width="10" height="4" rx="1" />
      </g>

      {/* Bow detail */}
      <path d="M 15,28 Q 10,50 15,72" fill="none" stroke="#6a7a88" strokeWidth="0.8" opacity="0.5" />

      {/* Waterline highlight */}
      <path
        d="M 20,28 L 440,12 Q 475,18 490,50"
        fill="none"
        stroke="#7a9aaa"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  BATTLESHIP  (4 cells)                                              */
/* ------------------------------------------------------------------ */
function BattleshipSVG({ className, style }: Omit<ShipSVGProps, 'shipId'>) {
  const id = 'battleship';
  return (
    <svg viewBox="0 0 400 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <ShipDefs id={id} />

      {/* Water wake */}
      <ellipse cx="385" cy="50" rx="20" ry="30" fill={`url(#${id}-wake)`} opacity="0.4" />

      {/* Hull */}
      <path
        d="M 12,30 L 350,16 Q 380,24 392,50 Q 380,76 350,84 L 12,70 Q 4,50 12,30 Z"
        fill={`url(#${id}-hull)`}
        stroke="#2d3d4d"
        strokeWidth="1.5"
      />

      {/* Deck */}
      <path
        d="M 20,32 L 345,20 Q 372,27 383,50 Q 372,73 345,80 L 20,68 Q 12,50 20,32 Z"
        fill={`url(#${id}-deck)`}
        opacity="0.85"
      />

      {/* Forward turret 1 (triple guns) */}
      <g>
        <ellipse cx="80" cy="50" rx="18" ry="16" fill={`url(#${id}-turret)`} stroke="#3a4a55" strokeWidth="1" />
        <rect x="85" y="42" width="40" height="3" rx="1" fill="#3e4e5a" />
        <rect x="85" y="49" width="40" height="3" rx="1" fill="#3e4e5a" />
        <rect x="85" y="56" width="40" height="3" rx="1" fill="#3e4e5a" />
        <circle cx="80" cy="50" r="5" fill="#4a5a66" stroke="#3a4a55" strokeWidth="0.5" />
      </g>

      {/* Forward turret 2 */}
      <g>
        <ellipse cx="140" cy="50" rx="16" ry="14" fill={`url(#${id}-turret)`} stroke="#3a4a55" strokeWidth="1" />
        <rect x="143" y="43" width="36" height="3" rx="1" fill="#3e4e5a" />
        <rect x="143" y="49" width="36" height="3" rx="1" fill="#3e4e5a" />
        <rect x="143" y="55" width="36" height="3" rx="1" fill="#3e4e5a" />
        <circle cx="140" cy="50" r="4" fill="#4a5a66" stroke="#3a4a55" strokeWidth="0.5" />
      </g>

      {/* Bridge superstructure */}
      <rect x="195" y="26" width="50" height="48" rx="4" fill={`url(#${id}-super)`} stroke="#4a5a68" strokeWidth="1" />
      {/* Bridge windows */}
      <rect x="200" y="30" width="40" height="5" rx="1" fill="#2a3a4a" opacity="0.7" />
      {/* Rangefinder */}
      <rect x="210" y="24" width="20" height="4" rx="1" fill="#6a7a85" />
      {/* Radar mast */}
      <rect x="218" y="16" width="4" height="10" fill="#5a6a78" />
      <circle cx="220" cy="14" r="5" fill="none" stroke="#7a8a98" strokeWidth="1" opacity="0.6" />
      {/* Funnel */}
      <rect x="250" y="30" width="14" height="28" rx="2" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.8" />
      <rect x="252" y="28" width="10" height="3" rx="1" fill="#3a4a55" />

      {/* Aft turret */}
      <g>
        <ellipse cx="310" cy="50" rx="16" ry="14" fill={`url(#${id}-turret)`} stroke="#3a4a55" strokeWidth="1" />
        <rect x="270" y="43" width="36" height="3" rx="1" fill="#3e4e5a" />
        <rect x="270" y="49" width="36" height="3" rx="1" fill="#3e4e5a" />
        <rect x="270" y="55" width="36" height="3" rx="1" fill="#3e4e5a" />
        <circle cx="310" cy="50" r="4" fill="#4a5a66" stroke="#3a4a55" strokeWidth="0.5" />
      </g>

      {/* Secondary guns (port & starboard) */}
      <circle cx="170" cy="30" r="5" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.6" />
      <circle cx="170" cy="70" r="5" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.6" />
      <circle cx="280" cy="30" r="5" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.6" />
      <circle cx="280" cy="70" r="5" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.6" />

      {/* Bow detail */}
      <path d="M 12,30 Q 8,50 12,70" fill="none" stroke="#6a7a88" strokeWidth="0.8" opacity="0.5" />

      {/* Waterline highlight */}
      <path d="M 16,30 L 350,16 Q 380,24 392,50" fill="none" stroke="#7a9aaa" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  CRUISER  (3 cells)                                                 */
/* ------------------------------------------------------------------ */
function CruiserSVG({ className, style }: Omit<ShipSVGProps, 'shipId'>) {
  const id = 'cruiser';
  return (
    <svg viewBox="0 0 300 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <ShipDefs id={id} />

      {/* Water wake */}
      <ellipse cx="288" cy="50" rx="18" ry="28" fill={`url(#${id}-wake)`} opacity="0.4" />

      {/* Hull */}
      <path
        d="M 10,32 L 255,16 Q 282,24 293,50 Q 282,76 255,84 L 10,68 Q 3,50 10,32 Z"
        fill={`url(#${id}-hull)`}
        stroke="#2d3d4d"
        strokeWidth="1.5"
      />

      {/* Deck */}
      <path
        d="M 18,34 L 250,20 Q 274,27 284,50 Q 274,73 250,80 L 18,66 Q 10,50 18,34 Z"
        fill={`url(#${id}-deck)`}
        opacity="0.85"
      />

      {/* Forward gun turret */}
      <g>
        <ellipse cx="55" cy="50" rx="14" ry="12" fill={`url(#${id}-turret)`} stroke="#3a4a55" strokeWidth="1" />
        <rect x="58" y="47" width="32" height="2.5" rx="1" fill="#3e4e5a" />
        <rect x="58" y="51" width="32" height="2.5" rx="1" fill="#3e4e5a" />
        <circle cx="55" cy="50" r="4" fill="#4a5a66" stroke="#3a4a55" strokeWidth="0.5" />
      </g>

      {/* VLS missile cells (forward) */}
      <g opacity="0.6">
        <rect x="95" y="38" width="20" height="24" rx="1" fill="#3a4a55" stroke="#4a5a65" strokeWidth="0.5" />
        {/* Grid pattern */}
        <line x1="100" y1="38" x2="100" y2="62" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="105" y1="38" x2="105" y2="62" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="110" y1="38" x2="110" y2="62" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="95" y1="44" x2="115" y2="44" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="95" y1="50" x2="115" y2="50" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="95" y1="56" x2="115" y2="56" stroke="#4a5a65" strokeWidth="0.4" />
      </g>

      {/* Bridge superstructure */}
      <rect x="130" y="28" width="45" height="44" rx="4" fill={`url(#${id}-super)`} stroke="#4a5a68" strokeWidth="1" />
      {/* Bridge windows */}
      <rect x="135" y="32" width="35" height="5" rx="1" fill="#2a3a4a" opacity="0.7" />
      {/* Radar dome (SPY-1 style phased array) */}
      <rect x="140" y="24" width="12" height="6" rx="1" fill="#6a7a88" stroke="#5a6a78" strokeWidth="0.5" />
      <rect x="155" y="24" width="12" height="6" rx="1" fill="#6a7a88" stroke="#5a6a78" strokeWidth="0.5" />
      {/* Mast */}
      <rect x="150" y="16" width="3" height="12" fill="#5a6a78" />
      <circle cx="151.5" cy="14" r="4" fill="none" stroke="#7a8a98" strokeWidth="1" opacity="0.6" />
      {/* Funnel */}
      <rect x="178" y="32" width="10" height="24" rx="2" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.6" />

      {/* Aft VLS cells */}
      <g opacity="0.6">
        <rect x="195" y="38" width="18" height="24" rx="1" fill="#3a4a55" stroke="#4a5a65" strokeWidth="0.5" />
        <line x1="201" y1="38" x2="201" y2="62" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="207" y1="38" x2="207" y2="62" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="195" y1="46" x2="213" y2="46" stroke="#4a5a65" strokeWidth="0.4" />
        <line x1="195" y1="54" x2="213" y2="54" stroke="#4a5a65" strokeWidth="0.4" />
      </g>

      {/* Helicopter deck (aft) */}
      <circle cx="240" cy="50" r="16" fill="none" stroke="#6a7a88" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
      <text x="240" y="54" textAnchor="middle" fontSize="10" fill="#6a7a88" opacity="0.4" fontFamily="monospace">H</text>

      {/* Bow detail */}
      <path d="M 10,32 Q 6,50 10,68" fill="none" stroke="#6a7a88" strokeWidth="0.8" opacity="0.5" />

      {/* Waterline */}
      <path d="M 14,32 L 255,16 Q 282,24 293,50" fill="none" stroke="#7a9aaa" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  SUBMARINE  (3 cells)                                               */
/* ------------------------------------------------------------------ */
function SubmarineSVG({ className, style }: Omit<ShipSVGProps, 'shipId'>) {
  const id = 'submarine';
  return (
    <svg viewBox="0 0 300 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Submarine-specific hull gradient – darker, more streamlined */}
        <linearGradient id={`${id}-hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4e5e" />
          <stop offset="50%" stopColor="#2e4050" />
          <stop offset="100%" stopColor="#243545" />
        </linearGradient>
        <linearGradient id={`${id}-sail`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a5e6e" />
          <stop offset="100%" stopColor="#354555" />
        </linearGradient>
        <linearGradient id={`${id}-wake`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a5a6a" stopOpacity="0" />
          <stop offset="50%" stopColor="#3a7a8a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2a5a6a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Subtle wake */}
      <ellipse cx="280" cy="50" rx="22" ry="22" fill={`url(#${id}-wake)`} opacity="0.3" />

      {/* Hull - smooth teardrop shape */}
      <path
        d="M 20,50 Q 25,22 65,22 L 250,26 Q 290,34 290,50 Q 290,66 250,74 L 65,78 Q 25,78 20,50 Z"
        fill={`url(#${id}-hull)`}
        stroke="#1e2e3e"
        strokeWidth="1.5"
      />

      {/* Hull panel lines */}
      <path d="M 65,22 L 65,78" stroke="#2a3a4a" strokeWidth="0.5" opacity="0.4" />
      <path d="M 130,24 L 130,76" stroke="#2a3a4a" strokeWidth="0.5" opacity="0.3" />
      <path d="M 200,26 L 200,74" stroke="#2a3a4a" strokeWidth="0.5" opacity="0.3" />

      {/* Torpedo tube doors (bow) */}
      <g opacity="0.5">
        <rect x="30" y="38" width="8" height="4" rx="1" fill="#2a3a48" stroke="#1e2e3e" strokeWidth="0.5" />
        <rect x="30" y="44" width="8" height="4" rx="1" fill="#2a3a48" stroke="#1e2e3e" strokeWidth="0.5" />
        <rect x="30" y="50" width="8" height="4" rx="1" fill="#2a3a48" stroke="#1e2e3e" strokeWidth="0.5" />
        <rect x="30" y="56" width="8" height="4" rx="1" fill="#2a3a48" stroke="#1e2e3e" strokeWidth="0.5" />
      </g>

      {/* Sail (conning tower) */}
      <rect x="115" y="30" width="45" height="40" rx="6" fill={`url(#${id}-sail)`} stroke="#2a3a4a" strokeWidth="1" />
      {/* Sail top details */}
      <rect x="120" y="32" width="35" height="3" rx="1" fill="#2a3a4a" opacity="0.6" />
      {/* Periscopes */}
      <rect x="128" y="26" width="2" height="6" fill="#3a4a5a" />
      <rect x="135" y="24" width="2" height="8" fill="#3a4a5a" />
      <rect x="142" y="27" width="2" height="5" fill="#3a4a5a" />
      {/* Sail planes (diving fins on sail) */}
      <rect x="110" y="46" width="8" height="3" rx="1" fill="#2e4050" stroke="#1e2e3e" strokeWidth="0.5" />
      <rect x="110" y="51" width="8" height="3" rx="1" fill="#2e4050" stroke="#1e2e3e" strokeWidth="0.5" />

      {/* Missile hatches (behind sail, for SSBN) */}
      <g opacity="0.4">
        <circle cx="175" cy="42" r="4" fill="none" stroke="#3a4a5a" strokeWidth="0.8" />
        <circle cx="185" cy="42" r="4" fill="none" stroke="#3a4a5a" strokeWidth="0.8" />
        <circle cx="195" cy="42" r="4" fill="none" stroke="#3a4a5a" strokeWidth="0.8" />
        <circle cx="175" cy="58" r="4" fill="none" stroke="#3a4a5a" strokeWidth="0.8" />
        <circle cx="185" cy="58" r="4" fill="none" stroke="#3a4a5a" strokeWidth="0.8" />
        <circle cx="195" cy="58" r="4" fill="none" stroke="#3a4a5a" strokeWidth="0.8" />
      </g>

      {/* Stern planes & rudder */}
      <rect x="268" y="32" width="12" height="4" rx="1" fill="#2e4050" stroke="#1e2e3e" strokeWidth="0.5" />
      <rect x="268" y="64" width="12" height="4" rx="1" fill="#2e4050" stroke="#1e2e3e" strokeWidth="0.5" />
      <rect x="282" y="42" width="4" height="16" rx="1" fill="#2e4050" stroke="#1e2e3e" strokeWidth="0.5" />

      {/* Propeller */}
      <circle cx="288" cy="50" r="6" fill="none" stroke="#3a4a5a" strokeWidth="0.8" opacity="0.5" />
      <line x1="285" y1="44" x2="291" y2="56" stroke="#3a4a5a" strokeWidth="1" opacity="0.4" />
      <line x1="291" y1="44" x2="285" y2="56" stroke="#3a4a5a" strokeWidth="1" opacity="0.4" />

      {/* Hull highlight (water reflection) */}
      <path
        d="M 25,30 Q 30,24 65,22 L 250,26 Q 285,32 290,45"
        fill="none"
        stroke="#5a7a8a"
        strokeWidth="0.6"
        opacity="0.25"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  DESTROYER  (2 cells)                                               */
/* ------------------------------------------------------------------ */
function DestroyerSVG({ className, style }: Omit<ShipSVGProps, 'shipId'>) {
  const id = 'destroyer';
  return (
    <svg viewBox="0 0 200 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <ShipDefs id={id} />

      {/* Water wake */}
      <ellipse cx="190" cy="50" rx="15" ry="24" fill={`url(#${id}-wake)`} opacity="0.4" />

      {/* Hull */}
      <path
        d="M 8,34 L 160,18 Q 185,26 194,50 Q 185,74 160,82 L 8,66 Q 2,50 8,34 Z"
        fill={`url(#${id}-hull)`}
        stroke="#2d3d4d"
        strokeWidth="1.5"
      />

      {/* Deck */}
      <path
        d="M 15,36 L 155,22 Q 178,29 187,50 Q 178,71 155,78 L 15,64 Q 8,50 15,36 Z"
        fill={`url(#${id}-deck)`}
        opacity="0.85"
      />

      {/* Forward gun turret */}
      <g>
        <ellipse cx="45" cy="50" rx="12" ry="11" fill={`url(#${id}-turret)`} stroke="#3a4a55" strokeWidth="1" />
        <rect x="48" y="48" width="28" height="2.5" rx="1" fill="#3e4e5a" />
        <circle cx="45" cy="50" r="3.5" fill="#4a5a66" stroke="#3a4a55" strokeWidth="0.5" />
      </g>

      {/* Bridge */}
      <rect x="78" y="30" width="32" height="40" rx="4" fill={`url(#${id}-super)`} stroke="#4a5a68" strokeWidth="1" />
      {/* Bridge windows */}
      <rect x="82" y="34" width="24" height="4" rx="1" fill="#2a3a4a" opacity="0.7" />
      {/* Mast */}
      <rect x="92" y="20" width="3" height="12" fill="#5a6a78" />
      <circle cx="93.5" cy="18" r="4" fill="none" stroke="#7a8a98" strokeWidth="0.8" opacity="0.6" />

      {/* Funnel */}
      <rect x="112" y="34" width="8" height="22" rx="2" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.6" />

      {/* Torpedo tubes (port & starboard) */}
      <g opacity="0.6">
        <rect x="70" y="28" width="6" height="3" rx="0.5" fill="#3e4e5a" transform="rotate(-15, 73, 29.5)" />
        <rect x="70" y="69" width="6" height="3" rx="0.5" fill="#3e4e5a" transform="rotate(15, 73, 70.5)" />
      </g>

      {/* Helicopter deck (aft) */}
      <circle cx="155" cy="50" r="14" fill="none" stroke="#6a7a88" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
      <text x="155" y="54" textAnchor="middle" fontSize="10" fill="#6a7a88" opacity="0.4" fontFamily="monospace">H</text>

      {/* CIWS mount */}
      <circle cx="130" cy="35" r="3.5" fill="#4a5a65" stroke="#3a4a55" strokeWidth="0.5" />
      <rect x="131" y="33" width="5" height="1.5" rx="0.5" fill="#3e4e5a" />

      {/* Bow detail */}
      <path d="M 8,34 Q 5,50 8,66" fill="none" stroke="#6a7a88" strokeWidth="0.8" opacity="0.5" />

      {/* Waterline */}
      <path d="M 12,34 L 160,18 Q 185,26 194,50" fill="none" stroke="#7a9aaa" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */
export const ShipSVG = memo(function ShipSVG({ shipId, className, style }: ShipSVGProps) {
  switch (shipId) {
    case 'carrier':
      return <CarrierSVG className={className} style={style} />;
    case 'battleship':
      return <BattleshipSVG className={className} style={style} />;
    case 'cruiser':
      return <CruiserSVG className={className} style={style} />;
    case 'submarine':
      return <SubmarineSVG className={className} style={style} />;
    case 'destroyer':
      return <DestroyerSVG className={className} style={style} />;
    default:
      return null;
  }
});
