import { vicLookup } from "../common/vics.ts";
import { DetailedTimingDescriptor } from "../common/DetailedTimingDescriptor.ts";
import { calcEDIDChecksum } from "../common/utils.ts";
import {
  HDMI_1_4,
  HDMI_2_0,
  VSDBTag,
  HMDSpecialisedMonitor,
} from "./vsdb";
import {
  CEAExtendedTag,
  ColorimetryDataBlock,
  SpeakerLocationDataBlock,
  VideoCapabilityDataBlock,
  HDRStaticMetadataDataBlock,
  YCBCR420CapabilityMap,
} from "./extended.ts";

export type CEADataBlockUnion =
  | VideoDataBlock
  | AudioDataBlock
  | SpeakerAllocationDataBlock
  | HDMI_1_4
  | HDMI_2_0
  | HMDSpecialisedMonitor
  | VideoCapabilityDataBlock
  | ColorimetryDataBlock
  | HDRStaticMetadataDataBlock
  | YCBCR420CapabilityMap
  | SpeakerLocationDataBlock;

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
  raw: Uint8Array = new Uint8Array();
  Header = new CEAHeader();
  DataBlocks: CEADataBlockUnion[] = [];
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
              let hmd_specialised = new HMDSpecialisedMonitor(dbHeader);
              hmd_specialised.Decode(blockSlice);
              this.DataBlocks.push(hmd_specialised);
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
        let dtd_bytes = this.raw.slice(d, d + 18);
        let dtd = new DetailedTimingDescriptor().Decode(dtd_bytes);
        // check if dtd before adding
        if (dtd != null) {
          this.DetailedTimingBlocks.push(dtd);
        }
      }
    }
  }
  
  Encode() {
    let newRaw = new Uint8Array(128);

    // Encode all data blocks
    let dataBlockBytes: Uint8Array[] = [];
    let totalDataBlockSize = 0;
    for (let db of this.DataBlocks) {
      let encoded = db.Encode();
      dataBlockBytes.push(encoded);
      totalDataBlockSize += encoded.length;
    }

    // Set DTD start offset
    this.Header.dtdStartByte = 4 + totalDataBlockSize;

    // Write header (4 bytes)
    let headerBytes = this.Header.Encode();
    newRaw.set(headerBytes, 0);

    // Write data blocks
    let offset = 4;
    for (let dbBytes of dataBlockBytes) {
      newRaw.set(dbBytes, offset);
      offset += dbBytes.length;
    }

    // Write DTDs (18 bytes each)
    offset = this.Header.dtdStartByte;
    for (let dtd of this.DetailedTimingBlocks) {
      if (offset + 18 > 127) {
        console.warn("CEA block overflow: skipping remaining DTDs");
        break;
      }
      let dtdBytes = dtd.Encode();
      newRaw.set(dtdBytes.slice(0, 18), offset);
      offset += 18;
    }

    this.raw = newRaw;
    this.raw[127] = calcEDIDChecksum(this.raw);
    return this.raw;
  }
}

class CEAHeader {
  raw = new Uint8Array();
  Version = 1;
  dtdStartByte = 0;

  Underscan = false;
  BasicAudio = false;
  YCBCR444 = false;
  YCBCR422 = false;
  numNativeDTDs = 0;

