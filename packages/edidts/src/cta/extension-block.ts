/**
 * Extension Blocks
 * 
 * Handles encoding and decoding of EDID extension blocks per VESA E-EDID A2.
 * Each extension block is 128 bytes.
 * 
 * CTA-861-G Extended Tag blocks are also supported.
 */

import { decodeExtendedDataBlock, encodeExtendedDataBlock, type CTAExtendedDataBlock } from './cta-extended-blocks';
import { decodeVendorSpecificBlock, findVSDBByKind, VENDOR_ENCODERS, reassembleVsdbBlock } from './vsdb/registry';
import type { VendorSpecificDataBlock } from './vsdb/types';
// Side-effect imports: each VSDB codec module registers its decoder/encoder
// with VENDOR_DECODERS/VENDOR_ENCODERS (vsdb/registry.ts) at load time. The
// CTA decode path goes through this module (eedid/extension.ts imports it
// directly, not via cta/index.ts), so importing them here guarantees every
// VSDB OUI (HDMI 1.4, HDMI Forum 2.0, AMD FreeSync, Microsoft HMD) is
// registered before decodeVendorSpecificBlock runs — otherwise VSDBs fall
// back to 'unknown' even with a correct OUI. (registry.ts itself cannot
// import these without a circular-import TDZ, since they register into the
// VENDOR_DECODERS const it exports.) MHL is registered inside registry.ts.
import './vsdb/hdmi14';
import './vsdb/hdmi-forum';
import './vsdb/amd';
import './vsdb/microsoft-hmd';
// Side-effect import: registers the Dolby VSVDB decoder/encoder with the
// VSVDB registry so consumers can find it via VENDOR_VSVDB_DECODERS[OUI.DOLBY].
import './vcdb/vsvdb/dolby';
import {
  DetailedTimingDescriptor,
  decodeEdidCtaDetailedTiming,
  encodeEdidCtaDetailedTiming,
  type DetailedTiming,
  type DetailedTimingInput,
} from '../common/detailed-timing-descriptor';
import {
  decodeVideoTimingBlock,
  encodeVideoTimingBlock,
  type VideoTimingBlock as VTBExtensionBlock,
  type VideoTimingBlockDetailedTiming as VTBDetailedTiming,
} from './video-timing-block';
import { checksum8, isChecksum8Valid } from '../common/checksum';
import { decodeDisplayIdSection, encodeDisplayIdSection, type DisplayIdSection } from '../displayid';
import { isKnownVIC } from './vic-table';

export type { VTBExtensionBlock, VTBDetailedTiming };

export type ExtensionTag = 
  | 0x02  // CEA-861 Extension
  | 0x10  // Video Timing Block Extension
  | 0x40  // Display Information Extension
  | 0x50  // Localized String Extension
  | 0x60  // Digital Packet Video Link Extension
  | 0x70  // DisplayID Extension
  | 0xF0  // Extension Block Map
  | 0xFF  // Manufacturer Defined
  | number;

export interface BaseExtensionBlock {
  tag: ExtensionTag;
  revision: number;
  checksum: number;
  data: Uint8Array;
  /**
   * True iff the 128-byte block's byte-127 8-bit checksum is valid (sum of all
   * 128 bytes ≡ 0 mod 256). Always populated by `ExtensionBlockParser.decode`;
   * optional so programmatic object literals (tests, `blank()`) type-check
   * without supplying it.
   */
  checksumValid?: boolean;
}

/**
 * CEA-861 Extension Block (Tag 0x02)
 * Used for HDMI, audio, and additional video capabilities
 */
export interface CEAExtensionBlock extends BaseExtensionBlock {
  tag: 0x02;
  dtdOffset: number; // Offset to detailed timing descriptors
  underscan: boolean;
  basicAudio: boolean;
  ycbcr444: boolean;
  ycbcr422: boolean;
  nativeFormats: number;
  dataBlocks: CEADataBlock[];
  detailedTimings: CEADetailedTiming[];
}

export type CEADataBlockTag =
  | 0x01  // Audio Data Block
  | 0x02  // Video Data Block
  | 0x03  // Vendor Specific Data Block
  | 0x04  // Speaker Allocation Data Block
  | 0x05  // VESA Display Transfer Characteristic
  | 0x07; // Extended Tag

/**
 * Display labels for the CEA short data-block tags (CTA-861-G Table 46).
 * Used by overview/summary UI to name a block by its tag.
 */
export const CEA_DATA_BLOCK_LABELS: Record<CEADataBlockTag, string> = {
  0x01: 'Audio Data Block',
  0x02: 'Video Data Block',
  0x03: 'Vendor Specific Data Block',
  0x04: 'Speaker Allocation Data Block',
  0x05: 'VESA Display Transfer Characteristic',
  0x07: 'Extended Data Block',
};

