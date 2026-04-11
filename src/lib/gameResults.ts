import { saveGame } from './stats';

export interface GameResultInput {
  mode: 'single' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  result: 'win' | 'loss';
  playerShots: number;
  playerHits: number;
  opponentName?: string;
  durationSeconds?: number;
}

export function saveGameResult(input: GameResultInput) {
  saveGame({
    date: new Date().toISOString(),
    mode: input.mode,
    difficulty: input.difficulty,
    result: input.result,
    playerShots: input.playerShots,
    playerHits: input.playerHits,
    opponentName: input.opponentName,
    duration: input.durationSeconds,
  });
}
