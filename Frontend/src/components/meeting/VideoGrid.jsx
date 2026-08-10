import { useMemo } from 'react';
import VideoTile from './VideoTile';

export default function VideoGrid({ remoteParticipants = [], room = null }) {
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
  }, [remoteParticipants, room?.localParticipant]);

  const gridColsClass = useMemo(() => {
    const map = {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-2 lg:auto-rows-auto',
      5: 'lg:grid-cols-3',
      6: 'lg:grid-cols-3',
    };
    return map[displayParticipants.length] || 'lg:grid-cols-2';
  }, [displayParticipants.length]);

  return (
    <div className="w-full h-full">
      {displayParticipants.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-center">
            <p className="text-slate-400">Waiting for participants...</p>
          </div>
        </div>
      ) : (
        <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 ${gridColsClass} h-full`}>
          {displayParticipants.map(({ participant, isLocal }) => (
            <div
              key={`${isLocal ? 'local' : 'remote'}-${participant.identity}`}
              className="aspect-video rounded-lg overflow-hidden bg-slate-900"
              style={{ minHeight: '300px' }}
            >
              <VideoTile participant={participant} isLocal={isLocal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
