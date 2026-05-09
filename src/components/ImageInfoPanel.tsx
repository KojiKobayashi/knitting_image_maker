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
  const { cellCols, cellRows } = calcImageInfo(settings, w, h);

  const widthCm = (cellCols / settings.gaugeStitches * 10).toFixed(1);
  const heightCm = (cellRows / settings.gaugeRows * 10).toFixed(1);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('info.title')}</h2>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
        <div className="flex justify-between">
          <span>{t('info.stitchCols')}</span>
          <span className="font-medium">{cellCols} {t('info.stitchUnit')}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('info.stitchRows')}</span>
          <span className="font-medium">{cellRows} {t('info.rowUnit')}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('info.knittingWidth')}</span>
          <span className="font-medium">{widthCm} cm</span>
        </div>
        <div className="flex justify-between">
          <span>{t('info.knittingHeight')}</span>
          <span className="font-medium">{heightCm} cm</span>
        </div>
      </div>
    </div>
  );
}
