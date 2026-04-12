import { useState } from 'react';
import { Trophy, Skull, RotateCw, Home, Play, Crosshair, Clock, Target, Ship, Map, ChevronUp } from 'lucide-react';
import { addLeaderboardEntry } from '../lib/leaderboard';
import { loadStats } from '../lib/stats';
import { getPlayerRank, getRankForWins } from '../lib/ranks';
import { RankBadge } from './RankBadge';
import { AttackHeatmap } from './AttackHeatmap';
import type { Board } from '../engine/types';

interface GameOverProps {
  winner: 'player' | 'opponent';
  onPlayAgain: () => void;
  onGoHome: () => void;
  playerName?: string;
  opponentName?: string;
  onWatchReplay?: () => void;
  gameStats?: {
    mode: 'single' | 'multiplayer';
    difficulty?: 'easy' | 'medium' | 'hard';
    shots: number;
    hits: number;
    totalScore: number;
    durationSeconds: number;
  };
  alreadySubmitted?: boolean;
  onScoreSubmitted?: () => void;
  shipsLost?: number;
  totalShips?: number;
  opponentBoard?: Board;
  previousWins?: number;
}

const SESSION_NAME_KEY = 'battleship-session-name';

function loadSessionName(): string {
  try {
    return localStorage.getItem(SESSION_NAME_KEY) || '';
  } catch {
    return '';
  }
}

function saveSessionName(name: string): void {
  try {
    localStorage.setItem(SESSION_NAME_KEY, name);
  } catch {
    // ignore
  }
}

