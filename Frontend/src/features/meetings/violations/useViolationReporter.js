import { useEffect, useRef, useState } from 'react';
import { connectViolationSocket } from './violationSocket';

// Forwards each NEW result from the EXISTING useVisionDetection.js /
// useSpeechCapture.js hooks to the backend Violation Engine — it adds no
// detection logic of its own, it only reports what those hooks already
// computed. Runs in every participant's browser (host included): the engine
// decides server-side whether a sequence of reports becomes a confirmed
// violation, and if this browser's OWN activity triggers one, the ack
// carries a warning message for this participant to see.
export default function useViolationReporter(roomCode, participantName, { visionResult, speechResult, enabled }) {
  const [warning, setWarning] = useState(null);
  const lastVisionRef = useRef(null);
  const lastSpeechRef = useRef(null);

  const report = async (source, payload) => {
    try {
      const socket = await connectViolationSocket();
      socket.emit('report_detection', { roomCode, source, participantName, ...payload }, (res) => {
        if (res?.ok && res.confirmed && res.warning) {
          setWarning({ message: res.warning, id: Date.now() });
        }
      });
    } catch {
      // Best-effort — a failed report must never affect the meeting itself
      // (video/audio/chat all keep working regardless).
    }
  };

  useEffect(() => {
    if (!enabled || !roomCode || !visionResult || visionResult === lastVisionRef.current) return;
    lastVisionRef.current = visionResult;
    report('video', { detections: visionResult.detections });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `report` is recreated each render but has no reactive deps of its own
  }, [enabled, roomCode, visionResult]);

  useEffect(() => {
    if (!enabled || !roomCode || !speechResult || speechResult === lastSpeechRef.current) return;
    lastSpeechRef.current = speechResult;
    if (speechResult.flagged) report('audio', { result: speechResult });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomCode, speechResult]);

  const dismissWarning = () => setWarning(null);

  return { warning, dismissWarning };
}
