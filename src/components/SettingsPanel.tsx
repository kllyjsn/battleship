import { useState } from 'react';
import { X, Volume2, VolumeX, Music, Trash2, User } from 'lucide-react';
import { STORAGE_KEYS, getSessionName, setSessionName, getApiBase, isSoundEnabled } from '../lib/storageKeys';
import { clearStats } from '../lib/stats';
import { getAllThemes, getTheme, saveTheme, applyTheme } from '../lib/themes';
import { ConfirmDialog } from './ConfirmDialog';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface SettingsPanelProps {
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
  onClose: () => void;
}

export function SettingsPanel({ currentTheme, onSelectTheme, onClose }: SettingsPanelProps) {
  const [callsign, setCallsign] = useState(getSessionName());
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled);
  const [confirmAction, setConfirmAction] = useState<'stats' | 'achievements' | 'all' | null>(null);
  const themes = getAllThemes();
  // Disable Escape-to-close while a confirmation dialog is open so Escape dismisses the dialog first.
  useEscapeKey(onClose, confirmAction === null);

  const handleCallsignChange = (value: string) => {
    setCallsign(value);
    setSessionName(value);
  };

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, newState ? 'false' : 'true');
    } catch {
      // Storage unavailable
    }
    // Primary persistence: sync to MongoDB
    const playerName = getSessionName();
    if (playerName) {
      fetch(`${getApiBase()}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, soundMuted: !newState }),
      }).catch(() => {});
    }
  };

  const handleThemeSelect = (themeId: string) => {
    saveTheme(themeId);
    applyTheme(themeId);
    onSelectTheme(themeId);
  };

  const handleConfirmClear = () => {
    const playerName = getSessionName();
    if (confirmAction === 'stats') {
      clearStats();
    } else if (confirmAction === 'achievements') {
      try { localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS); } catch { /* ignore */ }
      // Clear on MongoDB too
      if (playerName) {
        fetch(`${getApiBase()}/achievements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName, unlocked: [] }),
        }).catch(() => {});
      }
    } else if (confirmAction === 'all') {
      clearStats();
      try {
        localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
        localStorage.removeItem(STORAGE_KEYS.LEADERBOARD);
        localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
      } catch {
        // ignore
      }
      // Clear on MongoDB too
      if (playerName) {
        Promise.all([
          fetch(`${getApiBase()}/achievements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, unlocked: [] }),
          }),
          fetch(`${getApiBase()}/game-save?player=${encodeURIComponent(playerName)}`, {
            method: 'DELETE',
          }),
        ]).catch(() => {});
      }
    }
    setConfirmAction(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      onClick={onClose}
    >
      <div
        className="metal-panel rounded-lg p-6 w-full max-w-lg mx-4 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 id="settings-dialog-title" className="text-xl font-bold font-mono-crt text-glow-green mb-1 text-center">
          SETTINGS
        </h2>
        <p className="text-xs text-slate-500 font-mono-crt text-center mb-5">
          Configure your command center
        </p>

        {/* ── Callsign ── */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-sm text-green-500/60 font-mono-crt mb-1.5">
            <User size={14} />
            CALLSIGN
          </label>
          <input
            type="text"
            value={callsign}
            onChange={(e) => handleCallsignChange(e.target.value)}
            placeholder="Enter callsign"
            maxLength={20}
            className="w-full px-4 py-2.5 rounded font-mono-crt text-green-300 placeholder-slate-600 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all"
            style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
          />
          <p className="text-[10px] text-slate-600 font-mono-crt mt-1">
            Displayed on leaderboards and in multiplayer
          </p>
        </div>

        {/* ── Audio ── */}
        <div className="mb-5">
          <h3 className="text-sm text-green-500/60 font-mono-crt mb-2 flex items-center gap-2">
            <Music size={14} />
            AUDIO
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleSoundToggle}
              className={`w-full flex items-center justify-between px-4 py-3 rounded metal-panel-light transition-all ${
                soundEnabled ? 'ring-1 ring-green-500/30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 size={18} className="text-green-400" /> : <VolumeX size={18} className="text-slate-500" />}
                <span className="text-sm font-mono-crt text-slate-300">Sound Effects</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${soundEnabled ? 'bg-green-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* ── Board Theme ── */}
        <div className="mb-5">
          <h3 className="text-sm text-green-500/60 font-mono-crt mb-2">BOARD THEME</h3>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => {
              const t = getTheme(theme.id);
              const isSelected = theme.id === currentTheme;

              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
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
                    <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                    <div style={{ background: t.vars['--cell-hit'] }} className="border border-red-700/30" />
                    <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                    <div style={{ background: t.vars['--cell-ship'], borderColor: t.vars['--cell-ship-border'] }} className="border" />
                    <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                    <div style={{ background: t.vars['--cell-miss'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                    <div style={{ background: t.vars['--cell-empty'], borderColor: t.vars['--cell-empty-border'] }} className="border" />
                    <div style={{ background: t.vars['--cell-sunk'] }} className="border border-red-700/30" />
                    <div style={{ background: t.vars['--cell-ship'], borderColor: t.vars['--cell-ship-border'] }} className="border" />
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-bold font-mono-crt" style={{ color: t.vars['--text-primary'] }}>
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

        {/* ── Data Management ── */}
        <div>
          <h3 className="text-sm text-red-500/60 font-mono-crt mb-2 flex items-center gap-2">
            <Trash2 size={14} />
            DATA MANAGEMENT
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setConfirmAction('stats')}
              className="w-full flex items-center justify-between px-4 py-3 rounded metal-panel-light hover:ring-1 hover:ring-red-500/30 transition-all"
            >
              <span className="text-sm font-mono-crt text-slate-400">Clear Game Stats</span>
              <Trash2 size={14} className="text-red-500/50" />
            </button>
            <button
              onClick={() => setConfirmAction('achievements')}
              className="w-full flex items-center justify-between px-4 py-3 rounded metal-panel-light hover:ring-1 hover:ring-red-500/30 transition-all"
            >
              <span className="text-sm font-mono-crt text-slate-400">Clear Achievements</span>
              <Trash2 size={14} className="text-red-500/50" />
            </button>
            <button
              onClick={() => setConfirmAction('all')}
              className="w-full flex items-center justify-between px-4 py-3 rounded metal-panel-light hover:ring-1 hover:ring-red-500/30 transition-all"
            >
              <span className="text-sm font-mono-crt text-red-400">Reset All Data</span>
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {confirmAction === 'stats' && (
        <ConfirmDialog
          title="CLEAR STATS"
          message="This will permanently erase all your game history and win streaks. This action cannot be undone."
          confirmLabel="PURGE"
          cancelLabel="ABORT"
          onConfirm={handleConfirmClear}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'achievements' && (
        <ConfirmDialog
          title="CLEAR ACHIEVEMENTS"
          message="This will permanently reset all unlocked medals. You will need to earn them again."
          confirmLabel="PURGE"
          cancelLabel="ABORT"
          onConfirm={handleConfirmClear}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'all' && (
        <ConfirmDialog
          title="RESET ALL DATA"
          message="This will erase ALL local data: stats, achievements, leaderboard entries, and saved games. This cannot be undone."
          confirmLabel="PURGE ALL"
          cancelLabel="ABORT"
          onConfirm={handleConfirmClear}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
