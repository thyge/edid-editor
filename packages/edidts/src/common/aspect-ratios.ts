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
 *
 * Version note: EDID 1.3 (and earlier 1.x) defined aspect-ratio code 0 as 1:1
 * (square). EDID 1.4 redefined code 0 as 16:10. Callers that know the declared
 * EDID version pass `edidVersion`/`edidRevision` so the correct table is used;
 * when omitted, the EDID 1.4 table is assumed (the prior behavior).
 */

export interface StandardTimingAspect {
  widthRatio: number;
  heightRatio: number;
  label: string;
}

/**
 * EDID 1.4 standard-timing aspect-ratio table. Index = on-the-wire code.
 * Code 0 = 16:10 (changed from EDID 1.3's 1:1).
 */
export const STANDARD_TIMING_ASPECTS: readonly StandardTimingAspect[] = [
  { widthRatio: 16, heightRatio: 10, label: '16:10' },
  { widthRatio: 4, heightRatio: 3, label: '4:3' },
  { widthRatio: 5, heightRatio: 4, label: '5:4' },
  { widthRatio: 16, heightRatio: 9, label: '16:9' },
] as const;

/**
 * EDID 1.0–1.3 standard-timing aspect-ratio table. Index = on-the-wire code.
 * Code 0 = 1:1 (square) per EDID 1.3 §3.9 / Table 3.12. Codes 1–3 are unchanged.
 */
export const STANDARD_TIMING_ASPECTS_PRE_1_4: readonly StandardTimingAspect[] = [
  { widthRatio: 1, heightRatio: 1, label: '1:1' },
  { widthRatio: 4, heightRatio: 3, label: '4:3' },
  { widthRatio: 5, heightRatio: 4, label: '5:4' },
  { widthRatio: 16, heightRatio: 9, label: '16:9' },
] as const;

/**
 * True when the declared EDID version uses the 1.4 aspect-ratio table (code 0 =
 * 16:10). EDID 1.4+ and EDID 2.0 use it; EDID 1.0–1.3 use the pre-1.4 table
 * (code 0 = 1:1). When no version is given, defaults to the 1.4 table (the
 * prior behavior).
 */
export function isEdid14OrLater(edidVersion?: number, edidRevision?: number): boolean {
  if (edidVersion === undefined) return true;
  if (edidVersion > 1) return true;
  if (edidVersion < 1) return false;
  // version === 1: 1.4+ uses the new table.
  return (edidRevision ?? 4) >= 4;
}

/** Resolve the standard-timing aspect-ratio table for a given EDID version. */
export function standardTimingAspectTable(
  edidVersion?: number,
  edidRevision?: number,
): readonly StandardTimingAspect[] {
  return isEdid14OrLater(edidVersion, edidRevision)
    ? STANDARD_TIMING_ASPECTS
    : STANDARD_TIMING_ASPECTS_PRE_1_4;
}

/** Decode the aspect-ratio code from the second byte of a standard timing slot. */
export function decodeStandardTimingAspectCode(byte2: number): number {
  return (byte2 >> 6) & 0x03;
}

/**
 * Compute the height for a given pixel width and aspect-ratio code. Pass the
 * declared EDID version so code 0 resolves to 1:1 (1.0–1.3) or 16:10 (1.4+).
 */
export function heightFromStandardTimingAspect(
  width: number,
  code: number,
  edidVersion?: number,
  edidRevision?: number,
): number {
  const aspect = standardTimingAspectTable(edidVersion, edidRevision)[code];
  if (!aspect) return width;
  return Math.round((width * aspect.heightRatio) / aspect.widthRatio);
}

/**
 * Find the closest standard-timing aspect code for a given width/height pair.
 * Pass the declared EDID version so code 0 maps to the right aspect on encode.
 */
export function standardTimingAspectCodeFor(
  width: number,
  height: number,
  edidVersion?: number,
  edidRevision?: number,
): number {
  const table = standardTimingAspectTable(edidVersion, edidRevision);
  if (height <= 0) return 3; // Default to 16:9
  const targetRatio = width / height;
  let best = 3;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let code = 0; code < table.length; code++) {
    const aspect = table[code];
    const diff = Math.abs(targetRatio - aspect.widthRatio / aspect.heightRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = code;
    }
  }
  return best;
}
