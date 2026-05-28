import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdProductIdentificationBlock,
  DisplayIdDecodeError,
} from './types';
import {
  decodeProductIdentificationBlock,
  encodeProductIdentificationBlock,
  isProductIdentificationPayloadLengthValid,
} from './product-identification';

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

  return block;
}

function encodeKnownPayload(block: DisplayIdDataBlock): Uint8Array {
  if (block.tag === DisplayIdDataBlockTag.ProductIdentification) {
    return encodeProductIdentificationBlock(block as DisplayIdProductIdentificationBlock);
  }

  return block.payload;
}
