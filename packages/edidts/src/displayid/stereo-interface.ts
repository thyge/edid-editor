import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdStereoDisplayInterfaceBlock,
} from './types';

const MIN_STEREO_INTERFACE_PAYLOAD_LENGTH = 2;

export function isStereoDisplayInterfacePayloadLengthValid(length: number): boolean {
  return length >= MIN_STEREO_INTERFACE_PAYLOAD_LENGTH;
}

export function decodeStereoDisplayInterfaceBlock(block: DisplayIdDataBlock): DisplayIdStereoDisplayInterfaceBlock {
  const stereoTypesMask = block.payload[1] ?? 0;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.StereoDisplayInterface,
    stereoSupported: ((block.payload[0] ?? 0) & 0x01) !== 0,
    stereoTypes: Array.from({ length: 8 }, (_, index) => index).filter(
      (stereoType) => (stereoTypesMask & (1 << stereoType)) !== 0,
    ),
  };
}

export function encodeStereoDisplayInterfaceBlock(block: DisplayIdStereoDisplayInterfaceBlock): Uint8Array {
  const payload = block.payload.length >= MIN_STEREO_INTERFACE_PAYLOAD_LENGTH
    ? block.payload.slice()
    : new Uint8Array(MIN_STEREO_INTERFACE_PAYLOAD_LENGTH);

  payload[0] = (payload[0] & 0xfe) | (block.stereoSupported ? 0x01 : 0);
  payload[1] = block.stereoTypes.reduce(
    (mask, stereoType) => mask | (stereoType >= 0 && stereoType <= 7 ? 1 << stereoType : 0),
    0,
  );

  return payload;
}
