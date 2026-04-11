import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Board, Ship, Orientation, GamePhase, MultiplayerMessage } from '../engine/types';
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
  const [hideEnemyShots, setHideEnemyShots] = useState(false);
  const [inLobby, setInLobby] = useState(true);
  const [playerHitsOnOpponentCount, setPlayerHitsOnOpponentCount] = useState(0);
  const { play, toggle } = useSound();
  const music = useBackgroundMusic();
  const shotCountRef = useRef(0);
  const hitCountRef = useRef(0);
  const gameStartTimeRef = useRef<number>(0);

  const playerBoardRef = useRef(playerBoard);
  const playerShipsRef = useRef(playerShips);
  const phaseRef = useRef(phase);

  useEffect(() => {
    playerBoardRef.current = playerBoard;
  }, [playerBoard]);

  useEffect(() => {
    playerShipsRef.current = playerShips;
  }, [playerShips]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const mp = useMultiplayer(playerName);

  // Handle incoming multiplayer messages
  useEffect(() => {
    mp.setMessageHandler((msg: MultiplayerMessage) => {
      switch (msg.type) {
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
          } else {
            setIsPlayerTurn(true);
            setTimeout(() => setMessage('Your turn — fire at the enemy grid!'), 1000);
          }
          break;
        }

        case 'ATTACK_RESULT': {
          if (msg.row === undefined || msg.col === undefined || !msg.result) return;

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
    play('click');
  }, [playerShips, mp, play]);

  const handlePlayerAttack = useCallback(
    (row: number, col: number) => {
      if (phase !== 'battle' || !isPlayerTurn) return;

      const cell = opponentBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;

      shotCountRef.current += 1;
      mp.sendAttack(row, col);
      setIsPlayerTurn(false);
      setMessage('Waiting for result...');
    },
    [phase, isPlayerTurn, opponentBoard, mp]
  );

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
    // BUG-0005 fix: Use REMATCH handshake instead of resetReady() to avoid
    // race condition where opponent's early READY gets wiped.
    mp.sendRematch();
  }, [mp]);

  const handleGoHome = useCallback(() => {
    mp.sendLeave();
    onBack();
  }, [mp, onBack]);

  if (inLobby) {
    return (
      <MultiplayerLobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
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
              onUndoShip={handleUndoShip}
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
            <GameBoard
              board={getVisibleBoard(opponentBoard, true)}
              isPlayerBoard={false}
              isPlacing={false}
              onCellClick={handlePlayerAttack}
              title="Enemy Waters"
              disabled={!isPlayerTurn || phase === 'gameover'}
              highlight={isPlayerTurn && phase === 'battle'}
            />
          </div>
        )}
      </div>

      {phase !== 'placement' && (
        <Chat
          messages={mp.chatMessages}
          onSend={mp.sendChat}
          playerName={playerName}
        />
      )}

      {phase === 'gameover' && winner && (
        <GameOver
          winner={winner}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          opponentName={mp.opponentName || 'Opponent'}
        />
      )}
    </div>
  );
}
