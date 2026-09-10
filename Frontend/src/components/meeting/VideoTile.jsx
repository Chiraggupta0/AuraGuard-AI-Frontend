import { useEffect, useRef } from 'react';
import { Track } from 'livekit-client';

export default function VideoTile({ participant, isLocal = false, onVideoElementReady = null }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Both local and remote participants expose their media the same way, via
  // `videoTrackPublications` / `audioTrackPublications`. A publication's `.track`
  // is populated once the track is subscribed, so this covers remote too.
  // (There is no `videoTrackSubscriptions` in livekit-client — reading it always
  // yielded undefined, which is why remote tiles stayed on the placeholder.)
  //
  // Once screen sharing publishes a second video track for the same
  // participant, "just take whichever is first" stops being safe — this tile
  // must always show the camera, never the screen share (that has its own
  // ScreenShareTile). Preferring `preferredSource` and falling back to the
  // first available track keeps today's single-track behavior byte-for-byte
  // identical while disambiguating once a second track exists.
  const preferredTrack = (publications, preferredSource) => {
    if (!publications || publications.size === 0) return null;
    let fallback = null;
    for (const publication of publications.values()) {
      if (!publication?.track) continue;
      if (!fallback) fallback = publication.track;
      if (publication.source === preferredSource) return publication.track;
    }
    return fallback;
  };

  const videoTrack = (() => {
    if (!participant) {
      console.log('[VIDEO] No participant');
      return null;
    }

    const pubs = participant.videoTrackPublications;
    const track = preferredTrack(pubs, Track.Source.Camera);

    console.log('[VIDEO] Video track lookup:', {
      identity: participant.identity,
      isLocal,
      publications: pubs?.size || 0,
      found: !!track,
      trackSid: track?.sid,
    });

    return track;
  })();

  // Attach/detach video track to the video element
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoTrack) {
      if (!videoTrack && !isLocal) {
        console.log('[Remote VideoTile] Skipping attach - no track available');
      }
      return;
    }

    try {
      const logPrefix = isLocal ? '[VIDEO]' : '[VIDEO]';
      console.log(`${logPrefix} Attaching track:`, {
        trackSid: videoTrack.sid,
        isLocal,
        participantIdentity: participant?.identity,
      });

      videoTrack.attach(videoElement);

      // Hand the already-attached element to a caller that wants to read
      // frames from it (e.g. vision frame sampling) — same element LiveKit
      // is already rendering into, no second stream involved.
      if (isLocal && onVideoElementReady) onVideoElementReady(videoElement);

      // Log dimensions after attachment
      setTimeout(() => {
        console.log(`${logPrefix} Track attached - video element state:`, {
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          clientWidth: videoElement.clientWidth,
          clientHeight: videoElement.clientHeight,
          paused: videoElement.paused,
          readyState: videoElement.readyState,
        });
      }, 100);

      return () => {
        try {
          // Detach only from this element — the bare call detaches everywhere.
          videoTrack.detach(videoElement);
          console.log(`${logPrefix} Track detached:`, videoTrack.sid);
        } catch (err) {
          console.error(`${logPrefix} Error detaching track:`, err);
        }
        if (isLocal && onVideoElementReady) onVideoElementReady(null);
      };
    } catch (err) {
      console.error('[VIDEO] Error attaching track:', err);
    }
    // onVideoElementReady is intentionally omitted: it's a stable callback from
    // the parent and including it risks re-running this delicate attach effect
    // on unrelated parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoTrack, participant?.identity, isLocal]);

  // Audio for remote participants only — never play back your own mic.
  const audioTrack = (() => {
    if (isLocal || !participant) return null;
    const track = preferredTrack(participant.audioTrackPublications, Track.Source.Microphone);
    console.log('[VIDEO] Remote audio track:', {
      identity: participant.identity,
      found: !!track,
    });
    return track;
  })();

  // Attach/detach audio track
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !audioTrack) return;

    try {
      audioTrack.attach(audioElement);
      return () => {
        try {
          audioTrack.detach(audioElement);
        } catch (err) {
          console.error('[VIDEO] Error detaching audio:', err);
        }
      };
    } catch (err) {
      console.error('[VideoTile] Error attaching audio:', err);
    }
  }, [audioTrack]);

  // The server encodes the display name in the participant's metadata (the SDK in
  // use cannot set `name`), so read metadata first and fall back to identity.
  const participantName = (() => {
    if (!participant) return 'Participant';

    const fromName = participant.name?.trim();
    if (fromName) return fromName;

    if (participant.metadata) {
      try {
        const parsed = JSON.parse(participant.metadata);
        const label = parsed?.displayName?.trim() || parsed?.email?.trim();
        if (label) return label;
      } catch {
        // Metadata isn't guaranteed to be JSON — fall through to identity.
      }
    }

    return participant.identity || 'Participant';
  })();

  const label = isLocal ? `You (${participantName})` : participantName;
  const showPlaceholder = !isLocal && !videoTrack;

  return (
    // Outer cell: fills whatever box the grid/flex layout hands this tile —
    // that sizing is handled upstream (VideoGrid) and is intentionally left
    // alone here. This wrapper's only job is to CENTER a properly-proportioned
    // video frame inside that space, so an oddly-shaped cell (e.g. very wide
    // and short, which is what a single full-width participant gets on a
    // normal laptop) no longer forces the camera image itself into that same
    // odd shape.
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950">
      {/* The actual video frame: a normal 16:9 box, sized as large as
          possible while fitting BOTH the available width and height —
          `aspect-video` fixes the ratio, `h-full` is the preferred sizing
          axis, and `max-w-full` clamps it back down (recomputing height to
          match) if the cell is narrow rather than short. `object-fit: cover`
          on the <video> below now crops within a correctly-shaped frame
          instead of an arbitrary container shape, so framing looks natural
          instead of zoomed. */}
      <div className="relative aspect-video h-full max-w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        {/* Always render video element for live video */}
        <video
          ref={videoRef}
          autoPlay={true}
          muted={isLocal}
          playsInline={true}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#0f172a',
          }}
          onPlay={() => {
            console.log('[VideoTile] Video playing');
          }}
          onError={(e) => {
            console.error('[VideoTile] Video error:', e);
          }}
        />

        {/* Audio for remote participants */}
        {!isLocal && <audio ref={audioRef} autoPlay />}

        {/* Placeholder only when no video available */}
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-auraguard-400 to-auraguard-600 flex items-center justify-center text-white font-bold text-lg">
                {participantName.charAt(0).toUpperCase()}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-200">{participantName}</p>
              <p className="mt-1 text-xs text-slate-400">Camera off</p>
            </div>
          </div>
        )}

        {/* Participant label */}
        <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-slate-100">
          {label}
        </div>
      </div>
    </div>
  );
}
