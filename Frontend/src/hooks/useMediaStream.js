import { useEffect, useState } from 'react';

export default function useMediaStream(constraints = { audio: true, video: true }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let activeStream = null;

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((mediaStream) => {
        activeStream = mediaStream;

        if (mounted) {
          setStream(mediaStream);
        }
      })
      .catch((mediaError) => {
        if (mounted) {
          setError(mediaError);
        }
      });

    return () => {
      mounted = false;
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { stream, error };
}
