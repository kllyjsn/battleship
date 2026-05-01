import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollText, X, ChevronDown } from 'lucide-react';
import type { BattleLogEntry } from '../engine/types';
import { ROW_LABELS } from '../engine/constants';

interface BattleLogProps {
  entries: BattleLogEntry[];
}

function coordLabel(row: number, col: number): string {
  return `${ROW_LABELS[row]}${col + 1}`;
}

export function BattleLog({ entries }: BattleLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [entries, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setSeen(entries.length);
    }
  }, [isOpen, entries.length]);

  const unread = isOpen ? 0 : entries.length - seen;

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setSeen(entries.length);
        }}
        className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 w-11 h-11 sm:w-12 sm:h-12 rounded-full metal-panel text-amber-400 shadow-lg hover:text-amber-300 transition-all flex items-center justify-center z-40"
        style={{ boxShadow: '0 0 10px rgba(255, 176, 0, 0.1)' }}
      >
        <ScrollText size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold font-mono-crt animate-pulse">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-4 sm:left-4 sm:w-80 h-[50vh] sm:h-96 metal-panel sm:rounded-xl shadow-2xl flex flex-col z-40 rounded-t-xl">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 sm:py-3 flex-shrink-0 cursor-pointer sm:cursor-default"
        style={{ borderBottom: '1px solid var(--steel-border)' }}
        onClick={() => setIsOpen(false)}
      >
        <span className="text-sm font-semibold text-amber-400 font-mono-crt">BATTLE LOG</span>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <span className="text-[11px] text-slate-500 font-mono-crt">{entries.length} MOVES</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="text-slate-500 hover:text-amber-400 transition-colors p-2"
          >
            <span className="hidden sm:block"><X size={16} /></span>
            <span className="block sm:hidden"><ChevronDown size={18} /></span>
          </button>
        </div>
      </div>

      {/* Entries — aria-live announces new log items to screen readers */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-contain" aria-live="polite" aria-relevant="additions">
        {entries.length === 0 && (
          <p className="text-center text-slate-600 text-xs sm:text-sm mt-4 font-mono-crt">NO ENGAGEMENTS</p>
        )}
        {entries.map((entry) => {
          const who = entry.player === 'player' ? 'YOU' : 'ENEMY';
          const coord = coordLabel(entry.position.row, entry.position.col);
          const arrow = '\u2192';

          let resultText: string;
          let resultClass: string;
          if (entry.result === 'sunk') {
            resultText = `SUNK ${entry.shipName || 'ship'}!`;
            resultClass = 'text-red-400 text-glow-red';
          } else if (entry.result === 'hit') {
            resultText = 'HIT';
            resultClass = 'text-red-400';
          } else {
            resultText = 'MISS';
            resultClass = 'text-slate-500';
          }

          return (
            <div
              key={entry.id}
              className="flex items-center gap-1.5 text-xs font-mono-crt py-0.5"
            >
              <span className="text-slate-600 w-7 text-right shrink-0 leading-relaxed">#{entry.turn}</span>
              <span className={entry.player === 'player' ? 'text-green-400' : 'text-amber-400'}>
                {who}
              </span>
              <span className="text-slate-600">{arrow}</span>
              <span className="text-slate-300">{coord}:</span>
              <span className={resultClass}>{resultText}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
