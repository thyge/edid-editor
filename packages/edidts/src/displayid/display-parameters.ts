import { DisplayIdDataBlockTag, type DisplayIdChromaticity, type DisplayIdDataBlock, type DisplayIdDisplayParametersBlock } from './types';

/** DisplayID 2.0 §4.2 mandates exactly 29 payload bytes. */
export function isDisplayParametersPayloadLengthValid(length: number): boolean {
  return length === 29;
}

/** Sentinel: gamma EOTF byte value meaning "not defined". */
export const DISPLAY_ID_GAMMA_NOT_DEFINED = 0xff;

/** IEEE 754 binary16 sentinel meaning "do not use" for luminance fields. */
export const DISPLAY_ID_LUMINANCE_DO_NOT_USE = 0x8000;

/**
 * Decode an IEEE 754 binary16 luminance word to cd/m².
 * Matches edid-decode `ieee7542d` (parse-displayid-block.cpp:1095-1105):
 * sign bit set (other than 0x8000) is reserved; 0x8000 is "do not use".
 * Returns NaN for reserved words so callers can distinguish them.
 */
export function displayIdLuminanceToCdM2(raw16: number): number {
  const fp = raw16 & 0xffff;
  if (fp === DISPLAY_ID_LUMINANCE_DO_NOT_USE) return NaN; // "do not use"
  if (fp & 0x8000) return NaN; // reserved
  const exp = ((fp & 0x7c00) >> 10) - 15;
  const fract = (fp & 0x3ff) | 0x400;
  return (Math.pow(2, exp) * fract) / 1024;
}

/** Decode a 12-bit chromaticity coordinate to its 0..1 fraction (raw / 4096). */
export function displayIdChromaticityValue(raw12: number): number {
  return (raw12 & 0xfff) / 4096;
}

/** Decode the native gamma EOTF byte; 0xff = not defined, else (100 + byte) / 100. */
export function displayIdGammaValue(byte: number): number | null {
  return (byte & 0xff) === DISPLAY_ID_GAMMA_NOT_DEFINED ? null : (100 + (byte & 0xff)) / 100;
}

function readChromaticity(payload: Uint8Array, offset: number): DisplayIdChromaticity {
  const b0 = payload[offset] ?? 0;
  const b1 = payload[offset + 1] ?? 0;
  const b2 = payload[offset + 2] ?? 0;
  const x = b0 | ((b1 & 0x0f) << 8);
  const y = ((b1 & 0xf0) >> 4) | (b2 << 4);
  return { x, y };
}

function writeChromaticity(payload: Uint8Array, offset: number, c: DisplayIdChromaticity): void {
  payload[offset] = c.x & 0xff;
  payload[offset + 1] = ((c.x >> 8) & 0x0f) | ((c.y & 0x0f) << 4);
  payload[offset + 2] = (c.y >> 4) & 0xff;
}

function readU16le(payload: Uint8Array, offset: number): number {
  return (payload[offset] ?? 0) | ((payload[offset + 1] ?? 0) << 8);
}

function writeU16le(payload: Uint8Array, offset: number, value: number): void {
  payload[offset] = value & 0xff;
  payload[offset + 1] = (value >> 8) & 0xff;
}

export function decodeDisplayParametersBlock(block: DisplayIdDataBlock): DisplayIdDisplayParametersBlock {
  const payload = block.payload;
  const featureFlags = payload[8] ?? 0;
  const colorDepthByte = payload[27] ?? 0;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.DisplayParameters,
    imageSizeInMm: (block.flags & 0x10) !== 0,
    horizontalImageSizeMm: readU16le(payload, 0),
    verticalImageSizeMm: readU16le(payload, 2),
    horizontalPixelCount: readU16le(payload, 4),
    verticalPixelCount: readU16le(payload, 6),
    scanOrientation: featureFlags & 0x07,
    luminanceInformation: (featureFlags >> 3) & 0x03,
    colorInformationCie1976: (featureFlags & 0x40) !== 0,
    audioSpeakerNotIntegrated: (featureFlags & 0x80) !== 0,
    primary1: readChromaticity(payload, 9),
    primary2: readChromaticity(payload, 12),
    primary3: readChromaticity(payload, 15),
    whitePoint: readChromaticity(payload, 18),
    maxLuminanceFullCoverage: readU16le(payload, 21),
    maxLuminance10PercentRect: readU16le(payload, 23),
    minLuminance: readU16le(payload, 25),
    nativeColorDepth: colorDepthByte & 0x07,
    displayDeviceTechnology: (colorDepthByte >> 3) & 0x07,
    displayDeviceThemePreference: (colorDepthByte & 0x80) !== 0,
    gammaEotf: payload[28] ?? DISPLAY_ID_GAMMA_NOT_DEFINED,
  };
}

export function encodeDisplayParametersBlock(block: DisplayIdDisplayParametersBlock): Uint8Array {
  const payload = new Uint8Array(29);

  writeU16le(payload, 0, block.horizontalImageSizeMm);
  writeU16le(payload, 2, block.verticalImageSizeMm);
  writeU16le(payload, 4, block.horizontalPixelCount);
  writeU16le(payload, 6, block.verticalPixelCount);

  payload[8] =
    (block.scanOrientation & 0x07) |
    ((block.luminanceInformation & 0x03) << 3) |
    (block.colorInformationCie1976 ? 0x40 : 0) |
    (block.audioSpeakerNotIntegrated ? 0x80 : 0);

  writeChromaticity(payload, 9, block.primary1);
  writeChromaticity(payload, 12, block.primary2);
  writeChromaticity(payload, 15, block.primary3);
  writeChromaticity(payload, 18, block.whitePoint);

  writeU16le(payload, 21, block.maxLuminanceFullCoverage);
  writeU16le(payload, 23, block.maxLuminance10PercentRect);
  writeU16le(payload, 25, block.minLuminance);

  payload[27] =
    (block.nativeColorDepth & 0x07) |
    ((block.displayDeviceTechnology & 0x07) << 3) |
    (block.displayDeviceThemePreference ? 0x80 : 0);

  payload[28] = block.gammaEotf & 0xff;

  return payload;
}