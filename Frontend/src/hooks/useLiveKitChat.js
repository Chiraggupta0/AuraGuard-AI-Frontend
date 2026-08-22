import { useCallback, useEffect, useRef, useState } from 'react';
import { RoomEvent } from 'livekit-client';

// Dedicated topic so this channel never collides with any other data traffic
// LiveKit or a future feature might send over the same room.
const CHAT_TOPIC = 'auraguard-chat';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Mirrors the name-resolution VideoTile already uses: `name` first, then the
// JSON metadata the backend encodes it in (see livekit.service.js), then identity.
const resolveParticipantName = (participant) => {
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
};

// Chat over LiveKit's data channel — no separate backend. Messages live only
// for the lifetime of the room; nothing is persisted.
export default function useLiveKitChat(room) {
  const [messages, setMessages] = useState([]);
  const seenIds = useRef(new Set());

  useEffect(() => {
    if (!room) return;

    const handleData = (payload, participant, _kind, topic) => {
      if (topic !== CHAT_TOPIC) return;

      try {
        const parsed = JSON.parse(decoder.decode(payload));
        if (!parsed?.id || !parsed?.text) return;
        if (seenIds.current.has(parsed.id)) return;
        seenIds.current.add(parsed.id);

        console.log('[CHAT] Message received:', {
          from: parsed.senderIdentity,
          id: parsed.id,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: parsed.id,
            text: parsed.text,
            senderIdentity: parsed.senderIdentity,
            senderName: participant ? resolveParticipantName(participant) : parsed.senderName,
            timestamp: parsed.timestamp || Date.now(),
            isLocal: false,
          },
        ]);
      } catch (err) {
        console.error('[CHAT] Failed to parse incoming message:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      const localParticipant = room?.localParticipant;
      if (!trimmed || !localParticipant) return;

      const id = `${localParticipant.identity}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        id,
        text: trimmed,
        senderIdentity: localParticipant.identity,
        senderName: resolveParticipantName(localParticipant),
        timestamp: Date.now(),
      };

      // Optimistic local echo — publishData does not loop the sender's own
      // packet back to them, so without this the sender would never see it.
      seenIds.current.add(id);
      setMessages((prev) => [...prev, { ...payload, isLocal: true }]);

      try {
        const encoded = encoder.encode(JSON.stringify(payload));
        await localParticipant.publishData(encoded, { reliable: true, topic: CHAT_TOPIC });
        console.log('[CHAT] Message sent:', { id });
      } catch (err) {
        console.error('[CHAT] Failed to send message:', err);
      }
    },
    [room],
  );

  return { messages, sendMessage };
}