export function GameOver({ winner, onPlayAgain, onGoHome, playerName = 'You', opponentName = 'Opponent', onWatchReplay, gameStats, alreadySubmitted = false, onScoreSubmitted, shipsLost = 0, totalShips = 5, opponentBoard, previousWins }: GameOverProps) {
  const isWin = winner === 'player';
  const [showNamePrompt, setShowNamePrompt] = useState(!!gameStats && !alreadySubmitted);
  const [sessionName, setSessionName] = useState(loadSessionName());
  const [saved, setSaved] = useState(alreadySubmitted);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Rank-up detection
  const { rank: currentRank } = getPlayerRank();
  const prevRank = previousWins !== undefined ? getRankForWins(previousWins) : null;
  const didRankUp = isWin && prevRank !== null && prevRank.id !== currentRank.id;

  const handleSaveScore = () => {
    const name = sessionName.trim() || 'Anonymous';
    saveSessionName(name);
    if (gameStats) {
      addLeaderboardEntry(name, {
        mode: gameStats.mode,
        difficulty: gameStats.difficulty,
        shots: gameStats.shots,
        hits: gameStats.hits,
        totalScore: gameStats.totalScore,
        won: isWin,
        durationSeconds: gameStats.durationSeconds,
      });
    }
    setSaved(true);
    setShowNamePrompt(false);
    onScoreSubmitted?.();
  };

  const handleSkip = () => {
    setShowNamePrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="metal-panel rounded-xl p-8 max-w-md w-full mx-4 text-center" style={{ boxShadow: isWin ? '0 0 40px rgba(57, 255, 20, 0.1)' : '0 0 40px rgba(255, 60, 60, 0.1)' }}>
        <div
          className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center metal-panel-light`}
          style={{ boxShadow: isWin ? '0 0 20px rgba(57, 255, 20, 0.2)' : '0 0 20px rgba(255, 60, 60, 0.2)' }}
        >
          {isWin ? (
            <Trophy size={40} className="text-glow-green" />
          ) : (
            <Skull size={40} className="text-glow-red" />
          )}
        </div>

        <h2
          className={`text-3xl font-bold mb-2 font-mono-crt ${
            isWin ? 'text-glow-green' : 'text-glow-red'
          }`}
        >
          {isWin ? 'VICTORY' : 'DEFEATED'}
        </h2>

        <p className="text-slate-400 mb-2 font-mono-crt text-sm">
          {isWin
            ? `${playerName} sank all of ${opponentName}'s ships!`
            : `${opponentName} sank all of ${playerName.toLowerCase() === 'you' ? 'your' : playerName + "'s"} ships.`}
        </p>

        {/* Post-game stats summary */}
        {gameStats && (
          <div className="grid grid-cols-2 gap-2 mb-4 mt-3">
            <div className="metal-panel-light rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Crosshair size={12} className="text-green-500/60" />
                <span className="text-[10px] text-green-500/60 font-mono-crt">SHOTS</span>
              </div>
              <span className="text-lg font-bold text-glow-green font-mono-crt">{gameStats.shots}</span>
            </div>
            <div className="metal-panel-light rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Target size={12} className="text-green-500/60" />
                <span className="text-[10px] text-green-500/60 font-mono-crt">ACCURACY</span>
              </div>
              <span className="text-lg font-bold text-glow-amber font-mono-crt">
                {gameStats.shots > 0 ? ((gameStats.hits / gameStats.shots) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="metal-panel-light rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Clock size={12} className="text-green-500/60" />
                <span className="text-[10px] text-green-500/60 font-mono-crt">DURATION</span>
              </div>
              <span className="text-lg font-bold text-green-300 font-mono-crt">
                {gameStats.durationSeconds >= 60
                  ? `${Math.floor(gameStats.durationSeconds / 60)}m ${gameStats.durationSeconds % 60}s`
                  : `${gameStats.durationSeconds}s`}
              </span>
            </div>
            <div className="metal-panel-light rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Ship size={12} className="text-green-500/60" />
                <span className="text-[10px] text-green-500/60 font-mono-crt">FLEET</span>
              </div>
              <span className="text-lg font-bold font-mono-crt">
                <span className="text-glow-green">{totalShips - shipsLost}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{totalShips}</span>
              </span>
            </div>
          </div>
        )}

        {/* Rank-up celebration */}
        {didRankUp && (
          <div className="mb-4 px-3 py-3 rounded metal-panel-light rank-up-shine rank-up-glow">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ChevronUp size={14} className="text-amber-400" />
              <span className="text-xs font-mono-crt text-amber-400 tracking-widest">RANK UP</span>
              <ChevronUp size={14} className="text-amber-400" />
            </div>
            <RankBadge rank={currentRank} size="lg" />
          </div>
        )}

        {/* Current rank (if no rank-up) */}
        {!didRankUp && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <RankBadge rank={currentRank} size="md" />
          </div>
        )}

        {/* Win streak display */}
        {(() => {
          const stats = loadStats();
          return stats.currentWinStreak >= 2 ? (
            <div className="flex items-center justify-center gap-2 mb-4 px-3 py-1.5 rounded metal-panel-light">
              <span className="text-xs font-mono-crt text-amber-400">WIN STREAK</span>
              <span className="text-lg font-bold font-mono-crt text-glow-amber">{stats.currentWinStreak}</span>
            </div>
          ) : null;
        })()}

        {/* Session name prompt for winners */}
        {showNamePrompt && (
          <div className="mb-6 p-4 rounded-lg metal-panel-light">
            <p className="text-sm text-glow-amber font-mono-crt mb-2">ENTER YOUR CALLSIGN FOR THE LEADERBOARD</p>
            <p className="text-xs text-slate-400 font-mono-crt mb-3">SCORE: <span className="text-glow-amber">{gameStats?.totalScore ?? 0}</span> PTS</p>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScore(); }}
              placeholder="Your callsign..."
              maxLength={20}
              autoFocus
              className="w-full px-3 py-2 rounded metal-panel text-green-300 font-mono-crt text-sm bg-transparent border border-slate-700 focus:border-green-500/50 focus:outline-none placeholder-slate-600 mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveScore}
                className="flex-1 py-2 rounded metal-panel text-glow-green font-mono-crt text-sm hover:border-green-500/40 transition-all"
              >
                SAVE SCORE
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2 rounded metal-panel-light text-slate-500 font-mono-crt text-sm hover:text-slate-300 transition-all"
              >
                SKIP
              </button>
            </div>
          </div>
        )}

        {saved && (
          <p className="text-xs text-green-400 font-mono-crt mb-4">Score saved to leaderboard!</p>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded metal-panel-light text-glow-green font-semibold hover:ring-1 hover:ring-green-400/40 transition-all font-mono-crt"
            style={{ borderColor: 'rgba(57, 255, 20, 0.3)' }}
          >
            <RotateCw size={18} />
            DEPLOY AGAIN
          </button>
          {onWatchReplay && (
            <button
              onClick={onWatchReplay}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded metal-panel-light text-amber-400 font-semibold hover:ring-1 hover:ring-amber-400/40 transition-all font-mono-crt"
              style={{ borderColor: 'rgba(255, 176, 0, 0.3)' }}
            >
              <Play size={18} />
              WATCH REPLAY
            </button>
          )}
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded metal-panel-light text-slate-400 font-semibold hover:text-green-300 transition-all font-mono-crt"
          >
            <Home size={18} />
            BASE
          </button>
        </div>

        {/* Tactical map button */}
        {opponentBoard && (
          <button
            onClick={() => setShowHeatmap(true)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded metal-panel-light text-cyan-400 font-semibold hover:ring-1 hover:ring-cyan-400/40 transition-all font-mono-crt text-sm"
          >
            <Map size={16} />
            TACTICAL MAP
          </button>
        )}

        {showHeatmap && opponentBoard && (
          <AttackHeatmap board={opponentBoard} onClose={() => setShowHeatmap(false)} />
        )}
      </div>
    </div>
  );
}
