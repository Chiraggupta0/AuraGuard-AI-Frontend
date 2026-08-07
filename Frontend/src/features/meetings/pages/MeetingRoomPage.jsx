import MediaControls from '@/components/video/MediaControls';
import StreamPreview from '@/components/video/StreamPreview';
import useMeetingStream from '../streams/useMeetingStream';

export default function MeetingRoomPage() {
  const { streamStatus } = useMeetingStream();

  return (
    <div className="space-y-6">
      <StreamPreview>
        <p className="text-sm text-slate-300">Stream status: {streamStatus}</p>
      </StreamPreview>
      <MediaControls />
    </div>
  );
}
