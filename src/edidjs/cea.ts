import { vicLookup } from "./vics.js";
import { DetailedTimingDescriptor } from "./DetailedTimingDescriptor.ts";
import { HDMI_1_4, HDMI_2_0, VSDBTag } from "./vsdb.js";
import {
  CEAExtendedTag,
  ColorimetryDataBlock,
  SpeakerLocationDataBlock,
  VideoCapabilityDataBlock,
  HDRStaticMetadataDataBlock,
  YCBCR420CapabilityMap,
} from "./cea_extended.ts";

export enum CEADataBlockType {
  Uninitialized = 0,
  DBAudioDataBlock = 1,
  DBVideoDataBlock = 2,
  DBVendorSpecificDataBlock = 3,
  DBSpeakerAllocationData = 4,
  DBVESAVDIFDataBlock = 5,
  DBReserverdDataBlock = 6,
  DBUseExtendedTag = 7,
}

export class CEA {
  raw = new Uint8Array();
  Header = new CEAHeader();
  DataBlocks: CEADataBlock[] = [];
  DetailedTimingBlocks: DetailedTimingDescriptor[] = [];
  Extension = 0;

  Decode(bytes: Uint8Array) {
    this.raw = bytes;
    this.Header.Decode(this.raw.slice(0, 4));
    // Data Block Collection
    // If byte 2 is 04, the collection is of zero length (i.e. not present).
    for (let i = 4; i < this.Header.dtdStartByte; ) {
      let blockLength = this.raw[i] & 0x1f;
      let blockSlice = this.raw.slice(i, i + blockLength + 1);
      let dbHeader = new DataBlockHeader().Decode(blockSlice);
      switch (dbHeader.Type) {
        case CEADataBlockType.DBAudioDataBlock:
          let audioBlock = new AudioDataBlock(dbHeader);
          audioBlock.Decode(blockSlice);
          this.DataBlocks.push(audioBlock);
          break;
        case CEADataBlockType.DBVideoDataBlock:
          let vidBlock = new VideoDataBlock(dbHeader);
          vidBlock.Decode(blockSlice);
          this.DataBlocks.push(vidBlock);
          break;
        case CEADataBlockType.DBVendorSpecificDataBlock:
          switch (dbHeader.VSDB) {
            case VSDBTag.IEEE_HDMI1_4:
              let hdmi14 = new HDMI_1_4(dbHeader);
              hdmi14.Decode(blockSlice);
              this.DataBlocks.push(hdmi14);
              break;
            case VSDBTag.IEEE_HDMI2_0:
              let hdmi20 = new HDMI_2_0(dbHeader);
              hdmi20.Decode(blockSlice);
              this.DataBlocks.push(hdmi20);
              break;
            case VSDBTag.IEEE_HDMIDolbyVision:
              break;
            case VSDBTag.IEEE_HDMIHDR10:
              break;
            case VSDBTag.IEEE_SpecializedMonitor:
              break;
            case VSDBTag.IEEE_NVIDIA:
              break;
            default:
              break;
          }
          break;
        case CEADataBlockType.DBSpeakerAllocationData:
          let spkBlock = new SpeakerAllocationDataBlock(dbHeader);
          spkBlock.Decode(blockSlice);
          this.DataBlocks.push(spkBlock);
          break;
        case CEADataBlockType.DBVESAVDIFDataBlock:
          break;
        case CEADataBlockType.DBReserverdDataBlock:
          break;
        case CEADataBlockType.DBUseExtendedTag:
          switch (dbHeader.ExtendedTag) {
            case CEAExtendedTag.VideoCapabilityDB:
              let vcdb = new VideoCapabilityDataBlock(dbHeader);
              vcdb.Decode(blockSlice);
              this.DataBlocks.push(vcdb);
              break;
            case CEAExtendedTag.VendorSpecificVideoDB:
              break;
            case CEAExtendedTag.VESADisplayDeviceDB:
              break;
            case CEAExtendedTag.VESAVideoTimingBlockExtension:
              break;
            case CEAExtendedTag.HDMIVideoDB:
              break;
            case CEAExtendedTag.ColorimetryDB:
              let colDB = new ColorimetryDataBlock(dbHeader);
              colDB.Decode(blockSlice);
              this.DataBlocks.push(colDB);
              break;
            case CEAExtendedTag.HDRStaticMetadataDB:
              let hdrDB = new HDRStaticMetadataDataBlock(dbHeader);
              hdrDB.Decode(blockSlice);
              this.DataBlocks.push(hdrDB);
              break;
            case CEAExtendedTag.VideoFormatPreferenceDB:
              break;
            case CEAExtendedTag.YCBCR420VideoDB:
              break;
            case CEAExtendedTag.YCBCR420CapabilityMap:
              // This needs some work
              let y420 = new YCBCR420CapabilityMap(dbHeader);
              let videodb = this.DataBlocks.find((db) => db.Header.Type == CEADataBlockType.DBVideoDataBlock);
              // in case we don't have VideoDataBlock, enable decoding with numbers
              if (videodb) {
                y420.DecodeWithVICs(blockSlice, videodb as VideoDataBlock);
              } else {
                y420.Decode(blockSlice);
              }
              this.DataBlocks.push(y420);
              break;
            case CEAExtendedTag.CTAMiscellaneousAudioDB:
              break;
            case CEAExtendedTag.VendorSpecificAudioDB:
              break;
            case CEAExtendedTag.HDMIAudioDB:
              break;
            case CEAExtendedTag.RoomConfigurationDB:
              break;
            case CEAExtendedTag.SpeakerLocationDB:
              let spkDB = new SpeakerLocationDataBlock(dbHeader);
              spkDB.Decode(blockSlice);
              this.DataBlocks.push(spkDB);
              break;
            default:
              break;
          }
          break;
      }
      i += blockLength + 1;
    }
    if (this.Header.dtdStartByte != 0) {
      for (let d = this.Header.dtdStartByte; d < 127 - 18; d += 18) {
        let dtd = new DetailedTimingDescriptor().Decode(this.raw.slice(d, d + 18 + 1));
        // check if dtd before adding
        if (dtd != null) {
          this.DetailedTimingBlocks.push(dtd);
        }
      }
    }
  }
  Encode() {
    let headerBytes = this.Header.Encode();
    this.raw[0] = headerBytes[0];
    this.raw[1] = headerBytes[1];
    this.raw[2] = headerBytes[2];
    this.raw[3] = headerBytes[3];
  }
}

