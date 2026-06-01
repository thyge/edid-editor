import { DisplayIdDataBlockTag, type DisplayIdDataBlock, type DisplayIdDisplayParametersBlock } from './types';

export function isDisplayParametersPayloadLengthValid(length: number): boolean {
  return length >= 7;
}

export function decodeDisplayParametersBlock(block: DisplayIdDataBlock): DisplayIdDisplayParametersBlock {
  const payload = block.payload;
  const featureFlags = payload[6] ?? 0;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.DisplayParameters,
    horizontalImageSizeMm: (payload[0] ?? 0) | ((payload[1] ?? 0) << 8),
    verticalImageSizeMm: (payload[2] ?? 0) | ((payload[3] ?? 0) << 8),
    nativeColorBitDepth: payload[4] ?? 0,
    dynamicRange: payload[5] ?? 0,
    audioSupport: (featureFlags & 0x01) !== 0,
    separateAudioInputs: (featureFlags & 0x02) !== 0,
    fixedPixelFormat: (featureFlags & 0x04) !== 0,
    fixedTiming: (featureFlags & 0x08) !== 0,
    deinterlacing: (featureFlags & 0x10) !== 0,
  };
}

export function encodeDisplayParametersBlock(block: DisplayIdDisplayParametersBlock): Uint8Array {
  const payload = block.payload.length >= 7
    ? block.payload.slice()
    : new Uint8Array(7);
  payload[0] = block.horizontalImageSizeMm & 0xff;
  payload[1] = (block.horizontalImageSizeMm >> 8) & 0xff;
  payload[2] = block.verticalImageSizeMm & 0xff;
  payload[3] = (block.verticalImageSizeMm >> 8) & 0xff;
  payload[4] = block.nativeColorBitDepth & 0xff;
  payload[5] = block.dynamicRange & 0xff;
  payload[6] =
    (block.audioSupport ? 0x01 : 0) |
    (block.separateAudioInputs ? 0x02 : 0) |
    (block.fixedPixelFormat ? 0x04 : 0) |
    (block.fixedTiming ? 0x08 : 0) |
    (block.deinterlacing ? 0x10 : 0);
  return payload;
}
