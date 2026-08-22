import { useState, useEffect } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiLogOut, FiMessageSquare, FiMonitor } from 'react-icons/fi';
import Button from '@/components/ui/Button';

export default function MeetingControls({
  room,
  onLeave,
  chatOpen = false,
  onToggleChat,
  unreadChatCount = 0,
  isScreenSharing = false,
  onToggleScreenShare,
}) {
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);

  const localParticipant = room?.localParticipant;

  // Sync button state with actual track state
  useEffect(() => {
    if (!localParticipant) return;

    const updateTrackStates = () => {
      // Check video tracks
      const videoTracks = localParticipant.videoTrackPublications;
      if (videoTracks && videoTracks.size > 0) {
        const pub = Array.from(videoTracks.values())[0];
        const videoTrack = pub?.track;
        const isCameraOn = videoTrack && !videoTrack.isMuted;
        setIsCameraEnabled(isCameraOn);
        console.log('[VIDEO] Camera state:', { enabled: isCameraOn });
      } else {
        setIsCameraEnabled(false);
      }

      // Check audio tracks
      const audioTracks = localParticipant.audioTrackPublications;
      if (audioTracks && audioTracks.size > 0) {
        const pub = Array.from(audioTracks.values())[0];
        const audioTrack = pub?.track;
        const isMicOn = audioTrack && !audioTrack.isMuted;
        setIsMicEnabled(isMicOn);
        console.log('[VIDEO] Microphone state:', { enabled: isMicOn });
      } else {
        setIsMicEnabled(false);
      }
    };

    updateTrackStates();

    const handleTrackChange = () => {
      console.log('[VIDEO] Track state changed');
      updateTrackStates();
    };

    localParticipant.on('trackMuted', handleTrackChange);
    localParticipant.on('trackUnmuted', handleTrackChange);
    localParticipant.on('trackPublished', handleTrackChange);

    return () => {
      localParticipant.off('trackMuted', handleTrackChange);
      localParticipant.off('trackUnmuted', handleTrackChange);
      localParticipant.off('trackPublished', handleTrackChange);
    };
  }, [localParticipant]);

  const handleToggleMic = async () => {
    if (!localParticipant || typeof localParticipant.setMicrophoneEnabled !== 'function') {
      console.warn('[VIDEO] Microphone toggle unavailable');
      return;
    }

    try {
      const newState = !isMicEnabled;
      console.log('[VIDEO] Toggling microphone to:', newState);
      await localParticipant.setMicrophoneEnabled(newState);
    } catch (err) {
      console.error('[VIDEO] Error toggling microphone:', err);
    }
  };

  const handleToggleCamera = async () => {
    if (!localParticipant || typeof localParticipant.setCameraEnabled !== 'function') {
      console.warn('[VIDEO] Camera toggle unavailable');
      return;
    }

    try {
      const newState = !isCameraEnabled;
      console.log('[VIDEO] Toggling camera to:', newState);
      await localParticipant.setCameraEnabled(newState);
    } catch (err) {
      console.error('[VIDEO] Error toggling camera:', err);
    }
  };

  const handleLeave = () => {
    onLeave?.();
  };

  return (
    <div className="flex items-center justify-center gap-4 bg-slate-900/50 backdrop-blur-sm p-4 rounded-lg border border-slate-800">
      <Button
        variant={isMicEnabled ? 'primary' : 'danger'}
        size="sm"
        onClick={handleToggleMic}
        className="gap-2"
      >
        {isMicEnabled ? (
          <>
            <FiMic className="h-5 w-5" />
            Mic On
          </>
        ) : (
          <>
            <FiMicOff className="h-5 w-5" />
            Mic Off
          </>
        )}
      </Button>

      <Button
        variant={isCameraEnabled ? 'primary' : 'danger'}
        size="sm"
        onClick={handleToggleCamera}
        className="gap-2"
      >
        {isCameraEnabled ? (
          <>
            <FiVideo className="h-5 w-5" />
            Camera On
          </>
        ) : (
          <>
            <FiVideoOff className="h-5 w-5" />
            Camera Off
          </>
        )}
      </Button>

      {/* Chat and Screen Share are plain <button>s rather than the shared
          Button component: Button's variants were updated to bright/light
          colors for the rest of the app, and mergeClassNames is a plain
          string join (no Tailwind-merge dedup), so a className override here
          could not reliably win the cascade against variant's own bg-*
          classes. Styling directly avoids that risk and keeps these two
          consistent with the meeting bar's dark surface. */}
      {onToggleScreenShare && (
        <button
          type="button"
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing your screen' : 'Share your screen'}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-auraguard-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            isScreenSharing
              ? 'bg-auraguard-500 text-white hover:bg-auraguard-600 active:bg-auraguard-700 shadow-lg shadow-auraguard-500/20'
              : 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 hover:border-slate-600'
          }`}
        >
          <FiMonitor className="h-5 w-5" />
          <span className="hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
        </button>
      )}

      {onToggleChat && (
        <button
          type="button"
          onClick={onToggleChat}
          title="Chat"
          className={`relative inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-auraguard-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            chatOpen
              ? 'bg-auraguard-500 text-white hover:bg-auraguard-600 active:bg-auraguard-700 shadow-lg shadow-auraguard-500/20'
              : 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 hover:border-slate-600'
          }`}
        >
          <FiMessageSquare className="h-5 w-5" />
          <span className="hidden sm:inline">Chat</span>
          {unreadChatCount > 0 && !chatOpen && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>
      )}

      <Button variant="danger" size="sm" onClick={handleLeave} className="gap-2">
        <FiLogOut className="h-5 w-5" />
        Leave
      </Button>
    </div>
  );
}
