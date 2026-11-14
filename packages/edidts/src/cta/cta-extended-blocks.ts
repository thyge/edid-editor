/**
 * CTA-861-G Extended Tag Data Blocks
 *
 * When a CEA data block has tag 7 (Extended Tag), the first byte of the
 * payload contains the Extended Tag Code that identifies the specific block type.
 *
 * Note: the VCDB-family blocks (Video Capability 0x00, VSVDB 0x01,
 * HDR Static 0x06, Video Format Preference 0x0D, YCbCr 4:2:0 Video 0x0E /
 * Capability Map 0x0F, VSADB 0x11, InfoFrame 0x20) live in `./vcdb/`; this
 * module holds the non-family blocks plus the tag-keyed
 * `EXTENDED_BLOCK_CODECS` registry, which imports the family codecs from
 * `./vcdb/`.
 */

import type { CEADataBlock, SpeakerAllocationBlock } from './extension-block';
import { decodeHDRStaticMetadataBlock, encodeHDRStaticMetadataBlock } from './vcdb/hdr-static';
import type { HDRStaticMetadataDataBlock } from './vcdb/hdr-static';
import { decodeInfoFrameBlock, encodeInfoFrameBlock } from './vcdb/infoframe';
import type { InfoFrameDataBlock } from './vcdb/infoframe';
import { decodeVendorSpecificVideoBlock, encodeVendorSpecificVideoBlock } from './vcdb/vendor-specific-video';
import type { VendorSpecificVideoDataBlock } from './vcdb/vendor-specific-video';
import { decodeVSADB, encodeVSADB } from './vcdb/vsadb';
import type { VendorSpecificAudioDataBlock } from './vcdb/vsadb';
import { decodeVideoCapabilityBlock, encodeVideoCapabilityBlock } from './vcdb/video-capability';
import type { VideoCapabilityDataBlock } from './vcdb/video-capability';
import { decodeVideoFormatPreferenceBlock, encodeVideoFormatPreferenceBlock } from './vcdb/video-format-preference';
import type { VideoFormatPreferenceDataBlock } from './vcdb/video-format-preference';
import { decodeYCbCr420CapabilityMapBlock, encodeYCbCr420CapabilityMapBlock } from './vcdb/ycbcr420-capability-map';
import type { YCbCr420CapabilityMapDataBlock } from './vcdb/ycbcr420-capability-map';
import { decodeYCbCr420VideoBlock, encodeYCbCr420VideoBlock } from './vcdb/ycbcr420-video';
import type { YCbCr420VideoDataBlock } from './vcdb/ycbcr420-video';
import { clampByte, clampInt, keepShortLength } from './byte-utils';

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
 * Colorimetry Data Block (Extended Tag 5)
 * Defines supported colorimetry standards.
 *
 * Layout per CTA-861-G §7.5.5 / CTA-861.6 and edid-decode
 * `cta_colorimetry_block` (parse-cta-block.cpp): byte 1 bits 7:0 are
 * BT2020RGB … xvYCC601; byte 2 bit 7 ST 2113 RGB (DCI-P3), bit 6 ICtCp,
 * bit 5 sRGB, bit 4 Default, bits 3:1 reserved (F41-F43), bit 0 MD0 (Gamut
 * Boundary Description Metadata Profile P0).
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
  /** Byte 2 bit 7: DCI-P3 (CTA-861-G), named ST 2113 RGB since CTA-861-H. */
  dciP3: boolean;
  /** Byte 2 bit 6: ICtCp. */
  ictcp: boolean;
  /** Byte 2 bit 5: sRGB (CTA-861.6). */
  sRGB: boolean;
  /** Byte 2 bit 4: Default RGB colorimetry (CTA-861.6). */
  defaultRGB: boolean;
  /** Byte 2 bit 0: MD0, Gamut Boundary Description Metadata Profile P0. */
  gamutMetadataP0: boolean;
  /**
   * Byte 2 bits 3:1 (MD1-MD3 in CTA-861-G, reserved F41-F43 since), shifted
   * down (0–7). Kept so they survive a re-encode. Optional; absent means 0.
   */
  metadataReserved?: number;
  /** Bytes after byte 2, kept verbatim. Set only when present. */
  trailing?: Uint8Array;
  /**
   * Body length when the block was shorter than its 2 bytes (real EDIDs ship
   * 1-byte Colorimetry blocks); encode keeps it until a byte-2 flag is set.
   */
  shortLength?: number;
}

/** Boolean flag fields of `ColorimetryDataBlock` (one per wire bit). */
export type ColorimetryFlagKey =
  | 'xvYCC601' | 'xvYCC709' | 'sYCC601' | 'opYCC601' | 'opRGB'
  | 'bt2020cYCC' | 'bt2020YCC' | 'bt2020RGB'
  | 'dciP3' | 'ictcp' | 'sRGB' | 'defaultRGB' | 'gamutMetadataP0';

/**
 * Colorimetry Data Block flag options (CTA-861-G §7.5.5). `key` matches the
 * boolean-field name on `ColorimetryDataBlock`; `label` is the display string.
 */
export const COLORIMETRY_FLAGS: ReadonlyArray<{
  key: ColorimetryFlagKey;
  label: string;
}> = [
  { key: 'xvYCC601', label: 'xvYCC601' },
  { key: 'xvYCC709', label: 'xvYCC709' },
  { key: 'sYCC601', label: 'sYCC601' },
  { key: 'opYCC601', label: 'opYCC601' },
  { key: 'opRGB', label: 'opRGB' },
  { key: 'bt2020cYCC', label: 'BT.2020 cYCC' },
  { key: 'bt2020YCC', label: 'BT.2020 YCC' },
  { key: 'bt2020RGB', label: 'BT.2020 RGB' },
  { key: 'dciP3', label: 'DCI-P3 (ST 2113 RGB)' },
  { key: 'ictcp', label: 'ICtCp' },
  { key: 'sRGB', label: 'sRGB' },
  { key: 'defaultRGB', label: 'Default RGB' },
  { key: 'gamutMetadataP0', label: 'Gamut Metadata P0 (MD0)' },
];

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
 * Room Configuration Data Block (Extended Tag 19)
 *
 * CTA-861-G §7.5.15; layout per edid-decode `cta_rcdb` (parse-cta-block.cpp):
 *   byte 0     bit 7 Display, bit 6 Speaker, bit 5 SLD,
 *              bits 4:0 speaker count − 1 (meaningful when Speaker is set)
 *   bytes 1-3  Speaker Presence Mask, 24-bit little-endian (same bit order
 *              as the Speaker Allocation Data Block)
 *   bytes 4-6  Xmax, Ymax, Zmax in decimeters (optional)
 *   bytes 7-9  Display X/Y/Z, signed 1.6 fractions of the max (optional)
 */
