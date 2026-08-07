import Card from '@/components/ui/Card';
import ActionPanel from '../components/ActionPanel';
import ModerationQueue from '../components/ModerationQueue';

export default function ModerationPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <ModerationQueue />
      <Card>
        <ActionPanel />
      </Card>
    </div>
  );
}
