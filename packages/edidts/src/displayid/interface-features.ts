// packages/edidts/src/displayid/interface-features.ts

import {
  DisplayIdDataBlockTag,
  type DisplayIdColorSpaceEotfCombination,
  type DisplayIdDataBlock,
  type DisplayIdDisplayInterfaceFeaturesBlock,
} from './types';

/**
 * DisplayID 2.0 §4.5 Display Interface Features Data Block (tag 0x26).
 *
 * Variable 9+N byte payload (Table 4-23), where N is the number of additional
 * color space/EOTF combinations (0-7). Field bit layouts per Tables 4-24
 * (color depth), 4-25 (YCbCr 4:2:0 min pixel rate), 4-26 (audio capability),
 * and 4-27 (color space/EOTF). Cross-checked against edid-decode
 * parse_displayid_interface_features (parse-displayid-block.cpp:1298-1353),
 * noting its `print_flags(..., reverse=true)` lists flag arrays high-bit
 * first, so `audiorates[] = {"32","44.1","48"}` maps to bits 7/6/5 — matching
 * the spec (bit 5 = 48 kHz, bit 6 = 44.1 kHz, bit 7 = 32 kHz).
 */

const MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH = 9;
const MAX_ADDITIONAL_COMBINATIONS = 7;
const MAX_PAYLOAD_LENGTH = MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH + MAX_ADDITIONAL_COMBINATIONS;

/** bpc bit positions for RGB and YCbCr 4:4:4 (bits 0-5: 6/8/10/12/14/16). */
export const DEPTHS_444 = [6, 8, 10, 12, 14, 16] as const;
/** bpc bit positions for YCbCr 4:2:2 and 4:2:0 (bits 0-4: 8/10/12/14/16). */
export const DEPTHS_4XX = [8, 10, 12, 14, 16] as const;

/**
 * DisplayID 2.0 §4.5 Table 4-27 color space codes (bits 7:4 of the additional
 * combination byte). Index = on-the-wire code; 8-15 are reserved.
 */
export const DISPLAY_ID_COLOR_SPACE_LABELS: readonly string[] = [
  'Undefined', 'sRGB', 'BT.601', 'BT.709', 'Adobe RGB', 'DCI-P3', 'BT.2020', 'Custom',
];

/**
 * DisplayID 2.0 §4.5 Table 4-27 EOTF codes (bits 3:0 of the additional
 * combination byte). Index = on-the-wire code; 11-15 are reserved.
 */
export const DISPLAY_ID_EOTF_LABELS: readonly string[] = [
  'Undefined', 'sRGB', 'BT.601', 'BT.1886', 'Adobe RGB', 'DCI-P3', 'BT.2020',
  'Gamma function', 'SMPTE ST 2084', 'Hybrid Log', 'Custom',
];

export function getDisplayIdColorSpaceLabel(code: number): string {
  return code < DISPLAY_ID_COLOR_SPACE_LABELS.length
    ? DISPLAY_ID_COLOR_SPACE_LABELS[code]
    : `Reserved (0x${code.toString(16)})`;
}

export function getDisplayIdEotfLabel(code: number): string {
  return code < DISPLAY_ID_EOTF_LABELS.length
    ? DISPLAY_ID_EOTF_LABELS[code]
    : `Reserved (0x${code.toString(16)})`;
}

export function isDisplayInterfaceFeaturesPayloadLengthValid(length: number): boolean {
  return length >= MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH && length <= MAX_PAYLOAD_LENGTH;
}

function readDepthBitset(byte: number, depths: readonly number[]): number[] {
  return depths.filter((_, index) => (byte & (1 << index)) !== 0);
}

function writeDepthBitset(depths: number[], table: readonly number[]): number {
  return table.reduce((mask, depth, index) => mask | (depths.includes(depth) ? 1 << index : 0), 0);
}

