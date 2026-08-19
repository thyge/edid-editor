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
// Side-effect import: registers the Dolby VSVDB decoder/encoder with the
// VSVDB registry so consumers can find it via VENDOR_VSVDB_DECODERS[OUI.DOLBY].
import './vsvdb/dolby';
import {
  DetailedTimingDescriptor,
  decodeEdidCtaDetailedTiming,
  encodeEdidCtaDetailedTiming,
  type DetailedTiming,
  type DetailedTimingInput,
  type TimingFlags,
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

export interface CEADataBlock {
  tag: CEADataBlockTag;
  data: Uint8Array;
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
  speakers: {
    frontLeftRight: boolean;
    lfe: boolean;
    frontCenter: boolean;
    rearLeftRight: boolean;
    rearCenter: boolean;
    frontLeftRightCenter: boolean;
    rearLeftRightCenter: boolean;
    frontLeftRightWide: boolean;
    frontLeftRightHigh: boolean;
    topCenter: boolean;
    frontCenterHigh: boolean;
  };
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

export interface CEADetailedTiming {
  pixelClock: number;
  horizontalActive: number;
  horizontalBlanking: number;
  verticalActive: number;
  verticalBlanking: number;
  horizontalSyncOffset: number;
  horizontalSyncWidth: number;
  verticalSyncOffset: number;
  verticalSyncWidth: number;
  interlaced: boolean;
  horizontalImageSize?: number;
  verticalImageSize?: number;
  horizontalBorder?: number;
  verticalBorder?: number;
  flags?: Partial<TimingFlags>;
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

    // Parse detailed timings (from dtdOffset to end, each 18 bytes)
    if (dtdOffset > 0 && dtdOffset < 127) {
      let offset = dtdOffset;
      while (offset + 18 <= 127) {
        const pixelClock = (data[offset + 1] << 8) | data[offset];
        if (pixelClock === 0) break; // No more timings

        const timing = decodeEdidCtaDetailedTiming(data.slice(offset, offset + 18));
        if (!timing) break;
        cea.detailedTimings.push(this.toCEADetailedTiming(timing));

        offset += 18;
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
        return { tag, data };
    }
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
        descriptor.maxBitrate = data[i + 2] * 8;
      } else if (format === 15) { // Audio Format Extension — byte 3 bits 7:3
        descriptor.extendedFormat = (data[i + 2] >> 3) & 0x1F;
      }

      descriptors.push(descriptor);
    }

    return { tag: 0x01, data, descriptors };
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

    return { tag: 0x02, data, vics };
  }

  private static decodeVendorSpecificBlock(data: Uint8Array): VendorSpecificDataBlock {
    return decodeVendorSpecificBlock(data);
  }

  private static decodeSpeakerAllocationBlock(data: Uint8Array): SpeakerAllocationBlock {
    const byte1 = data[0] || 0;
    const byte2 = data[1] || 0;

    return {
      tag: 0x04,
      data,
      speakers: {
        frontLeftRight: (byte1 & 0x01) !== 0,
        lfe: (byte1 & 0x02) !== 0,
        frontCenter: (byte1 & 0x04) !== 0,
        rearLeftRight: (byte1 & 0x08) !== 0,
        rearCenter: (byte1 & 0x10) !== 0,
        frontLeftRightCenter: (byte1 & 0x20) !== 0,
        rearLeftRightCenter: (byte1 & 0x40) !== 0,
        frontLeftRightWide: (byte1 & 0x80) !== 0,
        frontLeftRightHigh: (byte2 & 0x01) !== 0,
        topCenter: (byte2 & 0x02) !== 0,
        frontCenterHigh: (byte2 & 0x04) !== 0,
      },
    };
  }

  private static decodeVESADisplayTransferBlock(data: Uint8Array): VESADisplayTransferCharacteristicBlock {
    if (data.length < 1) {
      return { tag: 0x05, data, transferType: 'white', numEntries: 0, gammaValues: [] };
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
      data,
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
        return block.data;
    }
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
    if (!block.vendor || block.vendor.kind === 'unknown') return block.data;
    const encoder = VENDOR_ENCODERS[block.vendor.kind];
    if (!encoder) return block.data;
    return reassembleVsdbBlock(
      block.ieeeOui,
      encoder.encode(block.vendor.fields as Parameters<typeof encoder.encode>[0])
    );
  }

  private static encodeSpeakerAllocationBlock(block: SpeakerAllocationBlock): Uint8Array {
    const s = block.speakers;
    let byte1 = 0;
    let byte2 = 0;
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
    return new Uint8Array([byte1, byte2, 0]);
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
    const out = block.data.slice();
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

  private static toCEADetailedTiming(timing: DetailedTiming): CEADetailedTiming {
    return Object.assign(timing, { interlaced: timing.flags.interlaced });
  }

  private static toDetailedTimingInput(timing: DetailedTimingDescriptor | CEADetailedTiming): DetailedTimingInput {
    if (timing instanceof DetailedTimingDescriptor) {
      if ('interlaced' in timing) {
        timing.flags.interlaced = Boolean(timing.interlaced);
      }
      return timing;
    }

    return {
      pixelClock: timing.pixelClock,
      horizontalActive: timing.horizontalActive,
      horizontalBlanking: timing.horizontalBlanking,
      verticalActive: timing.verticalActive,
      verticalBlanking: timing.verticalBlanking,
      horizontalSyncOffset: timing.horizontalSyncOffset,
      horizontalSyncWidth: timing.horizontalSyncWidth,
      verticalSyncOffset: timing.verticalSyncOffset,
      verticalSyncWidth: timing.verticalSyncWidth,
      horizontalImageSize: timing.horizontalImageSize,
      verticalImageSize: timing.verticalImageSize,
      horizontalBorder: timing.horizontalBorder,
      verticalBorder: timing.verticalBorder,
      flags: {
        ...timing.flags,
        interlaced: timing.flags?.interlaced ?? timing.interlaced,
      },
    };
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
