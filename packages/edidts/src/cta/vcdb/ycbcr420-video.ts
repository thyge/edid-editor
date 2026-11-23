/**
 * YCbCr 4:2:0 Video Data Block (CTA-861-G §7.5.11, Extended Tag 14)
 *
 * VCDB-family block (see `cta/vcdb/`): lists VICs that only support YCbCr 4:2:0.
 * The body is a list of Short Video Descriptors with the same byte encoding as
 * the Video Data Block (edid-decode runs both through `cta_svd`), so it uses
 * the shared SVD codec: bytes 193–255 are VICs, not "native + VIC − 128".
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';
import { isKnownVIC, decodeSvd, encodeSvd } from '../vic-table';

export interface YCbCr420VideoDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x0E;
  /** One entry per SVD byte, in order (see `decodeSvd` / `encodeSvd`). */
  vics: Array<{
    /** VIC 1–127 or 193–255; the reserved bytes 0 and 128 come back as VIC 0 / 128. */
    vic: number;
    /** Native flag; only VICs 1–64 can carry it. */
    native: boolean;
    /**
     * True iff `vic` has a definition in the CTA-861 VIC table. Populated on
     * decode to flag unknown/reserved VIC values; encode ignores it so the
     * numeric `vic` round-trips verbatim. Optional so programmatic literals
     * type-check without supplying it.
     */
    known?: boolean;
  }>;
}

export function decodeYCbCr420VideoBlock(base: ExtendedDataBlock, payload: Uint8Array): YCbCr420VideoDataBlock {
  const vics: YCbCr420VideoDataBlock['vics'] = [];

  for (let i = 0; i < payload.length; i++) {
    const { vic, native } = decodeSvd(payload[i]);
    vics.push({ vic, native, known: isKnownVIC(vic) });
  }

  return {
    ...base,
    extendedTag: 0x0E,
    vics,
  };
}

export function encodeYCbCr420VideoBlock(block: YCbCr420VideoDataBlock): Uint8Array {
  const bytes = [0x0E];
  for (const vic of block.vics) {
    bytes.push(encodeSvd(vic.vic, vic.native));
  }
  return new Uint8Array(bytes);
}
