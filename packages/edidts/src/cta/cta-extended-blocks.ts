/**
 * CTA-861-G Extended Tag Data Blocks
 *
 * When a CEA data block has tag 7 (Extended Tag), the first byte of the
 * payload contains the Extended Tag Code that identifies the specific block type.
 */

import type { CEADataBlock } from './extension-block';
import { decodeVSVDB } from './vsvdb/registry';
import { isKnownVIC } from './vic-table';

export type ExtendedTagCode =
  | 0x00  // Video Capability Data Block
  | 0x01  // Vendor-Specific Video Data Block
  | 0x02  // VESA Video Display Device Information Data Block
  | 0x03  // VESA Video Timing Block Extension
  | 0x05  // Colorimetry Data Block
  | 0x06  // HDR Static Metadata Data Block
  | 0x07  // HDR Dynamic Metadata Data Block
  | 0x0D  // Video Format Preference Data Block
  | 0x0E  // YCbCr 4:2:0 Video Data Block
  | 0x0F  // YCbCr 4:2:0 Capability Map Data Block
  | 0x11  // Vendor-Specific Audio Data Block
  | 0x13  // Room Configuration Data Block
  | 0x14  // Speaker Location Data Block
  | 0x15  // Room Environment Data Block (EXPERIMENTAL — CTA-861-H §7.5.17)
  | 0x20  // InfoFrame Data Block
  | number;

export interface ExtendedDataBlock extends CEADataBlock {
  tag: 0x07;
  extendedTag: ExtendedTagCode;
}

/**
 * Video Capability Data Block (Extended Tag 0)
 * Defines video scan behavior and quantization range support
 */
export interface VideoCapabilityDataBlock extends ExtendedDataBlock {
  extendedTag: 0x00;
  ceVideoScanBehavior: 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both';
  itVideoScanBehavior: 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both';
  ptVideoScanBehavior: 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both';
  quantizationRangeSelectable: boolean;  // QS bit - RGB quantization range
  quantizationRangeYCC: boolean;         // QY bit - YCC quantization range
}

/**
 * Colorimetry Data Block (Extended Tag 5)
 * Defines supported colorimetry standards
 */
export interface ColorimetryDataBlock extends ExtendedDataBlock {
  extendedTag: 0x05;
  xvYCC601: boolean;
  xvYCC709: boolean;
  sYCC601: boolean;
  opYCC601: boolean;
  opRGB: boolean;
  bt2020cYCC: boolean;
  bt2020YCC: boolean;
  bt2020RGB: boolean;
  dciP3: boolean;
}

/**
 * HDR Static Metadata Data Block (Extended Tag 6)
 * Defines HDR capabilities and luminance values
 */
