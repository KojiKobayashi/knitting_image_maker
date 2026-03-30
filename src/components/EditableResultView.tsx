import { useState, useRef, useEffect, useCallback, useMemo, useReducer } from 'react';
import type { ProcessingResult, YarnColor, ColorCount, ImageRect, KnittingSettings } from '../types';
import { cellStartX, cellStartY, renderCellGridToBlob } from '../lib/imageProcessor';

// ─── helpers ──────────────────────────────────────────────────────────────────

function colorKey(c: YarnColor): string {
  return `${c.type}::${c.colorNumber}`;
}

function colorsEqual(a: YarnColor, b: YarnColor): boolean {
  return a.type === b.type && a.colorNumber === b.colorNumber;
}

function calcColorCounts(cellGrid: YarnColor[][]): ColorCount[] {
  const map = new Map<string, { color: YarnColor; count: number }>();
  for (const row of cellGrid) {
    for (const yarn of row) {
      const k = colorKey(yarn);
      const existing = map.get(k);
      if (existing) existing.count++;
      else map.set(k, { color: yarn, count: 1 });
    }
  }
  return Array.from(map.values())
    .map(({ color, count }) => ({ ...color, count }))
    .sort((a, b) => b.count - a.count);
}

function getCellCol(x: number, settings: KnittingSettings, cellCols: number): number | null {
  for (let col = 0; col < cellCols; col++) {
    const sx = cellStartX(col, settings);
    if (x >= sx && x < sx + settings.cellWidth) return col;
    if (x < sx) return null;
  }
  return null;
}

function getCellRow(y: number, settings: KnittingSettings, cellRows: number): number | null {
  for (let row = 0; row < cellRows; row++) {
    const sy = cellStartY(row, settings);
    if (y >= sy && y < sy + settings.cellHeight) return row;
    if (y < sy) return null;
  }
  return null;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cellGrid: YarnColor[][],
  settings: KnittingSettings,
  cellCols: number,
  cellRows: number,
  highlightRow: number | null,
  highlightCol: number | null
): void {
  ctx.fillStyle = 'rgb(200,200,200)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (let row = 0; row < cellRows; row++) {
    for (let col = 0; col < cellCols; col++) {
      const yarn = cellGrid[row][col];
      if (!yarn) continue;
      const [r, g, b] = yarn.rgb;
      const sx = cellStartX(col, settings);
      const sy = cellStartY(row, settings);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(sx, sy, settings.cellWidth, settings.cellHeight);

      if (row === highlightRow && col === highlightCol) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, settings.cellWidth - 2, settings.cellHeight - 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, settings.cellWidth, settings.cellHeight);
      }
    }
  }
}

// ─── edit history (useReducer) ─────────────────────────────────────────────────

const MAX_HISTORY = 60;

interface EditHistoryState {
  cellGrid: YarnColor[][];
  history: YarnColor[][][];
  historyIndex: number;
}

