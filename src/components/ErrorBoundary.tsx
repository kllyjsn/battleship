import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional in-place recovery handler. If provided, a "Return to base"
   *  button is rendered alongside "Reboot system" so a crash inside a
   *  game page can unmount the broken tree without losing menu state. */
  onReset?: () => void;
  /** Optional label override for the title. */
  title?: string;
  /** Hint text shown below the title. */
  hint?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches rendering failures and shows a recovery UI
 * instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const { onReset, title, hint } = this.props;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'radial-gradient(ellipse at center, #141c2b 0%, #0a0e1a 70%)' }}>
          <div className="metal-panel rounded-xl p-8 max-w-md w-full">
            <AlertTriangle size={48} className="mx-auto mb-4 text-glow-amber" />
            <h1 className="text-2xl font-bold mb-2 font-mono-crt text-glow-amber">
              {title ?? 'SYSTEM MALFUNCTION'}
            </h1>
            <p className="text-sm text-slate-400 font-mono-crt mb-6">
              {hint ?? 'An unexpected error occurred. Try reloading to restore operations.'}
            </p>
            {this.state.error && (
              <pre className="text-xs text-red-400/70 font-mono-crt mb-6 p-3 rounded metal-panel-light overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {onReset && (
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded metal-panel-light text-glow-green font-semibold hover:ring-1 hover:ring-green-400/40 transition-all font-mono-crt"
                >
                  <Home size={18} />
                  RETURN TO BASE
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded metal-panel-light text-glow-amber font-semibold hover:ring-1 hover:ring-amber-400/40 transition-all font-mono-crt"
              >
                <RotateCw size={18} />
                REBOOT SYSTEM
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
