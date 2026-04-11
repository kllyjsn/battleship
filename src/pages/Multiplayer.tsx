import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Board, Ship, Orientation, GamePhase, MultiplayerMessage, BattleLogEntry } from '../engine/types';
import { SHIPS, TOTAL_SHIP_CELLS } from '../engine/constants';
import {
  createEmptyBoard,
  placeShip,
  processAttack,
  allShipsSunk,
  randomPlacement,
  removeShipFromBoard,
  getVisibleBoard,
} from '../engine/board';
import { GameBoard } from '../components/GameBoard';
import { ShipRoster } from '../components/ShipRoster';
import { GameHUD } from '../components/GameHUD';
import { GameOver } from '../components/GameOver';
import { MultiplayerLobby } from '../components/MultiplayerLobby';
import { Chat } from '../components/Chat';
import { useMultiplayer } from '../multiplayer/useMultiplayer';
import { useSound } from '../hooks/useSound';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useAuth } from '../lib/AuthContext';
import { saveGameResult } from '../lib/gameResults';
import { BattleLog } from '../components/BattleLog';
import { TurnTimer } from '../components/TurnTimer';
import { GameReplay } from '../components/GameReplay';
import type { ReplayMove, ReplayData } from '../lib/replay';
import { Eye } from 'lucide-react';

interface MultiplayerPageProps {
  onBack: () => void;
}

