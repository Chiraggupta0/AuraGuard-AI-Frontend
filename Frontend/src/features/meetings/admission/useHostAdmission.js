import { useCallback, useEffect, useState } from 'react';
import socket, { connectAdmissionSocket } from './admissionSocket';

// Host-side: subscribes to live join requests for a room and exposes
// admit/reject actions. `enabled` should only be true once the caller has
// confirmed (via the backend-computed `isHost` flag) that the current user
// actually hosts this room — the socket layer re-verifies that independently
// against room.hostId on every event regardless.
export default function useHostAdmission(roomCode, enabled) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled || !roomCode) return undefined;

    let cancelled = false;

    const onReceived = (request) => {
      setPendingRequests((prev) =>
        prev.some((r) => r.requestId === request.requestId) ? prev : [...prev, request]
      );
    };

    connectAdmissionSocket()
      .then((sock) => {
        if (cancelled) return;

        sock.on('join_request_received', onReceived);
        sock.emit('host:subscribe', { roomCode }, (res) => {
          if (cancelled) return;
          if (res?.ok) {
            setPendingRequests(res.pending || []);
          } else {
            setError(res?.message || 'Failed to subscribe for join requests');
          }
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to connect');
      });

    return () => {
      cancelled = true;
      socket.off('join_request_received', onReceived);
    };
  }, [roomCode, enabled]);

  const removeFromList = (requestId) => {
    setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  const admit = useCallback(
    (requestId) =>
      new Promise((resolve) => {
        socket.emit('admit_participant', { roomCode, requestId }, (res) => {
          if (res?.ok) removeFromList(requestId);
          else setError(res?.message || 'Failed to admit participant');
          resolve(res);
        });
      }),
    [roomCode]
  );

  const reject = useCallback(
    (requestId) =>
      new Promise((resolve) => {
        socket.emit('reject_participant', { roomCode, requestId }, (res) => {
          if (res?.ok) removeFromList(requestId);
          else setError(res?.message || 'Failed to reject participant');
          resolve(res);
        });
      }),
    [roomCode]
  );

  return { pendingRequests, admit, reject, error };
}
