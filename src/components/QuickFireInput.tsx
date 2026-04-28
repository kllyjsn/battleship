import { useState, useRef, useCallback } from 'react';
import { Crosshair } from 'lucide-react';
import { ROW_LABELS, BOARD_SIZE } from '../engine/constants';

interface QuickFireInputProps {
  onFire: (row: number, col: number) => void;
  disabled: boolean;
}

function parseCoordinate(input: string): { row: number; col: number } | null {
  const trimmed = input.trim().toUpperCase();
  if (trimmed.length < 2 || trimmed.length > 3) return null;

  const letter = trimmed[0];
  const num = parseInt(trimmed.slice(1), 10);

  const row = ROW_LABELS.indexOf(letter);
  if (row === -1) return null;
  if (isNaN(num) || num < 1 || num > BOARD_SIZE) return null;

  return { row, col: num - 1 };
}

export function QuickFireInput({ onFire, disabled }: QuickFireInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const coord = parseCoordinate(value);
    if (!coord) {
      setError(true);
      setTimeout(() => setError(false), 600);
      return;
    }
    onFire(coord.row, coord.col);
    setValue('');
  }, [value, onFire]);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={disabled}
          placeholder="A5"
          maxLength={3}
          aria-label="Quick fire coordinate (e.g. A5)"
          className={`w-14 px-2 py-1 rounded text-xs font-mono-crt text-center transition-all focus:ring-1 focus:outline-none ${
            error
              ? 'text-red-400 ring-1 ring-red-500/50 focus:ring-red-500/50'
              : 'text-green-300 placeholder-slate-600 focus:ring-green-500/30'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !value}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono-crt metal-panel-light text-amber-400 hover:text-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        title="Fire at coordinate"
      >
        <Crosshair size={12} />
        <span className="hidden sm:inline">FIRE</span>
      </button>
    </div>
  );
}
