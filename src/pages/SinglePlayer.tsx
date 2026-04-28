import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Board, Ship, Difficulty, Orientation, GamePhase, AttackResult, BattleLogEntry } from '../engine/types';
import { SHIPS, TOTAL_SHIP_CELLS, BOARD_MAX_INDEX, ROW_LABELS, scoreForResult, getAIName, DELAY_BEFORE_AI_LABEL_MS, DELAY_BEFORE_AI_SHOT_MS, DELAY_AFTER_AI_SHOT_MS } from '../engine/constants';
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
import { useHaptics } from '../hooks/useHaptics';
import { saveGameResult } from '../lib/gameResults';
import { checkAchievements } from '../lib/achievements';
import { loadStats } from '../lib/stats';
import { AchievementToast } from '../components/AchievementToast';
import { BattleLog } from '../components/BattleLog';
import { BoardToggle } from '../components/BoardToggle';
import { GameReplay } from '../components/GameReplay';
import { ScorePopup } from '../components/ScorePopup';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ShipNotification } from '../components/ShipNotification';
import { QuickFireInput } from '../components/QuickFireInput';
import type { ReplayMove, ReplayData } from '../lib/replay';
import { saveGameState, clearSavedGame } from '../lib/gamePersistence';
import type { SavedGameState } from '../lib/gamePersistence';

interface SinglePlayerProps {
  difficulty: Difficulty;
  onBack: () => void;
  /** Pre-loaded saved game state for resuming. */
  resumeState?: SavedGameState | null;
}

