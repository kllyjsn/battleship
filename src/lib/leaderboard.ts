import { STORAGE_KEYS, getApiBase } from './storageKeys';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number; // accuracy percentage
  totalScore: number; // point-based score (hits, sinks, misses)
  shots: number;
  hits: number;
  won: boolean;
  mode: 'single' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  durationSeconds: number;
  date: string; // ISO string
}

function loadEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: LeaderboardEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(entries));
}

export function addLeaderboardEntry(
  playerName: string,
  input: {
    mode: 'single' | 'multiplayer';
    difficulty?: 'easy' | 'medium' | 'hard';
    shots: number;
    hits: number;
    totalScore: number;
    won: boolean;
    durationSeconds: number;
  }
): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName,
    score: input.shots > 0 ? Math.round((input.hits / input.shots) * 1000) / 10 : 0,
    totalScore: input.totalScore,
    shots: input.shots,
    hits: input.hits,
    won: input.won,
    mode: input.mode,
    difficulty: input.difficulty,
    durationSeconds: input.durationSeconds,
    date: new Date().toISOString(),
  };

  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);

  // Fire-and-forget: also submit to online API
  submitOnlineEntry(entry).catch(() => {});

  return entry;
}

export type Period = 'day' | 'week' | 'month';

function getStartOfPeriod(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'day': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'week': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': {
      const d = new Date(now);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
}

export function getLeaderboard(period: Period): LeaderboardEntry[] {
  const entries = loadEntries();
  const cutoff = getStartOfPeriod(period);

  return entries
    .filter((e) => new Date(e.date) >= cutoff)
    .sort((a, b) => {
      // Sort by total score descending, then accuracy descending, then fewest shots ascending
      const aTotal = a.totalScore ?? 0;
      const bTotal = b.totalScore ?? 0;
      if (bTotal !== aTotal) return bTotal - aTotal;
      if (b.score !== a.score) return b.score - a.score;
      return a.shots - b.shots;
    })
    .slice(0, 50);
}

// --- Online leaderboard API ---

async function submitOnlineEntry(entry: LeaderboardEntry): Promise<void> {
  try {
    const resp = await fetch(`${getApiBase()}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: entry.playerName,
        score: entry.score,
        totalScore: entry.totalScore,
        shots: entry.shots,
        hits: entry.hits,
        won: entry.won,
        mode: entry.mode,
        difficulty: entry.difficulty,
        durationSeconds: entry.durationSeconds,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error(
        `[Leaderboard] POST /leaderboard failed: ${resp.status} ${resp.statusText}`,
        body,
      );
    } else {
      console.info('[Leaderboard] Score submitted to global leaderboard');
    }
  } catch (err) {
    console.error('[Leaderboard] Network error submitting score:', err);
  }
}

export interface OnlineLeaderboardResult {
  entries: LeaderboardEntry[];
  error?: string;
}

export async function getOnlineLeaderboard(period?: Period): Promise<OnlineLeaderboardResult> {
  try {
    const params = period ? `?period=${period}` : '';
    const resp = await fetch(`${getApiBase()}/leaderboard${params}`);
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      const msg = `GET /leaderboard failed: ${resp.status} ${resp.statusText}`;
      console.error(`[Leaderboard] ${msg}`, body);
      return { entries: [], error: msg };
    }
    const entries = (await resp.json()) as LeaderboardEntry[];
    console.info(`[Leaderboard] Fetched ${entries.length} global entries (period=${period ?? 'all'})`);
    return { entries };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.error('[Leaderboard] Network error fetching global leaderboard:', err);
    return { entries: [], error: msg };
  }
}
