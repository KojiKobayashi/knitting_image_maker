// K-means クラスタリング（LAB色空間）

function distSq(pixels: Float32Array, pidx: number, centers: Float32Array, cidx: number, lWeight = 1): number {
  const dL = pixels[pidx] - centers[cidx];
  const da = pixels[pidx + 1] - centers[cidx + 1];
  const db = pixels[pidx + 2] - centers[cidx + 2];
  return lWeight * dL * dL + da * da + db * db;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function calcPixelSeed(pixels: Float32Array, n: number): number {
  let seed = 2166136261;
  const stride = Math.max(1, Math.floor(n / 1024));
  for (let i = 0; i < n; i += stride) {
    seed ^= (pixels[i * 3] * 1000) | 0;
    seed = Math.imul(seed, 16777619);
    seed ^= (pixels[i * 3 + 1] * 1000) | 0;
    seed = Math.imul(seed, 16777619);
    seed ^= (pixels[i * 3 + 2] * 1000) | 0;
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function kMeansPlusPlus(
  pixels: Float32Array,
  n: number,
  k: number,
  random: () => number,
  lWeight: number
): Float32Array {
  const centers = new Float32Array(k * 3);
  // 最初のセンターをランダムに選択
  const firstIdx = Math.floor(random() * n) * 3;
  centers[0] = pixels[firstIdx];
  centers[1] = pixels[firstIdx + 1];
  centers[2] = pixels[firstIdx + 2];

  const dists = new Float32Array(n);

  for (let ci = 1; ci < k; ci++) {
    let totalDist = 0;
    for (let i = 0; i < n; i++) {
      let minD = Infinity;
      for (let j = 0; j < ci; j++) {
        const d = distSq(pixels, i * 3, centers, j * 3, lWeight);
        if (d < minD) minD = d;
      }
      dists[i] = minD;
      totalDist += minD;
    }
    // 距離に比例した確率でサンプリング
    let threshold = random() * totalDist;
    let chosen = n - 1;
    for (let i = 0; i < n; i++) {
      threshold -= dists[i];
      if (threshold <= 0) { chosen = i; break; }
    }
    centers[ci * 3] = pixels[chosen * 3];
    centers[ci * 3 + 1] = pixels[chosen * 3 + 1];
    centers[ci * 3 + 2] = pixels[chosen * 3 + 2];
  }
  return centers;
}

export interface KMeansResult {
  centers: Float32Array;
  labels: Uint8Array;
}

export interface KMeansOptions {
  useSampling?: boolean;
  sampleLimit?: number;
  maxIter?: number;
  convergenceThreshold?: number;
  lWeight?: number;
}

export function runKMeans(
  allPixels: Float32Array,
  totalPixels: number,
  k: number,
  options: KMeansOptions = {}
): KMeansResult {
  const {
    useSampling = false,
    sampleLimit = 100_000,
    maxIter = 10,
    convergenceThreshold = 1.0,
    lWeight = 1,
  } = options;
  const useSampledPixels = useSampling && totalPixels > sampleLimit;
  const step = useSampledPixels ? Math.max(1, Math.floor(totalPixels / sampleLimit)) : 1;
  const sampleCount = useSampledPixels ? Math.ceil(totalPixels / step) : totalPixels;
  const sample = new Float32Array(sampleCount * 3);

  for (let i = 0, si = 0; i < totalPixels; i += step, si++) {
    sample[si * 3] = allPixels[i * 3];
    sample[si * 3 + 1] = allPixels[i * 3 + 1];
    sample[si * 3 + 2] = allPixels[i * 3 + 2];
  }

  const random = useSampledPixels ? Math.random : createSeededRandom(calcPixelSeed(sample, sampleCount));
  let centers = kMeansPlusPlus(sample, sampleCount, k, random, lWeight);

  for (let iter = 0; iter < maxIter; iter++) {
    // アサインメントステップ
    const sums = new Float64Array(k * 3);
    const counts = new Uint32Array(k);

    for (let i = 0; i < sampleCount; i++) {
      let minD = Infinity;
      let label = 0;
      for (let j = 0; j < k; j++) {
        const d = distSq(sample, i * 3, centers, j * 3, lWeight);
        if (d < minD) { minD = d; label = j; }
      }
      sums[label * 3] += sample[i * 3];
      sums[label * 3 + 1] += sample[i * 3 + 1];
      sums[label * 3 + 2] += sample[i * 3 + 2];
      counts[label]++;
    }

    // アップデートステップ
    let maxChange = 0;
    const newCenters = new Float32Array(k * 3);
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        newCenters[j * 3] = sums[j * 3] / counts[j];
        newCenters[j * 3 + 1] = sums[j * 3 + 1] / counts[j];
        newCenters[j * 3 + 2] = sums[j * 3 + 2] / counts[j];
      } else {
        newCenters[j * 3] = centers[j * 3];
        newCenters[j * 3 + 1] = centers[j * 3 + 1];
        newCenters[j * 3 + 2] = centers[j * 3 + 2];
      }
      const change = distSq(newCenters, j * 3, centers, j * 3, lWeight);
      if (change > maxChange) maxChange = change;
    }
    centers = newCenters;
    if (maxChange < convergenceThreshold) break;
  }

  // 全ピクセルをラベリング
  const labels = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    let minD = Infinity;
    let label = 0;
    for (let j = 0; j < k; j++) {
      const d = distSq(allPixels, i * 3, centers, j * 3, lWeight);
      if (d < minD) { minD = d; label = j; }
    }
    labels[i] = label;
  }

  return { centers, labels };
}
