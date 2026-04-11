import { useState, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell as RechartsCell } from 'recharts';
import { loadStats, clearStats, getStatsOverview } from '../lib/stats';

interface StatsPanelProps {
  onClose: () => void;
}

export function StatsPanel({ onClose }: StatsPanelProps) {
  const [stats, setStats] = useState(() => loadStats());
  const [confirmClear, setConfirmClear] = useState(false);
  const overview = useMemo(() => getStatsOverview(stats), [stats]);

  const handleClear = () => {
    if (confirmClear) {
      clearStats();
      setStats(loadStats());
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const chartData = [
    { name: 'Easy', wins: overview.perDifficulty.easy.wins, losses: overview.perDifficulty.easy.losses },
    { name: 'Medium', wins: overview.perDifficulty.medium.wins, losses: overview.perDifficulty.medium.losses },
    { name: 'Hard', wins: overview.perDifficulty.hard.wins, losses: overview.perDifficulty.hard.losses },
  ];

  const hasChartData = chartData.some((d) => d.wins > 0 || d.losses > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="metal-panel rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-mono-crt text-glow-green">COMBAT LOG</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-green-400 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {overview.totalGames === 0 ? (
          <p className="text-center text-slate-500 font-mono-crt py-8">NO ENGAGEMENTS RECORDED</p>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <StatBox label="BATTLES" value={overview.totalGames} />
              <StatBox label="WIN RATE" value={`${overview.winRate.toFixed(0)}%`} />
              <StatBox label="ACCURACY" value={`${overview.accuracy.toFixed(0)}%`} />
              <StatBox label="WINS" value={overview.wins} color="green" />
              <StatBox label="STREAK" value={overview.currentStreak} />
              <StatBox label="BEST STREAK" value={overview.bestStreak} color="amber" />
            </div>

            {/* Per-Difficulty Chart */}
            {hasChartData && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-green-500/60 font-mono-crt mb-3">SINGLE PLAYER</h3>
                <div className="metal-panel-light rounded-lg p-3" style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#4a5568', fontSize: 11, fontFamily: 'Share Tech Mono' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1f2e',
                          border: '1px solid #4a5568',
                          borderRadius: 6,
                          fontFamily: 'Share Tech Mono',
                          fontSize: 12,
                        }}
                        labelStyle={{ color: '#c8d6e5' }}
                      />
                      <Bar dataKey="wins" name="Wins" radius={[3, 3, 0, 0]}>
                        {chartData.map((_, idx) => (
                          <RechartsCell key={idx} fill="#39ff14" fillOpacity={0.7} />
                        ))}
                      </Bar>
                      <Bar dataKey="losses" name="Losses" radius={[3, 3, 0, 0]}>
                        {chartData.map((_, idx) => (
                          <RechartsCell key={idx} fill="#ff3c3c" fillOpacity={0.7} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Multiplayer Stats */}
            {(overview.multiplayerWins > 0 || overview.multiplayerLosses > 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-amber-500/60 font-mono-crt mb-3">MULTIPLAYER</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatBox label="MP WINS" value={overview.multiplayerWins} color="green" />
                  <StatBox label="MP LOSSES" value={overview.multiplayerLosses} color="red" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Clear Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleClear}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-mono-crt transition-all ${
              confirmClear
                ? 'metal-panel-light text-red-400 ring-1 ring-red-500/40'
                : 'text-slate-600 hover:text-red-400'
            }`}
          >
            <Trash2 size={14} />
            {confirmClear ? 'CONFIRM PURGE?' : 'PURGE DATA'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClass =
    color === 'green'
      ? 'text-glow-green'
      : color === 'amber'
        ? 'text-glow-amber'
        : color === 'red'
          ? 'text-glow-red'
          : 'text-green-300';

  return (
    <div className="metal-panel-light rounded-lg p-3 text-center">
      <div className="text-[10px] text-slate-500 font-mono-crt mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono-crt ${colorClass}`}>{value}</div>
    </div>
  );
}
