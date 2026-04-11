import { supabase } from './supabase';

export interface GameResultInput {
  mode: 'single' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  result: 'win' | 'loss';
  playerShots: number;
  playerHits: number;
  opponentName?: string;
  durationSeconds?: number;
}

export async function saveGameResult(userId: string, input: GameResultInput) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('game_results').insert({
    user_id: userId,
    mode: input.mode,
    difficulty: input.difficulty || null,
    result: input.result,
    player_shots: input.playerShots,
    player_hits: input.playerHits,
    opponent_name: input.opponentName || null,
    duration_seconds: input.durationSeconds || null,
  }).select().single();
  if (error) console.error('Failed to save game result:', error);
  return data;
}

export async function getMyStats(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return null; }
  return data;
}

export async function getLeaderboard() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(50);
  if (error) { console.error(error); return null; }
  return data;
}
