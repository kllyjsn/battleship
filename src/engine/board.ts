import type { Board, Cell, Ship, Position, Orientation, AttackResult, ShipDefinition } from './types';
import { BOARD_SIZE } from './constants';

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      rowCells.push({ row, col, state: 'empty', shipId: null });
    }
    board.push(rowCells);
  }
  return board;
}

export function canPlaceShip(
  board: Board,
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;

    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c].shipId !== null) return false;
  }
  return true;
}

export function getShipPositions(
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < size; i++) {
    positions.push({
      row: orientation === 'vertical' ? row + i : row,
      col: orientation === 'horizontal' ? col + i : col,
    });
  }
  return positions;
}

export function placeShip(
  board: Board,
  ship: ShipDefinition,
  row: number,
  col: number,
  orientation: Orientation
): { board: Board; ship: Ship } | null {
  if (!canPlaceShip(board, row, col, ship.size, orientation)) return null;

  const positions = getShipPositions(row, col, ship.size, orientation);
  const newBoard = board.map(r => r.map(c => ({ ...c })));

  for (const pos of positions) {
    newBoard[pos.row][pos.col] = {
      ...newBoard[pos.row][pos.col],
      state: 'ship',
      shipId: ship.id,
    };
  }

  const placedShip: Ship = {
    id: ship.id,
    name: ship.name,
    size: ship.size,
    positions,
    orientation,
    hits: 0,
    sunk: false,
  };

  return { board: newBoard, ship: placedShip };
}

export function removeShipFromBoard(board: Board, shipId: string): Board {
  return board.map(row =>
    row.map(cell =>
      cell.shipId === shipId ? { ...cell, state: 'empty', shipId: null } : { ...cell }
    )
  );
}

export function processAttack(
  board: Board,
  ships: Ship[],
  row: number,
  col: number
): { board: Board; ships: Ship[]; result: AttackResult } {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  const newShips = ships.map(s => ({ ...s, positions: [...s.positions] }));
  const cell = newBoard[row][col];

  if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') {
    return {
      board: newBoard,
      ships: newShips,
      result: { position: { row, col }, result: 'miss' },
    };
  }

  if (cell.shipId) {
    const ship = newShips.find(s => s.id === cell.shipId)!;
    ship.hits++;
    const isSunk = ship.hits >= ship.size;
    ship.sunk = isSunk;

    if (isSunk) {
      for (const pos of ship.positions) {
        newBoard[pos.row][pos.col] = {
          ...newBoard[pos.row][pos.col],
          state: 'sunk',
        };
      }
      return {
        board: newBoard,
        ships: newShips,
        result: {
          position: { row, col },
          result: 'sunk',
          shipName: ship.name,
          shipId: ship.id,
          shipPositions: ship.positions,
        },
      };
    }

    newBoard[row][col] = { ...cell, state: 'hit' };
    return {
      board: newBoard,
      ships: newShips,
      result: { position: { row, col }, result: 'hit' },
    };
  }

  newBoard[row][col] = { ...cell, state: 'miss' };
  return {
    board: newBoard,
    ships: newShips,
    result: { position: { row, col }, result: 'miss' },
  };
}

export function allShipsSunk(ships: Ship[]): boolean {
  return ships.length > 0 && ships.every(s => s.sunk);
}

export function randomPlacement(shipDefs: ShipDefinition[]): { board: Board; ships: Ship[] } {
  let board = createEmptyBoard();
  const ships: Ship[] = [];

  for (const def of shipDefs) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? BOARD_SIZE - def.size : BOARD_SIZE - 1;
      const maxCol = orientation === 'horizontal' ? BOARD_SIZE - def.size : BOARD_SIZE - 1;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      const result = placeShip(board, def, row, col, orientation);
      if (result) {
        board = result.board;
        ships.push(result.ship);
        placed = true;
      }
      attempts++;
    }
  }

  return { board, ships };
}

export function getVisibleBoard(board: Board, hideShips: boolean): Board {
  if (!hideShips) return board;
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      state: cell.state === 'ship' ? 'empty' : cell.state,
      shipId: cell.state === 'ship' ? null : cell.shipId,
    }))
  );
}
