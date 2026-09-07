import { useEffect, useRef, useState } from 'react';
import socket, { connectAdmissionSocket } from './admissionSocket';

// Participant-side: sends a join request for a room and tracks the host's
// decision in realtime. `enabled` should be true only for non-host joiners —
// the host connects to LiveKit directly and never goes through this hook.
export default function useJoinAdmission(roomCode, displayName, enabled) {
  const [status, setStatus] = useState('idle'); // idle | connecting | pending | approved | rejected | error
  const [error, setError] = useState('');
  const requestIdRef = useRef(null);

  useEffect(() => {
    if (!enabled || !roomCode) return undefined;

    let cancelled = false;
    setStatus('connecting');

    const onApproved = (payload) => {
      if (payload.requestId === requestIdRef.current) setStatus('approved');
    };
    const onRejected = (payload) => {
      if (payload.requestId === requestIdRef.current) setStatus('rejected');
    };

    connectAdmissionSocket()
      .then((sock) => {
        if (cancelled) return;

        sock.on('admission_approved', onApproved);
        sock.on('admission_rejected', onRejected);

        sock.emit('join_request', { roomCode, displayName }, (res) => {
          if (cancelled) return;
          if (res?.ok) {
            requestIdRef.current = res.requestId;
            // A duplicate "Join" click reuses the same pending request rather
            // than creating a new one, so this covers both first request and
            // an already-decided one found on (re)connect.
            setStatus(res.status === 'approved' ? 'approved' : res.status === 'rejected' ? 'rejected' : 'pending');
          } else {
            setError(res?.message || 'Failed to request admission');
            setStatus('error');
          }
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to connect');
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      socket.off('admission_approved', onApproved);
      socket.off('admission_rejected', onRejected);
    };
  }, [roomCode, displayName, enabled]);

  return { status, error };
}
