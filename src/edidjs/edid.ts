import pnpLookup from "./pnp.ts";
import { DetailedTimingDescriptor } from "./DetailedTimingDescriptor.ts";
import { DecodeDesciptor } from "./edid_descriptors.ts";
import { DisplayDescriptorInterface } from "./edid_descriptors.ts";

interface VideoSignalInterface {
  SignalInterface: SignalInterface;
}

enum SignalInterface {
  NotDefined = "NotDefined",
  Digital = "Digital",
  Analog = "Analog",
}

enum VideoInterface {
  Undefined = "undefined",
  DVI = "DVI",
  HDMIa = "HDMIa",
  HDMIb = "HDMIb",
  MDDI = "MDDI",
  DisplayPort = "DisplayPort",
}

enum BitDepth {
  Undefined = "undefined",
  Six = "6",
  Eight = "8",
  Ten = "10",
  Twelve = "12",
  Sixteen = "16",
}

class DigitalVideoInput implements VideoSignalInterface {
  SignalInterface: SignalInterface;

  BitDepth: BitDepth;
  Interface: VideoInterface;
  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Digital;
    switch ((mbyte & 0x70) >> 4) {
      case 0:
        this.BitDepth = BitDepth.Undefined;
        break;
      case 1:
        this.BitDepth = BitDepth.Six;
        break;
      case 2:
        this.BitDepth = BitDepth.Eight;
        break;
      case 3:
        this.BitDepth = BitDepth.Ten;
        break;
      case 4:
        this.BitDepth = BitDepth.Twelve;
        break;
      case 6:
        this.BitDepth = BitDepth.Sixteen;
        break;
      default:
        this.BitDepth = BitDepth.Undefined;
        break;
    }
    switch (mbyte & 0x7) {
      case 1:
        this.Interface = VideoInterface.DVI;
        break;
      case 2:
        this.Interface = VideoInterface.HDMIa;
        break;
      case 3:
        this.Interface = VideoInterface.HDMIb;
        break;
      case 4:
        this.Interface = VideoInterface.MDDI;
        break;
      case 5:
        this.Interface = VideoInterface.DisplayPort;
        break;
      default:
        this.Interface = VideoInterface.Undefined;
        break;
    }
  }
  Encode(): number {
    let mbyte = 0x80;
    switch (this.BitDepth) {
      case BitDepth.Six:
        mbyte |= 16;
        break;
      case BitDepth.Eight:
        mbyte |= 32;
        break;
      case BitDepth.Ten:
        mbyte |= 48;
        break;
      case BitDepth.Twelve:
        mbyte |= 64;
        break;
      case BitDepth.Sixteen:
        mbyte |= 96;
        break;
      default:
        break;
    }
    switch (this.Interface) {
      case VideoInterface.DVI:
        mbyte |= 1;
        break;
      case VideoInterface.HDMIa:
        mbyte |= 2;
        break;
      case VideoInterface.HDMIb:
        mbyte |= 3;
        break;
      case VideoInterface.MDDI:
        mbyte |= 4;
        break;
      case VideoInterface.DisplayPort:
        mbyte |= 5;
        break;
      default:
        break;
    }
    return mbyte;
  }
}

enum SignalLevelStandard {
  NotDefined = -1,
  V700_300_1000 = 0,
  V714_286_1000 = 0x20,
  V1000_400_1400 = 0x40,
  V700_000_700 = 0x60,
}

enum VideoSetup {
  BlankLevel = "Blank Level = Black Level",
  BlankToBlack = "Blank-to-Black setup or pedestal",
}

class AnalogVideoInput implements VideoSignalInterface {
  SignalInterface: SignalInterface;
  SignalLevelStandard: SignalLevelStandard;
  VideoSetup: VideoSetup;
  SeparateSyncHVSignals: boolean;
  CompositeSyncSignalonHorizontal: boolean;
  CompositeSyncSignalonGreenVideo: boolean;
  SerrationsOnVSync: boolean;

  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Analog;
    this.SignalLevelStandard = mbyte & 0x60;
    this.VideoSetup =
      mbyte & 0x10 ? VideoSetup.BlankToBlack : VideoSetup.BlankLevel;
    this.SeparateSyncHVSignals = mbyte & 0x8 ? false : true;
    this.CompositeSyncSignalonHorizontal = mbyte & 0x4 ? false : true;
    this.CompositeSyncSignalonGreenVideo = mbyte & 0x2 ? false : true;
    this.SerrationsOnVSync = mbyte & 0x1 ? true : false;
  }
}

