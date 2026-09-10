import Button from '@/components/ui/Button';
import useHostViolations from './useHostViolations';

const TYPE_LABELS = {
  phone_usage: 'Phone usage detected',
  camera_covered: 'Camera covered',
  explicit_content: 'Explicit content detected',
  abusive_language: 'Abusive language detected',
  harassment: 'Harassment detected',
  violence: 'Threatening language detected',
  hate_speech: 'Hate speech detected',
  self_harm: 'Concerning language detected',
  other: 'Inappropriate language detected',
};

const SEVERITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

// Host-only floating panel: one card per active, unacknowledged violation.
// Rendered by MeetingRoom.jsx only for the backend-confirmed host — see
// MeetingRoom.jsx for the `isHost` gate, which mirrors how
// admission/JoinRequestPanel.jsx is already gated. Deliberately positioned
// away from that panel (bottom-right vs. top-right) since both can be
// visible at the same time.
export default function ViolationHostPopup({ roomCode }) {
  const { violations, dismiss, mute, remove } = useHostViolations(roomCode, true);

  if (violations.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-3">
      {violations.map((violation) => {
        const isSerious = violation.severity === 'high' || violation.severity === 'critical';
        return (
          <div
            key={violation.violationId}
            className="rounded-lg border border-red-500/30 bg-slate-900/95 p-4 shadow-xl backdrop-blur-sm"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-red-400">
              🚨 Safety Violation
            </p>
            <p className="mt-2 text-sm font-medium text-slate-100">{violation.participantName}</p>
            <p className="text-sm text-slate-300">{TYPE_LABELS[violation.type] || 'Violation detected'}</p>
            <p className="mt-1 text-xs text-slate-400">
              Severity: {SEVERITY_LABEL[violation.severity] || violation.severity}
            </p>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => dismiss(violation.violationId)}>
                Dismiss
              </Button>
              {isSerious && (
                <>
                  <Button size="sm" className="flex-1" onClick={() => mute(violation.violationId)}>
                    Mute
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => remove(violation.violationId)}>
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
