import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent } from 'livekit-client';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { VideoGrid, MeetingControls, ChatPanel } from '@/components/meeting';
import Button from '@/components/ui/Button';
import ROUTES from '@/constants/routes.constants';
import useAuth from '@/hooks/useAuth';
import { joinRoom, validateRoom } from '@/services/roomApi';
import useLiveKitChat from '@/hooks/useLiveKitChat';
import useScreenShare from '@/hooks/useScreenShare';
import useVisionDetection from '@/hooks/useVisionDetection';
import useSpeechCapture from '@/hooks/useSpeechCapture';
import useJoinAdmission from '@/features/meetings/admission/useJoinAdmission';
import JoinRequestPanel from '@/features/meetings/admission/JoinRequestPanel';
import WaitingRoomScreen from '@/features/meetings/admission/WaitingRoomScreen';

export default function MeetingRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user, isAuthLoading } = useAuth();
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [roomConnected, setRoomConnected] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [lastReadChatCount, setLastReadChatCount] = useState(0);
  const roomRef = useRef(null);

  // Host-based admission gate. `isHost` is null while we don't know yet
  // (backend-computed via GET /rooms/validate/:roomCode — never trusted from
  // client state), then true/false. Non-hosts request admission and wait for
  // the host's realtime decision before ever connecting to LiveKit; the host
  // connects immediately, same as before this feature existed.
  const [isHost, setIsHost] = useState(null);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const { status: admissionStatus, error: admissionError } = useJoinAdmission(
    roomName,
    displayName,
    isHost === false
  );
  const readyToConnect = isHost === true || (isHost === false && admissionStatus === 'approved');

  useEffect(() => {
    if (isAuthLoading || !user) return undefined;
    let cancelled = false;

    validateRoom(roomName)
      .then((room) => {
        if (!cancelled) setIsHost(Boolean(room?.isHost));
      })
      .catch((err) => {
        if (cancelled) return;
        const errorMessage = err.response?.data?.message || err.message || 'Room not found';
        setError(errorMessage);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomName, user, isAuthLoading]);

  // These read roomRef.current at render time, same pattern VideoGrid/
  // MeetingControls already use below — a state setter inside the connect
  // effect triggers the re-render that lets them pick up the real Room
  // instance once it exists. Neither touches the guarded connect effect.
  const { messages: chatMessages, sendMessage: sendChatMessage } = useLiveKitChat(roomRef.current);
  const { isSharing: isScreenSharing, toggle: toggleScreenShare, error: screenShareError } =
    useScreenShare(roomRef.current);

  // Holds the SAME <video> DOM node VideoTile already attaches the local
  // LiveKit camera track to (see VideoTile's onVideoElementReady) — no
  // second camera stream, no second getUserMedia call.
  const localVideoElRef = useRef(null);
  const handleLocalVideoElement = useCallback((videoElement) => {
    localVideoElRef.current = videoElement;
  }, []);
  const { result: visionResult } = useVisionDetection(localVideoElRef, { enabled: roomConnected });

  useEffect(() => {
    if (chatOpen) setLastReadChatCount(chatMessages.length);
  }, [chatOpen, chatMessages.length]);

  const unreadChatCount = chatOpen ? 0 : Math.max(0, chatMessages.length - lastReadChatCount);
  const handleToggleChat = () => setChatOpen((prev) => !prev);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate(ROUTES.login, { replace: true });
      return;
    }
    // Host connects immediately (isHost === true); a participant only reaches
    // this point once useJoinAdmission reports 'approved'. Everyone else
    // (still checking host status, or waiting/rejected) renders
    // WaitingRoomScreen instead — see the early return in the JSX below.
    if (!readyToConnect) return;

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
  }, [roomName, user, isAuthLoading, navigate, readyToConnect]);

  // Phase 4 — speech pipeline. Reads the EXISTING LiveKit mic track that the
  // effect above already published; captures no new media of its own, and
  // any failure here is caught internally and logged, never thrown, so it
  // can't disconnect the meeting or affect video.
  useSpeechCapture(roomRef.current, {
    meetingId: roomName,
    userId: user?.uid,
    enabled: roomConnected,
  });

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

  // Not the host, and not yet approved: never connects to LiveKit — shows
  // the waiting/rejected state instead. isHost === null (still checking)
  // falls through to the isLoading spinner below, same as before.
  if (isHost === false && admissionStatus !== 'approved') {
    return <WaitingRoomScreen status={admissionStatus} error={admissionError} />;
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
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {isHost && <JoinRequestPanel roomCode={roomName} />}
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

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <VideoGrid
              remoteParticipants={remoteParticipants}
              room={roomRef.current}
              localScreenSharing={isScreenSharing}
              onLocalVideoElement={handleLocalVideoElement}
            />
          </div>

          {screenShareError && <p className="text-center text-xs text-red-400">{screenShareError}</p>}

          <MeetingControls
            room={roomRef.current}
            onLeave={handleLeave}
            chatOpen={chatOpen}
            onToggleChat={handleToggleChat}
            unreadChatCount={unreadChatCount}
            isScreenSharing={isScreenSharing}
            onToggleScreenShare={toggleScreenShare}
          />
        </div>

        <ChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          onSendMessage={sendChatMessage}
        />
      </div>

      <div className="border-t border-slate-800 bg-slate-900/30 p-4">
        <p className="text-xs text-slate-500">
          🔮 <span className="font-semibold">AI Moderator Panel</span> - Coming soon
        </p>
        {/* TEMPORARY debug indicator for the LiveKit -> Python /detect proof of
            concept — not the real moderation UI. Safe to remove once the
            violation engine phase replaces it. */}
        {visionResult && (
          <p className="mt-1 text-xs text-slate-500">
            [VISION debug] persons: {visionResult.detections?.personCount ?? '—'} · phone:{' '}
            {visionResult.detections?.phoneDetected ? 'YES' : 'NO'}
          </p>
        )}
      </div>
    </div>
  );
}
