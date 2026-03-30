import type { ProcessingResult, ImageRect } from '../types';

function getAmazonProductUrl(asin: string): string {
  return `https://www.amazon.co.jp/dp/${asin}`;
}

interface ResultViewProps {
  result: ProcessingResult;
  originalImageUrl?: string | null;
  rect?: ImageRect | null;
  imageSize?: { width: number; height: number } | null;
}

export function ResultView({ result, originalImageUrl, rect, imageSize }: ResultViewProps) {
  const { pixelImageDataUrl, colorCounts } = result;

  const isFullImage = !rect || !imageSize ||
    (rect.x === 0 && rect.y === 0 &&
     rect.width === imageSize.width && rect.height === imageSize.height);

  const rectLeft   = rect && imageSize ? (rect.x / imageSize.width) * 100 : 0;
  const rectTop    = rect && imageSize ? (rect.y / imageSize.height) * 100 : 0;
  const rectWidth  = rect && imageSize ? (rect.width / imageSize.width) * 100 : 100;
  const rectHeight = rect && imageSize ? (rect.height / imageSize.height) * 100 : 100;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {originalImageUrl && (
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">元画像</h2>
            </div>
            <div className="relative border border-gray-200 rounded-lg overflow-hidden max-h-[65vh] bg-white shadow-sm">
              <img
                src={originalImageUrl}
                alt="アップロードした元画像"
                className="block max-w-full h-auto"
              />
              {/* Rect overlay: only when a sub-region was selected */}
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
                </>
              )}
            </div>
            {!isFullImage && rect && (
              <p className="text-xs text-gray-500 mt-1">
                処理範囲: ({Math.round(rect.x)}, {Math.round(rect.y)}) — {Math.round(rect.width)} × {Math.round(rect.height)} px
              </p>
            )}
          </section>
        )}

        <section className="min-w-0">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-800">生成結果</h2>
            <a
              href={pixelImageDataUrl}
              download="knitting-pattern.png"
              className="inline-flex w-full justify-center rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-700 sm:w-auto"
            >
              PNG ダウンロード
            </a>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-auto max-h-[65vh] bg-white shadow-sm">
            <img
              src={pixelImageDataUrl}
              alt="編み図"
              className="block max-w-full h-auto"
            />
          </div>
        </section>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {colorCounts.map((color, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{
                        backgroundColor: `rgb(${color.rgb[0]},${color.rgb[1]},${color.rgb[2]})`,
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-700">{color.type}</td>
                  <td className="px-3 py-2 text-gray-700">{color.colorNumber}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{color.count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {color.asin ? (
                      <a
                        href={getAmazonProductUrl(color.asin)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Amazon
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
