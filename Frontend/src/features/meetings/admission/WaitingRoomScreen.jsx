import Button from '@/components/ui/Button';
import ROUTES from '@/constants/routes.constants';
import { useNavigate } from 'react-router-dom';

// Participant-side full-screen state shown while a join request is pending,
// or after the host has rejected it. Rendered by MeetingRoom.jsx instead of
// the LiveKit UI — the participant never connects until admitted.
export default function WaitingRoomScreen({ status, error }) {
  const navigate = useNavigate();

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-400">Request Declined</h2>
          <p className="mt-2 text-sm text-red-300">
            The host did not admit you to this meeting.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate(ROUTES.dashboard, { replace: true })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-400">Unable to Request Admission</h2>
          <p className="mt-2 text-sm text-red-300">{error || 'Something went wrong. Please try again.'}</p>
          <Button className="mt-4 w-full" onClick={() => navigate(ROUTES.dashboard, { replace: true })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-auraguard-500 border-t-transparent mx-auto mb-4" />
        <p className="text-slate-300">Waiting for the host to admit you...</p>
      </div>
    </div>
  );
}