export function decodeDisplayInterfaceFeaturesBlock(
  block: DisplayIdDataBlock,
): DisplayIdDisplayInterfaceFeaturesBlock {
  const p = block.payload;
  const byte = (i: number) => p[i] ?? 0;

  const audioByte = byte(5);
  const std1 = byte(6);
  // payload[8] bits 2:0 = N (declared additional combination count, 0-7).
  const declaredCount = byte(8) & 0x07;
  // Only as many combination bytes as are actually present past offset 9.
  const available = Math.max(0, p.length - MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH);
  const count = Math.min(declaredCount, available, MAX_ADDITIONAL_COMBINATIONS);

  const additionalColorSpaceEotfCombinations: DisplayIdColorSpaceEotfCombination[] = [];
  for (let i = 0; i < count; i++) {
    const c = byte(MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH + i);
    additionalColorSpaceEotfCombinations.push({
      colorSpace: (c >> 4) & 0x0f,
      eotf: c & 0x0f,
    });
  }

  const trailing = p.slice(MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH + count);

  return {
    ...block,
    tag: DisplayIdDataBlockTag.DisplayInterfaceFeatures,
    rgbColorDepths: readDepthBitset(byte(0), DEPTHS_444),
    ycbcr444ColorDepths: readDepthBitset(byte(1), DEPTHS_444),
    ycbcr422ColorDepths: readDepthBitset(byte(2), DEPTHS_4XX),
    ycbcr420ColorDepths: readDepthBitset(byte(3), DEPTHS_4XX),
    ycbcr420MinPixelRateMultiplier: byte(4),
    audioSampleRates: {
      sr32kHz: (audioByte & 0x80) !== 0,
      sr44_1kHz: (audioByte & 0x40) !== 0,
      sr48kHz: (audioByte & 0x20) !== 0,
    },
    colorSpaceEotfStandard1: {
      srgb: (std1 & 0x01) !== 0,
      bt601: (std1 & 0x02) !== 0,
      bt709Bt1886: (std1 & 0x04) !== 0,
      adobeRgb: (std1 & 0x08) !== 0,
      dciP3: (std1 & 0x10) !== 0,
      bt2020: (std1 & 0x20) !== 0,
      bt2020St2084: (std1 & 0x40) !== 0,
    },
    additionalColorSpaceEotfCombinations,
    trailing,
  };
}

export function encodeDisplayInterfaceFeaturesBlock(block: DisplayIdDisplayInterfaceFeaturesBlock): Uint8Array {
  const combinations = block.additionalColorSpaceEotfCombinations;
  const length = MIN_INTERFACE_FEATURES_PAYLOAD_LENGTH + combinations.length + block.trailing.length;

  // Preserve incoming bytes (reserved bits, the reserved standard-combination
  // 2 byte at offset 7, and any trailing) where the new length overlaps them,
  // then overwrite only the modeled fields. This keeps the round-trip
  // byte-exact for reserved regions while letting the modeled fields and the
  // additional-combination list be edited freely.
  const payload = new Uint8Array(length);
  const src = block.payload;
  payload.set(src.subarray(0, Math.min(src.length, length)));

  // payload[0] RGB color depth: bits 0-5 modeled, bits 7:6 reserved (preserved).
  payload[0] = (payload[0] & 0xc0) | writeDepthBitset(block.rgbColorDepths, DEPTHS_444);
  // payload[1] YCbCr 4:4:4 depth: bits 0-5 modeled, bits 7:6 reserved.
  payload[1] = (payload[1] & 0xc0) | writeDepthBitset(block.ycbcr444ColorDepths, DEPTHS_444);
  // payload[2] YCbCr 4:2:2 depth: bits 0-4 modeled, bits 7:5 reserved.
  payload[2] = (payload[2] & 0xe0) | writeDepthBitset(block.ycbcr422ColorDepths, DEPTHS_4XX);
  // payload[3] YCbCr 4:2:0 depth: bits 0-4 modeled, bits 7:5 reserved.
  payload[3] = (payload[3] & 0xe0) | writeDepthBitset(block.ycbcr420ColorDepths, DEPTHS_4XX);
  // payload[4] YCbCr 4:2:0 minimum pixel rate (full byte).
  payload[4] = block.ycbcr420MinPixelRateMultiplier & 0xff;
  // payload[5] audio: bits 7/6/5 modeled, bits 4:0 reserved (preserved).
  payload[5] =
    (payload[5] & 0x1f) |
    (block.audioSampleRates.sr32kHz ? 0x80 : 0) |
    (block.audioSampleRates.sr44_1kHz ? 0x40 : 0) |
    (block.audioSampleRates.sr48kHz ? 0x20 : 0);
  // payload[6] standard combination 1: bits 0-6 modeled, bit 7 reserved.
  payload[6] =
    (payload[6] & 0x80) |
    (block.colorSpaceEotfStandard1.srgb ? 0x01 : 0) |
    (block.colorSpaceEotfStandard1.bt601 ? 0x02 : 0) |
    (block.colorSpaceEotfStandard1.bt709Bt1886 ? 0x04 : 0) |
    (block.colorSpaceEotfStandard1.adobeRgb ? 0x08 : 0) |
    (block.colorSpaceEotfStandard1.dciP3 ? 0x10 : 0) |
    (block.colorSpaceEotfStandard1.bt2020 ? 0x20 : 0) |
    (block.colorSpaceEotfStandard1.bt2020St2084 ? 0x40 : 0);
  // payload[7] standard combination 2: fully reserved — preserved as-is.
  // payload[8] N count: bits 2:0 modeled, bits 7:3 reserved (preserved).
  payload[8] = (payload[8] & 0xf8) | (combinations.length & 0x07);

  // payload[9..] additional combinations, rebuilt from the model.
  for (let i = 0; i < combinations.length; i++) {
    payload[9 + i] = ((combinations[i].colorSpace & 0x0f) << 4) | (combinations[i].eotf & 0x0f);
  }

  // Trailing bytes past 9+N, preserved verbatim.
  payload.set(block.trailing, 9 + combinations.length);

  return payload;
}