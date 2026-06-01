import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDynamicVideoTimingRangeLimitsBlock,
} from './types';

const MIN_DYNAMIC_RANGE_LIMITS_PAYLOAD_LENGTH = 13;

export function isDynamicVideoTimingRangeLimitsPayloadLengthValid(length: number): boolean {
  return length >= MIN_DYNAMIC_RANGE_LIMITS_PAYLOAD_LENGTH;
}

export function decodeDynamicVideoTimingRangeLimitsBlock(
  block: DisplayIdDataBlock,
): DisplayIdDynamicVideoTimingRangeLimitsBlock {
  const payload = block.payload;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits,
    minimumPixelClockKHz: readUint16LE(payload, 0),
    maximumPixelClockKHz: readUint16LE(payload, 2),
    minimumHorizontalFrequencyHz: readUint16LE(payload, 4),
    maximumHorizontalFrequencyHz: readUint16LE(payload, 6),
    minimumVerticalFrequencyHz: readUint16LE(payload, 8),
    maximumVerticalFrequencyHz: readUint16LE(payload, 10),
    seamlessDynamicVideoTiming: (payload[12] & 0x01) !== 0,
  };
}

export function encodeDynamicVideoTimingRangeLimitsBlock(
  block: DisplayIdDynamicVideoTimingRangeLimitsBlock,
): Uint8Array {
  const payload = block.payload.length >= MIN_DYNAMIC_RANGE_LIMITS_PAYLOAD_LENGTH
    ? block.payload.slice()
    : new Uint8Array(MIN_DYNAMIC_RANGE_LIMITS_PAYLOAD_LENGTH);

  writeUint16LE(payload, 0, block.minimumPixelClockKHz);
  writeUint16LE(payload, 2, block.maximumPixelClockKHz);
  writeUint16LE(payload, 4, block.minimumHorizontalFrequencyHz);
  writeUint16LE(payload, 6, block.maximumHorizontalFrequencyHz);
  writeUint16LE(payload, 8, block.minimumVerticalFrequencyHz);
  writeUint16LE(payload, 10, block.maximumVerticalFrequencyHz);
  payload[12] = (payload[12] & 0xfe) | (block.seamlessDynamicVideoTiming ? 0x01 : 0);

  return payload;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}
