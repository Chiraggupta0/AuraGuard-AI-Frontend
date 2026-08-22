import { useCallback, useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';

// Tracks whether the LOCAL participant is currently screen sharing, and
// exposes a toggle. Reads state off the actual publication rather than
// trusting a local boolean that assumes an operation succeeded.
//
// Event names, verified against the installed livekit-client source
// (LocalParticipant.publishTrack / unpublishTrack):
//   - LocalParticipant emits 'localTrackPublished' / 'localTrackUnpublished'
//     for its OWN tracks.
//   - 'trackPublished' / 'trackUnpublished' (no "local" prefix) are emitted
//     by RemoteParticipant for OTHER participants' tracks — they never fire
//     on `room.localParticipant`, which is exactly why the toggle previously
//     failed to reliably return to "Share Screen": we were listening for an
//     event that can't happen on this object.
//
// Screen share specifically is always unpublished (never muted) on stop —
// confirmed in the SDK: `setScreenShareEnabled(false)` unpublishes directly,
// and the native MediaStreamTrack 'ended' handler (fired when the user stops
// sharing from the browser's own control, not our button) does the same
// (`handleTrackEnded` calls `unpublishTrack` for Track.Source.ScreenShare).
// Both paths funnel through the same 'localTrackUnpublished' emission, so
// listening for it here covers both without any extra wiring.
export default function useScreenShare(room) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  // Distinguishes "stopped via our own button" from "stopped externally" for
  // clearer logs — both land in the same sync(), but only one was requested.
  const stoppingViaButtonRef = useRef(false);

  useEffect(() => {
    const localParticipant = room?.localParticipant;
    if (!localParticipant) return;

    const sync = () => {
      const pubs = localParticipant.videoTrackPublications;
      const publication = pubs
        ? Array.from(pubs.values()).find((pub) => pub.source === Track.Source.ScreenShare && !!pub.track)
        : undefined;
      const sharing = !!publication;

      setIsSharing((prev) => {
        if (prev === sharing) return prev;

        if (sharing) {
          console.log('[LOCAL SCREEN SHARE] Started — publication found:', {
            trackSid: publication.track.sid,
          });
        } else if (stoppingViaButtonRef.current) {
          console.log('[LOCAL SCREEN SHARE] Stopped via the Share Screen button');
        } else {
          console.log(
            '[LOCAL SCREEN SHARE] Stopped — track ended outside the app (browser/system "Stop sharing" control)',
          );
        }
        stoppingViaButtonRef.current = false;

        return sharing;
      });
    };

    sync();
    localParticipant.on('localTrackPublished', sync);
    localParticipant.on('localTrackUnpublished', sync);

    return () => {
      localParticipant.off('localTrackPublished', sync);
      localParticipant.off('localTrackUnpublished', sync);
    };
  }, [room?.localParticipant]);

  const toggle = useCallback(async () => {
    const localParticipant = room?.localParticipant;
    if (!localParticipant) return;

    setError('');

    try {
      if (isSharing) {
        console.log('[LOCAL SCREEN SHARE] Stop requested via button');
        stoppingViaButtonRef.current = true;
        await localParticipant.setScreenShareEnabled(false);
      } else {
        console.log('[LOCAL SCREEN SHARE] Requesting screen capture...');
        // No system audio — this feature is video-only screen sharing.
        await localParticipant.setScreenShareEnabled(true, { audio: false });
      }
    } catch (err) {
      // The user closing the browser's screen picker without choosing a
      // source rejects with NotAllowedError — that's a cancellation, not a
      // failure, so it shouldn't surface as an error.
      if (err?.name === 'NotAllowedError') {
        console.log('[LOCAL SCREEN SHARE] Cancelled by user (picker closed without selecting a source)');
        stoppingViaButtonRef.current = false;
        return;
      }
      console.error('[LOCAL SCREEN SHARE] Error toggling:', err);
      stoppingViaButtonRef.current = false;
      setError(err?.message || 'Failed to toggle screen share');
    }
  }, [room, isSharing]);

  return { isSharing, toggle, error };
}
