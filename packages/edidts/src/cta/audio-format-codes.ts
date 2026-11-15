/**
 * Audio Format Codes
 * 
 * Per CTA-861-G Table 53 - Audio Format Codes
 */

import type { AudioDataBlock } from './extension-block';
import { clampByte, clampInt } from './byte-utils';

export interface AudioFormatDefinition {
  code: number;
  name: string;
  shortName: string;
  maxChannels?: number;
  description: string;
}

/**
 * Audio format codes as defined in CTA-861-G
 */
export const AUDIO_FORMAT_CODES: AudioFormatDefinition[] = [
  { code: 0, name: 'Reserved', shortName: 'Reserved', description: 'Reserved' },
  { code: 1, name: 'Linear PCM', shortName: 'LPCM', description: 'Linear Pulse Code Modulation' },
  { code: 2, name: 'AC-3', shortName: 'AC3', description: 'Dolby Digital' },
  { code: 3, name: 'MPEG-1 Audio', shortName: 'MPEG1', description: 'MPEG-1 Audio Layer 1 & 2' },
  { code: 4, name: 'MP3', shortName: 'MP3', description: 'MPEG-1 Audio Layer 3' },
  { code: 5, name: 'MPEG2 Audio', shortName: 'MPEG2', description: 'MPEG-2 Multi-channel Audio' },
  { code: 6, name: 'AAC LC', shortName: 'AAC', description: 'Advanced Audio Coding Low Complexity' },
  { code: 7, name: 'DTS', shortName: 'DTS', description: 'Digital Theater Systems' },
  { code: 8, name: 'ATRAC', shortName: 'ATRAC', description: 'Adaptive Transform Acoustic Coding' },
  { code: 9, name: 'One Bit Audio', shortName: 'DSD', description: 'DSD (Direct Stream Digital)' },
  { code: 10, name: 'Enhanced AC-3', shortName: 'E-AC3', description: 'Dolby Digital Plus' },
  { code: 11, name: 'DTS-HD', shortName: 'DTS-HD', description: 'DTS-HD Master Audio' },
  { code: 12, name: 'MAT', shortName: 'TrueHD', description: 'Dolby TrueHD (Meridian Lossless Packing)' },
  { code: 13, name: 'DST', shortName: 'DST', description: 'Direct Stream Transfer' },
  { code: 14, name: 'WMA Pro', shortName: 'WMA', description: 'Windows Media Audio Professional' },
  { code: 15, name: 'Audio Format Extension', shortName: 'Ext', description: 'Extended Audio Format Code in byte 3' },
];

/**
 * Extended Audio Format Codes (when code 15 is used)
 * The extended code is in bits 7:3 of byte 3 of the SAD
 */
export const EXTENDED_AUDIO_FORMAT_CODES: AudioFormatDefinition[] = [
  { code: 4, name: 'MPEG-4 HE AAC', shortName: 'HE-AAC', description: 'High-Efficiency AAC' },
  { code: 5, name: 'MPEG-4 HE AAC v2', shortName: 'HE-AACv2', description: 'High-Efficiency AAC version 2' },
  { code: 6, name: 'MPEG-4 AAC LC', shortName: 'AAC-LC', description: 'MPEG-4 AAC Low Complexity' },
  { code: 7, name: 'DRA', shortName: 'DRA', description: 'Dynamic Resolution Adaptation' },
  { code: 8, name: 'MPEG-4 HE AAC + MPEG Surround', shortName: 'HE-AAC+MPS', description: 'HE-AAC with MPEG Surround' },
  { code: 9, name: 'MPEG-4 HE AAC v2 + MPEG Surround', shortName: 'HE-AACv2+MPS', description: 'HE-AAC v2 with MPEG Surround' },
  { code: 10, name: 'MPEG-4 AAC LC + MPEG Surround', shortName: 'AAC-LC+MPS', description: 'AAC-LC with MPEG Surround' },
  { code: 11, name: 'MPEG-H 3D Audio', shortName: 'MPEG-H', description: 'MPEG-H 3D Audio' },
  { code: 12, name: 'AC-4', shortName: 'AC-4', description: 'Dolby AC-4' },
  { code: 13, name: 'L-PCM 3D Audio', shortName: 'LPCM-3D', description: 'LPCM 3D Audio' },
  // CTA-861-H additions (names as edid-decode `audio_ext_format` prints them).
  { code: 14, name: 'Auro-Cx', shortName: 'Auro-Cx', description: 'Auro-Cx' },
  { code: 15, name: 'MPEG-D USAC', shortName: 'USAC', description: 'MPEG-D Unified Speech and Audio Coding' },
];

