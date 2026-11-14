import type { DisplayIdDataBlock } from './types';
import { clampBits, clampInt, clampMinusOne } from './clamp';

/**
 * DisplayID 2.0 §4.3.4 Type X Formula-based Timing (tag 0x2a).
 *
 * Descriptor layout per edid-decode parse_displayid_type_10_timing
 * (x = descriptor start, size 6 + ((x[1] of the block header >> 4) & 7)):
 *   x[0]      bits 2:0 formula, bit 3 early vsync, bit 4 1000/1001 or alt
 *             hblank, bits 6:5 stereo, bit 7 YCbCr 4:2:0
 *   x[1..2]   hact = 1 + raw16
 *   x[3..4]   vact = 1 + raw16
 *   x[5]      refresh = 1 + x[5] (+ (x[6] & 3) << 8 for 7/8-byte descriptors)
 *   x[6]      bits 4:2 delta hblank, bits 7:5 additional vblank (size >= 7)
 *   x[7]      bit 0 alternate minimum vblank (size 8); bits 7:1 reserved
 * Counts and the refresh rate are therefore stored minus one: the model holds
 * the real values (1920 x 1080 @ 60 Hz).
 */

const TYPE_X_TIMING_TAG = 0x2a;
const MIN_DESCRIPTOR_SIZE = 6;
const MAX_VALID_DESCRIPTOR_SIZE_CODE = 2;

export interface DisplayIdTypeXTimingDescriptor {
  timingFormula: number;
  earlyVsync: boolean;
  rr1000div1001OrHblank: boolean;
  stereoSupport: number;
  ycc420Support: boolean;
  /** Horizontal active pixels (1 .. 65536; stored minus one). */
  horizontalActivePixels: number;
  /** Vertical active lines (1 .. 65536; stored minus one). */
  verticalActiveLines: number;
  /**
   * Refresh rate in Hz, stored minus one: 1 .. 256 for 6-byte descriptors,
   * 1 .. 1024 for 7/8-byte descriptors (two extra bits in byte 6).
   */
  refreshRate: number;
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
      horizontalActivePixels: 1 + readUint16LE(payload, offset + 1),
      verticalActiveLines: 1 + readUint16LE(payload, offset + 3),
      refreshRate: 1 + ((payload[offset + 5] ?? 0) | ((byte6 & 0x03) << 8)),
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
      clampBits(timing.timingFormula, 3)
      | (timing.earlyVsync ? 0x08 : 0)
      | (timing.rr1000div1001OrHblank ? 0x10 : 0)
      | (clampBits(timing.stereoSupport, 2) << 5)
      | (timing.ycc420Support ? 0x80 : 0);

    writeUint16LE(payload, offset + 1, clampMinusOne(timing.horizontalActivePixels, 16));
    writeUint16LE(payload, offset + 3, clampMinusOne(timing.verticalActiveLines, 16));
    // 6-byte descriptors have no room for refresh bits 9:8.
    const refreshRaw = clampInt(timing.refreshRate, 1, descriptorSize >= 7 ? 1024 : 256) - 1;
    payload[offset + 5] = refreshRaw & 0xff;

    if (descriptorSize >= 7) {
      payload[offset + 6] =
        ((refreshRaw >> 8) & 0x03)
        | (clampBits(timing.deltaHblank, 3) << 2)
        | (clampBits(timing.additionalVblankTiming, 3) << 5);
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