export const stopMediaTracks = (stream) => stream?.getTracks().forEach((track) => track.stop());
