/**
 * Standard-timing aspect-ratio table
 *
 * Per EDID 1.4 §3.8 / Table 3.15, byte 2 of each Standard Timing Identifier
 * holds an aspect-ratio code in bits 7-6. The codes are sequential 2-bit
 * integers (0-3), so the values are stored as a positional array — the array
 * index *is* the on-the-wire code.
 *
 * Code 1 (4:3) is deliberately written as `1` rather than `0.3333` so the
 * height computation uses integer-friendly ratios.
 */

export interface StandardTimingAspect {
  widthRatio: number;
  heightRatio: number;
  label: string;
}

export const STANDARD_TIMING_ASPECTS: readonly StandardTimingAspect[] = [
  { widthRatio: 16, heightRatio: 10, label: '16:10' },
  { widthRatio: 4, heightRatio: 3, label: '4:3' },
  { widthRatio: 5, heightRatio: 4, label: '5:4' },
  { widthRatio: 16, heightRatio: 9, label: '16:9' },
] as const;

/** Decode the aspect-ratio code from the second byte of a standard timing slot. */
export function decodeStandardTimingAspectCode(byte2: number): number {
  return (byte2 >> 6) & 0x03;
}

/** Compute the height for a given pixel width and aspect-ratio code. */
export function heightFromStandardTimingAspect(width: number, code: number): number {
  const aspect = STANDARD_TIMING_ASPECTS[code];
  if (!aspect) return width;
  return Math.round((width * aspect.heightRatio) / aspect.widthRatio);
}

/** Find the closest standard-timing aspect code for a given width/height pair. */
export function standardTimingAspectCodeFor(width: number, height: number): number {
  if (height <= 0) return 3; // Default to 16:9
  const targetRatio = width / height;
  let best = 3;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let code = 0; code < STANDARD_TIMING_ASPECTS.length; code++) {
    const aspect = STANDARD_TIMING_ASPECTS[code];
    const diff = Math.abs(targetRatio - aspect.widthRatio / aspect.heightRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = code;
    }
  }
  return best;
}
