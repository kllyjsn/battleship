import { useEffect } from 'react';
import type { GamePhase } from '../engine/types';

const BASE_TITLE = 'Battleship — Naval Combat';

/** Update the browser tab title to reflect the current game phase. */
export function useDocumentTitle(phase: GamePhase, isPlayerTurn?: boolean) {
  useEffect(() => {
    switch (phase) {
      case 'placement':
        document.title = 'Deploy Fleet — ' + BASE_TITLE;
        break;
      case 'battle':
        document.title = (isPlayerTurn ? 'Your Turn' : "Enemy's Turn") + ' — ' + BASE_TITLE;
        break;
      case 'gameover':
        document.title = 'Battle Over — ' + BASE_TITLE;
        break;
      default:
        document.title = BASE_TITLE;
    }
    return () => { document.title = BASE_TITLE; };
  }, [phase, isPlayerTurn]);
}
