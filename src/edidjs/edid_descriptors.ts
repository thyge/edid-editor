import { DetailedTimingDescriptor } from "./DetailedTimingDescriptor";

export enum DescriptorType {
  DetailedTimingDescriptor = -2,
  not_set = -1,
  DisplayProductSerialNumber = 0xff,
  AlphanumericDataString = 0xfe,
  DisplayRangeLimits = 0xfd,
  DisplayProductName = 0xfc,
  ColorPointData = 0xfb,
  StandardTimingIdentification = 0xfa,
  DisplayColorManagement = 0xf9,
  CVT3ByteCodes = 0xf8,
  EstablishedTimingsIII = 0xf7,
  Dummy = 0x10,
}

export interface DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  Decode(bytes: Uint8Array): DisplayDescriptorInterface;
  Encode(): Uint8Array;
}

class ASCIIDescriptor implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  text: string = "";
  constructor() {
    this.raw = new Uint8Array();
    this.Type = DescriptorType.not_set;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    // If byte 0, 1 and 2 are 0 then this is DTD
    for (let d = 5; d < 19; d++) {
      this.text += String.fromCharCode(bytes[d]);
    }
    this.text = this.text.split("\n")[0];
    this.text = this.text.trim();
    return this;
  }
  Encode(): Uint8Array {
    this.raw[3] = this.Type;
    for (let d = 5; d < 19; d++) {
      this.raw[d] = 0;
    }
    for (let d = 0; d < this.text.length; d++) {
      if (d > 14) {
        break;
      }
      this.raw[d + 5] = this.text.charCodeAt(d);
    }
    this.raw[this.text.length + 5] = "\n".charCodeAt(0);
    return this.raw;
  }
}

class DisplayProductSerialNumber extends ASCIIDescriptor {
  constructor() {
    super();
    this.Type = DescriptorType.DisplayProductSerialNumber;
  }
}
class AlphanumericDataString extends ASCIIDescriptor {
  constructor() {
    super();
    this.Type = DescriptorType.AlphanumericDataString;
  }
}
class DisplayProductName extends ASCIIDescriptor {
  constructor() {
    super();
    this.Type = DescriptorType.DisplayProductName;
  }
}

class DisplayRangeLimits implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  MinVerticalRateOffset: boolean;
  MaxVerticalRateOffset: boolean;
  MinHorizontalRateOffset: boolean;
  MaxHorizontalRateOffset: boolean;
  MinimumVerticalRate: number;
  MaximumVerticalRate: number;
  MinimumHorizontalRate: number;
  MaximumHorizontalRate: number;
  MaximumPixelClock: number;
  VideoTimingSupportMode: string;
  DefaultGTF: boolean;
  RangeLimitsOnly: boolean;
  SecondaryGTF: boolean;
  CVTSupported: boolean;
  constructor() {
    this.raw = new Uint8Array();
    this.Type = DescriptorType.DisplayRangeLimits;
    this.MinVerticalRateOffset = false;
    this.MaxVerticalRateOffset = false;
    this.MinHorizontalRateOffset = false;
    this.MaxHorizontalRateOffset = false;
    this.MinimumVerticalRate = 0;
    this.MaximumVerticalRate = 0;
    this.MinimumHorizontalRate = 0;
    this.MaximumHorizontalRate = 0;
    this.MaximumPixelClock = 0;
    this.VideoTimingSupportMode = "";
    this.DefaultGTF = false;
    this.RangeLimitsOnly = false;
    this.SecondaryGTF = false;
    this.CVTSupported = false;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    this.MinVerticalRateOffset = bytes[4] & 0x01 ? true : false;
    this.MaxVerticalRateOffset = bytes[4] & 0x02 ? true : false;
    this.MinHorizontalRateOffset = bytes[4] & 0x04 ? true : false;
    this.MaxHorizontalRateOffset = bytes[4] & 0x08 ? true : false;
    // Vertical Minimum
    if (this.MinVerticalRateOffset && this.MaxVerticalRateOffset) {
      this.MinimumVerticalRate = bytes[5] + 256;
    } else {
      this.MinimumVerticalRate = bytes[5] + 1;
    }
    // Vertical Maximum
    if (this.MaxVerticalRateOffset) {
      this.MaximumVerticalRate = bytes[6] + 256;
    } else {
      this.MaximumVerticalRate = bytes[6] + 1;
    }
    // Horizontal Minimum
    if (this.MinHorizontalRateOffset && this.MaxHorizontalRateOffset) {
      this.MinimumHorizontalRate = bytes[7] + 256;
    } else {
      this.MinimumHorizontalRate = bytes[7] + 1;
    }
    // Horizontal Maximum
    if (this.MaxHorizontalRateOffset) {
      this.MaximumHorizontalRate = bytes[8] + 256;
    } else {
      this.MaximumHorizontalRate = bytes[8] + 1;
    }
    // Maximum Pixel Clock
    this.MaximumPixelClock = bytes[9] * 10;

    // Video Timing Support Flags: Bytes 10 → 17 indicate support for additional video timings.
    switch (bytes[10] & 0x7) {
      case 0:
        this.VideoTimingSupportMode = "DefaultGTF";
        break;
      case 1:
        this.VideoTimingSupportMode = "RangeLimitsOnly";
        break;
      case 2:
        this.VideoTimingSupportMode = "SecondaryGTF";
        break;
      case 4:
        this.VideoTimingSupportMode = "CVTSupported";
        break;
      default:
        break;
    }
    switch (bytes[10] & 0x7) {
      case 0x00:
        this.DefaultGTF = true;
        break;
      case 0x01:
        this.RangeLimitsOnly = true;
        break;
      case 0x02:
        this.SecondaryGTF = true;
        break;
      case 0x04:
        this.CVTSupported = true;
        break;
    }

    // DefaultGTF and RangeLimitsOnly
    // 11 = 0x0A
    // 12-17 = 0x20

    // SecondaryGTF Depricated in EDID 1.4

    // CVTSupported
    // Needs to be tested and impl
    // Table 3.28 – Display Range Limits & CVT Support Definition
    if (this.VideoTimingSupportMode === "CVTSupported") {
      // Additional Pixel Clock Precision:
      // Max. Pix Clk = [(Byte 9) × 10] – [(Byte 12: bits 7 → 2) × 0.25MHz]
      console.log(this.MaximumPixelClock);
      let pixAdjustment = bytes[10] & (0xfc >> 2);
      pixAdjustment = pixAdjustment * 0.25;
    }
    return this;
  }
  Encode(): Uint8Array {
    return this.raw;
  }
}

