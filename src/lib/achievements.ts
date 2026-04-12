import type { GameRecord } from './stats';
import { loadStats } from './stats';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: 'combat' | 'skill' | 'social' | 'milestone';
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO date
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Combat
  { id: 'first_blood', name: 'First Blood', description: 'Win your first game', icon: '🎖️', category: 'combat' },
  { id: 'perfect_game', name: 'Perfect Game', description: 'Win without losing a single ship', icon: '💎', category: 'combat' },
  { id: 'demolition_expert', name: 'Demolition Expert', description: 'Sink all enemy ships in under 30 shots', icon: '💣', category: 'combat' },

  // Skill
  { id: 'admiral_slayer', name: 'Admiral Slayer', description: 'Beat the Admiral (Hard) AI', icon: '⭐', category: 'skill' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Win a game in under 2 minutes', icon: '⚡', category: 'skill' },
  { id: 'sharpshooter', name: 'Sharpshooter', description: 'Win with 80%+ accuracy', icon: '🎯', category: 'skill' },

  // Social
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Win a multiplayer game', icon: '🤝', category: 'social' },

  // Milestones
  { id: 'untouchable', name: 'Untouchable', description: 'Win 5 games in a row', icon: '🛡️', category: 'milestone' },
  { id: 'streak_master', name: 'Streak Master', description: 'Reach a 10-game win streak', icon: '🔥', category: 'milestone' },
  { id: 'fleet_commander', name: 'Fleet Commander', description: 'Win 50 games total', icon: '👑', category: 'milestone' },
];

const STORAGE_KEY = 'battleship-achievements';

function loadUnlocked(): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UnlockedAchievement[];
  } catch {
    return [];
  }
}

function saveUnlocked(unlocked: UnlockedAchievement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
}

export function getUnlockedAchievements(): UnlockedAchievement[] {
  return loadUnlocked();
}

export function isAchievementUnlocked(id: string): boolean {
  return loadUnlocked().some(a => a.id === id);
}

function unlock(id: string): UnlockedAchievement | null {
  const unlocked = loadUnlocked();
  if (unlocked.some(a => a.id === id)) return null;
  const entry: UnlockedAchievement = { id, unlockedAt: new Date().toISOString() };
  unlocked.push(entry);
  saveUnlocked(unlocked);
  return entry;
}

export interface GameEndContext {
  result: 'win' | 'loss';
  mode: 'single' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  playerShots: number;
  playerHits: number;
  durationSeconds: number;
  playerShipsLost: number;
  totalPlayerShips: number;
}

/**
 * Check all achievement conditions after a game ends.
 * Returns an array of newly unlocked achievement IDs.
 */
export function checkAchievements(ctx: GameEndContext): string[] {
  const newlyUnlocked: string[] = [];

  if (ctx.result !== 'win') return newlyUnlocked;

  const stats = loadStats();
  const totalWins = stats.games.filter((g: GameRecord) => g.result === 'win').length;
  const accuracy = ctx.playerShots > 0 ? (ctx.playerHits / ctx.playerShots) * 100 : 0;

  // First Blood - win first game
  if (totalWins >= 1) {
    const r = unlock('first_blood');
    if (r) newlyUnlocked.push(r.id);
  }

  // Perfect Game - win without losing a ship
  if (ctx.playerShipsLost === 0) {
    const r = unlock('perfect_game');
    if (r) newlyUnlocked.push(r.id);
  }

  // Demolition Expert - sink all ships in under 30 shots
  if (ctx.playerShots <= 30) {
    const r = unlock('demolition_expert');
    if (r) newlyUnlocked.push(r.id);
  }

  // Admiral Slayer - beat hard AI
  if (ctx.mode === 'single' && ctx.difficulty === 'hard') {
    const r = unlock('admiral_slayer');
    if (r) newlyUnlocked.push(r.id);
  }

  // Speed Demon - win under 2 minutes
  if (ctx.durationSeconds > 0 && ctx.durationSeconds < 120) {
    const r = unlock('speed_demon');
    if (r) newlyUnlocked.push(r.id);
  }

  // Sharpshooter - 80%+ accuracy
  if (accuracy >= 80 && ctx.playerShots >= 10) {
    const r = unlock('sharpshooter');
    if (r) newlyUnlocked.push(r.id);
  }

  // Social Butterfly - win a multiplayer game
  if (ctx.mode === 'multiplayer') {
    const r = unlock('social_butterfly');
    if (r) newlyUnlocked.push(r.id);
  }

  // Untouchable - 5 win streak
  if (stats.currentWinStreak >= 5) {
    const r = unlock('untouchable');
    if (r) newlyUnlocked.push(r.id);
  }

  // Streak Master - 10 win streak
  if (stats.currentWinStreak >= 10) {
    const r = unlock('streak_master');
    if (r) newlyUnlocked.push(r.id);
  }

  // Fleet Commander - 50 total wins
  if (totalWins >= 50) {
    const r = unlock('fleet_commander');
    if (r) newlyUnlocked.push(r.id);
  }

  return newlyUnlocked;
}

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