// Create lookup maps
const AUDIO_FORMAT_MAP = new Map<number, AudioFormatDefinition>();
for (const fmt of AUDIO_FORMAT_CODES) {
  AUDIO_FORMAT_MAP.set(fmt.code, fmt);
}

const EXT_AUDIO_FORMAT_MAP = new Map<number, AudioFormatDefinition>();
for (const fmt of EXTENDED_AUDIO_FORMAT_CODES) {
  EXT_AUDIO_FORMAT_MAP.set(fmt.code, fmt);
}

/**
 * Get audio format name from code
 */
export function getAudioFormatName(code: number): string {
  const fmt = AUDIO_FORMAT_MAP.get(code);
  return fmt?.name ?? `Unknown (${code})`;
}

/**
 * Get audio format short name from code
 */
export function getAudioFormatShortName(code: number): string {
  const fmt = AUDIO_FORMAT_MAP.get(code);
  return fmt?.shortName ?? `Unknown`;
}

/**
 * Get extended audio format name (when code=15)
 */
export function getExtendedAudioFormatName(extCode: number): string {
  const fmt = EXT_AUDIO_FORMAT_MAP.get(extCode);
  return fmt?.name ?? `Unknown Extended (${extCode})`;
}

/**
 * Sampling rate flags to human-readable string
 */
export function getSamplingRatesString(rates: {
  sr32kHz?: boolean;
  sr44_1kHz?: boolean;
  sr48kHz?: boolean;
  sr88_2kHz?: boolean;
  sr96kHz?: boolean;
  sr176_4kHz?: boolean;
  sr192kHz?: boolean;
}): string {
  const rateStrings: string[] = [];
  if (rates.sr32kHz) rateStrings.push('32');
  if (rates.sr44_1kHz) rateStrings.push('44.1');
  if (rates.sr48kHz) rateStrings.push('48');
  if (rates.sr88_2kHz) rateStrings.push('88.2');
  if (rates.sr96kHz) rateStrings.push('96');
  if (rates.sr176_4kHz) rateStrings.push('176.4');
  if (rates.sr192kHz) rateStrings.push('192');
  return rateStrings.join(', ') + ' kHz';
}

/**
 * Bit depth flags to human-readable string (for LPCM)
 */
export function getBitDepthsString(depths: {
  bd16?: boolean;
  bd20?: boolean;
  bd24?: boolean;
}): string {
  const depthStrings: string[] = [];
  if (depths.bd16) depthStrings.push('16');
  if (depths.bd20) depthStrings.push('20');
  if (depths.bd24) depthStrings.push('24');
  return depthStrings.join('/') + '-bit';
}

/**
 * Sampling-rate toggle options for an Audio Data Block descriptor
 * (CTA-861-G Table 53). `key` matches the `samplingRates` boolean-field name
 * on `AudioDataBlock['descriptors'][number]`; `label` is the display string.
 */
export const AUDIO_SAMPLING_RATE_OPTIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'sr32kHz', label: '32 kHz' },
  { key: 'sr44_1kHz', label: '44.1 kHz' },
  { key: 'sr48kHz', label: '48 kHz' },
  { key: 'sr88_2kHz', label: '88.2 kHz' },
  { key: 'sr96kHz', label: '96 kHz' },
  { key: 'sr176_4kHz', label: '176.4 kHz' },
  { key: 'sr192kHz', label: '192 kHz' },
];

/**
 * LPCM bit-depth toggle options. `key` matches the `bitDepths` boolean-field
 * name on `AudioDataBlock['descriptors'][number]`.
 */
export const AUDIO_BIT_DEPTH_OPTIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'bd16', label: '16-bit' },
  { key: 'bd20', label: '20-bit' },
  { key: 'bd24', label: '24-bit' },
];

/** One Short Audio Descriptor as modelled on `AudioDataBlock.descriptors`. */
export type ShortAudioDescriptor = AudioDataBlock['descriptors'][number];

/** Extended format code of L-PCM 3D Audio (CTA-861-G Table 52), whose SAD
 *  layout differs: a 5-bit channel count and LPCM-style sample sizes. */
const EXT_LPCM_3D = 13;

/**
 * Decode one 3-byte Short Audio Descriptor. Layout per CTA-861-G §7.5.2 and
 * edid-decode `cta_audio_block`; every bit lands in exactly one field so
 * {@link encodeShortAudioDescriptor} restores the bytes exactly.
 */
