import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory store (resets on cold start — suitable for demo/MVP).
// For production persistence, swap with Vercel KV, Upstash Redis, or a DB.
interface StoredEntry {
  id: string;
  playerName: string;
  score: number;
  totalScore: number;
  shots: number;
  hits: number;
  won: boolean;
  mode: 'single' | 'multiplayer';
  difficulty?: string;
  durationSeconds: number;
  date: string;
}

const entries: StoredEntry[] = [];
const MAX_ENTRIES = 200;

// Simple rate-limit: track IPs with timestamps
const rateMap = new Map<string, number[]>();
const RATE_WINDOW = 60_000; // 1 minute
const RATE_LIMIT = 10; // max submissions per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateMap.get(ip) ?? [];
  const recent = timestamps.filter(t => now - t < RATE_WINDOW);
  rateMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  return false;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many submissions. Try again later.' });
    }

    const body = req.body as Partial<StoredEntry>;
    if (!body.playerName || typeof body.score !== 'number' || typeof body.shots !== 'number') {
      return res.status(400).json({ error: 'Invalid entry' });
    }

    const entry: StoredEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerName: String(body.playerName).slice(0, 20),
      score: Number(body.score),
      totalScore: Number(body.totalScore) || 0,
      shots: Number(body.shots),
      hits: Number(body.hits) || 0,
      won: body.won !== false,
      mode: body.mode === 'multiplayer' ? 'multiplayer' : 'single',
      difficulty: body.difficulty,
      durationSeconds: Number(body.durationSeconds) || 0,
      date: new Date().toISOString(),
    };

    entries.push(entry);

    // Prune oldest when over limit
    if (entries.length > MAX_ENTRIES) {
      entries.splice(0, entries.length - MAX_ENTRIES);
    }

    return res.status(201).json(entry);
  }

  if (req.method === 'GET') {
    const { period } = req.query;
    let cutoff: Date | null = null;
    const now = new Date();

    if (period === 'day') {
      cutoff = new Date(now);
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - cutoff.getDay());
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      cutoff = new Date(now);
      cutoff.setDate(1);
      cutoff.setHours(0, 0, 0, 0);
    }

    const filtered = cutoff
      ? entries.filter(e => new Date(e.date) >= cutoff!)
      : [...entries];

    filtered.sort((a, b) => {
      // Sort by total score descending, then accuracy, then fewest shots
      const aTotal = a.totalScore ?? 0;
      const bTotal = b.totalScore ?? 0;
      if (bTotal !== aTotal) return bTotal - aTotal;
      if (b.score !== a.score) return b.score - a.score;
      return a.shots - b.shots;
    });

    return res.status(200).json(filtered.slice(0, 50));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
