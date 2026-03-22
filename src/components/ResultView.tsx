import type { ProcessingResult } from '../types';

function getAmazonProductUrl(asin: string): string {
  return `https://www.amazon.co.jp/dp/${asin}`;
}

interface ResultViewProps {
  result: ProcessingResult;
  originalImageUrl?: string | null;
}

export function ResultView({ result, originalImageUrl }: ResultViewProps) {
  const { pixelImageDataUrl, colorCounts } = result;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {originalImageUrl && (
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">元画像</h2>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-auto max-h-[65vh] bg-white shadow-sm">
              <img
                src={originalImageUrl}
                alt="アップロードした元画像"
                className="block max-w-full h-auto"
              />
            </div>
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
