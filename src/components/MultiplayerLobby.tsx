import { useState } from 'react';
import { Copy, Check, ArrowLeft, Loader2 } from 'lucide-react';

interface MultiplayerLobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onBack: () => void;
  roomCode: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function MultiplayerLobby({
  onCreateRoom,
  onJoinRoom,
  onBack,
  roomCode,
  isConnecting,
  error,
}: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="relative z-10 max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Menu</span>
        </button>

        <div className="bg-slate-900/80 border border-purple-900/30 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-6 text-center">
            Multiplayer
          </h2>

          {mode === 'select' && (
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-white placeholder-slate-500 focus:border-purple-500/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              <button
                onClick={() => {
                  if (playerName.trim()) {
                    setMode('create');
                    onCreateRoom(playerName.trim());
                  }
                }}
                disabled={!playerName.trim() || isConnecting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>

              <button
                onClick={() => playerName.trim() && setMode('join')}
                disabled={!playerName.trim()}
                className="w-full py-3 rounded-xl bg-slate-800/60 border border-slate-600/40 text-slate-300 font-semibold hover:bg-slate-700/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="text-center space-y-4">
              {isConnecting ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 size={32} className="text-purple-400 animate-spin" />
                  <p className="text-slate-400">Creating room...</p>
                </div>
              ) : roomCode ? (
                <>
                  <p className="text-slate-400 text-sm">Share this code with your opponent:</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-mono font-bold text-purple-300 tracking-[0.3em] bg-slate-800/60 px-6 py-3 rounded-xl border border-purple-700/30">
                      {roomCode}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Waiting for opponent to join...
                  </div>
                </>
              ) : null}
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/40 text-white text-center text-2xl font-mono tracking-[0.3em] placeholder-slate-500 focus:border-purple-500/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all uppercase"
                />
              </div>

              <button
                onClick={() => {
                  if (joinCode.length >= 4) {
                    onJoinRoom(joinCode, playerName.trim());
                  }
                }}
                disabled={joinCode.length < 4 || isConnecting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Room'
                )}
              </button>

              <button
                onClick={() => setMode('select')}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                ← Back
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-800/40 text-red-300 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