export interface RoomConfigurationDataBlock extends ExtendedDataBlock {
  extendedTag: 0x13;
  /** Byte 0 bit 7: the Display coordinates (bytes 7-9) are valid. */
  display: boolean;
  /** Byte 0 bit 6: the speaker count is valid. */
  speaker: boolean;
  /** Byte 0 bit 5: a Speaker Location Data Block is present. */
  sld: boolean;
  /** Byte 0 bits 4:0 + 1 (1–32). */
  speakerCount: number;
  /** Bytes 1-3: 24-bit Speaker Presence Mask. */
  speakerPresenceMask: number;
  /** Bytes 4-6: Xmax/Ymax/Zmax in dm (0–255), present iff the block carries them. */
  max?: { x: number; y: number; z: number };
  /** Bytes 7-9: display position as fractions of the max (signed 1.6, −2..+1.984). */
  displayPosition?: { x: number; y: number; z: number };
  /** Bytes after the last complete group (malformed lengths), kept verbatim. */
  trailing: Uint8Array;
  /** Body length when the block was shorter than its 4 mandatory bytes. */
  shortLength?: number;
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
    /** Byte 0 bit 7 (reserved), kept so it survives a re-encode. Set only when on. */
    channelReserved?: boolean;
    /** Byte 1 bits 7:5 (reserved), shifted down (0–7). Set only when non-zero. */
    speakerIdReserved?: number;
  }>;
  /** Bytes after the last complete descriptor (preserved for byte-exact round-trip). */
  trailing: Uint8Array;
}

/**
 * CTA-861-G Table 34 "Speaker Placement" — the canonical speaker designation
 * codes (0x00–0x1F) shared by the Audio InfoFrame channel allocation, the
 * Speaker Allocation Data Block, and the Speaker Location Data Block.
 *
 * Consistent with ISO/IEC 62574. Codes 0x1C–0x1F are reserved.
 */
export interface SpeakerPlacement {
  /** Speaker designation code (Table 34 "Code" column). */
  id: number;
  /** Short label (e.g. "FL", "LFE1"). */
  code: string;
  /** Human-readable position description. */
  label: string;
}

export const SPEAKER_PLACEMENT: ReadonlyArray<SpeakerPlacement> = [
  { id: 0x00, code: 'FL', label: 'Front Left' },
  { id: 0x01, code: 'FR', label: 'Front Right' },
  { id: 0x02, code: 'FC', label: 'Front Center' },
  { id: 0x03, code: 'LFE1', label: 'Low Frequency Effects 1' },
  { id: 0x04, code: 'BL', label: 'Back Left' },
  { id: 0x05, code: 'BR', label: 'Back Right' },
  { id: 0x06, code: 'FLc', label: 'Front Left of Center' },
  { id: 0x07, code: 'FRc', label: 'Front Right of Center' },
  { id: 0x08, code: 'BC', label: 'Back Center' },
  { id: 0x09, code: 'LFE2', label: 'Low Frequency Effects 2' },
  { id: 0x0a, code: 'SiL', label: 'Side Left' },
  { id: 0x0b, code: 'SiR', label: 'Side Right' },
  { id: 0x0c, code: 'TpFL', label: 'Top Front Left' },
  { id: 0x0d, code: 'TpFR', label: 'Top Front Right' },
  { id: 0x0e, code: 'TpFC', label: 'Top Front Center' },
  { id: 0x0f, code: 'TpC', label: 'Top Center' },
  { id: 0x10, code: 'TpBL', label: 'Top Back Left' },
  { id: 0x11, code: 'TpBR', label: 'Top Back Right' },
  { id: 0x12, code: 'TpSiL', label: 'Top Side Left' },
  { id: 0x13, code: 'TpSiR', label: 'Top Side Right' },
  { id: 0x14, code: 'TpBC', label: 'Top Back Center' },
  { id: 0x15, code: 'BtFC', label: 'Bottom Front Center' },
  { id: 0x16, code: 'BtFL', label: 'Bottom Front Left' },
  { id: 0x17, code: 'BtFR', label: 'Bottom Front Right' },
  { id: 0x18, code: 'FLw', label: 'Front Left Wide' },
  { id: 0x19, code: 'FRw', label: 'Front Right Wide' },
  { id: 0x1a, code: 'LS', label: 'Left Surround' },
  { id: 0x1b, code: 'RS', label: 'Right Surround' },
];

/**
 * Maps a Speaker Allocation Data Block bit (CTA-861-G Table 69) to the
 * `SpeakerAllocationBlock.speakers` key that carries it, the SADB pair/single
 * label, and the Table 34 speaker-designation codes the bit covers.
 *
 * Two SADB designations — `RLC/RRC` (Rear Left/Right of Center) and
 * `TpLS/TpRS` (Top Left/Right Surround) — have no entry in Table 34, so their
 * `speakerIds` are empty; they are still modelled as SADB bits but cannot be
 * cross-referenced with a Speaker Location descriptor.
 */
export interface SpeakerAllocationBit {
  /** Field key on `SpeakerAllocationBlock.speakers`. */
  key: keyof SpeakerAllocationBlock['speakers'];
  /** SADB label as printed in Table 69 (e.g. "FL/FR", "LFE"). */
  label: string;
  /** Table 34 speaker-designation codes this bit represents (may be empty). */
  speakerIds: number[];
}