export interface HDRStaticMetadataDataBlock extends ExtendedDataBlock {
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
 * HDR Dynamic Metadata Data Block (Extended Tag 7)
 */
export interface HDRDynamicMetadataDataBlock extends ExtendedDataBlock {
  extendedTag: 0x07;
  /**
   * Supported HDR Dynamic Metadata Type entries (CTA-861-G Table 87).
   * Each entry: a 16-bit type code (Extended InfoFrame Type Code, Table 47),
   * an 8-bit Support Flags byte (format depends on the type, Tables 88-90),
   * and any optional fields that follow. `optionalFields` is empty in
   * CTA-861-G (length-3 == 0) but is carried for forward compatibility.
   */
  entries: Array<{
    type: number;            // 16-bit (LSB | MSB<<8)
    supportFlags: number;    // 8-bit
    optionalFields: Uint8Array;
  }>;
  /** Bytes after the last complete entry (preserved for byte-exact round-trip). */
  trailing: Uint8Array;
}

/**
 * Video Format Preference Data Block (Extended Tag 13)
 * Indicates preferred video formats in order
 */
export interface VideoFormatPreferenceDataBlock extends ExtendedDataBlock {
  extendedTag: 0x0D;
  svrs: Array<{
    vic?: number;      // If SVR < 128, it's a VIC
    dtdIndex?: number; // If SVR >= 129, it's DTD index (SVR - 128)
  }>;
}

/**
 * YCbCr 4:2:0 Video Data Block (Extended Tag 14)
 * Lists VICs that only support YCbCr 4:2:0
 */
export interface YCbCr420VideoDataBlock extends ExtendedDataBlock {
  extendedTag: 0x0E;
  vics: Array<{
    vic: number;
    native: boolean;
    /**
     * True iff `vic` has a definition in the CTA-861 VIC table. Populated on
     * decode to flag unknown/reserved VIC values; encode ignores it so the
     * numeric `vic` round-trips verbatim. Optional so programmatic literals
     * type-check without supplying it.
     */
    known?: boolean;
  }>;
}

/**
 * YCbCr 4:2:0 Capability Map Data Block (Extended Tag 15)
 * Bitmap indicating which SVDs in Video Data Block also support 4:2:0
 */
export interface YCbCr420CapabilityMapDataBlock extends ExtendedDataBlock {
  extendedTag: 0x0F;
  capabilityBitmap: Uint8Array;  // Each bit corresponds to an SVD
}

/**
 * Vendor-Specific Video Data Block (Extended Tag 1)
 *
 * The decoded per-vendor shape (Dolby Vision, HDR10+, ...) is no longer
 * surfaced on this carrier; see `./vsvdb/` for the registry of decoders
 * keyed by OUI. Callers needing the decoded form should look up the
 * decoder directly via `VENDOR_VSVDB_DECODERS[block.ieeeOui]`.
 */
export interface VendorSpecificVideoDataBlock extends ExtendedDataBlock {
  extendedTag: 0x01;
  ieeeOui: number;
  payload: Uint8Array;
}

/**
 * Vendor-Specific Audio Data Block (Extended Tag 17)
 */
export interface VendorSpecificAudioDataBlock extends ExtendedDataBlock {
  extendedTag: 0x11;
  ieeeOui: number;
  payload: Uint8Array;
}

/**
 * Room Configuration Data Block (Extended Tag 19)
 */
export interface RoomConfigurationDataBlock extends ExtendedDataBlock {
  extendedTag: 0x13;
  speakerCount: number;
  speakerPresenceDescriptor: number;
}

/**
 * Speaker Location Data Block (Extended Tag 20)
 *
 * CTA-861-G §7.5.16, Tables 92-94. The payload is a sequence of Speaker
 * Location Descriptors, each 2 bytes (no coordinates) or 5 bytes (with X/Y/Z
 * coordinates, when the COORD flag is set). Coordinates are signed 1.6
 * two's-complement values (Table 94): value = signedByte / 64.
 */
export interface SpeakerLocationDataBlock extends ExtendedDataBlock {
  extendedTag: 0x14;
  descriptors: Array<{
    channelIndex: number;  // 0-31 (bits 4:0 of byte 0)
    speakerId: number;      // 0-31 (bits 4:0 of byte 1, per Table 34)
    active: boolean;        // bit 5 of byte 0
    /** Present iff the COORD flag (bit 6 of byte 0) is set. */
    coordinates?: { x: number; y: number; z: number };
  }>;
  /** Bytes after the last complete descriptor (preserved for byte-exact round-trip). */
  trailing: Uint8Array;
}

/**
 * Room Environment Data Block (Extended Tag 0x15) — EXPERIMENTAL
 *
 * CTA-861-H §7.5.17 Room Environment Data Block; field semantics per
 * ITU-T H.265 Ambient Viewing Environment SEI (Annex D.3.39); layout not
 * verified against a parser — byte-identical round-trip is the correctness gate.
 *
 * Post-ext-tag payload (big-endian, fields optional — block may be shorter):
 *   bytes 0–3: Ambient Illuminance, 32-bit BE, units 0.0001 lux (0 = unknown)
 *   bytes 4–5: Ambient Light X, 16-bit BE, CIE 1931 x, units 0.00002
 *   bytes 6–7: Ambient Light Y, 16-bit BE, CIE 1931 y, units 0.00002
 */
export interface RoomEnvironmentDataBlock extends ExtendedDataBlock {
  extendedTag: 0x15;
  ambientIlluminance?: number;
  ambientLightX?: number;
  ambientLightY?: number;
}

/**
 * InfoFrame Data Block (Extended Tag 32)
 *
 * CTA-861-G §7.5.9, Tables 77-80. The payload begins with an InfoFrame
 * Processing Descriptor (a header byte carrying Length Lb in bits 7:5 plus
 * reserved bits 4:0, followed by a byte giving the number of additional
 * VSIFs that can be received simultaneously, followed by Lb extension
 * bytes), then optional Short InfoFrame / Short Vendor-Specific InfoFrame
 * Descriptors listed in priority order. Each descriptor header carries a
 * 3-bit Payload Length (bits 7:5) and a 5-bit InfoFrame Type Code (bits 4:0);
 * type 0x01 is the vendor-specific form (3-byte IEEE OUI + payload).
 */
export interface InfoFrameDataBlock extends ExtendedDataBlock {
  extendedTag: 0x20;
  /** Number of additional VSIFs that can be received simultaneously (byte 2). */
  additionalVsifs: number;
  /** Lb extension bytes of the Processing Descriptor (normally empty). */
  processingPayload: Uint8Array;
  descriptors: Array<
    | { kind: 'short'; infoFrameType: number; payload: Uint8Array }
    | { kind: 'vendor'; ieeeOui: number; payload: Uint8Array }
  >;
  /** Bytes after the last complete descriptor (preserved for byte-exact round-trip). */
  trailing: Uint8Array;
}

export type CTAExtendedDataBlock =
  | VideoCapabilityDataBlock
  | ColorimetryDataBlock
  | HDRStaticMetadataDataBlock
  | HDRDynamicMetadataDataBlock
  | VideoFormatPreferenceDataBlock
  | YCbCr420VideoDataBlock
  | YCbCr420CapabilityMapDataBlock
  | VendorSpecificVideoDataBlock
  | VendorSpecificAudioDataBlock
  | RoomConfigurationDataBlock
  | SpeakerLocationDataBlock
  | RoomEnvironmentDataBlock
  | InfoFrameDataBlock
  | ExtendedDataBlock;

/**
 * Decode an Extended Tag Data Block
 */
export function decodeExtendedDataBlock(blockData: Uint8Array): CTAExtendedDataBlock {
  if (blockData.length < 1) {
    return { tag: 0x07, extendedTag: 0, data: blockData };
  }

  const extendedTag = blockData[0] as ExtendedTagCode;
  const payload = blockData.slice(1);

  const base: ExtendedDataBlock = {
    tag: 0x07,
    extendedTag,
    data: blockData,
  };

  switch (extendedTag) {
    case 0x00:
      return decodeVideoCapabilityBlock(base, payload);
    case 0x05:
      return decodeColorimetryBlock(base, payload);
    case 0x06:
      return decodeHDRStaticMetadataBlock(base, payload);
    case 0x07:
      return decodeHDRDynamicMetadataBlock(base, payload);
    case 0x0D:
      return decodeVideoFormatPreferenceBlock(base, payload);
    case 0x0E:
      return decodeYCbCr420VideoBlock(base, payload);
    case 0x0F:
      return decodeYCbCr420CapabilityMapBlock(base, payload);
    case 0x01:
      return decodeVendorSpecificVideoBlock(base, payload);
    case 0x11:
      return decodeVendorSpecificAudioBlock(base, payload);
    case 0x13:
      return decodeRoomConfigurationBlock(base, payload);
    case 0x14:
      return decodeSpeakerLocationBlock(base, payload);
    case 0x15:
      return decodeRoomEnvironmentBlock(base, payload);
    case 0x20:
      return decodeInfoFrameBlock(base, payload);
    default:
      return base;
  }
}

function decodeVideoCapabilityBlock(base: ExtendedDataBlock, payload: Uint8Array): VideoCapabilityDataBlock {
  const byte = payload[0] || 0;
  
  const scanBehaviorMap: Record<number, 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both'> = {
    0: 'not_supported',
    1: 'always_overscanned',
    2: 'always_underscanned',
    3: 'both',
  };

