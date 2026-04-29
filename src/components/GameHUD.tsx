import { Volume2, VolumeX, ArrowLeft, Crosshair, Flame, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { MusicVisualizer } from './MusicVisualizer';
import { loadStats } from '../lib/stats';
import { getPlayerRank } from '../lib/ranks';
import { RankBadge } from './RankBadge';
import { isSoundEnabled } from '../lib/storageKeys';

interface GameHUDProps {
  isPlayerTurn: boolean;
  message: string;
  phase: 'placement' | 'battle' | 'gameover';
  onToggleSound: () => boolean;
  onBack: () => void;
  playerHits: number;
  opponentHits: number;
  totalShipCells: number;
  isMusicPlaying: boolean;
  musicFreqData: number[];
  onToggleMusic: () => void;
  score?: number;
  showStreak?: boolean;
  playerShipsRemaining?: number;
  opponentShipsRemaining?: number;
}

export function GameHUD({
  isPlayerTurn,
  message,
  phase,
  onToggleSound,
  onBack,
  playerHits,
  opponentHits,
  totalShipCells,
  isMusicPlaying,
  musicFreqData,
  onToggleMusic,
  score,
  showStreak = false,
  playerShipsRemaining,
  opponentShipsRemaining,
}: GameHUDProps) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const displayScore = score ?? 0;
  const streak = useMemo(() => showStreak ? loadStats().currentWinStreak : 0, [showStreak]);
  const { rank } = getPlayerRank();
  const DANGER_THRESHOLD = 1;
  const dangerZone = phase === 'battle' && (
    (playerShipsRemaining !== undefined && playerShipsRemaining <= DANGER_THRESHOLD) ||
    (opponentShipsRemaining !== undefined && opponentShipsRemaining <= DANGER_THRESHOLD)
  );

  const handleToggle = () => {
    const newState = onToggleSound();
    setSoundOn(newState);
  };

  return (
    <div className="w-full metal-panel" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      {/* Top row: back button, turn message, sound toggle */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-3">
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-green-400 transition-colors font-mono-crt"
          >
            <ArrowLeft size={16} />
            <span className="text-sm hidden sm:inline">MENU</span>
          </button>
          <div className="hidden sm:flex">
            <RankBadge rank={rank} size="sm" />
          </div>
        </div>

        <div
          className={`text-[11px] sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded font-mono-crt truncate max-w-[55%] sm:max-w-none text-center ${
            phase === 'gameover'
              ? 'text-glow-amber metal-panel-light'
              : isPlayerTurn
                ? 'text-glow-green metal-panel-light glow-pulse'
                : 'text-glow-amber metal-panel-light'
          }`}
          style={{ border: '1px solid var(--steel-border)' }}
        >
          <span className="flex items-center justify-center gap-2">
            {phase === 'battle' && (
              <span
                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                  isPlayerTurn
                    ? 'bg-green-400 shadow-[0_0_6px_rgba(57,255,20,0.6)]'
                    : 'bg-amber-400 shadow-[0_0_6px_rgba(255,176,0,0.6)]'
                }`}
                style={{ animation: isPlayerTurn ? 'glowPulse 1.5s ease-in-out infinite' : undefined }}
              />
            )}
            {message}
          </span>
        </div>

        {/* Score + Audio controls */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {phase !== 'placement' && (
            <>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded metal-panel-light" style={{ border: '1px solid var(--steel-border)' }}>
                <Crosshair size={13} className="text-amber-400" />
                <span className="text-xs sm:text-sm font-bold font-mono-crt text-glow-amber">{displayScore}</span>
              </div>
              {streak >= 2 && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded metal-panel-light" style={{ border: '1px solid var(--steel-border)' }}>
                  <Flame size={13} className="text-orange-400" />
                  <span className="text-xs font-bold font-mono-crt text-orange-300">{streak}</span>
                </div>
              )}
              <div className="w-px h-4 bg-slate-700/50" />
            </>
          )}
          <MusicVisualizer
            isPlaying={isMusicPlaying}
            freqData={musicFreqData}
            onToggle={onToggleMusic}
          />
          <div className="w-px h-4 bg-slate-700/50" />
          <button
            onClick={handleToggle}
            className="text-slate-500 hover:text-green-400 transition-colors p-1"
            title={soundOn ? 'Mute Sonar' : 'Enable Sonar'}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Danger zone alert */}
      {dangerZone && (
        <div className="flex items-center justify-center gap-2 px-3 py-1" style={{ animation: 'dangerTextPulse 1.5s ease-in-out infinite' }}>
          <AlertTriangle size={13} className="text-red-400" />
          <span className="text-[10px] sm:text-xs font-bold font-mono-crt text-red-400 tracking-widest">
            {playerShipsRemaining !== undefined && playerShipsRemaining <= 1 ? 'HULL CRITICAL' : 'ENEMY FINAL SHIP'}
          </span>
          <AlertTriangle size={13} className="text-red-400" />
        </div>
      )}

      {/* Score row - separate line to avoid overlap */}
      {phase === 'battle' && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 px-2 sm:px-4 pb-1.5 sm:pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-green-500/70 font-mono-crt">ALLY</span>
            <span className="text-xs sm:text-sm font-bold font-mono-crt text-green-400" style={{ textShadow: '0 0 6px rgba(57,255,20,0.5)' }}>
              {opponentHits}
            </span>
            <div className="w-12 sm:w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hull-dark)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(opponentHits / totalShipCells) * 100}%`, background: 'linear-gradient(90deg, #39ff14, #22cc00)' }}
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono-crt">—</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-12 sm:w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hull-dark)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(playerHits / totalShipCells) * 100}%`, background: 'linear-gradient(90deg, #ff3c3c, #cc0000)' }}
              />
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono-crt text-red-400" style={{ textShadow: '0 0 6px rgba(255,60,60,0.5)' }}>
              {playerHits}
            </span>
            <span className="text-[10px] sm:text-xs text-red-500/70 font-mono-crt">ENEMY</span>
          </div>
        </div>
      )}
    </div>
  );
}
