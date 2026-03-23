import { useState, useRef, useCallback, useEffect } from 'react';
import type { KnittingSettings, ProcessingResult, WorkerResponse, YarnColor, ImageRect } from './types';
import { ImageUploader } from './components/ImageUploader';
import { PaletteUploader } from './components/PaletteUploader';
import { SettingsPanel } from './components/SettingsPanel';
import { ProcessButton } from './components/ProcessButton';
import { ResultView } from './components/ResultView';
import { RectSelector } from './components/RectSelector';
import { DEFAULT_PALETTE } from './lib/defaultPalette';

const DEFAULT_SETTINGS: KnittingSettings = {
  colorCount: 12,
  horizontalCells: 64,
  cellHeight: 27,
  cellWidth: 33,
  lineThickness: 3,
  thickLineThickness: 5,
  thickLineInterval: 5,
  denoise: false,
  useSamplingForKMeans: false,
};

export default function App() {
  const [uploadedImage, setUploadedImage] = useState<ImageData | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<YarnColor[]>(DEFAULT_PALETTE);
  const [settings, setSettings] = useState<KnittingSettings>(DEFAULT_SETTINGS);
  const [rect, setRect] = useState<ImageRect | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const originalImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (originalImageUrlRef.current) {
        URL.revokeObjectURL(originalImageUrlRef.current);
      }
    };
  }, []);

  const handleImageLoaded = useCallback((imageData: ImageData, previewUrl: string) => {
    if (originalImageUrlRef.current) {
      URL.revokeObjectURL(originalImageUrlRef.current);
    }

    originalImageUrlRef.current = previewUrl;
    setOriginalImageUrl(previewUrl);
    setUploadedImage(imageData);
    setRect({ x: 0, y: 0, width: imageData.width, height: imageData.height });
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleProcess = useCallback(() => {
    if (!uploadedImage) return;

    // 既存のWorkerを終了
    workerRef.current?.terminate();

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const worker = new Worker(
      new URL('./workers/processor.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, progress: p, result: r, error: err } = e.data;
      if (type === 'progress' && p !== undefined) {
        setProgress(p);
      } else if (type === 'done' && r) {
        setResult(r);
        setIsProcessing(false);
        setProgress(1);
        worker.terminate();
      } else if (type === 'error') {
        setError(err ?? '不明なエラーが発生しました。');
        setIsProcessing(false);
        worker.terminate();
      }
    };

    worker.onerror = (e) => {
      setError(`Worker エラー: ${e.message}`);
      setIsProcessing(false);
      worker.terminate();
    };

    worker.postMessage({ imageData: uploadedImage, palette, settings, rect: rect ?? undefined });
  }, [uploadedImage, palette, settings, rect]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左サイドバー（設定） */}
      <aside className="w-72 bg-white shadow-md flex flex-col overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">編み図生成</h1>
          <p className="text-xs text-gray-500 mt-1">画像から編み目パターンを生成</p>
        </div>

        <div className="p-4 space-y-5 flex-1">
          <ImageUploader onImageLoaded={handleImageLoaded} />
          <PaletteUploader onPaletteLoaded={setPalette} />
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">変換設定</h2>
            <SettingsPanel settings={settings} onChange={setSettings} />
          </div>
        </div>

        <div className="p-4 border-t">
          <ProcessButton
            disabled={!uploadedImage}
            isProcessing={isProcessing}
            progress={progress}
            onClick={handleProcess}
          />
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}
        </div>
      </aside>

      {/* メインエリア（結果） */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {result ? (
          <ResultView result={result} originalImageUrl={originalImageUrl} />
        ) : originalImageUrl && uploadedImage && rect ? (
          <div className="mx-auto max-w-6xl space-y-4">
            <RectSelector
              imageUrl={originalImageUrl}
              imageWidth={uploadedImage.width}
              imageHeight={uploadedImage.height}
              rect={rect}
              onRectChange={setRect}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">🧶</div>
              <p className="text-lg">画像をアップロードして「編み図を生成」ボタンを押してください</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