/** Display label for a CEA data-block tag, tolerating unknown tags. */
export function getCEADataBlockLabel(tag: number): string {
  return CEA_DATA_BLOCK_LABELS[tag as CEADataBlockTag] ?? `Unknown (0x${tag.toString(16).toUpperCase()})`;
}

export interface CEADataBlock {
  tag: CEADataBlockTag;
  /** Post-header body (the tag/length header byte is stripped by the walker). */
  payload: Uint8Array;
}

export interface AudioDataBlock extends CEADataBlock {
  tag: 0x01;
  descriptors: Array<{
    format: number;
    channels: number;
    samplingRates: {
      sr32kHz: boolean;
      sr44_1kHz: boolean;
      sr48kHz: boolean;
      sr88_2kHz: boolean;
      sr96kHz: boolean;
      sr176_4kHz: boolean;
      sr192kHz: boolean;
    };
    bitDepths?: { // For LPCM
      bd16: boolean;
      bd20: boolean;
      bd24: boolean;
    };
    maxBitrate?: number; // For compressed formats, in kHz
    extendedFormat?: number; // For format code 15, byte 3 bits 7:3
  }>;
}

export interface VideoDataBlock extends CEADataBlock {
  tag: 0x02;
  vics: Array<{
    vic: number;
    native: boolean;
    /**
     * True iff `vic` has a definition in the CTA-861 VIC table. Populated on
     * decode to flag unknown/reserved VIC values (e.g. VIC 0); encode ignores
     * it, so the numeric `vic` round-trips verbatim. Optional so programmatic
     * literals type-check without supplying it.
     */
    known?: boolean;
  }>;
}

// `VendorSpecificDataBlock` is imported from `./vsdb/types` (re-exported at the
// top of this module) so there is a single canonical definition. This avoids
// a duplicate-identifier error when both the CTA module and the VSDB module
// try to re-export the same name from the public API surface.

export interface SpeakerAllocationBlock extends CEADataBlock {
  tag: 0x04;
  /**
   * CTA-861-G Table 69 "Speaker Allocation Data Block Payload" — a 20-bit
   * speaker mask packed across 3 payload bytes (byte3 bits 7:4 are reserved
   * and always 0). Each flag denotes a single speaker or a Left/Right pair.
   *
   * The first 11 fields are the original subset the UI already renders; the
   * remaining 9 (byte2 bits 7:4 + byte3 bits 3:0) are the CTA-861-G additions
   * that complete the spec-defined bit set.
   */
  speakers: {
    // byte 1
    frontLeftRight: boolean; // 0x01 FL/FR
    lfe: boolean; // 0x02 LFE (LFE1)
    frontCenter: boolean; // 0x04 FC
    rearLeftRight: boolean; // 0x08 BL/BR
    rearCenter: boolean; // 0x10 BC
    frontLeftRightCenter: boolean; // 0x20 FLC/FRC
    rearLeftRightCenter: boolean; // 0x40 RLC/RRC
    frontLeftRightWide: boolean; // 0x80 FLW/FRW
    // byte 2
    frontLeftRightHigh: boolean; // 0x01 TpFL/TpFR
    topCenter: boolean; // 0x02 TpC
    frontCenterHigh: boolean; // 0x04 TpFC
    surroundLeftRight: boolean; // 0x08 LS/RS
    lfe2: boolean; // 0x10 LFE2
    topBackCenter: boolean; // 0x20 TpBC
    sideLeftRight: boolean; // 0x40 SiL/SiR
    topSideLeftRight: boolean; // 0x80 TpSiL/TpSiR
    // byte 3 (bits 7:4 reserved)
    topBackLeftRight: boolean; // 0x01 TpBL/TpBR
    bottomFrontCenter: boolean; // 0x02 BtFC
    bottomFrontLeftRight: boolean; // 0x04 BtFL/BtFR
    topLeftRightSurround: boolean; // 0x08 TpLS/TpRS
  };
  /** Payload bytes beyond the 3-byte SADB mask (preserved for byte-exact round-trip). */
  trailing: Uint8Array;
}

/**
 * VESA Display Transfer Characteristic Data Block (Tag 5)
 * Contains gamma curve data for the display
 */
export interface VESADisplayTransferCharacteristicBlock extends CEADataBlock {
  tag: 0x05;
  transferType: 'white' | 'red' | 'green' | 'blue';
  numEntries: number; // 8, 16, 32, or 48
  gammaValues: number[]; // Normalized gamma values (0-1)
}

/**
 * Display-label options for the VESA Display Transfer Characteristic transfer
 * type (CTA-861-G §7.5.24, 2-bit code in the block header byte).
 */