class ColorPoint implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  RedX: number;
  RedY: number;
  GreenX: number;
  GreenY: number;
  BlueX: number;
  BlueY: number;
  WhiteX: number;
  WhiteY: number;
  Gamma: number;
  constructor() {
    this.raw = new Uint8Array();
    this.Type = DescriptorType.ColorPointData;
    this.RedX = 0;
    this.RedY = 0;
    this.GreenX = 0;
    this.GreenY = 0;
    this.BlueX = 0;
    this.BlueY = 0;
    this.WhiteX = 0;
    this.WhiteY = 0;
    this.Gamma = 0;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    this.RedX = bytes[4] + 1;
    this.RedY = bytes[5] + 1;
    this.GreenX = bytes[6] + 1;
    this.GreenY = bytes[7] + 1;
    this.BlueX = bytes[8] + 1;
    this.BlueY = bytes[9] + 1;
    this.WhiteX = bytes[10] + 1;
    this.WhiteY = bytes[11] + 1;
    this.Gamma = (bytes[12] + 100) / 100;
    return this;
  }
  Encode(): Uint8Array {
    return this.raw;
  }
}

class DummyDesciptor implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  constructor() {
    this.raw = new Uint8Array();
    this.Type = DescriptorType.Dummy;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    return this;
  }
  Encode(): Uint8Array {
    return this.raw;
  }
}

export function DecodeDesciptor(
  bytes: Uint8Array
): DisplayDescriptorInterface | null {
  // console.log(bytes);
  // Check if 18 bytes is display desciprtor
  switch (bytes[3]) {
    case DescriptorType.DisplayProductSerialNumber:
      return new DisplayProductSerialNumber().Decode(bytes);
    case DescriptorType.AlphanumericDataString:
      return new AlphanumericDataString().Decode(bytes);
    case DescriptorType.DisplayRangeLimits:
      return new DisplayRangeLimits().Decode(bytes);
    case DescriptorType.DisplayProductName:
      return new DisplayProductName().Decode(bytes);
    case DescriptorType.ColorPointData:
      return new ColorPoint().Decode(bytes);
    case DescriptorType.StandardTimingIdentification:
      return null;
    case DescriptorType.DisplayColorManagement:
      return null;
    case DescriptorType.CVT3ByteCodes:
      return null;
    case DescriptorType.EstablishedTimingsIII:
      return null;
    case DescriptorType.Dummy:
      return new DummyDesciptor().Decode(bytes);
    default:
      return null;
  }
}
