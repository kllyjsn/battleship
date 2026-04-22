import { X } from 'lucide-react';
import { getAllThemes, getTheme, saveTheme, applyTheme } from '../lib/themes';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface ThemeSelectorProps {
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
  onClose: () => void;
}

export function ThemeSelector({ currentTheme, onSelectTheme, onClose }: ThemeSelectorProps) {
  useEscapeKey(onClose);
  const themes = getAllThemes();

  const handleSelect = (themeId: string) => {
    saveTheme(themeId);
    applyTheme(themeId);
    onSelectTheme(themeId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="metal-panel rounded-lg p-6 w-full max-w-lg mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold font-mono-crt text-glow-green mb-1 text-center">
          BOARD THEMES
        </h2>
        <p className="text-xs text-slate-500 font-mono-crt text-center mb-4">
          Select a visual theme for your boards
        </p>

        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => {
            const t = getTheme(theme.id);
            const isSelected = theme.id === currentTheme;

            return (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`metal-panel-light rounded-lg p-3 text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-green-400/60 shadow-lg shadow-green-500/10'
                    : 'hover:ring-1 hover:ring-slate-500/50'
                }`}
              >
                {/* 3x3 Preview Grid */}
                <div
                  className="grid grid-cols-3 gap-0.5 w-16 h-16 mx-auto mb-2 rounded overflow-hidden border"
                  style={{ borderColor: t.vars['--board-border'], background: t.vars['--board-bg'] }}
                >
                  {/* Row 1: empty, hit, empty */}
                  <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                  <div style={{ background: t.vars['--cell-hit'] }} className="border border-red-700/30" />
                  <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                  {/* Row 2: ship, empty, miss */}
                  <div style={{ background: t.vars['--cell-ship'], borderColor: t.vars['--cell-ship-border'] }} className="border" />
                  <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                  <div style={{ background: t.vars['--cell-miss'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                  {/* Row 3: empty, sunk, ship */}
                  <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                  <div style={{ background: t.vars['--cell-sunk'] }} className="border border-red-700/30" />
                  <div style={{ background: t.vars['--cell-ship'], borderColor: t.vars['--cell-ship-border'] }} className="border" />
                </div>

                <div className="text-center">
                  <div
                    className="text-sm font-bold font-mono-crt"
                    style={{ color: t.vars['--text-primary'] }}
                  >
                    {theme.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono-crt">
                    {theme.description}
                  </div>
                </div>

                {isSelected && (
                  <div className="text-center mt-1">
                    <span className="text-[9px] font-mono-crt text-glow-green uppercase tracking-widest">
                      Active
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
