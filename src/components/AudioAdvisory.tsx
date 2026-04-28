import { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

/**
 * A themed "COMMS ADVISORY" banner that hints players to turn up their volume.
 * Styled as a military system diagnostic readout that fits the CRT/naval aesthetic.
 * Auto-dismisses after first user interaction (click/keydown) or after a timeout,
 * and stays dismissed for the session via sessionStorage.
 */
export function AudioAdvisory() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem('battleship_audio_advisory_dismissed') !== 'true';
    } catch {
      return true;
    }
  });
  const [fadeOut, setFadeOut] = useState(false);
  const dismissedRef = useRef(false);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setFadeOut(true);
    try {
      sessionStorage.setItem('battleship_audio_advisory_dismissed', 'true');
    } catch {
      // Storage unavailable
    }
    setTimeout(() => setVisible(false), 500);
  };

  // Auto-dismiss on first user interaction (the click that also resumes AudioContext)
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(dismiss, 15000);

    const handleInteraction = () => {
      // Small delay so the user sees the banner acknowledged their action
      setTimeout(dismiss, 1200);
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`w-full max-w-sm mx-auto transition-all duration-500 ${
        fadeOut ? 'opacity-0 translate-y-[-8px]' : 'opacity-100 translate-y-0'
      }`}
      style={{ animation: fadeOut ? undefined : 'fadeIn 0.6s ease-out' }}
    >
      <div
        className="relative rounded metal-panel-light px-3 py-2 overflow-hidden"
        style={{
          border: '1px solid rgba(57, 255, 20, 0.15)',
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.05), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Scanning line effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(57, 255, 20, 0.03) 50%, transparent 100%)',
            backgroundSize: '100% 200%',
            animation: 'audioAdvisoryScan 3s ease-in-out infinite',
          }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-2.5">
          {/* Pulsing volume icon */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center"
            style={{
              background: 'rgba(57, 255, 20, 0.08)',
              border: '1px solid rgba(57, 255, 20, 0.15)',
              animation: 'audioAdvisoryPulse 2s ease-in-out infinite',
            }}
          >
            <Volume2 size={16} className="text-green-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
                style={{
                  boxShadow: '0 0 4px rgba(57, 255, 20, 0.6)',
                  animation: 'glowPulse 1.5s ease-in-out infinite',
                }}
              />
              <span className="text-[11px] tracking-[0.15em] text-green-400/80 font-mono-crt font-semibold uppercase truncate">
                Comms Advisory
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono-crt leading-snug mt-0.5">
              Speakers up for sonar pings &amp; combat audio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
