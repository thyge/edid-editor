import { DetailedTimingDescriptor } from "./DetailedTimingDescriptor";
import { AspectRatio } from "./edid";

const DescriptorDisplayProductSerialNumber = 0xff;
const DescriptorAlphanumericDataString = 0xfe;
const DescriptorDisplayRangeLimits = 0xfd;
const DescriptorDisplayProductName = 0xfc;
const DescriptorColorPointData = 0xfb;
const DescriptorStandardTimingIdentification = 0xfa;
const DescriptorDisplayColorManagement = 0xf9;
const DescriptorCVT3ByteCodes = 0xf8;
const DescriptorEstablishedTimingsIII = 0xf7;
const DescriptorDummy = 0x10;

export enum DescriptorType {
  DetailedTimingDescriptor = "Detailed Timing Descriptor",
  not_set = "not_set",
  DisplayProductSerialNumber = "Display Product Serial Number",
  AlphanumericDataString = "Alphanumeric Data String",
  DisplayRangeLimits = "Display Range Limits",
  DisplayProductName = "Display ProductName",
  ColorPointData = "Color Point Data",
  StandardTimingIdentification = "Standard Timing Identification",
  DisplayColorManagement = "Display Color Management",
  CVT3ByteCodes = "CVT 3 Byte Codes",
  EstablishedTimingsIII = "Established Timings III",
  Dummy = "Dummy",
}

