import { Crosshair, Users, Anchor, Zap, Brain, Shield, Cpu, Target, BarChart3, Dice5, Swords, Gamepad2, Palette, LogIn, LogOut, Trophy, Loader2 } from 'lucide-react';
import type { Difficulty } from '../engine/types';
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { StatsPanel } from './StatsPanel';
import { Leaderboard } from './Leaderboard';
import { ThemeSelector } from './ThemeSelector';
import { loadTheme } from '../lib/themes';

interface MainMenuProps {
  onStartSinglePlayer: (difficulty: Difficulty) => void;
  onStartMultiplayer: () => void;
}

export function MainMenu({ onStartSinglePlayer, onStartMultiplayer }: MainMenuProps) {
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(loadTheme());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  const difficulties: { level: Difficulty; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    { level: 'easy', label: 'Recruit', description: 'Random attacks, no strategy', icon: <Shield size={20} />, color: 'from-green-700 to-green-900' },
    { level: 'medium', label: 'Captain', description: 'Hunts ships after a hit', icon: <Brain size={20} />, color: 'from-amber-600 to-amber-800' },
    { level: 'hard', label: 'Admiral', description: 'Advanced probability targeting', icon: <Zap size={20} />, color: 'from-red-700 to-red-900' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-12 md:pt-16" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
      {/* Sonar rings background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Auth bar */}
        <div className="flex items-center justify-end mb-4 min-h-[40px]">
          {loading ? (
            <Loader2 size={18} className="text-green-500/50 animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {profile?.avatar_url && (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full border border-green-500/30" />
              )}
              <span className="text-sm text-green-300 font-mono-crt">{profile?.display_name || 'Player'}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded metal-panel-light text-slate-500 hover:text-red-400 transition-colors text-xs font-mono-crt"
              >
                <LogOut size={14} />
                SIGN OUT
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded metal-panel-light text-green-300 hover:text-glow-green transition-colors text-sm font-mono-crt hover:ring-1 hover:ring-green-400/40"
            >
              <LogIn size={16} />
              SIGN IN WITH GOOGLE
            </button>
          )}
        </div>

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

        {/* Stats, Themes & Leaderboard buttons */}
        <div className="flex gap-3 mt-6 justify-center flex-wrap">
          <button
            onClick={() => setShowStats(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded metal-panel hover:border-green-500/40 transition-all text-sm font-mono-crt text-green-300"
          >
            <BarChart3 size={16} />
            STATS
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded metal-panel hover:border-amber-500/40 transition-all text-sm font-mono-crt text-amber-300"
          >
            <Trophy size={16} />
            LEADERBOARD
          </button>
          <button
            onClick={() => setShowThemes(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded metal-panel hover:border-cyan-500/40 transition-all text-sm font-mono-crt text-cyan-300"
          >
            <Palette size={16} />
            THEMES
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-700 font-mono-crt">
          SYSTEM ONLINE // PUBNUB LINK ACTIVE{supabase ? ' // SUPABASE LINK ACTIVE' : ''}
        </p>
      </div>

      {/* ── AI Intelligence Briefing ── */}
      <div className="relative z-10 w-full max-w-3xl mt-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-px bg-green-500/20" />
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-green-500/50" />
            <h2 className="text-sm tracking-[0.3em] uppercase font-mono-crt text-green-500/50">AI Intelligence Briefing</h2>
          </div>
          <div className="w-12 h-px bg-green-500/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recruit */}
          <div className="rounded-lg metal-panel p-5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center shadow-lg">
                <Dice5 size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-300 font-mono-crt">RECRUIT</h3>
                <p className="text-[10px] text-green-500/40 font-mono-crt">EASY MODE</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono-crt">
              Fires at completely random coordinates each turn with no memory or strategy. Every untried cell has an equal chance of being selected, making this opponent forgiving and unpredictable. Ideal for learning the ropes and enjoying a relaxed game.
            </p>
          </div>

          {/* Captain */}
          <div className="rounded-lg metal-panel p-5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                <Target size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-300 font-mono-crt">CAPTAIN</h3>
                <p className="text-[10px] text-amber-500/40 font-mono-crt">MEDIUM MODE</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono-crt">
              Uses a <span className="text-amber-400">Hunt &amp; Target</span> algorithm. Fires randomly until scoring a hit, then switches to target mode — probing adjacent cells and locking onto the ship's orientation to sink it efficiently. Once a ship goes down, it resumes hunting. A balanced challenge that rewards smart ship placement.
            </p>
          </div>

          {/* Admiral */}
          <div className="rounded-lg metal-panel p-5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg">
                <BarChart3 size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-300 font-mono-crt">ADMIRAL</h3>
                <p className="text-[10px] text-red-500/40 font-mono-crt">HARD MODE</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono-crt">
              Employs <span className="text-red-400">Probability Density</span> mapping on top of Hunt &amp; Target. Every turn, it calculates how many remaining ships could legally occupy each cell and fires at the highest-probability square. Also uses a checkerboard search pattern to eliminate gaps. A ruthless tactician.
            </p>
          </div>
        </div>
      </div>

      {/* ── Why Play Battleship ── */}
      <div className="relative z-10 w-full max-w-3xl mt-10 mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-px bg-amber-500/20" />
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-amber-500/50" />
            <h2 className="text-sm tracking-[0.3em] uppercase font-mono-crt text-amber-500/50">Battle Stations</h2>
          </div>
          <div className="w-12 h-px bg-amber-500/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Solo vs AI */}
          <div className="rounded-lg metal-panel p-5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg metal-panel-light flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(57, 255, 20, 0.1)' }}>
                <Crosshair size={18} className="text-glow-green" />
              </div>
              <h3 className="text-sm font-semibold text-green-300 font-mono-crt">SOLO vs AI</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono-crt">
              Three distinct AI personalities keep every session fresh. Start on Recruit to learn the grid, graduate to Captain for a satisfying cat-and-mouse chase, and test your mettle against the Admiral's probability engine when you're ready for a real fight. Every difficulty rewards different strategies — cluster your fleet, spread them wide, or hug the edges. There's always a new tactic to try.
            </p>
          </div>

          {/* Multiplayer */}
          <div className="rounded-lg metal-panel p-5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg metal-panel-light flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(255, 176, 0, 0.1)' }}>
                <Swords size={18} className="text-glow-amber" />
              </div>
              <h3 className="text-sm font-semibold text-amber-300 font-mono-crt">MULTIPLAYER</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono-crt">
              Challenge a friend to a real-time 1v1 duel powered by PubNub. Share a room code and you're in — no accounts, no downloads. Coordinate bluffs and trash-talk through the built-in COMMS chat while you trade volleys. The tension of reading another human's placement patterns and the thrill of a clutch final salvo make multiplayer Battleship endlessly replayable.
            </p>
          </div>
        </div>
      </div>

      {showStats && <StatsPanel onClose={() => setShowStats(false)} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showThemes && (
        <ThemeSelector
          currentTheme={currentTheme}
          onSelectTheme={setCurrentTheme}
          onClose={() => setShowThemes(false)}
        />
      )}
    </div>
  );
}
