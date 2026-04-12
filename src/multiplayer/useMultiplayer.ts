import { useState, useCallback, useRef, useEffect } from 'react';
import PubNub from 'pubnub';
import type { MultiplayerMessage, ChatMessage, Position } from '../engine/types';
import { getPubNub, resetPubNub, generateRoomCode, getChannelName } from './pubnub';

interface MultiplayerState {
  roomCode: string | null;
  isHost: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  opponentName: string | null;
  opponentReady: boolean;
  isPlayerReady: boolean;
  isPlayerTurn: boolean;
  chatMessages: ChatMessage[];
  error: string | null;
  gameStarted: boolean;
  isSpectator: boolean;
}

export function useMultiplayer(playerName: string) {
  const [state, setState] = useState<MultiplayerState>({
    roomCode: null,
    isHost: false,
    isConnected: false,
    isConnecting: false,
    opponentName: null,
    opponentReady: false,
    isPlayerReady: false,
    isPlayerTurn: false,
    chatMessages: [],
    error: null,
    gameStarted: false,
    isSpectator: false,
  });

  const pubnubRef = useRef<PubNub | null>(null);
  const channelRef = useRef<string>('');
  const onMessageRef = useRef<((msg: MultiplayerMessage) => void) | null>(null);
  const userIdRef = useRef<string>('');
  const playerNameRef = useRef<string>(playerName);
  const isHostRef = useRef<boolean>(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep playerNameRef in sync with the playerName prop
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const cleanup = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (opponentTimeoutRef.current) {
      clearTimeout(opponentTimeoutRef.current);
      opponentTimeoutRef.current = null;
    }
    resetPubNub();
    pubnubRef.current = null;
    channelRef.current = '';
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const setMessageHandler = useCallback((handler: (msg: MultiplayerMessage) => void) => {
    onMessageRef.current = handler;
  }, []);

  const subscribe = useCallback((channel: string) => {
    const pn = pubnubRef.current;
    if (!pn) return;

    pn.addListener({
      message: (event) => {
        // BUG-0001 fix: Skip self-published messages
        if (event.publisher === userIdRef.current) return;

        const msg = event.message as unknown as MultiplayerMessage;

        if (msg.type === 'JOIN' && msg.playerName) {
          // Clear opponent timeout since we found the host/opponent
          if (opponentTimeoutRef.current) {
            clearTimeout(opponentTimeoutRef.current);
            opponentTimeoutRef.current = null;
          }
          setState(prev => ({
            ...prev,
            opponentName: msg.playerName ?? null,
            isConnected: true,
            error: null,
          }));

          // BUG-0003 fix: Host responds with their name so the guest knows who they're playing
          if (isHostRef.current) {
            pn.publish({
              channel,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              message: { type: 'JOIN', playerName: playerNameRef.current } as any,
            });
          }
        }

        if (msg.type === 'CHAT' && msg.message && msg.sender) {
          setState(prev => ({
            ...prev,
            chatMessages: [
              ...prev.chatMessages,
              {
                id: msg.messageId || `${Date.now()}-${Math.random()}`,
                sender: msg.sender!,
                message: msg.message!,
                timestamp: Date.now(),
                reactions: [],
              },
            ],
          }));
          return;
        }

        if (msg.type === 'REACTION' && msg.messageId && msg.emoji && msg.sender) {
          setState(prev => ({
            ...prev,
            chatMessages: prev.chatMessages.map(m =>
              m.id === msg.messageId
                ? {
                    ...m,
                    reactions: m.reactions.some(r => r.emoji === msg.emoji && r.sender === msg.sender!)
                      ? m.reactions.filter(r => !(r.emoji === msg.emoji && r.sender === msg.sender!))
                      : [...m.reactions, { emoji: msg.emoji!, sender: msg.sender! }],
                  }
                : m
            ),
          }));
          return;
        }

        if (msg.type === 'READY') {
          setState(prev => ({ ...prev, opponentReady: true }));
        }

        // BUG-0005 fix: REMATCH handshake — opponent wants to play again.
        // Clear their ready flag so both sides re-enter placement cleanly.
        if (msg.type === 'REMATCH') {
          setState(prev => ({
            ...prev,
            opponentReady: false,
          }));
        }

        if (msg.type === 'SPECTATE' && msg.playerName) {
          // A spectator joined — send them a sync of current state
          // The game page handles sending SPECTATOR_SYNC via onMessage
        }

        if (msg.type === 'LEAVE') {
          setState(prev => ({
            ...prev,
            opponentName: null,
            isConnected: false,
            opponentReady: false,
            gameStarted: false,
            error: 'Opponent left the game',
          }));
          return;
        }

        if (onMessageRef.current) {
          onMessageRef.current(msg);
        }
      },
      status: (event: { category: string }) => {
        if (event.category === 'PNConnectedCategory') {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          setState(prev => ({ ...prev, isConnecting: false }));
        }
        if (event.category === 'PNNetworkIssuesCategory' ||
            event.category === 'PNAccessDeniedCategory' ||
            event.category === 'PNTimeoutCategory') {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          if (opponentTimeoutRef.current) {
            clearTimeout(opponentTimeoutRef.current);
            opponentTimeoutRef.current = null;
          }
          setState(prev => ({
            ...prev,
            isConnecting: false,
            isConnected: false,
            error: 'Connection failed. Please check your network and try again.',
          }));
        }
      },
    });

    pn.subscribe({ channels: [channel] });
  }, []);

  const publish = useCallback((msg: MultiplayerMessage) => {
    const pn = pubnubRef.current;
    if (!pn || !channelRef.current) return;

    pn.publish({
      channel: channelRef.current,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: msg as any,
    });
  }, []);

  const createRoom = useCallback(() => {
    cleanup();
    const userId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    userIdRef.current = userId;
    isHostRef.current = true;
    const pn = getPubNub(userId);
    pubnubRef.current = pn;

    const roomCode = generateRoomCode();
    const channel = getChannelName(roomCode);
    channelRef.current = channel;

    setState(prev => ({
      ...prev,
      roomCode,
      isHost: true,
      isConnecting: true,
      error: null,
    }));

    subscribe(channel);

    connectTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (prev.isConnecting) {
          return { ...prev, isConnecting: false };
        }
        return prev;
      });
    }, 10000);
  }, [cleanup, subscribe]);

  const joinAsSpectator = useCallback((roomCode: string, name: string) => {
    cleanup();
    const userId = `spectator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    userIdRef.current = userId;
    isHostRef.current = false;
    const pn = getPubNub(userId);
    pubnubRef.current = pn;

    const channel = getChannelName(roomCode);
    channelRef.current = channel;

    setState(prev => ({
      ...prev,
      roomCode,
      isHost: false,
      isConnecting: true,
      isConnected: true,
      isSpectator: true,
      error: null,
    }));

    subscribe(channel);

    connectTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (prev.isConnecting) {
          return { ...prev, isConnecting: false };
        }
        return prev;
      });
    }, 10000);

    // Send spectate message after subscribing
    setTimeout(() => {
      pn.publish({
        channel,
        message: {
          type: 'SPECTATE',
          playerName: name,
          playerId: userId,
          isSpectator: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
    }, 1000);
  }, [cleanup, subscribe]);

  const joinRoom = useCallback((roomCode: string, name: string) => {
    cleanup();
    const userId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    userIdRef.current = userId;
    isHostRef.current = false;
    const pn = getPubNub(userId);
    pubnubRef.current = pn;

    const channel = getChannelName(roomCode);
    channelRef.current = channel;

    setState(prev => ({
      ...prev,
      roomCode,
      isHost: false,
      isConnecting: true,
      isConnected: true,
      error: null,
    }));

    subscribe(channel);

    connectTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (prev.isConnecting) {
          return { ...prev, isConnecting: false };
        }
        return prev;
      });
    }, 10000);

    // Send join message after subscribing, using the name parameter directly
    // to avoid stale closure over playerName state
    setTimeout(() => {
      pn.publish({
        channel,
          message: {
            type: 'JOIN',
            playerName: name,
            playerId: userId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
      });
    }, 1000);

    // Timeout for waiting for host/opponent to respond
    opponentTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (!prev.opponentName) {
          return {
            ...prev,
            isConnecting: false,
            isConnected: false,
            error: 'Room not found or host has left. Try creating a new room.',
          };
        }
        return prev;
      });
    }, 15000);
  }, [cleanup, subscribe]);

  const sendReady = useCallback(() => {
    setState(prev => ({ ...prev, isPlayerReady: true }));
    // BUG-0004 fix: Don't send ship positions — opponent could inspect PubNub messages to cheat
    publish({ type: 'READY' });
  }, [publish]);

  const sendAttack = useCallback((row: number, col: number) => {
    publish({ type: 'ATTACK', row, col });
  }, [publish]);

  const sendAttackResult = useCallback((row: number, col: number, result: 'hit' | 'miss' | 'sunk', shipName?: string, shipId?: string, shipPositions?: Position[]) => {
    publish({ type: 'ATTACK_RESULT', row, col, result, shipName, shipId, shipPositions });
  }, [publish]);

  const sendGameOver = useCallback((winner: string) => {
    publish({ type: 'GAME_OVER', winner });
  }, [publish]);

  const sendChat = useCallback((message: string) => {
    const chatMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: playerName,
      message,
      timestamp: Date.now(),
      reactions: [],
    };
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, chatMsg],
    }));
    publish({ type: 'CHAT', message, sender: playerName, messageId: chatMsg.id });
  }, [publish, playerName]);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    // Toggle locally
    setState(prev => ({
      ...prev,
      chatMessages: prev.chatMessages.map(m =>
        m.id === messageId
          ? {
              ...m,
              reactions: m.reactions.some(r => r.emoji === emoji && r.sender === playerName)
                ? m.reactions.filter(r => !(r.emoji === emoji && r.sender === playerName))
                : [...m.reactions, { emoji, sender: playerName }],
            }
          : m
      ),
    }));
    publish({ type: 'REACTION', messageId, emoji, sender: playerName });
  }, [publish, playerName]);

  const sendLeave = useCallback(() => {
    publish({ type: 'LEAVE' });
    cleanup();
    setState({
      roomCode: null,
      isHost: false,
      isConnected: false,
      isConnecting: false,
      opponentName: null,
      opponentReady: false,
      isPlayerReady: false,
      isPlayerTurn: false,
      chatMessages: [],
      error: null,
      gameStarted: false,
      isSpectator: false,
    });
  }, [publish, cleanup]);

  // BUG-0002 fix: Reset ready flags so Play Again works correctly
  // BUG-0005 fix: Use REMATCH handshake to prevent race condition where
  // one player sends READY before the other clicks Play Again, causing
  // resetReady() to wipe the already-received opponentReady flag.
  const sendRematch = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlayerReady: false,
      gameStarted: false,
      // Don't clear opponentReady here — if opponent already sent REMATCH,
      // it was set to false by the REMATCH handler. If not yet, it will be
      // cleared when their REMATCH arrives.
    }));
    publish({ type: 'REMATCH' });
  }, [publish]);

  const resetReady = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlayerReady: false,
      opponentReady: false,
      gameStarted: false,
    }));
  }, []);

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      gameStarted: true,
      isPlayerTurn: prev.isHost,
    }));
  }, []);

  const setTurn = useCallback((isPlayerTurn: boolean) => {
    setState(prev => ({ ...prev, isPlayerTurn }));
  }, []);

  return {
    ...state,
    createRoom,
    joinRoom,
    sendReady,
    sendAttack,
    sendAttackResult,
    sendGameOver,
    sendChat,
    sendReaction,
    sendLeave,
    setMessageHandler,
    publish,
    startGame,
    setTurn,
    resetReady,
    sendRematch,
    joinAsSpectator,
  };
}
