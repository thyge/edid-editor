import { describe, it, expect } from 'vitest';
import {
  decodeScreenSize,
  encodeScreenSize,
  decodeScreenAspectRatioLandscape,
  encodeScreenAspectRatioLandscape,
  decodeScreenAspectRatioPortrait,
  encodeScreenAspectRatioPortrait,
} from '../src/edid';

describe('Screen size decode/encode', () => {
  it('decodes the four cases', () => {
    expect(decodeScreenSize(0, 0)).toEqual({ type: 'undefined' });
    expect(decodeScreenSize(30, 0)).toEqual({ type: 'landscape-aspect', encodedRatio: 30 });
    expect(decodeScreenSize(0, 30)).toEqual({ type: 'portrait-aspect', encodedRatio: 30 });
    expect(decodeScreenSize(53, 30)).toEqual({ type: 'absolute', horizontalCm: 53, verticalCm: 30 });
  });

  it('encode reverses decode for each case', () => {
    expect(encodeScreenSize({ type: 'undefined' })).toEqual([0, 0]);
    expect(encodeScreenSize({ type: 'landscape-aspect', encodedRatio: 30 })).toEqual([30, 0]);
    expect(encodeScreenSize({ type: 'portrait-aspect', encodedRatio: 30 })).toEqual([0, 30]);
    expect(encodeScreenSize({ type: 'absolute', horizontalCm: 53, verticalCm: 30 })).toEqual([53, 30]);
  });
});

describe('Screen-size aspect-ratio helpers (VESA E-EDID A2 §3.6.2)', () => {
  it('landscape: aspectRatio = (stored + 99) / 100; stored = aspectRatio * 100 - 99', () => {
    // 16:9 ≈ 1.78 → stored = round(1.78*100 - 99) = 79
    expect(encodeScreenAspectRatioLandscape(16 / 9)).toBe(79);
    expect(decodeScreenAspectRatioLandscape(79)).toBeCloseTo((79 + 99) / 100, 10);
    // round-trip
    const stored = encodeScreenAspectRatioLandscape(1.5);
    expect(decodeScreenAspectRatioLandscape(stored)).toBeCloseTo((stored + 99) / 100, 10);
  });

  it('portrait: aspectRatio = 100 / (stored + 99); stored = 100 / aspectRatio - 99', () => {
    // 9:16 ≈ 0.5625 → stored = round(100/0.5625 - 99) = round(177.78 - 99) = 79
    expect(encodeScreenAspectRatioPortrait(9 / 16)).toBe(79);
    expect(decodeScreenAspectRatioPortrait(79)).toBeCloseTo(100 / (79 + 99), 10);
    // round-trip
    const stored = encodeScreenAspectRatioPortrait(0.5);
    expect(decodeScreenAspectRatioPortrait(stored)).toBeCloseTo(100 / (stored + 99), 10);
  });

  it('landscape and portrait are inverses by construction (same stored byte)', () => {
    // A landscape 1.78 and its portrait inverse 1/1.78 ≈ 0.5625 encode to
    // different stored values but each reconstructs its own ratio.
    const ls = encodeScreenAspectRatioLandscape(1.78);
    const pt = encodeScreenAspectRatioPortrait(1 / 1.78);
    expect(decodeScreenAspectRatioLandscape(ls)).toBeCloseTo(1.78, 1);
    expect(decodeScreenAspectRatioPortrait(pt)).toBeCloseTo(1 / 1.78, 1);
  });
});