import type { YarnColor } from '../types';

const ENCODINGS_TO_TRY = ['utf-8', 'shift_jis', 'utf-16le', 'utf-16be'] as const;

function decodeWithBom(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // UTF-8 BOM: EF BB BF
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer);
  }

  // UTF-16 LE BOM: FF FE
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer);
  }

  // UTF-16 BE BOM: FE FF
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer);
  }

  // No BOM: try each encoding, pick the first that decodes without replacement characters
  for (const encoding of ENCODINGS_TO_TRY) {
    const decoded = new TextDecoder(encoding, { fatal: false }).decode(buffer);
    if (decoded.indexOf('\uFFFD') === -1) {
      return decoded;
    }
  }

  // Fallback to UTF-8 even if there are replacement characters
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

export async function loadPaletteFromFile(file: File): Promise<YarnColor[]> {
  const buffer = await file.arrayBuffer();
  const text = decodeWithBom(buffer);
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
