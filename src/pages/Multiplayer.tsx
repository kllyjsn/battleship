import { useState, useCallback, useEffect, useRef } from 'react';
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

interface MultiplayerPageProps {
  onBack: () => void;
}

export function MultiplayerPage({ onBack }: MultiplayerPageProps) {
  const [playerName, setPlayerName] = useState('');
  const [phase, setPhase] = useState<GamePhase>('placement');
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard());
  const [opponentBoard, setOpponentBoard] = useState<Board>(createEmptyBoard());
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);
  const [opponentShips, setOpponentShips] = useState<Ship[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(SHIPS[0].id);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [message, setMessage] = useState('Place your ships on the board');
  const [inLobby, setInLobby] = useState(true);
  const { play, toggle } = useSound();

  const playerBoardRef = useRef(playerBoard);
  const playerShipsRef = useRef(playerShips);

  useEffect(() => {
    playerBoardRef.current = playerBoard;
  }, [playerBoard]);

  useEffect(() => {
    playerShipsRef.current = playerShips;
  }, [playerShips]);

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
            if (phase === 'battle') {
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
          break;
        }
      }
    });
  }, [mp, play, phase]);

  // Both players ready -> start battle
  useEffect(() => {
    if (mp.isPlayerReady && mp.opponentReady && phase === 'placement') {
      setPhase('battle');
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
      mp.joinRoom(code);
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

  const handleReady = useCallback(() => {
    if (playerShips.length !== SHIPS.length) return;
    mp.sendReady(playerShips);
    setMessage('Waiting for opponent to place ships...');
    play('click');
  }, [playerShips, mp, play]);

  const handlePlayerAttack = useCallback(
    (row: number, col: number) => {
      if (phase !== 'battle' || !isPlayerTurn) return;

      const cell = opponentBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;

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
  }, []);

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
      />
    );
  }

  const playerHitsOnOpponent = opponentShips.reduce((sum, s) => sum + s.hits, 0);
  const opponentHitsOnPlayer = playerShips.reduce((sum, s) => sum + s.hits, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950 flex flex-col">
      <GameHUD
        isPlayerTurn={isPlayerTurn}
        message={message}
        phase={phase}
        onToggleSound={toggle}
        onBack={handleGoHome}
        playerHits={opponentHitsOnPlayer}
        opponentHits={playerHitsOnOpponent}
        totalShipCells={TOTAL_SHIP_CELLS}
      />

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 p-4">
        {phase === 'placement' ? (
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <GameBoard
              board={playerBoard}
              isPlayerBoard={true}
              isPlacing={true}
              placingShipSize={selectedShipId ? SHIPS.find((s) => s.id === selectedShipId)?.size : undefined}
              placingOrientation={orientation}
              onCellClick={handlePlaceShip}
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
