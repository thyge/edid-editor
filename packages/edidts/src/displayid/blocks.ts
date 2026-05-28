import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdProductIdentificationBlock,
  type DisplayIdWarning,
} from './types';
import {
  decodeProductIdentificationBlock,
  encodeProductIdentificationBlock,
  isProductIdentificationPayloadLengthValid,
} from './product-identification';

export interface DecodeBlocksResult {
  blocks: DisplayIdDataBlock[];
  fillBytes: number;
  warnings: DisplayIdWarning[];
}

export function decodeDisplayIdBlocks(
  data: Uint8Array,
  startOffset: number,
  endOffset: number,
): DecodeBlocksResult {
  const blocks: DisplayIdDataBlock[] = [];
  const warnings: DisplayIdWarning[] = [];
  let offset = startOffset;
  let fillBytes = 0;

  while (offset < endOffset) {
    const tag = data[offset];

    if (tag === 0x00) {
      fillBytes = endOffset - offset;
      warnings.push({
        code: 'trailing_fill',
        offset,
        message: `DisplayID section contains ${fillBytes} trailing fill byte${fillBytes === 1 ? '' : 's'}`,
      });
      break;
    }

    if (offset + 3 > endOffset) {
      warnings.push({
        code: 'block_length_overflow',
        offset,
        message: 'DisplayID data block header extends past the section payload',
      });
      break;
    }

    const revisionAndFlags = data[offset + 1];
    const payloadLength = data[offset + 2];
    const blockEnd = offset + 3 + payloadLength;

    if (blockEnd > endOffset) {
      warnings.push({
        code: 'block_length_overflow',
        offset,
        message: `DisplayID data block at offset ${offset} declares ${payloadLength} payload bytes past the section payload`,
      });
      break;
    }

    if (tag < DisplayIdDataBlockTag.ProductIdentification) {
      warnings.push({
        code: 'reserved_legacy_tag',
        offset,
        message: `DisplayID v2.0 reserves legacy data block tag 0x${tag.toString(16).padStart(2, '0')}`,
      });
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

  return { blocks, fillBytes, warnings };
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
