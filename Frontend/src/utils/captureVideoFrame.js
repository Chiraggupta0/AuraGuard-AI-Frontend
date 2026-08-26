// Draws the CURRENT frame of an already-playing <video> element to an
// offscreen canvas and encodes it as a JPEG Blob. Does not touch
// getUserMedia or any media stream — it only reads pixels already being
// rendered by the video element passed in.
export function captureVideoFrame(videoElement, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;

    if (!width || !height) {
      reject(new Error('Video element has no frame data yet'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      quality
    );
  });
}
