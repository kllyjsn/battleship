import { useState, useCallback, useRef, useEffect } from 'react';
import PubNub from 'pubnub';
import type { Ship, MultiplayerMessage, ChatMessage, Position } from '../engine/types';
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
  });

  const pubnubRef = useRef<PubNub | null>(null);
  const channelRef = useRef<string>('');
  const onMessageRef = useRef<((msg: MultiplayerMessage) => void) | null>(null);

  const cleanup = useCallback(() => {
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
        const msg = event.message as unknown as MultiplayerMessage;

        if (msg.type === 'JOIN' && msg.playerName) {
          setState(prev => ({
            ...prev,
            opponentName: msg.playerName ?? null,
            isConnected: true,
          }));
        }

        if (msg.type === 'CHAT' && msg.message && msg.sender) {
          setState(prev => ({
            ...prev,
            chatMessages: [
              ...prev.chatMessages,
              {
                id: `${Date.now()}-${Math.random()}`,
                sender: msg.sender!,
                message: msg.message!,
                timestamp: Date.now(),
              },
            ],
          }));
          return;
        }

        if (msg.type === 'READY') {
          setState(prev => ({ ...prev, opponentReady: true }));
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
          setState(prev => ({ ...prev, isConnecting: false }));
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
  }, [cleanup, subscribe]);

  const joinRoom = useCallback((roomCode: string) => {
    cleanup();
    const userId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

    // Send join message after subscribing
    setTimeout(() => {
      pn.publish({
        channel,
          message: {
            type: 'JOIN',
            playerName,
            playerId: userId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
      });
    }, 1000);
  }, [cleanup, subscribe, playerName]);

  const sendReady = useCallback((ships: Ship[]) => {
    setState(prev => ({ ...prev, isPlayerReady: true }));
    publish({ type: 'READY', ships });
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
    };
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, chatMsg],
    }));
    publish({ type: 'CHAT', message, sender: playerName });
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
    });
  }, [publish, cleanup]);

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
    sendLeave,
    setMessageHandler,
    publish,
    startGame,
    setTurn,
  };
}
