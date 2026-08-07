import Button from '@/components/ui/Button';

export default function MediaControls({ onMute, onCameraToggle, onLeave }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={onMute}>Mute</Button>
      <Button variant="secondary" onClick={onCameraToggle}>Toggle Camera</Button>
      <Button variant="secondary" onClick={onLeave}>Leave</Button>
    </div>
  );
}
