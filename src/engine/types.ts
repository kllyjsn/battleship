export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type Orientation = 'horizontal' | 'vertical';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 'placement' | 'battle' | 'gameover';

export type GameMode = 'single' | 'multiplayer';

export type PlayerRole = 'host' | 'guest';

export interface Position {
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  name: string;
  size: number;
  positions: Position[];
  orientation: Orientation;
  hits: number;
  sunk: boolean;
}

export interface ShipDefinition {
  id: string;
  name: string;
  size: number;
}

export interface Cell {
  row: number;
  col: number;
  state: CellState;
  shipId: string | null;
}

export type Board = Cell[][];

export interface AttackResult {
  position: Position;
  result: 'hit' | 'miss' | 'sunk';
  shipName?: string;
  shipId?: string;
  shipPositions?: Position[];
}

export interface GameState {
  phase: GamePhase;
  playerBoard: Board;
  opponentBoard: Board;
  playerShips: Ship[];
  opponentShips: Ship[];
  isPlayerTurn: boolean;
  winner: 'player' | 'opponent' | null;
  lastAttack: AttackResult | null;
  message: string;
}

export interface MultiplayerMessage {
  type: 'JOIN' | 'READY' | 'ATTACK' | 'ATTACK_RESULT' | 'GAME_OVER' | 'CHAT' | 'REMATCH' | 'LEAVE';
  playerName?: string;
  playerId?: string;
  ships?: Ship[];
  row?: number;
  col?: number;
  result?: 'hit' | 'miss' | 'sunk';
  shipName?: string;
  shipId?: string;
  shipPositions?: Position[];
  winner?: string;
  message?: string;
  sender?: string;
  accepted?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
}
