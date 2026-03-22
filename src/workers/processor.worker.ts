import type { WorkerRequest, WorkerResponse, ProcessingResult } from '../types';
import { processImageAndGetBlob } from '../lib/imageProcessor';

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { imageData, palette, settings } = e.data;
  try {
    postMessage({ type: 'progress', progress: 0.0 } satisfies WorkerResponse);

    const { blob, colorCounts } = processImageAndGetBlob(
      imageData,
      palette,
      settings,
      (p) => {
        postMessage({ type: 'progress', progress: p } satisfies WorkerResponse);
      }
    );

    const resolvedBlob = await blob;
    const arrayBuffer = await resolvedBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const pixelImageDataUrl = `data:image/png;base64,${base64}`;

    const result: ProcessingResult = { pixelImageDataUrl, colorCounts };
    postMessage({ type: 'done', result } satisfies WorkerResponse);
  } catch (err) {
    postMessage({ type: 'error', error: String(err) } satisfies WorkerResponse);
  }
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