  return {
    ...base,
    extendedTag: 0x00,
    ceVideoScanBehavior: scanBehaviorMap[byte & 0x03] ?? 'not_supported',
    itVideoScanBehavior: scanBehaviorMap[(byte >> 2) & 0x03] ?? 'not_supported',
    ptVideoScanBehavior: scanBehaviorMap[(byte >> 4) & 0x03] ?? 'not_supported',
    quantizationRangeSelectable: (byte & 0x40) !== 0,
    quantizationRangeYCC: (byte & 0x80) !== 0,
  };
}

function decodeColorimetryBlock(base: ExtendedDataBlock, payload: Uint8Array): ColorimetryDataBlock {
  const byte1 = payload[0] || 0;
  const byte2 = payload[1] || 0;

  return {
    ...base,
    extendedTag: 0x05,
    xvYCC601: (byte1 & 0x01) !== 0,
    xvYCC709: (byte1 & 0x02) !== 0,
    sYCC601: (byte1 & 0x04) !== 0,
    opYCC601: (byte1 & 0x08) !== 0,
    opRGB: (byte1 & 0x10) !== 0,
    bt2020cYCC: (byte1 & 0x20) !== 0,
    bt2020YCC: (byte1 & 0x40) !== 0,
    bt2020RGB: (byte1 & 0x80) !== 0,
    dciP3: (byte2 & 0x80) !== 0,
  };
}

