import { useState, useEffect } from 'react';

interface ScorePopupProps {
  points: number;
  label: string;
  position: { row: number; col: number } | null;
  trigger: number; // increment to trigger a new popup
}

interface PopupEntry {
  id: number;
  points: number;
  label: string;
}

export function ScorePopup({ points, label, position, trigger }: ScorePopupProps) {
  const [popups, setPopups] = useState<PopupEntry[]>([]);

  useEffect(() => {
    if (trigger === 0 || !position) return;
    const id = Date.now();
    setPopups(prev => [...prev, { id, points, label }]);
    const timer = setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (popups.length === 0) return null;

  return (
    <>
      {popups.map((popup) => (
        <div
          key={popup.id}
          className="fixed z-[60] pointer-events-none font-mono-crt font-bold text-sm"
          style={{
            left: '50%',
            top: '40%',
            transform: 'translateX(-50%)',
            animation: 'scoreFloat 1.2s ease-out forwards',
          }}
        >
          <span
            className={popup.label === 'MISS' ? 'text-slate-400' : 'text-glow-amber'}
            style={{
              textShadow: popup.label === 'MISS'
                ? 'none'
                : '0 0 8px rgba(255, 176, 0, 0.6), 0 0 16px rgba(255, 176, 0, 0.3)',
            }}
          >
            +{popup.points} {popup.label}
          </span>
        </div>
      ))}
    </>
  );
}
