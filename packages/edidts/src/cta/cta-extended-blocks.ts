/**
 * CTA-861-G Extended Tag Data Blocks
 * 
 * When a CEA data block has tag 7 (Extended Tag), the first byte of the
 * payload contains the Extended Tag Code that identifies the specific block type.
 */

import type { CEADataBlock } from './extension-block';

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
  supportedTypes: number[];  // Dynamic metadata types supported
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
 */
export interface VendorSpecificVideoDataBlock extends ExtendedDataBlock {
  extendedTag: 0x01;
  ieeeOui: number;
  payload: Uint8Array;
  // Dolby Vision specific (OUI 0x00D046)
  dolbyVision?: {
    version: number;
    supportsYUV422_12bit: boolean;
    supports2160p60: boolean;
    supportsGlobalDimming: boolean;
  };
  // HDR10+ specific (OUI 0x90848B)
  hdr10Plus?: {
    applicationVersion: number;
  };
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
 */
export interface SpeakerLocationDataBlock extends ExtendedDataBlock {
  extendedTag: 0x14;
  speakerLocations: Array<{
    channelIndex: number;
    x: number;  // Position in cm
    y: number;
    z: number;
  }>;
}

/**
 * InfoFrame Data Block (Extended Tag 32)
 */
export interface InfoFrameDataBlock extends ExtendedDataBlock {
  extendedTag: 0x20;
  shortInfoFrameDescriptors: Array<{
    infoFrameType: number;
    payload: Uint8Array;
  }>;
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
  const supportedTypes: number[] = [];
  
  for (let i = 0; i < payload.length; i++) {
    supportedTypes.push(payload[i]);
  }

  return {
    ...base,
    extendedTag: 0x07,
    supportedTypes,
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
    vics.push({
      vic: byte & 0x7F,
      native: (byte & 0x80) !== 0,
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
  if (payload.length < 3) {
    return {
      ...base,
      extendedTag: 0x01,
      ieeeOui: 0,
      payload: new Uint8Array(),
    };
  }

  const ieeeOui = payload[0] | (payload[1] << 8) | (payload[2] << 16);
  const data = payload.slice(3);

  const block: VendorSpecificVideoDataBlock = {
    ...base,
    extendedTag: 0x01,
    ieeeOui,
    payload: data,
  };

  // Dolby Vision (OUI 0x00D046)
  if (ieeeOui === 0x00D046 && data.length >= 1) {
    block.dolbyVision = {
      version: (data[0] >> 5) & 0x07,
      supportsYUV422_12bit: (data[0] & 0x01) !== 0,
      supports2160p60: (data[0] & 0x02) !== 0,
      supportsGlobalDimming: (data[0] & 0x04) !== 0,
    };
  }

  return block;
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

function decodeSpeakerLocationBlock(base: ExtendedDataBlock, payload: Uint8Array): SpeakerLocationDataBlock {
  const speakerLocations: SpeakerLocationDataBlock['speakerLocations'] = [];
  
  // Each speaker location descriptor is variable length
  // Simplified parsing - each entry is 4 bytes: channel, x, y, z
  for (let i = 0; i + 4 <= payload.length; i += 4) {
    speakerLocations.push({
      channelIndex: payload[i],
      x: payload[i + 1],
      y: payload[i + 2],
      z: payload[i + 3],
    });
  }

  return {
    ...base,
    extendedTag: 0x14,
    speakerLocations,
  };
}

function decodeInfoFrameBlock(base: ExtendedDataBlock, payload: Uint8Array): InfoFrameDataBlock {
  const shortInfoFrameDescriptors: InfoFrameDataBlock['shortInfoFrameDescriptors'] = [];
  
  let offset = 0;
  while (offset + 2 <= payload.length) {
    const type = payload[offset];
    const length = payload[offset + 1];
    if (offset + 2 + length > payload.length) break;
    
    shortInfoFrameDescriptors.push({
      infoFrameType: type,
      payload: payload.slice(offset + 2, offset + 2 + length),
    });
    offset += 2 + length;
  }

  return {
    ...base,
    extendedTag: 0x20,
    shortInfoFrameDescriptors,
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
    case 0x0E:
      return encodeYCbCr420VideoBlock(block as YCbCr420VideoDataBlock);
    case 0x0F:
      return encodeYCbCr420CapabilityMapBlock(block as YCbCr420CapabilityMapDataBlock);
    default:
      // Return original data for unhandled types
      return block.data;
  }
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
