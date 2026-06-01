import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDisplayParametersBlock,
  type DisplayIdProductIdentificationBlock,
  type DisplayIdTypeVIIDetailedTimingBlock,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
  DisplayIdDecodeError,
} from './types';
import {
  decodeDisplayParametersBlock,
  encodeDisplayParametersBlock,
  isDisplayParametersPayloadLengthValid,
} from './display-parameters';
import {
  decodeProductIdentificationBlock,
  encodeProductIdentificationBlock,
  isProductIdentificationPayloadLengthValid,
} from './product-identification';
import {
  decodeTypeVIITimingBlock,
  encodeTypeVIITimingBlock,
  isTypeVIITimingPayloadLengthValid,
} from './type-vii-timing';
import {
  decodeTypeVIIITimingBlock,
  encodeTypeVIIITimingBlock,
} from './type-viii-timing';
import {
  decodeTypeIXTimingBlock,
  encodeTypeIXTimingBlock,
  isTypeIXTimingPayloadLengthValid,
} from './type-ix-timing';

export interface DecodeBlocksResult {
  blocks: DisplayIdDataBlock[];
  fillBytes: number;
}

export function decodeDisplayIdBlocks(
  data: Uint8Array,
  startOffset: number,
  endOffset: number,
): DecodeBlocksResult {
  const blocks: DisplayIdDataBlock[] = [];
  let offset = startOffset;
  let fillBytes = 0;

  while (offset < endOffset) {
    const tag = data[offset];

    if (tag === 0x00) {
      fillBytes = endOffset - offset;
      break;
    }

    if (offset + 3 > endOffset) {
      throw new DisplayIdDecodeError('DisplayID data block header extends past the section payload');
    }

    const revisionAndFlags = data[offset + 1];
    const payloadLength = data[offset + 2];
    const blockEnd = offset + 3 + payloadLength;

    if (blockEnd > endOffset) {
      throw new DisplayIdDecodeError(
        `DisplayID data block at offset ${offset} declares ${payloadLength} payload bytes past the section payload`,
      );
    }

    if (tag < DisplayIdDataBlockTag.ProductIdentification) {
      throw new DisplayIdDecodeError(
        `DisplayID v2.0 reserves legacy data block tag 0x${tag.toString(16).padStart(2, '0')}`,
      );
    }

    const genericBlock: DisplayIdDataBlock = {
      tag,
      revision: revisionAndFlags & 0x07,
      flags: revisionAndFlags >> 3,
      payloadLength,
      payload: data.slice(offset + 3, blockEnd),
    };

    blocks.push(decodeKnownBlock(genericBlock));

    offset = blockEnd;
  }

  return { blocks, fillBytes };
}

export function encodeDisplayIdBlock(block: DisplayIdDataBlock): Uint8Array {
  const payload = encodeKnownPayload(block);

  if (payload.length > 0xff) {
    throw new Error(
      `DisplayID data block 0x${block.tag.toString(16).padStart(2, '0')} payload length ${payload.length} exceeds 255 bytes`,
    );
  }

  const encoded = new Uint8Array(3 + payload.length);

  encoded[0] = block.tag & 0xff;
  encoded[1] = ((block.flags & 0x1f) << 3) | (block.revision & 0x07);
  encoded[2] = payload.length & 0xff;
  encoded.set(payload, 3);

  return encoded;
}

function decodeKnownBlock(block: DisplayIdDataBlock): DisplayIdDataBlock {
  if (
    block.tag === DisplayIdDataBlockTag.ProductIdentification &&
    isProductIdentificationPayloadLengthValid(block.payloadLength)
  ) {
    return decodeProductIdentificationBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.DisplayParameters &&
    isDisplayParametersPayloadLengthValid(block.payloadLength)
  ) {
    return decodeDisplayParametersBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.TypeVIIDetailedTiming &&
    isTypeVIITimingPayloadLengthValid(block.payloadLength)
  ) {
    return decodeTypeVIITimingBlock(block);
  }

  if (block.tag === DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode) {
    return decodeTypeVIIITimingBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.TypeIXFormulaBasedTiming &&
    isTypeIXTimingPayloadLengthValid(block.payloadLength)
  ) {
    return decodeTypeIXTimingBlock(block);
  }

  return block;
}

function encodeKnownPayload(block: DisplayIdDataBlock): Uint8Array {
  if (block.tag === DisplayIdDataBlockTag.ProductIdentification) {
    return encodeProductIdentificationBlock(block as DisplayIdProductIdentificationBlock);
  }

  if (isTypedDisplayParametersBlock(block)) {
    return encodeDisplayParametersBlock(block as DisplayIdDisplayParametersBlock);
  }

  if (isTypedTypeVIITimingBlock(block)) {
    return encodeTypeVIITimingBlock(block);
  }

  if (isTypedTypeVIIITimingBlock(block)) {
    return encodeTypeVIIITimingBlock(block);
  }

  if (isTypedTypeIXTimingBlock(block)) {
    return encodeTypeIXTimingBlock(block);
  }

  return block.payload;
}

function isTypedDisplayParametersBlock(block: DisplayIdDataBlock): block is DisplayIdDisplayParametersBlock {
  return (
    block.tag === DisplayIdDataBlockTag.DisplayParameters &&
    isDisplayParametersPayloadLengthValid(block.payloadLength) &&
    typeof (block as Partial<DisplayIdDisplayParametersBlock>).horizontalImageSizeMm === 'number' &&
    typeof (block as Partial<DisplayIdDisplayParametersBlock>).verticalImageSizeMm === 'number'
  );
}

function isTypedTypeVIITimingBlock(block: DisplayIdDataBlock): block is DisplayIdTypeVIIDetailedTimingBlock {
  const maybeBlock = block as Partial<DisplayIdTypeVIIDetailedTimingBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TypeVIIDetailedTiming &&
    Array.isArray(maybeBlock.timings) &&
    maybeBlock.timings.every((timing) => (
      typeof timing.pixelClockKHz === 'number' &&
      typeof timing.horizontalActive === 'number' &&
      typeof timing.horizontalBlanking === 'number' &&
      typeof timing.horizontalSyncOffset === 'number' &&
      typeof timing.horizontalSyncWidth === 'number' &&
      typeof timing.verticalActive === 'number' &&
      typeof timing.verticalBlanking === 'number' &&
      typeof timing.verticalSyncOffset === 'number' &&
      typeof timing.verticalSyncWidth === 'number' &&
      typeof timing.preferred === 'boolean' &&
      typeof timing.interlaced === 'boolean'
    ))
  );
}

function isTypedTypeVIIITimingBlock(block: DisplayIdDataBlock): block is DisplayIdTypeVIIIEnumeratedTimingCodeBlock {
  const maybeBlock = block as Partial<DisplayIdTypeVIIIEnumeratedTimingCodeBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode &&
    Array.isArray(maybeBlock.timingCodes) &&
    maybeBlock.timingCodes.every((code) => typeof code === 'number')
  );
}

function isTypedTypeIXTimingBlock(block: DisplayIdDataBlock): block is DisplayIdTypeIXFormulaBasedTimingBlock {
  const maybeBlock = block as Partial<DisplayIdTypeIXFormulaBasedTimingBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TypeIXFormulaBasedTiming &&
    Array.isArray(maybeBlock.timings) &&
    maybeBlock.timings.every((timing) => (
      typeof timing.horizontalActive === 'number' &&
      typeof timing.verticalActive === 'number' &&
      typeof timing.refreshRateHz === 'number' &&
      typeof timing.preferred === 'boolean' &&
      typeof timing.reducedBlanking === 'boolean'
    ))
  );
}
