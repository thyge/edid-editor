import type { CEADataBlock, DataBlockHeader } from "./cea.ts";
import { VideoDataBlock } from "./cea.ts";

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
  Header: DataBlockHeader;
  YCCQuantizationRangeSelectable: boolean = false;
  RGBQuantizationRangeSelectable: boolean = false;
  PTOverscanBehavior: string = "";
  ITOverscanBehavior: string = "";
  CEOverscanBehavior: string = "";
  constructor(header: DataBlockHeader) {
    this.Header = header;
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
    throw new Error("Method not implemented.");
  }
}

export class ColorimetryDataBlock implements CEADataBlock {
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
    throw new Error("Method not implemented.");
  }
}

export class SpeakerLocationDataBlock implements CEADataBlock {
  Header = new DataBlockHeader();
  RearLeftRightCenter: boolean = false;
  FrontLeftRightCenter: boolean = false;
  RearCenter: boolean = false;
  RearLeftRight: boolean = false;
  FrontCenter: boolean = false;
  LFE: boolean = false;
  FrontLeftRight: boolean = false;
  constructor(header: DataBlockHeader) {
    this.Header = header;
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
    throw new Error("Method not implemented.");
  }
}

export class HDRStaticMetadataDataBlock implements CEADataBlock {
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
  }
  Decode(dbBytes: Uint8Array): HDRStaticMetadataDataBlock {
    this.HLG = dbBytes[2] & 0x08 ? true : false;
    this.ST2084 = dbBytes[2] & 0x04 ? true : false;
    this.HDR = dbBytes[2] & 0x02 ? true : false;
    this.SDR = dbBytes[2] & 0x01 ? true : false;
    this.StaticMetadataType1 = dbBytes[3] & 0x01 ? true : false;
    if (this.StaticMetadataType1 && dbBytes.length > 4) {
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
    throw new Error("Method not implemented.");
  }
}

export class YCBCR420CapabilityMap implements CEADataBlock {
  Header: DataBlockHeader;
  VideDBNumber: number[] = [];
  VICs: {}[] = [];
  vicCounter: number = 0;
  constructor(header: DataBlockHeader) {
    this.Header = header;
  }
  Decode(dbBytes: Uint8Array): YCBCR420CapabilityMap {
    for (let i = 2; i < dbBytes.length; i++) {
      for (let j = 0; j < 8; j++) {
        if (dbBytes[i] & (1 << j)) {
          this.VideDBNumber.push(this.vicCounter);
        }
        this.vicCounter++;
      }
    }
    return this;
  }
  DecodeWithVICs(dbBytes: Uint8Array, videoDB: VideoDataBlock): YCBCR420CapabilityMap {
    for (let i = 2; i < dbBytes.length; i++) {
      for (let j = 0; j < 8; j++) {
        if (dbBytes[i] & (1 << j)) {
          this.VICs.push(videoDB.VICs[this.vicCounter]);
        }
        this.vicCounter++;
      }
    }
    return this;
  }
  Encode(): Uint8Array {
    throw new Error("Method not implemented.");
  }
}
