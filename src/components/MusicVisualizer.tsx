import { Music, Music2 } from 'lucide-react';

interface MusicVisualizerProps {
  isPlaying: boolean;
  freqData: number[];
  onToggle: () => void;
}

export function MusicVisualizer({ isPlaying, freqData, onToggle }: MusicVisualizerProps) {
  const bars = isPlaying && freqData.length > 0 ? freqData.slice(0, 5) : Array(5).fill(0);

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1 px-2 py-1.5 rounded transition-all min-w-[36px] min-h-[36px] sm:min-w-[24px] sm:min-h-[24px] ${
        isPlaying
          ? 'text-green-400 hover:text-green-300'
          : 'text-slate-600 hover:text-slate-400'
      }`}
      title={isPlaying ? 'Pause Music' : 'Play Music'}
    >
      {isPlaying ? (
        <Music size={14} className="flex-shrink-0" />
      ) : (
        <Music2 size={14} className="flex-shrink-0" />
      )}

      {/* Compact bar visualizer */}
      <div className="flex items-end gap-[1.5px] h-3.5">
        {bars.map((level, i) => (
          <div
            key={i}
            className="w-[2.5px] rounded-full transition-all duration-75"
            style={{
              height: isPlaying ? `${Math.max(2, level * 14)}px` : '2px',
              background: isPlaying
                ? `rgba(57, 255, 20, ${0.5 + level * 0.5})`
                : 'rgba(100, 116, 139, 0.3)',
            }}
          />
        ))}
      </div>
    </button>
  );
}
