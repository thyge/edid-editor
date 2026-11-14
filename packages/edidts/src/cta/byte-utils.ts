/**
 * Small helpers shared by the CTA-861 block codecs.
 *
 * Encoders write model numbers into fixed-width bit fields. A plain `& 0xff`
 * (or a Uint8Array store) silently wraps an out-of-range value into a
 * different, valid-looking one, so the codecs clamp instead: a value the
 * field cannot hold is pinned to the nearest value it can.
 */

/** Round `value` and pin it into [min, max]; non-finite input becomes `min`. */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Clamp to an unsigned 8-bit byte. */
export function clampByte(value: number): number {
  return clampInt(value, 0, 0xff);
}

/**
 * Keep a decoded block's original (spec-violating) short length.
 *
 * Some real EDIDs carry blocks shorter than the layout's minimum (for
 * example a Colorimetry block with only its first flag byte). Decoders read
 * the missing bytes as 0 and remember the original length; encoders build
 * the full-length body and pass it through here, which drops the bytes past
 * `shortLength` again while they are still zero. As soon as an edit needs one
 * of those bytes (a non-zero value), the block grows just far enough to hold
 * it — so an unedited block keeps its length and an edit only adds what it
 * must.
 */
export function keepShortLength(bytes: Uint8Array, shortLength: number | undefined): Uint8Array {
  if (shortLength === undefined || shortLength >= bytes.length) return bytes;
  let end = bytes.length;
  while (end > shortLength && bytes[end - 1] === 0) end--;
  return end === bytes.length ? bytes : bytes.slice(0, end);
}
