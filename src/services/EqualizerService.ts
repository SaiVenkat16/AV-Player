import { MainAudioFx } from '../native/MainAudioFx';

const UI_BANDS = 5;

const PRESETS: Record<string, readonly number[]> = {
  Normal: [0, 0, 0, 0, 0],
  'Bass+': [6, 3, 0, -1, -2],
  Pop: [-1, 3, 4, 3, 1],
  Rock: [4, 2, -2, 1, 4],
  Jazz: [3, 2, 1, 2, 3],
  Classical: [3, 1, -1, 2, 4],
  Vocal: [-2, -1, 2, 4, 3],
};

function dbToMillibel(db: number): number {
  return Math.round(db * 100);
}

function mapUiGainsToAndroidBands(
  androidBandCount: number,
  uiGainsDb: readonly number[],
): number[] {
  if (androidBandCount <= 0) {
    return [];
  }
  const out = new Array(androidBandCount).fill(0) as number[];
  const n = androidBandCount;
  for (let ui = 0; ui < UI_BANDS; ui += 1) {
    const t = ui / (UI_BANDS - 1 || 1);
    const pos = t * (n - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(n - 1, lo + 1);
    const f = pos - lo;
    const g = uiGainsDb[ui] ?? 0;
    out[lo] = (out[lo] ?? 0) + g * (1 - f);
    if (hi !== lo) {
      out[hi] = (out[hi] ?? 0) + g * f;
    }
  }
  return out;
}

let cachedBandCount: number | null = null;

async function resolveBandCount(): Promise<number> {
  if (cachedBandCount != null) {
    return cachedBandCount;
  }
  if (!MainAudioFx) {
    cachedBandCount = UI_BANDS;
    return UI_BANDS;
  }
  try {
    const c = await MainAudioFx.getBandCount();
    cachedBandCount = Math.max(1, c);
    return cachedBandCount;
  } catch {
    cachedBandCount = UI_BANDS;
    return UI_BANDS;
  }
}

export const EqualizerService = {
  presets: PRESETS,
  async applyBandsDb(uiGainsDb: readonly number[]): Promise<void> {
    if (!MainAudioFx) {
      return;
    }
    const n = await resolveBandCount();
    const mapped = mapUiGainsToAndroidBands(n, uiGainsDb);
    MainAudioFx.setGlobalFxEnabled(true);
    for (let i = 0; i < n; i += 1) {
      const mb = dbToMillibel(mapped[i] ?? 0);
      MainAudioFx.setBandMillibels(i, mb);
    }
  },
  async reset(): Promise<void> {
    if (!MainAudioFx) {
      return;
    }
    MainAudioFx.resetBands();
  },
  setBassBoost(enabled: boolean): void {
    MainAudioFx?.setBassBoostEnabled(enabled, enabled ? 800 : 0);
  },
  setSurround(enabled: boolean): void {
    MainAudioFx?.setVirtualizerEnabled(enabled, enabled ? 700 : 0);
  },
};
