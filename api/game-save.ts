import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './lib/mongodb';

interface SavedGameDoc {
  playerName: string;
  gameState: Record<string, unknown>;
  updatedAt: string;
}

// Simple rate-limit
const rateMap = new Map<string, number[]>();
const RATE_WINDOW = 60_000;
const RATE_LIMIT = 60;

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await getDb();
    const collection = db.collection<SavedGameDoc>('saved_games');

    if (req.method === 'GET') {
      const player = req.query.player as string;
      if (!player) {
        return res.status(400).json({ error: 'Missing player parameter' });
      }

      const doc = await collection.findOne({ playerName: player });
      if (!doc) {
        return res.status(200).json({ gameState: null });
      }

      return res.status(200).json({ gameState: doc.gameState });
    }

    if (req.method === 'POST') {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests. Try again later.' });
      }

      const body = req.body as { playerName?: string; gameState?: Record<string, unknown> };
      if (!body.playerName || !body.gameState) {
        return res.status(400).json({ error: 'Missing playerName or gameState' });
      }

      const playerName = String(body.playerName).slice(0, 20);

      await collection.updateOne(
        { playerName },
        {
          $set: {
            playerName,
            gameState: body.gameState,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const player = req.query.player as string;
      if (!player) {
        return res.status(400).json({ error: 'Missing player parameter' });
      }

      await collection.deleteOne({ playerName: player });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Game-save API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