class DigitalColourEncoding implements VideoSignalInterface {
  SignalInterface: SignalInterface;
  RGB444: boolean;
  YUV444: boolean;
  YUV422: boolean;
  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Digital;
    this.RGB444 = mbyte & 0x8 ? true : false;
    this.YUV444 = mbyte & 0x10 ? true : false;
    this.YUV422 = mbyte & 0x20 ? true : false;
  }
  Encode(): number {
    let mbyte = 0;
    mbyte |= this.RGB444 ? 0x8 : 0;
    mbyte |= this.YUV444 ? 0x10 : 0;
    mbyte |= this.YUV422 ? 0x20 : 0;
    return mbyte;
  }
}

enum AnalogDisplayColorType {
  Monochrome = 0,
  RGB = 1,
  NonRGB = 2,
  Undefined = 3,
}

class AnalogueColourEncoding implements VideoSignalInterface {
  SignalInterface: SignalInterface;
  AnalogColour: AnalogDisplayColorType;
  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Analog;
    this.AnalogColour = mbyte & 0x3;
  }
}

class FeatureSupport {
  DPMSstandby: boolean = false;
  DPMSsuspend: boolean = false;
  DPMSactiveOff: boolean = false;
  ColourEncoding: VideoSignalInterface = {
    SignalInterface: SignalInterface.NotDefined,
  };
  sRGB: boolean = false;
  PreferredTiming: boolean = false;
  GTFSupport: boolean = false; // 1.3
  ContiniousFrequency: boolean = false; // 1.4

  constructor(mbyte: number, digital_analog: SignalInterface) {
    this.DPMSstandby = mbyte & 0x80 ? true : false;
    this.DPMSsuspend = mbyte & 0x40 ? true : false;
    this.DPMSactiveOff = mbyte & 0x20 ? true : false;
    switch (digital_analog) {
      case SignalInterface.Digital:
        this.ColourEncoding = new DigitalColourEncoding(mbyte);
        break;
      case SignalInterface.Analog:
        this.ColourEncoding = new AnalogueColourEncoding(mbyte);
        break;
    }
    this.sRGB = mbyte & 0x4 ? true : false;
    this.PreferredTiming = mbyte & 0x2 ? true : false;
    this.GTFSupport = mbyte & 0x1 ? true : false;
    this.ContiniousFrequency = mbyte & 0x1 ? true : false;
  }
  Encode(): number {
    let mbyte = 0;
    mbyte |= this.DPMSstandby ? 0x80 : 0;
    mbyte |= this.DPMSsuspend ? 0x40 : 0;
    mbyte |= this.DPMSactiveOff ? 0x20 : 0;
    mbyte |= this.ColourEncoding.Encode();
    mbyte |= this.sRGB ? 0x4 : 0;
    mbyte |= this.PreferredTiming ? 0x2 : 0;
    mbyte |= this.ContiniousFrequency ? 0x1 : 0;
    return mbyte;
  }
}

