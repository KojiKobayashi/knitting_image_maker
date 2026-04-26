import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface ImageUploaderProps {
  onImageLoaded: (imageData: ImageData, previewUrl: string) => void;
}

export function ImageUploader({ onImageLoaded }: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|bmp)$/)) {
      alert(t('uploader.error'));
      return;
    }
    setFileName(file.name);
    const previewUrl = URL.createObjectURL(file);
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    onImageLoaded(imageData, previewUrl);
    bitmap.close();
  }, [onImageLoaded]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{t('uploader.label')}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/bmp"
          className="hidden"
          onChange={handleChange}
        />
        {fileName ? (
          <p className="text-sm text-gray-700 truncate">{fileName}</p>
        ) : (
          <p className="text-sm text-gray-500">
            {t('uploader.hint')}<br />
            <span className="text-xs">{t('uploader.formats')}</span>
          </p>
        )}
      </div>
    </div>
  );
}
