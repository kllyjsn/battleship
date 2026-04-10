import type { ShipDefinition, Ship, Orientation } from '../engine/types';
import { RotateCw } from 'lucide-react';
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
}: ShipRosterProps) {
  const allPlaced = placedShips.length === shipDefs.length;

  const handleDragStart = useCallback((e: React.DragEvent, shipId: string) => {
    e.dataTransfer.setData('text/plain', shipId);
    e.dataTransfer.effectAllowed = 'move';
    onSelectShip(shipId);
  }, [onSelectShip]);

  if (mode === 'battle') {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-cyan-900/30 p-4 backdrop-blur">
        <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-widest mb-3">
          Fleet Status
        </h3>
        <div className="space-y-2">
          {shipDefs.map((def) => {
            const ship = placedShips.find((s) => s.id === def.id);
            const sunk = ship?.sunk ?? false;
            return (
              <div
                key={def.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  sunk
                    ? 'bg-red-900/30 border border-red-800/40'
                    : 'bg-slate-800/50 border border-slate-700/30'
                }`}
              >
                {/* Ship image */}
                <div
                  className="flex-shrink-0"
                  style={{
                    width: `${def.size * 18}px`,
                    height: '18px',
                    opacity: sunk ? 0.3 : 0.8,
                    filter: sunk ? 'saturate(0.2) brightness(0.6)' : undefined,
                  }}
                >
                  <ShipSVG shipId={def.id} className="w-full h-full" />
                </div>
                <span
                  className={`text-sm font-medium flex-1 ${sunk ? 'text-red-400 line-through' : 'text-slate-200'}`}
                >
                  {def.name}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: def.size }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-sm ${
                        sunk
                          ? 'bg-red-600/80'
                          : ship && i < (ship.hits ?? 0)
                            ? 'bg-orange-500/80'
                            : 'bg-slate-500/60'
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
    <div className="bg-slate-900/60 rounded-xl border border-cyan-900/30 p-4 backdrop-blur">
      <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-widest mb-3">
        Place Your Fleet
      </h3>
      <p className="text-xs text-slate-400 mb-3">Click to select, then click board to place. Or drag ships directly onto the board. Press <kbd className="px-1 py-0.5 bg-slate-700/60 rounded text-cyan-300 text-xs">R</kbd> to rotate.</p>

      <div className="space-y-2 mb-4">
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
              tabIndex={placed ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !placed) onSelectShip(def.id);
              }}
              className={`w-full flex flex-col gap-2 px-3 py-2.5 rounded-lg transition-all ${
                placed
                  ? 'bg-emerald-900/30 border border-emerald-700/40 opacity-70'
                  : selected
                    ? 'bg-cyan-800/50 border border-cyan-500/60 ring-1 ring-cyan-400/40 cursor-grab'
                    : 'bg-slate-800/50 border border-slate-700/30 hover:border-cyan-700/40 cursor-grab'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${placed ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {def.name}
                </span>
                <span className="text-xs text-slate-500">{def.size} cells</span>
              </div>
              {/* Ship image preview */}
              <div
                className="w-full flex justify-center"
                style={{
                  height: '24px',
                  opacity: placed ? 0.4 : selected ? 1 : 0.7,
                  filter: placed ? 'saturate(0.3)' : undefined,
                  transition: 'opacity 0.15s, filter 0.15s',
                }}
              >
                <div style={{ width: `${Math.min(def.size * 36, 180)}px`, height: '100%' }}>
                  <ShipSVG shipId={def.id} className="w-full h-full" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={onRotate}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-600/40 rounded-lg text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-500/50 transition-all"
        >
          <RotateCw size={14} />
          {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
        </button>
        <button
          onClick={onRandomize}
          className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-600/40 rounded-lg text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-500/50 transition-all"
        >
          Randomize
        </button>
      </div>

      <button
        onClick={onReady}
        disabled={!allPlaced || isReady}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
          allPlaced && !isReady
            ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-900/30'
            : 'bg-slate-800/40 text-slate-500 border border-slate-700/30 cursor-not-allowed'
        }`}
      >
        {isReady ? 'Waiting for opponent...' : allPlaced ? 'Ready for Battle!' : 'Place all ships to continue'}
      </button>
    </div>
  );
}
