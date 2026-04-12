import { useState, useCallback, useRef, useEffect } from 'react';
import PubNub from 'pubnub';
import type { MultiplayerMessage, ChatMessage, Position } from '../engine/types';
import { getPubNub, resetPubNub, generateRoomCode, getChannelName, hasPubNubKeys } from './pubnub';

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
  /** Number of users present in the channel (via PubNub presence) */
  occupancy: number;
  /** True when PubNub detects a network interruption */
  isReconnecting: boolean;
}

/** Interval (ms) between application-level PING messages */
const PING_INTERVAL_MS = 15_000;
/** How long to wait for a PONG before considering the peer unresponsive */
const PONG_TIMEOUT_MS = 10_000;

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
    occupancy: 0,
    isReconnecting: false,
  });

  const pubnubRef = useRef<PubNub | null>(null);
  const channelRef = useRef<string>('');
  const onMessageRef = useRef<((msg: MultiplayerMessage) => void) | null>(null);
  const userIdRef = useRef<string>('');
  const playerNameRef = useRef<string>(playerName);
  const isHostRef = useRef<boolean>(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Queued message to send once PubNub confirms we are subscribed */
  const pendingJoinRef = useRef<MultiplayerMessage | null>(null);
  const listenerRef = useRef<PubNub.Listener | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentUserIdRef = useRef<string | null>(null);

  // Keep playerNameRef in sync with the playerName prop
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const cleanup = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
    if (opponentTimeoutRef.current) {
      clearTimeout(opponentTimeoutRef.current);
      opponentTimeoutRef.current = null;
    }
    pendingJoinRef.current = null;
    listenerRef.current = null;
    opponentUserIdRef.current = null;
    // resetPubNub now also removes listeners and calls destroy()
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

  // ── Application-level heartbeat (PING / PONG) ──────────────────────────
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    pingIntervalRef.current = setInterval(() => {
      const pn = pubnubRef.current;
      if (!pn || !channelRef.current) return;

      pn.publish({
        channel: channelRef.current,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: { type: 'PING' } as any,
      });

      // Start a PONG timeout — if we don't hear back, flag connection
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = setTimeout(() => {
        setState(prev => prev.isConnected ? { ...prev, isReconnecting: true } : prev);
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }, []);

  // ── Fetch initial occupancy via hereNow ────────────────────────────────
  const fetchOccupancy = useCallback(async () => {
    const pn = pubnubRef.current;
    if (!pn || !channelRef.current) return;
    try {
      const resp = await pn.hereNow({ channels: [channelRef.current], includeUUIDs: true });
      const ch = resp.channels[channelRef.current];
      if (ch) {
        setState(prev => ({ ...prev, occupancy: ch.occupancy }));
      }
    } catch {
      // Non-critical — presence events will keep occupancy up to date
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    const pn = pubnubRef.current;
    if (!pn) return;

    // Remove any previously attached listener to prevent accumulation
    if (listenerRef.current) {
      pn.removeListener(listenerRef.current);
    }

    const listener = {
      message: (event: PubNub.Subscription.Message) => {
        // BUG-0001 fix: Skip self-published messages
        if (event.publisher === userIdRef.current) return;

        const msg = event.message as unknown as MultiplayerMessage;

        // ── Application-level heartbeat ──────────────────────────────
        if (msg.type === 'PING') {
          // Respond with PONG so the peer knows we're alive
          pn.publish({
            channel,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: { type: 'PONG' } as any,
          });
          return;
        }
        if (msg.type === 'PONG') {
          // Only clear reconnecting state if PONG is from the actual opponent,
          // not from a spectator (who would mask a real opponent disconnect)
          if (opponentUserIdRef.current && event.publisher !== opponentUserIdRef.current) return;
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = null;
          }
          setState(prev => prev.isReconnecting ? { ...prev, isReconnecting: false } : prev);
          return;
        }

        if (msg.type === 'JOIN' && msg.playerName) {
          // Track the opponent's userId for targeted PONG / presence filtering
          if (msg.playerId) {
            opponentUserIdRef.current = msg.playerId;
          }
          // Clear opponent timeout since we found the host/opponent
          if (opponentTimeoutRef.current) {
            clearTimeout(opponentTimeoutRef.current);
            opponentTimeoutRef.current = null;
          }
          // Clear any stale PONG timeout from pre-opponent PING cycles and
          // restart the PING interval so the next cycle targets the new peer
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = null;
          }
          startPingInterval();

          setState(prev => ({
            ...prev,
            opponentName: msg.playerName ?? null,
            isConnected: true,
            isReconnecting: false,
            error: null,
          }));

          // BUG-0003 fix: Host responds with their name so the guest knows who they're playing
          if (isHostRef.current) {
            pn.publish({
              channel,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              message: { type: 'JOIN', playerName: playerNameRef.current, playerId: userIdRef.current } as any,
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
          // Stop pinging — no opponent to heartbeat against
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = null;
          }
          opponentUserIdRef.current = null;
          setState(prev => ({
            ...prev,
            opponentName: null,
            isConnected: false,
            opponentReady: false,
            gameStarted: false,
            isReconnecting: false,
            error: 'Opponent left the game',
          }));
          return;
        }

        if (onMessageRef.current) {
          onMessageRef.current(msg);
        }
      },

      // ── Network / subscription status ────────────────────────────────
      status: (event: PubNub.Status | PubNub.StatusEvent) => {
        const cat = event.category;
        if (cat === 'PNConnectedCategory') {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          setState(prev => ({ ...prev, isConnecting: false, isReconnecting: false }));

          // Publish any queued JOIN / SPECTATE message now that subscription is confirmed
          if (pendingJoinRef.current) {
            pn.publish({
              channel,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              message: pendingJoinRef.current as any,
            });
            pendingJoinRef.current = null;
          }

          // Start application-level heartbeat & fetch initial occupancy
          startPingInterval();
          fetchOccupancy();
        }

        if (cat === 'PNReconnectedCategory') {
          setState(prev => ({ ...prev, isReconnecting: false }));
          startPingInterval();
          fetchOccupancy();
        }

        if (cat === 'PNNetworkDownCategory') {
          setState(prev => ({ ...prev, isReconnecting: true }));
          // Stop pinging while disconnected
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
        }

        // PNTimeoutCategory: soft reconnect if already connected, hard error if still connecting
        if (cat === 'PNTimeoutCategory') {
          setState(prev => {
            if (prev.isConnected) {
              // Already in a session — treat as recoverable
              return { ...prev, isReconnecting: true };
            }
            // Still connecting — treat as hard failure
            return {
              ...prev,
              isConnecting: false,
              isConnected: false,
              error: 'Connection failed. Please check your network and try again.',
            };
          });
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
        }

        if (cat === 'PNNetworkUpCategory') {
          // SDK will auto-resubscribe (restore: true), but clear flag optimistically
          setState(prev => prev.isReconnecting ? { ...prev, isReconnecting: false } : prev);
        }

        // PNDisconnectedCategory: if we were already connected this is a
        // recoverable disconnect (the SDK will auto-resubscribe with restore: true).
        // Only treat it as a hard failure if we never finished connecting.
        if (cat === 'PNDisconnectedCategory') {
          setState(prev => {
            if (prev.isConnected) {
              return { ...prev, isReconnecting: true };
            }
            return prev; // still connecting — let the connect timeout handle it
          });
        }

        // Hard failures — immediately surface an error and stop waiting
        const hardFailures: Record<string, string> = {
          PNNetworkIssuesCategory: 'Network error — check your internet connection.',
          PNAccessDeniedCategory: 'Access denied — PubNub keys may be invalid or missing.',
          PNBadRequestCategory: 'Bad request — PubNub keys may be misconfigured.',
          PNValidationErrorCategory: 'Configuration error — PubNub keys may be missing.',
          PNServerErrorCategory: 'Server error — please try again in a moment.',
          PNMalformedResponseCategory: 'Unexpected server response — please try again.',
          PNUnknownCategory: 'Connection failed — please try again.',
        };

        if (cat in hardFailures) {
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
            error: hardFailures[cat],
          }));
        }
      },

      // ── Presence events ──────────────────────────────────────────────
      presence: (event: PubNub.Subscription.Presence) => {
        if (event.action === 'join' || event.action === 'leave' || event.action === 'timeout') {
          setState(prev => ({
            ...prev,
            occupancy: event.occupancy ?? prev.occupancy,
          }));
        }

        // If the opponent timed out / left via presence, treat as a soft disconnect.
        // Only trigger for the actual opponent, not spectators.
        if ((event.action === 'timeout' || event.action === 'leave') &&
            event.uuid !== userIdRef.current &&
            (!opponentUserIdRef.current || event.uuid === opponentUserIdRef.current)) {
          setState(prev => {
            if (prev.isConnected && prev.opponentName) {
              return { ...prev, isReconnecting: true };
            }
            return prev;
          });
        }
      },
    };

    listenerRef.current = listener;
    pn.addListener(listener);

    // Subscribe WITH presence enabled
    pn.subscribe({ channels: [channel], withPresence: true });
  }, [startPingInterval, fetchOccupancy]);

  const publish = useCallback(async (msg: MultiplayerMessage) => {
    const pn = pubnubRef.current;
    if (!pn || !channelRef.current) return;

    await pn.publish({
      channel: channelRef.current,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: msg as any,
    });
  }, []);

  const createRoom = useCallback(() => {
    if (!hasPubNubKeys()) {
      setState(prev => ({ ...prev, error: 'Multiplayer is unavailable — server keys are not configured.' }));
      return;
    }
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
    if (!hasPubNubKeys()) {
      setState(prev => ({ ...prev, error: 'Multiplayer is unavailable — server keys are not configured.' }));
      return;
    }
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

    // Queue the SPECTATE message — it will be sent once PNConnectedCategory fires
    pendingJoinRef.current = {
      type: 'SPECTATE',
      playerName: name,
      playerId: userId,
      isSpectator: true,
    };

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

  const joinRoom = useCallback((roomCode: string, name: string) => {
    if (!hasPubNubKeys()) {
      setState(prev => ({ ...prev, error: 'Multiplayer is unavailable — server keys are not configured.' }));
      return;
    }
    cleanup();
    const userId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    userIdRef.current = userId;
    isHostRef.current = false;
    const pn = getPubNub(userId);
    pubnubRef.current = pn;

    const channel = getChannelName(roomCode);
    channelRef.current = channel;

    // Don't set isConnected yet — wait for host to respond with their JOIN
    setState(prev => ({
      ...prev,
      roomCode,
      isHost: false,
      isConnecting: true,
      error: null,
    }));

    // Queue the JOIN message — it will be sent once PNConnectedCategory fires
    pendingJoinRef.current = {
      type: 'JOIN',
      playerName: name,
      playerId: userId,
    };

    subscribe(channel);

    connectTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (prev.isConnecting) {
          return { ...prev, isConnecting: false };
        }
        return prev;
      });
    }, 10000);

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

  const sendLeave = useCallback(async () => {
    // Best-effort publish: await so the LEAVE message is sent before destroy(),
    // but always clean up even if publish fails (network error, timeout, etc.)
    try {
      await publish({ type: 'LEAVE' });
    } catch {
      // Publish failed — opponent will detect departure via presence timeout
    }
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
      occupancy: 0,
      isReconnecting: false,
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
