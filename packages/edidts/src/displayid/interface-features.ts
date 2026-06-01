import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDisplayInterfaceFeaturesBlock,
} from './types';

const MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH = 4;
const COLOR_DEPTHS = [6, 8, 10, 12] as const;

export function isDisplayInterfaceFeaturesPayloadLengthValid(length: number): boolean {
  return length >= MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH;
}

export function decodeDisplayInterfaceFeaturesBlock(
  block: DisplayIdDataBlock,
): DisplayIdDisplayInterfaceFeaturesBlock {
  const payload = block.payload;
  const pixelEncodingMask = payload[1] ?? 0;
  const flags = payload[2] ?? 0;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.DisplayInterfaceFeatures,
    supportedColorDepths: COLOR_DEPTHS.filter((_, index) => ((payload[0] ?? 0) & (1 << index)) !== 0),
    rgb444: (pixelEncodingMask & 0x01) !== 0,
    ycbcr444: (pixelEncodingMask & 0x02) !== 0,
    ycbcr422: (pixelEncodingMask & 0x04) !== 0,
    ycbcr420: (pixelEncodingMask & 0x08) !== 0,
    audioOnInterface: (flags & 0x01) !== 0,
    contentProtection: (flags & 0x02) !== 0,
  };
}

export function encodeDisplayInterfaceFeaturesBlock(block: DisplayIdDisplayInterfaceFeaturesBlock): Uint8Array {
  const payload = block.payload.length >= MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH
    ? block.payload.slice()
    : new Uint8Array(MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH);

  payload[0] = COLOR_DEPTHS.reduce(
    (mask, depth, index) => mask | (block.supportedColorDepths.includes(depth) ? 1 << index : 0),
    0,
  );
  payload[1] =
    (block.rgb444 ? 0x01 : 0) |
    (block.ycbcr444 ? 0x02 : 0) |
    (block.ycbcr422 ? 0x04 : 0) |
    (block.ycbcr420 ? 0x08 : 0);
  payload[2] =
    (block.audioOnInterface ? 0x01 : 0) |
    (block.contentProtection ? 0x02 : 0);

  return payload;
}
