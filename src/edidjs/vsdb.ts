import type { CEADataBlock, DataBlockHeader } from "./cea.ts";

export enum VSDBTag {
  Uninitialized = 0,
  IEEE_HDMI1_4 = 0x00 | (0x0c << 8) | (0x03 << 16),
  IEEE_HDMI2_0 = 0xc4 | (0x5d << 8) | (0xd8 << 16),
  IEEE_HDMIDolbyVision = 0x00 | (0xd0 << 8) | (0x46 << 16),
  IEEE_HDMIHDR10 = 0x90 | (0x84 << 8) | (0x8b << 16),
  IEEE_SpecializedMonitor = 0x5c | (0x12 << 8) | (0xca << 16),
  IEEE_NVIDIA = 0x00 | (0x04 << 8) | (0x4b << 16),
}

export class HDMI_1_4 implements CEADataBlock {
  Header: DataBlockHeader;
  Address: {
    A: number;
    B: number;
    C: number;
    D: number;
  } = { A: 0, B: 0, C: 0, D: 0 };
  BitDepth16: boolean = false;
  BitDepth12: boolean = false;
  BitDepth10: boolean = false;
  DeepColour444: boolean = false;
  DVIDualLinkOperation: boolean = false;
  Max_TMDS_Clock: number = 0;
  constructor(header: DataBlockHeader) {
    this.Header = header;
  }
  Decode(dbBytes: Uint8Array): HDMI_1_4 {
    this.Address.A = dbBytes[4] >> 4;
    this.Address.B = dbBytes[4] & 0xf;
    this.Address.C = dbBytes[5] >> 4;
    this.Address.D = dbBytes[5] & 0xf;
    if (dbBytes.length < 6) {
      return this;
    }
    this.BitDepth16 = dbBytes[6] & 0x40 ? true : false;
    this.BitDepth12 = dbBytes[6] & 0x20 ? true : false;
    this.BitDepth10 = dbBytes[6] & 0x10 ? true : false;
    this.DeepColour444 = dbBytes[6] & 0x08 ? true : false;
    this.DVIDualLinkOperation = dbBytes[6] & 0x01 ? true : false;
    this.Max_TMDS_Clock = dbBytes[7] * 5; //MHz
    return this;
  }
  Encode(): Uint8Array {
    throw new Error("Method not implemented.");
  }
}

enum HDMI2_0MaxFixedRateLink {
  FRL_NotSupported = 0,
  FRL_3G_3Lanes = 1,
  FRL_6G_3Lanes = 2,
  FRL_6G_4Lanes = 3,
  FRL_8G_4Lanes = 4,
  FRL_10G_4Lanes = 5,
  FRL_12G_4Lanes = 6,
}

export class HDMI_2_0 implements CEADataBlock {
  Header: DataBlockHeader;
  Max_TMDS_Frequency: number = 0;
  SCDC_Present: boolean = false;
  RR_Capable: boolean = false;
  CCBPCI: boolean = false;
  LTE_340Mcsc_scramble: boolean = false;
  Independent_View: boolean = false;
  Dual_View: boolean = false;
  OSD_3D_Disparity: boolean = false;
  DC_Y420_48bit: boolean = false;
  DC_Y420_36bit: boolean = false;
  DC_Y420_30bit: boolean = false;
  MaxFixedRateLink: HDMI2_0MaxFixedRateLink =
    HDMI2_0MaxFixedRateLink.FRL_NotSupported;

  constructor(header: DataBlockHeader) {
    this.Header = header;
  }
  Decode(dbBytes: Uint8Array): HDMI_2_0 {
    this.Max_TMDS_Frequency = dbBytes[5] * 5;
    this.SCDC_Present = dbBytes[6] & 0x80 ? true : false;
    this.RR_Capable = dbBytes[6] & 0x40 ? true : false;
    this.CCBPCI = dbBytes[6] & 0x10 ? true : false;
    this.LTE_340Mcsc_scramble = dbBytes[6] & 0x08 ? true : false;
    this.Independent_View = dbBytes[6] & 0x04 ? true : false;
    this.Dual_View = dbBytes[6] & 0x02 ? true : false;
    this.OSD_3D_Disparity = dbBytes[6] & 0x02 ? true : false;

    this.DC_Y420_48bit = dbBytes[7] & 0x04 ? true : false;
    this.DC_Y420_36bit = dbBytes[7] & 0x02 ? true : false;
    this.DC_Y420_30bit = dbBytes[7] & 0x01 ? true : false;

    if (dbBytes.length < 8) {
      return this;
    }
    this.MaxFixedRateLink = dbBytes[7] >> 4;
    return this;
  }
  Encode(): Uint8Array {
    throw new Error("Method not implemented.");
  }
}
