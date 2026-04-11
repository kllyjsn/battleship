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

        <p className="text-slate-400 mb-8 font-mono-crt text-sm">
          {isWin
            ? `${playerName} sank all of ${opponentName}'s ships!`
            : `${opponentName} sank all of ${playerName.toLowerCase() === 'you' ? 'your' : playerName + "'s"} ships.`}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded metal-panel-light text-glow-green font-semibold hover:ring-1 hover:ring-green-400/40 transition-all font-mono-crt"
            style={{ borderColor: 'rgba(57, 255, 20, 0.3)' }}
          >
            <RotateCw size={18} />
            DEPLOY AGAIN
          </button>
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