class CEAHeader {
  raw = new Uint8Array();
  Version: string = "";
  dtdStartByte = 0;

  Underscan = false;
  BasicAudio = false;
  YCBCR444 = false;
  YCBCR422 = false;
  numNativeDTDs = 0;

  Decode(bytes: Uint8Array) {
    this.Version = bytes[1].toString();
    this.dtdStartByte = bytes[2];
    if (parseInt(this.Version)  > 1) {
      // Bit 7	1 if display supports underscan, 0 if not
      // Bit 6	1 if display supports basic audio, 0 if not
      // Bit 5	1 if display supports YCbCr 4∶4∶4, 0 if not
      // Bit 4	1 if display supports YCbCr 4∶2∶2, 0 if not
      // Bit 3–0	Total number of native formats in the DTDs included in this block
      this.Underscan = bytes[3] & 0x80 ? true : false;
      this.BasicAudio = bytes[3] & 0x40 ? true : false;
      this.YCBCR444 = bytes[3] & 0x20 ? true : false;
      this.YCBCR422 = bytes[3] & 0x10 ? true : false;
      this.numNativeDTDs = bytes[3] & 0x0f;
    }
  }

  Encode() {
    let rawHeader = new Uint8Array(4);
    rawHeader[0] = 0x02;
    rawHeader[1] = parseInt(this.Version);
    rawHeader[2] = this.dtdStartByte;
    if (parseInt(this.Version) > 1) {
      rawHeader[3] |= this.Underscan ? 0x80 : 0x00;
      rawHeader[3] |= this.BasicAudio ? 0x40 : 0x00;
      rawHeader[3] |= this.YCBCR444 ? 0x20 : 0x00;
      rawHeader[3] |= this.YCBCR422 ? 0x10 : 0x00;
      rawHeader[3] |= this.numNativeDTDs;
    }
    return rawHeader;
  }
}

