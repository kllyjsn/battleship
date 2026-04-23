import { useMemo } from 'react';
import { X, Award } from 'lucide-react';
import { ACHIEVEMENTS, getUnlockedAchievements } from '../lib/achievements';
import type { AchievementDef } from '../lib/achievements';
import { useEscapeToClose } from '../hooks/useEscapeToClose';

interface AchievementsPanelProps {
  onClose: () => void;
}

const CATEGORY_LABELS: Record<AchievementDef['category'], string> = {
  combat: 'COMBAT',
  skill: 'SKILL',
  social: 'SOCIAL',
  milestone: 'MILESTONES',
};

const CATEGORY_ORDER: AchievementDef['category'][] = ['combat', 'skill', 'social', 'milestone'];

export function AchievementsPanel({ onClose }: AchievementsPanelProps) {
  useEscapeToClose(onClose);
  const unlocked = useMemo(() => {
    const list = getUnlockedAchievements();
    return new Set(list.map(a => a.id));
  }, []);

  const unlockedCount = unlocked.size;
  const totalCount = ACHIEVEMENTS.length;

  const grouped = useMemo(() => {
    const map: Record<string, AchievementDef[]> = {};
    for (const a of ACHIEVEMENTS) {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    }
    return map;
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Achievements"
    >
      <div className="metal-panel rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fadeIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-green-400 transition-colors"
          aria-label="Close achievements (Esc)"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-center font-mono-crt text-glow-amber mb-2">
          <Award size={22} className="inline-block mr-2 -mt-1" />
          MEDALS
        </h2>

        <p className="text-center text-sm font-mono-crt text-slate-400 mb-6">
          <span className="text-glow-green">{unlockedCount}</span>
          <span className="text-slate-600"> / </span>
          <span className="text-slate-400">{totalCount}</span>
          <span className="text-slate-600 ml-2">UNLOCKED</span>
        </p>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full overflow-hidden mb-6" style={{ background: 'var(--hull-dark)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(unlockedCount / totalCount) * 100}%`,
              background: 'linear-gradient(90deg, #ffb000, #ff8c00)',
            }}
          />
        </div>

        <div className="space-y-6">
          {CATEGORY_ORDER.map(cat => {
            const achievements = grouped[cat];
            if (!achievements || achievements.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-mono-crt text-green-500/50 tracking-widest mb-3">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="space-y-2">
                  {achievements.map(a => {
                    const isUnlocked = unlocked.has(a.id);
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isUnlocked
                            ? 'metal-panel-light'
                            : 'metal-panel-light opacity-50'
                        }`}
                        style={isUnlocked ? { borderColor: 'rgba(255, 176, 0, 0.3)' } : undefined}
                      >
                        <span className={`text-xl flex-shrink-0 ${isUnlocked ? '' : 'grayscale'}`}>
                          {isUnlocked ? a.icon : '🔒'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold font-mono-crt ${
                            isUnlocked ? 'text-amber-300' : 'text-slate-500'
                          }`}>
                            {a.name}
                          </p>
                          <p className="text-xs font-mono-crt text-slate-500 truncate">
                            {a.description}
                          </p>
                        </div>
                        {isUnlocked && (
                          <span className="text-[10px] font-mono-crt text-green-500/60 flex-shrink-0">
                            EARNED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
