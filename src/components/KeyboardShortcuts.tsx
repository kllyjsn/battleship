import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import type { GamePhase } from '../engine/types';

interface KeyboardShortcutsProps {
  phase: GamePhase;
}

const SHORTCUTS = {
  placement: [
    { keys: ['Arrow Keys'], desc: 'Move cursor' },
    { keys: ['R'], desc: 'Rotate ship' },
    { keys: ['Enter', 'Space'], desc: 'Place ship' },
    { keys: ['Swipe'], desc: 'Rotate (touch)' },
  ],
  battle: [
    { keys: ['Arrow Keys'], desc: 'Move cursor' },
    { keys: ['Enter', 'Space'], desc: 'Fire shot' },
  ],
};

export function KeyboardShortcuts({ phase }: KeyboardShortcutsProps) {
  const [open, setOpen] = useState(false);

  if (phase === 'gameover') return null;

  const shortcuts = phase === 'placement' ? SHORTCUTS.placement : SHORTCUTS.battle;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-40 w-8 h-8 flex items-center justify-center rounded-full metal-panel-light text-slate-500 hover:text-green-400 transition-colors"
        title="Keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setOpen(false)}>
          <div className="metal-panel rounded-xl p-5 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest font-mono-crt text-glow-green">
                Controls
              </h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-green-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.desc} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-mono-crt">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd key={k} className="px-1.5 py-0.5 metal-panel-light rounded text-[10px] text-green-400/70 font-mono-crt">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
