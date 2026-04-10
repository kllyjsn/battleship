import { Crosshair, Users, Anchor, Waves, Zap, Brain, Shield } from 'lucide-react';
import type { Difficulty } from '../engine/types';
import { useState } from 'react';

interface MainMenuProps {
  onStartSinglePlayer: (difficulty: Difficulty) => void;
  onStartMultiplayer: () => void;
}

export function MainMenu({ onStartSinglePlayer, onStartMultiplayer }: MainMenuProps) {
  const [showDifficulty, setShowDifficulty] = useState(false);

  const difficulties: { level: Difficulty; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    { level: 'easy', label: 'Recruit', description: 'Random attacks, no strategy', icon: <Shield size={20} />, color: 'from-green-600 to-emerald-600' },
    { level: 'medium', label: 'Captain', description: 'Hunts ships after a hit', icon: <Brain size={20} />, color: 'from-yellow-600 to-orange-600' },
    { level: 'hard', label: 'Admiral', description: 'Advanced probability targeting', icon: <Zap size={20} />, color: 'from-red-600 to-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950 flex items-center justify-center p-4">
      {/* Animated background waves */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-4 left-0 right-0 h-40 bg-gradient-to-t from-cyan-900/10 to-transparent wave-animation" />
        <div className="absolute -bottom-4 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/5 to-transparent wave-animation-slow" />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 shadow-xl shadow-cyan-900/40 mb-4">
            <Anchor size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 tracking-tight">
            BATTLESHIP
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Waves size={16} className="text-cyan-600/60" />
            <p className="text-cyan-600/60 text-sm tracking-widest uppercase">Naval Combat</p>
            <Waves size={16} className="text-cyan-600/60" />
          </div>
        </div>

        {!showDifficulty ? (
          /* Mode Selection */
          <div className="space-y-4">
            <button
              onClick={() => setShowDifficulty(true)}
              className="group w-full flex items-center gap-4 p-5 rounded-xl bg-slate-900/70 border border-cyan-900/30 hover:border-cyan-600/50 hover:bg-slate-800/70 transition-all duration-300 backdrop-blur"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Crosshair size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Single Player</h3>
                <p className="text-sm text-slate-400">Battle against the AI</p>
              </div>
            </button>

            <button
              onClick={onStartMultiplayer}
              className="group w-full flex items-center gap-4 p-5 rounded-xl bg-slate-900/70 border border-cyan-900/30 hover:border-purple-600/50 hover:bg-slate-800/70 transition-all duration-300 backdrop-blur"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Users size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Multiplayer</h3>
                <p className="text-sm text-slate-400">1v1 real-time battle via PubNub</p>
              </div>
            </button>
          </div>
        ) : (
          /* Difficulty Selection */
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-cyan-300 mb-4">Select Difficulty</h3>
            {difficulties.map(({ level, label, description, icon, color }) => (
              <button
                key={level}
                onClick={() => onStartSinglePlayer(level)}
                className="group w-full flex items-center gap-4 p-4 rounded-xl bg-slate-900/70 border border-cyan-900/30 hover:border-cyan-600/50 hover:bg-slate-800/70 transition-all duration-300 backdrop-blur"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <div className="text-left">
                  <h4 className="text-base font-semibold text-white">{label}</h4>
                  <p className="text-xs text-slate-400">{description}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowDifficulty(false)}
              className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        <p className="mt-8 text-xs text-slate-600">
          Built with React • Powered by PubNub
        </p>
      </div>
    </div>
  );
}
