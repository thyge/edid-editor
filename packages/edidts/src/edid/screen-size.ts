/**
 * Screen size
 *
 * Per EDID 1.4 §3.6.2 / Table 3.12, the screen-size bytes (offsets 21-22) have
 * four valid encodings:
 *  - both 0 → undefined
 *  - h nonzero, v 0 → landscape aspect ratio (stored value = aspectRatio × 100 − 99)
 *  - h 0, v nonzero → portrait aspect ratio (stored value = 100 / aspectRatio − 99)
 *  - both nonzero → absolute size in cm
 *
 * Aspect-ratio decode (the inverse of the encode formulas above):
 *  - landscape: aspectRatio = (storedValue + 99) / 100
 *  - portrait:  aspectRatio = 100 / (storedValue + 99)
 *
 * The four cases are mutually exclusive, so a discriminated union expresses the
 * invariant instead of leaving four optional fields open to nonsense combinations.
 */

export type ScreenSize =
  | { type: 'undefined' }
  | { type: 'absolute'; horizontalCm: number; verticalCm: number }
  | { type: 'landscape-aspect'; encodedRatio: number }
  | { type: 'portrait-aspect'; encodedRatio: number };

export function decodeScreenSize(horizontal: number, vertical: number): ScreenSize {
  if (horizontal === 0 && vertical === 0) return { type: 'undefined' };
  if (vertical === 0) return { type: 'landscape-aspect', encodedRatio: horizontal };
  if (horizontal === 0) return { type: 'portrait-aspect', encodedRatio: vertical };
  return { type: 'absolute', horizontalCm: horizontal, verticalCm: vertical };
}

export function encodeScreenSize(size: ScreenSize): [number, number] {
  switch (size.type) {
    case 'undefined': return [0, 0];
    case 'absolute': return [size.horizontalCm, size.verticalCm];
    case 'landscape-aspect': return [size.encodedRatio, 0];
    case 'portrait-aspect': return [0, size.encodedRatio];
  }
}

/**
 * Decode a landscape aspect ratio from its stored byte value
 * (aspectRatio = (storedValue + 99) / 100; VESA E-EDID A2 §3.6.2).
 */
export function decodeScreenAspectRatioLandscape(storedValue: number): number {
  return (storedValue + 99) / 100;
}

/** Encode a landscape aspect ratio to its stored byte value (aspectRatio × 100 − 99). */
export function encodeScreenAspectRatioLandscape(aspectRatio: number): number {
  return Math.round(aspectRatio * 100 - 99);
}

/**
 * Decode a portrait aspect ratio from its stored byte value
 * (aspectRatio = 100 / (storedValue + 99); VESA E-EDID A2 §3.6.2).
 */
export function decodeScreenAspectRatioPortrait(storedValue: number): number {
  return 100 / (storedValue + 99);
}

/** Encode a portrait aspect ratio to its stored byte value (100 / aspectRatio − 99). */
export function encodeScreenAspectRatioPortrait(aspectRatio: number): number {
  return Math.round(100 / aspectRatio - 99);
}
