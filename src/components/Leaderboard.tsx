import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getLeaderboard } from '../lib/gameResults';

interface LeaderboardProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  accuracy: number | null;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((data) => {
      setEntries(data as LeaderboardEntry[] | null);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="metal-panel rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fadeIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-green-400 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-center font-mono-crt text-glow-amber mb-6">
          LEADERBOARD
        </h2>

        {loading ? (
          <p className="text-center text-slate-500 font-mono-crt py-8">
            Loading leaderboard...
          </p>
        ) : !entries || entries.length === 0 ? (
          <p className="text-center text-slate-500 font-mono-crt py-8">
            No ranked players yet. Be the first!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono-crt">
              <thead>
                <tr className="text-green-500/60 border-b border-slate-700">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">Player</th>
                  <th className="py-2 px-2 text-center">Games</th>
                  <th className="py-2 px-2 text-center">Wins</th>
                  <th className="py-2 px-2 text-center">Win%</th>
                  <th className="py-2 px-2 text-center">Acc%</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const isCurrentUser = user?.id === entry.id;
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-slate-700/50 ${
                        isCurrentUser ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <td className="py-2 px-2 text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {entry.avatar_url ? (
                            <img
                              src={entry.avatar_url}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full metal-panel-light" />
                          )}
                          <span className={isCurrentUser ? 'text-glow-green' : 'text-slate-300'}>
                            {entry.display_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-400">
                        {entry.total_games}
                      </td>
                      <td className="py-2 px-2 text-center text-glow-green">
                        {entry.wins}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-300">
                        {entry.win_rate?.toFixed(1) ?? '—'}%
                      </td>
                      <td className="py-2 px-2 text-center text-glow-amber">
                        {entry.accuracy?.toFixed(1) ?? '—'}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