export function DescriptorTypeToValue(type: DescriptorType): number {
  switch (type) {
    case DescriptorType.DisplayProductSerialNumber:
      return DescriptorDisplayProductSerialNumber;
    case DescriptorType.AlphanumericDataString:
      return DescriptorAlphanumericDataString;
    case DescriptorType.DisplayRangeLimits:
      return DescriptorDisplayRangeLimits;
    case DescriptorType.DisplayProductName:
      return DescriptorDisplayProductName;
    case DescriptorType.ColorPointData:
      return DescriptorColorPointData;
    case DescriptorType.StandardTimingIdentification:
      return DescriptorStandardTimingIdentification;
    case DescriptorType.DisplayColorManagement:
      return DescriptorDisplayColorManagement;
    case DescriptorType.CVT3ByteCodes:
      return DescriptorCVT3ByteCodes;
    case DescriptorType.EstablishedTimingsIII:
      return DescriptorEstablishedTimingsIII;
    case DescriptorType.Dummy:
      return DescriptorDummy;
    default:
      return -1;
  }
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
    this.raw = new Uint8Array(18);
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
    this.raw[3] = DescriptorTypeToValue(this.Type);
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
    for (let d = this.text.length + 6; d < 19; d++) {
      this.raw[d] = 0x20;
    }
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
export class DisplayProductName extends ASCIIDescriptor {
  constructor() {
    super();
    this.Type = DescriptorType.DisplayProductName;
  }
}

enum VideoTimingSupportFlags {
  not_set = "",
  DefaultGTF = "DefaultGTF",
  RangeLimitsOnly = "RangeLimitsOnly",
  SecondaryGTF = "SecondaryGTF",
  CVTSupported = "CVTSupported",
}

class CVTSupportDefinition {
  CVTStandardVersionNumber: number = 0;
  PrecisionPixelClock: number = 0;
  MaximumActivePixels: number = 0;
  SupportedAspectRatios: Array<AspectRatio> = [];
  PreferredAspectRatio: AspectRatio = AspectRatio.SixteenNine;
  CVTStandardBlanking: boolean = false;
  CVTReducedBlanking: boolean = false;
  HorizontalShrink: boolean = false;
  HirozontalStretch: boolean = false;
  VerticalShrink: boolean = false;
  VerticalStretch: boolean = false;
  PreferredVerticalRefreshRate: number = 0;

  Decode(bytes: Uint8Array): CVTSupportDefinition {
    let pixClockPrecision = (bytes[12] & 0x03) * 0.25;
    this.PrecisionPixelClock = bytes[9] * 10 - pixClockPrecision;
    // 8 × [Byte 13 + (256 × (Byte 12: bits 1, 0))]
    let msb = (bytes[12] & 0x03) << 8;
    this.MaximumActivePixels = bytes[13] + msb;
    // Aspect Ratios
    if (bytes[14] & 0x80) {
      this.SupportedAspectRatios.push(AspectRatio.FourThree);
    }
    if (bytes[14] & 0x40) {
      this.SupportedAspectRatios.push(AspectRatio.SixteenNine);
    }
    if (bytes[14] & 0x20) {
      this.SupportedAspectRatios.push(AspectRatio.SixteenTen);
    }
    if (bytes[14] & 0x10) {
      this.SupportedAspectRatios.push(AspectRatio.FiveFour);
    }
    if (bytes[14] & 0x08) {
      this.SupportedAspectRatios.push(AspectRatio.FifteenNine);
    }
    switch (bytes[15] & 0xe0) {
      case 0x00:
        this.PreferredAspectRatio = AspectRatio.FourThree;
        break;
      case 0x20:
        this.PreferredAspectRatio = AspectRatio.SixteenNine;
        break;
      case 0x40:
        this.PreferredAspectRatio = AspectRatio.SixteenTen;
        break;
      case 0x60:
        this.PreferredAspectRatio = AspectRatio.FiveFour;
        break;
      case 0x80:
        this.PreferredAspectRatio = AspectRatio.FifteenNine;
        break;
    }
    this.CVTReducedBlanking = bytes[15] & 0x10 ? true : false;
    this.CVTStandardBlanking = bytes[15] & 0x08 ? true : false;
    this.HorizontalShrink = bytes[16] & 0x80 ? true : false;
    this.HirozontalStretch = bytes[16] & 0x40 ? true : false;
    this.VerticalShrink = bytes[16] & 0x20 ? true : false;
    this.VerticalStretch = bytes[16] & 0x10 ? true : false;
    this.PreferredVerticalRefreshRate = bytes[17];
    return this;
  }
  Encode(): Uint8Array {
    let cvtBytes = new Uint8Array();
    return cvtBytes;
  }
}

class DisplayRangeLimits implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  MinimumVerticalRate: number = 0;
  MaximumVerticalRate: number = 0;
  MinimumHorizontalRate: number = 0;
  MaximumHorizontalRate: number = 0;
  MaximumPixelClockMHz: number = 0;
  VideoTimingSupport: VideoTimingSupportFlags = VideoTimingSupportFlags.not_set;
  CVTSupportDefinition: CVTSupportDefinition = new CVTSupportDefinition();
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.DisplayRangeLimits;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    let MinVerticalRateOffset = bytes[4] & 0x01 ? true : false;
    let MaxVerticalRateOffset = bytes[4] & 0x02 ? true : false;
    let MinHorizontalRateOffset = bytes[4] & 0x04 ? true : false;
    let MaxHorizontalRateOffset = bytes[4] & 0x08 ? true : false;
    // Vertical Minimum
    if (MinVerticalRateOffset && MaxVerticalRateOffset) {
      this.MinimumVerticalRate = bytes[5] + 256;
    } else {
      this.MinimumVerticalRate = bytes[5] + 1;
    }
    // Vertical Maximum
    if (MaxVerticalRateOffset) {
      this.MaximumVerticalRate = bytes[6] + 256;
    } else {
      this.MaximumVerticalRate = bytes[6] + 1;
    }
    // Horizontal Minimum
    if (MinHorizontalRateOffset && MaxHorizontalRateOffset) {
      this.MinimumHorizontalRate = bytes[7] + 256;
    } else {
      this.MinimumHorizontalRate = bytes[7] + 1;
    }
    // Horizontal Maximum
    if (MaxHorizontalRateOffset) {
      this.MaximumHorizontalRate = bytes[8] + 256;
    } else {
      this.MaximumHorizontalRate = bytes[8] + 1;
    }
    // Maximum Pixel Clock
    this.MaximumPixelClockMHz = bytes[9] * 10;

    // Video Timing Support Flags: Bytes 10 → 17 indicate support for additional video timings.
    switch (bytes[10] & 0x7) {
      case 0x00:
        this.VideoTimingSupport = VideoTimingSupportFlags.DefaultGTF;
        break;
      case 0x01:
        this.VideoTimingSupport = VideoTimingSupportFlags.RangeLimitsOnly;
        break;
      case 0x02:
        this.VideoTimingSupport = VideoTimingSupportFlags.SecondaryGTF;
        break;
      case 0x04:
        this.VideoTimingSupport = VideoTimingSupportFlags.CVTSupported;
        break;
    }

    // DefaultGTF and RangeLimitsOnly
    // 11 = 0x0A
    // 12-17 = 0x20
    // SecondaryGTF Depricated in EDID 1.4
    if (this.VideoTimingSupport != VideoTimingSupportFlags.CVTSupported) {
      return this;
    }

    // CVTSupported
    this.CVTSupportDefinition = new CVTSupportDefinition().Decode(bytes);
    return this;
  }
  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    // Vertical Minimum
    if (this.MinimumVerticalRate > 255) {
      this.raw[4] = 0x01;
      this.raw[5] = this.MinimumVerticalRate - 256;
    } else {
      this.raw[5] = this.MinimumVerticalRate - 1;
    }
    // Vertical Maximum
    if (this.MaximumVerticalRate > 255) {
      this.raw[4] = this.raw[4] | 0x02;
      this.raw[6] = this.MaximumVerticalRate - 256;
    } else {
      this.raw[6] = this.MaximumVerticalRate - 1;
    }
    // Horizontal Minimum
    if (this.MinimumHorizontalRate > 255) {
      this.raw[4] = this.raw[4] | 0x04;
      this.raw[7] = this.MinimumHorizontalRate - 256;
    } else {
      this.raw[7] = this.MinimumHorizontalRate - 1;
    }
    // Horizontal Maximum
    if (this.MaximumHorizontalRate > 255) {
      this.raw[4] = this.raw[4] | 0x08;
      this.raw[8] = this.MaximumHorizontalRate - 256;
    } else {
      this.raw[8] = this.MaximumHorizontalRate - 1;
    }
    // Maximum Pixel Clock
    this.raw[9] = this.MaximumPixelClockMHz / 10;

    switch (this.VideoTimingSupport) {
      case VideoTimingSupportFlags.DefaultGTF:
        this.raw[10] = 0x00;
        break;
      case VideoTimingSupportFlags.RangeLimitsOnly:
        this.raw[10] = 0x01;
        break;
      case VideoTimingSupportFlags.SecondaryGTF:
        this.raw[10] = 0x02;
        break;
      case VideoTimingSupportFlags.CVTSupported:
        this.raw[10] = 0x04;
        break;
    }
    if (
      this.VideoTimingSupport === VideoTimingSupportFlags.DefaultGTF ||
      this.VideoTimingSupport === VideoTimingSupportFlags.RangeLimitsOnly
    ) {
      this.raw[11] = 0x0a;
      this.raw[12] = 0x20;
      this.raw[13] = 0x20;
      this.raw[14] = 0x20;
      this.raw[15] = 0x20;
      this.raw[16] = 0x20;
      this.raw[17] = 0x20;
    } else if (
      this.VideoTimingSupport === VideoTimingSupportFlags.CVTSupported
    ) {
      let cvtBytes = this.CVTSupportDefinition.Encode();
      console.log(cvtBytes);
    }
    return this.raw;
  }
}