class Chromaticity {
  raw: Uint8Array;
  RedX: number;
  RedY: number;
  GreenX: number;
  GreenY: number;
  BlueX: number;
  BlueY: number;
  WhiteX: number;
  WhiteY: number;
  constructor(bytes: Uint8Array) {
    this.raw = bytes;
    this.RedX = ((bytes[2] << 2) | ((bytes[0] >> 6) & 0x3)) / 1024;
    this.RedY = ((bytes[3] << 2) | ((bytes[0] >> 4) & 0x3)) / 1024;
    this.GreenX = ((bytes[4] << 2) | ((bytes[0] >> 2) & 0x3)) / 1024;
    this.GreenY = ((bytes[5] << 2) | (bytes[0] & 0x3)) / 1024;
    this.BlueX = ((bytes[6] << 2) | ((bytes[1] >> 6) & 0x3)) / 1024;
    this.BlueY = ((bytes[7] << 2) | ((bytes[1] >> 4) & 0x3)) / 1024;
    this.WhiteX = ((bytes[8] << 2) | ((bytes[1] >> 2) & 0x3)) / 1024;
    this.WhiteY = ((bytes[9] << 2) | (bytes[1] & 0x3)) / 1024;
  }
  Encode(): Uint8Array {
    const bytes = new Uint8Array(10);
    bytes[0] =
      (((this.RedX * 1024) & 0x3) << 6) |
      (((this.RedY * 1024) & 0x3) << 4) |
      (((this.GreenX * 1024) & 0x3) << 2) |
      ((this.GreenY * 1024) & 0x3);
    bytes[1] =
      (((this.BlueX * 1024) & 0x3) << 6) |
      (((this.BlueY * 1024) & 0x3) << 4) |
      (((this.WhiteX * 1024) & 0x3) << 2) |
      ((this.WhiteY * 1024) & 0x3);
    bytes[2] = (this.RedX * 1024) >> 2;
    bytes[3] = (this.RedY * 1024) >> 2;
    bytes[4] = (this.GreenX * 1024) >> 2;
    bytes[5] = (this.GreenY * 1024) >> 2;
    bytes[6] = (this.BlueX * 1024) >> 2;
    bytes[7] = (this.BlueY * 1024) >> 2;
    bytes[8] = (this.WhiteX * 1024) >> 2;
    bytes[9] = (this.WhiteY * 1024) >> 2;
    return bytes;
  }
}

class EstablishedTimings {
  ET720_400_70: boolean;
  ET720_400_88: boolean;
  ET640_480_60: boolean;
  ET640_480_67: boolean;
  ET640_480_72: boolean;
  ET640_480_75: boolean;
  ET800_600_56: boolean;
  ET800_600_60: boolean;
  ET800_600_72: boolean;
  ET800_600_75: boolean;
  ET832_624_75: boolean;
  ET1024_768_87: boolean;
  ET1024_768_60: boolean;
  ET1024_768_70: boolean;
  ET1024_768_75: boolean;
  ET1280_1024_75: boolean;
  ET1152_870_75: boolean;

  constructor(etBytes: Uint8Array) {
    this.ET720_400_70 = etBytes[0] & 0x80 ? true : false;
    this.ET720_400_88 = etBytes[0] & 0x40 ? true : false;
    this.ET640_480_60 = etBytes[0] & 0x20 ? true : false;
    this.ET640_480_67 = etBytes[0] & 0x10 ? true : false;
    this.ET640_480_72 = etBytes[0] & 0x08 ? true : false;
    this.ET640_480_75 = etBytes[0] & 0x04 ? true : false;
    this.ET800_600_56 = etBytes[0] & 0x02 ? true : false;
    this.ET800_600_60 = etBytes[0] & 0x01 ? true : false;

    this.ET800_600_72 = etBytes[1] & 0x80 ? true : false;
    this.ET800_600_75 = etBytes[1] & 0x40 ? true : false;
    this.ET832_624_75 = etBytes[1] & 0x20 ? true : false;
    this.ET1024_768_87 = etBytes[1] & 0x10 ? true : false;
    this.ET1024_768_60 = etBytes[1] & 0x08 ? true : false;
    this.ET1024_768_70 = etBytes[1] & 0x04 ? true : false;
    this.ET1024_768_75 = etBytes[1] & 0x02 ? true : false;
    this.ET1280_1024_75 = etBytes[1] & 0x01 ? true : false;

    this.ET1152_870_75 = etBytes[2] & 0x80 ? true : false;
  }
  Encode(): Uint8Array {
    let etBytes = new Uint8Array(3);
    etBytes[0] = 0;
    etBytes[0] |= this.ET720_400_70 ? 0x80 : 0;
    etBytes[0] |= this.ET720_400_88 ? 0x40 : 0;
    etBytes[0] |= this.ET640_480_60 ? 0x20 : 0;
    etBytes[0] |= this.ET640_480_67 ? 0x10 : 0;
    etBytes[0] |= this.ET640_480_72 ? 0x08 : 0;
    etBytes[0] |= this.ET640_480_75 ? 0x04 : 0;
    etBytes[0] |= this.ET800_600_56 ? 0x02 : 0;
    etBytes[0] |= this.ET800_600_60 ? 0x01 : 0;

    etBytes[1] = 0;
    etBytes[1] |= this.ET800_600_72 ? 0x80 : 0;
    etBytes[1] |= this.ET800_600_75 ? 0x40 : 0;
    etBytes[1] |= this.ET832_624_75 ? 0x20 : 0;
    etBytes[1] |= this.ET1024_768_87 ? 0x10 : 0;
    etBytes[1] |= this.ET1024_768_60 ? 0x08 : 0;
    etBytes[1] |= this.ET1024_768_70 ? 0x04 : 0;
    etBytes[1] |= this.ET1024_768_75 ? 0x02 : 0;
    etBytes[1] |= this.ET1280_1024_75 ? 0x01 : 0;

    etBytes[2] = 0;
    etBytes[2] |= this.ET1152_870_75 ? 0x80 : 0;
    return etBytes;
  }
}

