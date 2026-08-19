import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
} from './types';

/**
 * DisplayID 2.0 §4.3.2 Type VIII Enumerated Timing Code block (Table 4-19).
 *
 * The timing-code type (bits 7:6) and size (bit 3) live in the block header
 * revision/flags byte. `block.flags` (= byte1 >> 3) is the authoritative source:
 *   codeType = (flags >> 3) & 0x03   // byte1 bits 7:6
 *   codeSize = (flags & 0x01) ? 2 : 1 // byte1 bit 3
 * The payload is a list of `codeSize`-byte little-endian codes.
 */

/** A Type VIII payload is valid when its length is a multiple of the code size derived from `flags`. */
export function isTypeVIIITimingPayloadLengthValid(length: number, flags: number): boolean {
  const codeSize = (flags & 0x01) ? 2 : 1;
  return length % codeSize === 0;
}

export function decodeTypeVIIITimingBlock(block: DisplayIdDataBlock): DisplayIdTypeVIIIEnumeratedTimingCodeBlock {
  const codeSize = (block.flags & 0x01) ? 2 : 1;
  const timingCodes: number[] = [];

  for (let offset = 0; offset + codeSize <= block.payload.length; offset += codeSize) {
    if (codeSize === 2) {
      timingCodes.push((block.payload[offset] ?? 0) | ((block.payload[offset + 1] ?? 0) << 8));
    } else {
      timingCodes.push(block.payload[offset] ?? 0);
    }
  }

  return {
    ...block,
    tag: DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode,
    codeType: (block.flags >> 3) & 0x03,
    codeSize,
    timingCodes,
  };
}

export function encodeTypeVIIITimingBlock(block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock): Uint8Array {
  const payload = new Uint8Array(block.timingCodes.length * block.codeSize);

  block.timingCodes.forEach((code, index) => {
    const offset = index * block.codeSize;
    if (block.codeSize === 2) {
      payload[offset] = code & 0xff;
      payload[offset + 1] = (code >> 8) & 0xff;
    } else {
      payload[offset] = code & 0xff;
    }
  });

  return payload;
}