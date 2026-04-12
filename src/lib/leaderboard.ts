export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number; // accuracy percentage
  shots: number;
  hits: number;
  mode: 'single' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  durationSeconds: number;
  date: string; // ISO string
}

const STORAGE_KEY = 'battleship-leaderboard';

function loadEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: LeaderboardEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addLeaderboardEntry(
  playerName: string,
  input: {
    mode: 'single' | 'multiplayer';
    difficulty?: 'easy' | 'medium' | 'hard';
    shots: number;
    hits: number;
    durationSeconds: number;
  }
): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName,
    score: input.shots > 0 ? Math.round((input.hits / input.shots) * 1000) / 10 : 0,
    shots: input.shots,
    hits: input.hits,
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
      // Sort by accuracy descending, then fewest shots ascending
      if (b.score !== a.score) return b.score - a.score;
      return a.shots - b.shots;
    })
    .slice(0, 50);
}

// --- Online leaderboard API ---

function getApiBase(): string {
  // In production (Vercel), API is at same origin under /api
  // In dev, we fall back to the Vite proxy or same origin
  return '/api';
}

async function submitOnlineEntry(entry: LeaderboardEntry): Promise<void> {
  try {
    await fetch(`${getApiBase()}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: entry.playerName,
        score: entry.score,
        shots: entry.shots,
        hits: entry.hits,
        mode: entry.mode,
        difficulty: entry.difficulty,
        durationSeconds: entry.durationSeconds,
      }),
    });
  } catch {
    // Silently fail — local entry is already saved
  }
}

export async function getOnlineLeaderboard(period?: Period): Promise<LeaderboardEntry[]> {
  try {
    const params = period ? `?period=${period}` : '';
    const resp = await fetch(`${getApiBase()}/leaderboard${params}`);
    if (!resp.ok) return [];
    return (await resp.json()) as LeaderboardEntry[];
  } catch {
    return [];
  }
}
