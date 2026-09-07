import Button from '@/components/ui/Button';
import useHostAdmission from './useHostAdmission';

// Host-only floating overlay: "X wants to join" + Admit/Reject, for each
// pending request independently. Rendered by MeetingRoom.jsx only when the
// backend-confirmed host is viewing the page.
export default function JoinRequestPanel({ roomCode }) {
  const { pendingRequests, admit, reject } = useHostAdmission(roomCode, true);

  if (pendingRequests.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex w-80 flex-col gap-3">
      {pendingRequests.map((request) => (
        <div
          key={request.requestId}
          className="rounded-lg border border-slate-700 bg-slate-900/95 p-4 shadow-xl backdrop-blur-sm"
        >
          <p className="text-sm text-slate-100">
            <span className="font-semibold">{request.participantName}</span> wants to join
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{request.participantEmail}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => admit(request.requestId)}>
              Admit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => reject(request.requestId)}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
