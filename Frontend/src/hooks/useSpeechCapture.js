import { useEffect } from 'react';
import env from '@/config/env';
import { analyzeAudioChunk } from '@/services/speechApi';
import { useAIDetectionStore } from '@/store/aiDetection.store';

const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

const pickSupportedMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return null;
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
};

/**
 * Captures the LOCAL participant's EXISTING LiveKit microphone track — never
 * calls getUserMedia() itself, never creates a second stream — slices it
 * into ~env.speechChunkIntervalMs chunks via MediaRecorder, and sends each
 * chunk to the Python speech service (Phase 4: Whisper -> keyword filter ->
 * conditional Gemini). Purely additive: every failure is caught and logged
 * with a [SPEECH] prefix, never thrown, so a broken speech pipeline can
 * never disconnect the user from LiveKit or affect video.
 *
 * `room` should be the same LiveKit Room instance MeetingRoom already holds
 * (roomRef.current) — this hook only reads from it, never calls
 * room.connect()/disconnect() or touches camera/video tracks.
 */
export default function useSpeechCapture(room, { meetingId, userId, enabled }) {
  const pushAlert = useAIDetectionStore((state) => state.pushAlert);

  useEffect(() => {
    if (!enabled || !room || !room.localParticipant) return undefined;

    let cleanedUp = false;
    let recorder = null;
    let intervalId = null;
    let chunks = [];
    let isProcessing = false;

    console.log('[SPEECH] Audio pipeline initialized');

    const getMicPublication = () => {
      const pubs = room.localParticipant.audioTrackPublications;
      if (!pubs || pubs.size === 0) return null;
      return Array.from(pubs.values()).find((pub) => pub.track) ?? null;
    };

    const sendChunk = async (blob) => {
      if (isProcessing) {
        console.log('[SPEECH] Previous chunk still processing — skipping this chunk');
        return;
      }
      if (!blob || blob.size === 0) {
        console.log('[SPEECH] Empty audio chunk — skipping');
        return;
      }

      isProcessing = true;
      console.log('[SPEECH] Audio chunk created:', { sizeBytes: blob.size, mimeType: blob.type });
      console.log('[SPEECH] Sending audio chunk to Python');

      try {
        const result = await analyzeAudioChunk({ meetingId, userId, audioBlob: blob });
        if (cleanedUp) return;

        console.log('[SPEECH] Python response received');
        console.log(`[SPEECH] Transcription: "${result.text || ''}"`);
        if (!result.text) console.log('[SPEECH] No speech detected in this chunk');

        console.log(`[SPEECH] Keyword check: ${result.keyword_matched ? 'SUSPICIOUS' : 'CLEAN'}`);
        if (result.matched_category) {
          console.log(`[SPEECH] Matched category: ${result.matched_category}`);
        }
        console.log(`[SPEECH] Gemini: ${result.llm_analyzed ? 'CALLED' : 'SKIPPED'}`);

        if (result.flagged) {
          console.log(`[SPEECH] Final result: ${result.type || 'violation'}`);
          console.log(`[SPEECH] Severity: ${(result.severity || 'unknown').toUpperCase()}`);
          console.log(`[SPEECH] Confidence: ${result.confidence}`);
          if (result.reason) console.log(`[SPEECH] Reason: ${result.reason}`);

          pushAlert({
            id: `speech-${Date.now()}`,
            source: 'speech',
            type: result.type,
            severity: result.severity,
            confidence: result.confidence,
            text: result.text,
            reason: result.reason,
            createdAt: new Date().toISOString(),
          });
        } else {
          console.log('[SPEECH] Final result: no violation');
        }
      } catch (error) {
        if (cleanedUp) return;
        if (error.code === 'ECONNABORTED') {
          console.warn('[SPEECH] Request to Python timed out — speech analysis skipped for this chunk');
        } else if (error.response) {
          console.warn('[SPEECH] Python service returned an error:', error.response.status, error.response.data);
        } else if (error.request) {
          console.warn('[SPEECH] Python service unavailable — speech analysis skipped');
        } else {
          console.warn('[SPEECH] Speech analysis failed:', error.message);
        }
      } finally {
        isProcessing = false;
      }
    };

    const beginChunk = (stream, mimeType) => {
      if (cleanedUp) return;
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch (error) {
        console.error('[SPEECH] Failed to create MediaRecorder:', error.message);
        return;
      }

      chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = (event) => {
        console.error('[SPEECH] MediaRecorder error:', event.error?.message || event);
      };
      recorder.onstop = () => {
        if (cleanedUp) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        chunks = [];
        sendChunk(blob);
        beginChunk(stream, mimeType); // continuous coverage — immediately capture the next chunk
      };

      recorder.start();
      console.log(`[SPEECH] Capturing ${env.speechChunkIntervalMs / 1000}-second audio chunk`);
    };

    const startCapture = (mediaStreamTrack) => {
      const mimeType = pickSupportedMimeType();
      if (mimeType === null) {
        console.warn('[SPEECH] MediaRecorder not supported in this browser — speech analysis disabled');
        return;
      }

      const stream = new MediaStream([mediaStreamTrack]);
      console.log('[SPEECH] Starting audio chunk capture');
      beginChunk(stream, mimeType);

      intervalId = setInterval(() => {
        if (recorder && recorder.state === 'recording') {
          recorder.stop(); // -> onstop sends this chunk and starts the next one
        }
      }, env.speechChunkIntervalMs);
    };

    const existingPub = getMicPublication();
    if (existingPub) {
      console.log('[SPEECH] LiveKit microphone track found');
      startCapture(existingPub.track.mediaStreamTrack);
    } else {
      console.log('[SPEECH] LiveKit microphone track not yet available — waiting for it to publish');
    }

    // Covers the mic publishing slightly after this effect first runs, or
    // being toggled off and back on mid-meeting.
    const handleTrackPublished = (publication) => {
      if (cleanedUp || publication.kind !== 'audio' || recorder) return;
      console.log('[SPEECH] LiveKit microphone track found');
      startCapture(publication.track.mediaStreamTrack);
    };
    room.localParticipant.on('trackPublished', handleTrackPublished);

    return () => {
      cleanedUp = true;
      console.log('[SPEECH] Cleaning up audio capture');
      room.localParticipant.off('trackPublished', handleTrackPublished);
      if (intervalId) clearInterval(intervalId);
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null; // don't send a partial chunk or restart on teardown
        try {
          recorder.stop();
        } catch {
          // already stopped — nothing to do.
        }
      }
    };
  }, [room, enabled, meetingId, userId, pushAlert]);
}
