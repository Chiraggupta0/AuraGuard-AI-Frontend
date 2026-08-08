import { Link } from 'react-router-dom';
import { Button, EmptyState, PageHeader } from '@/components';
import ROUTES from '@/constants/routes.constants';

export default function CreateRoomPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Meetings" title="Create Room" description="Placeholder room creation screen for future meeting setup flows." />
      <EmptyState
        title="Room creation is coming next"
        description="The layout is ready, but actual room creation logic will be added later."
      />
      <div className="flex justify-center">
        <Button as={Link} to={ROUTES.dashboard} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}