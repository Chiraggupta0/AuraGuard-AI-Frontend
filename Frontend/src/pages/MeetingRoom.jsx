import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent } from 'livekit-client';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { VideoGrid, MeetingControls } from '@/components/meeting';
import Button from '@/components/ui/Button';
import ROUTES from '@/constants/routes.constants';
import useAuth from '@/hooks/useAuth';
import { joinRoom } from '@/services/roomApi';

export default function MeetingRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user, isAuthLoading } = useAuth();
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [roomConnected, setRoomConnected] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const roomRef = useRef(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate(ROUTES.login, { replace: true });
      return;
    }

    // React StrictMode runs effects twice in development. Without these guards the
    // first run's connection is orphaned (cleanup fires while the async connect is
    // still in flight), and the page then sees its own second connection as a
    // remote participant — the empty "?" tile.
    let cancelled = false;
    let room = null;

    const connectToRoom = async () => {
      try {
        setIsLoading(true);
        const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guest';

        console.log('[ROOM] Joining room:', roomName);
        console.log('[LIVEKIT] Requesting token...');

        const data = await joinRoom(roomName, displayName);

        if (cancelled) return;

        console.log('[LIVEKIT] Token received');

        if (!data?.token || !data?.serverUrl) {
          throw new Error('Invalid token response: missing token or serverUrl');
        }

        room = new Room();
        roomRef.current = room;

        // Initialize participants from existing remote participants
        const initializeRemoteParticipants = () => {
          const remotes = Array.from(room.remoteParticipants.values());
          console.log('[ROOM] Initializing with remote participants:', remotes.length);
          setRemoteParticipants(remotes);
        };

        // Helper to update remote participants
        const updateRemoteParticipants = () => {
          const remotes = Array.from(room.remoteParticipants.values());
          console.log('[ROOM] Remote participants updated:', {
            count: remotes.length,
            identities: remotes.map((p) => p.identity),
          });
          setRemoteParticipants(remotes);
        };

        // Local participant connected
        room.on(RoomEvent.LocalParticipantConnected, () => {
          console.log('[LIVEKIT] Local participant connected:', {
            identity: room.localParticipant.identity,
          });
          setRoomConnected(true);
        });

        // Remote participant connected
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('[ROOM] Remote participant connected:', {
            identity: participant.identity,
            name: participant.name,
          });
          updateRemoteParticipants();
        });

        // Remote participant disconnected
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('[ROOM] Remote participant disconnected:', {
            identity: participant.identity,
          });
          updateRemoteParticipants();
        });

        // Track subscribed
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log('[VIDEO] Track subscribed:', {
            kind: track.kind,
            participantIdentity: participant.identity,
            trackSid: track.sid,
          });
          updateRemoteParticipants();
        });

        // Keep remote tiles honest when the other side stops or toggles a track.
        room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          console.log('[VIDEO] Track unsubscribed:', {
            kind: track.kind,
            participantIdentity: participant.identity,
          });
          updateRemoteParticipants();
        });

        room.on(RoomEvent.TrackMuted, () => updateRemoteParticipants());
        room.on(RoomEvent.TrackUnmuted, () => updateRemoteParticipants());

        // Room disconnected. Ignore when we tore the connection down ourselves,
        // otherwise StrictMode's cleanup would bounce the user to the dashboard.
        room.on(RoomEvent.Disconnected, () => {
          if (cancelled) return;
          console.log('[LIVEKIT] Disconnected from room');
          handleLeave();
        });

        // Connection lost
        room.on(RoomEvent.ConnectionLost, () => {
          console.warn('[LIVEKIT] Connection lost');
          setError('Connection lost. Please refresh and try again.');
        });

        console.log('[LIVEKIT] Connecting to LiveKit server...');
        console.log('[LIVEKIT] Application room:', roomName);

        await room.connect(data.serverUrl, data.token, {
          autoSubscribe: true,
        });

        // Cleanup may have run while connect() was in flight.
        if (cancelled) {
          room.disconnect();
          return;
        }

        console.log('[LIVEKIT] Successfully connected to LiveKit room');

        // Initialize participants from existing ones
        initializeRemoteParticipants();

        // Enable camera
        console.log('[VIDEO] Requesting camera...');
        try {
          await room.localParticipant.setCameraEnabled(true);
          console.log('[VIDEO] Local camera enabled');
        } catch (cameraErr) {
          console.warn('[VIDEO] Camera error:', cameraErr.message);
          setError(`Camera error: ${cameraErr.message}`);
        }

        // Enable microphone
        console.log('[VIDEO] Requesting microphone...');
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          console.log('[VIDEO] Local microphone enabled');
        } catch (micErr) {
          console.warn('[VIDEO] Microphone error:', micErr.message);
          setError(`Microphone error: ${micErr.message}`);
        }

        console.log('[LIVEKIT] Local participant ready');
        setRoomConnected(true);
        setError('');
      } catch (err) {
        if (cancelled) return;
        console.error('[ROOM] Join room error:', err.message);
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to join room. Please try again.';
        setError(errorMessage);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    connectToRoom();

    return () => {
      cancelled = true;
      // Disconnect the room this effect run created — not roomRef.current, which a
      // later run may have already replaced.
      if (room) {
        try {
          console.log('[LIVEKIT] Disconnecting from room...');
          room.disconnect();
        } catch (err) {
          console.error('[LIVEKIT] Error disconnecting:', err);
        }
      }
      if (roomRef.current === room) {
        roomRef.current = null;
      }
    };
  }, [roomName, user, isAuthLoading, navigate]);

  const handleLeave = async () => {
    console.log('[LIVEKIT] Leaving room...');
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch (err) {
        console.error('[LIVEKIT] Error disconnecting:', err);
      }
    }
    navigate(ROUTES.dashboard, { replace: true });
  };

  const handleCopyRoomName = () => {
    navigator.clipboard.writeText(roomName);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  if (isAuthLoading) return null;

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-auraguard-500 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-300">Joining room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-400">Failed to Join Room</h2>
          <p className="mt-2 text-sm text-red-300">{error}</p>
          <Button className="mt-4 w-full" onClick={() => navigate(ROUTES.dashboard, { replace: true })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">AuraGuard Live</h1>
            <p className="text-sm text-slate-400">Room: {roomName}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyRoomName}
            className="gap-2"
          >
            {copiedToClipboard ? (
              <>
                <FiCheck className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <FiCopy className="h-4 w-4" />
                Copy Room Code
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        <div className="flex-1 min-h-0">
          <VideoGrid remoteParticipants={remoteParticipants} room={roomRef.current} />
        </div>

        <MeetingControls room={roomRef.current} onLeave={handleLeave} />
      </div>

      <div className="border-t border-slate-800 bg-slate-900/30 p-4">
        <p className="text-xs text-slate-500">
          🔮 <span className="font-semibold">AI Moderator Panel</span> - Coming soon
        </p>
      </div>
    </div>
  );
}
