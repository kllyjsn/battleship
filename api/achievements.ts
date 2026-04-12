import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './lib/mongodb';

interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

interface PlayerAchievements {
  playerName: string;
  unlocked: UnlockedAchievement[];
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
    const collection = db.collection<PlayerAchievements>('player_achievements');

    if (req.method === 'GET') {
      const player = req.query.player as string;
      if (!player) {
        return res.status(400).json({ error: 'Missing player parameter' });
      }

      const doc = await collection.findOne({ playerName: player });
      if (!doc) {
        return res.status(200).json({ unlocked: [] });
      }

      return res.status(200).json({ unlocked: doc.unlocked });
    }

    if (req.method === 'POST') {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests. Try again later.' });
      }

      const body = req.body as { playerName?: string; unlocked?: UnlockedAchievement[] };
      if (!body.playerName || !Array.isArray(body.unlocked)) {
        return res.status(400).json({ error: 'Invalid achievements payload' });
      }

      const playerName = String(body.playerName).slice(0, 20);

      // Merge: add any new achievements without removing existing ones
      const existing = await collection.findOne({ playerName });
      const existingIds = new Set((existing?.unlocked ?? []).map(a => a.id));
      const merged = [...(existing?.unlocked ?? [])];

      for (const achievement of body.unlocked) {
        if (!existingIds.has(achievement.id)) {
          merged.push({
            id: String(achievement.id),
            unlockedAt: achievement.unlockedAt || new Date().toISOString(),
          });
          existingIds.add(achievement.id);
        }
      }

      await collection.updateOne(
        { playerName },
        {
          $set: {
            playerName,
            unlocked: merged,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

      return res.status(200).json({ ok: true, unlocked: merged });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Achievements API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
