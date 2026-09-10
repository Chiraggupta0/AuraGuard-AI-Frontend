import { useCallback, useEffect, useState } from 'react';
import socket, { connectViolationSocket } from './violationSocket';
import { muteViolatingParticipant, removeViolatingParticipant } from './violationApi';

// Host-side: subscribes to live confirmed violations for a room and exposes
// dismiss/mute/remove actions. `enabled` should only be true once the
// caller has confirmed (via the backend-computed `isHost` flag already used
// by the admission feature) that the current user actually hosts this room
// — the server re-verifies that independently against room.hostId on every
// action regardless.
export default function useHostViolations(roomCode, enabled) {
  const [violations, setViolations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled || !roomCode) return undefined;

    let cancelled = false;

    const upsert = (violation) => {
      setViolations((prev) => {
        const exists = prev.some((v) => v.violationId === violation.violationId);
        if (exists) return prev.map((v) => (v.violationId === violation.violationId ? violation : v));
        return [...prev, violation];
      });
    };

    const onDetected = (violation) => upsert(violation);
    const onUpdated = (violation) => {
      // A dismissed (hostAcknowledged) or actioned (muted/removed) violation
      // no longer needs a visible card.
      if (violation.hostAcknowledged || violation.actionTaken) {
        setViolations((prev) => prev.filter((v) => v.violationId !== violation.violationId));
      } else {
        upsert(violation);
      }
    };

    connectViolationSocket()
      .then((sock) => {
        if (cancelled) return;
        sock.on('violation_detected', onDetected);
        sock.on('violation_updated', onUpdated);
        sock.emit('host:subscribe', { roomCode }, (res) => {
          if (cancelled) return;
          if (res?.ok) {
            // Server already excludes acknowledged/actioned violations from
            // `active` (see violationEngine.service.js#listActive).
            setViolations(res.active || []);
          } else {
            setError(res?.message || 'Failed to subscribe for violation alerts');
          }
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to connect');
      });

    return () => {
      cancelled = true;
      socket.off('violation_detected', onDetected);
      socket.off('violation_updated', onUpdated);
    };
  }, [roomCode, enabled]);

  const dismiss = useCallback(
    (violationId) =>
      new Promise((resolve) => {
        socket.emit('dismiss_violation', { roomCode, violationId }, (res) => {
          if (!res?.ok) setError(res?.message || 'Failed to dismiss');
          resolve(res);
        });
      }),
    [roomCode]
  );

  const removeFromList = (violationId) => {
    setViolations((prev) => prev.filter((v) => v.violationId !== violationId));
  };

  const mute = useCallback(
    async (violationId) => {
      try {
        await muteViolatingParticipant(roomCode, violationId);
        removeFromList(violationId);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to mute participant');
      }
    },
    [roomCode]
  );

  const remove = useCallback(
    async (violationId) => {
      try {
        await removeViolatingParticipant(roomCode, violationId);
        removeFromList(violationId);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to remove participant');
      }
    },
    [roomCode]
  );

  return { violations, dismiss, mute, remove, error };
}
