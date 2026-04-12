import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, MongoConfigError } from './lib/mongodb';

interface GameRecord {
  date: string;
  mode: 'single' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  result: 'win' | 'loss';
  playerShots: number;
  playerHits: number;
  opponentName?: string;
  duration?: number;
}

interface PlayerStats {
  playerName: string;
  games: GameRecord[];
  currentWinStreak: number;
  bestWinStreak: number;
  updatedAt: string;
}

// Simple rate-limit
const rateMap = new Map<string, number[]>();
const RATE_WINDOW = 60_000;
const RATE_LIMIT = 20;

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await getDb();
    const collection = db.collection<PlayerStats>('player_stats');

    if (req.method === 'GET') {
      const player = req.query.player as string;
      if (!player) {
        return res.status(400).json({ error: 'Missing player parameter' });
      }

      const doc = await collection.findOne({ playerName: player });
      if (!doc) {
        return res.status(200).json({ games: [], currentWinStreak: 0, bestWinStreak: 0 });
      }

      return res.status(200).json({
        games: doc.games,
        currentWinStreak: doc.currentWinStreak,
        bestWinStreak: doc.bestWinStreak,
      });
    }

    if (req.method === 'POST') {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests. Try again later.' });
      }

      const body = req.body as Partial<PlayerStats>;
      if (!body.playerName || !Array.isArray(body.games)) {
        return res.status(400).json({ error: 'Invalid stats payload' });
      }

      const playerName = String(body.playerName).slice(0, 20);

      await collection.updateOne(
        { playerName },
        {
          $set: {
            playerName,
            games: body.games.slice(-200), // keep last 200 games max
            currentWinStreak: Number(body.currentWinStreak) || 0,
            bestWinStreak: Number(body.bestWinStreak) || 0,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Stats] API error:', err);
    if (err instanceof MongoConfigError) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
