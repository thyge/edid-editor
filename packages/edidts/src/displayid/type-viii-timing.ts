import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
} from './types';

export function decodeTypeVIIITimingBlock(block: DisplayIdDataBlock): DisplayIdTypeVIIIEnumeratedTimingCodeBlock {
  return {
    ...block,
    tag: DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode,
    timingCodes: Array.from(block.payload),
  };
}

export function encodeTypeVIIITimingBlock(block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock): Uint8Array {
  return new Uint8Array(block.timingCodes.map((code) => code & 0xff));
}
