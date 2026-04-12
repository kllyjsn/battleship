import { useState, useEffect } from 'react';
import { Crosshair, Anchor } from 'lucide-react';

interface ShipNotificationEntry {
  id: number;
  type: 'hit' | 'sunk';
  shipName: string;
  /** Who performed the action: 'player' attacked opponent, 'opponent' attacked player */
  actor: 'player' | 'opponent';
}

interface ShipNotificationProps {
  type: 'hit' | 'sunk';
  shipName: string;
  actor: 'player' | 'opponent';
  trigger: number;
}

export function ShipNotification({ type, shipName, actor, trigger }: ShipNotificationProps) {
  const [notifications, setNotifications] = useState<ShipNotificationEntry[]>([]);

  useEffect(() => {
    if (trigger === 0 || !shipName) return;
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, shipName, actor }]);
    const duration = type === 'sunk' ? 3500 : 2200;
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (notifications.length === 0) return null;

  return (
    <>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="fixed left-1/2 -translate-x-1/2 z-[55] pointer-events-none"
          style={{
            top: notif.type === 'sunk' ? '15%' : '12%',
            animation: notif.type === 'sunk'
              ? 'shipNotifSunkIn 3.5s ease-out forwards'
              : 'shipNotifHitIn 2.2s ease-out forwards',
          }}
        >
          {notif.type === 'sunk' ? (
            <SunkBanner shipName={notif.shipName} actor={notif.actor} />
          ) : (
            <HitBanner shipName={notif.shipName} actor={notif.actor} />
          )}
        </div>
      ))}
    </>
  );
}

function HitBanner({ shipName, actor }: { shipName: string; actor: 'player' | 'opponent' }) {
  const isPlayer = actor === 'player';
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 rounded-lg metal-panel-light"
      style={{
        boxShadow: isPlayer
          ? '0 0 16px rgba(255, 150, 0, 0.25), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 0 16px rgba(255, 60, 60, 0.25), 0 4px 16px rgba(0,0,0,0.4)',
        border: `1px solid ${isPlayer ? 'rgba(255, 176, 0, 0.3)' : 'rgba(255, 60, 60, 0.3)'}`,
      }}
    >
      <Crosshair size={16} className={isPlayer ? 'text-amber-400' : 'text-red-400'} />
      <div>
        <p className="text-[9px] font-mono-crt tracking-widest uppercase" style={{ color: isPlayer ? 'rgba(255, 176, 0, 0.6)' : 'rgba(255, 60, 60, 0.6)' }}>
          {isPlayer ? 'HIT CONFIRMED' : 'INCOMING HIT'}
        </p>
        <p className={`text-sm font-bold font-mono-crt ${isPlayer ? 'text-glow-amber' : 'text-glow-red'}`}>
          {isPlayer ? `Hit their ${shipName}!` : `Your ${shipName} was hit!`}
        </p>
      </div>
    </div>
  );
}

function SunkBanner({ shipName, actor }: { shipName: string; actor: 'player' | 'opponent' }) {
  const isPlayer = actor === 'player';
  return (
    <div
      className="flex flex-col items-center gap-1 px-6 py-3 rounded-lg ship-sunk-celebration"
      style={{
        background: isPlayer
          ? 'linear-gradient(145deg, rgba(37, 43, 59, 0.95), rgba(26, 31, 46, 0.95))'
          : 'linear-gradient(145deg, rgba(59, 37, 37, 0.95), rgba(46, 26, 26, 0.95))',
        boxShadow: isPlayer
          ? '0 0 30px rgba(255, 176, 0, 0.3), 0 0 60px rgba(255, 176, 0, 0.1), 0 4px 24px rgba(0,0,0,0.5)'
          : '0 0 30px rgba(255, 60, 60, 0.3), 0 0 60px rgba(255, 60, 60, 0.1), 0 4px 24px rgba(0,0,0,0.5)',
        border: `1px solid ${isPlayer ? 'rgba(255, 176, 0, 0.4)' : 'rgba(255, 60, 60, 0.4)'}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Anchor size={18} className={isPlayer ? 'text-amber-400' : 'text-red-400'} style={{ animation: 'sunkIconSpin 0.6s ease-out' }} />
        <p className="text-[10px] font-mono-crt tracking-[0.2em] uppercase" style={{ color: isPlayer ? 'rgba(255, 176, 0, 0.7)' : 'rgba(255, 60, 60, 0.7)' }}>
          {isPlayer ? 'SHIP DESTROYED' : 'SHIP LOST'}
        </p>
        <Anchor size={18} className={isPlayer ? 'text-amber-400' : 'text-red-400'} style={{ animation: 'sunkIconSpin 0.6s ease-out' }} />
      </div>
      <p
        className={`text-lg font-bold font-mono-crt ${isPlayer ? 'text-glow-amber' : 'text-glow-red'}`}
        style={{ animation: 'sunkTextPulse 1.5s ease-in-out infinite' }}
      >
        {isPlayer ? `${shipName} sunk!` : `Your ${shipName} is sunk!`}
      </p>
      {isPlayer && (
        <div className="flex gap-1 mt-0.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-amber-400"
              style={{
                animation: `sunkSparkle 0.8s ease-out ${i * 0.1}s forwards`,
                boxShadow: '0 0 4px rgba(255, 176, 0, 0.6)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
