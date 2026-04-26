import { useTranslation } from 'react-i18next';
import type { KnittingSettings, ImageRect } from '../types';
import { calcImageInfo } from '../lib/imageProcessor';

interface ImageInfoPanelProps {
  settings: KnittingSettings;
  rect: ImageRect | null;
  uploadedImage: ImageData | null;
}

export function ImageInfoPanel({ settings, rect, uploadedImage }: ImageInfoPanelProps) {
  const { t } = useTranslation();
  if (!uploadedImage) return null;

  const w = rect && rect.width > 0 ? rect.width : uploadedImage.width;
  const h = rect && rect.height > 0 ? rect.height : uploadedImage.height;
  const { cellCols, cellRows, outWidth, outHeight } = calcImageInfo(settings, w, h);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('info.title')}</h2>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
        <div className="flex justify-between">
          <span>{t('info.horizontalCells')}</span>
          <span className="font-medium">{cellCols}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('info.verticalCells')}</span>
          <span className="font-medium">{cellRows}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('info.imageWidth')}</span>
          <span className="font-medium">{outWidth} px</span>
        </div>
        <div className="flex justify-between">
          <span>{t('info.imageHeight')}</span>
          <span className="font-medium">{outHeight} px</span>
        </div>
      </div>
    </div>
  );
}