export class DataBlockHeader {
  Type = CEADataBlockType.Uninitialized;
  ExtendedTag = CEAExtendedTag.Uninitialized;
  VSDB = VSDBTag.Uninitialized;
  Name = "";
  ExtendedType = 0;
  Size = 0;

  Decode(bytes: Uint8Array): DataBlockHeader {
    this.Type = bytes[0] >> 5;
    this.Size = bytes[0] & 0x1f;
    if (this.Type === CEADataBlockType.DBUseExtendedTag) {
      this.ExtendedTag = bytes[1];
    }
    if (this.Type === CEADataBlockType.DBVendorSpecificDataBlock) {
      this.VSDB = bytes[3] | (bytes[2] << 8) | (bytes[1] << 16);
    }
    return this;
  }
  Encode() {
    let rawHeader = new Uint8Array(1);
    rawHeader[0] = (this.Type << 5) | this.Size;
    return rawHeader;
  }
}

export interface CEADataBlock {
  Header: DataBlockHeader;
  Decode(dbBytes: Uint8Array): CEADataBlock;
  Encode(): Uint8Array;
}

class VIC {
  VIC: number = 0;
  Name: string = "";
  Description: string = "";
  PixelMHz: number = 0;
  HorizontalActive: number = 0;
  VerticalActive: number = 0;
  Native: boolean = false;
}

class VideoDataBlock implements CEADataBlock {
  Header = new DataBlockHeader();
  VICs: {}[] = [];
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "Video Data Block";
  }
  Decode(dbBytes: Uint8Array): VideoDataBlock {
    this.Header.Decode(dbBytes.slice(0, 1));
    for (let v = 1; v < this.Header.Size; v++) {
      let vic = vicLookup[dbBytes[v] & 0x7f];
      vic.Native = (dbBytes[v] & 0x80) > 0 ? true : false;
      this.VICs.push(vic);
    }
    return this;
  }
  Encode(): Uint8Array {
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    return rawBlock;
  }
}

enum AudioType {
  LPCM = 1,
  AC3 = 2,
  MPEG1 = 3,
  MP3 = 4,
  MPEG2 = 5,
  AAC_LC = 6,
  DTS = 7,
  ATRAC = 8,
  OneBitAudio = 9,
  DDPlus = 10,
  DTS_HD = 11,
  MAT_MLP_TrueHD = 12,
  DST = 13,
  WMAPro = 14,
  Extension = 15,
  Reserved = 0,
}

class AudioDataBlock implements CEADataBlock {
  Header = new DataBlockHeader();
  AudioType: AudioType = AudioType.Reserved;
  Channels: number = 0;
  Sampling192: boolean = false;
  Sampling176: boolean = false;
  Sampling96: boolean = false;
  Sampling88: boolean = false;
  Sampling48: boolean = false;
  Sampling44_1: boolean = false;
  Sampling32: boolean = false;
  BitDepth16: boolean = false;
  BitDepth20: boolean = false;
  BitDepth24: boolean = false;

  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "Audio Data Block";
  }

  Decode(dbBytes: Uint8Array): AudioDataBlock {
    this.AudioType = (dbBytes[1] & 0x78) >> 3;
    this.Channels = (dbBytes[1] & 0x7) + 1;
    this.Sampling192 = dbBytes[2] & 0x40 ? true : false;
    this.Sampling176 = dbBytes[2] & 0x20 ? true : false;
    this.Sampling96 = dbBytes[2] & 0x10 ? true : false;
    this.Sampling88 = dbBytes[2] & 0x08 ? true : false;
    this.Sampling48 = dbBytes[2] & 0x04 ? true : false;
    this.Sampling44_1 = dbBytes[2] & 0x02 ? true : false;
    this.Sampling32 = dbBytes[2] & 0x01 ? true : false;

    this.BitDepth16 = dbBytes[3] & 0x01 ? true : false;
    this.BitDepth20 = dbBytes[3] & 0x02 ? true : false;
    this.BitDepth24 = dbBytes[3] & 0x04 ? true : false;
    return this;
  }
  Encode(): Uint8Array {
    throw new Error("Method not implemented.");
  }
}

class SpeakerAllocationDataBlock implements CEADataBlock {
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
    this.Header.Name = "Speaker Allocation";
  }
  Decode(dbBytes: Uint8Array): SpeakerAllocationDataBlock {
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