export const VESA_TRANSFER_TYPE_OPTIONS: ReadonlyArray<{
  value: VESADisplayTransferCharacteristicBlock['transferType'];
  label: string;
}> = [
  { value: 'white', label: 'White' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

/**
 * CEA Detailed Timing Descriptor.
 *
 * Routed through the shared 18-byte DTD codec (`decodeEdidCtaDetailedTiming` /
 * `encodeEdidCtaDetailedTiming`), so it carries the full `DetailedTiming` field
 * set (image size, borders, stereo mode, and sync flags via `flags`) rather than
 * the simplified subset the CEA parser used to expose.
 *
 * `isNative` marks the DTDs the sink considers native: per CTA-861-G byte 3
 * bits 3:0 ("Number of Native Detailed Timings"), the first N DTDs in the block
 * are native, where N is `CEAExtensionBlock.nativeFormats`.
 */
export interface CEADetailedTiming extends DetailedTiming {
  isNative: boolean;
}

/**
 * Block Map Extension (Tag 0xF0)
 * Required when there is more than one extension block
 */
export interface BlockMapExtension extends BaseExtensionBlock {
  tag: 0xF0;
  blockTags: number[]; // Up to 126 extension block tags
}

export interface DisplayIdExtensionBlock extends BaseExtensionBlock {
  tag: 0x70;
  section: DisplayIdSection;
}

export type ExtensionBlock = 
  | CEAExtensionBlock 
  | VTBExtensionBlock 
  | DisplayIdExtensionBlock
  | BlockMapExtension 
  | BaseExtensionBlock;

export class ExtensionBlockParser {
  /**
   * Decode an extension block from 128 bytes
   */
  static decode(data: Uint8Array): ExtensionBlock | null {
    if (data.length < 128) return null;

    const tag = data[0] as ExtensionTag;
    const revision = data[1];
    const checksum = data[127];

    const base: BaseExtensionBlock = {
      tag,
      revision,
      checksum,
      checksumValid: isChecksum8Valid(data),
      data: data.slice(2, 127),
    };

    switch (tag) {
      case 0x02:
        return this.decodeCEA(data, base);
      case 0x10:
        return this.decodeVTB(data, base);
      case 0x70:
        return this.decodeDisplayId(data, base);
      case 0xF0:
        return this.decodeBlockMap(data, base);
      default:
        return base;
    }
  }

  /**
   * Encode an extension block to 128 bytes
   */
  static encode(block: ExtensionBlock): Uint8Array {
    const bytes = new Uint8Array(128);
    bytes[0] = block.tag;
    bytes[1] = block.revision;

    switch (block.tag) {
      case 0x02:
        this.encodeCEA(bytes, block as CEAExtensionBlock);
        break;
      case 0x10:
        bytes.set(encodeVideoTimingBlock(block as VTBExtensionBlock).slice(2, 127), 2);
        break;
      case 0x70:
        this.encodeDisplayId(bytes, block as DisplayIdExtensionBlock);
        break;
      case 0xF0:
        this.encodeBlockMap(bytes, block as BlockMapExtension);
        break;
      default:
        bytes.set(block.data.slice(0, 125), 2);
    }

    bytes[127] = checksum8(bytes, 127);
    return bytes;
  }

  static decodeCEA(data: Uint8Array, base: BaseExtensionBlock): CEAExtensionBlock {
    // Explicit tag guard: decodeCEA only applies to CTA-861 extension blocks
    // (tag 0x02). The ExtensionBlockParser.decode switch gates on data[0] before
    // calling this, so the guard is defensive against future callers that might
    // misroute a non-0x02 buffer here. Throw a clear error rather than silently
    // mis-parsing; the EEDID dispatcher catches this and falls back to opaque.
    if (data[0] !== 0x02) {
      throw new Error(
        `CEA extension block tag must be 0x02; got 0x${data[0].toString(16).padStart(2, '0')}`,
      );
    }

    const dtdOffset = data[2];
    const flags = data[3];

    const cea: CEAExtensionBlock = {
      ...base,
      tag: 0x02,
      dtdOffset,
      underscan: (flags & 0x80) !== 0,
      basicAudio: (flags & 0x40) !== 0,
      ycbcr444: (flags & 0x20) !== 0,
      ycbcr422: (flags & 0x10) !== 0,
      nativeFormats: flags & 0x0F,
      dataBlocks: [],
      detailedTimings: [],
    };

    // Parse data blocks (from offset 4 to dtdOffset)
    if (dtdOffset > 4) {
      let offset = 4;
      while (offset < dtdOffset && offset < 127) {
        const header = data[offset];
        const blockTag = (header >> 5) & 0x07;
        const blockLength = header & 0x1F;
        
        if (offset + 1 + blockLength > dtdOffset) break;

        const blockData = data.slice(offset + 1, offset + 1 + blockLength);
        
        const block = this.decodeCEADataBlock(blockTag as CEADataBlockTag, blockData);
        if (block) {
          cea.dataBlocks.push(block);
        }

        offset += 1 + blockLength;
      }
    }

    // Parse detailed timings (from dtdOffset to end, each 18 bytes).
    // CTA-861-G byte 3 bits 3:0 (nativeFormats) is the number of native DTDs;
    // the first N DTDs in the block are native.
    if (dtdOffset > 0 && dtdOffset < 127) {
      const nativeCount = flags & 0x0f;
      let offset = dtdOffset;
      let dtdIndex = 0;
      while (offset + 18 <= 127) {
        const pixelClock = (data[offset + 1] << 8) | data[offset];
        if (pixelClock === 0) break; // No more timings

        const timing = decodeEdidCtaDetailedTiming(data.slice(offset, offset + 18));
        if (!timing) break;
        cea.detailedTimings.push({ ...timing, isNative: dtdIndex < nativeCount });

        offset += 18;
        dtdIndex++;
      }
    }

    return cea;
  }

  private static decodeCEADataBlock(tag: CEADataBlockTag, data: Uint8Array): CEADataBlock | CTAExtendedDataBlock | null {
    switch (tag) {
      case 0x01: // Audio Data Block
        return this.decodeAudioDataBlock(data);
      case 0x02: // Video Data Block
        return this.decodeVideoDataBlock(data);
      case 0x03: // Vendor Specific Data Block
        return this.decodeVendorSpecificBlock(data);
      case 0x04: // Speaker Allocation
        return this.decodeSpeakerAllocationBlock(data);
      case 0x05: // VESA Display Transfer Characteristic
        return this.decodeVESADisplayTransferBlock(data);
      case 0x07: // Extended Tag Block (CTA-861-G)
        return decodeExtendedDataBlock(data);
      default:
        return { tag, payload: data };
    }
  }

  /**
   * Decode a stream of CTA-861 short data blocks (DisplayID 2.0 §4.10 CTA
   * DisplayID Data Block, tag 0x81). Each block is 1 header byte (bits 7:5 =
   * tag, bits 4:0 = length) followed by `length` payload bytes; tag 0x07 is an
   * extended-tag block whose first payload byte is the extended tag code.
   *
   * Reuses `decodeCEADataBlock` (the same per-block parser the CEA extension
   * block uses), so VSDBs, audio/video/speaker/VESA-transfer blocks, and
   * extended-tag blocks all decode identically here. Mirrors edid-decode
   * parse_displayid_cta_data_block (parse-displayid-block.cpp:1459), which
   * walks `for (i = 0; i < len; i += (x[i] & 0x1f) + 1)`.
   *
   * A truncated final block (header claims more bytes than remain) is
   * preserved losslessly in `trailing` rather than dropped.
   */
  public static decodeCtaDataBlockStream(
    buffer: Uint8Array,
  ): { dataBlocks: (CEADataBlock | CTAExtendedDataBlock)[]; trailing: Uint8Array } {
    const dataBlocks: (CEADataBlock | CTAExtendedDataBlock)[] = [];
    let offset = 0;
    while (offset < buffer.length) {
      const header = buffer[offset];
      const blockTag = ((header >> 5) & 0x07) as CEADataBlockTag;
      const blockLength = header & 0x1f;
      if (offset + 1 + blockLength > buffer.length) {
        // Truncated block: keep the remainder verbatim for a lossless round-trip.
        return { dataBlocks, trailing: buffer.slice(offset) };
      }
      const blockData = buffer.slice(offset + 1, offset + 1 + blockLength);
      const block = this.decodeCEADataBlock(blockTag, blockData);
      if (block) dataBlocks.push(block);
      offset += 1 + blockLength;
    }
    return { dataBlocks, trailing: new Uint8Array(0) };
  }

  private static decodeAudioDataBlock(data: Uint8Array): AudioDataBlock {
    const descriptors: AudioDataBlock['descriptors'] = [];
    
    for (let i = 0; i + 3 <= data.length; i += 3) {
      const format = (data[i] >> 3) & 0x0F;
      const channels = (data[i] & 0x07) + 1;
      const rates = data[i + 1];
      
      const descriptor: AudioDataBlock['descriptors'][0] = {
        format,
        channels,
        samplingRates: {
          sr32kHz: (rates & 0x01) !== 0,
          sr44_1kHz: (rates & 0x02) !== 0,
          sr48kHz: (rates & 0x04) !== 0,
          sr88_2kHz: (rates & 0x08) !== 0,
          sr96kHz: (rates & 0x10) !== 0,
          sr176_4kHz: (rates & 0x20) !== 0,
          sr192kHz: (rates & 0x40) !== 0,
        },
      };

      if (format === 1) { // LPCM
        descriptor.bitDepths = {
          bd16: (data[i + 2] & 0x01) !== 0,
          bd20: (data[i + 2] & 0x02) !== 0,
          bd24: (data[i + 2] & 0x04) !== 0,
        };
      } else if (format >= 2 && format <= 8) {
        // CTA-861-G Table 61 (codes 2-8): byte 3 = max bit rate ÷ 8 kHz.
        // (Codes 9-13 Table 62 use a format-dependent value; code 14 Table 63
        // uses a profile field — neither is a max bit rate, so not mapped here.)
        descriptor.maxBitrate = data[i + 2] * 8;
      } else if (format === 15) { // Audio Format Extension — byte 3 bits 7:3
        descriptor.extendedFormat = (data[i + 2] >> 3) & 0x1F;
      }

      descriptors.push(descriptor);
    }

    return { tag: 0x01, payload: data, descriptors };
  }

  private static decodeVideoDataBlock(data: Uint8Array): VideoDataBlock {
    const vics: VideoDataBlock['vics'] = [];

    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      const vic = byte & 0x7F;
      vics.push({
        vic,
        native: (byte & 0x80) !== 0,
        known: isKnownVIC(vic),
      });
    }

    return { tag: 0x02, payload: data, vics };
  }

  private static decodeVendorSpecificBlock(data: Uint8Array): VendorSpecificDataBlock {
    // The CTA data-block walker (decodeCEA) passes each block's body with the
    // tag/length header byte already stripped — for a VSDB, `data` starts at the
    // OUI (data[0..2]) followed by the post-OUI vendor body (data[3..]). The
    // registry-level decodeVendorSpecificBlock (vsdb/registry.ts) expects the
    // header byte present (it reads the OUI at data[1..3] and derives the body
    // length from data[0]). Reconstruct that header byte so the OUI and
    // vendor-body extraction align. The registry sets the carrier `payload` to
    // the post-header body (full.slice(1) === this `data`), which is exactly
    // what the CTA level round-trips on — encodeCEA prepends its own header and
    // the unknown-VSDB encode path returns block.payload verbatim.
    const header = (0x03 << 5) | (data.length & 0x1F);
    const full = new Uint8Array(data.length + 1);
    full[0] = header;
    full.set(data, 1);
    return decodeVendorSpecificBlock(full);
  }

  private static decodeSpeakerAllocationBlock(data: Uint8Array): SpeakerAllocationBlock {
    const byte1 = data[0] || 0;
    const byte2 = data[1] || 0;
    const byte3 = data[2] || 0;

    return {
      tag: 0x04,
      payload: data,
      speakers: {
        // byte 1
        frontLeftRight: (byte1 & 0x01) !== 0,
        lfe: (byte1 & 0x02) !== 0,
        frontCenter: (byte1 & 0x04) !== 0,
        rearLeftRight: (byte1 & 0x08) !== 0,
        rearCenter: (byte1 & 0x10) !== 0,
        frontLeftRightCenter: (byte1 & 0x20) !== 0,
        rearLeftRightCenter: (byte1 & 0x40) !== 0,
        frontLeftRightWide: (byte1 & 0x80) !== 0,
        // byte 2
        frontLeftRightHigh: (byte2 & 0x01) !== 0,
        topCenter: (byte2 & 0x02) !== 0,
        frontCenterHigh: (byte2 & 0x04) !== 0,
        surroundLeftRight: (byte2 & 0x08) !== 0,
        lfe2: (byte2 & 0x10) !== 0,
        topBackCenter: (byte2 & 0x20) !== 0,
        sideLeftRight: (byte2 & 0x40) !== 0,
        topSideLeftRight: (byte2 & 0x80) !== 0,
        // byte 3 (bits 7:4 reserved)
        topBackLeftRight: (byte3 & 0x01) !== 0,
        bottomFrontCenter: (byte3 & 0x02) !== 0,
        bottomFrontLeftRight: (byte3 & 0x04) !== 0,
        topLeftRightSurround: (byte3 & 0x08) !== 0,
      },
      trailing: data.length > 3 ? data.slice(3) : new Uint8Array(),
    };
  }

  private static decodeVESADisplayTransferBlock(data: Uint8Array): VESADisplayTransferCharacteristicBlock {
    if (data.length < 1) {
      return { tag: 0x05, payload: data, transferType: 'white', numEntries: 0, gammaValues: [] };
    }

    const header = data[0];
    const typeCode = (header >> 5) & 0x03;
    const numEntriesCode = (header >> 3) & 0x03;
    
    const typeMap: Record<number, 'white' | 'red' | 'green' | 'blue'> = {
      0: 'white',
      1: 'red',
      2: 'green',
      3: 'blue',
    };
    
    const numEntriesMap: Record<number, number> = {
      0: 8,
      1: 16,
      2: 32,
      3: 48,
    };
    
    const transferType = typeMap[typeCode] ?? 'white';
    const numEntries = numEntriesMap[numEntriesCode] ?? 8;
    
    const gammaValues: number[] = [];
    for (let i = 1; i < data.length && gammaValues.length < numEntries; i++) {
      gammaValues.push(data[i] / 255);
    }
    
    return {
      tag: 0x05,
      payload: data,
      transferType,
      numEntries,
      gammaValues,
    };
  }

  private static decodeVTB(data: Uint8Array, base: BaseExtensionBlock): VTBExtensionBlock {
    return decodeVideoTimingBlock(data, base);
  }

  private static decodeDisplayId(data: Uint8Array, base: BaseExtensionBlock): DisplayIdExtensionBlock {
    return {
      ...base,
      tag: 0x70,
      section: decodeDisplayIdSection(data.slice(2, 127)),
    };
  }

  private static decodeBlockMap(data: Uint8Array, base: BaseExtensionBlock): BlockMapExtension {
    const blockTags: number[] = [];
    for (let i = 1; i < 127; i++) {
      if (data[i] !== 0x00) {
        blockTags.push(data[i]);
      }
    }
    return {
      ...base,
      tag: 0xF0,
      blockTags,
    };
  }

  private static encodeCEA(bytes: Uint8Array, cea: CEAExtensionBlock): void {
    let offset = 4;
    for (const block of cea.dataBlocks) {
      const encoded = this.encodeCEADataBlock(block);
      // Data blocks occupy bytes 4..126; byte 127 is the checksum. A single
      // data block payload is at most 31 bytes (5-bit length), so a long
      // block list can run past the end of the 128-byte block. Guard with a
      // descriptive error instead of letting bytes.set() throw a cryptic
      // RangeError (or silently truncating).
      if (offset + 1 + encoded.length > 127) {
        throw new Error(
          `CEA data blocks overflow the 127-byte payload area at offset ${offset} (block tag 0x${block.tag.toString(16).padStart(2, '0')}, ${encoded.length} bytes)`,
        );
      }
      const header = ((block.tag & 0x07) << 5) | (encoded.length & 0x1F);
      bytes[offset] = header;
      bytes.set(encoded, offset + 1);
      offset += 1 + encoded.length;
    }

    const dtdOffset = (cea.detailedTimings.length > 0 || offset > 4) ? offset : 0;
    bytes[2] = dtdOffset;

    for (const timing of cea.detailedTimings) {
      if (offset + 18 > 127) break;
      bytes.set(encodeEdidCtaDetailedTiming(this.toDetailedTimingInput(timing)), offset);
      offset += 18;
    }

    let flags = 0;
    if (cea.underscan) flags |= 0x80;
    if (cea.basicAudio) flags |= 0x40;
    if (cea.ycbcr444) flags |= 0x20;
    if (cea.ycbcr422) flags |= 0x10;
    flags |= cea.nativeFormats & 0x0F;
    bytes[3] = flags;
  }

  private static encodeCEADataBlock(block: CEADataBlock): Uint8Array {
    switch (block.tag) {
      case 0x01:
        return this.encodeAudioDataBlock(block as AudioDataBlock);
      case 0x02:
        return this.encodeVideoDataBlock(block as VideoDataBlock);
      case 0x03:
        return this.encodeVendorSpecificDataBlock(block as VendorSpecificDataBlock);
      case 0x04:
        return this.encodeSpeakerAllocationBlock(block as SpeakerAllocationBlock);
      case 0x05:
        return this.encodeVESADisplayTransferBlock(block as VESADisplayTransferCharacteristicBlock);
      case 0x07:
        return encodeExtendedDataBlock(block as CTAExtendedDataBlock);
      default:
        return block.payload;
    }
  }

  /**
   * Encode a stream of CTA-861 short data blocks back into the flat byte
   * layout that `decodeCtaDataBlockStream` consumes (DisplayID 2.0 §4.10).
   * Reuses `encodeCEADataBlock` per block (the inverse of the CEA extension
   * block's per-block encoder), so the embedded blocks round-trip exactly.
   * `trailing` (a preserved truncated/malformed remainder) is appended verbatim.
   */
  public static encodeCtaDataBlockStream(
    blocks: (CEADataBlock | CTAExtendedDataBlock)[],
    trailing: Uint8Array = new Uint8Array(0),
  ): Uint8Array {
    const parts: Uint8Array[] = [];
    let total = 0;
    for (const block of blocks) {
      const encoded = this.encodeCEADataBlock(block as CEADataBlock);
      const header = ((block.tag & 0x07) << 5) | (encoded.length & 0x1f);
      parts.push(new Uint8Array([header]), encoded);
      total += 1 + encoded.length;
    }
    if (trailing.length > 0) {
      parts.push(trailing);
      total += trailing.length;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }

  /**
   * CEA-861 payload-area capacity: bytes 4..126 (123 bytes) shared by the
   * encoded data-block stream and the 18-byte detailed timing descriptors;
   * byte 127 is the checksum. Mirrors the bounds `encodeCEA` enforces (data
   * blocks overflowing `offset + 1 + encoded.length > 127` throw; DTDs beyond
   * the area are silently dropped, which the editor must prevent).
   */
  public static readonly CEA_PAYLOAD_CAPACITY = 127 - 4; // 123
  /** Size of one detailed timing descriptor inside the payload area. */
  public static readonly CEA_DTD_SIZE = 18;

  /** Bytes a data block occupies in the payload area once encoded
   *  (header byte + body). Inverse of the per-block encode loop in `encodeCEA`. */
  public static getCeaEncodedBlockBytes(block: CEADataBlock): number {
    return 1 + this.encodeCEADataBlock(block).length;
  }

  /**
   * Bytes still free in the payload area after the current data-block stream
   * and existing DTDs. The editor gates its "+ Add Block"/"+ Add Timing"
   * actions on this so the encoder's DTD-truncation / data-block-overflow
   * paths stay unreachable.
   */
  public static getCeaFreePayloadBytes(cea: CEAExtensionBlock): number {
    let used = 0;
    for (const block of cea.dataBlocks) {
      used += 1 + this.encodeCEADataBlock(block).length;
    }
    used += this.CEA_DTD_SIZE * cea.detailedTimings.length;
    return this.CEA_PAYLOAD_CAPACITY - used;
  }

  private static encodeDisplayId(bytes: Uint8Array, block: DisplayIdExtensionBlock): void {
    const sectionBytes = encodeDisplayIdSection(block.section);

    if (sectionBytes.length > 125) {
      throw new Error(`DisplayID EDID extension payload length ${sectionBytes.length} exceeds 125 bytes`);
    }

    bytes.set(sectionBytes, 2);
  }

  private static encodeAudioDataBlock(block: AudioDataBlock): Uint8Array {
    const bytes: number[] = [];
    for (const desc of block.descriptors) {
      let byte1 = ((desc.format & 0x0F) << 3) | ((desc.channels - 1) & 0x07);
      let byte2 = 0;
      if (desc.samplingRates.sr32kHz) byte2 |= 0x01;
      if (desc.samplingRates.sr44_1kHz) byte2 |= 0x02;
      if (desc.samplingRates.sr48kHz) byte2 |= 0x04;
      if (desc.samplingRates.sr88_2kHz) byte2 |= 0x08;
      if (desc.samplingRates.sr96kHz) byte2 |= 0x10;
      if (desc.samplingRates.sr176_4kHz) byte2 |= 0x20;
      if (desc.samplingRates.sr192kHz) byte2 |= 0x40;
      let byte3 = 0;
      if (desc.format === 1 && desc.bitDepths) {
        if (desc.bitDepths.bd16) byte3 |= 0x01;
        if (desc.bitDepths.bd20) byte3 |= 0x02;
        if (desc.bitDepths.bd24) byte3 |= 0x04;
      } else if (desc.maxBitrate !== undefined) {
        byte3 = Math.round(desc.maxBitrate / 8) & 0xFF;
      } else if (desc.format === 15 && desc.extendedFormat !== undefined) {
        byte3 = (desc.extendedFormat & 0x1F) << 3;
      }
      bytes.push(byte1, byte2, byte3);
    }
    return new Uint8Array(bytes);
  }

  private static encodeVideoDataBlock(block: VideoDataBlock): Uint8Array {
    const bytes = new Uint8Array(block.vics.length);
    for (let i = 0; i < block.vics.length; i++) {
      bytes[i] = (block.vics[i].native ? 0x80 : 0) | (block.vics[i].vic & 0x7F);
    }
    return bytes;
  }

  private static encodeVendorSpecificDataBlock(block: VendorSpecificDataBlock): Uint8Array {
    if (!block.vendor || block.vendor.kind === 'unknown') return block.payload;
    const encoder = VENDOR_ENCODERS[block.vendor.kind];
    if (!encoder) return block.payload;
    // reassembleVsdbBlock returns the full VSDB bytes including the tag/length
    // header byte. encodeCEA prepends its own header byte (and derives the
    // length field from encoded.length), so strip the reassembled header to
    // avoid a double header and a length field off by one.
    return reassembleVsdbBlock(
      block.ieeeOui,
      encoder.encode(block.vendor.fields as Parameters<typeof encoder.encode>[0]),
    ).slice(1);
  }

  private static encodeSpeakerAllocationBlock(block: SpeakerAllocationBlock): Uint8Array {
    const s = block.speakers;
    let byte1 = 0;
    let byte2 = 0;
    let byte3 = 0;
    if (s.frontLeftRight) byte1 |= 0x01;
    if (s.lfe) byte1 |= 0x02;
    if (s.frontCenter) byte1 |= 0x04;
    if (s.rearLeftRight) byte1 |= 0x08;
    if (s.rearCenter) byte1 |= 0x10;
    if (s.frontLeftRightCenter) byte1 |= 0x20;
    if (s.rearLeftRightCenter) byte1 |= 0x40;
    if (s.frontLeftRightWide) byte1 |= 0x80;
    if (s.frontLeftRightHigh) byte2 |= 0x01;
    if (s.topCenter) byte2 |= 0x02;
    if (s.frontCenterHigh) byte2 |= 0x04;
    if (s.surroundLeftRight) byte2 |= 0x08;
    if (s.lfe2) byte2 |= 0x10;
    if (s.topBackCenter) byte2 |= 0x20;
    if (s.sideLeftRight) byte2 |= 0x40;
    if (s.topSideLeftRight) byte2 |= 0x80;
    if (s.topBackLeftRight) byte3 |= 0x01;
    if (s.bottomFrontCenter) byte3 |= 0x02;
    if (s.bottomFrontLeftRight) byte3 |= 0x04;
    if (s.topLeftRightSurround) byte3 |= 0x08;
    // byte3 bits 7:4 are reserved (always 0)
    const head = new Uint8Array([byte1, byte2, byte3]);
    const trailing = block.trailing ?? new Uint8Array();
    if (trailing.length === 0) return head;
    const out = new Uint8Array(head.length + trailing.length);
    out.set(head, 0);
    out.set(trailing, head.length);
    return out;
  }

  /**
   * Encode a VESA Display Transfer Characteristic Data Block (CTA tag 0x05).
   *
   * CTA-861-G Section 6.8.2 "VESA Display Transfer Characteristic Data Block":
   * the header byte packs the transfer type and the entry-count code alongside
   * reserved bits, and the following bytes are gamma values (normalized value
   * = byte / 255).
   *
   * The encoder reverses `decodeVESADisplayTransferBlock` exactly: it starts
   * from a copy of the original payload (so reserved bits and any trailing
   * bytes are preserved) and overwrites only the modeled fields. The decoder
   * reads the transfer-type code from bits 6:5 and the entry-count code from
   * bits 4:3, so the encoder writes back to those same bit positions.
   */
  private static encodeVESADisplayTransferBlock(block: VESADisplayTransferCharacteristicBlock): Uint8Array {
    const out = block.payload.slice();
    if (out.length < 1) return out;

    // Same maps as the decoder (see decodeVESADisplayTransferBlock).
    const typeCode: Record<typeof block.transferType, number> = { white: 0, red: 1, green: 2, blue: 3 };
    const numCode: Record<number, number> = { 8: 0, 16: 1, 32: 2, 48: 3 };

    // Preserve bit 7 and bits 2:0 (reserved); overwrite bits 6:5 (type) and
    // bits 4:3 (entry-count code). Unknown values fall back to 0 like the
    // decoder's `?? 'white'` / `?? 8` defaults.
    out[0] =
      (out[0] & 0x87) |
      ((typeCode[block.transferType] ?? 0) << 5) |
      ((numCode[block.numEntries] ?? 0) << 3);

    for (let i = 0; i < block.gammaValues.length && 1 + i < out.length; i++) {
      out[1 + i] = Math.round(block.gammaValues[i] * 255) & 0xFF;
    }
    return out;
  }

  private static encodeBlockMap(bytes: Uint8Array, blockMap: BlockMapExtension): void {
    for (let i = 0; i < blockMap.blockTags.length && i < 126; i++) {
      bytes[1 + i] = blockMap.blockTags[i];
    }
  }

  /**
   * Coerce a CEA DTD (or a bare `DetailedTimingDescriptor`) into the input shape
   * the shared 18-byte codec accepts. Both already carry the full `DetailedTiming`
   * field set, so this is a type-level widening — no field copying is needed.
   */
  private static toDetailedTimingInput(
    timing: DetailedTimingDescriptor | CEADetailedTiming,
  ): DetailedTimingInput {
    return timing;
  }
}

/**
 * Helper to find HDMI vendor specific block (HDMI 1.4)
 */
export function findHDMIBlock(cea: CEAExtensionBlock): VendorSpecificDataBlock | null {
  return findVSDBByKind(cea, 'hdmi14');
}

/**
 * Helper to find HDMI Forum vendor specific block (HDMI 2.0/2.1).
 * Returns null until the HDMI Forum decoder is registered (see Task 3).
 */
export function findHDMIForumBlock(cea: CEAExtensionBlock): VendorSpecificDataBlock | null {
  return findVSDBByKind(cea, 'hdmiForum');
}

/**
 * Helper to get supported video formats from CEA
 */
export function getSupportedVICs(cea: CEAExtensionBlock): number[] {
  const vdb = cea.dataBlocks.find(b => b.tag === 0x02) as VideoDataBlock | undefined;
  return vdb?.vics.map(v => v.vic) ?? [];
}

/**
 * Helper to check if display supports HDMI 2.1 features
 */
export function getHDMI21Features(cea: CEAExtensionBlock): {
  vrr: boolean;
  allm: boolean;
  qms: boolean;
  dsc: boolean;
  maxFrlRate: number;
} | null {
  const forum = findHDMIForumBlock(cea);
  if (!forum?.vendor || forum.vendor.kind !== 'hdmiForum') return null;

  const fields = forum.vendor.fields;
  return {
    vrr: fields.vrr,
    allm: fields.allm,
    qms: fields.fva,
    dsc: fields.dsc,
    maxFrlRate: fields.maxFrlRate,
  };
}
