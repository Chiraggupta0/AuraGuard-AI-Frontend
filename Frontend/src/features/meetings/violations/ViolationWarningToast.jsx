import { useEffect } from 'react';

// Participant-side warning — shown to whoever triggered a confirmed
// violation. Auto-dismisses after a few seconds; dismissing (manually or
// automatically) is a UI-only action and does not change violation state on
// the backend (see violationEvent.model.js's hostAcknowledged field for the
// analogous host-side concept).
export default function ViolationWarningToast({ warning, onDismiss }) {
  useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [warning, onDismiss]);

  if (!warning) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow-xl backdrop-blur-sm">
        <span className="text-lg leading-none">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-200">{warning.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-300/70 hover:text-amber-200"
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
