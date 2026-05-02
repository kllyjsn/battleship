import type { ShipDefinition, Ship, Orientation } from '../engine/types';
import { RotateCw, Undo2 } from 'lucide-react';
import { ShipSVG } from './ShipSVG';
import React, { useCallback } from 'react';

interface ShipRosterProps {
  shipDefs: ShipDefinition[];
  placedShips: Ship[];
  selectedShipId: string | null;
  orientation: Orientation;
  onSelectShip: (id: string) => void;
  onRotate: () => void;
  onRandomize: () => void;
  onReady: () => void;
  isReady: boolean;
  mode: 'placement' | 'battle';
  onUndoShip?: () => void;
}

export function ShipRoster({
  shipDefs,
  placedShips,
  selectedShipId,
  orientation,
  onSelectShip,
  onRotate,
  onRandomize,
  onReady,
  isReady,
  mode,
  onUndoShip,
}: ShipRosterProps) {
  const allPlaced = placedShips.length === shipDefs.length;
  const hasPlacedShips = placedShips.length > 0;

  const handleDragStart = useCallback((e: React.DragEvent, shipId: string) => {
    e.dataTransfer.setData('text/plain', shipId);
    e.dataTransfer.effectAllowed = 'move';
    onSelectShip(shipId);
  }, [onSelectShip]);

  if (mode === 'battle') {
    return (
        <div className="metal-panel rounded-lg p-3 sm:p-4 w-full max-w-[393px]">
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-2 sm:mb-3 font-mono-crt text-glow-green">
            Fleet Status
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            {shipDefs.map((def) => {
              const ship = placedShips.find((s) => s.id === def.id);
              const sunk = ship?.sunk ?? false;
              return (
                <div
                  key={def.id}
                  className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded ${
                    sunk
                      ? 'metal-panel-light border-red-800/40'
                      : 'metal-panel-light'
                  }`}
                  style={sunk ? { borderColor: 'rgba(185, 28, 28, 0.4)' } : undefined}
                >
                  {/* Ship image */}
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: `${def.size * 16}px`,
                      height: '16px',
                      opacity: sunk ? 0.3 : 0.8,
                      filter: sunk ? 'saturate(0.2) brightness(0.6)' : undefined,
                    }}
                  >
                    <ShipSVG shipId={def.id} className="w-full h-full" />
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium flex-1 font-mono-crt truncate ${sunk ? 'text-red-400 line-through' : 'text-green-300/80'}`}
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
                            : ship && i < (ship.hits ?? 0)
                              ? 'bg-amber-500/80'
                              : 'bg-green-500/20'
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

  return (
    <div className="metal-panel rounded-lg p-3 sm:p-4 w-full max-w-[393px]">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-2 sm:mb-3 font-mono-crt text-glow-green">
        Place Your Fleet
      </h3>
      <p className="text-[11px] sm:text-xs text-slate-500 mb-2 sm:mb-3 font-mono-crt leading-relaxed">Tap to select, then tap board to place. Press <kbd className="px-1 py-0.5 metal-panel-light rounded text-green-400 text-[11px] sm:text-xs font-mono-crt">R</kbd> to rotate.</p>

      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        {shipDefs.map((def) => {
          const placed = placedShips.some((s) => s.id === def.id);
          const selected = selectedShipId === def.id;
          return (
            <div
              key={def.id}
              draggable={!placed}
              onDragStart={!placed ? (e) => handleDragStart(e, def.id) : undefined}
              onClick={() => !placed && onSelectShip(def.id)}
              role="button"
              aria-pressed={!placed && selected}
              aria-disabled={placed}
              aria-label={`${def.name} (size ${def.size})${placed ? ' — placed' : selected ? ' — selected' : ''}`}
              tabIndex={placed ? -1 : 0}
              onKeyDown={(e) => {
                // ARIA buttons should activate on Enter and Space
                if ((e.key === 'Enter' || e.key === ' ') && !placed) {
                  e.preventDefault();
                  onSelectShip(def.id);
                }
              }}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded transition-all ${
                placed
                  ? 'metal-panel-light opacity-70'
                  : selected
                    ? 'metal-panel-light ring-1 ring-green-400/40 cursor-grab'
                    : 'metal-panel-light hover:ring-1 hover:ring-green-500/20 cursor-grab'
              }`}
              style={placed ? { borderColor: 'rgba(34, 197, 94, 0.3)' } : selected ? { borderColor: 'rgba(57, 255, 20, 0.4)' } : undefined}
            >
              {/* Ship image preview */}
              <div
                className="flex-shrink-0"
                style={{
                  width: `${Math.min(def.size * 24, 120)}px`,
                  height: '20px',
                  opacity: placed ? 0.4 : selected ? 1 : 0.7,
                  filter: placed ? 'saturate(0.3)' : undefined,
                  transition: 'opacity 0.15s, filter 0.15s',
                }}
              >
                <ShipSVG shipId={def.id} className="w-full h-full" />
              </div>
              <span className={`text-xs sm:text-sm font-medium font-mono-crt flex-1 truncate ${placed ? 'text-green-500/70' : 'text-green-300/80'}`}>
                {def.name}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-mono-crt flex-shrink-0">{def.size}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-2 sm:mb-3">
        <button
          onClick={onRotate}
          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 metal-panel-light rounded text-xs sm:text-sm text-green-300/70 hover:text-green-300 transition-all font-mono-crt"
          title="Rotate ship orientation (R)"
        >
          <RotateCw size={14} />
          {orientation === 'horizontal' ? 'Horiz' : 'Vert'}
          <kbd className="ml-0.5 sm:ml-1 px-1 py-0.5 metal-panel rounded text-[10px] text-green-400/70 font-mono-crt">R</kbd>
        </button>
        <button
          onClick={onRandomize}
          className="flex-1 px-2 sm:px-3 py-2 metal-panel-light rounded text-xs sm:text-sm text-green-300/70 hover:text-green-300 transition-all font-mono-crt"
        >
          Randomize
        </button>
      </div>

      {onUndoShip && (
        <button
          onClick={onUndoShip}
          disabled={!hasPlacedShips || isReady}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 sm:mb-3 metal-panel-light rounded text-xs sm:text-sm transition-all font-mono-crt ${
            hasPlacedShips && !isReady
              ? 'text-amber-400/80 hover:text-amber-300 hover:ring-1 hover:ring-amber-400/30'
              : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Undo2 size={14} />
          Undo Last Ship
        </button>
      )}

      <button
        onClick={onReady}
        disabled={!allPlaced || isReady}
        className={`w-full py-2.5 rounded text-xs sm:text-sm font-semibold transition-all font-mono-crt ${
          allPlaced && !isReady
            ? 'text-glow-green metal-panel-light hover:ring-1 hover:ring-green-400/40'
            : 'metal-panel-light text-slate-600 cursor-not-allowed'
        }`}
        style={allPlaced && !isReady ? { borderColor: 'rgba(57, 255, 20, 0.3)' } : undefined}
      >
        {isReady ? 'STANDING BY...' : allPlaced ? 'BATTLE STATIONS' : 'DEPLOY ALL VESSELS'}
      </button>
    </div>
  );
}
