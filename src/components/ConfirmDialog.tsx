import { useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useModalA11y(dialogRef, onCancel);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="metal-panel rounded-xl p-6 max-w-sm w-full mx-4 text-center outline-none"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center metal-panel-light"
          style={{ boxShadow: '0 0 15px rgba(255, 176, 0, 0.15)' }}
        >
          <AlertTriangle size={28} className="text-glow-amber" aria-hidden="true" />
        </div>

        <h2 id={titleId} className="text-xl font-bold mb-2 font-mono-crt text-glow-amber">
          {title}
        </h2>

        <p id={descId} className="text-sm text-slate-400 mb-6 font-mono-crt">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded metal-panel-light text-green-300 font-semibold font-mono-crt text-sm hover:ring-1 hover:ring-green-400/40 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded metal-panel-light text-red-400 font-semibold font-mono-crt text-sm hover:ring-1 hover:ring-red-400/40 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