function decodeHDRStaticMetadataBlock(base: ExtendedDataBlock, payload: Uint8Array): HDRStaticMetadataDataBlock {
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

function decodeHDRDynamicMetadataBlock(base: ExtendedDataBlock, payload: Uint8Array): HDRDynamicMetadataDataBlock {
  // CTA-861-G Table 87: repeated entries [Length L][Type LSB][Type MSB]
  // [SupportFlags][L-3 optional bytes]. Entry stride = 1 + L. L < 3 is
  // malformed; stop at the first incomplete entry and keep the rest as
  // trailing so the block round-trips byte-identically.
  const entries: HDRDynamicMetadataDataBlock['entries'] = [];
  let i = 0;
  while (i < payload.length) {
    const len = payload[i];
    if (len < 3 || i + 1 + len > payload.length) break;
    const type = payload[i + 1] | (payload[i + 2] << 8);
    const supportFlags = payload[i + 3];
    const optionalFields = payload.slice(i + 4, i + 1 + len);
    entries.push({ type, supportFlags, optionalFields });
    i += 1 + len;
  }

  return {
    ...base,
    extendedTag: 0x07,
    entries,
    trailing: payload.slice(i),
  };
}

function decodeVideoFormatPreferenceBlock(base: ExtendedDataBlock, payload: Uint8Array): VideoFormatPreferenceDataBlock {
  const svrs: VideoFormatPreferenceDataBlock['svrs'] = [];

  for (let i = 0; i < payload.length; i++) {
    const svr = payload[i];
    if (svr === 0) continue;
    
    if (svr < 128) {
      svrs.push({ vic: svr });
    } else if (svr >= 129) {
      svrs.push({ dtdIndex: svr - 128 });
    }
  }

  return {
    ...base,
    extendedTag: 0x0D,
    svrs,
  };
}

function decodeYCbCr420VideoBlock(base: ExtendedDataBlock, payload: Uint8Array): YCbCr420VideoDataBlock {
  const vics: YCbCr420VideoDataBlock['vics'] = [];

  for (let i = 0; i < payload.length; i++) {
    const byte = payload[i];
    const vic = byte & 0x7F;
    vics.push({
      vic,
      native: (byte & 0x80) !== 0,
      known: isKnownVIC(vic),
    });
  }

  return {
    ...base,
    extendedTag: 0x0E,
    vics,
  };
}

function decodeYCbCr420CapabilityMapBlock(base: ExtendedDataBlock, payload: Uint8Array): YCbCr420CapabilityMapDataBlock {
  return {
    ...base,
    extendedTag: 0x0F,
    capabilityBitmap: payload,
  };
}

function decodeVendorSpecificVideoBlock(base: ExtendedDataBlock, payload: Uint8Array): VendorSpecificVideoDataBlock {
  return decodeVSVDB(base, payload);
}

function decodeVendorSpecificAudioBlock(base: ExtendedDataBlock, payload: Uint8Array): VendorSpecificAudioDataBlock {
  if (payload.length < 3) {
    return {
      ...base,
      extendedTag: 0x11,
      ieeeOui: 0,
      payload: new Uint8Array(),
    };
  }

  const ieeeOui = payload[0] | (payload[1] << 8) | (payload[2] << 16);

  return {
    ...base,
    extendedTag: 0x11,
    ieeeOui,
    payload: payload.slice(3),
  };
}

function decodeRoomConfigurationBlock(base: ExtendedDataBlock, payload: Uint8Array): RoomConfigurationDataBlock {
  return {
    ...base,
    extendedTag: 0x13,
    speakerCount: payload[0] || 0,
    speakerPresenceDescriptor: payload[1] || 0,
  };
}

/** Decode a signed 1.6 two's-complement coordinate byte (Table 94): value = signedByte / 64. */
function decodeCoordinate(byte: number): number {
  const signed = byte > 0x7f ? byte - 0x100 : byte;
  return signed / 64;
}

/** Encode a coordinate value to a signed 1.6 two's-complement byte (clamped to [-128, 127]). */
function encodeCoordinate(value: number): number {
  const scaled = Math.round(value * 64);
  const clamped = Math.max(-128, Math.min(127, scaled));
  return clamped & 0xff;
}

function decodeSpeakerLocationBlock(base: ExtendedDataBlock, payload: Uint8Array): SpeakerLocationDataBlock {
  // CTA-861-G Tables 92-94: descriptors are 2 bytes (no coords) or 5 bytes
  // (COORD flag set). Byte 0: bit7=0, bit6=COORD, bit5=Active, bits4:0=Channel
  // Index. Byte 1: bits4:0=Speaker ID. If COORD, 3 signed 1.6 coordinate bytes.
  const descriptors: SpeakerLocationDataBlock['descriptors'] = [];
  let i = 0;
  while (i + 2 <= payload.length) {
    const byte0 = payload[i];
    const byte1 = payload[i + 1];
    const coord = (byte0 & 0x40) !== 0;
    const stride = coord ? 5 : 2;
    if (i + stride > payload.length) break;
    const descriptor: SpeakerLocationDataBlock['descriptors'][0] = {
      channelIndex: byte0 & 0x1f,
      speakerId: byte1 & 0x1f,
      active: (byte0 & 0x20) !== 0,
    };
    if (coord) {
      descriptor.coordinates = {
        x: decodeCoordinate(payload[i + 2]),
        y: decodeCoordinate(payload[i + 3]),
        z: decodeCoordinate(payload[i + 4]),
      };
    }
    descriptors.push(descriptor);
    i += stride;
  }

  return {
    ...base,
    extendedTag: 0x14,
    descriptors,
    trailing: payload.slice(i),
  };
}

function decodeRoomEnvironmentBlock(base: ExtendedDataBlock, payload: Uint8Array): RoomEnvironmentDataBlock {
  // EXPERIMENTAL — CTA-861-H §7.5.17 Room Environment Data Block;
  // field semantics per ITU-T H.265 Ambient Viewing Environment SEI;
  // layout not verified against a parser — byte-identical round-trip is the correctness gate.
  const block: RoomEnvironmentDataBlock = { ...base, extendedTag: 0x15 };
  if (payload.length >= 4) {
    block.ambientIlluminance = ((payload[0] << 24) | (payload[1] << 16) | (payload[2] << 8) | payload[3]) >>> 0;
  }
  if (payload.length >= 6) {
    block.ambientLightX = (payload[4] << 8) | payload[5];
  }
  if (payload.length >= 8) {
    block.ambientLightY = (payload[6] << 8) | payload[7];
  }
  return block;
}

function decodeInfoFrameBlock(base: ExtendedDataBlock, payload: Uint8Array): InfoFrameDataBlock {
  // CTA-861-G Tables 77-80. The payload begins with an InfoFrame Processing
  // Descriptor: header byte 0 (Length Lb in bits 7:5, reserved bits 4:0),
  // byte 1 = number of additional VSIFs, then Lb extension bytes. Then
  // optional Short InfoFrame / Short Vendor-Specific InfoFrame Descriptors,
  // each with a 3-bit Payload Length (bits 7:5) and 5-bit Type Code (bits 4:0).
  if (payload.length < 2) {
    return {
      ...base,
      extendedTag: 0x20,
      additionalVsifs: 0,
      processingPayload: new Uint8Array(),
      descriptors: [],
      trailing: payload.slice(),
    };
  }

  const header = payload[0];
  const lb = (header >> 5) & 0x07;
  const additionalVsifs = payload[1];
  const processingPayload = payload.slice(2, 2 + lb);

  const descriptors: InfoFrameDataBlock['descriptors'] = [];
  let i = 2 + lb;
  while (i < payload.length) {
    const descHeader = payload[i];
    const payloadLen = (descHeader >> 5) & 0x07;
    const typeCode = descHeader & 0x1f;
    if (typeCode === 0x01) {
      // Short Vendor-Specific InfoFrame Descriptor (Table 80): 3-byte OUI + payload.
      if (i + 1 + 3 + payloadLen > payload.length) break;
      const ieeeOui = payload[i + 1] | (payload[i + 2] << 8) | (payload[i + 3] << 16);
      const descPayload = payload.slice(i + 4, i + 4 + payloadLen);
      descriptors.push({ kind: 'vendor', ieeeOui, payload: descPayload });
      i += 4 + payloadLen;
    } else if (typeCode === 0x00) {
      // 0x00 is reserved as a descriptor type code; stop parsing.
      break;
    } else {
      // Short InfoFrame Descriptor (Table 79): payloadLen bytes of payload.
      if (i + 1 + payloadLen > payload.length) break;
      const descPayload = payload.slice(i + 1, i + 1 + payloadLen);
      descriptors.push({ kind: 'short', infoFrameType: typeCode, payload: descPayload });
      i += 1 + payloadLen;
    }
  }

  return {
    ...base,
    extendedTag: 0x20,
    additionalVsifs,
    processingPayload,
    descriptors,
    trailing: payload.slice(i),
  };
}

/**
 * Encode an Extended Tag Data Block to bytes
 */
export function encodeExtendedDataBlock(block: CTAExtendedDataBlock): Uint8Array {
  switch (block.extendedTag) {
    case 0x00:
      return encodeVideoCapabilityBlock(block as VideoCapabilityDataBlock);
    case 0x05:
      return encodeColorimetryBlock(block as ColorimetryDataBlock);
    case 0x06:
      return encodeHDRStaticMetadataBlock(block as HDRStaticMetadataDataBlock);
    case 0x07:
      return encodeHDRDynamicMetadataBlock(block as HDRDynamicMetadataDataBlock);
    case 0x0D:
      return encodeVideoFormatPreferenceBlock(block as VideoFormatPreferenceDataBlock);
    case 0x0E:
      return encodeYCbCr420VideoBlock(block as YCbCr420VideoDataBlock);
    case 0x0F:
      return encodeYCbCr420CapabilityMapBlock(block as YCbCr420CapabilityMapDataBlock);
    case 0x11:
      return encodeVendorSpecificAudioBlock(block as VendorSpecificAudioDataBlock);
    case 0x13:
      return encodeRoomConfigurationBlock(block as RoomConfigurationDataBlock);
    case 0x01:
      return encodeVendorSpecificVideoBlock(block as VendorSpecificVideoDataBlock);
    case 0x14:
      return encodeSpeakerLocationBlock(block as SpeakerLocationDataBlock);
    case 0x15:
      return encodeRoomEnvironmentBlock(block as RoomEnvironmentDataBlock);
    case 0x20:
      return encodeInfoFrameBlock(block as InfoFrameDataBlock);
    default:
      // Return original data for unhandled types
      return block.data;
  }
}

function encodeVendorSpecificVideoBlock(block: VendorSpecificVideoDataBlock): Uint8Array {
  const bytes = [0x01, block.ieeeOui & 0xff, (block.ieeeOui >> 8) & 0xff, (block.ieeeOui >> 16) & 0xff];
  for (const b of block.payload) bytes.push(b);
  return new Uint8Array(bytes);
}

function encodeSpeakerLocationBlock(block: SpeakerLocationDataBlock): Uint8Array {
  const bytes = [0x14];
  for (const d of block.descriptors) {
    let byte0 = 0;
    if (d.coordinates) byte0 |= 0x40;          // COORD
    if (d.active) byte0 |= 0x20;                // Active
    byte0 |= d.channelIndex & 0x1f;            // Channel Index
    const byte1 = d.speakerId & 0x1f;           // Speaker ID
    bytes.push(byte0, byte1);
    if (d.coordinates) {
      bytes.push(
        encodeCoordinate(d.coordinates.x),
        encodeCoordinate(d.coordinates.y),
        encodeCoordinate(d.coordinates.z),
      );
    }
  }
  for (const b of block.trailing ?? []) bytes.push(b);
  return new Uint8Array(bytes);
}

function encodeInfoFrameBlock(block: InfoFrameDataBlock): Uint8Array {
  const bytes = [0x20];
  // InfoFrame Processing Descriptor: header (Lb in bits 7:5) + additionalVsifs + Lb bytes.
  const lb = (block.processingPayload?.length ?? 0) & 0x07;
  bytes.push((lb << 5) & 0xff, block.additionalVsifs & 0xff);
  for (const b of block.processingPayload ?? []) bytes.push(b);
  for (const desc of block.descriptors ?? []) {
    const payloadLen = (desc.payload.length) & 0x07;
    if (desc.kind === 'vendor') {
      bytes.push((payloadLen << 5) | 0x01);
      bytes.push(desc.ieeeOui & 0xff, (desc.ieeeOui >> 8) & 0xff, (desc.ieeeOui >> 16) & 0xff);
      for (const b of desc.payload) bytes.push(b);
    } else {
      bytes.push((payloadLen << 5) | (desc.infoFrameType & 0x1f));
      for (const b of desc.payload) bytes.push(b);
    }
  }
  for (const b of block.trailing ?? []) bytes.push(b);
  return new Uint8Array(bytes);
}

function encodeHDRDynamicMetadataBlock(block: HDRDynamicMetadataDataBlock): Uint8Array {
  const bytes = [0x07];
  for (const e of block.entries) {
    const len = (3 + (e.optionalFields?.length ?? 0)) & 0xff;
    bytes.push(len);
    bytes.push(e.type & 0xff, (e.type >> 8) & 0xff, e.supportFlags & 0xff);
    for (const b of e.optionalFields ?? []) bytes.push(b);
  }
  for (const b of block.trailing ?? []) bytes.push(b);
  return new Uint8Array(bytes);
}

function encodeVideoFormatPreferenceBlock(block: VideoFormatPreferenceDataBlock): Uint8Array {
  const bytes = [0x0d];
  for (const svr of block.svrs) {
    if (svr.vic !== undefined) {
      // VICs occupy byte values 1..127; a 0 byte means "no entry".
      if (svr.vic > 0 && svr.vic < 128) bytes.push(svr.vic);
    } else if (svr.dtdIndex !== undefined) {
      // DTD indices are carried as 128 + index (129..255).
      bytes.push(128 + svr.dtdIndex);
    }
  }
  return new Uint8Array(bytes);
}

function encodeVendorSpecificAudioBlock(block: VendorSpecificAudioDataBlock): Uint8Array {
  const bytes = [
    0x11,
    block.ieeeOui & 0xff,
    (block.ieeeOui >> 8) & 0xff,
    (block.ieeeOui >> 16) & 0xff,
  ];
  for (const b of block.payload) bytes.push(b);
  return new Uint8Array(bytes);
}

function encodeRoomConfigurationBlock(block: RoomConfigurationDataBlock): Uint8Array {
  return new Uint8Array([0x13, block.speakerCount & 0xff, block.speakerPresenceDescriptor & 0xff]);
}

function encodeRoomEnvironmentBlock(block: RoomEnvironmentDataBlock): Uint8Array {
  // EXPERIMENTAL — CTA-861-H §7.5.17 Room Environment Data Block;
  // field semantics per ITU-T H.265 Ambient Viewing Environment SEI;
  // layout not verified against a parser — byte-identical round-trip is the correctness gate.
  // Slice-and-overwrite: start from block.data (which includes the ext-tag byte at index 0);
  // payload starts at index 1. Reserved/trailing bytes are preserved.
  const out = block.data.slice();
  if (block.ambientIlluminance !== undefined && out.length >= 5) {
    const v = block.ambientIlluminance >>> 0;
    out[1] = (v >>> 24) & 0xff;
    out[2] = (v >>> 16) & 0xff;
    out[3] = (v >>> 8) & 0xff;
    out[4] = v & 0xff;
  }
  if (block.ambientLightX !== undefined && out.length >= 7) {
    out[5] = (block.ambientLightX >> 8) & 0xff;
    out[6] = block.ambientLightX & 0xff;
  }
  if (block.ambientLightY !== undefined && out.length >= 9) {
    out[7] = (block.ambientLightY >> 8) & 0xff;
    out[8] = block.ambientLightY & 0xff;
  }
  return out;
}

function encodeVideoCapabilityBlock(block: VideoCapabilityDataBlock): Uint8Array {
  const scanMap: Record<string, number> = {
    'not_supported': 0,
    'always_overscanned': 1,
    'always_underscanned': 2,
    'both': 3,
  };

  let byte = 0;
  byte |= scanMap[block.ceVideoScanBehavior] ?? 0;
  byte |= (scanMap[block.itVideoScanBehavior] ?? 0) << 2;
  byte |= (scanMap[block.ptVideoScanBehavior] ?? 0) << 4;
  if (block.quantizationRangeSelectable) byte |= 0x40;
  if (block.quantizationRangeYCC) byte |= 0x80;

  return new Uint8Array([0x00, byte]);
}

function encodeColorimetryBlock(block: ColorimetryDataBlock): Uint8Array {
  let byte1 = 0;
  let byte2 = 0;

  if (block.xvYCC601) byte1 |= 0x01;
  if (block.xvYCC709) byte1 |= 0x02;
  if (block.sYCC601) byte1 |= 0x04;
  if (block.opYCC601) byte1 |= 0x08;
  if (block.opRGB) byte1 |= 0x10;
  if (block.bt2020cYCC) byte1 |= 0x20;
  if (block.bt2020YCC) byte1 |= 0x40;
  if (block.bt2020RGB) byte1 |= 0x80;
  if (block.dciP3) byte2 |= 0x80;

  return new Uint8Array([0x05, byte1, byte2]);
}

function encodeHDRStaticMetadataBlock(block: HDRStaticMetadataDataBlock): Uint8Array {
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

function encodeYCbCr420VideoBlock(block: YCbCr420VideoDataBlock): Uint8Array {
  const bytes = [0x0E];
  for (const vic of block.vics) {
    bytes.push((vic.native ? 0x80 : 0) | (vic.vic & 0x7F));
  }
  return new Uint8Array(bytes);
}

function encodeYCbCr420CapabilityMapBlock(block: YCbCr420CapabilityMapDataBlock): Uint8Array {
  const bytes = new Uint8Array(1 + block.capabilityBitmap.length);
  bytes[0] = 0x0F;
  bytes.set(block.capabilityBitmap, 1);
  return bytes;
}
