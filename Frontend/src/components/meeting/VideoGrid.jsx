import { useMemo } from 'react';
import { Track } from 'livekit-client';
import VideoTile from './VideoTile';
import ScreenShareTile from './ScreenShareTile';

// `localScreenSharing` doesn't feed displayParticipants directly — it exists
// purely so this memo recomputes when the LOCAL user's screen-share track is
// published/unpublished. Toggling it doesn't change `room.localParticipant`'s
// reference or the `remoteParticipants` array, so without this dependency the
// grid would not notice a local screen share until something else re-rendered it.
export default function VideoGrid({
  remoteParticipants = [],
  room = null,
  localScreenSharing = false,
  onLocalVideoElement = null,
}) {
  // Combine local participant + remote participants
  const displayParticipants = useMemo(() => {
    const allParticipants = [];

    console.log('[VIDEO] Building display participants');
    console.log('[VIDEO] Local participant exists:', !!room?.localParticipant);
    console.log('[VIDEO] Remote participants count:', remoteParticipants?.length || 0);

    // Wrap participants rather than spreading them: spreading a LiveKit
    // participant drops its prototype (and therefore its methods), leaving a
    // lookalike object that quietly misbehaves.
    if (room?.localParticipant) {
      allParticipants.push({
        participant: room.localParticipant,
        isLocal: true,
      });
      console.log('[VIDEO] Added local participant');
    }

    if (remoteParticipants && remoteParticipants.length > 0) {
      remoteParticipants.forEach((p) => {
        console.log('[VIDEO] Adding remote participant:', {
          identity: p.identity,
          name: p.name,
          videoPublications: p.videoTrackPublications?.size || 0,
        });
        allParticipants.push({
          participant: p,
          isLocal: false,
        });
      });
    }

    console.log('[VIDEO] Total display participants:', allParticipants.length);
    return allParticipants.slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- localScreenSharing is a recompute trigger, not a value read in the body
  }, [remoteParticipants, room?.localParticipant, localScreenSharing]);

  // Find the (at most one, by convention) active screen share among the
  // participants already being displayed. Remote screen-share publish/stop
  // already flows through the existing TrackSubscribed/Unsubscribed
  // listeners in MeetingRoom, which refresh `remoteParticipants` and in turn
  // this memo.
  const screenShareEntry = useMemo(() => {
    for (const { participant, isLocal } of displayParticipants) {
      const pubs = participant.videoTrackPublications;
      if (!pubs) continue;
      for (const pub of pubs.values()) {
        if (pub.source === Track.Source.ScreenShare && pub.track) {
          return { participant, isLocal };
        }
      }
    }
    return null;
  }, [displayParticipants]);

  const gridColsClass = useMemo(() => {
    const map = {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-2',
      5: 'lg:grid-cols-3',
      6: 'lg:grid-cols-3',
    };
    return map[displayParticipants.length] || 'lg:grid-cols-2';
  }, [displayParticipants.length]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {screenShareEntry && (
        <div className="flex-1 min-h-0">
          <ScreenShareTile participant={screenShareEntry.participant} isLocal={screenShareEntry.isLocal} />
        </div>
      )}

      <div className={screenShareEntry ? 'h-32 sm:h-40 flex-shrink-0' : 'flex-1 min-h-0'}>
        {displayParticipants.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-center">
              <p className="text-slate-400">Waiting for participants...</p>
            </div>
          </div>
        ) : screenShareEntry ? (
          // Shrunk strip while a screen share is active: fixed-width thumbnails
          // that scroll horizontally, sized to fit `h-32`/`h-40` directly.
          <div className="flex h-full gap-3 overflow-x-auto pb-1">
            {displayParticipants.map(({ participant, isLocal }) => (
              <div
                key={`${isLocal ? 'local' : 'remote'}-${participant.identity}`}
                className="h-full w-32 sm:w-40 flex-shrink-0"
              >
                <VideoTile
                  participant={participant}
                  isLocal={isLocal}
                  onVideoElementReady={isLocal ? onLocalVideoElement : null}
                />
              </div>
            ))}
          </div>
        ) : (
          // Full-height grid. `auto-rows-fr` (grid-auto-rows: minmax(0, 1fr))
          // makes every row share the container's actual height and shrink to
          // fit it, so the grid itself always stays within the viewport.
          // Each cell can end up an odd shape (e.g. very wide and short with
          // a single participant) — VideoTile no longer stretches its video
          // to fill that shape; it centers a proper 16:9 frame inside it
          // instead, so the cell's own background/rounding is unused here
          // (VideoTile draws its own frame) and `min-h-0` just lets the cell
          // shrink to whatever the grid track actually gives it.
          <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 auto-rows-fr ${gridColsClass} h-full`}>
            {displayParticipants.map(({ participant, isLocal }) => (
              <div key={`${isLocal ? 'local' : 'remote'}-${participant.identity}`} className="min-h-0">
                <VideoTile
                  participant={participant}
                  isLocal={isLocal}
                  onVideoElementReady={isLocal ? onLocalVideoElement : null}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
