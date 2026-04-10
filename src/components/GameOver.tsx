import { Trophy, Skull, RotateCw, Home } from 'lucide-react';

interface GameOverProps {
  winner: 'player' | 'opponent';
  onPlayAgain: () => void;
  onGoHome: () => void;
  playerName?: string;
  opponentName?: string;
}

export function GameOver({ winner, onPlayAgain, onGoHome, playerName = 'You', opponentName = 'Opponent' }: GameOverProps) {
  const isWin = winner === 'player';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900/95 border border-cyan-900/40 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <div
          className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isWin
              ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30'
              : 'bg-gradient-to-br from-red-700 to-red-900 shadow-lg shadow-red-500/20'
          }`}
        >
          {isWin ? (
            <Trophy size={40} className="text-white" />
          ) : (
            <Skull size={40} className="text-white" />
          )}
        </div>

        <h2
          className={`text-3xl font-bold mb-2 ${
            isWin ? 'text-yellow-400' : 'text-red-400'
          }`}
        >
          {isWin ? 'Victory!' : 'Defeat'}
        </h2>

        <p className="text-slate-400 mb-6">
          {isWin
            ? `${playerName} sank all of ${opponentName}'s ships!`
            : `${opponentName} sank all of ${playerName.toLowerCase() === 'you' ? 'your' : playerName + "'s"} ships.`}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:from-cyan-500 hover:to-emerald-500 transition-all shadow-lg"
          >
            <RotateCw size={18} />
            Play Again
          </button>
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-slate-600/40 text-slate-300 font-semibold hover:bg-slate-700 transition-all"
          >
            <Home size={18} />
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