export class ManufacturerID {
  ID: string = "";
  Decode(bytes: Uint8Array): ManufacturerID {
    this.ID = String.fromCharCode(((bytes[0] & 0x7c) >> 2) + 0x40);
    this.ID += String.fromCharCode(
      ((bytes[0] & 0x03) << 3) + ((bytes[1] & 0xe0) >> 5) + 0x40
    );
    this.ID += String.fromCharCode((bytes[1] & 0x1f) + 0x40);
    return this;
  }

  Encode(): Uint8Array {
    // reset bytes
    let raw = new Uint8Array(2);
    // ASCII to bytes
    var bytes = [];
    bytes.push(this.ID.charCodeAt(0));
    bytes.push(this.ID.charCodeAt(1));
    bytes.push(this.ID.charCodeAt(2));
    // Compressed ascii = -0x40
    raw[0] |= (bytes[0] - 0x40) << 2;
    raw[0] |= (bytes[1] - 0x40) >> 3;
    raw[1] |= (bytes[1] - 0x40) << 5;
    raw[1] |= bytes[2] - 0x40;
    return raw;
  }

  GetPNPCompanyName(): string {
    let obj = pnpLookup.find((o) => o.ID === this.ID);
    if (obj) {
      return obj.Company;
    } else {
      return "Unknown";
    }
  }
}

enum AspectRatio {
  SixteenTen = "16:10",
  FourThree = "4:3",
  FiveFour = "5:4",
  SixteenNine = "16:9",
}

class StandardTiming {
  id: number;
  Enabled: boolean;
  HorizontalActive: number;
  AspectRatio: AspectRatio;
  RefreshRate: number;

  Decode(bytes: Uint8Array): StandardTiming {
    this.Enabled = false;
    if (bytes[0] === 0x1 && bytes[1] === 0x1) {
      this.Enabled = false;
    } else {
      this.Enabled = true;
    }
    switch (bytes[1] >> 6) {
      case 0:
        this.AspectRatio = AspectRatio.SixteenTen;
        break;
      case 1:
        this.AspectRatio = AspectRatio.FourThree;
        break;
      case 2:
        this.AspectRatio = AspectRatio.FiveFour;
        break;
      case 3:
        this.AspectRatio = AspectRatio.SixteenNine;
        break;
      default:
        break;
    }
    this.HorizontalActive = (bytes[0] + 31) * 8;
    this.RefreshRate = (bytes[1] & 0x3f) + 60;
    return this;
  }
  Encode(): Uint8Array {
    let bytes = new Uint8Array(2);
    if (this.Enabled) {
      bytes[0] = this.HorizontalActive / 8 - 31;
      bytes[1] = (this.RefreshRate - 60) & 0x3f;
      switch (this.AspectRatio) {
        case AspectRatio.SixteenTen:
          bytes[1] |= 0 << 6;
          break;
        case AspectRatio.FourThree:
          bytes[1] |= 1 << 6;
          break;
        case AspectRatio.FiveFour:
          bytes[1] |= 2 << 6;
          break;
        case AspectRatio.SixteenNine:
          bytes[1] |= 3 << 6;
          break;
        default:
          break;
      }
    } else {
      bytes[0] = 1;
      bytes[1] = 1;
    }
    return bytes;
  }
}

export class EDID {
  raw: Uint8Array = new Uint8Array();
  Extension: number = 0;
  Version: number = 0;
  Revision: string = "";
  SerialNumber: number = 0;
  ManufacturerID: ManufacturerID;
  ManufacturerPC: number = 0;
  WeekOfManufacture: number = 0;
  YearOfManufacture: number = 0;
  // Basic Display Parameters and Features
  VideoInputDefinition: VideoSignalInterface;
  HorizontalSizeCM: number = 0;
  VerticalSizeCM: number = 0;
  Gamma: number = 0;
  FeatureSupport: FeatureSupport;
  //
  Chromaticity: Chromaticity;
  EstablishedTimings: EstablishedTimings;
  StandardTimings: Array<StandardTiming> = [];
  PreferredTimingMode: DetailedTimingDescriptor;
  DisplayDescriptors = Array<DisplayDescriptorInterface>();
  Errors = [];
  DummyIdentifiers: number = 0;

