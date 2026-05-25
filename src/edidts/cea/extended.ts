import type { CEADataBlock, DataBlockHeader } from "./cea.ts";
import { VideoDataBlock, VIC } from "./cea";

export enum CEAExtendedTag {
  Uninitialized = -1,
  VideoCapabilityDB = 0,
  VendorSpecificVideoDB = 1,
  VESADisplayDeviceDB = 2,
  VESAVideoTimingBlockExtension = 3,
  HDMIVideoDB = 4,
  ColorimetryDB = 5,
  HDRStaticMetadataDB = 6,
  VideoFormatPreferenceDB = 13,
  YCBCR420VideoDB = 14,
  YCBCR420CapabilityMap = 15,
  CTAMiscellaneousAudioDB = 16,
  VendorSpecificAudioDB = 17,
  HDMIAudioDB = 18,
  RoomConfigurationDB = 19,
  SpeakerLocationDB = 20,
}

// Make enums of OverscanBehavior
export class VideoCapabilityDataBlock implements CEADataBlock {
  kind = 'extended' as const;
  extendedKind = 'videoCapability' as const;
  Header: DataBlockHeader;
  YCCQuantizationRangeSelectable: boolean = false;
  RGBQuantizationRangeSelectable: boolean = false;
  PTOverscanBehavior: string = "";
  ITOverscanBehavior: string = "";
  CEOverscanBehavior: string = "";
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "Video Capability Data Block";
  }

  Decode(dbBytes: Uint8Array): VideoCapabilityDataBlock {
    this.YCCQuantizationRangeSelectable = dbBytes[2] & 0x80 ? true : false;
    this.RGBQuantizationRangeSelectable = dbBytes[2] & 0x40 ? true : false;
    this.PTOverscanBehavior = "";
    switch (dbBytes[2] & 0x30) {
      case 48:
        this.PTOverscanBehavior = "Supports both over and underscan";
        break;
      case 32:
        this.PTOverscanBehavior = "Always Underscanned";
        break;
      case 16:
        this.PTOverscanBehavior = "Always Overscanned";
        break;
      default:
        this.PTOverscanBehavior = "No Data";
        break;
    }
    this.ITOverscanBehavior = "";
    switch (dbBytes[2] & 0xc) {
      case 12:
        this.ITOverscanBehavior = "Supports both over and underscan";
        break;
      case 8:
        this.ITOverscanBehavior = "Always Underscanned";
        break;
      case 4:
        this.ITOverscanBehavior = "Always Overscanned";
        break;
      default:
        this.ITOverscanBehavior = "IT Video Formats not supported";
        break;
    }
    this.CEOverscanBehavior = "";
    switch (dbBytes[2] & 0x3) {
      case 3:
        this.CEOverscanBehavior = "Supports both over and underscan";
        break;
      case 2:
        this.CEOverscanBehavior = "Always Underscanned";
        break;
      case 1:
        this.CEOverscanBehavior = "Always Overscanned";
        break;
      default:
        this.CEOverscanBehavior = "CE Video Formats not supported";
        break;
    }
    return this;
  }
  Encode(): Uint8Array {
    this.Header.Size = 2;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    rawBlock[1] = CEAExtendedTag.VideoCapabilityDB;
    rawBlock[2] = 0;
    if (this.YCCQuantizationRangeSelectable) rawBlock[2] |= 0x80;
    if (this.RGBQuantizationRangeSelectable) rawBlock[2] |= 0x40;
    // Map string values back to 2-bit fields
    switch (this.PTOverscanBehavior) {
      case "Supports both over and underscan": rawBlock[2] |= 0x30; break;
      case "Always Underscanned": rawBlock[2] |= 0x20; break;
      case "Always Overscanned": rawBlock[2] |= 0x10; break;
    }
    switch (this.ITOverscanBehavior) {
      case "Supports both over and underscan": rawBlock[2] |= 0x0c; break;
      case "Always Underscanned": rawBlock[2] |= 0x08; break;
      case "Always Overscanned": rawBlock[2] |= 0x04; break;
    }
    switch (this.CEOverscanBehavior) {
      case "Supports both over and underscan": rawBlock[2] |= 0x03; break;
      case "Always Underscanned": rawBlock[2] |= 0x02; break;
      case "Always Overscanned": rawBlock[2] |= 0x01; break;
    }
    return rawBlock;
  }
}

