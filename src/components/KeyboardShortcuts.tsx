import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const PLACEMENT_SHORTCUTS: Shortcut[] = [
  { keys: ['R'], description: 'Rotate ship' },
  { keys: ['\u2190', '\u2191', '\u2192', '\u2193'], description: 'Move cursor' },
  { keys: ['Enter', 'Space'], description: 'Place ship at cursor' },
];

const BATTLE_SHORTCUTS: Shortcut[] = [
  { keys: ['\u2190', '\u2191', '\u2192', '\u2193'], description: 'Move cursor' },
  { keys: ['Enter', 'Space'], description: 'Fire at cursor position' },
];

const GENERAL_SHORTCUTS: Shortcut[] = [
  { keys: ['?'], description: 'Toggle this help panel' },
];

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-400 font-mono-crt">{shortcut.description}</span>
      <div className="flex gap-1">
        {shortcut.keys.map((key) => (
          <kbd
            key={key}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono-crt text-green-400 metal-panel-light min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsProps {
  onClose: () => void;
  phase: 'placement' | 'battle' | 'gameover';
}

export function KeyboardShortcuts({ onClose, phase }: KeyboardShortcutsProps) {
  const contextShortcuts = phase === 'placement' ? PLACEMENT_SHORTCUTS : BATTLE_SHORTCUTS;
  const contextLabel = phase === 'placement' ? 'PLACEMENT' : 'BATTLE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="metal-panel rounded-lg p-5 w-full max-w-sm mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Keyboard size={18} className="text-glow-green" />
          <h2 className="text-lg font-bold font-mono-crt text-glow-green">SHORTCUTS</h2>
        </div>

        <div className="mb-3">
          <h3 className="text-[11px] text-green-500/60 font-mono-crt mb-1.5 uppercase tracking-wider">
            {contextLabel}
          </h3>
          <div className="space-y-0.5">
            {contextShortcuts.map((s) => (
              <ShortcutRow key={s.description} shortcut={s} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[11px] text-green-500/60 font-mono-crt mb-1.5 uppercase tracking-wider">
            GENERAL
          </h3>
          <div className="space-y-0.5">
            {GENERAL_SHORTCUTS.map((s) => (
              <ShortcutRow key={s.description} shortcut={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
