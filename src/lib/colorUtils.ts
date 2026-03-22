import type { YarnColor } from '../types';

function gammaToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbLinearToXyz(r: number, g: number, b: number): [number, number, number] {
  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
  ];
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x / 0.95047);
  const fy = f(y / 1.00000);
  const fz = f(z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbLinearToXyz(gammaToLinear(r), gammaToLinear(g), gammaToLinear(b));
  return xyzToLab(x, y, z);
}

function labDistance(lab1: [number, number, number], lab2: [number, number, number]): number {
  return (lab1[0] - lab2[0]) ** 2 + (lab1[1] - lab2[1]) ** 2 + (lab1[2] - lab2[2]) ** 2;
}

export function mapCentersToPalette(
  centerLabs: Array<[number, number, number]>,
  palette: YarnColor[]
): YarnColor[] {
  const paletteLabs = palette.map(c => rgbToLab(...c.rgb));
  return centerLabs.map(centerLab => {
    let minDist = Infinity;
    let nearest = palette[0];
    paletteLabs.forEach((palLab, i) => {
      const d = labDistance(centerLab, palLab);
      if (d < minDist) { minDist = d; nearest = palette[i]; }
    });
    return nearest;
  });
}