export const SPEAKER_ALLOCATION_BITS: ReadonlyArray<SpeakerAllocationBit> = [
  // byte 1
  { key: 'frontLeftRight', label: 'FL/FR', speakerIds: [0x00, 0x01] },
  { key: 'lfe', label: 'LFE', speakerIds: [0x03] },
  { key: 'frontCenter', label: 'FC', speakerIds: [0x02] },
  { key: 'rearLeftRight', label: 'BL/BR', speakerIds: [0x04, 0x05] },
  { key: 'rearCenter', label: 'BC', speakerIds: [0x08] },
  { key: 'frontLeftRightCenter', label: 'FLC/FRC', speakerIds: [0x06, 0x07] },
  { key: 'rearLeftRightCenter', label: 'RLC/RRC', speakerIds: [] },
  { key: 'frontLeftRightWide', label: 'FLW/FRW', speakerIds: [0x18, 0x19] },
  // byte 2
  { key: 'frontLeftRightHigh', label: 'TpFL/TpFR', speakerIds: [0x0c, 0x0d] },
  { key: 'topCenter', label: 'TpC', speakerIds: [0x0f] },
  { key: 'frontCenterHigh', label: 'TpFC', speakerIds: [0x0e] },
  { key: 'surroundLeftRight', label: 'LS/RS', speakerIds: [0x1a, 0x1b] },
  { key: 'lfe2', label: 'LFE2', speakerIds: [0x09] },
  { key: 'topBackCenter', label: 'TpBC', speakerIds: [0x14] },
  { key: 'sideLeftRight', label: 'SiL/SiR', speakerIds: [0x0a, 0x0b] },
  { key: 'topSideLeftRight', label: 'TpSiL/TpSiR', speakerIds: [0x12, 0x13] },
  // byte 3 (bits 7:4 reserved)
  { key: 'topBackLeftRight', label: 'TpBL/TpBR', speakerIds: [0x10, 0x11] },
  { key: 'bottomFrontCenter', label: 'BtFC', speakerIds: [0x15] },
  { key: 'bottomFrontLeftRight', label: 'BtFL/BtFR', speakerIds: [0x16, 0x17] },
  { key: 'topLeftRightSurround', label: 'TpLS/TpRS', speakerIds: [] },
];

/**
 * A single speaker position resolved from the Speaker Allocation Data Block
 * and/or the Speaker Location Data Block. Produced by `unifySpeakerLayout`.
 */
export interface UnifiedSpeaker {
  /** SADB field key when the position is declared via the allocation bitmask. */
  allocationKey?: keyof SpeakerAllocationBlock['speakers'];
  /** SADB pair/single label (Table 69). */
  allocationLabel?: string;
  /** Table 34 speaker-designation codes the position covers (may be empty). */
  speakerIds: number[];
  /** True when the SADB declares the speaker present. */
  present: boolean;
  /** Speaker Location descriptor matched by speakerId, when one exists. */
  location?: {
    channelIndex: number;
    active: boolean;
    coordinates?: { x: number; y: number; z: number };
  };
}

/**
 * Build a unified speaker model from the (optional) Speaker Allocation Data
 * Block and Speaker Location Data Block (CTA-861-G §7.5.3 / §7.5.16).
 *
 * The result has one entry per SADB bit (carrying its `present` flag), joined
 * with any Speaker Location descriptor whose `speakerId` overlaps the bit's
 * Table 34 codes. Speaker Location descriptors whose `speakerId` is not
 * covered by any SADB bit are appended as additional entries with
 * `present: false`. SADB bits with no Table 34 code (RLC/RRC, TpLS/TpRS) never
 * match a Location descriptor.
 */
