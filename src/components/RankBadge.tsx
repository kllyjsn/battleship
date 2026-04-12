import { Shield, ChevronsUp, Star, Medal, Crown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RankDef } from '../lib/ranks';

interface RankBadgeProps {
  rank: RankDef;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

const RANK_ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  'chevrons-up': ChevronsUp,
  star: Star,
  medal: Medal,
  crown: Crown,
};

export function RankBadge({ rank, size = 'sm', showTitle = true }: RankBadgeProps) {
  const Icon = RANK_ICONS[rank.icon] || Shield;
  const iconSize = size === 'lg' ? 20 : size === 'md' ? 16 : 13;

  return (
    <div className="flex items-center gap-1">
      <Icon size={iconSize} className={rank.color} />
      {showTitle && (
        <span className={`font-mono-crt font-bold ${rank.color} ${rank.glowClass} ${
          size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-[11px]'
        }`}>
          {rank.title.toUpperCase()}
        </span>
      )}
    </div>
  );
}