type HistoryAction =
  | { type: 'COMMIT'; newGrid: YarnColor[][] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function historyReducer(state: EditHistoryState, action: HistoryAction): EditHistoryState {
  switch (action.type) {
    case 'COMMIT': {
      const truncated = state.history.slice(0, state.historyIndex + 1);
      const next = [...truncated, action.newGrid].slice(-MAX_HISTORY);
      return { cellGrid: action.newGrid, history: next, historyIndex: next.length - 1 };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIdx = state.historyIndex - 1;
      return { ...state, cellGrid: state.history[newIdx], historyIndex: newIdx };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIdx = state.historyIndex + 1;
      return { ...state, cellGrid: state.history[newIdx], historyIndex: newIdx };
    }
  }
}

// ─── types ────────────────────────────────────────────────────────────────────

type Tool = 'paint' | 'eyedropper';

interface ResultViewProps {
  result: ProcessingResult;
  originalImageUrl?: string | null;
  rect?: ImageRect | null;
  imageSize?: { width: number; height: number } | null;
  onBackToRectSelect?: () => void;
}

function getAmazonProductUrl(asin: string): string {
  return `https://www.amazon.co.jp/dp/${asin}`;
}

// ─── EditableResultView (view mode + edit mode toggle) ─────────────────────────

export function EditableResultView({
  result,
  originalImageUrl,
  rect,
  imageSize,
  onBackToRectSelect,
}: ResultViewProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  const isFullImage =
    !rect ||
    !imageSize ||
    (rect.x === 0 &&
      rect.y === 0 &&
      rect.width === imageSize.width &&
      rect.height === imageSize.height);

  const rectLeft = rect && imageSize ? (rect.x / imageSize.width) * 100 : 0;
  const rectTop = rect && imageSize ? (rect.y / imageSize.height) * 100 : 0;
  const rectWidth = rect && imageSize ? (rect.width / imageSize.width) * 100 : 100;
  const rectHeight = rect && imageSize ? (rect.height / imageSize.height) * 100 : 100;

  if (isEditMode) {
    return <EditMode result={result} onExitEdit={() => setIsEditMode(false)} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {originalImageUrl && (
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">元画像</h2>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-auto max-h-[65vh] bg-white shadow-sm">
              <div className="relative" style={{ width: 'fit-content' }}>
                <img
                  src={originalImageUrl}
                  alt="アップロードした元画像"
                  className="block max-w-full h-auto"
                />
                {!isFullImage && (
                  <>
                    <div
                      className="absolute top-0 left-0 right-0 bg-black bg-opacity-40 pointer-events-none"
                      style={{ height: `${rectTop}%` }}
                    />
                    <div
                      className="absolute left-0 right-0 bottom-0 bg-black bg-opacity-40 pointer-events-none"
                      style={{ top: `${rectTop + rectHeight}%` }}
                    />
                    <div
                      className="absolute bg-black bg-opacity-40 pointer-events-none"
                      style={{
                        top: `${rectTop}%`,
                        left: 0,
                        width: `${rectLeft}%`,
                        height: `${rectHeight}%`,
                      }}
                    />
                    <div
                      className="absolute bg-black bg-opacity-40 pointer-events-none"
                      style={{
                        top: `${rectTop}%`,
                        left: `${rectLeft + rectWidth}%`,
                        right: 0,
                        height: `${rectHeight}%`,
                      }}
                    />
                    <div
                      className="absolute border-2 border-blue-400 pointer-events-none box-border"
                      style={{
                        left: `${rectLeft}%`,
                        top: `${rectTop}%`,
                        width: `${rectWidth}%`,
                        height: `${rectHeight}%`,
                      }}
                    />
                  </>
                )}
              </div>
            </div>
            {!isFullImage && rect && (
              <p className="text-xs text-gray-500 mt-1">
                処理範囲: ({Math.round(rect.x)}, {Math.round(rect.y)}) —{' '}
                {Math.round(rect.width)} × {Math.round(rect.height)} px
              </p>
            )}
          </section>
        )}

        <section className="min-w-0">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-800">生成結果</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {onBackToRectSelect && (
                <button
                  onClick={onBackToRectSelect}
                  className="inline-flex w-full justify-center rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-300 sm:w-auto"
                >
                  矩形選択に戻る
                </button>
              )}
              <button
                onClick={() => setIsEditMode(true)}
                className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition-colors hover:bg-indigo-700 sm:w-auto"
              >
                ✏️ 編集モード
              </button>
              <a
                href={result.pixelImageDataUrl}
                download="knitting-pattern.png"
                className="inline-flex w-full justify-center rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-700 sm:w-auto"
              >
                PNG ダウンロード
              </a>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-auto max-h-[65vh] bg-white shadow-sm">
            <img
              src={result.pixelImageDataUrl}
              alt="編み図"
              className="block max-w-full h-auto"
            />
          </div>
        </section>
      </div>

      <ColorCountTable colorCounts={result.colorCounts} />
    </div>
  );
}

// ─── ColorCountTable ──────────────────────────────────────────────────────────

