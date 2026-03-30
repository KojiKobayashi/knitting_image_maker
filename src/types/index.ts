export interface YarnColor {
  type: string;
  colorNumber: string;
  rgb: [number, number, number];
  asin?: string;
}

export interface KnittingSettings {
  colorCount: number;
  horizontalCells: number;
  cellHeight: number;
  cellWidth: number;
  lineThickness: number;
  thickLineThickness: number;
  thickLineInterval: number;
  denoise: boolean;
  useSamplingForKMeans: boolean;
}

export interface ProcessingResult {
  pixelImageDataUrl: string;
  colorCounts: ColorCount[];
  cellGrid: YarnColor[][];
  cellCols: number;
  cellRows: number;
  settings: KnittingSettings;
}

export interface ColorCount extends YarnColor {
  count: number;
}

export interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkerRequest {
  imageData: ImageData;
  palette: YarnColor[];
  settings: KnittingSettings;
  rect?: ImageRect;
}

export interface WorkerResponse {
  type: 'progress' | 'done' | 'error';
  progress?: number;
  result?: ProcessingResult;
  error?: string;
}
