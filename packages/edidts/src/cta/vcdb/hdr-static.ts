/**
 * HDR Static Metadata Data Block (CTA-861-G §7.5.6, Extended Tag 6)
 *
 * VCDB-family block (see `cta/vcdb/`): defines HDR capabilities and
 * luminance values.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';

export interface HDRStaticMetadataDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x06;
  eotf: {
    traditionalGammaSDR: boolean;    // Traditional gamma - SDR luminance range
    traditionalGammaHDR: boolean;    // Traditional gamma - HDR luminance range
    smpte2084: boolean;              // SMPTE ST 2084 (PQ curve / HDR10)
    hlg: boolean;                    // Hybrid Log-Gamma
  };
  staticMetadataType1: boolean;       // Static Metadata Descriptor Type 1
  maxLuminance?: number;              // Desired Content Max Luminance (cd/m²)
  maxFrameAvgLuminance?: number;      // Desired Content Max Frame-avg Luminance (cd/m²)
  minLuminance?: number;              // Desired Content Min Luminance (cd/m²)
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

export function decodeHDRStaticMetadataBlock(base: ExtendedDataBlock, payload: Uint8Array): HDRStaticMetadataDataBlock {
  const eotfByte = payload[0] || 0;
  const descriptorByte = payload[1] || 0;

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

  // Optional luminance data (bytes 3-5)
  if (payload.length >= 3) {
    // Desired Content Max Luminance = 50 * 2^(CV/32)
    const cv = payload[2];
    block.maxLuminance = Math.round(50 * Math.pow(2, cv / 32));
  }
  if (payload.length >= 4) {
    const cv = payload[3];
    block.maxFrameAvgLuminance = Math.round(50 * Math.pow(2, cv / 32));
  }
  if (payload.length >= 5) {
    // Min Luminance = (Max Luminance) * (CV/255)^2 / 100
    const cv = payload[4];
    const maxLum = block.maxLuminance ?? 0;
    block.minLuminance = Math.round((maxLum * Math.pow(cv / 255, 2) / 100) * 10000) / 10000;
  }

  return block;
}

export function encodeHDRStaticMetadataBlock(block: HDRStaticMetadataDataBlock): Uint8Array {
  let eotfByte = 0;
  let descriptorByte = 0;

  if (block.eotf.traditionalGammaSDR) eotfByte |= 0x01;
  if (block.eotf.traditionalGammaHDR) eotfByte |= 0x02;
  if (block.eotf.smpte2084) eotfByte |= 0x04;
  if (block.eotf.hlg) eotfByte |= 0x08;
  if (block.staticMetadataType1) descriptorByte |= 0x01;

  const bytes = [0x06, eotfByte, descriptorByte];

  // Optional luminance values
  if (block.maxLuminance !== undefined) {
    // CV = 32 * log2(maxLum / 50)
    const cv = Math.round(32 * Math.log2(block.maxLuminance / 50));
    bytes.push(Math.max(0, Math.min(255, cv)));
  }
  if (block.maxFrameAvgLuminance !== undefined) {
    const cv = Math.round(32 * Math.log2(block.maxFrameAvgLuminance / 50));
    bytes.push(Math.max(0, Math.min(255, cv)));
  }
  if (block.minLuminance !== undefined && block.maxLuminance !== undefined) {
    // CV = 255 * sqrt(minLum * 100 / maxLum)
    const cv = Math.round(255 * Math.sqrt(block.minLuminance * 100 / block.maxLuminance));
    bytes.push(Math.max(0, Math.min(255, cv)));
  }

  return new Uint8Array(bytes);
}