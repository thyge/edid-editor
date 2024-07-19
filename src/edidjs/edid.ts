import pnpLookup from "./pnp.ts";
import {
  DecodeDTD,
  DecodeDisplayDescriptor,
  MakeDummyDescriptor,
} from "./18ByteDescriptors.js";

export class VideoInputDefinition {
  VideoSignalInterface: string;
  BitDepth: string;
  Interface: string;
  SignalLevelStandard: string;
  VideoSetup: string;
  SeparateSyncHVSignals: boolean;
  CompositeSyncSignalonHorizontal: boolean;
  CompositeSyncSignalonGreenVideo: boolean
  Serrations: string;
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
  VideoInputDefinition: VideoInputDefinition = {};
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
    this.VideoInputDefinition.VideoSignalInterface = "Digital";
  } else {
    this.VideoInputDefinition.VideoSignalInterface = "Analog";
  }

  // EDID 1.4
  if (this.VideoInputDefinition.VideoSignalInterface === "Digital") {
    switch (this.raw[20] & 0x70) {
      case 0:
        this.VideoInputDefinition.BitDepth = "undefined";
        break;
      case 16:
        this.VideoInputDefinition.BitDepth = "6";
        break;
      case 32:
        this.VideoInputDefinition.BitDepth = "8";
        break;
      case 48:
        this.VideoInputDefinition.BitDepth = "10";
        break;
      case 64:
        this.VideoInputDefinition.BitDepth = "12";
        break;
      case 96:
        this.VideoInputDefinition.BitDepth = "16";
        break;
      case 112:
        this.VideoInputDefinition.BitDepth = "reserved";
        break;
      default:
        this.Errors.push("EDID.VideoBitDepth set incorrectly in EDID\n");
    }
    // EDID 1.4
    switch (this.raw[20] & 0x7) {
      case 0:
        this.VideoInputDefinition.Interface = "undefined";
        break;
      case 1:
        this.VideoInputDefinition.Interface = "DVI";
        break;
      case 2:
        this.VideoInputDefinition.Interface = "HDMIa";
        break;
      case 3:
        this.VideoInputDefinition.Interface = "HDMIb";
        break;
      case 4:
        this.VideoInputDefinition.Interface = "MDDI";
        break;
      case 5:
        this.VideoInputDefinition.Interface = "DisplayPort";
        break;
      default:
        this.Errors.push("EDID.VideoInterface set incorrectly in EDID\n");
    }
  } else {
    switch (this.raw[20] & 0x60) {
      case 0:
        this.VideoInputDefinition.SignalLevelStandard = "0.700 : 0.300 : 1.000 V p-p";
        break;
      case 0x20:
        this.VideoInputDefinition.SignalLevelStandard = "0.714 : 0.286 : 1.000 V p-p";
        break;
      case 0x40:
        this.VideoInputDefinition.SignalLevelStandard = "1.000 : 0.400 : 1.400 V p-p";
        break;
      case 0x60:
        this.VideoInputDefinition.SignalLevelStandard = "0.700 : 0.000 : 0.700 V p-p";
        break;
      default:
        this.Errors.push("EDID.VideoBitDepth set incorrectly in EDID\n");
    }
    switch (this.raw[20] & 0x10) {
        case 0:
          this.VideoInputDefinition.VideoSetup = "Video Setup: Blank Level = Black Level";
          break;
        case 0x10:
          this.VideoInputDefinition.VideoSetup = "Video Setup: Blank-to-Black setup or pedestal";
          break;
        default:
          this.Errors.push("EDID.VideoBitDepth set incorrectly in EDID\n");
      }
      if (this.raw[20] & 0x8) {
        this.VideoInputDefinition.SeparateSyncHVSignals = false
      } else {
        this.VideoInputDefinition.SeparateSyncHVSignals = true
      }
      if (this.raw[20] & 0x4) {
        this.VideoInputDefinition.CompositeSyncSignalonHorizontal = false
      } else {
        this.VideoInputDefinition.CompositeSyncSignalonHorizontal = true
      }
      if (this.raw[20] & 0x2) {
        this.VideoInputDefinition.CompositeSyncSignalonGreenVideo = false
      } else {
        this.VideoInputDefinition.CompositeSyncSignalonGreenVideo = true
      }
  }

  // Horizontal screen size
  // Vertical screen size
  this.HorizontalSizeCM = this.raw[21];
  this.VerticalSizeCM = this.raw[22];

  // EDID 1.4 H & V Screen Size and Aspect Ratio
  // TODO

  // Display gamma
  if (this.raw[22] === 0xff) {
    console.log("gamma is defined by DI-EXT block.");
  }
  this.Gamma = this.raw[23] / 100 + 1;

  // DPMS
  this.DPMSstandby = this.raw[24] & 0x80 ? true : false;
  this.DPMSsuspend = this.raw[24] & 0x40 ? true : false;
  this.DPMSactiveOff = this.raw[24] & 0x20 ? true : false;
  // EDID 1.4 Supported features
  if (this.VideoInputDefinition.VideoSignalInterface === "Digital") {
    // 00 = RGB 4:4:4
    // 01 = RGB 4:4:4 + YCrCb 4:4:4
    // 10 = RGB 4:4:4 + YCrCb 4:2:2
    // 11 = RGB 4:4:4 + YCrCb 4:4:4 + YCrCb 4:2:2
    this.ColourEncoding = {
      RGB444: false,
      YUV444: false,
      YUV422: false,
    };
    switch (this.raw[24] & 0x18) {
      case 0:
        this.ColourEncoding.RGB444 = true;
        break;
      case 8:
        this.ColourEncoding.RGB444 = true;
        this.ColourEncoding.YUV444 = true;
        break;
      case 16:
        this.ColourEncoding.RGB444 = true;
        this.ColourEncoding.YUV422 = true;
        break;
      case 24:
        this.ColourEncoding.RGB444 = true;
        this.ColourEncoding.YUV444 = true;
        this.ColourEncoding.YUV422 = true;
        break;
    }
  }

  this.SRGB = (this.raw[24] & 0x4) > 0 ? true : false;
  this.PreferredTiming = (this.raw[24] & 0x2) > 0 ? true : false;
  if (this.Revision === 3) {
    if (this.PreferredTiming != true) {
      this.Errors.push(
        "Table 3.14 note 4, bit 1 (at address 18h) shall be set to 1 (0 is invalid)"
      );
    }
  }
  // Continious frequency or GTF
  // For EDID version 1, revision 3, bit 0 (at address 18h) indicated support for or no support for GTF (using the default GTF parameter values).
  // For EDID version 1, revision 4, bit 0 (at address 18h) has been redefined to indicate
  // Continuous Frequency Display (set bit 0 to 1) or Non-Continuous Frequency (Multi-Mode) Display (set bit 0 to 0).
  // If bit 0 is set to 1, then the display will accept GTF or CVT generated timings (from a source)
  // that are within the display’s range limits.
  if (this.Revision > 3) {
    // EDID 1.4
    this.ContiniousFrequency = this.raw[24] & (0x1 > 0) ? true : false;
  } else {
    this.GTFSupport = this.raw[24] & (0x1 > 0) ? true : false;
  }

  // TODO:
  // Bit 2	Standard sRGB colour space. Bytes 25–34 must contain sRGB standard values.
  // EDID 1.4 Bit 1	Preferred timing mode specified in descriptor block 1. For EDID 1.3+ the preferred timing mode is always in the first Detailed Timing Descriptor. In that case, this bit specifies whether the preferred timing mode includes native pixel format and refresh rate.
  // EDID 1.4 Bit 0	Continuous timings with GTF or CVT

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
  this.raw[19] = this.Revision;
};

EDID.prototype.SetFeatureSupport = function () {
  // Supported features DPMS
  this.raw[24] = 0;
  this.raw[24] |= this.DPMSstandby ? 0x80 : 0;
  this.raw[24] |= this.DPMSsuspend ? 0x40 : 0;
  this.raw[24] |= this.DPMSactiveOff ? 0x20 : 0;
  if (this.VideoInputDefinition.VideoSignalInterface === "Digital") {
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
  if (this.VideoInputDefinition.Mode != "Digital") {
    return;
  }
  // Reset byte with digital
  this.raw[20] = 0x80;
  switch (this.VideoBitDepth) {
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
  switch (this.VideoInterface) {
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
