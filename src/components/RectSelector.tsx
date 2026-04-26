import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageRect } from '../types';

interface RectSelectorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  rect: ImageRect;
  onRectChange: (rect: ImageRect) => void;
}

interface DragState {
  startX: number;
  startY: number;
}

const MIN_SELECTION_SIZE = 2;
const HANDLE_SIZE_PX = 12; // matches Tailwind w-3 h-3

export function RectSelector({ imageUrl, imageWidth, imageHeight, rect, onRectChange }: RectSelectorProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

  const toImageCoords = useCallback((clientX: number, clientY: number): [number, number] => {
    const container = containerRef.current;
    if (!container) return [0, 0];
    const bounds = container.getBoundingClientRect();
    const scaleX = imageWidth / bounds.width;
    const scaleY = imageHeight / bounds.height;
    const x = Math.max(0, Math.min(imageWidth, (clientX - bounds.left) * scaleX));
    const y = Math.max(0, Math.min(imageHeight, (clientY - bounds.top) * scaleY));
    return [x, y];
  }, [imageWidth, imageHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const [x, y] = toImageCoords(e.clientX, e.clientY);
    setDragging({ startX: x, startY: y });
    onRectChange({ x, y, width: 0, height: 0 });
  }, [toImageCoords, onRectChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const [x, y] = toImageCoords(e.clientX, e.clientY);
    const newX = Math.min(dragging.startX, x);
    const newY = Math.min(dragging.startY, y);
    const newW = Math.abs(x - dragging.startX);
    const newH = Math.abs(y - dragging.startY);
    onRectChange({ x: newX, y: newY, width: newW, height: newH });
  }, [dragging, toImageCoords, onRectChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const [x, y] = toImageCoords(e.clientX, e.clientY);
    const newX = Math.min(dragging.startX, x);
    const newY = Math.min(dragging.startY, y);
    const newW = Math.abs(x - dragging.startX);
    const newH = Math.abs(y - dragging.startY);
    // If the drag was too small, reset to full image
    const finalRect = (newW < MIN_SELECTION_SIZE && newH < MIN_SELECTION_SIZE)
      ? { x: 0, y: 0, width: imageWidth, height: imageHeight }
      : { x: newX, y: newY, width: newW, height: newH };
    onRectChange(finalRect);
    setDragging(null);
  }, [dragging, toImageCoords, onRectChange, imageWidth, imageHeight]);

  const handleMouseLeave = useCallback(() => {
    if (dragging) {
      setDragging(null);
    }
  }, [dragging]);

  // Convert image coords to percentage for overlay positioning
  const rectLeft   = (rect.x / imageWidth) * 100;
  const rectTop    = (rect.y / imageHeight) * 100;
  const rectWidth  = (rect.width / imageWidth) * 100;
  const rectHeight = (rect.height / imageHeight) * 100;

  const isFullImage =
    rect.x === 0 && rect.y === 0 &&
    rect.width === imageWidth && rect.height === imageHeight;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-800">{t('rectSelector.title')}</h2>
        {!isFullImage && (
          <button
            className="text-xs text-blue-600 hover:text-blue-800 underline"
            onClick={() => onRectChange({ x: 0, y: 0, width: imageWidth, height: imageHeight })}
          >
            {t('rectSelector.reset')}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {t('rectSelector.hint')}
      </p>
      <div
        ref={containerRef}
        className="relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm cursor-crosshair select-none"
        style={{ width: 'fit-content' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={imageUrl}
          alt={t('rectSelector.imageAlt')}
          className="block max-w-full h-auto pointer-events-none"
          draggable={false}
        />
        {/* Dark overlay outside the selection */}
        {!isFullImage && (
          <>
            {/* Top */}
            <div
              className="absolute top-0 left-0 right-0 bg-black bg-opacity-40 pointer-events-none"
              style={{ height: `${rectTop}%` }}
            />
            {/* Bottom */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black bg-opacity-40 pointer-events-none"
              style={{ top: `${rectTop + rectHeight}%` }}
            />
            {/* Left */}
            <div
              className="absolute bg-black bg-opacity-40 pointer-events-none"
              style={{
                top: `${rectTop}%`,
                left: 0,
                width: `${rectLeft}%`,
                height: `${rectHeight}%`,
              }}
            />
            {/* Right */}
            <div
              className="absolute bg-black bg-opacity-40 pointer-events-none"
              style={{
                top: `${rectTop}%`,
                left: `${rectLeft + rectWidth}%`,
                right: 0,
                height: `${rectHeight}%`,
              }}
            />
          </>
        )}
        {/* Selection border */}
        <div
          className="absolute border-2 border-blue-400 pointer-events-none box-border"
          style={{
            left: `${rectLeft}%`,
            top: `${rectTop}%`,
            width: `${rectWidth}%`,
            height: `${rectHeight}%`,
          }}
        />
        {/* Corner handles */}
        {[
          { left: rectLeft, top: rectTop },
          { left: rectLeft + rectWidth, top: rectTop },
          { left: rectLeft, top: rectTop + rectHeight },
          { left: rectLeft + rectWidth, top: rectTop + rectHeight },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-blue-400 border border-white rounded-sm pointer-events-none"
            style={{
              left: `calc(${pos.left}% - ${HANDLE_SIZE_PX / 2}px)`,
              top: `calc(${pos.top}% - ${HANDLE_SIZE_PX / 2}px)`,
            }}
          />
        ))}
      </div>
      {!isFullImage && (
        <p className="text-xs text-gray-500 mt-1">
          {t('rectSelector.range', { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) })}
        </p>
      )}
    </div>
  );
}
