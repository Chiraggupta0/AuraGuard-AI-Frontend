import { useState, useEffect } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiLogOut } from 'react-icons/fi';
import Button from '@/components/ui/Button';

export default function MeetingControls({ room, onLeave }) {
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

      <Button variant="danger" size="sm" onClick={handleLeave} className="gap-2">
        <FiLogOut className="h-5 w-5" />
        Leave
      </Button>
    </div>
  );
}
