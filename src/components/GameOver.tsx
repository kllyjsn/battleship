import { useState } from 'react';
import { Trophy, Skull, RotateCw, Home, Play } from 'lucide-react';
import { addLeaderboardEntry } from '../lib/leaderboard';

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
    durationSeconds: number;
  };
  alreadySubmitted?: boolean;
  onScoreSubmitted?: () => void;
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

export function GameOver({ winner, onPlayAgain, onGoHome, playerName = 'You', opponentName = 'Opponent', onWatchReplay, gameStats, alreadySubmitted = false, onScoreSubmitted }: GameOverProps) {
  const isWin = winner === 'player';
  const [showNamePrompt, setShowNamePrompt] = useState(isWin && !!gameStats && !alreadySubmitted);
  const [sessionName, setSessionName] = useState(loadSessionName());
  const [saved, setSaved] = useState(alreadySubmitted);

  const handleSaveScore = () => {
    const name = sessionName.trim() || 'Anonymous';
    saveSessionName(name);
    if (gameStats) {
      addLeaderboardEntry(name, {
        mode: gameStats.mode,
        difficulty: gameStats.difficulty,
        shots: gameStats.shots,
        hits: gameStats.hits,
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

        <p className="text-slate-400 mb-6 font-mono-crt text-sm">
          {isWin
            ? `${playerName} sank all of ${opponentName}'s ships!`
            : `${opponentName} sank all of ${playerName.toLowerCase() === 'you' ? 'your' : playerName + "'s"} ships.`}
        </p>

        {/* Session name prompt for winners */}
        {showNamePrompt && (
          <div className="mb-6 p-4 rounded-lg metal-panel-light">
            <p className="text-sm text-glow-amber font-mono-crt mb-3">ENTER YOUR CALLSIGN FOR THE LEADERBOARD</p>
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
      </div>
    </div>
  );
}
