import { type DisplayIdDataBlock } from './types';

export const BRIGHTNESS_LUMINANCE_RANGE_TAG = 0x2e;
export const BRIGHTNESS_LUMINANCE_RANGE_PAYLOAD_LENGTH = 6;

export interface DisplayIdBrightnessLuminanceRangeBlock extends DisplayIdDataBlock {
  tag: 0x2e;
  minSdrLuminance: number;
  maxSdrLuminance: number;
  maxBoostSdrLuminance: number;
}

export function isBrightnessLuminanceRangePayloadLengthValid(length: number): boolean {
  return length === BRIGHTNESS_LUMINANCE_RANGE_PAYLOAD_LENGTH;
}

export function decodeBrightnessLuminanceRangeBlock(
  block: DisplayIdDataBlock,
): DisplayIdBrightnessLuminanceRangeBlock {
  const payload = block.payload;

  if (!isBrightnessLuminanceRangePayloadLengthValid(payload.length)) {
    return {
      ...block,
      tag: BRIGHTNESS_LUMINANCE_RANGE_TAG,
      minSdrLuminance: 0,
      maxSdrLuminance: 0,
      maxBoostSdrLuminance: 0,
    };
  }

  return {
    ...block,
    tag: BRIGHTNESS_LUMINANCE_RANGE_TAG,
    minSdrLuminance: readUint16LE(payload, 0),
    maxSdrLuminance: readUint16LE(payload, 2),
    maxBoostSdrLuminance: readUint16LE(payload, 4),
  };
}

export function encodeBrightnessLuminanceRangeBlock(
  block: DisplayIdBrightnessLuminanceRangeBlock,
): Uint8Array {
  const payload = new Uint8Array(BRIGHTNESS_LUMINANCE_RANGE_PAYLOAD_LENGTH);

  writeUint16LE(payload, 0, block.minSdrLuminance);
  writeUint16LE(payload, 2, block.maxSdrLuminance);
  writeUint16LE(payload, 4, block.maxBoostSdrLuminance);

  return payload;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}