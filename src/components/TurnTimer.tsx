import { useEffect, useRef } from 'react';

interface TurnTimerProps {
  seconds: number;
  maxSeconds: number;
  isActive: boolean;
  onTimeout: () => void;
}

export function TurnTimer({ seconds, maxSeconds, isActive, onTimeout }: TurnTimerProps) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (isActive && seconds <= 0) {
      onTimeoutRef.current();
    }
  }, [isActive, seconds]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / maxSeconds;
  const offset = circumference * (1 - progress);

  const color = seconds > 10 ? 'var(--crt-green)' : seconds > 5 ? 'var(--crt-amber)' : '#ff3c3c';
  const glowColor = seconds > 10 ? 'rgba(57,255,20,0.3)' : seconds > 5 ? 'rgba(255,176,0,0.3)' : 'rgba(255,60,60,0.4)';
  const isPulsing = seconds <= 5 && isActive;

  return (
    <div
      className={`flex flex-col items-center gap-1 ${isPulsing ? 'animate-pulse' : ''}`}
    >
      <div className="relative w-16 h-16">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 64 64"
        >
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="var(--steel-border)"
            strokeWidth="3"
          />
          {/* Progress arc */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 4px ${glowColor})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-mono-crt text-lg font-bold"
            style={{ color, textShadow: `0 0 8px ${glowColor}` }}
          >
            {seconds}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-mono-crt text-slate-500 uppercase tracking-wider">
        Timer
      </span>
    </div>
  );
}
