import type { ShipDefinition, Ship } from '../engine/types';
import { ShipSVG } from './ShipSVG';

interface EnemyFleetTrackerProps {
  shipDefs: ShipDefinition[];
  opponentShips: Ship[];
}

export function EnemyFleetTracker({ shipDefs, opponentShips }: EnemyFleetTrackerProps) {
  const sunkCount = opponentShips.filter(s => s.sunk).length;

  return (
    <div className="metal-panel rounded-lg p-3 sm:p-4 w-full max-w-[393px]">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-1 font-mono-crt text-glow-amber">
        Enemy Fleet
      </h3>
      <p className="text-[10px] text-slate-500 font-mono-crt mb-2 sm:mb-3">
        {sunkCount}/{shipDefs.length} VESSELS DESTROYED
      </p>
      <div className="space-y-1.5 sm:space-y-2">
        {shipDefs.map((def) => {
          const ship = opponentShips.find(s => s.id === def.id);
          const sunk = ship?.sunk ?? false;
          const hits = ship?.hits ?? 0;
          const hasHits = hits > 0 && !sunk;

          return (
            <div
              key={def.id}
              className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded ${
                sunk
                  ? 'metal-panel-light border-red-800/40'
                  : hasHits
                    ? 'metal-panel-light border-amber-700/30'
                    : 'metal-panel-light'
              }`}
              style={sunk ? { borderColor: 'rgba(185, 28, 28, 0.4)' } : hasHits ? { borderColor: 'rgba(180, 120, 30, 0.3)' } : undefined}
              aria-label={`${def.name}: ${sunk ? 'sunk' : hasHits ? 'damaged' : 'afloat'}`}
            >
              <div
                className="flex-shrink-0"
                style={{
                  width: `${def.size * 16}px`,
                  height: '16px',
                  opacity: sunk ? 0.3 : 0.5,
                  filter: sunk ? 'saturate(0.2) brightness(0.6)' : 'brightness(0.6) saturate(0.5)',
                }}
              >
                <ShipSVG shipId={def.id} className="w-full h-full" />
              </div>
              <span
                className={`text-xs sm:text-sm font-medium flex-1 font-mono-crt truncate ${
                  sunk
                    ? 'text-red-400 line-through'
                    : hasHits
                      ? 'text-amber-400/80'
                      : 'text-slate-500'
                }`}
              >
                {def.name}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: def.size }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm ${
                      sunk
                        ? 'bg-red-600/80'
                        : hasHits && i < hits
                          ? 'bg-amber-500/80'
                          : 'bg-slate-600/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
