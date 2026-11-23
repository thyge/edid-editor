/**
 * Bit 7 of the options byte (byte 3) of a DisplayID 1.x Type I / 2.x Type VII
 * detailed timing descriptor changes meaning with the data block revision.
 * edid-decode parse_displayid_type_1_7_timing: with block revision < 2 it is
 * the "preferred" flag; from revision 2 on it means "YCbCr 4:2:0 supported"
 * and the timing is never reported as preferred.
 *
 * Kept in its own leaf module so both the v1.x codecs (a leaf themselves) and
 * the Type VII codec can share it without an import cycle.
 */

const OPTIONS_BIT7 = 0x80;
const YCBCR420_MIN_BLOCK_REVISION = 2;

/** `ycbcr420` is only present from block revision 2 on, where it exists. */
export function decodeOptionsBit7(
  options: number,
  blockRevision: number,
): { preferred: boolean; ycbcr420?: boolean } {
  const set = (options & OPTIONS_BIT7) !== 0;
  return blockRevision >= YCBCR420_MIN_BLOCK_REVISION
    ? { preferred: false, ycbcr420: set }
    : { preferred: set };
}

export function encodeOptionsBit7(
  timing: { preferred: boolean; ycbcr420?: boolean },
  blockRevision: number,
): number {
  const set = blockRevision >= YCBCR420_MIN_BLOCK_REVISION ? timing.ycbcr420 === true : timing.preferred;
  return set ? OPTIONS_BIT7 : 0;
}
