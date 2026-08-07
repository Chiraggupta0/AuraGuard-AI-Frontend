import Button from '@/components/ui/Button';

export default function MeetingToolbar({ onInvite, onEnd }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={onInvite}>Invite</Button>
      <Button onClick={onEnd}>End Meeting</Button>
    </div>
  );
}
