import type { Ship, Position } from '../engine/types';

export interface ReplayMove {
  player: 'player' | 'opponent';
  row: number;
  col: number;
  result: 'hit' | 'miss' | 'sunk';
  shipName?: string;
  shipId?: string;
  shipPositions?: Position[];
}

export interface ReplayData {
  playerShipPlacements: Ship[];
  opponentShipPlacements: Ship[];
  moves: ReplayMove[];
  winner: 'player' | 'opponent';
  difficulty?: string;
  date: string;
}
