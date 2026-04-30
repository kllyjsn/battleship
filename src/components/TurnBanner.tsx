import { useState, useEffect } from 'react';
import { Crosshair, ShieldAlert } from 'lucide-react';

interface TurnBannerProps {
  isPlayerTurn: boolean;
  phase: 'placement' | 'battle' | 'gameover';
}

/**
 * Full-width banner that flashes briefly when the turn changes during battle.
 * Fades out automatically after a short display.
 */
export function TurnBanner({ isPlayerTurn, phase }: TurnBannerProps) {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [isPlayer, setIsPlayer] = useState(true);

  useEffect(() => {
    if (phase !== 'battle') return;
    setLabel(isPlayerTurn ? 'YOUR TURN' : 'ENEMY TARGETING');
    setIsPlayer(isPlayerTurn);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(timer);
  }, [isPlayerTurn, phase]);

  if (!visible || phase !== 'battle') return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      style={{ animation: 'turnBannerFade 0.9s ease-out forwards' }}
    >
      <div
        className={`flex items-center gap-3 px-8 py-3 rounded-lg font-mono-crt text-lg sm:text-xl font-bold tracking-widest ${
          isPlayer ? 'text-glow-green' : 'text-glow-amber'
        }`}
        style={{
          background: 'rgba(10, 14, 26, 0.85)',
          border: `1px solid ${isPlayer ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 176, 0, 0.3)'}`,
          boxShadow: isPlayer
            ? '0 0 30px rgba(57, 255, 20, 0.15)'
            : '0 0 30px rgba(255, 176, 0, 0.15)',
        }}
      >
        {isPlayer ? <Crosshair size={22} /> : <ShieldAlert size={22} />}
        {label}
      </div>
    </div>
  );
}