  Decode(bytes: Uint8Array) {
    this.raw = bytes;
    // Manufacturer ID. This is a legacy Plug and Play ID assigned by UEFI forum
    this.ManufacturerID = new ManufacturerID().Decode(this.raw.slice(8, 10));

    // Manufacturer product code.
    this.ManufacturerPC = (this.raw[11] << 8) | this.raw[10];

    // Serial number
    this.SerialNumber = this.raw[12];
    this.SerialNumber |= this.raw[13] << 8;
    this.SerialNumber |= this.raw[14] << 16;
    this.SerialNumber |= this.raw[15] << 24;

    // Week of manufacture
    this.WeekOfManufacture = this.raw[16];
    // Year of manufacture
    this.YearOfManufacture = this.raw[17] + 1990;
    // Version
    this.Version = this.raw[18];
    // Revision
    this.Revision = this.raw[19].toString(); // needs to be toString because of v-model issues

    // Basic display parameters
    if (this.raw[20] & 0x80) {
      this.VideoInputDefinition = new DigitalVideoInput(this.raw[20]);
    } else {
      this.VideoInputDefinition = new AnalogVideoInput(this.raw[20]);
    }
    // Horizontal screen size
    // Vertical screen size
    // EDID 1.4 H & V Screen Size and Aspect Ratio
    this.HorizontalSizeCM = this.raw[21];
    this.VerticalSizeCM = this.raw[22];
    // Display gamma
    if (this.raw[22] === 0xff) {
      console.log("gamma is defined by DI-EXT block.");
    }
    this.Gamma = this.raw[23] / 100 + 1;
    // DPMS
    this.FeatureSupport = new FeatureSupport(
      this.raw[24],
      this.VideoInputDefinition.SignalInterface
    );

    // Chromaticity coordinates.
    this.Chromaticity = new Chromaticity(this.raw.slice(25, 35));

    // Established timing bitmap. Supported bitmap for (formerly) very common timing modes.
    this.EstablishedTimings = new EstablishedTimings(this.raw.slice(35, 38));

    // Standard timing information
    for (let i = 38; i < 54; i += 2) {
      // Unused fields are filled with 01 01
      let stdTiming = new StandardTiming();
      stdTiming.Decode(this.raw.slice(i, i + 2));
      this.StandardTimings.push(stdTiming);
    }
    // Detailed timing descriptors
    // Preferred Timing Mode (PTM)
    // + 3 Descriptors
    // If Descriptor decode
    // if DTD decode
    for (let i = 54; i < 126; i += 18) {
      // if first 2 bytes / pixel clock is 0 then parse as Display Descriptor
      // first descriptor has to be DTD Preferred timing
      let descriptorBytes = this.raw.slice(i, i + 18);
      if (
        descriptorBytes[0] === 0 &&
        descriptorBytes[1] === 0 &&
        descriptorBytes[2] === 0
      ) {
        let mDesc = DecodeDesciptor(descriptorBytes);
        this.DisplayDescriptors.push(mDesc);
      } else {
        let dtd = new DetailedTimingDescriptor();
        dtd.Decode(descriptorBytes);
        this.DisplayDescriptors.push(dtd);
      }

      // console.log(mDesc);
      // // if (preferredTiming) {
      // //     this.PreferredTimingMode = DecodeDTD(descriptorBytes)
      // //     preferredTiming = false
      // //     continue
      // // }

      // let descHeader = (descriptorBytes[1] << 8) | descriptorBytes[0];
      // if (descHeader != 0) {
      //   let dtd = DecodeDTD(descriptorBytes);
      //   this.DisplayDescriptors.push(dtd);
      // } else {
      //   let dd = DecodeDisplayDescriptor(descriptorBytes);
      //   // catch non identified descriptors
      //   if (dd === null) {
      //     break;
      //   }
      //   this.DisplayDescriptors.push(dd);
      // }
    }
    console.log(this.DisplayDescriptors);
    if (this.DisplayDescriptors.length < 4) {
      // Each of the four data blocks shall contain a detailed timing descriptor, a display descriptor or a dummy descriptor (Tag 10h)
      // using definitions described in Sections 3.10.2 and 3.10.3. Use of a data fill pattern is not permitted -
      // the Dummy Descriptor (Tag 10h) is the only exception."
      this.Errors.push("too few Display Descriptiors, should always be 4");
    }
  }

