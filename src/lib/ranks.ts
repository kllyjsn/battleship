import { loadStats } from './stats';

export interface RankDef {
  id: string;
  title: string;
  minWins: number;
  icon: string; // lucide icon name hint for UI
  color: string; // tailwind text color class
  glowClass: string; // glow style class
}

export const RANKS: RankDef[] = [
  { id: 'ensign', title: 'Ensign', minWins: 0, icon: 'shield', color: 'text-slate-400', glowClass: '' },
  { id: 'lieutenant', title: 'Lieutenant', minWins: 3, icon: 'chevrons-up', color: 'text-green-400', glowClass: 'text-glow-green' },
  { id: 'commander', title: 'Commander', minWins: 10, icon: 'star', color: 'text-amber-400', glowClass: 'text-glow-amber' },
  { id: 'captain', title: 'Captain', minWins: 25, icon: 'medal', color: 'text-amber-300', glowClass: 'text-glow-amber' },
  { id: 'rear_admiral', title: 'Rear Admiral', minWins: 50, icon: 'crown', color: 'text-purple-400', glowClass: '' },
  { id: 'fleet_admiral', title: 'Fleet Admiral', minWins: 100, icon: 'crown', color: 'text-yellow-300', glowClass: 'text-glow-amber' },
];

export function getRankForWins(wins: number): RankDef {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (wins >= r.minWins) rank = r;
  }
  return rank;
}

export function getNextRank(currentRank: RankDef): RankDef | null {
  const idx = RANKS.findIndex(r => r.id === currentRank.id);
  if (idx < 0 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1];
}

export function getPlayerRank(): { rank: RankDef; totalWins: number; nextRank: RankDef | null; winsToNext: number } {
  const stats = loadStats();
  const totalWins = stats.games.filter(g => g.result === 'win').length;
  const rank = getRankForWins(totalWins);
  const nextRank = getNextRank(rank);
  const winsToNext = nextRank ? nextRank.minWins - totalWins : 0;
  return { rank, totalWins, nextRank, winsToNext };
}
