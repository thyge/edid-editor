/**
 * YCbCr 4:2:0 Video Data Block (CTA-861-G §7.5.11, Extended Tag 14)
 *
 * VCDB-family block (see `cta/vcdb/`): lists VICs that only support YCbCr 4:2:0.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';
import { isKnownVIC } from '../vic-table';

export interface YCbCr420VideoDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x0E;
  vics: Array<{
    vic: number;
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
    const byte = payload[i];
    const vic = byte & 0x7F;
    vics.push({
      vic,
      native: (byte & 0x80) !== 0,
      known: isKnownVIC(vic),
    });
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
    bytes.push((vic.native ? 0x80 : 0) | (vic.vic & 0x7F));
  }
  return new Uint8Array(bytes);
}