export class ColorimetryDataBlock implements CEADataBlock {
  kind = 'extended' as const;
  extendedKind = 'colorimetry' as const;
  Header: DataBlockHeader;
  xvYCC601: boolean = false;
  xvYCC709: boolean = false;
  sYCC601: boolean = false;
  opYCC601: boolean = false;
  opRGB: boolean = false;
  BT2020cYCC: boolean = false;
  BT2020YCC: boolean = false;
  BT2020RGB: boolean = false;
  DCIP3: boolean = false;
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "Colorimetry Data Block";
  }
  Decode(dbBytes: Uint8Array): ColorimetryDataBlock {
    this.xvYCC601 = dbBytes[2] & 0x80 ? true : false;
    this.xvYCC709 = dbBytes[2] & 0x40 ? true : false;
    this.sYCC601 = dbBytes[2] & 0x20 ? true : false;
    this.opYCC601 = dbBytes[2] & 0x10 ? true : false;
    this.opRGB = dbBytes[2] & 0x08 ? true : false;
    this.BT2020cYCC = dbBytes[2] & 0x04 ? true : false;
    this.BT2020YCC = dbBytes[2] & 0x02 ? true : false;
    this.BT2020RGB = dbBytes[2] & 0x01 ? true : false;
    this.DCIP3 = dbBytes[3] & 0x80 ? true : false;
    return this;
  }
  Encode(): Uint8Array {
    this.Header.Size = 3;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    rawBlock[1] = CEAExtendedTag.ColorimetryDB;
    rawBlock[2] = 0;
    if (this.xvYCC601) rawBlock[2] |= 0x80;
    if (this.xvYCC709) rawBlock[2] |= 0x40;
    if (this.sYCC601) rawBlock[2] |= 0x20;
    if (this.opYCC601) rawBlock[2] |= 0x10;
    if (this.opRGB) rawBlock[2] |= 0x08;
    if (this.BT2020cYCC) rawBlock[2] |= 0x04;
    if (this.BT2020YCC) rawBlock[2] |= 0x02;
    if (this.BT2020RGB) rawBlock[2] |= 0x01;
    rawBlock[3] = 0;
    if (this.DCIP3) rawBlock[3] |= 0x80;
    return rawBlock;
  }
}

export class SpeakerLocationDataBlock implements CEADataBlock {
  kind = 'extended' as const;
  extendedKind = 'speakerLocation' as const;
  Header: DataBlockHeader;
  RearLeftRightCenter: boolean = false;
  FrontLeftRightCenter: boolean = false;
  RearCenter: boolean = false;
  RearLeftRight: boolean = false;
  FrontCenter: boolean = false;
  LFE: boolean = false;
  FrontLeftRight: boolean = false;
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "Speaker Location Data Block";
  }
  Decode(dbBytes: Uint8Array): SpeakerLocationDataBlock {
    this.RearLeftRightCenter = dbBytes[1] & 0x40 ? true : false;
    this.FrontLeftRightCenter = dbBytes[1] & 0x20 ? true : false;
    this.RearCenter = dbBytes[1] & 0x10 ? true : false;
    this.RearLeftRight = dbBytes[1] & 0x08 ? true : false;
    this.FrontCenter = dbBytes[1] & 0x04 ? true : false;
    this.LFE = dbBytes[1] & 0x02 ? true : false;
    this.FrontLeftRight = dbBytes[1] & 0x01 ? true : false;
    return this;
  }
  Encode(): Uint8Array {
    this.Header.Size = 2;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    rawBlock[1] = CEAExtendedTag.SpeakerLocationDB;
    rawBlock[2] = 0;
    if (this.RearLeftRightCenter) rawBlock[2] |= 0x40;
    if (this.FrontLeftRightCenter) rawBlock[2] |= 0x20;
    if (this.RearCenter) rawBlock[2] |= 0x10;
    if (this.RearLeftRight) rawBlock[2] |= 0x08;
    if (this.FrontCenter) rawBlock[2] |= 0x04;
    if (this.LFE) rawBlock[2] |= 0x02;
    if (this.FrontLeftRight) rawBlock[2] |= 0x01;
    return rawBlock;
  }
}

