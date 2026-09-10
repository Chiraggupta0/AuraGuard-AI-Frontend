import { useEffect, useState } from 'react';
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
  // Exposes the latest chunk result the same shape useVisionDetection.js
  // does ({ result }) — purely additive, so a caller (e.g. the Violation
  // Engine's reporter hook) can observe it without this hook's own capture
  // logic changing at all.
  const [latestResult, setLatestResult] = useState(null);

  useEffect(() => {
    if (!enabled || !room || !room.localParticipant) return undefined;

    let cleanedUp = false;
    let recorder = null;
    let intervalId = null;
    let chunks = [];
    let isProcessing = false;

    // --- TEMPORARY diagnostics: measures real audio ENERGY on the track via
    // Web Audio, independent of any enabled/muted flags the browser reports.
    // Settles definitively whether sound is actually reaching this track.
    // Safe to remove once the pipeline is confirmed working end-to-end.
    let audioContext = null;
    let analyser = null;
    let analyserData = null;
    let levelPollId = null;
    let maxPeakThisChunk = 0;

    const setupLevelMeter = (stream) => {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserData = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);

        levelPollId = setInterval(() => {
          if (!analyser || !analyserData) return;
          analyser.getByteTimeDomainData(analyserData);
          let peak = 0;
          for (let i = 0; i < analyserData.length; i++) {
            const deviation = Math.abs(analyserData[i] - 128);
            if (deviation > peak) peak = deviation;
          }
          if (peak > maxPeakThisChunk) maxPeakThisChunk = peak;
        }, 100);

        console.log('[SPEECH][DIAG] Audio level meter attached (0 = dead silence, 128 = full scale)');
      } catch (error) {
        console.warn('[SPEECH][DIAG] Could not attach audio level meter:', error.message);
      }
    };

    console.log('[SPEECH] Audio pipeline initialized');

    const getMicPublication = () => {
      const pubs = room.localParticipant.audioTrackPublications;
      if (!pubs || pubs.size === 0) return null;
      return Array.from(pubs.values()).find((pub) => pub.track) ?? null;
    };

    const sendChunk = async (blob, peakLevel) => {
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
      console.log(`[SPEECH][DIAG] Max audio level measured during this chunk: ${peakLevel}/128`, {
        interpretation:
          peakLevel === 0
            ? 'DEAD SILENCE reached MediaRecorder — problem is BEFORE Whisper (mic/track/OS level)'
            : peakLevel < 4
              ? 'Near-silent — likely background noise floor only, no real speech captured'
              : 'Real signal detected — problem (if any) is AFTER capture (network/Whisper/decode)',
      });
      console.log('[SPEECH] Sending audio chunk to Python');
      const requestStartedAt = performance.now();

      try {
        const result = await analyzeAudioChunk({ meetingId, userId, audioBlob: blob });
        if (cleanedUp) return;

        const elapsedMs = Math.round(performance.now() - requestStartedAt);
        console.log(`[SPEECH] Python response received (${elapsedMs}ms)`);
        console.log(`[SPEECH] Transcription: "${result.text || ''}"`);
        if (!result.text) console.log('[SPEECH] No speech detected in this chunk');

        console.log(`[SPEECH] Keyword check: ${result.keyword_matched ? 'SUSPICIOUS' : 'CLEAN'}`);
        if (result.matched_category) {
          console.log(`[SPEECH] Matched category: ${result.matched_category}`);
        }
        console.log(`[SPEECH] Gemini: ${result.llm_analyzed ? 'CALLED' : 'SKIPPED'}`);
        setLatestResult(result);

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
        const elapsedMs = Math.round(performance.now() - requestStartedAt);
        if (error.code === 'ECONNABORTED') {
          console.warn(`[SPEECH] Request to Python timed out after ${elapsedMs}ms — speech analysis skipped for this chunk`);
        } else if (error.response) {
          console.warn(
            `[SPEECH] Python service returned an error (${elapsedMs}ms):`,
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          console.warn(`[SPEECH] Python service unavailable (${elapsedMs}ms) — speech analysis skipped`);
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
      maxPeakThisChunk = 0;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = (event) => {
        console.error('[SPEECH] MediaRecorder error:', event.error?.message || event);
      };
      recorder.onstop = () => {
        if (cleanedUp) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        const peakForThisChunk = maxPeakThisChunk;
        chunks = [];
        sendChunk(blob, peakForThisChunk);
        beginChunk(stream, mimeType); // continuous coverage — immediately capture the next chunk
      };

      recorder.start();
      const liveTrack = stream.getAudioTracks()[0];
      console.log(`[SPEECH] Capturing ${env.speechChunkIntervalMs / 1000}-second audio chunk`, {
        trackEnabled: liveTrack?.enabled,
        trackMuted: liveTrack?.muted,
        trackReadyState: liveTrack?.readyState,
        trackLabel: liveTrack?.label,
      });
      if (liveTrack && (liveTrack.readyState !== 'live' || !liveTrack.enabled)) {
        console.warn(
          '[SPEECH] Microphone track is not live/enabled — this chunk will be silent. Check the Mic toggle in the meeting UI.'
        );
      }
    };

    const startCapture = (mediaStreamTrack) => {
      const mimeType = pickSupportedMimeType();
      if (mimeType === null) {
        console.warn('[SPEECH] MediaRecorder not supported in this browser — speech analysis disabled');
        return;
      }

      const stream = new MediaStream([mediaStreamTrack]);
      console.log('[SPEECH] Starting audio chunk capture');
      setupLevelMeter(stream);
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
      console.log('[SPEECH][DIAG] LiveKit publication state:', {
        trackSid: existingPub.trackSid,
        source: existingPub.source,
        publicationIsMuted: existingPub.isMuted,
        kind: existingPub.kind,
      });
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
    // LocalParticipant emits 'localTrackPublished', NOT the RemoteParticipant-only
    // 'trackPublished' — confirmed against the installed livekit-client SDK source
    // (same class of bug already fixed once in useScreenShare.js).
    room.localParticipant.on('localTrackPublished', handleTrackPublished);

    return () => {
      cleanedUp = true;
      console.log('[SPEECH] Cleaning up audio capture');
      room.localParticipant.off('localTrackPublished', handleTrackPublished);
      if (intervalId) clearInterval(intervalId);
      if (levelPollId) clearInterval(levelPollId);
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
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

  return { result: latestResult };
}
