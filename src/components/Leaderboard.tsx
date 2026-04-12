import { useState, useMemo, useEffect } from 'react';
import { X, Trophy, Globe, Monitor, Loader2 } from 'lucide-react';
import { getLeaderboard, getOnlineLeaderboard } from '../lib/leaderboard';
import type { LeaderboardEntry, Period } from '../lib/leaderboard';

interface LeaderboardProps {
  onClose: () => void;
}

type Source = 'local' | 'global';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'day', label: 'TODAY' },
  { key: 'week', label: 'THIS WEEK' },
  { key: 'month', label: 'THIS MONTH' },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getRankColor(index: number): string {
  if (index === 0) return 'text-yellow-400';
  if (index === 1) return 'text-slate-300';
  if (index === 2) return 'text-amber-600';
  return 'text-slate-500';
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-slate-500 font-mono-crt py-8">
        No scores yet for this period. Be the first!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono-crt">
        <thead>
          <tr className="text-green-500/60 border-b border-slate-700">
            <th className="py-2 px-2 text-left">#</th>
            <th className="py-2 px-2 text-left">Player</th>
            <th className="py-2 px-2 text-center">Score</th>
            <th className="py-2 px-2 text-center">Acc%</th>
            <th className="py-2 px-2 text-center">W/L</th>
            <th className="py-2 px-2 text-center">Shots</th>
            <th className="py-2 px-2 text-center">Time</th>
            <th className="py-2 px-2 text-center">Mode</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr
              key={entry.id}
              className="border-b border-slate-700/50"
            >
              <td className={`py-2 px-2 font-bold ${getRankColor(index)}`}>
                {index + 1}
              </td>
              <td className="py-2 px-2 text-slate-300">
                {entry.playerName}
              </td>
              <td className="py-2 px-2 text-center text-glow-amber font-bold">
                {entry.totalScore ?? 0}
              </td>
              <td className="py-2 px-2 text-center text-slate-400">
                {entry.score.toFixed(1)}%
              </td>
              <td className="py-2 px-2 text-center">
                <span className={entry.won !== false ? 'text-green-400' : 'text-red-400'}>
                  {entry.won !== false ? 'W' : 'L'}
                </span>
              </td>
              <td className="py-2 px-2 text-center text-slate-400">
                {entry.shots}
              </td>
              <td className="py-2 px-2 text-center text-slate-400">
                {formatDuration(entry.durationSeconds)}
              </td>
              <td className="py-2 px-2 text-center">
                <span className={`text-xs ${entry.mode === 'single' ? 'text-green-400' : 'text-amber-400'}`}>
                  {entry.mode === 'single'
                    ? (entry.difficulty === 'easy' ? 'REC' : entry.difficulty === 'medium' ? 'CPT' : 'ADM')
                    : 'PVP'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [period, setPeriod] = useState<Period>('day');
  const [source, setSource] = useState<Source>('local');
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const localEntries: LeaderboardEntry[] = useMemo(() => getLeaderboard(period), [period]);

  useEffect(() => {
    if (source !== 'global') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getOnlineLeaderboard(period).then(data => {
      if (!cancelled) {
        setGlobalEntries(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [source, period]);

  const entries = source === 'local' ? localEntries : globalEntries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="metal-panel rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fadeIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-green-400 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-center font-mono-crt text-glow-amber mb-4">
          <Trophy size={22} className="inline-block mr-2 -mt-1" />
          LEADERBOARD
        </h2>

        {/* Source tabs: Local / Global */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setSource('local')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono-crt transition-all ${
              source === 'local'
                ? 'metal-panel text-glow-green border-green-500/40'
                : 'metal-panel-light text-slate-500 hover:text-slate-300'
            }`}
          >
            <Monitor size={12} />
            LOCAL
          </button>
          <button
            onClick={() => setSource('global')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono-crt transition-all ${
              source === 'global'
                ? 'metal-panel text-glow-green border-green-500/40'
                : 'metal-panel-light text-slate-500 hover:text-slate-300'
            }`}
          >
            <Globe size={12} />
            GLOBAL
          </button>
        </div>

        {/* Period tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {PERIOD_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-1.5 rounded text-xs font-mono-crt transition-all ${
                period === key
                  ? 'metal-panel text-glow-amber border-amber-500/40'
                  : 'metal-panel-light text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500 font-mono-crt">
            <Loader2 size={16} className="animate-spin" />
            Loading global scores...
          </div>
        ) : (
          <LeaderboardTable entries={entries} />
        )}
      </div>
    </div>
  );
}
