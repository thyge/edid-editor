/**
 * Screen size
 *
 * Per EDID 1.4 §3.6 / Table 3.12, the screen-size bytes (offsets 21-22) have
 * four valid encodings:
 *  - both 0 → undefined
 *  - h nonzero, v 0 → landscape aspect ratio (encoded as `(ratio - 1) * 100 + 99`)
 *  - h 0, v nonzero → portrait aspect ratio (encoded as `(100 / ratio) - 99`)
 *  - both nonzero → absolute size in cm
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
