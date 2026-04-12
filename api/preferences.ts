import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, MongoConfigError } from './lib/mongodb';

interface PlayerPreferences {
  playerName: string;
  theme: string;
  soundMuted: boolean;
  updatedAt: string;
}

// Simple rate-limit
const rateMap = new Map<string, number[]>();
const RATE_WINDOW = 60_000;
const RATE_LIMIT = 30;

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
    const collection = db.collection<PlayerPreferences>('player_preferences');

    if (req.method === 'GET') {
      const player = req.query.player as string;
      if (!player) {
        return res.status(400).json({ error: 'Missing player parameter' });
      }

      const doc = await collection.findOne({ playerName: player });
      if (!doc) {
        return res.status(200).json({ theme: 'classic', soundMuted: false });
      }

      return res.status(200).json({
        theme: doc.theme ?? 'classic',
        soundMuted: doc.soundMuted ?? false,
      });
    }

    if (req.method === 'POST') {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests. Try again later.' });
      }

      const body = req.body as Partial<PlayerPreferences>;
      if (!body.playerName) {
        return res.status(400).json({ error: 'Missing playerName' });
      }

      const playerName = String(body.playerName).slice(0, 20);

      const update: Record<string, unknown> = {
        playerName,
        updatedAt: new Date().toISOString(),
      };

      if (body.theme !== undefined) update.theme = String(body.theme);
      if (body.soundMuted !== undefined) update.soundMuted = Boolean(body.soundMuted);

      await collection.updateOne(
        { playerName },
        { $set: update },
        { upsert: true },
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Preferences] API error:', err);
    if (err instanceof MongoConfigError) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