  Decode(bytes: Uint8Array) {
    this.Version = bytes[1];
    this.dtdStartByte = bytes[2];
    if (this.Version > 1) {
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
    rawHeader[1] = this.Version;
    rawHeader[2] = this.dtdStartByte;
    if (this.Version > 1) {
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
  VSDB: number = VSDBTag.Uninitialized;
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
  kind: string;
  Header: DataBlockHeader;
  Decode(dbBytes: Uint8Array): CEADataBlock;
  Encode(): Uint8Array;
}

export class VIC {
  VIC: number = 0;
  Name: string = "";
  Description: string = "";
  PixelMHz: number = 0;
  HorizontalActive: number = 0;
  VerticalActive: number = 0;
  Native: boolean = false;
}

export class VideoDataBlock implements CEADataBlock {
  kind = 'video' as const;
  Header = new DataBlockHeader();
  VICs: VIC[] = [];
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "Video Data Block";
  }
  Decode(dbBytes: Uint8Array): VideoDataBlock {
    this.Header.Decode(dbBytes.slice(0, 1));
    for (let v = 1; v < this.Header.Size + 1; v++) {
      let vicId = dbBytes[v] & 0x7f;
      let entry = vicLookup[vicId - 1];
      let vic = new VIC();
      if (entry) {
        vic.VIC = entry.VIC;
        vic.Name = entry.Name;
        vic.Description = entry.Description;
        vic.PixelMHz = entry.PixelMHz;
        vic.HorizontalActive = entry.HorizontalActive;
        vic.VerticalActive = entry.VerticalActive;
      } else {
        vic.VIC = vicId;
        vic.Name = "Unknown";
        vic.Description = "";
      }
      vic.Native = (dbBytes[v] & 0x80) > 0 ? true : false;
      this.VICs.push(vic);
    }
    return this;
  }
  Encode(): Uint8Array {
    this.Header.Size = this.VICs.length;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    for (let i = 0; i < this.VICs.length; i++) {
      rawBlock[i + 1] = this.VICs[i].VIC | (this.VICs[i].Native ? 0x80 : 0x00);
    }
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

export class AudioDataBlock implements CEADataBlock {
  kind = 'audio' as const;
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
    this.Header.Size = 3;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    rawBlock[1] = ((this.AudioType & 0x0f) << 3) | ((this.Channels - 1) & 0x07);
    rawBlock[2] = 0;
    if (this.Sampling192) rawBlock[2] |= 0x40;
    if (this.Sampling176) rawBlock[2] |= 0x20;
    if (this.Sampling96) rawBlock[2] |= 0x10;
    if (this.Sampling88) rawBlock[2] |= 0x08;
    if (this.Sampling48) rawBlock[2] |= 0x04;
    if (this.Sampling44_1) rawBlock[2] |= 0x02;
    if (this.Sampling32) rawBlock[2] |= 0x01;
    rawBlock[3] = 0;
    if (this.BitDepth24) rawBlock[3] |= 0x04;
    if (this.BitDepth20) rawBlock[3] |= 0x02;
    if (this.BitDepth16) rawBlock[3] |= 0x01;
    return rawBlock;
  }
}

export class SpeakerAllocationDataBlock implements CEADataBlock {
  kind = 'speaker' as const;
  Header = new DataBlockHeader();
  // Speaker allocation
  FrontWide_LeftRight: boolean = false; // bit 7
  // Deprecated, was Rear left/right center (RLC/RRC)
  FrontCenter_LeftRight: boolean = false;
  BackCenter: boolean = false;
  Back_LeftRight: boolean = false;
  FrontCenter: boolean = false;
  LFEChannel: boolean = false;
  Front_LeftRight: boolean = false;

  // Speaker location
  // Deprecated, was Top side left/right (TpSiL/TpSiR) bit 7
  // Deprecated, was Side left/right (SiL/SiR)
  // Deprecated, was Top back center (TpBC)
  // Deprecated, was Low-frequency effects 2 (LFE2)
  Surround_LeftRight: boolean = false;
  TopFrontCenter: boolean = false;
  TopCenter: boolean = false;
  TopFront_LeftRight: boolean = false;

  // Bits 7-3	Reserved, 0
  // Bit 2	Deprecated, was Bottom front left/right (BtFL/BtFR)
  // Bit 1	Deprecated, was Bottom front center (BtFC)
  // Bit 0	Deprecated, was Top back left/right (TpBL/TpBR)
  
  constructor(header: DataBlockHeader) {
    this.Header = header;
    this.Header.Name = "Speaker Allocation Data Block";
  }
  Decode(dbBytes: Uint8Array): SpeakerAllocationDataBlock {
    this.FrontWide_LeftRight = dbBytes[1] & 0x80 ? true : false;
    this.FrontCenter_LeftRight = dbBytes[1] & 0x20 ? true : false;
    this.BackCenter = dbBytes[1] & 0x10 ? true : false;
    this.Back_LeftRight = dbBytes[1] & 0x08 ? true : false;
    this.FrontCenter = dbBytes[1] & 0x04 ? true : false;
    this.LFEChannel = dbBytes[1] & 0x02 ? true : false;
    this.Front_LeftRight = dbBytes[1] & 0x01 ? true : false;
    
    this.Surround_LeftRight = dbBytes[2] & 0x08 ? true : false;
    this.TopFrontCenter = dbBytes[2] & 0x04 ? true : false;
    this.TopCenter = dbBytes[2] & 0x02 ? true : false;
    this.TopFront_LeftRight = dbBytes[2] & 0x01 ? true : false;
    
    return this;
  }
  Encode(): Uint8Array {
    this.Header.Size = 3;
    let rawBlock = new Uint8Array(this.Header.Size + 1);
    rawBlock[0] = (this.Header.Type << 5) | (this.Header.Size & 0x1f);
    rawBlock[1] = 0;
    if (this.FrontWide_LeftRight) rawBlock[1] |= 0x80;
    if (this.FrontCenter_LeftRight) rawBlock[1] |= 0x20;
    if (this.BackCenter) rawBlock[1] |= 0x10;
    if (this.Back_LeftRight) rawBlock[1] |= 0x08;
    if (this.FrontCenter) rawBlock[1] |= 0x04;
    if (this.LFEChannel) rawBlock[1] |= 0x02;
    if (this.Front_LeftRight) rawBlock[1] |= 0x01;
    rawBlock[2] = 0;
    if (this.Surround_LeftRight) rawBlock[2] |= 0x08;
    if (this.TopFrontCenter) rawBlock[2] |= 0x04;
    if (this.TopCenter) rawBlock[2] |= 0x02;
    if (this.TopFront_LeftRight) rawBlock[2] |= 0x01;
    return rawBlock;
  }
}
