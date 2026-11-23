/**
 * Field clamping shared by the DisplayID block codecs.
 *
 * Encoders write model numbers into fixed-width bit fields. A plain `& 0xff`
 * (or a Uint8Array store) silently wraps an out-of-range value into a
 * different, valid-looking one — 300 becomes 44 — so the codecs clamp
 * instead: a value the field cannot hold is pinned to the nearest one it can.
 */

/** Round `value` and pin it into [min, max]; non-finite input becomes `min`. */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Clamp to an unsigned field `bits` wide (0 .. 2^bits - 1). */
export function clampBits(value: number, bits: number): number {
  return clampInt(value, 0, 2 ** bits - 1);
}

/**
 * Clamp a "stored minus one" field: the model holds the human value
 * (1 .. 2^bits) and the wire holds value - 1.
 */
export function clampMinusOne(value: number, bits: number): number {
  return clampInt(value, 1, 2 ** bits) - 1;
}
