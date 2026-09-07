/**
 * YCbCr 4:2:0 Capability Map Data Block (CTA-861-G §7.5.12, Extended Tag 15)
 *
 * VCDB-family block (see `cta/vcdb/`): bitmap indicating which SVDs in the
 * Video Data Block also support 4:2:0.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';

export interface YCbCr420CapabilityMapDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x0F;
  capabilityBitmap: Uint8Array;  // Each bit corresponds to an SVD
}

export function decodeYCbCr420CapabilityMapBlock(base: ExtendedDataBlock, payload: Uint8Array): YCbCr420CapabilityMapDataBlock {
  return {
    ...base,
    extendedTag: 0x0F,
    capabilityBitmap: payload,
  };
}

export function encodeYCbCr420CapabilityMapBlock(block: YCbCr420CapabilityMapDataBlock): Uint8Array {
  const bytes = new Uint8Array(1 + block.capabilityBitmap.length);
  bytes[0] = 0x0F;
  bytes.set(block.capabilityBitmap, 1);
  return bytes;
}