import { useEffect, useRef } from 'react';
import { Track } from 'livekit-client';
import { FiMonitor } from 'react-icons/fi';

// Renders exactly one participant's screen-share video track. Deliberately
// separate from VideoTile, which renders camera feeds — keeping them apart
// means a participant's camera tile is never at risk of accidentally
// flipping to their screen share, or vice versa.
export default function ScreenShareTile({ participant, isLocal }) {
  const videoRef = useRef(null);

  const screenTrack = (() => {
    const pubs = participant?.videoTrackPublications;
    if (!pubs) return null;
    for (const pub of pubs.values()) {
      if (pub.source === Track.Source.ScreenShare && pub.track) return pub.track;
    }
    return null;
  })();

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !screenTrack) return;

    const logPrefix = isLocal ? '[LOCAL SCREEN SHARE]' : '[REMOTE SCREEN SHARE]';

    try {
      console.log(`${logPrefix} Attaching track to preview element:`, {
        trackSid: screenTrack.sid,
        participantIdentity: participant?.identity,
      });
      screenTrack.attach(videoElement);

      return () => {
        try {
          screenTrack.detach(videoElement);
          console.log(`${logPrefix} Detached track:`, screenTrack.sid);
        } catch (err) {
          console.error(`${logPrefix} Error detaching track:`, err);
        }
      };
    } catch (err) {
      console.error(`${logPrefix} Error attaching track:`, err);
    }
  }, [screenTrack, isLocal, participant?.identity]);

  if (!screenTrack) return null;

  const presenterName = participant?.name?.trim() || participant?.identity || 'Participant';

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg border border-auraguard-500/40 bg-slate-950">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#020617',
        }}
      />
      <div className="absolute top-3 left-3 flex items-center gap-2 rounded bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-sm">
        <FiMonitor className="h-3.5 w-3.5 text-auraguard-400" />
        {isLocal ? 'You are presenting' : `${presenterName} is presenting`}
      </div>
    </div>
  );
}