export function unifySpeakerLayout(
  sadb?: SpeakerAllocationBlock,
  location?: SpeakerLocationDataBlock,
): UnifiedSpeaker[] {
  const byId = new Map<number, SpeakerLocationDataBlock['descriptors'][0]>();
  if (location) {
    for (const d of location.descriptors) {
      if (!byId.has(d.speakerId)) byId.set(d.speakerId, d);
    }
  }

  const matchedIds = new Set<number>();
  const result: UnifiedSpeaker[] = [];

  for (const bit of SPEAKER_ALLOCATION_BITS) {
    const present = sadb ? Boolean(sadb.speakers[bit.key]) : false;
    // Find the first Location descriptor whose speakerId this bit covers.
    let loc: UnifiedSpeaker['location'];
    for (const id of bit.speakerIds) {
      const d = byId.get(id);
      if (d) {
        matchedIds.add(id);
        loc = {
          channelIndex: d.channelIndex,
          active: d.active,
          coordinates: d.coordinates,
        };
        break;
      }
    }
    result.push({
      allocationKey: bit.key,
      allocationLabel: bit.label,
      speakerIds: [...bit.speakerIds],
      present,
      location: loc,
    });
  }

  // Append Location-only descriptors (speakerId not covered by any SADB bit).
  if (location) {
    for (const d of location.descriptors) {
      if (matchedIds.has(d.speakerId)) continue;
      result.push({
        speakerIds: [d.speakerId],
        present: false,
        location: {
          channelIndex: d.channelIndex,
          active: d.active,
          coordinates: d.coordinates,
        },
      });
    }
  }

  return result;
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
 * VESA Video Display Device Data Block (Extended Tag 0x02)
 *
 * Fixed 30-byte payload defined by the VESA Display Device Data Block (DDDB)
 * Standard, v1 (Sep 25 2006) and carried in CTA-861-G Annex A.5 (Table 57,
 * extended tag 2). Byte layout modeled on edid-decode `cta_vesa_vdddb`
 * (parse-cta-block.cpp:1330-1492). When the payload is not exactly 30 bytes
 * the block is malformed; decode falls back to the raw `data` form so it still
 * round-trips byte-identically.
 */
export interface VESAVideoDisplayDeviceDataBlock extends ExtendedDataBlock {
  extendedTag: 0x02;
  /** x[0] high nibble — interface category (see VESA_INTERFACE_CATEGORIES). */
  interfaceCategory: number;
  /** x[0] low nibble — lanes / channels / analog sub-type depending on category. */
  interfaceDetail: number;
  /** x[1] high nibble — interface standard version major. */
  interfaceStandardMajor: number;
  /** x[1] low nibble — interface standard version minor. */
  interfaceStandardMinor: number;
  /** x[2] content protection (see VESA_CONTENT_PROTECTION). */
  contentProtection: number;
  /** x[3] bits 7:2 — minimum clock frequency, MHz. */
  minClockMHz: number;
  /** x[3] bits 1:0 (high) | x[4] (low) — maximum clock frequency, MHz. */
  maxClockMHz: number;
  /** x[5]|x[6]<<8 — device native pixel format width. */
  nativePixelWidth: number;
  /** x[7]|x[8]<<8 — device native pixel format height. */
  nativePixelHeight: number;
  /** x[9] — aspect ratio raw byte; ratio = (100 + byte) / 100. */
  aspectRatio: number;
  /** x[0x0a] bits 7:6 — default orientation (see VESA_ORIENTATION). */
  orientation: number;
  /** x[0x0a] bits 5:4 — rotation capability (see VESA_ROTATION). */
  rotationCapability: number;
  /** x[0x0a] bits 3:2 — zero pixel location. */
  zeroPixelLocation: number;
  /** x[0x0a] bits 1:0 — scan direction. */
  scanDirection: number;
  /** x[0x0b] — subpixel information (see VESA_SUBPIXEL_INFORMATION). */
  subpixelInformation: number;
  /** x[0x0c] / 100 — horizontal dot/pixel pitch, mm. */
  horizontalPitchMm: number;
  /** x[0x0d] / 100 — vertical dot/pixel pitch, mm. */
  verticalPitchMm: number;
  /** x[0x0e] bits 7:6 — dithering (see VESA_DITHERING). */
  dithering: number;
  /** x[0x0e] bit 5 — direct drive. */
  directDrive: boolean;
  /** x[0x0e] bit 4 — overdrive recommended (bit is inverted: 0 = recommended). */
  overdriveRecommended: boolean;
  /** x[0x0e] bit 3 — deinterlacing. */
  deinterlacing: boolean;
  /** x[0x0f] bit 7 — audio support. */
  audioSupport: boolean;
  /** x[0x0f] bit 6 — separate audio inputs provided. */
  separateAudioInputs: boolean;
  /** x[0x0f] bit 5 — audio input override. */
  audioInputOverride: boolean;
  /** x[0x10] bits 6:0 × 2 — audio delay magnitude in ms (always ≥ 0). */
  audioDelayMs: number;
  /** x[0x10] bit 7 — true = positive delay, false = negative delay (preserves +0/−0). */
  audioDelayPositive: boolean;
  /** x[0x11] bits 7:6 — frame rate / mode conversion (see VESA_FRAME_RATE_CONVERSION). */
  frameRateConversion: number;
  /** x[0x11] bits 5:0 — frame rate range (fps ±), 0 = nominal. */
  frameRateRange: number;
  /** x[0x12] — nominal frame rate / frame-rate center, fps. */
  nominalFrameRate: number;
  /** x[0x13] bits 7:4 + 1 — color bit depth at interface. */
  colorBitDepthInterface: number;
  /** x[0x13] bits 3:0 + 1 — color bit depth at display. */
  colorBitDepthDisplay: number;
  /** x[0x15] bits 1:0 — number of additional primary chromaticities (0..3). */
  additionalPrimaryCount: number;
  /** Primary 4 chromaticity (10-bit x/y); null only conceptually — bytes are always present. */
  primary4: VESAChromaticity;
  /** Primary 5 chromaticity (10-bit x/y). */
  primary5: VESAChromaticity;
  /** Primary 6 chromaticity (10-bit x/y). */
  primary6: VESAChromaticity;
  /** x[0x1c] bit 7 — response-time direction (0 = Black→White, 1 = White→Black). */
  responseTimeDirection: number;
  /** x[0x1c] bits 6:0 — response time, ms. */
  responseTimeMs: number;
  /** x[0x1d] bits 7:4 — overscan horizontal, %. */
  overscanHorizontal: number;
  /** x[0x1d] bits 3:0 — overscan vertical, %. */
  overscanVertical: number;
  /** x[0x0e] bits 2:0 (reserved), kept so they survive a re-encode. Optional; absent means 0. */
  reserved0e?: number;
  /** x[0x0f] bits 4:0 (reserved). Optional; absent means 0. */
  reserved0f?: number;
  /** x[0x15] bits 3:2 (reserved), shifted down (0–3). Optional; absent means 0. */
  reserved15?: number;
  /** Bytes after the 30-byte model (present only for over-length payloads). */
  trailing: Uint8Array;
}

/** 10-bit chromaticity pair (0..1023). */
export interface VESAChromaticity {
  x: number;
  y: number;
}

/**
 * VESA Video Timing Block Extension (Extended Tag 0x03)
 *
 * The byte layout is defined by the external "VESA Video Timing Block Extension
 * Data Standard, Release A, Nov 24 2003" (CTA-861-G normative reference #101),
 * which is not available in this repository; edid-decode (parse-cta-block.cpp)
 * hex-dumps it unparsed. We therefore model the block as a structured
 * opaque-payload container: a dedicated type with its own decode/encode path
 * that preserves the payload byte-for-byte, rather than the generic
 * data-only fallback.
 */
export interface VESAVideoTimingBlockExtensionDataBlock extends ExtendedDataBlock {
  extendedTag: 0x03;
  /** VESA-defined timing payload (post-ext-tag), preserved verbatim. */
  trailing: Uint8Array;
}

/** Label maps for VESA VDDB enumerated sub-fields (UI helpers). */
export const VESA_INTERFACE_CATEGORIES: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: 'Analog' },
  { id: 1, label: 'LVDS' },
  { id: 2, label: 'RSDS' },
  { id: 3, label: 'DVI-D' },
  { id: 4, label: 'DVI-I analog' },
  { id: 5, label: 'DVI-I digital' },
  { id: 6, label: 'HDMI-A' },
  { id: 7, label: 'HDMI-B' },
  { id: 8, label: 'MDDI' },
  { id: 9, label: 'DisplayPort' },
  { id: 10, label: 'IEEE-1394' },
  { id: 11, label: 'M1 analog' },
  { id: 12, label: 'M1 digital' },
];
export const VESA_CONTENT_PROTECTION: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: 'None' },
  { id: 1, label: 'HDCP' },
  { id: 2, label: 'DTCP' },
  { id: 3, label: 'DPCP' },
];
export const VESA_ORIENTATION: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: 'Landscape' },
  { id: 1, label: 'Portrait' },
  { id: 2, label: 'Not fixed' },
  { id: 3, label: 'Undefined' },
];
export const VESA_ROTATION: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: 'None' },
  { id: 1, label: '90° clockwise' },
  { id: 2, label: '90° counterclockwise' },
  { id: 3, label: '90° either direction' },
];
export const VESA_SUBPIXEL_INFORMATION: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0x00, label: 'Not defined' },
  { id: 0x01, label: 'RGB vertical stripes' },
  { id: 0x02, label: 'RGB horizontal stripes' },
  { id: 0x03, label: 'Vertical stripes (primary order)' },
  { id: 0x04, label: 'Horizontal stripes (primary order)' },
  { id: 0x05, label: 'Quad sub-pixels, red top-left' },
  { id: 0x06, label: 'Quad sub-pixels, red bottom-left' },
  { id: 0x07, label: 'Delta (triad) RGB' },
  { id: 0x08, label: 'Mosaic' },
  { id: 0x09, label: 'Quad sub-pixels, RGB + 1 color' },
  { id: 0x0a, label: 'Five sub-pixels, RGB + 2 colors' },
  { id: 0x0b, label: 'Six sub-pixels, RGB + 3 colors' },
  { id: 0x0c, label: 'PenTile Matrix' },
];
export const VESA_DITHERING: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: 'None' },
  { id: 1, label: 'Spatial' },
  { id: 2, label: 'Temporal' },
  { id: 3, label: 'Spatial and temporal' },
];
export const VESA_FRAME_RATE_CONVERSION: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: 'None' },
  { id: 1, label: 'Single buffering' },
  { id: 2, label: 'Double buffering' },
  { id: 3, label: 'Advanced frame rate conversion' },
];
export const VESA_RESPONSE_TIME_DIRECTION: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: 'Black → White' },
  { id: 1, label: 'White → Black' },
];

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
  | VESAVideoDisplayDeviceDataBlock
  | VESAVideoTimingBlockExtensionDataBlock
  | ExtendedDataBlock;

