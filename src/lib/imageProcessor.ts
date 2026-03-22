import type { KnittingSettings, YarnColor, ColorCount } from '../types';
import { rgbToLab, mapCentersToPalette } from './colorUtils';
import { runKMeans } from './kmeans';

const GRID_COLOR: [number, number, number] = [200, 200, 200];

function constrainSize(width: number, height: number, maxSize = 2048): [number, number] {
  const maxDim = Math.max(width, height);
  if (maxDim <= maxSize) return [width, height];
  const scale = maxSize / maxDim;
  return [Math.floor(width * scale), Math.floor(height * scale)];
}

function resizeImageData(src: ImageData, newWidth: number, newHeight: number): ImageData {
  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d')!;
  const srcCanvas = new OffscreenCanvas(src.width, src.height);
  srcCanvas.getContext('2d')!.putImageData(src, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);
  return ctx.getImageData(0, 0, newWidth, newHeight);
}

function resizeNearest(src: ImageData, newWidth: number, newHeight: number): ImageData {
  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const srcCanvas = new OffscreenCanvas(src.width, src.height);
  srcCanvas.getContext('2d')!.putImageData(src, 0, 0);
  ctx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);
  return ctx.getImageData(0, 0, newWidth, newHeight);
}

function removeNoise(labelImage: Uint8Array, width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width - 1; x++) {
      const left   = labelImage[y * width + (x - 1)];
      const center = labelImage[y * width + x];
      const right  = labelImage[y * width + (x + 1)];
      if (center !== left && center !== right) {
        labelImage[y * width + x] = right;
      }
    }
  }
}

function calcOutputSize(cellCols: number, cellRows: number, settings: KnittingSettings): [number, number] {
  const { cellWidth, cellHeight, lineThickness, thickLineThickness, thickLineInterval } = settings;
  const extraW = Math.floor(cellCols / thickLineInterval) * (thickLineThickness - lineThickness);
  const extraH = Math.floor(cellRows / thickLineInterval) * (thickLineThickness - lineThickness);
  const width  = cellCols * cellWidth  + (cellCols - 1) * lineThickness + extraW;
  const height = cellRows * cellHeight + (cellRows - 1) * lineThickness + extraH;
  return [width, height];
}

function cellStartX(col: number, settings: KnittingSettings): number {
  return col * (settings.cellWidth + settings.lineThickness)
       + Math.floor(col / settings.thickLineInterval) * (settings.thickLineThickness - settings.lineThickness);
}

function cellStartY(row: number, settings: KnittingSettings): number {
  return row * (settings.cellHeight + settings.lineThickness)
       + Math.floor(row / settings.thickLineInterval) * (settings.thickLineThickness - settings.lineThickness);
}


export function processImageAndGetBlob(
  imageData: ImageData,
  palette: YarnColor[],
  settings: KnittingSettings,
  onProgress: (p: number) => void
): { blob: Promise<Blob>; colorCounts: ColorCount[] } {
  // processImage の STEP 1-6 を実行してグリッド描画まで行い
  // Blob を Promise で返す（Worker専用）

  // STEP 1
  const [w1, h1] = constrainSize(imageData.width, imageData.height);
  let current = (w1 !== imageData.width || h1 !== imageData.height)
    ? resizeImageData(imageData, w1, h1)
    : imageData;
  onProgress(0.1);

  // STEP 2
  const h2 = Math.max(1, Math.round(current.height * (settings.cellWidth / settings.cellHeight)));
  current = resizeImageData(current, current.width, h2);
  onProgress(0.2);

  // STEP 3
  const totalPixels = current.width * current.height;
  const pixelLabs = new Float32Array(totalPixels * 3);
  for (let i = 0; i < totalPixels; i++) {
    const r = current.data[i * 4];
    const g = current.data[i * 4 + 1];
    const b = current.data[i * 4 + 2];
    const [L, a, bVal] = rgbToLab(r, g, b);
    pixelLabs[i * 3] = L;
    pixelLabs[i * 3 + 1] = a;
    pixelLabs[i * 3 + 2] = bVal;
  }
  const k = Math.min(settings.colorCount, palette.length);
  const { centers, labels } = runKMeans(
    pixelLabs,
    totalPixels,
    k,
    settings.useSamplingForKMeans
  );
  onProgress(0.6);

  // STEP 4
  const cellCols = settings.horizontalCells;
  const cellRows = Math.max(1, Math.round((current.height / current.width) * cellCols));

  const coloredData = new Uint8ClampedArray(current.width * current.height * 4);
  for (let i = 0; i < totalPixels; i++) {
    coloredData[i * 4] = labels[i];
    coloredData[i * 4 + 1] = 0;
    coloredData[i * 4 + 2] = 0;
    coloredData[i * 4 + 3] = 255;
  }
  const labelImageFull = new ImageData(coloredData, current.width, current.height);
  const labelImageSmall = resizeNearest(labelImageFull, cellCols, cellRows);
  onProgress(0.7);

  // STEP 5
  const smallLabels = new Uint8Array(cellCols * cellRows);
  for (let i = 0; i < cellCols * cellRows; i++) {
    smallLabels[i] = labelImageSmall.data[i * 4];
  }
  if (settings.denoise) {
    removeNoise(smallLabels, cellCols, cellRows);
  }
  onProgress(0.75);

  // STEP 6
  const centerLabs: Array<[number, number, number]> = [];
  for (let j = 0; j < k; j++) {
    centerLabs.push([centers[j * 3], centers[j * 3 + 1], centers[j * 3 + 2]]);
  }
  const mappedColors = mapCentersToPalette(centerLabs, palette);
  onProgress(0.85);

  // STEP 7
  const [outW, outH] = calcOutputSize(cellCols, cellRows, settings);
  const outCanvas = new OffscreenCanvas(outW, outH);
  const ctx = outCanvas.getContext('2d')!;

  ctx.fillStyle = `rgb(${GRID_COLOR[0]},${GRID_COLOR[1]},${GRID_COLOR[2]})`;
  ctx.fillRect(0, 0, outW, outH);

  const colorCountMap = new Map<string, { color: YarnColor; count: number }>();

  for (let row = 0; row < cellRows; row++) {
    for (let col = 0; col < cellCols; col++) {
      const label = smallLabels[row * cellCols + col];
      const yarn = mappedColors[label] ?? mappedColors[0];
      const [r, g, b] = yarn.rgb;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(
        cellStartX(col, settings),
        cellStartY(row, settings),
        settings.cellWidth,
        settings.cellHeight
      );

      const key = `${yarn.type}-${yarn.colorNumber}`;
      const existing = colorCountMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorCountMap.set(key, { color: yarn, count: 1 });
      }
    }
  }

  const colorCounts: ColorCount[] = Array.from(colorCountMap.values())
    .map(({ color, count }) => ({ ...color, count }))
    .sort((a, b) => b.count - a.count);

  onProgress(1.0);

  return {
    blob: outCanvas.convertToBlob({ type: 'image/png' }),
    colorCounts,
  };
}
