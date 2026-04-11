import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Board, Ship, Difficulty, Orientation, GamePhase, AttackResult, BattleLogEntry } from '../engine/types';
import { SHIPS, TOTAL_SHIP_CELLS } from '../engine/constants';
import {
  createEmptyBoard,
  placeShip,
  processAttack,
  allShipsSunk,
  randomPlacement,
  removeShipFromBoard,
} from '../engine/board';
import { createAIState, getAIMove, updateAIAfterResult } from '../engine/ai';
import { GameBoard } from '../components/GameBoard';
import { ShipRoster } from '../components/ShipRoster';
import { GameHUD } from '../components/GameHUD';
import { GameOver } from '../components/GameOver';
import { useSound } from '../hooks/useSound';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { saveGame } from '../lib/stats';
import { BattleLog } from '../components/BattleLog';
import { GameReplay } from '../components/GameReplay';
import type { ReplayMove, ReplayData } from '../lib/replay';

interface SinglePlayerProps {
  difficulty: Difficulty;
  onBack: () => void;
}

export function SinglePlayer({ difficulty, onBack }: SinglePlayerProps) {
  const [phase, setPhase] = useState<GamePhase>('placement');
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard());
  const [opponentBoard, setOpponentBoard] = useState<Board>(createEmptyBoard());
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);
  const [opponentShips, setOpponentShips] = useState<Ship[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(SHIPS[0].id);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [message, setMessage] = useState('Place your ships on the board');
  const [, setLastAttack] = useState<AttackResult | null>(null);
  const [lastAttackPos, setLastAttackPos] = useState<{ row: number; col: number } | null>(null);
  const [lastAttackResult, setLastAttackResult] = useState<'hit' | 'miss' | 'sunk' | null>(null);
  const [lastDefensePos, setLastDefensePos] = useState<{ row: number; col: number } | null>(null);
  const [lastDefenseResult, setLastDefenseResult] = useState<'hit' | 'miss' | 'sunk' | null>(null);
  const aiStateRef = useRef(createAIState());
  const { play, toggle } = useSound();
  const music = useBackgroundMusic();
  const isProcessingRef = useRef(false);
  const [shotCount, setShotCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const gameStartTimeRef = useRef<number>(0);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const turnCountRef = useRef(0);
  const replayMovesRef = useRef<ReplayMove[]>([]);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const playerShipsSnapshotRef = useRef<Ship[]>([]);
  const opponentShipsSnapshotRef = useRef<Ship[]>([]);

  // Setup opponent board
  useEffect(() => {
    const { board, ships } = randomPlacement(SHIPS);
    setOpponentBoard(board);
    setOpponentShips(ships);
  }, []);

  const handlePlaceShip = useCallback(
    (row: number, col: number) => {
      if (phase !== 'placement' || !selectedShipId) return;

      const shipDef = SHIPS.find((s) => s.id === selectedShipId);
      if (!shipDef) return;

      // Check if already placed - if so, remove it first
      const existing = playerShips.find((s) => s.id === selectedShipId);
      let currentBoard = playerBoard;
      let currentShips = playerShips;

      if (existing) {
        currentBoard = removeShipFromBoard(playerBoard, selectedShipId);
        currentShips = playerShips.filter((s) => s.id !== selectedShipId);
      }

      const result = placeShip(currentBoard, shipDef, row, col, orientation);
      if (!result) return;

      play('place');
      setPlayerBoard(result.board);
      setPlayerShips([...currentShips, result.ship]);

      // Auto-select next unplaced ship
      const nextShip = SHIPS.find(
        (s) => s.id !== selectedShipId && !currentShips.some((ps) => ps.id === s.id)
      );
      setSelectedShipId(nextShip?.id ?? null);
    },
    [phase, selectedShipId, orientation, playerBoard, playerShips, play]
  );

  const handleRandomize = useCallback(() => {
    const { board, ships } = randomPlacement(SHIPS);
    setPlayerBoard(board);
    setPlayerShips(ships);
    setSelectedShipId(null);
    play('place');
  }, [play]);

  // R key to rotate orientation during placement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'placement' && (e.key === 'r' || e.key === 'R')) {
        setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  // Handle drag-select from roster (sets selected ship so placement preview works)
  const handleDragSelectShip = useCallback((shipId: string) => {
    if (phase !== 'placement') return;
    setSelectedShipId(shipId);
  }, [phase]);

  const placingShipDef = useMemo(() => SHIPS.find(s => s.id === selectedShipId), [selectedShipId]);

  const handleReady = useCallback(() => {
    if (playerShips.length !== SHIPS.length) return;
    setPhase('battle');
    setMessage('Your turn — fire at the enemy grid!');
    setIsPlayerTurn(true);
    gameStartTimeRef.current = Date.now();
    playerShipsSnapshotRef.current = playerShips.map(s => ({ ...s, positions: [...s.positions] }));
    opponentShipsSnapshotRef.current = opponentShips.map(s => ({ ...s, positions: [...s.positions] }));
    replayMovesRef.current = [];
    play('click');
  }, [playerShips, opponentShips, play]);

  const handlePlayerAttack = useCallback(
    (row: number, col: number) => {
      if (phase !== 'battle' || !isPlayerTurn || isProcessingRef.current) return;

      const cell = opponentBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;

      isProcessingRef.current = true;

      const { board, ships, result } = processAttack(opponentBoard, opponentShips, row, col);
      setOpponentBoard(board);
      setOpponentShips(ships);
      setLastAttack(result);
      setLastAttackPos({ row, col });
      setLastAttackResult(result.result);
      setShotCount(prev => prev + 1);
      if (result.result === 'hit' || result.result === 'sunk') {
        setHitCount(prev => prev + 1);
      }

      turnCountRef.current++;
      setBattleLog(prev => [...prev, {
        id: `p-${turnCountRef.current}`,
        turn: turnCountRef.current,
        player: 'player',
        position: { row, col },
        result: result.result,
        shipName: result.shipName,
        timestamp: Date.now(),
      }]);
      replayMovesRef.current.push({
        player: 'player',
        row, col,
        result: result.result,
        shipName: result.shipName,
        shipId: result.shipId,
        shipPositions: result.shipPositions,
      });

      if (result.result === 'hit') {
        play('hit');
        setMessage('Direct hit!');
      } else if (result.result === 'sunk') {
        play('sunk');
        setMessage(`You sank their ${result.shipName}!`);
      } else {
        play('miss');
        setMessage('Miss!');
      }

      if (allShipsSunk(ships)) {
        setPhase('gameover');
        setWinner('player');
        setMessage('You win!');
        play('win');
        saveGame({
          date: new Date().toISOString(),
          mode: 'single',
          difficulty,
          result: 'win',
          playerShots: shotCount + 1,
          playerHits: hitCount + (result.result === 'hit' || result.result === 'sunk' ? 1 : 0),
          opponentName: difficulty === 'easy' ? 'Recruit AI' : difficulty === 'medium' ? 'Captain AI' : 'Admiral AI',
          duration: Math.round((Date.now() - gameStartTimeRef.current) / 1000),
        });
        setReplayData({
          playerShipPlacements: playerShipsSnapshotRef.current,
          opponentShipPlacements: opponentShipsSnapshotRef.current,
          moves: [...replayMovesRef.current],
          winner: 'player',
          difficulty,
          date: new Date().toISOString(),
        });
        isProcessingRef.current = false;
        return;
      }

      setIsPlayerTurn(false);

      // AI turn after delay
      setTimeout(() => {
        setMessage("Opponent's turn...");

        setTimeout(() => {
          const { position, newState } = getAIMove(
            playerBoard,
            aiStateRef.current,
            difficulty,
            playerShips
          );

          const aiResult = processAttack(playerBoard, playerShips, position.row, position.col);
          setPlayerBoard(aiResult.board);
          setPlayerShips(aiResult.ships);
          setLastDefensePos({ row: position.row, col: position.col });
          setLastDefenseResult(aiResult.result.result);

          const updatedAIState = updateAIAfterResult(
            newState,
            position,
            aiResult.result.result,
            difficulty,
            aiResult.result.shipPositions
          );
          aiStateRef.current = updatedAIState;

          turnCountRef.current++;
          setBattleLog(prev => [...prev, {
            id: `o-${turnCountRef.current}`,
            turn: turnCountRef.current,
            player: 'opponent',
            position: { row: position.row, col: position.col },
            result: aiResult.result.result,
            shipName: aiResult.result.shipName,
            timestamp: Date.now(),
          }]);
          replayMovesRef.current.push({
            player: 'opponent',
            row: position.row, col: position.col,
            result: aiResult.result.result,
            shipName: aiResult.result.shipName,
            shipId: aiResult.result.shipId,
            shipPositions: aiResult.result.shipPositions,
          });

          if (aiResult.result.result === 'hit') {
            play('hit');
            setMessage(`Enemy hit at ${String.fromCharCode(65 + position.row)}${position.col + 1}!`);
          } else if (aiResult.result.result === 'sunk') {
            play('sunk');
            setMessage(`Enemy sank your ${aiResult.result.shipName}!`);
          } else {
            play('splash');
            setMessage(`Enemy missed at ${String.fromCharCode(65 + position.row)}${position.col + 1}`);
          }

          if (allShipsSunk(aiResult.ships)) {
            setPhase('gameover');
            setWinner('opponent');
            setMessage('You lose!');
            play('lose');
            saveGame({
              date: new Date().toISOString(),
              mode: 'single',
              difficulty,
              result: 'loss',
              playerShots: shotCount,
              playerHits: hitCount,
              opponentName: difficulty === 'easy' ? 'Recruit AI' : difficulty === 'medium' ? 'Captain AI' : 'Admiral AI',
              duration: Math.round((Date.now() - gameStartTimeRef.current) / 1000),
            });
            setReplayData({
              playerShipPlacements: playerShipsSnapshotRef.current,
              opponentShipPlacements: opponentShipsSnapshotRef.current,
              moves: [...replayMovesRef.current],
              winner: 'opponent',
              difficulty,
              date: new Date().toISOString(),
            });
            isProcessingRef.current = false;
            return;
          }

          setIsPlayerTurn(true);
          setTimeout(() => {
            setMessage('Your turn — fire at the enemy grid!');
            isProcessingRef.current = false;
          }, 800);
        }, 600);
      }, 500);
    },
    [phase, isPlayerTurn, opponentBoard, opponentShips, playerBoard, playerShips, difficulty, play]
  );

  const handlePlayAgain = useCallback(() => {
    const { board: oppBoard, ships: oppShips } = randomPlacement(SHIPS);
    setOpponentBoard(oppBoard);
    setOpponentShips(oppShips);
    setPlayerBoard(createEmptyBoard());
    setPlayerShips([]);
    setSelectedShipId(SHIPS[0].id);
    setOrientation('horizontal');
    setPhase('placement');
    setIsPlayerTurn(true);
    setWinner(null);
    setMessage('Place your ships on the board');
    setLastAttack(null);
    setLastAttackPos(null);
    setLastAttackResult(null);
    setLastDefensePos(null);
    setLastDefenseResult(null);
    setShotCount(0);
    setHitCount(0);
    setBattleLog([]);
    turnCountRef.current = 0;
    replayMovesRef.current = [];
    setReplayData(null);
    setShowReplay(false);
    aiStateRef.current = createAIState();
    isProcessingRef.current = false;
  }, []);

  const playerHitsOnOpponent = opponentShips.reduce((sum, s) => sum + s.hits, 0);
  const opponentHitsOnPlayer = playerShips.reduce((sum, s) => sum + s.hits, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
      <GameHUD
        isPlayerTurn={isPlayerTurn}
        message={message}
        phase={phase}
        onToggleSound={toggle}
        onBack={onBack}
        playerHits={opponentHitsOnPlayer}
        opponentHits={playerHitsOnOpponent}
        totalShipCells={TOTAL_SHIP_CELLS}
        isMusicPlaying={music.isPlaying}
        musicFreqData={music.freqData}
        onToggleMusic={music.toggle}
      />

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 p-4">
        {phase === 'placement' ? (
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <GameBoard
              board={playerBoard}
              isPlayerBoard={true}
              isPlacing={true}
              placingShipSize={placingShipDef?.size}
              placingShipId={placingShipDef?.id}
              placingOrientation={orientation}
              onCellClick={handlePlaceShip}
              ships={playerShips}
              onDragSelectShip={handleDragSelectShip}
              title="Your Fleet"
            />
            <ShipRoster
              shipDefs={SHIPS}
              placedShips={playerShips}
              selectedShipId={selectedShipId}
              orientation={orientation}
              onSelectShip={setSelectedShipId}
              onRotate={() => setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'))}
              onRandomize={handleRandomize}
              onReady={handleReady}
              isReady={false}
              mode="placement"
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-8">
            <div className="flex flex-col items-center gap-4">
              <GameBoard
                board={playerBoard}
                isPlayerBoard={true}
                isPlacing={false}
                title="Your Fleet"
                disabled={true}
                ships={playerShips}
                lastAttackResult={lastDefenseResult}
                lastAttackPos={lastDefensePos}
              />
              <ShipRoster
                shipDefs={SHIPS}
                placedShips={playerShips}
                selectedShipId={null}
                orientation="horizontal"
                onSelectShip={() => {}}
                onRotate={() => {}}
                onRandomize={() => {}}
                onReady={() => {}}
                isReady={false}
                mode="battle"
              />
            </div>
            <GameBoard
              board={opponentBoard}
              isPlayerBoard={false}
              isPlacing={false}
              onCellClick={handlePlayerAttack}
              title="Enemy Waters"
              disabled={!isPlayerTurn || phase === 'gameover'}
              highlight={isPlayerTurn && phase === 'battle'}
              lastAttackResult={lastAttackResult}
              lastAttackPos={lastAttackPos}
            />
          </div>
        )}
      </div>

      {phase === 'battle' && <BattleLog entries={battleLog} />}

      {phase === 'gameover' && winner && !showReplay && (
        <GameOver
          winner={winner}
          onPlayAgain={handlePlayAgain}
          onGoHome={onBack}
          opponentName={
            difficulty === 'easy' ? 'Recruit AI' : difficulty === 'medium' ? 'Captain AI' : 'Admiral AI'
          }
          onWatchReplay={replayData ? () => setShowReplay(true) : undefined}
        />
      )}

      {showReplay && replayData && (
        <GameReplay replayData={replayData} onClose={() => setShowReplay(false)} />
      )}
    </div>
  );
}
