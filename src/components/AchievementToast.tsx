import { useEffect, useState } from 'react';
import { getAchievementDef } from '../lib/achievements';

interface AchievementToastProps {
  achievementIds: string[];
  onDone: () => void;
}

export function AchievementToast({ achievementIds, onDone }: AchievementToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const current = achievementIds[currentIndex];
  const def = current ? getAchievementDef(current) : undefined;

  useEffect(() => {
    if (!def) {
      onDone();
      return;
    }
    setVisible(true);
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 2800);
    const nextTimer = setTimeout(() => {
      if (currentIndex < achievementIds.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onDone();
      }
    }, 3200);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [currentIndex, def, achievementIds.length, onDone]);

  if (!def) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div
        className="metal-panel rounded-lg px-5 py-3 flex items-center gap-3 min-w-[280px]"
        style={{ boxShadow: '0 0 20px rgba(255, 176, 0, 0.2), 0 4px 20px rgba(0,0,0,0.5)' }}
      >
        <span className="text-2xl flex-shrink-0">{def.icon}</span>
        <div>
          <p className="text-[10px] text-amber-400/70 font-mono-crt tracking-widest uppercase">Achievement Unlocked</p>
          <p className="text-sm font-semibold text-glow-amber font-mono-crt">{def.name}</p>
          <p className="text-xs text-slate-400 font-mono-crt">{def.description}</p>
        </div>
      </div>
    </div>
  );
}
