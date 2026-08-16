import type { DisplayIdDataBlock } from './types';

const TYPE_X_TIMING_TAG = 0x2a;
const MIN_DESCRIPTOR_SIZE = 6;
const MAX_VALID_DESCRIPTOR_SIZE_CODE = 2;

export interface DisplayIdTypeXTimingDescriptor {
  timingFormula: number;
  earlyVsync: boolean;
  rr1000div1001OrHblank: boolean;
  stereoSupport: number;
  ycc420Support: boolean;
  horizontalActivePixels: number;
  verticalActiveLines: number;
  refreshRate: number;
  refreshRateHigh: number;
  deltaHblank: number;
  additionalVblankTiming: number;
  additionalMiniVblank: boolean;
}

export interface DisplayIdTypeXTimingBlock extends DisplayIdDataBlock {
  tag: 0x2a;
  timings: DisplayIdTypeXTimingDescriptor[];
  descriptorSize: number;
}

export function isTypeXTimingPayloadLengthValid(length: number, descriptorSize: number): boolean {
  return length > 0 && length % descriptorSize === 0;
}

export function decodeTypeXTimingBlock(block: DisplayIdDataBlock): DisplayIdTypeXTimingBlock {
  const descriptorSizeCode = (block.flags >> 1) & 0x07;
  const descriptorSize = MIN_DESCRIPTOR_SIZE + descriptorSizeCode;
  const payload = block.payload;

  if (
    descriptorSizeCode > MAX_VALID_DESCRIPTOR_SIZE_CODE
    || !isTypeXTimingPayloadLengthValid(payload.length, descriptorSize)
  ) {
    return {
      ...block,
      tag: TYPE_X_TIMING_TAG,
      timings: [],
      descriptorSize,
    };
  }

  const timings: DisplayIdTypeXTimingDescriptor[] = [];

  for (let offset = 0; offset < payload.length; offset += descriptorSize) {
    const options = payload[offset] ?? 0;
    const byte6 = descriptorSize >= 7 ? (payload[offset + 6] ?? 0) : 0;
    const byte7 = descriptorSize >= 8 ? (payload[offset + 7] ?? 0) : 0;

    timings.push({
      timingFormula: options & 0x07,
      earlyVsync: (options & 0x08) !== 0,
      rr1000div1001OrHblank: (options & 0x10) !== 0,
      stereoSupport: (options >> 5) & 0x03,
      ycc420Support: (options & 0x80) !== 0,
      horizontalActivePixels: readUint16LE(payload, offset + 1),
      verticalActiveLines: readUint16LE(payload, offset + 3),
      refreshRate: payload[offset + 5] ?? 0,
      refreshRateHigh: byte6 & 0x03,
      deltaHblank: (byte6 >> 2) & 0x07,
      additionalVblankTiming: (byte6 >> 5) & 0x07,
      additionalMiniVblank: (byte7 & 0x01) !== 0,
    });
  }

  return {
    ...block,
    tag: TYPE_X_TIMING_TAG,
    timings,
    descriptorSize,
  };
}

export function encodeTypeXTimingBlock(block: DisplayIdTypeXTimingBlock): Uint8Array {
  const descriptorSize = block.descriptorSize;
  const requiredLength = block.timings.length * descriptorSize;
  const payload = block.payload.length === requiredLength
    ? block.payload.slice()
    : new Uint8Array(requiredLength);

  block.timings.forEach((timing, index) => {
    const offset = index * descriptorSize;

    payload[offset] =
      (timing.timingFormula & 0x07)
      | (timing.earlyVsync ? 0x08 : 0)
      | (timing.rr1000div1001OrHblank ? 0x10 : 0)
      | ((timing.stereoSupport & 0x03) << 5)
      | (timing.ycc420Support ? 0x80 : 0);

    writeUint16LE(payload, offset + 1, timing.horizontalActivePixels);
    writeUint16LE(payload, offset + 3, timing.verticalActiveLines);
    payload[offset + 5] = timing.refreshRate & 0xff;

    if (descriptorSize >= 7) {
      payload[offset + 6] =
        (timing.refreshRateHigh & 0x03)
        | ((timing.deltaHblank & 0x07) << 2)
        | ((timing.additionalVblankTiming & 0x07) << 5);
    }

    if (descriptorSize >= 8) {
      payload[offset + 7] = (payload[offset + 7] & 0xfe) | (timing.additionalMiniVblank ? 0x01 : 0);
    }
  });

  return payload;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}