class ColorPoint {
  WhitePointIndex: number = 0;
  WhiteX: number = 0;
  WhiteY: number = 0;
  WhiteGamma: number = 0;
  Decode(bytes: Uint8Array): ColorPoint {
    this.WhitePointIndex = bytes[0];
    this.WhiteX = (bytes[2] + (bytes[1] >> 4)) & 0x3;
    this.WhiteY = (bytes[3] + (bytes[1] >> 2)) & 0x3;
    this.WhiteGamma = bytes[4] / 100 + 1
    return this;
  }
  Encode(): Uint8Array {
    let colorBytes = new Uint8Array();
    return colorBytes;
  }
}

class ColorPointData implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  WhitePoints: Array<ColorPoint> = [];
  LineFeed: Number = 0
  constructor() {
    this.raw = new Uint8Array();
    this.Type = DescriptorType.ColorPointData;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    for (let index = 5; index < 15; index+=5) {
      let cpBytes = bytes.slice(index, index+5)
      this.WhitePoints.push((new ColorPoint).Decode(cpBytes))
    }
    this.LineFeed = bytes[15]
    return this;
  }
  Encode(): Uint8Array {
    return this.raw;
  }
}

export class DummyDesciptor implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.Dummy;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    return this;
  }
  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    return this.raw;
  }
}

