import { useState, useMemo } from 'react';
import { Copy, Check, ArrowLeft, Loader2, Eye, Link } from 'lucide-react';

interface MultiplayerLobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onSpectate?: (roomCode: string, playerName: string) => void;
  onBack: () => void;
  roomCode: string | null;
  isConnecting: boolean;
  error: string | null;
  defaultName?: string;
  initialRoomCode?: string;
}

function buildRoomURL(code: string): string {
  return `https://shipbattle.dev/join/${code}`;
}

export function MultiplayerLobby({
  onCreateRoom,
  onJoinRoom,
  onSpectate,
  onBack,
  roomCode,
  isConnecting,
  error,
  defaultName,
  initialRoomCode,
}: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'spectate'>(initialRoomCode ? 'join' : 'select');
  const [joinCode, setJoinCode] = useState(initialRoomCode || '');
  const [playerName, setPlayerName] = useState(defaultName || '');
  const [copied, setCopied] = useState(false);

  const shareableLink = useMemo(() => roomCode ? buildRoomURL(roomCode) : null, [roomCode]);

  const handleCopy = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
      {/* Sonar rings background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-green-500/5 sonar-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-green-400 transition-colors mb-6 font-mono-crt"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">RETURN TO BASE</span>
        </button>

        <div className="metal-panel rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-center font-mono-crt text-glow-green">
            COMMS LINK
          </h2>

          {mode === 'select' && (
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm text-green-500/60 mb-1.5 font-mono-crt">CALLSIGN</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter callsign"
                  maxLength={20}
                  className="w-full px-4 py-2.5 rounded font-mono-crt text-green-300 placeholder-slate-600 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all"
                  style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
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
                className="w-full py-3 rounded metal-panel-light text-glow-green font-semibold hover:ring-1 hover:ring-green-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono-crt"
                style={{ borderColor: 'rgba(57, 255, 20, 0.2)' }}
              >
                CREATE CHANNEL
              </button>

              <button
                onClick={() => playerName.trim() && setMode('join')}
                disabled={!playerName.trim()}
                className="w-full py-3 rounded metal-panel-light text-slate-400 font-semibold hover:text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono-crt"
              >
                JOIN CHANNEL
              </button>

              {onSpectate && (
                <button
                  onClick={() => playerName.trim() && setMode('spectate')}
                  disabled={!playerName.trim()}
                  className="w-full py-3 rounded metal-panel-light text-slate-400 font-semibold hover:text-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono-crt flex items-center justify-center gap-2"
                >
                  <Eye size={18} />
                  SPECTATE
                </button>
              )}
            </div>
          )}

          {mode === 'create' && (
            <div className="text-center space-y-4">
              {isConnecting ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 size={32} className="text-green-400 animate-spin" />
                  <p className="text-slate-500 font-mono-crt">ESTABLISHING CHANNEL...</p>
                </div>
              ) : shareableLink ? (
                <>
                  <p className="text-slate-500 text-sm font-mono-crt">SEND THIS LINK TO YOUR OPPONENT:</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 px-3 py-2.5 rounded text-sm font-mono-crt text-green-300 truncate text-left"
                      style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
                    >
                      {shareableLink}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-2.5 rounded metal-panel-light text-slate-500 hover:text-green-400 transition-colors shrink-0"
                      title="Copy link"
                    >
                      {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-mono-crt">
                    <Loader2 size={14} className="animate-spin text-green-500/50" />
                    SCANNING FOR ALLIED VESSEL...
                  </div>
                </>
              ) : null}
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              {initialRoomCode && joinCode ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded metal-panel-light font-mono-crt text-sm">
                  <Link size={14} className="text-green-500/60 shrink-0" />
                  <span className="text-green-500/60">ROOM:</span>
                  <span className="text-glow-green tracking-wider">{joinCode}</span>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-green-500/60 mb-1.5 font-mono-crt">FREQUENCY CODE</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded text-center text-2xl tracking-[0.3em] placeholder-slate-600 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all uppercase font-mono-crt text-green-300"
                    style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
                  />
                </div>
              )}

              {!defaultName && (
                <div>
                  <label className="block text-sm text-green-500/60 mb-1.5 font-mono-crt">CALLSIGN</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter callsign"
                    maxLength={20}
                    className="w-full px-4 py-2.5 rounded font-mono-crt text-green-300 placeholder-slate-600 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all"
                    style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (joinCode.length >= 4 && playerName.trim()) {
                    onJoinRoom(joinCode, playerName.trim());
                  }
                }}
                disabled={joinCode.length < 4 || !playerName.trim() || isConnecting}
                className="w-full py-3 rounded metal-panel-light text-glow-green font-semibold hover:ring-1 hover:ring-green-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono-crt"
                style={{ borderColor: 'rgba(57, 255, 20, 0.2)' }}
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    LINKING...
                  </>
                ) : (
                  'LINK UP'
                )}
              </button>

              <button
                onClick={() => {
                  setMode('select');
                  if (initialRoomCode) {
                    setJoinCode('');
                  }
                }}
                className="w-full py-2 text-sm text-slate-600 hover:text-green-400 transition-colors font-mono-crt"
              >
                ← BACK
              </button>
            </div>
          )}

          {mode === 'spectate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-amber-500/60 mb-1.5 font-mono-crt">ROOM LINK OR CODE</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Extract room code from pasted link
                    try {
                      const url = new URL(val);
                      // Support /join/CODE path format
                      const pathMatch = url.pathname.match(/^\/join\/([A-Za-z0-9]+)$/);
                      if (pathMatch) {
                        setJoinCode(pathMatch[1].toUpperCase());
                        return;
                      }
                      // Fallback: support ?room=CODE query param
                      const room = url.searchParams.get('room');
                      if (room) {
                        setJoinCode(room.toUpperCase());
                        return;
                      }
                    } catch {
                      // Not a URL, treat as code
                    }
                    setJoinCode(val.toUpperCase());
                  }}
                  placeholder="PASTE LINK OR ENTER CODE"
                  className="w-full px-4 py-3 rounded text-center text-lg tracking-wider placeholder-slate-600 focus:ring-1 focus:ring-amber-500/30 focus:outline-none transition-all uppercase font-mono-crt text-amber-300"
                  style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
                />
              </div>

              <button
                onClick={() => {
                  if (joinCode.length >= 4 && onSpectate) {
                    onSpectate(joinCode, playerName.trim());
                  }
                }}
                disabled={joinCode.length < 4 || isConnecting}
                className="w-full py-3 rounded metal-panel-light text-glow-amber font-semibold hover:ring-1 hover:ring-amber-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono-crt"
                style={{ borderColor: 'rgba(255, 176, 0, 0.2)' }}
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    CONNECTING...
                  </>
                ) : (
                  <>
                    <Eye size={18} />
                    SPECTATE MATCH
                  </>
                )}
              </button>

              <button
                onClick={() => setMode('select')}
                className="w-full py-2 text-sm text-slate-600 hover:text-amber-400 transition-colors font-mono-crt"
              >
                ← BACK
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded metal-panel-light text-red-400 text-sm text-center font-mono-crt" style={{ borderColor: 'rgba(255, 60, 60, 0.3)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
