import pnpLookup from "./pnp.ts";
import {
  DecodeDTD,
  DecodeDisplayDescriptor,
  MakeDummyDescriptor,
} from "./18ByteDescriptors.js";

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
}

enum SignalLevelStandard {
  NotDefined = -1,
  V700_300_1000 = 0,
  V714_286_1000 = 0x20,
  V1000_400_1400 = 0x40,
  V700_000_700 = 0x60,
}

enum SignalLevelStandardString {
  NotDefined = "NotDefined",
  V700_300_1000 = "0.700 : 0.300 : 1.000 V p-p",
  V714_286_1000 = "0.714 : 0.286 : 1.000 V p-p",
  V1000_400_1400 = "1.000 : 0.400 : 1.400 V p-p",
  V700_000_700 = "0.700 : 0.000 : 0.700 V p-p",
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
  CompositeSyncSignalonGreenVideo: boolean
  SerrationsOnVSync: boolean;
  
  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Analog;
    this.SignalLevelStandard = mbyte & 0x60;
    this.VideoSetup = mbyte & 0x10 ? VideoSetup.BlankToBlack : VideoSetup.BlankLevel;
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
  ColourEncoding: VideoSignalInterface = { SignalInterface: SignalInterface.NotDefined };
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
}

export class EDID {
  raw: Uint8Array = new Uint8Array();
  Extension: number = 0;
  Version: number = 0;
  Revision: string = 0;
  SerialNumber: number = 0;
  ManufacturerID: string = "";
  WeekOfManufacture: number = 0;
  YearOfManufacture: number = 0;
  // Basic Display Parameters and Features
  VideoSignalInterface: VideoSignalInterface;
  HorizontalSizeCM: number = 0;
  VerticalSizeCM: number = 0;
  Gamma: number = 0;
  FeatureSupport: FeatureSupport;
  // 
  DisplayParameters = {};
  EstablishedTimings = {};
  StandardTimings = [];
  DisplayDescriptors = [];
  Errors = [];
  DummyIdentifiers: number = 0;
}