export function MultiplayerPage({ onBack }: MultiplayerPageProps) {
  const { user, profile } = useAuth();
  const [playerName, setPlayerName] = useState(profile?.display_name || '');
  const [phase, setPhase] = useState<GamePhase>('placement');
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard());
  const [opponentBoard, setOpponentBoard] = useState<Board>(createEmptyBoard());
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);
  const [, setOpponentShips] = useState<Ship[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(SHIPS[0].id);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [message, setMessage] = useState('Place your ships on the board');
  const [inLobby, setInLobby] = useState(true);
  const [playerHitsOnOpponentCount, setPlayerHitsOnOpponentCount] = useState(0);
  const [lastAttackPos, setLastAttackPos] = useState<{ row: number; col: number } | null>(null);
  const [lastAttackResult, setLastAttackResult] = useState<'hit' | 'miss' | 'sunk' | null>(null);
  const [lastDefensePos, setLastDefensePos] = useState<{ row: number; col: number } | null>(null);
  const [lastDefenseResult, setLastDefenseResult] = useState<'hit' | 'miss' | 'sunk' | null>(null);
  const { play, toggle } = useSound();
  const music = useBackgroundMusic();
  const shotCountRef = useRef(0);
  const hitCountRef = useRef(0);
  const gameStartTimeRef = useRef<number>(0);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const turnCountRef = useRef(0);
  const replayMovesRef = useRef<ReplayMove[]>([]);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const playerShipsSnapshotRef = useRef<Ship[]>([]);
  const [cursorPos, setCursorPos] = useState({ row: 0, col: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const handlePlayerAttackRef = useRef<(row: number, col: number) => void>(() => {});
  const isProcessingRef = useRef(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [spectatorHostBoard, setSpectatorHostBoard] = useState<Board>(createEmptyBoard());
  const [spectatorGuestBoard, setSpectatorGuestBoard] = useState<Board>(createEmptyBoard());
  const [spectatorHostName, setSpectatorHostName] = useState('Player 1');
  const [spectatorGuestName, setSpectatorGuestName] = useState('Player 2');
  const [spectatorHostTurn, setSpectatorHostTurn] = useState(true);
  const spectatorSyncedRef = useRef(false);

  const playerBoardRef = useRef(playerBoard);
  const playerShipsRef = useRef(playerShips);
  const phaseRef = useRef(phase);
  const isPlayerTurnRef = useRef(isPlayerTurn);
  const spectatorHostTurnRef = useRef(spectatorHostTurn);
  const spectatorHostNameRef = useRef(spectatorHostName);

  useEffect(() => {
    playerBoardRef.current = playerBoard;
  }, [playerBoard]);

  useEffect(() => {
    playerShipsRef.current = playerShips;
  }, [playerShips]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isPlayerTurnRef.current = isPlayerTurn;
  }, [isPlayerTurn]);

  useEffect(() => {
    spectatorHostTurnRef.current = spectatorHostTurn;
  }, [spectatorHostTurn]);

  useEffect(() => {
    spectatorHostNameRef.current = spectatorHostName;
  }, [spectatorHostName]);

  const mp = useMultiplayer(playerName);

  // Turn timer logic
  useEffect(() => {
    if (phase === 'battle' && isPlayerTurn) {
      setTurnTimeLeft(30);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      turnTimerRef.current = setInterval(() => {
        setTurnTimeLeft(prev => {
          if (prev <= 1) {
            if (turnTimerRef.current) clearInterval(turnTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }
    }
    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, [phase, isPlayerTurn]);

  const handleTurnTimeout = useCallback(() => {
    if (phase !== 'battle' || !isPlayerTurn || isProcessingRef.current) return;
    isProcessingRef.current = true;
    const validCells: { row: number; col: number }[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = opponentBoard[r][c];
        if (cell.state === 'empty' || cell.state === 'ship') {
          validCells.push({ row: r, col: c });
        }
      }
    }
    if (validCells.length > 0) {
      const target = validCells[Math.floor(Math.random() * validCells.length)];
      mp.sendAttack(target.row, target.col);
      shotCountRef.current += 1;
      setIsPlayerTurn(false);
      setMessage('Time\'s up! Auto-fired...');
    }
  }, [phase, isPlayerTurn, opponentBoard, mp]);

  // Handle incoming multiplayer messages
  useEffect(() => {
    mp.setMessageHandler((msg: MultiplayerMessage) => {
      // Spectator sync handling
      if (mp.isSpectator && msg.type === 'SPECTATOR_SYNC') {
        spectatorSyncedRef.current = true;
        if (msg.phase) {
          setPhase(msg.phase);
          setInLobby(false);
        }
        if (msg.hostName) setSpectatorHostName(msg.hostName);
        if (msg.guestName) setSpectatorGuestName(msg.guestName);
        if (msg.isHostTurn !== undefined) setSpectatorHostTurn(msg.isHostTurn);
        return;
      }

      // Spectator: observe attacks live (only after initial sync)
      if (mp.isSpectator) {
        if (!spectatorSyncedRef.current) return;
        if (msg.type === 'ATTACK_RESULT') {
          if (msg.row === undefined || msg.col === undefined || !msg.result) return;
          // Update the board that was attacked
          // We update both boards to show revealed cells
          const updateBoard = (prev: Board) => {
            const newBoard = prev.map(r => r.map(c => ({ ...c })));
            if (msg.result === 'sunk' && msg.shipPositions) {
              for (const pos of msg.shipPositions) {
                newBoard[pos.row][pos.col] = {
                  ...newBoard[pos.row][pos.col],
                  state: 'sunk',
                  shipId: msg.shipId || null,
                };
              }
            } else {
              newBoard[msg.row!][msg.col!] = {
                ...newBoard[msg.row!][msg.col!],
                state: msg.result === 'hit' ? 'hit' : 'miss',
              };
            }
            return newBoard;
          };

          // The attack result is for the board of whoever was attacked
          // If it's host's turn, host attacked guest's board
          const hostTurn = spectatorHostTurnRef.current;
          if (hostTurn) {
            setSpectatorGuestBoard(updateBoard);
          } else {
            setSpectatorHostBoard(updateBoard);
          }
          setSpectatorHostTurn(prev => !prev);
          spectatorHostTurnRef.current = !hostTurn;

          turnCountRef.current++;
          setBattleLog(prev => [...prev, {
            id: `s-${turnCountRef.current}`,
            turn: turnCountRef.current,
            player: hostTurn ? 'player' : 'opponent',
            position: { row: msg.row!, col: msg.col! },
            result: msg.result!,
            shipName: msg.shipName,
            timestamp: Date.now(),
          }]);
          return;
        }
        if (msg.type === 'GAME_OVER') {
          setPhase('gameover');
          setWinner(msg.winner === spectatorHostNameRef.current ? 'player' : 'opponent');
          return;
        }
        return;
      }

      switch (msg.type) {
        case 'SPECTATE': {
          // A spectator joined — send them sync info
          if (msg.isSpectator) {
            mp.publish({
              type: 'SPECTATOR_SYNC',
              phase: phaseRef.current,
              hostName: mp.isHost ? playerName : mp.opponentName || 'Player 2',
              guestName: mp.isHost ? mp.opponentName || 'Player 2' : playerName,
              isHostTurn: mp.isHost ? isPlayerTurnRef.current : !isPlayerTurnRef.current,
            });
          }
          break;
        }

        case 'ATTACK': {
          if (msg.row === undefined || msg.col === undefined) return;
          const { board, ships, result } = processAttack(
            playerBoardRef.current,
            playerShipsRef.current,
            msg.row,
            msg.col
          );
          setPlayerBoard(board);
          setPlayerShips(ships);
          setLastDefensePos({ row: msg.row, col: msg.col });
          setLastDefenseResult(result.result);

          playerBoardRef.current = board;
          playerShipsRef.current = ships;

          mp.sendAttackResult(
            msg.row,
            msg.col,
            result.result,
            result.shipName,
            result.shipId,
            result.shipPositions
          );

          turnCountRef.current++;
          setBattleLog(prev => [...prev, {
            id: `o-${turnCountRef.current}`,
            turn: turnCountRef.current,
            player: 'opponent',
            position: { row: msg.row!, col: msg.col! },
            result: result.result,
            shipName: result.shipName,
            timestamp: Date.now(),
          }]);
          replayMovesRef.current.push({
            player: 'opponent',
            row: msg.row!, col: msg.col!,
            result: result.result,
            shipName: result.shipName,
            shipId: result.shipId,
            shipPositions: result.shipPositions,
          });

          if (result.result === 'hit') {
            play('hit');
            setMessage(`Enemy hit at ${String.fromCharCode(65 + msg.row)}${msg.col + 1}!`);
          } else if (result.result === 'sunk') {
            play('sunk');
            setMessage(`Enemy sank your ${result.shipName}!`);
          } else {
            play('splash');
            setMessage(`Enemy missed at ${String.fromCharCode(65 + msg.row)}${msg.col + 1}`);
          }

          if (allShipsSunk(ships)) {
            setPhase('gameover');
            setWinner('opponent');
            setMessage('You lose!');
            play('lose');
            if (user) {
              saveGameResult(user.id, {
                mode: 'multiplayer',
                result: 'loss',
                playerShots: shotCountRef.current,
                playerHits: hitCountRef.current,
                opponentName: mp.opponentName || 'Opponent',
                durationSeconds: Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
              });
            }
            mp.sendGameOver(mp.opponentName || 'Opponent');
            setReplayData({
              playerShipPlacements: playerShipsSnapshotRef.current,
              opponentShipPlacements: [],
              moves: [...replayMovesRef.current],
              winner: 'opponent',
              date: new Date().toISOString(),
            });
          } else {
            setIsPlayerTurn(true);
            setTimeout(() => setMessage('Your turn — fire at the enemy grid!'), 1000);
          }
          break;
        }

        case 'ATTACK_RESULT': {
          if (msg.row === undefined || msg.col === undefined || !msg.result) return;
          isProcessingRef.current = false;

          setLastAttackPos({ row: msg.row!, col: msg.col! });
          setLastAttackResult(msg.result);

          setOpponentBoard(prev => {
            const newBoard = prev.map(r => r.map(c => ({ ...c })));
            if (msg.result === 'sunk' && msg.shipPositions) {
              for (const pos of msg.shipPositions) {
                newBoard[pos.row][pos.col] = {
                  ...newBoard[pos.row][pos.col],
                  state: 'sunk',
                  shipId: msg.shipId || null,
                };
              }
            } else {
              newBoard[msg.row!][msg.col!] = {
                ...newBoard[msg.row!][msg.col!],
                state: msg.result === 'hit' ? 'hit' : 'miss',
              };
            }
            return newBoard;
          });

          // Track opponent ships being sunk
          if (msg.result === 'sunk' && msg.shipName) {
            setOpponentShips(prev => {
              const ship = SHIPS.find(s => s.name === msg.shipName);
              if (ship) {
                const existing = prev.find(s => s.id === ship.id);
                if (existing) {
                  return prev.map(s =>
                    s.id === ship.id ? { ...s, sunk: true, hits: s.size } : s
                  );
                }
                return [
                  ...prev,
                  {
                    id: ship.id,
                    name: ship.name,
                    size: ship.size,
                    positions: msg.shipPositions || [],
                    orientation: 'horizontal' as const,
                    hits: ship.size,
                    sunk: true,
                  },
                ];
              }
              return prev;
            });
          }

          // Track hits for progress bar
          if (msg.result === 'hit' || msg.result === 'sunk') {
            hitCountRef.current += 1;
            setPlayerHitsOnOpponentCount(prev => prev + 1);
          }

          turnCountRef.current++;
          setBattleLog(prev => [...prev, {
            id: `p-${turnCountRef.current}`,
            turn: turnCountRef.current,
            player: 'player',
            position: { row: msg.row!, col: msg.col! },
            result: msg.result!,
            shipName: msg.shipName,
            timestamp: Date.now(),
          }]);
          replayMovesRef.current.push({
            player: 'player',
            row: msg.row!, col: msg.col!,
            result: msg.result!,
            shipName: msg.shipName,
            shipId: msg.shipId,
            shipPositions: msg.shipPositions,
          });

          if (msg.result === 'hit') {
            play('hit');
            setMessage('Direct hit!');
          } else if (msg.result === 'sunk') {
            play('sunk');
            setMessage(`You sank their ${msg.shipName}!`);
          } else {
            play('miss');
            setMessage('Miss!');
          }

          setIsPlayerTurn(false);
          setTimeout(() => {
            if (phaseRef.current === 'battle') {
              setMessage("Opponent's turn...");
            }
          }, 1000);
          break;
        }

        case 'GAME_OVER': {
          setPhase('gameover');
          setWinner('player');
          setMessage('You win!');
          play('win');
          if (user) {
            saveGameResult(user.id, {
              mode: 'multiplayer',
              result: 'win',
              playerShots: shotCountRef.current,
              playerHits: hitCountRef.current,
              opponentName: mp.opponentName || 'Opponent',
              durationSeconds: Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
            });
          }
          setReplayData({
            playerShipPlacements: playerShipsSnapshotRef.current,
            opponentShipPlacements: [],
            moves: [...replayMovesRef.current],
            winner: 'player',
            date: new Date().toISOString(),
          });
          break;
        }
      }
    });
  }, [mp, play, phase, user]);

  // Both players ready -> start battle
  useEffect(() => {
    if (mp.isPlayerReady && mp.opponentReady && phase === 'placement') {
      setPhase('battle');
      gameStartTimeRef.current = Date.now();
      const isTurn = mp.isHost;
      setIsPlayerTurn(isTurn);
      setMessage(isTurn ? 'Your turn — fire at the enemy grid!' : "Opponent's turn...");
      mp.startGame();
    }
  }, [mp.isPlayerReady, mp.opponentReady, phase, mp.isHost, mp]);

  // Opponent joined
  useEffect(() => {
    if (mp.isConnected && mp.opponentName && inLobby) {
      setInLobby(false);
      setMessage('Place your ships on the board');
    }
  }, [mp.isConnected, mp.opponentName, inLobby]);

  const handleCreateRoom = useCallback(
    (name: string) => {
      setPlayerName(name);
      mp.createRoom();
    },
    [mp]
  );

  const handleJoinRoom = useCallback(
    (code: string, name: string) => {
      setPlayerName(name);
      mp.joinRoom(code, name);
    },
    [mp]
  );

  const handleSpectate = useCallback(
    (code: string, name: string) => {
      setPlayerName(name);
      mp.joinAsSpectator(code, name);
    },
    [mp]
  );

  const handlePlaceShip = useCallback(
    (row: number, col: number) => {
      if (phase !== 'placement' || !selectedShipId) return;

      const shipDef = SHIPS.find((s) => s.id === selectedShipId);
      if (!shipDef) return;

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

  // Keyboard handling: R to rotate during placement, arrow keys + Enter during battle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'placement' && (e.key === 'r' || e.key === 'R')) {
        setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
      }
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
            setCursorPos(p => ({ ...p, row: Math.min(9, p.row + 1) }));
            break;
          case 'ArrowLeft':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, col: Math.max(0, p.col - 1) }));
            break;
          case 'ArrowRight':
            e.preventDefault();
            setShowCursor(true);
            setCursorPos(p => ({ ...p, col: Math.min(9, p.col + 1) }));
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
  }, [phase, isPlayerTurn, showCursor, cursorPos]);

  // Handle drag-select from roster
  const handleDragSelectShip = useCallback((shipId: string) => {
    if (phase !== 'placement') return;
    setSelectedShipId(shipId);
  }, [phase]);

  const placingShipDef = useMemo(() => SHIPS.find(s => s.id === selectedShipId), [selectedShipId]);

  const handleReady = useCallback(() => {
    if (playerShips.length !== SHIPS.length) return;
    mp.sendReady();
    setMessage('Waiting for opponent to place ships...');
    playerShipsSnapshotRef.current = playerShips.map(s => ({ ...s, positions: [...s.positions] }));
    replayMovesRef.current = [];
    play('click');
  }, [playerShips, mp, play]);

  const handlePlayerAttack = useCallback(
    (row: number, col: number) => {
      if (phase !== 'battle' || !isPlayerTurn || isProcessingRef.current) return;

      const cell = opponentBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;

      isProcessingRef.current = true;
      shotCountRef.current += 1;
      mp.sendAttack(row, col);
      setIsPlayerTurn(false);
      setMessage('Waiting for result...');
    },
    [phase, isPlayerTurn, opponentBoard, mp]
  );

  // Keep ref in sync for keyboard handler
  useEffect(() => {
    handlePlayerAttackRef.current = handlePlayerAttack;
  }, [handlePlayerAttack]);

  const handlePlayAgain = useCallback(() => {
    setPlayerBoard(createEmptyBoard());
    setOpponentBoard(createEmptyBoard());
    setPlayerShips([]);
    setOpponentShips([]);
    setSelectedShipId(SHIPS[0].id);
    setOrientation('horizontal');
    setPhase('placement');
    setIsPlayerTurn(false);
    setWinner(null);
    setMessage('Place your ships on the board');
    setPlayerHitsOnOpponentCount(0);
    shotCountRef.current = 0;
    hitCountRef.current = 0;
    setBattleLog([]);
    turnCountRef.current = 0;
    replayMovesRef.current = [];
    setReplayData(null);
    setShowReplay(false);
    setCursorPos({ row: 0, col: 0 });
    setShowCursor(false);
    setLastAttackPos(null);
    setLastAttackResult(null);
    setLastDefensePos(null);
    setLastDefenseResult(null);
    // BUG-0005 fix: Use REMATCH handshake instead of resetReady() to avoid
    // race condition where opponent's early READY gets wiped.
    mp.sendRematch();
  }, [mp]);

  const handleSpectatorGoHome = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleGoHome = useCallback(() => {
    mp.sendLeave();
    onBack();
  }, [mp, onBack]);

  if (inLobby) {
    return (
      <MultiplayerLobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onSpectate={handleSpectate}
        onBack={onBack}
        roomCode={mp.roomCode}
        isConnecting={mp.isConnecting}
        error={mp.error}
        defaultName={profile?.display_name}
      />
    );
  }

  const playerHitsOnOpponent = playerHitsOnOpponentCount;
  const opponentHitsOnPlayer = playerShips.reduce((sum, s) => sum + s.hits, 0);

  // Spectator view
  if (mp.isSpectator) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
        <GameHUD
          isPlayerTurn={spectatorHostTurn}
          message={phase === 'gameover' ? `${winner === 'player' ? spectatorHostName : spectatorGuestName} wins!` : `${spectatorHostTurn ? spectatorHostName : spectatorGuestName}'s turn`}
          phase={phase}
          onToggleSound={toggle}
          onBack={handleSpectatorGoHome}
          playerHits={0}
          opponentHits={0}
          totalShipCells={TOTAL_SHIP_CELLS}
          isMusicPlaying={music.isPlaying}
          musicFreqData={music.freqData}
          onToggleMusic={music.toggle}
        />

        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded metal-panel-light font-mono-crt text-glow-amber text-sm">
            <Eye size={16} />
            SPECTATING
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 p-4">
          {phase === 'placement' ? (
            <div className="text-center font-mono-crt text-slate-500">
              <Eye size={32} className="mx-auto mb-4 text-amber-400/50" />
              <p className="text-lg text-glow-amber">WAITING FOR MATCH TO BEGIN</p>
              <p className="text-sm mt-2">Players are placing their ships...</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-8">
              <div className="flex flex-col items-center gap-2">
                <div className={`text-sm font-mono-crt mb-1 ${spectatorHostTurn && phase === 'battle' ? 'text-glow-green' : 'text-slate-500'}`}>
                  {spectatorHostName}{spectatorHostTurn && phase === 'battle' ? ' ◄' : ''}
                </div>
                <GameBoard
                  board={spectatorHostBoard}
                  isPlayerBoard={true}
                  isPlacing={false}
                  title={`${spectatorHostName}'s Fleet`}
                  disabled={true}
                  ships={[]}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`text-sm font-mono-crt mb-1 ${!spectatorHostTurn && phase === 'battle' ? 'text-glow-green' : 'text-slate-500'}`}>
                  {spectatorGuestName}{!spectatorHostTurn && phase === 'battle' ? ' ◄' : ''}
                </div>
                <GameBoard
                  board={spectatorGuestBoard}
                  isPlayerBoard={false}
                  isPlacing={false}
                  title={`${spectatorGuestName}'s Fleet`}
                  disabled={true}
                  ships={[]}
                />
              </div>
            </div>
          )}
        </div>

        {phase === 'battle' && <BattleLog entries={battleLog} />}

        {phase === 'gameover' && winner && (
          <GameOver
            winner={winner}
            onPlayAgain={handleSpectatorGoHome}
            onGoHome={handleSpectatorGoHome}
            opponentName={winner === 'player' ? spectatorGuestName : spectatorHostName}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
      <GameHUD
        isPlayerTurn={isPlayerTurn}
        message={message}
        phase={phase}
        onToggleSound={toggle}
        onBack={handleGoHome}
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
              isReady={mp.isPlayerReady}
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
            <div className="flex flex-col items-center gap-2">
              {phase === 'battle' && isPlayerTurn && (
                <TurnTimer
                  seconds={turnTimeLeft}
                  maxSeconds={30}
                  isActive={isPlayerTurn && phase === 'battle'}
                  onTimeout={handleTurnTimeout}
                />
              )}
              <GameBoard
                board={getVisibleBoard(opponentBoard, true)}
                isPlayerBoard={false}
                isPlacing={false}
                onCellClick={handlePlayerAttack}
                title="Enemy Waters"
                disabled={!isPlayerTurn || phase === 'gameover'}
                highlight={isPlayerTurn && phase === 'battle'}
                lastAttackResult={lastAttackResult}
                lastAttackPos={lastAttackPos}
                cursorRow={cursorPos.row}
                cursorCol={cursorPos.col}
                showCursor={showCursor && isPlayerTurn && phase === 'battle'}
              />
            </div>
          </div>
        )}
      </div>

      {phase === 'battle' && <BattleLog entries={battleLog} />}

      {phase !== 'placement' && (
        <Chat
          messages={mp.chatMessages}
          onSend={mp.sendChat}
          playerName={playerName}
        />
      )}

      {phase === 'gameover' && winner && !showReplay && (
        <GameOver
          winner={winner}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          opponentName={mp.opponentName || 'Opponent'}
          onWatchReplay={replayData ? () => setShowReplay(true) : undefined}
        />
      )}

      {showReplay && replayData && (
        <GameReplay replayData={replayData} onClose={() => setShowReplay(false)} />
      )}
    </div>
  );
}
