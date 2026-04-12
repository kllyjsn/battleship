import PubNub from 'pubnub';

let pubnubInstance: PubNub | null = null;

export function getPubNub(userId: string): PubNub {
  if (!pubnubInstance) {
    pubnubInstance = new PubNub({
      publishKey: import.meta.env.VITE_PUBNUB_PUBLISH_KEY || '',
      subscribeKey: import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY || '',
      userId,
      // Presence: detect users within 20s of disconnect
      presenceTimeout: 20,
      // Heartbeat interval keeps the presence lease alive
      heartbeatInterval: 9,
      // Restore subscription after temporary network loss
      restore: true,
    });
  }
  return pubnubInstance;
}

export function resetPubNub(): void {
  if (pubnubInstance) {
    try {
      pubnubInstance.removeAllListeners();
      pubnubInstance.unsubscribeAll();
      pubnubInstance.destroy();
    } catch {
      // Best-effort cleanup
    }
    pubnubInstance = null;
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getChannelName(roomCode: string): string {
  return `battleship-game-${roomCode}`;
}
