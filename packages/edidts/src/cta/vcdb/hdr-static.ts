/**
 * HDR Static Metadata Data Block (CTA-861-G §7.5.6, Extended Tag 6)
 *
 * VCDB-family block (see `cta/vcdb/`): defines HDR capabilities and
 * luminance values.
 *
 * The three luminance bytes are stored as their raw code values, not as
 * cd/m². The cd/m² figures are derived (see {@link hdrLuminanceFromCode} and
 * {@link hdrMinLuminanceFromCode}); converting through them and rounding back
 * is lossy — min luminance depends on the max-luminance code, so rounding the
 * max first shifts the min — which used to corrupt unedited codes on save.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';
import { clampByte, clampInt, keepShortLength } from '../byte-utils';

export interface HDRStaticMetadataDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x06;
  /** Byte 1 bits 3:0. */
  eotf: {
    traditionalGammaSDR: boolean;    // Traditional gamma - SDR luminance range
    traditionalGammaHDR: boolean;    // Traditional gamma - HDR luminance range
    smpte2084: boolean;              // SMPTE ST 2084 (PQ curve / HDR10)
    hlg: boolean;                    // Hybrid Log-Gamma
  };
  /**
   * Byte 1 bits 7:4 (EOTFs 4-5 that edid-decode reports as unknown, and
   * reserved bits 6-7), shifted down (0–15). Kept so they survive a re-encode.
   * Optional; absent means 0.
   */
  eotfReserved?: number;
  /** Byte 2 bit 0: Static Metadata Descriptor Type 1. */
  staticMetadataType1: boolean;
  /** Byte 2 bits 7:1 (metadata types 2–8), shifted down (0–127). Optional; absent means 0. */
  metadataTypesReserved?: number;
  /** Byte 3 (optional): Desired Content Max Luminance code value (0–255). */
  maxLuminanceCode?: number;
  /** Byte 4 (optional): Desired Content Max Frame-average Luminance code value (0–255). */
  maxFrameAvgLuminanceCode?: number;
  /** Byte 5 (optional): Desired Content Min Luminance code value (0–255). */
  minLuminanceCode?: number;
  /** Bytes after byte 5, kept verbatim. Set only when present. */
  trailing?: Uint8Array;
  /** Body length when the block was shorter than its two mandatory bytes. */
  shortLength?: number;
}

/**
 * HDR Static Metadata EOTF flag options (CTA-861-G §7.5.6). `key` matches the
 * boolean-field name on `HDRStaticMetadataDataBlock['eotf']`.
 */
export const EOTF_FLAGS: ReadonlyArray<{ key: keyof HDRStaticMetadataDataBlock['eotf']; label: string }> = [
  { key: 'traditionalGammaSDR', label: 'Traditional Gamma SDR' },
  { key: 'traditionalGammaHDR', label: 'Traditional Gamma HDR' },
  { key: 'smpte2084', label: 'SMPTE ST 2084 (HDR10)' },
  { key: 'hlg', label: 'Hybrid Log-Gamma (HLG)' },
];

/**
 * cd/m² of a max / max-frame-average luminance code value:
 * 50 × 2^(CV/32) (CTA-861-G §7.5.6, as edid-decode prints it).
 */
export function hdrLuminanceFromCode(code: number): number {
  return 50 * Math.pow(2, code / 32);
}

/** Nearest max / max-frame-average luminance code value for a cd/m² figure. */
export function hdrLuminanceToCode(nits: number): number {
  if (!(nits > 0)) return 0;
  return clampByte(32 * Math.log2(nits / 50));
}

/**
 * cd/m² of a min luminance code value. It is relative to the max-luminance
 * code: max × (CV/255)² / 100.
 */
export function hdrMinLuminanceFromCode(maxCode: number, minCode: number): number {
  return hdrLuminanceFromCode(maxCode) * Math.pow(minCode / 255, 2) / 100;
}

/** Nearest min luminance code value for a cd/m² figure, given the max code. */
export function hdrMinLuminanceToCode(maxCode: number, nits: number): number {
  if (!(nits > 0)) return 0;
  return clampByte(255 * Math.sqrt((nits * 100) / hdrLuminanceFromCode(maxCode)));
}

export function decodeHDRStaticMetadataBlock(base: ExtendedDataBlock, payload: Uint8Array): HDRStaticMetadataDataBlock {
  const eotfByte = payload[0] ?? 0;
  const descriptorByte = payload[1] ?? 0;

  const block: HDRStaticMetadataDataBlock = {
    ...base,
    extendedTag: 0x06,
    eotf: {
      traditionalGammaSDR: (eotfByte & 0x01) !== 0,
      traditionalGammaHDR: (eotfByte & 0x02) !== 0,
      smpte2084: (eotfByte & 0x04) !== 0,
      hlg: (eotfByte & 0x08) !== 0,
    },
    staticMetadataType1: (descriptorByte & 0x01) !== 0,
  };
  if (eotfByte >> 4) block.eotfReserved = eotfByte >> 4;
  if (descriptorByte >> 1) block.metadataTypesReserved = descriptorByte >> 1;
  if (payload.length < 2) block.shortLength = payload.length;

  // Optional luminance bytes: their presence is the block length.
  if (payload.length >= 3) block.maxLuminanceCode = payload[2];
  if (payload.length >= 4) block.maxFrameAvgLuminanceCode = payload[3];
  if (payload.length >= 5) block.minLuminanceCode = payload[4];
  if (payload.length > 5) block.trailing = payload.slice(5);

  return block;
}

export function encodeHDRStaticMetadataBlock(block: HDRStaticMetadataDataBlock): Uint8Array {
  let eotfByte = clampInt(block.eotfReserved ?? 0, 0, 0x0f) << 4;
  if (block.eotf.traditionalGammaSDR) eotfByte |= 0x01;
  if (block.eotf.traditionalGammaHDR) eotfByte |= 0x02;
  if (block.eotf.smpte2084) eotfByte |= 0x04;
  if (block.eotf.hlg) eotfByte |= 0x08;
  let descriptorByte = clampInt(block.metadataTypesReserved ?? 0, 0, 0x7f) << 1;
  if (block.staticMetadataType1) descriptorByte |= 0x01;

  const bytes = [0x06, eotfByte, descriptorByte];

  // The optional bytes are positional: a later one forces the earlier ones
  // out (written as 0 when unset).
  const codes = [block.maxLuminanceCode, block.maxFrameAvgLuminanceCode, block.minLuminanceCode];
  const trailing = block.trailing ?? new Uint8Array();
  let last = -1;
  codes.forEach((code, i) => { if (code !== undefined) last = i; });
  if (trailing.length > 0) last = codes.length - 1;
  for (let i = 0; i <= last; i++) bytes.push(clampByte(codes[i] ?? 0));
  for (const b of trailing) bytes.push(b);

  // shortLength counts body bytes; the output also carries the ext-tag byte.
  return keepShortLength(
    new Uint8Array(bytes),
    block.shortLength === undefined ? undefined : block.shortLength + 1,
  );
}
