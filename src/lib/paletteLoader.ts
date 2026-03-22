import type { YarnColor } from '../types';

export async function loadPaletteFromFile(file: File): Promise<YarnColor[]> {
  const text = await file.text();
  const cleaned = text.replace(/^\uFEFF/, ''); // UTF-8-SIG (BOM) 除去
  const lines = cleaned.split(/\r?\n/);
  const result: YarnColor[] = [];

  // 1行目はヘッダー行としてスキップ
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    if (cols.length < 5) continue;

    const type = cols[0].trim();
    const colorNumber = cols[1].trim();
    const rStr = cols[2].trim();
    const gStr = cols[3].trim();
    const bStr = cols[4].trim();
    const asin = cols[5]?.trim();

    if (!type || !colorNumber) continue;

    const r = parseInt(rStr, 10);
    const g = parseInt(gStr, 10);
    const b = parseInt(bStr, 10);

    if (
      isNaN(r) || isNaN(g) || isNaN(b) ||
      r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255
    ) continue;

    result.push({
      type,
      colorNumber,
      rgb: [r, g, b],
      ...(asin ? { asin } : {}),
    });
  }

  return result;
}