export function SinglePlayer({ difficulty, onBack, resumeState }: SinglePlayerProps) {
  // ── Initialise from saved state if resuming, otherwise fresh defaults ──
  const [phase, setPhase] = useState<GamePhase>(resumeState ? resumeState.phase : 'placement');
  const [playerBoard, setPlayerBoard] = useState<Board>(resumeState ? resumeState.playerBoard : createEmptyBoard());
  const [opponentBoard, setOpponentBoard] = useState<Board>(resumeState ? resumeState.opponentBoard : createEmptyBoard());
  const [playerShips, setPlayerShips] = useState<Ship[]>(resumeState ? resumeState.playerShips : []);
  const [opponentShips, setOpponentShips] = useState<Ship[]>(resumeState ? resumeState.opponentShips : []);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(resumeState ? null : SHIPS[0].id);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [isPlayerTurn, setIsPlayerTurn] = useState(resumeState ? resumeState.isPlayerTurn : true);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [message, setMessage] = useState(
    resumeState
      ? (resumeState.isPlayerTurn ? 'Game resumed — your turn!' : "Game resumed — opponent's turn...")
      : 'Place your ships on the board'
  );
  const [hideEnemyShots, setHideEnemyShots] = useState(false);
  const [, setLastAttack] = useState<AttackResult | null>(null);
  const [lastAttackPos, setLastAttackPos] = useState<{ row: number; col: number } | null>(null);
  const [lastAttackResult, setLastAttackResult] = useState<'hit' | 'miss' | 'sunk' | null>(null);
  const [lastDefensePos, setLastDefensePos] = useState<{ row: number; col: number } | null>(null);
  const [lastDefenseResult, setLastDefenseResult] = useState<'hit' | 'miss' | 'sunk' | null>(null);
  const aiStateRef = useRef(resumeState
    ? {
        mode: resumeState.aiState.mode,
        hitStack: resumeState.aiState.hitStack,
        triedPositions: new Set(resumeState.aiState.triedPositions),
        lastHit: resumeState.aiState.lastHit,
        firstHit: resumeState.aiState.firstHit,
        orientation: resumeState.aiState.orientation,
      }
    : createAIState()
  );
  const { play, toggle } = useSound();
  const music = useBackgroundMusic();
  const haptics = useHaptics();
  const isProcessingRef = useRef(false);
  const shotCountRef = useRef(resumeState ? resumeState.shotCount : 0);
  const hitCountRef = useRef(resumeState ? resumeState.hitCount : 0);
  const gameStartTimeRef = useRef<number>(resumeState ? Date.now() : 0);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>(resumeState ? resumeState.battleLog : []);
  const turnCountRef = useRef(resumeState ? resumeState.turnCount : 0);
  const replayMovesRef = useRef<ReplayMove[]>([]);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [playerScore, setPlayerScore] = useState(resumeState ? resumeState.playerScore : 0);
  const playerShipsSnapshotRef = useRef<Ship[]>(
    resumeState ? resumeState.playerShips.map(s => ({ ...s, positions: [...s.positions] })) : []
  );
  const opponentShipsSnapshotRef = useRef<Ship[]>(
    resumeState ? resumeState.opponentShips.map(s => ({ ...s, positions: [...s.positions] })) : []
  );
  const gameDurationRef = useRef(0);
  const [cursorPos, setCursorPos] = useState({ row: 0, col: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [mobileBoard, setMobileBoard] = useState<'player' | 'opponent'>('opponent');
  const handlePlayerAttackRef = useRef<(row: number, col: number) => void>(() => {});
  const [scorePopup, setScorePopup] = useState({ points: 0, label: '', trigger: 0 });
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [shipNotif, setShipNotif] = useState({ type: 'hit' as 'hit' | 'sunk', shipName: '', actor: 'player' as 'player' | 'opponent', trigger: 0 });
  const previousWinsRef = useRef(loadStats().games.filter(g => g.result === 'win').length);

  const aiName = getAIName(difficulty);

  // Setup opponent board (skip if resuming a saved game)
  useEffect(() => {
    if (resumeState) return;
    const { board, ships } = randomPlacement(SHIPS);
    setOpponentBoard(board);
    setOpponentShips(ships);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Auto-select next unplaced ship (continue from current position in roster)
      const currentIndex = SHIPS.findIndex((s) => s.id === selectedShipId);
      let nextShip: typeof SHIPS[number] | undefined;
      for (let i = 1; i < SHIPS.length; i++) {
        const idx = (currentIndex + i) % SHIPS.length;
        if (!currentShips.some((ps) => ps.id === SHIPS[idx].id)) {
          nextShip = SHIPS[idx];
          break;
        }
      }
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

  // Undo last placed ship
  const handleUndoShip = useCallback(() => {
    if (playerShips.length === 0) return;
    const lastShip = playerShips[playerShips.length - 1];
    const newBoard = removeShipFromBoard(playerBoard, lastShip.id);
    const newShips = playerShips.slice(0, -1);
    setPlayerBoard(newBoard);
    setPlayerShips(newShips);
    setSelectedShipId(lastShip.id);
    play('click');
  }, [playerShips, playerBoard, play]);

  const handleClearAll = useCallback(() => {
    if (playerShips.length === 0) return;
    setPlayerBoard(createEmptyBoard());
    setPlayerShips([]);
    setSelectedShipId(SHIPS[0].id);
    play('click');
  }, [playerShips, play]);

  // Keyboard handling: arrow keys + Enter in both placement and battle phases
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ── Placement phase: R to rotate, arrows to move cursor, Enter to place ──
      if (phase === 'placement') {
        if (e.key === 'r' || e.key === 'R') {
          setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
          return;
        }
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, row: Math.max(0, p.row - 1) }));
            break;
          case 'ArrowDown':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, row: Math.min(BOARD_MAX_INDEX, p.row + 1) }));
            break;
          case 'ArrowLeft':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, col: Math.max(0, p.col - 1) }));
            break;
          case 'ArrowRight':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, col: Math.min(BOARD_MAX_INDEX, p.col + 1) }));
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (showCursor) {
              handlePlaceShip(cursorPos.row, cursorPos.col);
            }
            break;
        }
        return;
      }

      // ── Battle phase: arrows to move cursor, Enter/Space to fire ──
      if (phase === 'battle' && isPlayerTurn) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, row: Math.max(0, p.row - 1) }));
            break;
          case 'ArrowDown':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, row: Math.min(BOARD_MAX_INDEX, p.row + 1) }));
            break;
          case 'ArrowLeft':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, col: Math.max(0, p.col - 1) }));
            break;
          case 'ArrowRight':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, col: Math.min(BOARD_MAX_INDEX, p.col + 1) }));
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (showCursor) {
              handlePlayerAttackRef.current(cursorPos.row, cursorPos.col);
            }
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isPlayerTurn, showCursor, cursorPos, handlePlaceShip]);

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
      shotCountRef.current += 1;

      const { board, ships, result } = processAttack(opponentBoard, opponentShips, row, col);
      setOpponentBoard(board);
      setOpponentShips(ships);
      setLastAttack(result);
      setLastAttackPos({ row, col });
      setLastAttackResult(result.result);
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

      const movePoints = scoreForResult(result.result);
      setPlayerScore(prev => prev + movePoints);
      setScorePopup({ points: movePoints, label: result.result === 'sunk' ? 'SUNK' : result.result === 'hit' ? 'HIT' : 'MISS', trigger: Date.now() });

      if (result.result === 'hit') {
        hitCountRef.current += 1;
        play('hit');
        haptics.hit();
        setMessage(`Direct hit on their ${result.shipName}!`);
        setShipNotif({ type: 'hit', shipName: result.shipName || '', actor: 'player', trigger: Date.now() });
      } else if (result.result === 'sunk') {
        hitCountRef.current += 1;
        play('sunk');
        haptics.sunk();
        setMessage(`You sank their ${result.shipName}!`);
        setShipNotif({ type: 'sunk', shipName: result.shipName || '', actor: 'player', trigger: Date.now() });
      } else {
        play('miss');
        haptics.tap();
        setMessage('Miss!');
      }

      if (allShipsSunk(ships)) {
        setPhase('gameover');
        setWinner('player');
        setMessage('You win!');
        play('win');
        haptics.win();
        gameDurationRef.current = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        saveGameResult({
          mode: 'single',
          difficulty,
          result: 'win',
          playerShots: shotCountRef.current,
          playerHits: hitCountRef.current,
          opponentName: aiName,
          durationSeconds: gameDurationRef.current,
        });
        clearSavedGame();
        const playerShipsLost = playerShips.filter(s => s.sunk).length;
        const unlocked = checkAchievements({
          result: 'win',
          mode: 'single',
          difficulty,
          playerShots: shotCountRef.current,
          playerHits: hitCountRef.current,
          durationSeconds: gameDurationRef.current,
          playerShipsLost,
          totalPlayerShips: SHIPS.length,
        });
        if (unlocked.length > 0) setNewAchievements(unlocked);
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

      // AI turn after delay — constants from engine/constants.ts
      setTimeout(() => {
        setMessage("Opponent's turn...");
        setMobileBoard('player'); // Auto-switch so user sees incoming fire

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
            setMessage(`Enemy hit your ${aiResult.result.shipName} at ${ROW_LABELS[position.row]}${position.col + 1}!`);
            setShipNotif({ type: 'hit', shipName: aiResult.result.shipName || '', actor: 'opponent', trigger: Date.now() });
          } else if (aiResult.result.result === 'sunk') {
            play('sunk');
            setMessage(`Enemy sank your ${aiResult.result.shipName}!`);
            setShipNotif({ type: 'sunk', shipName: aiResult.result.shipName || '', actor: 'opponent', trigger: Date.now() });
          } else {
            play('splash');
            setMessage(`Enemy missed at ${ROW_LABELS[position.row]}${position.col + 1}`);
          }

          if (allShipsSunk(aiResult.ships)) {
            setPhase('gameover');
            setWinner('opponent');
            setMessage('You lose!');
            play('lose');
            haptics.lose();
            gameDurationRef.current = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGameResult({
              mode: 'single',
              difficulty,
              result: 'loss',
              playerShots: shotCountRef.current,
              playerHits: hitCountRef.current,
              opponentName: aiName,
              durationSeconds: gameDurationRef.current,
            });
            clearSavedGame();
            checkAchievements({
              result: 'loss',
              mode: 'single',
              difficulty,
              playerShots: shotCountRef.current,
              playerHits: hitCountRef.current,
              durationSeconds: gameDurationRef.current,
              playerShipsLost: SHIPS.length,
              totalPlayerShips: SHIPS.length,
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
            setMobileBoard('opponent'); // Switch back to attack board
            isProcessingRef.current = false;
          }, DELAY_AFTER_AI_SHOT_MS);
        }, DELAY_BEFORE_AI_SHOT_MS);
      }, DELAY_BEFORE_AI_LABEL_MS);
    },
    [phase, isPlayerTurn, opponentBoard, opponentShips, playerBoard, playerShips, difficulty, play, haptics, aiName]
  );

  // Keep ref in sync for keyboard handler
  useEffect(() => {
    handlePlayerAttackRef.current = handlePlayerAttack;
  }, [handlePlayerAttack]);

  // ── Persist game state to localStorage after each state change during battle ──
  // Only save when it is the player's turn so we never snapshot a mid-AI-turn
  // state that would leave the game stuck on resume (no code path re-triggers AI).
  useEffect(() => {
    if (phase !== 'battle' || winner || !isPlayerTurn) return;
    const ai = aiStateRef.current;
    saveGameState({
      version: 1,
      timestamp: Date.now(),
      difficulty,
      phase,
      playerBoard,
      opponentBoard,
      playerShips,
      opponentShips,
      isPlayerTurn,
      playerScore,
      shotCount: shotCountRef.current,
      hitCount: hitCountRef.current,
      turnCount: turnCountRef.current,
      battleLog,
      aiState: {
        mode: ai.mode,
        hitStack: ai.hitStack,
        triedPositions: Array.from(ai.triedPositions),
        lastHit: ai.lastHit,
        firstHit: ai.firstHit,
        orientation: ai.orientation,
      },
    });
  }, [phase, winner, playerBoard, opponentBoard, playerShips, opponentShips, isPlayerTurn, playerScore, battleLog, difficulty]);

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
    setBattleLog([]);
    turnCountRef.current = 0;
    replayMovesRef.current = [];
    setReplayData(null);
    setShowReplay(false);
    setScoreSubmitted(false);
    setNewAchievements([]);
    setPlayerScore(0);
    setCursorPos({ row: 0, col: 0 });
    setShowCursor(false);
    setMobileBoard('opponent');
    clearSavedGame();
    aiStateRef.current = createAIState();
    isProcessingRef.current = false;
    shotCountRef.current = 0;
    hitCountRef.current = 0;
    previousWinsRef.current = loadStats().games.filter(g => g.result === 'win').length;
  }, []);

  const playerHitsOnOpponent = opponentShips.reduce((sum, s) => sum + s.hits, 0);
  const opponentHitsOnPlayer = playerShips.reduce((sum, s) => sum + s.hits, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
      {/* Screen-reader live region for game status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>

      <GameHUD
        isPlayerTurn={isPlayerTurn}
        message={message}
        phase={phase}
        onToggleSound={toggle}
        onBack={phase === 'battle' ? () => setShowConfirmLeave(true) : onBack}
        playerHits={opponentHitsOnPlayer}
        opponentHits={playerHitsOnOpponent}
        totalShipCells={TOTAL_SHIP_CELLS}
        isMusicPlaying={music.isPlaying}
        musicFreqData={music.freqData}
        onToggleMusic={music.toggle}
        score={playerScore}
        showStreak={true}
        playerShipsRemaining={playerShips.filter(s => !s.sunk).length}
        opponentShipsRemaining={opponentShips.filter(s => !s.sunk).length}
        turnCount={turnCountRef.current}
      />

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-8 p-2 sm:p-4">
        {phase === 'placement' ? (
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 sm:gap-6 w-full">
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
              onSwipeRotate={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
              cursorRow={cursorPos.row}
              cursorCol={cursorPos.col}
              showCursor={showCursor && phase === 'placement'}
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
              onUndoShip={handleUndoShip}
              onClearAll={handleClearAll}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
              <BoardToggle activeBoard={mobileBoard} onToggle={setMobileBoard} />
              <QuickFireInput
                onFire={handlePlayerAttack}
                disabled={!isPlayerTurn || phase === 'gameover'}
              />
            </div>
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 sm:gap-4 lg:gap-8">
              <div className={`flex flex-col items-center gap-4 ${mobileBoard === 'opponent' ? 'hidden lg:flex' : 'flex'}`}>
                <GameBoard
                  board={playerBoard}
                  isPlayerBoard={true}
                  isPlacing={false}
                  title="Your Fleet"
                  disabled={true}
                  ships={playerShips}
                  lastAttackResult={lastDefenseResult}
                  lastAttackPos={lastDefensePos}
                  hideEnemyShots={hideEnemyShots}
                  onToggleHideEnemyShots={() => setHideEnemyShots(h => !h)}
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
              <div className={`${mobileBoard === 'player' ? 'hidden lg:block' : 'block'}`}>
                <GameBoard
                  board={opponentBoard}
                  isPlayerBoard={false}
                  isPlacing={false}
                  onCellClick={handlePlayerAttack}
                  title="Enemy Waters"
                  disabled={!isPlayerTurn || phase === 'gameover'}
                  highlight={isPlayerTurn && phase === 'battle'}
                  ships={opponentShips}
                  lastAttackResult={lastAttackResult}
                  lastAttackPos={lastAttackPos}
                  cursorRow={cursorPos.row}
                  cursorCol={cursorPos.col}
                  showCursor={showCursor && isPlayerTurn && phase === 'battle'}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {phase === 'battle' && <BattleLog entries={battleLog} />}

      {phase === 'gameover' && winner && !showReplay && (
        <GameOver
          winner={winner}
          onPlayAgain={handlePlayAgain}
          onGoHome={onBack}
          opponentName={aiName}
          onWatchReplay={replayData ? () => setShowReplay(true) : undefined}
          gameStats={{
            mode: 'single',
            difficulty,
            shots: shotCountRef.current,
            hits: hitCountRef.current,
            totalScore: playerScore,
            durationSeconds: gameDurationRef.current,
          }}
          alreadySubmitted={scoreSubmitted}
          onScoreSubmitted={() => setScoreSubmitted(true)}
          shipsLost={playerShips.filter(s => s.sunk).length}
          totalShips={SHIPS.length}
          opponentBoard={opponentBoard}
          previousWins={previousWinsRef.current}
        />
      )}

      {showReplay && replayData && (
        <GameReplay replayData={replayData} onClose={() => setShowReplay(false)} />
      )}

      {newAchievements.length > 0 && (
        <AchievementToast achievementIds={newAchievements} onDone={() => setNewAchievements([])} />
      )}

      <ScorePopup
        points={scorePopup.points}
        label={scorePopup.label}
        position={lastAttackPos}
        trigger={scorePopup.trigger}
      />

      <ShipNotification
        type={shipNotif.type}
        shipName={shipNotif.shipName}
        actor={shipNotif.actor}
        trigger={shipNotif.trigger}
      />

      {showConfirmLeave && (
        <ConfirmDialog
          title="ABORT MISSION?"
          message="Your current battle will be lost. Are you sure you want to return to base?"
          confirmLabel="ABANDON"
          cancelLabel="STAY"
          onConfirm={() => { clearSavedGame(); setShowConfirmLeave(false); onBack(); }}
          onCancel={() => setShowConfirmLeave(false)}
        />
      )}
    </div>
  );
}
