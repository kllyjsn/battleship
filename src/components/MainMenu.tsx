import { Crosshair, Users, Anchor, Zap, Brain, Shield } from 'lucide-react';
import type { Difficulty } from '../engine/types';
import { useState } from 'react';

interface MainMenuProps {
  onStartSinglePlayer: (difficulty: Difficulty) => void;
  onStartMultiplayer: () => void;
}

export function MainMenu({ onStartSinglePlayer, onStartMultiplayer }: MainMenuProps) {
  const [showDifficulty, setShowDifficulty] = useState(false);

  const difficulties: { level: Difficulty; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    { level: 'easy', label: 'Recruit', description: 'Random attacks, no strategy', icon: <Shield size={20} />, color: 'from-green-700 to-green-900' },
    { level: 'medium', label: 'Captain', description: 'Hunts ships after a hit', icon: <Brain size={20} />, color: 'from-amber-600 to-amber-800' },
    { level: 'hard', label: 'Admiral', description: 'Advanced probability targeting', icon: <Zap size={20} />, color: 'from-red-700 to-red-900' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
      {/* Sonar rings background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl metal-panel mb-4" style={{ boxShadow: '0 0 20px rgba(57, 255, 20, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <Anchor size={40} className="text-glow-green" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight font-mono-crt text-glow-green">
            BATTLESHIP
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="w-8 h-px bg-green-500/30" />
            <p className="text-green-500/50 text-xs tracking-[0.3em] uppercase font-mono-crt">Naval Command Center</p>
            <div className="w-8 h-px bg-green-500/30" />
          </div>
        </div>

        {!showDifficulty ? (
          /* Mode Selection */
          <div className="space-y-4">
            <button
              onClick={() => setShowDifficulty(true)}
              className="group w-full flex items-center gap-4 p-5 rounded-lg metal-panel hover:border-green-500/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center metal-panel-light group-hover:scale-110 transition-transform" style={{ boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)' }}>
                <Crosshair size={24} className="text-glow-green" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-green-300 font-mono-crt">SINGLE PLAYER</h3>
                <p className="text-sm text-slate-500 font-mono-crt">Battle against the AI</p>
              </div>
            </button>

            <button
              onClick={onStartMultiplayer}
              className="group w-full flex items-center gap-4 p-5 rounded-lg metal-panel hover:border-amber-500/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center metal-panel-light group-hover:scale-110 transition-transform" style={{ boxShadow: '0 0 10px rgba(255, 176, 0, 0.1)' }}>
                <Users size={24} className="text-glow-amber" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-amber-300 font-mono-crt">MULTIPLAYER</h3>
                <p className="text-sm text-slate-500 font-mono-crt">1v1 real-time battle via PubNub</p>
              </div>
            </button>
          </div>
        ) : (
          /* Difficulty Selection */
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-glow-green font-mono-crt mb-4">SELECT THREAT LEVEL</h3>
            {difficulties.map(({ level, label, description, icon, color }) => (
              <button
                key={level}
                onClick={() => onStartSinglePlayer(level)}
                className="group w-full flex items-center gap-4 p-4 rounded-lg metal-panel hover:border-green-500/40 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <div className="text-left">
                  <h4 className="text-base font-semibold text-green-300 font-mono-crt">{label.toUpperCase()}</h4>
                  <p className="text-xs text-slate-500 font-mono-crt">{description}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowDifficulty(false)}
              className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-green-400 transition-colors font-mono-crt"
            >
              &lt; BACK
            </button>
          </div>
        )}

        <p className="mt-8 text-xs text-slate-700 font-mono-crt">
          SYSTEM ONLINE // PUBNUB LINK ACTIVE
        </p>
      </div>
    </div>
  );
}
