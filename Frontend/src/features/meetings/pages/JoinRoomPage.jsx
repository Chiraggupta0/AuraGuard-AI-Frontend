import { Link } from 'react-router-dom';
import { Button, EmptyState, PageHeader } from '@/components';
import ROUTES from '@/constants/routes.constants';

export default function JoinRoomPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Meetings" title="Join Room" description="Placeholder screen for future room-code or invite-based joins." />
      <EmptyState
        title="Join flow is ready for later"
        description="This screen keeps the app ready for a simple room join form without any backend logic yet."
      />
      <div className="flex justify-center">
        <Button as={Link} to={ROUTES.dashboard} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}