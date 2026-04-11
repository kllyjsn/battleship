import { Music, VolumeX } from 'lucide-react';

interface MusicVisualizerProps {
  isPlaying: boolean;
  freqData: number[];
  onToggle: () => void;
}

export function MusicVisualizer({ isPlaying, freqData, onToggle }: MusicVisualizerProps) {
  const bars = isPlaying && freqData.length > 0 ? freqData : Array(8).fill(0);

  return (
    <button
      onClick={onToggle}
      className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full metal-panel text-green-400 hover:text-green-300 transition-all z-40 group"
      style={{ boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)' }}
      title={isPlaying ? 'Pause Music' : 'Play Music'}
    >
      {isPlaying ? (
        <Music size={14} className="flex-shrink-0" />
      ) : (
        <VolumeX size={14} className="flex-shrink-0 opacity-50" />
      )}

      {/* Mini bar visualizer */}
      <div className="flex items-end gap-[2px] h-4">
        {bars.map((level, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75"
            style={{
              height: isPlaying ? `${Math.max(3, level * 16)}px` : '3px',
              background: isPlaying
                ? `linear-gradient(to top, rgba(57, 255, 20, ${0.4 + level * 0.6}), rgba(57, 255, 20, ${0.2 + level * 0.4}))`
                : 'rgba(57, 255, 20, 0.2)',
              opacity: isPlaying ? 0.6 + level * 0.4 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Label - hidden on very small screens */}
      <span className="text-[10px] font-mono-crt hidden sm:inline opacity-60 group-hover:opacity-100 transition-opacity">
        {isPlaying ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
