import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KnittingSettings } from '../types';

interface SettingsPanelProps {
  settings: KnittingSettings;
  onChange: (settings: KnittingSettings) => void;
}

function computeCellHeight(cellWidth: number, gaugeStitches: number, gaugeRows: number): number {
  return Math.max(1, Math.round(cellWidth * gaugeStitches / gaugeRows));
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = <K extends keyof KnittingSettings>(key: K, value: KnittingSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const updateGauge = (gaugeStitches: number, gaugeRows: number) => {
    onChange({
      ...settings,
      gaugeStitches,
      gaugeRows,
      cellHeight: computeCellHeight(settings.cellWidth, gaugeStitches, gaugeRows),
    });
  };

  const updateCellWidth = (cellWidth: number) => {
    onChange({
      ...settings,
      cellWidth,
      cellHeight: computeCellHeight(cellWidth, settings.gaugeStitches, settings.gaugeRows),
    });
  };

  const updateLineThickness = (value: number) => {
    onChange({
      ...settings,
      lineThickness: value,
      thickLineThickness: Math.max(settings.thickLineThickness, value),
    });
  };

  const updateThickLineThickness = (value: number) => {
    onChange({
      ...settings,
      thickLineThickness: Math.max(value, settings.lineThickness),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('settings.colorCount', { count: settings.colorCount })}
        </label>
        <input
          type="range"
          min={2}
          max={64}
          value={settings.colorCount}
          onChange={(e) => update('colorCount', parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>2</span><span>64</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('settings.horizontalCells', { count: settings.horizontalCells })}
        </label>
        <input
          type="range"
          min={16}
          max={256}
          value={settings.horizontalCells}
          onChange={(e) => update('horizontalCells', parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>16</span><span>256</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('settings.gauge')}
        </label>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={100}
              value={settings.gaugeStitches}
              onChange={(e) => updateGauge(Math.max(1, parseInt(e.target.value, 10) || 1), settings.gaugeRows)}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
            />
            <span>{t('settings.gaugeStitchesUnit')}</span>
          </div>
          <span className="text-gray-400">×</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={100}
              value={settings.gaugeRows}
              onChange={(e) => updateGauge(settings.gaugeStitches, Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
            />
            <span>{t('settings.gaugeRowsUnit')}</span>
          </div>
          <span className="text-gray-400">{t('settings.gaugePer10cm')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="denoise"
          type="checkbox"
          checked={settings.denoise}
          onChange={(e) => update('denoise', e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="denoise" className="text-sm font-medium text-gray-700">
          {t('settings.denoise')}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="useSamplingForKMeans"
          type="checkbox"
          checked={settings.useSamplingForKMeans}
          onChange={(e) => update('useSamplingForKMeans', e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="useSamplingForKMeans" className="text-sm font-medium text-gray-700">
          {t('settings.sampling')}
        </label>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {showAdvanced ? t('settings.advancedHide') : t('settings.advancedShow')}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.cellWidth', { value: settings.cellWidth })}
                </label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={settings.cellWidth}
                  onChange={(e) => updateCellWidth(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.lineThickness', { value: settings.lineThickness })}
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={settings.lineThickness}
                  onChange={(e) => updateLineThickness(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.thickLineThickness', { value: settings.thickLineThickness })}
                </label>
                <input
                  type="range"
                  min={settings.lineThickness}
                  max={20}
                  value={Math.max(settings.thickLineThickness, settings.lineThickness)}
                  onChange={(e) => updateThickLineThickness(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.thickLineInterval', { value: settings.thickLineInterval })}
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={settings.thickLineInterval}
                  onChange={(e) => update('thickLineInterval', parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
