import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './lib/mongodb';

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

// Simple rate-limit: track IPs with timestamps (in-memory is fine for this)
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await getDb();
    const collection = db.collection<StoredEntry>('leaderboard');

    if (req.method === 'POST') {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many submissions. Try again later.' });
      }

      const body = req.body as Partial<StoredEntry>;
      if (!body.playerName || typeof body.score !== 'number' || typeof body.shots !== 'number') {
        console.warn('[Leaderboard] POST rejected — invalid entry:', {
          playerName: body.playerName,
          score: body.score,
          shots: body.shots,
        });
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

      await collection.insertOne(entry);
      console.info('[Leaderboard] New entry saved:', {
        id: entry.id,
        playerName: entry.playerName,
        totalScore: entry.totalScore,
        mode: entry.mode,
      });

      return res.status(201).json(entry);
    }

    if (req.method === 'GET') {
      const { period } = req.query;
      const now = new Date();
      const filter: Record<string, unknown> = {};

      if (period === 'day') {
        const cutoff = new Date(now);
        cutoff.setHours(0, 0, 0, 0);
        filter.date = { $gte: cutoff.toISOString() };
      } else if (period === 'week') {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - cutoff.getDay());
        cutoff.setHours(0, 0, 0, 0);
        filter.date = { $gte: cutoff.toISOString() };
      } else if (period === 'month') {
        const cutoff = new Date(now);
        cutoff.setDate(1);
        cutoff.setHours(0, 0, 0, 0);
        filter.date = { $gte: cutoff.toISOString() };
      }

      const entries = await collection
        .find(filter)
        .sort({ totalScore: -1, score: -1, shots: 1 })
        .limit(50)
        .toArray();

      console.info(`[Leaderboard] GET returned ${entries.length} entries (period=${period ?? 'all'})`);
      return res.status(200).json(entries);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Leaderboard] API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
