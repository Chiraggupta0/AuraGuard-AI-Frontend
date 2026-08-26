import { useEffect, useRef, useState } from 'react';
import { captureVideoFrame } from '@/utils/captureVideoFrame';
import { detectFrame } from '@/services/visionApi';

// How often to sample a frame and send it to the Python /detect endpoint.
// Proof-of-concept only — change this single value to adjust the cadence.
const VISION_FRAME_INTERVAL_MS = 3000;

// Samples frames from an already-attached LiveKit local video element (no
// second camera stream, no getUserMedia) and posts them to the Python
// vision service. `videoElementRef` is a ref whose `.current` is kept in
// sync with the live <video> DOM node by the caller (see VideoTile's
// onVideoElementReady -> VideoGrid -> MeetingRoom wiring).
export default function useVisionDetection(videoElementRef, { enabled = true } = {}) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;
      timeoutIdRef.current = setTimeout(runCycle, VISION_FRAME_INTERVAL_MS);
    };

    const runCycle = async () => {
      if (cancelled) return;

      const videoElement = videoElementRef.current;
      const hasFrame =
        videoElement &&
        videoElement.readyState >= 2 &&
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0;

      // Not ready yet, or a previous request is still in flight — skip this
      // tick rather than queueing up overlapping requests.
      if (!hasFrame || inFlightRef.current) {
        scheduleNext();
        return;
      }

      inFlightRef.current = true;
      try {
        console.log('[VISION] Capturing frame...');
        const blob = await captureVideoFrame(videoElement);

        console.log('[VISION] Sending frame to Python...');
        const data = await detectFrame(blob);

        if (!cancelled) {
          console.log('[VISION] Detection result:', data);
          console.log('[VISION] Person count:', data?.detections?.personCount);
          console.log('[VISION] Phone detected:', data?.detections?.phoneDetected);
          setResult(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[VISION] Detection request failed:', err.message);
          setError(err.message || 'Vision detection failed');
        }
      } finally {
        inFlightRef.current = false;
        scheduleNext();
      }
    };

    runCycle();

    return () => {
      cancelled = true;
      clearTimeout(timeoutIdRef.current);
    };
  }, [enabled, videoElementRef]);

  return { result, error };
}
