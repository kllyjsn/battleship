import { STORAGE_KEYS, getSessionName, getApiBase } from './storageKeys';

export interface GameRecord {
  date: string;
  mode: 'single' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  result: 'win' | 'loss';
  playerShots: number;
  playerHits: number;
  opponentName?: string;
  duration?: number;
}

export interface Stats {
  games: GameRecord[];
  currentWinStreak: number;
  bestWinStreak: number;
}

async function syncStatsOnline(stats: Stats): Promise<void> {
  const playerName = getSessionName();
  if (!playerName) return;
  try {
    await fetch(`${getApiBase()}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName,
        games: stats.games,
        currentWinStreak: stats.currentWinStreak,
        bestWinStreak: stats.bestWinStreak,
      }),
    });
  } catch {
    // Silently fail — local cache is already saved
  }
}

function defaultStats(): Stats {
  return { games: [], currentWinStreak: 0, bestWinStreak: 0 };
}

/** Load stats from localStorage cache (synchronous, for immediate UI). */
export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as Stats;
    return {
      games: parsed.games ?? [],
      currentWinStreak: parsed.currentWinStreak ?? 0,
      bestWinStreak: parsed.bestWinStreak ?? 0,
    };
  } catch {
    return defaultStats();
  }
}

/**
 * Fetch stats from MongoDB and update the local cache.
 * Returns the MongoDB stats, falling back to local cache on failure.
 */
export async function fetchStats(): Promise<Stats> {
  const playerName = getSessionName();
  if (!playerName) return loadStats();
  try {
    const resp = await fetch(`${getApiBase()}/stats?player=${encodeURIComponent(playerName)}`);
    if (!resp.ok) return loadStats();
    const data = await resp.json() as Stats;
    const stats: Stats = {
      games: data.games ?? [],
      currentWinStreak: data.currentWinStreak ?? 0,
      bestWinStreak: data.bestWinStreak ?? 0,
    };
    // Update local cache
    try { localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)); } catch { /* ignore */ }
    return stats.games.length > 0 ? stats : loadStats();
  } catch {
    return loadStats();
  }
}

export function saveGame(record: GameRecord): Stats {
  const stats = loadStats();
  stats.games.push(record);

  if (record.result === 'win') {
    stats.currentWinStreak++;
    if (stats.currentWinStreak > stats.bestWinStreak) {
      stats.bestWinStreak = stats.currentWinStreak;
    }
  } else {
    stats.currentWinStreak = 0;
  }

  // Cache locally for fast reads
  try { localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)); } catch { /* ignore */ }

  // Primary persistence: sync to MongoDB
  syncStatsOnline(stats).catch(() => {});

  return stats;
}

export interface StatsOverview {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  perDifficulty: Record<string, { wins: number; losses: number }>;
  multiplayerWins: number;
  multiplayerLosses: number;
}

export function getStatsOverview(stats: Stats): StatsOverview {
  const totalGames = stats.games.length;
  const wins = stats.games.filter((g) => g.result === 'win').length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  const totalShots = stats.games.reduce((s, g) => s + g.playerShots, 0);
  const totalHits = stats.games.reduce((s, g) => s + g.playerHits, 0);
  const accuracy = totalShots > 0 ? (totalHits / totalShots) * 100 : 0;

  const perDifficulty: Record<string, { wins: number; losses: number }> = {
    easy: { wins: 0, losses: 0 },
    medium: { wins: 0, losses: 0 },
    hard: { wins: 0, losses: 0 },
  };

  const mpGames = stats.games.filter((g) => g.mode === 'multiplayer');
  const multiplayerWins = mpGames.filter((g) => g.result === 'win').length;
  const multiplayerLosses = mpGames.length - multiplayerWins;

  for (const g of stats.games) {
    if (g.mode === 'single' && g.difficulty && perDifficulty[g.difficulty]) {
      if (g.result === 'win') perDifficulty[g.difficulty].wins++;
      else perDifficulty[g.difficulty].losses++;
    }
  }

  return {
    totalGames,
    wins,
    losses,
    winRate,
    accuracy,
    currentStreak: stats.currentWinStreak,
    bestStreak: stats.bestWinStreak,
    perDifficulty,
    multiplayerWins,
    multiplayerLosses,
  };
}

export async function getOnlineStats(playerName: string): Promise<Stats | null> {
  try {
    const resp = await fetch(`${getApiBase()}/stats?player=${encodeURIComponent(playerName)}`);
    if (!resp.ok) return null;
    const data = await resp.json() as Stats;
    if (!data.games || data.games.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearStats(): void {
  try { localStorage.removeItem(STORAGE_KEYS.STATS); } catch { /* ignore */ }
  // Clear on MongoDB too
  const playerName = getSessionName();
  if (playerName) {
    syncStatsOnline(defaultStats()).catch(() => {});
  }
}
