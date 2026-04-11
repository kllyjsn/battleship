import { useMemo } from 'react';
import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { loadStats, getStatsOverview } from '../lib/stats';

interface StatsPanelProps {
  onClose: () => void;
}

export function StatsPanel({ onClose }: StatsPanelProps) {
  const overview = useMemo(() => getStatsOverview(loadStats()), []);

  const totalGames = overview.totalGames;
  const wins = overview.wins;
  const losses = overview.losses;
  const winRate = totalGames > 0 ? overview.winRate.toFixed(1) : '0.0';
  const accuracy = totalGames > 0 ? overview.accuracy.toFixed(1) : '0.0';

  const difficultyData = [
    { name: 'Recruit', wins: overview.perDifficulty['easy']?.wins ?? 0, losses: overview.perDifficulty['easy']?.losses ?? 0 },
    { name: 'Captain', wins: overview.perDifficulty['medium']?.wins ?? 0, losses: overview.perDifficulty['medium']?.losses ?? 0 },
    { name: 'Admiral', wins: overview.perDifficulty['hard']?.wins ?? 0, losses: overview.perDifficulty['hard']?.losses ?? 0 },
  ];

  const barColors = ['#39ff14', '#ffb000', '#ff3c3c'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="metal-panel rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-fadeIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-green-400 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-center font-mono-crt text-glow-green mb-6">
          COMBAT STATS
        </h2>

        {totalGames === 0 ? (
          <p className="text-center text-slate-500 font-mono-crt py-8">
            No games played yet. Get out there, Commander!
          </p>
        ) : (
          <div className="space-y-6">
            {/* Overview stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="metal-panel-light rounded-lg p-3 text-center">
                <p className="text-xs text-green-500/60 font-mono-crt">GAMES</p>
                <p className="text-2xl font-bold text-glow-green font-mono-crt">{totalGames}</p>
              </div>
              <div className="metal-panel-light rounded-lg p-3 text-center">
                <p className="text-xs text-green-500/60 font-mono-crt">WIN RATE</p>
                <p className="text-2xl font-bold text-glow-green font-mono-crt">{winRate}%</p>
              </div>
              <div className="metal-panel-light rounded-lg p-3 text-center">
                <p className="text-xs text-green-500/60 font-mono-crt">W / L</p>
                <p className="text-2xl font-bold font-mono-crt">
                  <span className="text-glow-green">{wins}</span>
                  <span className="text-slate-600"> / </span>
                  <span className="text-glow-red">{losses}</span>
                </p>
              </div>
              <div className="metal-panel-light rounded-lg p-3 text-center">
                <p className="text-xs text-green-500/60 font-mono-crt">ACCURACY</p>
                <p className="text-2xl font-bold text-glow-amber font-mono-crt">{accuracy}%</p>
              </div>
            </div>

            {/* Per-difficulty breakdown */}
            <div>
              <h3 className="text-sm text-green-500/60 font-mono-crt mb-3 text-center">WINS BY DIFFICULTY</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={difficultyData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Share Tech Mono' }}
                    axisLine={{ stroke: '#4a5568' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Share Tech Mono' }}
                    axisLine={{ stroke: '#4a5568' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f2e',
                      border: '1px solid #4a5568',
                      borderRadius: '6px',
                      fontFamily: 'Share Tech Mono',
                      color: '#c8d6e5',
                    }}
                  />
                  <Bar dataKey="wins" name="Wins" radius={[4, 4, 0, 0]}>
                    {difficultyData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Per-difficulty table */}
            <div className="space-y-2">
              {difficultyData.map((d) => (
                <div key={d.name} className="flex items-center justify-between metal-panel-light rounded px-3 py-2">
                  <span className="text-sm font-mono-crt text-slate-400">{d.name}</span>
                  <span className="text-sm font-mono-crt">
                    <span className="text-glow-green">{d.wins}W</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-glow-red">{d.losses}L</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