export class HDRStaticMetadataDataBlock implements CEADataBlock {
  kind = 'extended' as const;
  extendedKind = 'hdr' as const;
  Header: DataBlockHeader;
  HLG: boolean = false;
  ST2084: boolean = false;
  HDR: boolean = false;
  SDR: boolean = false;
  StaticMetadataType1: boolean = false;
  ContentMaxLuminanceData: number = 0;
  ContentMaxFrameAverage: number = 0;
  ContentMinLuminance: number = 0;
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "HDR Static Metadata Data Block";
  }
  Decode(dbBytes: Uint8Array): HDRStaticMetadataDataBlock {
    this.HLG = dbBytes[2] & 0x08 ? true : false;
    this.ST2084 = dbBytes[2] & 0x04 ? true : false;
    this.HDR = dbBytes[2] & 0x02 ? true : false;
    this.SDR = dbBytes[2] & 0x01 ? true : false;
    this.StaticMetadataType1 = dbBytes[3] & 0x01 ? true : false;
    if (this.StaticMetadataType1 && dbBytes.length >= 7) {
      // Luminance value= 50 * 2(CV/32)
      this.ContentMaxLuminanceData = 50 * Math.pow(2, dbBytes[4] / 32);
      this.ContentMaxFrameAverage = 50 * Math.pow(2, dbBytes[5] / 32);
      // Desired Content Min Luminance = Desired Content Max Luminance * (CV/255)2 / 100
      this.ContentMinLuminance =
        (this.ContentMaxLuminanceData * Math.pow(dbBytes[6] / 255, 2)) / 100;
    }
    return this;
  }
  Encode(): Uint8Array {
    let hasLuminance = this.StaticMetadataType1 && this.ContentMaxLuminanceData > 0;
    // CTA-861-G Section 6.4: minimum block is extended tag + EOTF flags + static metadata type (3 payload bytes)
    this.Header.Size = hasLuminance ? 6 : 3;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    rawBlock[1] = CEAExtendedTag.HDRStaticMetadataDB;
    rawBlock[2] = 0;
    if (this.HLG) rawBlock[2] |= 0x08;
    if (this.ST2084) rawBlock[2] |= 0x04;
    if (this.HDR) rawBlock[2] |= 0x02;
    if (this.SDR) rawBlock[2] |= 0x01;
    rawBlock[3] = 0;
    if (this.StaticMetadataType1) rawBlock[3] |= 0x01;
    if (hasLuminance) {
      // Reverse: dbBytes[4] = 32 * log2(maxLum / 50)
      rawBlock[4] = Math.min(255, Math.max(0, Math.round(32 * Math.log2(this.ContentMaxLuminanceData / 50))));
      rawBlock[5] = Math.min(255, Math.max(0, Math.round(32 * Math.log2(this.ContentMaxFrameAverage / 50))));
      // Reverse: dbBytes[6] = 255 * sqrt(minLum * 100 / maxLum)
      rawBlock[6] = Math.min(255, Math.max(0, Math.round(255 * Math.sqrt(this.ContentMinLuminance * 100 / this.ContentMaxLuminanceData))));
    }
    return rawBlock;
  }
}

export type ExtendedDataBlockUnion =
  | VideoCapabilityDataBlock
  | ColorimetryDataBlock
  | HDRStaticMetadataDataBlock
  | YCBCR420CapabilityMap
  | SpeakerLocationDataBlock;

export class YCBCR420CapabilityMap implements CEADataBlock {
  kind = 'extended' as const;
  extendedKind = 'ycbcr420' as const;
  Header: DataBlockHeader;
  VideDBNumber: number[] = [];
  VICs: VIC[] = [];
  vicCounter: number = 0;
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "YCBCR 420 Capability Map";
  }
  Decode(dbBytes: Uint8Array): YCBCR420CapabilityMap {
    let counter = 0;
    for (let i = 2; i < dbBytes.length; i++) {
      for (let j = 0; j < 8; j++) {
        if (dbBytes[i] & (1 << j)) {
          this.VideDBNumber.push(counter);
        }
        counter++;
      }
    }
    return this;
  }
  DecodeWithVICs(dbBytes: Uint8Array, videoDB: VideoDataBlock): YCBCR420CapabilityMap {
    let counter = 0;
    for (let i = 2; i < dbBytes.length; i++) {
      for (let j = 0; j < 8; j++) {
        if (dbBytes[i] & (1 << j)) {
          this.VideDBNumber.push(counter);
          this.VICs.push(videoDB.VICs[counter]);
        }
        counter++;
      }
    }
    return this;
  }
  Encode(): Uint8Array {
    let maxVicIndex = 0;
    for (let n of this.VideDBNumber) {
      if (n > maxVicIndex) maxVicIndex = n;
    }
    for (let i = 0; i < this.VICs.length; i++) {
      if (i > maxVicIndex) maxVicIndex = i;
    }
    let numBytes = Math.ceil((maxVicIndex + 1) / 8);
    if (numBytes === 0) numBytes = 1;
    this.Header.Size = numBytes + 1;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    rawBlock[1] = CEAExtendedTag.YCBCR420CapabilityMap;
    if (this.VICs.length > 0) {
      for (let i = 0; i < this.VICs.length; i++) {
        let byteIndex = Math.floor(i / 8) + 2;
        let bitIndex = i % 8;
        rawBlock[byteIndex] |= (1 << bitIndex);
      }
    } else {
      for (let n of this.VideDBNumber) {
        let byteIndex = Math.floor(n / 8) + 2;
        let bitIndex = n % 8;
        rawBlock[byteIndex] |= (1 << bitIndex);
      }
    }
    return rawBlock;
  }
}
