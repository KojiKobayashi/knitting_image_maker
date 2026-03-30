import type { KnittingSettings, ImageRect } from '../types';
import { calcImageInfo } from '../lib/imageProcessor';

interface ImageInfoPanelProps {
  settings: KnittingSettings;
  rect: ImageRect | null;
  uploadedImage: ImageData | null;
}

export function ImageInfoPanel({ settings, rect, uploadedImage }: ImageInfoPanelProps) {
  if (!uploadedImage) return null;

  const w = rect && rect.width > 0 ? rect.width : uploadedImage.width;
  const h = rect && rect.height > 0 ? rect.height : uploadedImage.height;
  const { cellCols, cellRows, outWidth, outHeight } = calcImageInfo(settings, w, h);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">出力画像情報</h2>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
        <div className="flex justify-between">
          <span>横セル数</span>
          <span className="font-medium">{cellCols}</span>
        </div>
        <div className="flex justify-between">
          <span>縦セル数</span>
          <span className="font-medium">{cellRows}</span>
        </div>
        <div className="flex justify-between">
          <span>画像横サイズ</span>
          <span className="font-medium">{outWidth} px</span>
        </div>
        <div className="flex justify-between">
          <span>画像縦サイズ</span>
          <span className="font-medium">{outHeight} px</span>
        </div>
      </div>
    </div>
  );
}
