import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDynamicVideoTimingRangeLimitsBlock,
} from './types';
import { clampBits, clampMinusOne } from './clamp';

/**
 * DisplayID 2.0 §4.4 Dynamic Video Timing Range Limits Data Block (tag 0x25).
 *
 * Layout per edid-decode parse_displayid_dynamic_video_timings_range_limits
 * (x = block start, payload[n] = x[3 + n]):
 *   min_pixclk  = 1 + (x[3] | x[4] << 8 | x[5] << 16)   → payload[0..2]
 *   max_pixclk  = 1 + (x[6] | x[7] << 8 | x[8] << 16)   → payload[3..5]
 *   min_refresh = x[9]                                   → payload[6]
 *   max_refresh = x[10] (+ (x[11] & 3) << 8 when block revision != 0)
 *                                                        → payload[7], payload[8] bits 1:0
 *   seamless    = x[11] & 0x80                           → payload[8] bit 7
 * edid-decode accepts only a 9-byte payload; any other length stays raw.
 */
const DYNAMIC_RANGE_LIMITS_PAYLOAD_LENGTH = 9;
const SEAMLESS_BIT = 0x80;
const MAX_REFRESH_HIGH_MASK = 0x03;

export function isDynamicVideoTimingRangeLimitsPayloadLengthValid(length: number): boolean {
  return length === DYNAMIC_RANGE_LIMITS_PAYLOAD_LENGTH;
}

/** Block revision 1 extends the maximum refresh rate to 10 bits. */
function hasTenBitMaxRefresh(block: DisplayIdDataBlock): boolean {
  return block.revision !== 0;
}

export function decodeDynamicVideoTimingRangeLimitsBlock(
  block: DisplayIdDataBlock,
): DisplayIdDynamicVideoTimingRangeLimitsBlock {
  const payload = block.payload;
  const flags = payload[8] ?? 0;
  const maxRefreshHigh = hasTenBitMaxRefresh(block) ? (flags & MAX_REFRESH_HIGH_MASK) << 8 : 0;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits,
    minimumPixelClockKHz: 1 + readUint24LE(payload, 0),
    maximumPixelClockKHz: 1 + readUint24LE(payload, 3),
    minimumVerticalFrequencyHz: payload[6] ?? 0,
    maximumVerticalFrequencyHz: (payload[7] ?? 0) | maxRefreshHigh,
    seamlessDynamicVideoTiming: (flags & SEAMLESS_BIT) !== 0,
  };
}

export function encodeDynamicVideoTimingRangeLimitsBlock(
  block: DisplayIdDynamicVideoTimingRangeLimitsBlock,
): Uint8Array {
  const payload = new Uint8Array(DYNAMIC_RANGE_LIMITS_PAYLOAD_LENGTH);
  const tenBit = hasTenBitMaxRefresh(block);
  const maxRefresh = clampBits(block.maximumVerticalFrequencyHz, tenBit ? 10 : 8);

  writeUint24LE(payload, 0, clampMinusOne(block.minimumPixelClockKHz, 24));
  writeUint24LE(payload, 3, clampMinusOne(block.maximumPixelClockKHz, 24));
  payload[6] = clampBits(block.minimumVerticalFrequencyHz, 8);
  payload[7] = maxRefresh & 0xff;

  // Keep the reserved bits of payload[8] (bits 6:2, and bits 1:0 when they
  // are not refresh-rate bits) from the block's own payload.
  const modeledBits = SEAMLESS_BIT | (tenBit ? MAX_REFRESH_HIGH_MASK : 0);
  payload[8] =
    ((block.payload[8] ?? 0) & ~modeledBits & 0xff) |
    (tenBit ? (maxRefresh >> 8) & MAX_REFRESH_HIGH_MASK : 0) |
    (block.seamlessDynamicVideoTiming ? SEAMLESS_BIT : 0);

  return payload;
}

function readUint24LE(data: Uint8Array, offset: number): number {
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8) | ((data[offset + 2] ?? 0) << 16);
}

function writeUint24LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
  data[offset + 2] = (value >> 16) & 0xff;
}
