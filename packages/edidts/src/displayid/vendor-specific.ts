import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdVendorSpecificBlock,
} from './types';

export function decodeVendorSpecificBlock(block: DisplayIdDataBlock): DisplayIdVendorSpecificBlock {
  const typedBlock: DisplayIdVendorSpecificBlock = {
    ...block,
    tag: DisplayIdDataBlockTag.VendorSpecific,
  };

  if (block.payload.length >= 3) {
    typedBlock.ieeeOui = block.payload[0] | (block.payload[1] << 8) | (block.payload[2] << 16);
  }

  return typedBlock;
}

export function encodeVendorSpecificBlock(block: DisplayIdVendorSpecificBlock): Uint8Array {
  const payload = block.payload.slice();

  if (typeof block.ieeeOui === 'number' && payload.length >= 3) {
    payload[0] = block.ieeeOui & 0xff;
    payload[1] = (block.ieeeOui >> 8) & 0xff;
    payload[2] = (block.ieeeOui >> 16) & 0xff;
  }

  return payload;
}
