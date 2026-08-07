import { useEffect, useState } from 'react';
import { stopMediaTracks } from './streamUtils';

export default function useMeetingStream() {
  const [streamStatus, setStreamStatus] = useState('idle');

  useEffect(() => {
    setStreamStatus('active');

    return () => {
      setStreamStatus('idle');
      stopMediaTracks(null);
    };
  }, []);

  return { streamStatus };
}