// The VCDB-family members of the union above (Video Capability, HDR Static,
// Video Format Preference, YCbCr 4:2:0 Video / Capability Map, VSVDB, VSADB,
// InfoFrame) are defined in `./vcdb/`; only the non-family blocks
// in this list are declared in this module.

/**
 * Per-extended-tag codec registry — the single dispatch site for Extended Tag
 * Data Blocks (CTA-861-G §7.5, tag 0x07). Each entry pairs a free-standing
 * decode/encode function pair; the opaque fallback is one `OPAQUE_EXTENDED_BLOCK`
 * default entry rather than a switch `default:` branch. Adding a block type is
 * a registry entry, not a dispatcher edit. Mirrors mp4box BoxRegistry.
 * The VCDB-family codecs (0x00/0x01/0x06/0x0D/0x0E/0x0F/0x11/0x20) are
 * imported from `./vcdb/`.
 */
interface CTAExtendedBlockCodec {
  decode(base: ExtendedDataBlock, payload: Uint8Array): CTAExtendedDataBlock;
  encode(block: CTAExtendedDataBlock): Uint8Array;
}

/** Opaque/unknown extended-tag fallback. The decode path has already produced a
 *  generic `ExtendedDataBlock` (the `base`), so decode returns it unchanged;
 *  encode returns the carrier `payload` verbatim. One default entry (AC#2). */
const OPAQUE_EXTENDED_BLOCK: CTAExtendedBlockCodec = {
  decode: (base) => base,
  encode: (block) => block.payload,
};

const EXTENDED_BLOCK_CODECS: Partial<Record<ExtendedTagCode, CTAExtendedBlockCodec>> = {
  0x00: { decode: decodeVideoCapabilityBlock, encode: (b) => encodeVideoCapabilityBlock(b as VideoCapabilityDataBlock) },
  0x01: { decode: decodeVendorSpecificVideoBlock, encode: (b) => encodeVendorSpecificVideoBlock(b as VendorSpecificVideoDataBlock) },
  0x02: {
    decode: decodeVESAVideoDisplayDeviceBlock,
    // Only the structured 30-byte block carries `interfaceCategory`; a malformed
    // block decodes to the generic fallback, which the opaque entry re-emits.
    encode: (b) => 'interfaceCategory' in b
      ? encodeVESAVideoDisplayDeviceBlock(b as VESAVideoDisplayDeviceDataBlock)
      : OPAQUE_EXTENDED_BLOCK.encode(b),
  },
  0x03: {
    decode: decodeVESAVideoTimingBlockExtension,
    // The structured VTB extension carries opaque timing bytes as `trailing`;
    // the generic fallback (no `trailing`) re-emits via the opaque entry.
    encode: (b) => 'trailing' in b
      ? encodeVESAVideoTimingBlockExtension(b as VESAVideoTimingBlockExtensionDataBlock)
      : OPAQUE_EXTENDED_BLOCK.encode(b),
  },
  0x05: { decode: decodeColorimetryBlock, encode: (b) => encodeColorimetryBlock(b as ColorimetryDataBlock) },
  0x06: { decode: decodeHDRStaticMetadataBlock, encode: (b) => encodeHDRStaticMetadataBlock(b as HDRStaticMetadataDataBlock) },
  0x07: { decode: decodeHDRDynamicMetadataBlock, encode: (b) => encodeHDRDynamicMetadataBlock(b as HDRDynamicMetadataDataBlock) },
  0x0D: { decode: decodeVideoFormatPreferenceBlock, encode: (b) => encodeVideoFormatPreferenceBlock(b as VideoFormatPreferenceDataBlock) },
  0x0E: { decode: decodeYCbCr420VideoBlock, encode: (b) => encodeYCbCr420VideoBlock(b as YCbCr420VideoDataBlock) },
  0x0F: { decode: decodeYCbCr420CapabilityMapBlock, encode: (b) => encodeYCbCr420CapabilityMapBlock(b as YCbCr420CapabilityMapDataBlock) },
  0x11: { decode: decodeVSADB, encode: (b) => encodeVSADB(b as VendorSpecificAudioDataBlock) },
  0x13: { decode: decodeRoomConfigurationBlock, encode: (b) => encodeRoomConfigurationBlock(b as RoomConfigurationDataBlock) },
  0x14: { decode: decodeSpeakerLocationBlock, encode: (b) => encodeSpeakerLocationBlock(b as SpeakerLocationDataBlock) },
  0x15: { decode: decodeRoomEnvironmentBlock, encode: (b) => encodeRoomEnvironmentBlock(b as RoomEnvironmentDataBlock) },
  0x20: { decode: decodeInfoFrameBlock, encode: (b) => encodeInfoFrameBlock(b as InfoFrameDataBlock) },
};

