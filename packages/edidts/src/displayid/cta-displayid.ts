import {
  DisplayIdDataBlockTag,
  type DisplayIdCtaBlock,
  type DisplayIdDataBlock,
} from './types';

export function decodeCtaDisplayIdBlock(block: DisplayIdDataBlock): DisplayIdCtaBlock {
  return {
    ...block,
    tag: DisplayIdDataBlockTag.CtaDisplayId,
    ctaPayload: block.payload.slice(),
  };
}

export function encodeCtaDisplayIdBlock(block: DisplayIdCtaBlock): Uint8Array {
  return block.ctaPayload.slice();
}
