import { useRef, useState, useCallback } from 'react';
import { loadPaletteFromFile } from '../lib/paletteLoader';
import type { YarnColor } from '../types';

interface PaletteUploaderProps {
  onPaletteLoaded: (palette: YarnColor[]) => void;
}

export function PaletteUploader({ onPaletteLoaded }: PaletteUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const palette = await loadPaletteFromFile(file);
      if (palette.length === 0) {
        setError('有効な色データが見つかりませんでした。');
        return;
      }
      setFileName(file.name);
      onPaletteLoaded(palette);
    } catch {
      setError('CSVの読み込みに失敗しました。');
    }
  }, [onPaletteLoaded]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        カラーパレット CSV（任意）
      </label>
      <div
        className="border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
        />
        {fileName ? (
          <p className="text-sm text-gray-700 truncate">{fileName}</p>
        ) : (
          <p className="text-sm text-gray-500">
            未選択: Merino Rainbow 93色（デフォルト）を使用
          </p>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