export class StandardTimingIdentification
  implements DisplayDescriptorInterface
{
  raw: Uint8Array;
  Type: DescriptorType;
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.StandardTimingIdentification;
  }
  Decode(bytes: Uint8Array): StandardTimingIdentification {
    return this;
  }
  Encode(): Uint8Array {
    return this.raw;
  }
}

export class DisplayColorManagement implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.DisplayColorManagement;
  }
  Decode(bytes: Uint8Array): DisplayColorManagement {
    return this;
  }
  Encode(): Uint8Array {
    return this.raw;
  }
}

export class CVT3ByteCodes implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.CVT3ByteCodes;
  }
  Decode(bytes: Uint8Array): CVT3ByteCodes {
    return this;
  }
  Encode(): Uint8Array {
    return this.raw;
  }
}

export class EstablishedTimingsIII implements DisplayDescriptorInterface {
  raw: Uint8Array;
  Type: DescriptorType;
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.EstablishedTimingsIII;
  }
  Decode(bytes: Uint8Array): EstablishedTimingsIII {
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
    case DescriptorDisplayProductSerialNumber:
      return new DisplayProductSerialNumber().Decode(bytes);
    case DescriptorAlphanumericDataString:
      return new AlphanumericDataString().Decode(bytes);
    case DescriptorDisplayRangeLimits:
      return new DisplayRangeLimits().Decode(bytes);
    case DescriptorDisplayProductName:
      return new DisplayProductName().Decode(bytes);
    case DescriptorColorPointData:
      return new ColorPointData().Decode(bytes);
    case DescriptorStandardTimingIdentification:
      return new StandardTimingIdentification().Decode(bytes);
    case DescriptorDisplayColorManagement:
      return new DisplayColorManagement().Decode(bytes);
    case DescriptorCVT3ByteCodes:
      return new CVT3ByteCodes().Decode(bytes);
    case DescriptorEstablishedTimingsIII:
      return new EstablishedTimingsIII().Decode(bytes);
    case DescriptorDummy:
      return new DummyDesciptor().Decode(bytes);
    default:
      return null;
  }
}

export function CreateDesciptor(
  type: DescriptorType
): DisplayDescriptorInterface {
  switch (type) {
    case DescriptorType.DetailedTimingDescriptor:
      return new DetailedTimingDescriptor();
    case DescriptorType.DisplayProductSerialNumber:
      return new DisplayProductSerialNumber();
    case DescriptorType.AlphanumericDataString:
      return new AlphanumericDataString();
    case DescriptorType.DisplayRangeLimits:
      return new DisplayRangeLimits();
    case DescriptorType.DisplayProductName:
      return new DisplayProductName();
    case DescriptorType.ColorPointData:
      return new ColorPointData();
    case DescriptorType.StandardTimingIdentification:
      return new StandardTimingIdentification();
    case DescriptorType.DisplayColorManagement:
      return new DisplayColorManagement();
    case DescriptorType.CVT3ByteCodes:
      return new CVT3ByteCodes();
    case DescriptorType.EstablishedTimingsIII:
      return new EstablishedTimingsIII();
    case DescriptorType.Dummy:
      return new DummyDesciptor();
    default:
      return new DummyDesciptor();
  }
}