EDID.prototype.DecodeEDID = function (bytes: Uint8Array) {
  this.raw = bytes;
  // Manufacturer ID. This is a legacy Plug and Play ID assigned by UEFI forum
  this.ManufacturerID += String.fromCharCode(
    ((this.raw[8] & 0x7c) >> 2) + 0x40
  );
  this.ManufacturerID += String.fromCharCode(
    ((this.raw[8] & 0x03) << 3) + ((this.raw[9] & 0xe0) >> 5) + 0x40
  );
  this.ManufacturerID += String.fromCharCode((this.raw[9] & 0x1f) + 0x40);

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
  // byte 20
  // Bit 7 = 1	Digital input
  // Bits 6–4	Bit depth:
  // 000 = undefined
  // 001 = 6
  // 010 = 8
  // 011 = 10
  // 100 = 12
  // 101 = 14
  // 110 = 16 bits per color
  // 111 = reserved
  // Bits 3–0	Video interface:
  // 0000 = undefined
  // 0001 = DVI
  // 0010 = HDMIa
  // 0011 = HDMIb
  // 0100 = MDDI
  // 0101 = DisplayPort
  if (this.raw[20] & 0x80) {
    this.VideoSignalInterface = new DigitalVideoInput(this.raw[20]);
  } else {
    this.VideoSignalInterface = new AnalogVideoInput(this.raw[20]);
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
  this.FeatureSupport = new FeatureSupport(this.raw[24], this.VideoSignalInterface.SignalInterface);

  // Chromaticity coordinates.
  this.Chromaticity = {};
  this.Chromaticity.RedX =
    ((this.raw[27] << 2) | ((this.raw[25] >> 6) & 0x3)) / 1024;
  this.Chromaticity.RedY =
    ((this.raw[28] << 2) | ((this.raw[25] >> 4) & 0x3)) / 1024;
  this.Chromaticity.GreenX =
    ((this.raw[29] << 2) | ((this.raw[25] >> 2) & 0x3)) / 1024;
  this.Chromaticity.GreenY =
    ((this.raw[30] << 2) | (this.raw[25] & 0x3)) / 1024;
  this.Chromaticity.BlueX =
    ((this.raw[31] << 2) | ((this.raw[26] >> 6) & 0x3)) / 1024;
  this.Chromaticity.BlueY =
    ((this.raw[32] << 2) | ((this.raw[26] >> 4) & 0x3)) / 1024;
  this.Chromaticity.WhiteX =
    ((this.raw[33] << 2) | ((this.raw[26] >> 2) & 0x3)) / 1024;
  this.Chromaticity.WhiteY =
    ((this.raw[34] << 2) | (this.raw[26] & 0x3)) / 1024;

  // Established timing bitmap. Supported bitmap for (formerly) very common timing modes.
  var etBytes = this.raw.slice(35, 38); // Get 3 ET bytes
  this.EstablishedTimings.ET720_400_70 = etBytes[0] & 0x80 ? true : false;
  this.EstablishedTimings.ET720_400_88 = etBytes[0] & 0x40 ? true : false;
  this.EstablishedTimings.ET640_480_60 = etBytes[0] & 0x20 ? true : false;
  this.EstablishedTimings.ET640_480_67 = etBytes[0] & 0x10 ? true : false;
  this.EstablishedTimings.ET640_480_72 = etBytes[0] & 0x08 ? true : false;
  this.EstablishedTimings.ET640_480_75 = etBytes[0] & 0x04 ? true : false;
  this.EstablishedTimings.ET800_600_56 = etBytes[0] & 0x02 ? true : false;
  this.EstablishedTimings.ET800_600_60 = etBytes[0] & 0x01 ? true : false;

  this.EstablishedTimings.ET800_600_72 = etBytes[1] & 0x80 ? true : false;
  this.EstablishedTimings.ET800_600_75 = etBytes[1] & 0x40 ? true : false;
  this.EstablishedTimings.ET832_624_75 = etBytes[1] & 0x20 ? true : false;
  this.EstablishedTimings.ET1024_768_87 = etBytes[1] & 0x10 ? true : false;
  this.EstablishedTimings.ET1024_768_60 = etBytes[1] & 0x08 ? true : false;
  this.EstablishedTimings.ET1024_768_70 = etBytes[1] & 0x04 ? true : false;
  this.EstablishedTimings.ET1024_768_75 = etBytes[1] & 0x02 ? true : false;
  this.EstablishedTimings.ET1280_1024_75 = etBytes[1] & 0x01 ? true : false;

  this.EstablishedTimings.ET1152_870_75 = etBytes[2] & 0x80 ? true : false;

  // Standard timing information
  let stdTimingCount = 0;
  for (let i = 38; i < 54; i += 2) {
    // Unused fields are filled with 01 01
    stdTimingCount++;
    let stdTiming = {
      id: stdTimingCount,
      Enabled: false,
    };
    if ((this.raw[i] === 0x1) & (this.raw[i + 1] === 0x1)) {
      stdTiming.Enabled = false;
    } else {
      stdTiming.Enabled = true;
    }
    let aspect = "";
    switch (this.raw[i + 1] >> 6) {
      case 0:
        aspect = "16:10";
        break;
      case 1:
        aspect = "4:3";
        break;
      case 2:
        aspect = "5:4";
        break;
      case 3:
        aspect = "16:9";
        break;
      default:
        break;
    }
    stdTiming.HorizontalActive = (this.raw[i] + 31) * 8;
    stdTiming.AspectRatio = aspect;
    stdTiming.RefreshRate = (this.raw[i + 1] & 0x3f) + 60;
    this.StandardTimings.push(stdTiming);
  }
  // Detailed timing descriptors
  let preferredTiming = true;
  for (let i = 54; i < 126; i += 18) {
    // if first 2 bytes / pixel clock is 0 then parse as Display Descriptor
    // first descriptor has to be DTD Preferred timing
    let descriptorBytes = this.raw.slice(i, i + 18);
    // if (preferredTiming) {
    //     this.PreferredTimingMode = DecodeDTD(descriptorBytes)
    //     preferredTiming = false
    //     continue
    // }

    let descHeader = (descriptorBytes[1] << 8) | descriptorBytes[0];
    if (descHeader != 0) {
      let dtd = DecodeDTD(descriptorBytes);
      this.DisplayDescriptors.push(dtd);
    } else {
      let dd = DecodeDisplayDescriptor(descriptorBytes);
      // catch non identified descriptors
      if (dd === null) {
        break;
      }
      this.DisplayDescriptors.push(dd);
    }
  }
  if (this.DisplayDescriptors.length < 4) {
    // Each of the four data blocks shall contain a detailed timing descriptor, a display descriptor or a dummy descriptor (Tag 10h)
    // using definitions described in Sections 3.10.2 and 3.10.3. Use of a data fill pattern is not permitted -
    // the Dummy Descriptor (Tag 10h) is the only exception."
    this.Errors.push("too few Display Descriptiors, should always be 4");
  }
};

EDID.prototype.GetPNPCompanyName = function () {
  let obj = pnpLookup.find((o) => o.ID === this.ManufacturerID);
  if (obj) {
    return obj.Company;
  } else {
    return "Unknown";
  }
};

EDID.prototype.SetManufactureDate = function () {
  if (this.WeekOfManufacture > 52) {
    this.raw[16] = 52;
  } else if (this.WeekOfManufacture < 0) {
    this.raw[16] = 52;
  } else {
    this.raw[16] = this.WeekOfManufacture;
  }
  this.raw[16] = this.WeekOfManufacture;
  if (this.YearOfManufacture >= 1990) {
    this.raw[17] = this.YearOfManufacture - 1990;
  } else {
    this.raw[17] = 0;
  }
};

EDID.prototype.SetEDIDVersion = function () {
  this.raw[18] = this.Version;
  this.raw[19] = parseInt(this.Revision);
};

EDID.prototype.SetFeatureSupport = function () {
  // Supported features DPMS
  this.raw[24] = 0;
  this.raw[24] |= this.DPMSstandby ? 0x80 : 0;
  this.raw[24] |= this.DPMSsuspend ? 0x40 : 0;
  this.raw[24] |= this.DPMSactiveOff ? 0x20 : 0;
  if (this.VideoSignalInterface.SignalInterface === SignalInterface.Digital) {
    if (this.ColourEncoding.YUV444) {
      this.raw[24] |= 0x8;
    }
    if (this.ColourEncoding.YUV422) {
      this.raw[24] |= 0x10;
    }
  }
  this.raw[24] |= this.SRGB ? 0x4 : 0;
  // Preferred timing must be 1 in v1.3
  // 1, revision 4, setting bit 1 (at address 18h) to 1 indicates
  // that the preferred timing mode includes the native pixel format
  // and the preferred refresh rate of the display device.
  this.raw[24] |= this.PreferredTiming ? 0x2 : 0;
  // TODO: clean up the continious vs gtf logic
  this.raw[24] |= this.ContiniousFrequency ? 0x1 : 0;
  this.raw[24] |= this.GTFSupport ? 0x1 : 0;
};

EDID.prototype.SetSize = function () {
  // Screen Size
  this.raw[21] = this.HorizontalSizeCM & 0xff;
  this.raw[22] = this.VerticalSizeCM & 0xff;
};

EDID.prototype.SetGamma = function () {
  // Gamma
  if (this.Gamma >= 1.0 && this.Gamma <= 3.54) {
    this.raw[23] = this.Gamma * 100 - 100;
  }
};

EDID.prototype.SetVideoInputParameters = function () {
  // Catch not implemented analog EDID
  if (this.VideoSignalInterface.SignalInterface != SignalInterface.Digital) {
    return;
  }
  // Reset byte with digital
  this.raw[20] = 0x80;
  let digInt = this.VideoSignalInterface as DigitalVideoInput;
  switch (digInt.BitDepth) {
    case "6":
      this.raw[20] |= 16;
      break;
    case "8":
      this.raw[20] |= 32;
      break;
    case "10":
      this.raw[20] |= 48;
      break;
    case "12":
      this.raw[20] |= 64;
      break;
    case "16":
      this.raw[20] |= 96;
      break;
    case "reserved":
      this.raw[20] |= 112;
      break;
    default:
      // If undefined do not set value = zero
      break;
  }
  switch (this.VideoInputDefinition.Interface) {
    case "HDMIa":
      this.raw[20] |= 2;
      break;
    case "HDMIb":
      this.raw[20] |= 3;
      break;
    case "MDDI":
      this.raw[20] |= 4;
      break;
    case "DisplayPort":
      this.raw[20] |= 5;
      break;
    default:
      // If undefined do not set value = zero
      break;
  }
};

EDID.prototype.SetSerialNumber = function () {
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
};

EDID.prototype.SetEstablishedTimings = function () {
  this.raw[35] = 0;
  this.raw[35] |= this.EstablishedTimings.ET720_400_70 ? 0x80 : 0;
  this.raw[35] |= this.EstablishedTimings.ET720_400_88 ? 0x40 : 0;
  this.raw[35] |= this.EstablishedTimings.ET640_480_60 ? 0x20 : 0;
  this.raw[35] |= this.EstablishedTimings.ET640_480_67 ? 0x10 : 0;
  this.raw[35] |= this.EstablishedTimings.ET640_480_72 ? 0x08 : 0;
  this.raw[35] |= this.EstablishedTimings.ET640_480_75 ? 0x04 : 0;
  this.raw[35] |= this.EstablishedTimings.ET800_600_56 ? 0x02 : 0;
  this.raw[35] |= this.EstablishedTimings.ET800_600_60 ? 0x01 : 0;

  this.raw[36] = 0;
  this.raw[36] |= this.EstablishedTimings.ET800_600_72 ? 0x80 : 0;
  this.raw[36] |= this.EstablishedTimings.ET800_600_75 ? 0x40 : 0;
  this.raw[36] |= this.EstablishedTimings.ET832_624_75 ? 0x20 : 0;
  this.raw[36] |= this.EstablishedTimings.ET1024_768_87 ? 0x10 : 0;
  this.raw[36] |= this.EstablishedTimings.ET1024_768_60 ? 0x08 : 0;
  this.raw[36] |= this.EstablishedTimings.ET1024_768_70 ? 0x04 : 0;
  this.raw[36] |= this.EstablishedTimings.ET1024_768_75 ? 0x02 : 0;
  this.raw[36] |= this.EstablishedTimings.ET1280_1024_75 ? 0x01 : 0;

  this.raw[37] = 0;
  this.raw[37] |= this.EstablishedTimings.ET1152_870_75 ? 0x80 : 0;
};

EDID.prototype.LayoutDisplayDescriptors = function () {
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
};

EDID.prototype.SetManufacturerID = function () {
  // reset bytes
  this.raw[8] = 0;
  this.raw[9] = 0;
  // ASCII to bytes
  var bytes = [];
  bytes.push(this.ManufacturerID.charCodeAt(0));
  bytes.push(this.ManufacturerID.charCodeAt(1));
  bytes.push(this.ManufacturerID.charCodeAt(2));
  // Compressed ascii = -0x40
  this.raw[8] |= (bytes[0] - 0x40) << 2;
  this.raw[8] |= (bytes[1] - 0x40) >> 3;
  this.raw[9] |= (bytes[1] - 0x40) << 5;
  this.raw[9] |= bytes[2] - 0x40;
};

EDID.prototype.CalcChecksum = function () {
  let checksum = 0;
  for (let i = 0; i < 127; i++) {
    checksum += this.raw[i];
  }
  this.raw[127] = 256 - (checksum % 256);
};