function ColorCountTable({
  colorCounts,
  selectedColor,
  onColorClick,
  onReplaceAll,
}: {
  colorCounts: ColorCount[];
  selectedColor?: YarnColor | null;
  onColorClick?: (color: YarnColor) => void;
  onReplaceAll?: (color: YarnColor) => void;
}) {
  return (
    <div>
      <h3 className="text-md font-semibold text-gray-800 mb-2">
        使用色一覧 ({colorCounts.length}色)
      </h3>
      <div className="overflow-auto max-h-64 border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-gray-600">プレビュー</th>
              <th className="px-3 py-2 text-left text-gray-600">系統</th>
              <th className="px-3 py-2 text-left text-gray-600">色番</th>
              <th className="px-3 py-2 text-right text-gray-600">セル数</th>
              <th className="px-3 py-2 text-left text-gray-600">商品</th>
              {onReplaceAll && (
                <th className="px-3 py-2 text-left text-gray-600">操作</th>
              )}
            </tr>
          </thead>
          <tbody>
            {colorCounts.map((color, i) => {
              const isSelected = selectedColor ? colorsEqual(color, selectedColor) : false;
              return (
                <tr
                  key={i}
                  className={`border-t border-gray-100 ${onColorClick ? 'cursor-pointer hover:bg-indigo-50' : ''} ${isSelected ? 'bg-indigo-100' : ''}`}
                  onClick={() => onColorClick?.(color)}
                >
                  <td className="px-3 py-2">
                    <div
                      className={`w-6 h-6 rounded border-2 ${isSelected ? 'border-indigo-500 scale-110' : 'border-gray-200'}`}
                      style={{
                        backgroundColor: `rgb(${color.rgb[0]},${color.rgb[1]},${color.rgb[2]})`,
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-700">{color.type}</td>
                  <td className="px-3 py-2 text-gray-700">{color.colorNumber}</td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {color.count.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {color.asin ? (
                      <a
                        href={getAmazonProductUrl(color.asin)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Amazon
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {onReplaceAll && (
                    <td className="px-3 py-2">
                      <button
                        title="選択色でこの色をすべて置換"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplaceAll(color);
                        }}
                        className="rounded px-2 py-1 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                      >
                        全置換
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── EditMode ─────────────────────────────────────────────────────────────────

function EditMode({
  result,
  onExitEdit,
}: {
  result: ProcessingResult;
  onExitEdit: () => void;
}) {
  const { cellCols, cellRows, settings } = result;

  // History state via useReducer for atomic updates
  const [editState, dispatch] = useReducer(historyReducer, {
    cellGrid: result.cellGrid,
    history: [result.cellGrid],
    historyIndex: 0,
  });
  const { cellGrid, historyIndex, history } = editState;

  const [selectedColor, setSelectedColor] = useState<YarnColor>(result.colorCounts[0]);
  const [tool, setTool] = useState<Tool>('paint');
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Refs for drag painting (no React state updates mid-drag)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const preDragGridRef = useRef<YarnColor[][] | null>(null);
  const currentDragGridRef = useRef<YarnColor[][]>(cellGrid);
  const selectedColorRef = useRef<YarnColor>(selectedColor);
  const toolRef = useRef<Tool>(tool);
  const paintedCellsRef = useRef<Set<string>>(new Set());

  // Keep refs in sync with React state
  useEffect(() => { currentDragGridRef.current = cellGrid; }, [cellGrid]);
  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { toolRef.current = tool; }, [tool]);

  // Derived color counts from current grid
  const colorCounts = useMemo(() => calcColorCounts(cellGrid), [cellGrid]);

  // ── keyboard shortcuts ──────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if ((e.key === 'e' || e.key === 'E') && (e.target as HTMLElement).tagName !== 'INPUT') {
        setTool((t) => (t === 'paint' ? 'eyedropper' : 'paint'));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── canvas rendering ────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, cellGrid, settings, cellCols, cellRows, hoverCell?.row ?? null, hoverCell?.col ?? null);
  }, [cellGrid, settings, cellCols, cellRows, hoverCell]);

  // ── canvas size ─────────────────────────────────────────────────────────────

  const canvasWidth = useMemo(
    () => cellStartX(cellCols - 1, settings) + settings.cellWidth,
    [cellCols, settings]
  );
  const canvasHeight = useMemo(
    () => cellStartY(cellRows - 1, settings) + settings.cellHeight,
    [cellRows, settings]
  );

  // ── canvas interaction helpers ──────────────────────────────────────────────

  const getCellFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { row: number; col: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const domRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / domRect.width;
      const scaleY = canvas.height / domRect.height;
      const x = (e.clientX - domRect.left) * scaleX;
      const y = (e.clientY - domRect.top) * scaleY;
      const col = getCellCol(x, settings, cellCols);
      const row = getCellRow(y, settings, cellRows);
      if (col === null || row === null) return null;
      return { row, col };
    },
    [settings, cellCols, cellRows]
  );

  // Paint one cell directly on canvas and into the drag ref (no React state update)
  const paintCellOnDrag = useCallback(
    (row: number, col: number): boolean => {
      const key = `${row}-${col}`;
      if (paintedCellsRef.current.has(key)) return false;
      paintedCellsRef.current.add(key);

      const color = selectedColorRef.current;
      const prev = currentDragGridRef.current;
      if (colorsEqual(prev[row][col], color)) return false;

      const newGrid = prev.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? color : c)) : r
      );
      currentDragGridRef.current = newGrid;

      // Immediate canvas feedback without React re-render
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const [cr, cg, cb] = color.rgb;
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.fillRect(
          cellStartX(col, settings),
          cellStartY(row, settings),
          settings.cellWidth,
          settings.cellHeight
        );
      }
      return true;
    },
    [settings]
  );

  // ── mouse event handlers ────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const cell = getCellFromEvent(e);
      if (!cell) return;

      if (toolRef.current === 'eyedropper') {
        setSelectedColor(currentDragGridRef.current[cell.row][cell.col]);
        setTool('paint');
        return;
      }

      preDragGridRef.current = currentDragGridRef.current;
      paintedCellsRef.current = new Set();
      isDrawingRef.current = true;
      paintCellOnDrag(cell.row, cell.col);
    },
    [getCellFromEvent, paintCellOnDrag]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const cell = getCellFromEvent(e);
      setHoverCell(cell);
      if (isDrawingRef.current && cell) {
        paintCellOnDrag(cell.row, cell.col);
      }
    },
    [getCellFromEvent, paintCellOnDrag]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current && preDragGridRef.current) {
      const after = currentDragGridRef.current;
      if (after !== preDragGridRef.current) {
        dispatch({ type: 'COMMIT', newGrid: after });
      }
      preDragGridRef.current = null;
    }
    isDrawingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
    handleMouseUp();
  }, [handleMouseUp]);

  // ── replace all ─────────────────────────────────────────────────────────────

  const handleReplaceAll = useCallback((targetColor: YarnColor) => {
    const currentColor = selectedColorRef.current;
    if (colorsEqual(targetColor, currentColor)) return;
    const newGrid = currentDragGridRef.current.map((row) =>
      row.map((cell) => (colorsEqual(cell, targetColor) ? currentColor : cell))
    );
    dispatch({ type: 'COMMIT', newGrid });
  }, []);

  // ── download ────────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const blob = await renderCellGridToBlob(currentDragGridRef.current, settings);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      a.download = `knitting-pattern-edited-${timestamp}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [settings]);

  // ── render ──────────────────────────────────────────────────────────────────

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="mx-auto max-w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mr-2">✏️ 編集モード</h2>

        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
          title="元に戻す (Ctrl+Z)"
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ↩ Undo
        </button>
        <button
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
          title="やり直す (Ctrl+Y)"
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ↪ Redo
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => setTool('paint')}
          title="ペイントツール"
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tool === 'paint'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🖌️ ペイント
        </button>
        <button
          onClick={() => setTool('eyedropper')}
          title="スポイトツール (E キー)"
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tool === 'eyedropper'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💧 スポイト
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">選択色:</span>
          <div
            className="w-7 h-7 rounded-md border-2 border-gray-400 shadow-sm flex-shrink-0"
            style={{
              backgroundColor: `rgb(${selectedColor.rgb[0]},${selectedColor.rgb[1]},${selectedColor.rgb[2]})`,
            }}
            title={`${selectedColor.type} ${selectedColor.colorNumber}`}
          />
          <span className="text-xs text-gray-600 max-w-[120px] truncate">
            {selectedColor.type} {selectedColor.colorNumber}
          </span>
        </div>

        <div className="flex-1" />

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {isDownloading ? '⏳ 生成中…' : '⬇ PNG ダウンロード'}
        </button>
        <button
          onClick={onExitEdit}
          className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 transition-colors"
        >
          ✕ 編集終了
        </button>
      </div>

      <p className="text-xs text-gray-400 pl-1">
        ヒント: Ctrl+Z で元に戻す / Ctrl+Y でやり直す / E キーでスポイト切替 / ドラッグで連続塗り
      </p>

      <div className="flex gap-4 items-start">
        {/* Canvas area */}
        <div
          className="flex-1 border border-gray-200 rounded-lg overflow-auto bg-gray-100 shadow-sm"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              cursor: tool === 'eyedropper' ? 'crosshair' : 'cell',
              display: 'block',
              imageRendering: 'pixelated',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        {/* Color palette side panel */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">使用色 ({colorCounts.length}色)</p>
              <p className="text-xs text-gray-400 mt-0.5">クリックで塗る色を選択 / 全置換で一括変換</p>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
              <table className="w-full text-sm">
                <tbody>
                  {colorCounts.map((color, i) => {
                    const isSelected = colorsEqual(color, selectedColor);
                    return (
                      <tr
                        key={i}
                        className={`border-t border-gray-100 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-100' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedColor(color)}
                      >
                        <td className="pl-3 py-2">
                          <div
                            className={`w-6 h-6 rounded border-2 transition-transform ${
                              isSelected ? 'border-indigo-500 scale-110' : 'border-gray-200'
                            }`}
                            style={{
                              backgroundColor: `rgb(${color.rgb[0]},${color.rgb[1]},${color.rgb[2]})`,
                            }}
                          />
                        </td>
                        <td className="px-2 py-2 text-gray-700 text-xs">
                          <span className="font-medium">{color.colorNumber}</span>
                          <span className="text-gray-400 ml-1">({color.count.toLocaleString()})</span>
                        </td>
                        <td className="pr-3 py-2 text-right">
                          <button
                            title={`この色をすべて「${selectedColor.type} ${selectedColor.colorNumber}」で置換`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReplaceAll(color);
                            }}
                            disabled={isSelected}
                            className="rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            全置換
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Full color count table at the bottom */}
      <ColorCountTable
        colorCounts={colorCounts}
        selectedColor={selectedColor}
        onColorClick={setSelectedColor}
        onReplaceAll={handleReplaceAll}
      />
    </div>
  );
}