export function decodeShortAudioDescriptor(b0: number, b1: number, b2: number): ShortAudioDescriptor {
  const format = (b0 >> 3) & 0x0f;
  const extendedFormat = format === 15 ? (b2 >> 3) & 0x1f : undefined;
  const lpcm3d = extendedFormat === EXT_LPCM_3D;

  const d: ShortAudioDescriptor = {
    format,
    // L-PCM 3D Audio widens the channel count with F17 (bit 3) and F27
    // (bit 4): edid-decode `((x[1] & 0x80) >> 3) | ((x[0] & 0x80) >> 4) | (x[0] & 7)`.
    channels: lpcm3d
      ? (((b1 & 0x80) >> 3) | ((b0 & 0x80) >> 4) | (b0 & 0x07)) + 1
      : (b0 & 0x07) + 1,
    samplingRates: {
      sr32kHz: (b1 & 0x01) !== 0,
      sr44_1kHz: (b1 & 0x02) !== 0,
      sr48kHz: (b1 & 0x04) !== 0,
      sr88_2kHz: (b1 & 0x08) !== 0,
      sr96kHz: (b1 & 0x10) !== 0,
      sr176_4kHz: (b1 & 0x20) !== 0,
      sr192kHz: (b1 & 0x40) !== 0,
    },
  };
  if (!lpcm3d) {
    if (b0 & 0x80) d.f17 = true;
    if (b1 & 0x80) d.f27 = true;
  }

  if (format === 1 || lpcm3d) {
    d.bitDepths = {
      bd16: (b2 & 0x01) !== 0,
      bd20: (b2 & 0x02) !== 0,
      bd24: (b2 & 0x04) !== 0,
    };
  }
  if (format === 1) {
    if (b2 & 0xf8) d.byte3Reserved = b2 & 0xf8;
  } else if (format >= 2 && format <= 8) {
    // CTA-861-G Table 61: byte 3 = maximum bit rate ÷ 8 kb/s.
    d.maxBitrate = b2 * 8;
  } else if (format >= 9 && format <= 14) {
    // Table 62: a format-dependent value, kept opaque.
    d.profile = b2;
  } else if (format === 15) {
    d.extendedFormat = extendedFormat;
    if (!lpcm3d) d.extendedFormatValue = b2 & 0x07;
  } else if (b2) {
    // Reserved format code 0: nothing defined, keep the byte as-is.
    d.byte3Reserved = b2;
  }
  return d;
}

/**
 * Encode one Short Audio Descriptor (inverse of
 * {@link decodeShortAudioDescriptor}). Byte 3 is chosen by the format code, so
 * a field that does not belong to the format is ignored; every number is
 * clamped to its bit field instead of wrapping.
 */
export function encodeShortAudioDescriptor(d: ShortAudioDescriptor): [number, number, number] {
  const format = clampInt(d.format, 0, 15);
  const extendedFormat = format === 15 ? clampInt(d.extendedFormat ?? 0, 0, 31) : undefined;
  const lpcm3d = extendedFormat === EXT_LPCM_3D;
  const r = d.samplingRates;

  let b0 = format << 3;
  let b1 =
    (r.sr32kHz ? 0x01 : 0) |
    (r.sr44_1kHz ? 0x02 : 0) |
    (r.sr48kHz ? 0x04 : 0) |
    (r.sr88_2kHz ? 0x08 : 0) |
    (r.sr96kHz ? 0x10 : 0) |
    (r.sr176_4kHz ? 0x20 : 0) |
    (r.sr192kHz ? 0x40 : 0);
  if (lpcm3d) {
    const ch = clampInt(d.channels, 1, 32) - 1;
    b0 |= (ch & 0x07) | ((ch & 0x08) << 4);
    b1 |= (ch & 0x10) << 3;
  } else {
    b0 |= clampInt(d.channels, 1, 8) - 1;
    if (d.f17) b0 |= 0x80;
    if (d.f27) b1 |= 0x80;
  }

  const depths = d.bitDepths
    ? (d.bitDepths.bd16 ? 0x01 : 0) | (d.bitDepths.bd20 ? 0x02 : 0) | (d.bitDepths.bd24 ? 0x04 : 0)
    : 0;
  let b2: number;
  if (format === 1) {
    b2 = depths | (clampByte(d.byte3Reserved ?? 0) & 0xf8);
  } else if (format >= 2 && format <= 8) {
    b2 = clampByte((d.maxBitrate ?? 0) / 8);
  } else if (format >= 9 && format <= 14) {
    // A descriptor switched here from a bit-rate format may only carry
    // `maxBitrate`; write it the way that format would have.
    b2 = d.profile !== undefined ? clampByte(d.profile) : clampByte((d.maxBitrate ?? 0) / 8);
  } else if (format === 15) {
    b2 = (extendedFormat! << 3) | (lpcm3d ? depths : clampInt(d.extendedFormatValue ?? 0, 0, 7));
  } else {
    b2 = clampByte(d.byte3Reserved ?? 0);
  }
  return [b0, b1, b2];
}