/**
 * Decode an Extended Tag Data Block via the per-tag codec registry.
 */
export function decodeExtendedDataBlock(blockData: Uint8Array): CTAExtendedDataBlock {
  if (blockData.length < 1) {
    return { tag: 0x07, extendedTag: 0, payload: blockData };
  }

  const extendedTag = blockData[0] as ExtendedTagCode;
  const payload = blockData.slice(1);

  const base: ExtendedDataBlock = {
    tag: 0x07,
    extendedTag,
    payload: blockData,
  };

  return (EXTENDED_BLOCK_CODECS[extendedTag] ?? OPAQUE_EXTENDED_BLOCK).decode(base, payload);
}

function decodeColorimetryBlock(base: ExtendedDataBlock, payload: Uint8Array): ColorimetryDataBlock {
  const byte1 = payload[0] ?? 0;
  const byte2 = payload[1] ?? 0;

  const block: ColorimetryDataBlock = {
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
    ictcp: (byte2 & 0x40) !== 0,
    sRGB: (byte2 & 0x20) !== 0,
    defaultRGB: (byte2 & 0x10) !== 0,
    gamutMetadataP0: (byte2 & 0x01) !== 0,
  };
  if (byte2 & 0x0e) block.metadataReserved = (byte2 >> 1) & 0x07;
  if (payload.length < 2) block.shortLength = payload.length;
  if (payload.length > 2) block.trailing = payload.slice(2);
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

/**
 * Decode the VESA Video Display Device Data Block (ext tag 0x02).
 * The payload must be exactly 30 bytes; otherwise the block is malformed and
 * we fall back to the raw `base` so it still round-trips byte-identically.
 */
function decodeVESAVideoDisplayDeviceBlock(base: ExtendedDataBlock, payload: Uint8Array): CTAExtendedDataBlock {
  if (payload.length !== 30) {
    return base;
  }

  const b = (i: number) => payload[i];

  // Additional primary chromaticities — 10-bit packed across x[0x14..0x1b].
  const p4x = (b(0x16) << 2) | (b(0x14) >> 6);
  const p4y = (b(0x17) << 2) | ((b(0x14) >> 4) & 0x03);
  const p5x = (b(0x18) << 2) | ((b(0x14) >> 2) & 0x03);
  const p5y = (b(0x19) << 2) | (b(0x14) & 0x03);
  const p6x = (b(0x1a) << 2) | (b(0x15) >> 6);
  const p6y = (b(0x1b) << 2) | ((b(0x15) >> 4) & 0x03);

  const audioDelayByte = b(0x10);
  const audioDelayMs = (audioDelayByte & 0x7f) * 2;

  return {
    ...base,
    extendedTag: 0x02,
    interfaceCategory: b(0) >> 4,
    interfaceDetail: b(0) & 0x0f,
    interfaceStandardMajor: b(1) >> 4,
    interfaceStandardMinor: b(1) & 0x0f,
    contentProtection: b(2),
    minClockMHz: b(3) >> 2,
    maxClockMHz: ((b(3) & 0x03) << 8) | b(4),
    nativePixelWidth: b(5) | (b(6) << 8),
    nativePixelHeight: b(7) | (b(8) << 8),
    aspectRatio: b(9),
    orientation: (b(0x0a) >> 6) & 0x03,
    rotationCapability: (b(0x0a) >> 4) & 0x03,
    zeroPixelLocation: (b(0x0a) >> 2) & 0x03,
    scanDirection: b(0x0a) & 0x03,
    subpixelInformation: b(0x0b),
    horizontalPitchMm: b(0x0c) / 100,
    verticalPitchMm: b(0x0d) / 100,
    dithering: b(0x0e) >> 6,
    directDrive: (b(0x0e) & 0x20) !== 0,
    overdriveRecommended: (b(0x0e) & 0x10) === 0,
    deinterlacing: (b(0x0e) & 0x08) !== 0,
    audioSupport: (b(0x0f) & 0x80) !== 0,
    separateAudioInputs: (b(0x0f) & 0x40) !== 0,
    audioInputOverride: (b(0x0f) & 0x20) !== 0,
    audioDelayMs,
    audioDelayPositive: (audioDelayByte & 0x80) !== 0,
    frameRateConversion: b(0x11) >> 6,
    frameRateRange: b(0x11) & 0x3f,
    nominalFrameRate: b(0x12),
    colorBitDepthInterface: (b(0x13) >> 4) + 1,
    colorBitDepthDisplay: (b(0x13) & 0x0f) + 1,
    additionalPrimaryCount: b(0x15) & 0x03,
    primary4: { x: p4x, y: p4y },
    primary5: { x: p5x, y: p5y },
    primary6: { x: p6x, y: p6y },
    responseTimeDirection: b(0x1c) >> 7,
    responseTimeMs: b(0x1c) & 0x7f,
    overscanHorizontal: b(0x1d) >> 4,
    overscanVertical: b(0x1d) & 0x0f,
    ...(b(0x0e) & 0x07 ? { reserved0e: b(0x0e) & 0x07 } : {}),
    ...(b(0x0f) & 0x1f ? { reserved0f: b(0x0f) & 0x1f } : {}),
    ...(b(0x15) & 0x0c ? { reserved15: (b(0x15) >> 2) & 0x03 } : {}),
    trailing: new Uint8Array(),
  };
}

/** Decode the VESA Video Timing Block Extension (ext tag 0x03) — opaque payload. */
function decodeVESAVideoTimingBlockExtension(base: ExtendedDataBlock, payload: Uint8Array): VESAVideoTimingBlockExtensionDataBlock {
  return {
    ...base,
    extendedTag: 0x03,
    trailing: payload.slice(),
  };
}

function decodeRoomConfigurationBlock(base: ExtendedDataBlock, payload: Uint8Array): RoomConfigurationDataBlock {
  // Layout per edid-decode `cta_rcdb`: flags/count byte, 24-bit LE speaker
  // mask, then the optional Xmax/Ymax/Zmax and Display X/Y/Z triples.
  const flags = payload[0] ?? 0;
  const block: RoomConfigurationDataBlock = {
    ...base,
    extendedTag: 0x13,
    display: (flags & 0x80) !== 0,
    speaker: (flags & 0x40) !== 0,
    sld: (flags & 0x20) !== 0,
    speakerCount: (flags & 0x1f) + 1,
    speakerPresenceMask: (payload[1] ?? 0) | ((payload[2] ?? 0) << 8) | ((payload[3] ?? 0) << 16),
    trailing: new Uint8Array(),
  };
  if (payload.length < 4) {
    block.shortLength = payload.length;
    return block;
  }
  let i = 4;
  if (payload.length >= 7) {
    block.max = { x: payload[4], y: payload[5], z: payload[6] };
    i = 7;
  }
  if (payload.length >= 10) {
    block.displayPosition = {
      x: decodeCoordinate(payload[7]),
      y: decodeCoordinate(payload[8]),
      z: decodeCoordinate(payload[9]),
    };
    i = 10;
  }
  block.trailing = payload.slice(i);
  return block;
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
    // Reserved bits: byte 0 bit 7 and byte 1 bits 7:5 (Table 93).
    if (byte0 & 0x80) descriptor.channelReserved = true;
    if (byte1 & 0xe0) descriptor.speakerIdReserved = byte1 >> 5;
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

/**
 * Encode an Extended Tag Data Block to bytes via the per-tag codec registry.
 */
export function encodeExtendedDataBlock(block: CTAExtendedDataBlock): Uint8Array {
  return (EXTENDED_BLOCK_CODECS[block.extendedTag] ?? OPAQUE_EXTENDED_BLOCK).encode(block);
}

function encodeSpeakerLocationBlock(block: SpeakerLocationDataBlock): Uint8Array {
  const bytes = [0x14];
  for (const d of block.descriptors) {
    let byte0 = 0;
    if (d.channelReserved) byte0 |= 0x80;      // reserved, kept as decoded
    if (d.coordinates) byte0 |= 0x40;          // COORD
    if (d.active) byte0 |= 0x20;                // Active
    byte0 |= clampInt(d.channelIndex, 0, 31);  // Channel Index
    const byte1 =
      (clampInt(d.speakerIdReserved ?? 0, 0, 7) << 5) | // reserved, kept as decoded
      clampInt(d.speakerId, 0, 31);             // Speaker ID
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

function encodeHDRDynamicMetadataBlock(block: HDRDynamicMetadataDataBlock): Uint8Array {
  const bytes = [0x07];
  for (const e of block.entries) {
    const len = clampByte(3 + (e.optionalFields?.length ?? 0));
    const type = clampInt(e.type, 0, 0xffff);
    bytes.push(len);
    bytes.push(type & 0xff, type >> 8, clampByte(e.supportFlags));
    for (const b of e.optionalFields ?? []) bytes.push(b);
  }
  for (const b of block.trailing ?? []) bytes.push(b);
  return new Uint8Array(bytes);
}

/**
 * Encode the VESA Video Display Device Data Block (ext tag 0x02).
 * Reconstructs the 30 payload bytes from the parsed fields. The decode path
 * only produces this type for length-30 payloads; a structurally-malformed
 * block never enters this encoder (it stays as the raw `ExtendedDataBlock`
 * fallback, whose `data` is returned by the default arm).
 */
function encodeVESAVideoDisplayDeviceBlock(block: VESAVideoDisplayDeviceDataBlock): Uint8Array {
  const p = block;
  // Every field is clamped to its bit width: a plain mask would wrap an
  // out-of-range value into an unrelated one (min clock 64 MHz → 0 MHz).
  const u2 = (v: number) => clampInt(v, 0, 0x03);
  const u4 = (v: number) => clampInt(v, 0, 0x0f);
  const u10 = (v: number) => clampInt(v, 0, 0x3ff);
  const u16 = (v: number) => clampInt(v, 0, 0xffff);
  const p4x = u10(p.primary4.x), p4y = u10(p.primary4.y);
  const p5x = u10(p.primary5.x), p5y = u10(p.primary5.y);
  const p6x = u10(p.primary6.x), p6y = u10(p.primary6.y);
  const maxClock = u10(p.maxClockMHz);
  const width = u16(p.nativePixelWidth);
  const height = u16(p.nativePixelHeight);

  // Re-pack the additional-primary 10-bit values: high 8 bits into their own
  // bytes, low 2 bits collected into x[0x14] (P4/P5) and x[0x15] (P6 + count).
  const byte14 = ((p4x & 0x03) << 6) | ((p4y & 0x03) << 4) | ((p5x & 0x03) << 2) | (p5y & 0x03);
  const byte15 =
    ((p6x & 0x03) << 6) |
    ((p6y & 0x03) << 4) |
    (u2(p.reserved15 ?? 0) << 2) |
    u2(p.additionalPrimaryCount);

  // Audio delay: sign in bit 7 (set = positive), magnitude/2 in bits 6:0.
  const adMag = clampInt(p.audioDelayMs / 2, 0, 0x7f);
  const audioDelayByte = (p.audioDelayPositive ? 0x80 : 0) | adMag;

  const bytes = new Uint8Array(31 + p.trailing.length);
  bytes[0] = 0x02;
  bytes[1] = (u4(p.interfaceCategory) << 4) | u4(p.interfaceDetail);
  bytes[2] = (u4(p.interfaceStandardMajor) << 4) | u4(p.interfaceStandardMinor);
  bytes[3] = clampByte(p.contentProtection);
  bytes[4] = (clampInt(p.minClockMHz, 0, 0x3f) << 2) | (maxClock >> 8);
  bytes[5] = maxClock & 0xff;
  bytes[6] = width & 0xff;
  bytes[7] = width >> 8;
  bytes[8] = height & 0xff;
  bytes[9] = height >> 8;
  bytes[10] = clampByte(p.aspectRatio);
  bytes[11] =
    (u2(p.orientation) << 6) |
    (u2(p.rotationCapability) << 4) |
    (u2(p.zeroPixelLocation) << 2) |
    u2(p.scanDirection);
  bytes[12] = clampByte(p.subpixelInformation);
  bytes[13] = clampByte(p.horizontalPitchMm * 100);
  bytes[14] = clampByte(p.verticalPitchMm * 100);
  bytes[15] =
    (u2(p.dithering) << 6) |
    (p.directDrive ? 0x20 : 0) |
    (p.overdriveRecommended ? 0 : 0x10) |
    (p.deinterlacing ? 0x08 : 0) |
    clampInt(p.reserved0e ?? 0, 0, 0x07);
  bytes[16] =
    (p.audioSupport ? 0x80 : 0) |
    (p.separateAudioInputs ? 0x40 : 0) |
    (p.audioInputOverride ? 0x20 : 0) |
    clampInt(p.reserved0f ?? 0, 0, 0x1f);
  bytes[17] = audioDelayByte;
  bytes[18] = (u2(p.frameRateConversion) << 6) | clampInt(p.frameRateRange, 0, 0x3f);
  bytes[19] = clampByte(p.nominalFrameRate);
  bytes[20] = (clampInt(p.colorBitDepthInterface - 1, 0, 0x0f) << 4) | clampInt(p.colorBitDepthDisplay - 1, 0, 0x0f);
  bytes[21] = byte14;
  bytes[22] = byte15;
  bytes[23] = p4x >> 2;
  bytes[24] = p4y >> 2;
  bytes[25] = p5x >> 2;
  bytes[26] = p5y >> 2;
  bytes[27] = p6x >> 2;
  bytes[28] = p6y >> 2;
  bytes[29] = (clampInt(p.responseTimeDirection, 0, 1) << 7) | clampInt(p.responseTimeMs, 0, 0x7f);
  bytes[30] = (u4(p.overscanHorizontal) << 4) | u4(p.overscanVertical);
  bytes.set(p.trailing, 31);
  return bytes;
}

/** Encode the VESA Video Timing Block Extension (ext tag 0x03) — opaque payload. */
function encodeVESAVideoTimingBlockExtension(block: VESAVideoTimingBlockExtensionDataBlock): Uint8Array {
  const bytes = new Uint8Array(1 + block.trailing.length);
  bytes[0] = 0x03;
  bytes.set(block.trailing, 1);
  return bytes;
}

function encodeRoomConfigurationBlock(block: RoomConfigurationDataBlock): Uint8Array {
  const mask = clampInt(block.speakerPresenceMask, 0, 0xffffff);
  const bytes = [
    0x13,
    (block.display ? 0x80 : 0) |
      (block.speaker ? 0x40 : 0) |
      (block.sld ? 0x20 : 0) |
      (clampInt(block.speakerCount, 1, 32) - 1),
    mask & 0xff,
    (mask >> 8) & 0xff,
    mask >> 16,
  ];
  // The optional triples are positional: Display X/Y/Z needs Xmax/Ymax/Zmax
  // in front of it (written as 0 when unset).
  if (block.max || block.displayPosition) {
    const max = block.max ?? { x: 0, y: 0, z: 0 };
    bytes.push(clampByte(max.x), clampByte(max.y), clampByte(max.z));
  }
  if (block.displayPosition) {
    const d = block.displayPosition;
    bytes.push(encodeCoordinate(d.x), encodeCoordinate(d.y), encodeCoordinate(d.z));
  }
  for (const b of block.trailing ?? []) bytes.push(b);
  // shortLength counts body bytes; the output also carries the ext-tag byte.
  return keepShortLength(
    new Uint8Array(bytes),
    block.shortLength === undefined ? undefined : block.shortLength + 1,
  );
}

function encodeRoomEnvironmentBlock(block: RoomEnvironmentDataBlock): Uint8Array {
  // EXPERIMENTAL — CTA-861-H §7.5.17 Room Environment Data Block;
  // field semantics per ITU-T H.265 Ambient Viewing Environment SEI;
  // layout not verified against a parser — byte-identical round-trip is the correctness gate.
  // Slice-and-overwrite: start from block.payload (which includes the ext-tag byte at index 0);
  // payload starts at index 1. Reserved/trailing bytes are preserved.
  const out = block.payload.slice();
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
  if (block.ictcp) byte2 |= 0x40;
  if (block.sRGB) byte2 |= 0x20;
  if (block.defaultRGB) byte2 |= 0x10;
  byte2 |= clampInt(block.metadataReserved ?? 0, 0, 0x07) << 1;
  if (block.gamutMetadataP0) byte2 |= 0x01;

  const trailing = block.trailing ?? new Uint8Array();
  const out = new Uint8Array(3 + trailing.length);
  out[0] = 0x05;
  out[1] = byte1;
  out[2] = byte2;
  out.set(trailing, 3);
  // shortLength counts body bytes; the output also carries the ext-tag byte.
  return keepShortLength(out, block.shortLength === undefined ? undefined : block.shortLength + 1);
}