  Encode(): Uint8Array {
    console.log("Encoding EDID");
    // Header
    // Manufacturer ID
    let mid_bytes = this.ManufacturerID.Encode();
    this.raw[8] = mid_bytes[0];
    this.raw[9] = mid_bytes[1];
    // ID Product Code
    this.raw[10] = this.ManufacturerPC & 0xff;
    this.raw[11] = (this.ManufacturerPC >> 8) & 0xff;
    // ID Serial Number
    if (this.SerialNumber <= 4294967295 && this.SerialNumber >= 0) {
      this.raw[12] = this.SerialNumber & 0xff;
      this.raw[13] = (this.SerialNumber >> 8) & 0xff;
      this.raw[14] = (this.SerialNumber >> 16) & 0xff;
      this.raw[15] = (this.SerialNumber >> 24) & 0xff;
    } else {
      this.raw[12] = 0;
      this.raw[13] = 0;
      this.raw[14] = 0;
      this.raw[15] = 0;
    }

    // Week of Manufacture
    if (this.WeekOfManufacture > 52) {
      this.raw[16] = 52;
    } else if (this.WeekOfManufacture < 0) {
      this.raw[16] = 52;
    } else {
      this.raw[16] = this.WeekOfManufacture;
    }
    // Year of Manufacture or Model Year
    this.raw[16] = this.WeekOfManufacture;
    if (this.YearOfManufacture >= 1990) {
      this.raw[17] = this.YearOfManufacture - 1990;
    } else {
      this.raw[17] = 0;
    }
    // EDID Version
    this.raw[18] = this.Version;
    // EDID Revision
    this.raw[19] = parseInt(this.Revision);
    // Video Input Definition
    this.raw[20] = this.VideoInputDefinition.Encode();
    // Horizontal Screen Size or Aspect Ratio
    this.raw[21] = this.HorizontalSizeCM & 0xff;
    // Vertical Screen Size or Aspect Ratio
    this.raw[22] = this.VerticalSizeCM & 0xff;
    // Display Gamma
    if (this.Gamma >= 1.0 && this.Gamma <= 3.54) {
      this.raw[23] = this.Gamma * 100 - 100;
    }
    // Features Support
    this.raw[24] = this.FeatureSupport.Encode();
    // Chromaticity
    let chromaticity = this.Chromaticity.Encode();
    for (let i = 0; i < 9; i++) {
      this.raw[25 + i] = chromaticity[i];
    }
    // Established Timings
    let etBytes = this.EstablishedTimings.Encode();
    this.raw[35] = etBytes[0];
    this.raw[36] = etBytes[1];
    this.raw[37] = etBytes[2];
    // Standard Timings
    for (let i = 0; i < 8; i++) {
      let stdTiming = this.StandardTimings[i].Encode();
      this.raw[38 + i * 2] = stdTiming[0];
      this.raw[39 + i * 2] = stdTiming[1];
      console.log(this.StandardTimings[i]);
    }
    // Display Descriptors

    // Checksum
    this.CalcChecksum();
    return this.raw;
  }

  LayoutDisplayDescriptors() {
    // store the first byte where dd starts
    let startByte = 54;

    // add dummy if less than 4 descriptors are present
    let dummy = MakeDummyDescriptor();
    if (this.DisplayDescriptors.length < 4) {
      this.DisplayDescriptors.push(dummy);
    }

    // Add each descriptor back into raw edid
    this.DisplayDescriptors.forEach((dd) => {
      // Encode structure to raw field
      dd.Encode();
      for (let index = 0; index < 18; index++) {
        this.raw[startByte] = dd.raw[index];
        startByte++;
      }
    });
  }

  CalcChecksum() {
    let checksum = 0;
    for (let i = 0; i < 127; i++) {
      checksum += this.raw[i];
    }
    this.raw[127] = 256 - (checksum % 256);
  }
}
