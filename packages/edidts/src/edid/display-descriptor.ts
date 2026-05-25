import { DetailedTimingDescriptor } from "../common/DetailedTimingDescriptor";
import { AspectRatio, StandardTiming } from "./standard-timing.ts";
import { readUint16LE } from "../common/utils.ts";

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

export const DescriptorType = {
  DetailedTimingDescriptor: "Detailed Timing Descriptor",
  not_set: "not_set",
  DisplayProductSerialNumber: "Display Product Serial Number",
  AlphanumericDataString: "Alphanumeric Data String",
  DisplayRangeLimits: "Display Range Limits",
  DisplayProductName: "Display ProductName",
  ColorPointData: "Color Point Data",
  StandardTimingIdentification: "Standard Timing Identification",
  DisplayColorManagement: "Display Color Management",
  CVT3ByteCodes: "CVT 3 Byte Codes",
  EstablishedTimingsIII: "Established Timings III",
  Dummy: "Dummy",
} as const;

export type DescriptorType = typeof DescriptorType[keyof typeof DescriptorType];

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
  kind: string;
  raw: Uint8Array;
  Type: DescriptorType;
  Decode(bytes: Uint8Array): DisplayDescriptorInterface | null;
  Encode(): Uint8Array;
}

class ASCIIDescriptor implements DisplayDescriptorInterface {
  kind: string = '';
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
      this.text += String.fromCharCode(bytes[d] ?? 0);
    }
    this.text = this.text.split("\n")[0] ?? "";
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

export class DisplayProductSerialNumber extends ASCIIDescriptor {
  kind = 'displayProductSerialNumber' as const;
  constructor() {
    super();
    this.Type = DescriptorType.DisplayProductSerialNumber;
  }
  static decode(bytes: Uint8Array): DisplayProductSerialNumber {
    return new DisplayProductSerialNumber().Decode(bytes) as DisplayProductSerialNumber;
  }
}
export class AlphanumericDataString extends ASCIIDescriptor {
  kind = 'alphanumericDataString' as const;
  constructor() {
    super();
    this.Type = DescriptorType.AlphanumericDataString;
  }
  static decode(bytes: Uint8Array): AlphanumericDataString {
    return new AlphanumericDataString().Decode(bytes) as AlphanumericDataString;
  }
}
export class DisplayProductName extends ASCIIDescriptor {
  kind = 'displayProductName' as const;
  constructor() {
    super();
    this.Type = DescriptorType.DisplayProductName;
  }
  static decode(bytes: Uint8Array): DisplayProductName {
    return new DisplayProductName().Decode(bytes) as DisplayProductName;
  }
}

const VideoTimingSupportFlags = {
  not_set: "",
  DefaultGTF: "DefaultGTF",
  RangeLimitsOnly: "RangeLimitsOnly",
  SecondaryGTF: "SecondaryGTF",
  CVTSupported: "CVTSupported",
} as const;

type VideoTimingSupportFlags = typeof VideoTimingSupportFlags[keyof typeof VideoTimingSupportFlags];

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

  static decode(bytes: Uint8Array): CVTSupportDefinition {
    return new CVTSupportDefinition().Decode(bytes) as CVTSupportDefinition;
  }

  Decode(bytes: Uint8Array): CVTSupportDefinition {
    let pixClockPrecision = ((bytes[12] ?? 0) & 0x03) * 0.25;
    this.PrecisionPixelClock = (bytes[9] ?? 0) * 10 - pixClockPrecision;
    // 8 × [Byte 13 + (256 × (Byte 12: bits 1, 0))]
    let msb = ((bytes[12] ?? 0) & 0x03) << 8;
    this.MaximumActivePixels = (bytes[13] ?? 0) + msb;
    // Aspect Ratios
    if ((bytes[14] ?? 0) & 0x80) {
      this.SupportedAspectRatios.push(AspectRatio.FourThree);
    }
    if ((bytes[14] ?? 0) & 0x40) {
      this.SupportedAspectRatios.push(AspectRatio.SixteenNine);
    }
    if ((bytes[14] ?? 0) & 0x20) {
      this.SupportedAspectRatios.push(AspectRatio.SixteenTen);
    }
    if ((bytes[14] ?? 0) & 0x10) {
      this.SupportedAspectRatios.push(AspectRatio.FiveFour);
    }
    if ((bytes[14] ?? 0) & 0x08) {
      this.SupportedAspectRatios.push(AspectRatio.FifteenNine);
    }
    switch ((bytes[15] ?? 0) & 0xe0) {
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
    this.CVTReducedBlanking = (bytes[15] ?? 0) & 0x10 ? true : false;
    this.CVTStandardBlanking = (bytes[15] ?? 0) & 0x08 ? true : false;
    this.HorizontalShrink = (bytes[16] ?? 0) & 0x80 ? true : false;
    this.HirozontalStretch = (bytes[16] ?? 0) & 0x40 ? true : false;
    this.VerticalShrink = (bytes[16] ?? 0) & 0x20 ? true : false;
    this.VerticalStretch = (bytes[16] ?? 0) & 0x10 ? true : false;
    this.PreferredVerticalRefreshRate = bytes[17] ?? 0;
    return this;
  }
  Encode(): Uint8Array {
    let bytes = new Uint8Array(18);
    // Byte 9 = Maximum Pixel Clock (in 10 MHz steps)
    // Byte 12 bits 1:0 = precision offset (0–3 × 0.25)
    // PrecisionPixelClock = byte9 × 10 − (lowBits × 0.25)
    // lowBits also serve as MSB of MaximumActivePixels
    let lowBits = (this.MaximumActivePixels >> 8) & 0x03;
    let byte9 = Math.round((this.PrecisionPixelClock + lowBits * 0.25) / 10);
    if (Math.abs(byte9 * 10 - lowBits * 0.25 - this.PrecisionPixelClock) > 0.125) {
      for (let test = 0; test <= 3; test++) {
        let testByte9 = Math.round((this.PrecisionPixelClock + test * 0.25) / 10);
        if (Math.abs(testByte9 * 10 - test * 0.25 - this.PrecisionPixelClock) <= 0.125) {
          lowBits = test;
          byte9 = testByte9;
          break;
        }
      }
    }
    bytes[9] = byte9;
    bytes[12] = lowBits;
    bytes[13] = this.MaximumActivePixels & 0xff;

    // Byte 14 – Supported Aspect Ratios
    if (this.SupportedAspectRatios.includes(AspectRatio.FourThree)) bytes[14] |= 0x80;
    if (this.SupportedAspectRatios.includes(AspectRatio.SixteenNine)) bytes[14] |= 0x40;
    if (this.SupportedAspectRatios.includes(AspectRatio.SixteenTen)) bytes[14] |= 0x20;
    if (this.SupportedAspectRatios.includes(AspectRatio.FiveFour)) bytes[14] |= 0x10;
    if (this.SupportedAspectRatios.includes(AspectRatio.FifteenNine)) bytes[14] |= 0x08;

    // Byte 15 – Preferred Aspect Ratio + blanking
    switch (this.PreferredAspectRatio) {
      case AspectRatio.FourThree:
        bytes[15] |= 0x00;
        break;
      case AspectRatio.SixteenNine:
        bytes[15] |= 0x20;
        break;
      case AspectRatio.SixteenTen:
        bytes[15] |= 0x40;
        break;
      case AspectRatio.FiveFour:
        bytes[15] |= 0x60;
        break;
      case AspectRatio.FifteenNine:
        bytes[15] |= 0x80;
        break;
    }
    if (this.CVTReducedBlanking) bytes[15] |= 0x10;
    if (this.CVTStandardBlanking) bytes[15] |= 0x08;

    // Byte 16 – stretch/shrink
    if (this.HorizontalShrink) bytes[16] |= 0x80;
    if (this.HirozontalStretch) bytes[16] |= 0x40;
    if (this.VerticalShrink) bytes[16] |= 0x20;
    if (this.VerticalStretch) bytes[16] |= 0x10;

    // Byte 17 – Preferred Vertical Refresh Rate
    bytes[17] = this.PreferredVerticalRefreshRate;

    return bytes;
  }
}

export class DisplayRangeLimits implements DisplayDescriptorInterface {
  kind = 'displayRangeLimits' as const;
  raw: Uint8Array;
  Type: DescriptorType;
  MinimumVerticalRate: number = 0;
  MaximumVerticalRate: number = 0;
  MinimumHorizontalRate: number = 0;
  MaximumHorizontalRate: number = 0;
  MaximumPixelClockMHz: number = 0;
  VideoTimingSupport: VideoTimingSupportFlags = VideoTimingSupportFlags.DefaultGTF;
  CVTSupportDefinition: CVTSupportDefinition = new CVTSupportDefinition();
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.DisplayRangeLimits;
  }
  static decode(bytes: Uint8Array): DisplayRangeLimits {
    return new DisplayRangeLimits().Decode(bytes) as DisplayRangeLimits;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    let MinVerticalRateOffset = (bytes[4] ?? 0) & 0x01 ? true : false;
    let MaxVerticalRateOffset = (bytes[4] ?? 0) & 0x02 ? true : false;
    let MinHorizontalRateOffset = (bytes[4] ?? 0) & 0x04 ? true : false;
    let MaxHorizontalRateOffset = (bytes[4] ?? 0) & 0x08 ? true : false;
    // Vertical Minimum
    if (MinVerticalRateOffset) {
      this.MinimumVerticalRate = (bytes[5] ?? 0) + 256;
    } else {
      this.MinimumVerticalRate = (bytes[5] ?? 0) + 1;
    }
    // Vertical Maximum
    if (MaxVerticalRateOffset) {
      this.MaximumVerticalRate = (bytes[6] ?? 0) + 256;
    } else {
      this.MaximumVerticalRate = (bytes[6] ?? 0) + 1;
    }
    // Horizontal Minimum
    if (MinHorizontalRateOffset) {
      this.MinimumHorizontalRate = (bytes[7] ?? 0) + 256;
    } else {
      this.MinimumHorizontalRate = (bytes[7] ?? 0) + 1;
    }
    // Horizontal Maximum
    if (MaxHorizontalRateOffset) {
      this.MaximumHorizontalRate = (bytes[8] ?? 0) + 256;
    } else {
      this.MaximumHorizontalRate = (bytes[8] ?? 0) + 1;
    }
    // Maximum Pixel Clock
    this.MaximumPixelClockMHz = (bytes[9] ?? 0) * 10;

    // Video Timing Support Flags: Bytes 10 → 17 indicate support for additional video timings.
    switch ((bytes[10] ?? 0) & 0x7) {
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
    this.CVTSupportDefinition = CVTSupportDefinition.decode(bytes);
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
      this.raw[4] = (this.raw[4] ?? 0) | 0x02;
      this.raw[6] = this.MaximumVerticalRate - 256;
    } else {
      this.raw[6] = this.MaximumVerticalRate - 1;
    }
    // Horizontal Minimum
    if (this.MinimumHorizontalRate > 255) {
      this.raw[4] = (this.raw[4] ?? 0) | 0x04;
      this.raw[7] = this.MinimumHorizontalRate - 256;
    } else {
      this.raw[7] = this.MinimumHorizontalRate - 1;
    }
    // Horizontal Maximum
    if (this.MaximumHorizontalRate > 255) {
      this.raw[4] = (this.raw[4] ?? 0) | 0x08;
      this.raw[8] = this.MaximumHorizontalRate - 256;
    } else {
      this.raw[8] = this.MaximumHorizontalRate - 1;
    }
    // Maximum Pixel Clock
    this.raw[9] = Math.round(this.MaximumPixelClockMHz / 10);

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
      for (let i = 0; i < cvtBytes.length; i++) {
        this.raw[11 + i] = cvtBytes[i] ?? 0;
      }
    }
    return this.raw;
  }
}

class ColorPoint {
  WhitePointIndex: number = 0;
  WhiteX: number = 0;
  WhiteY: number = 0;
  WhiteGamma: number = 0;
  static decode(bytes: Uint8Array): ColorPoint {
    return new ColorPoint().Decode(bytes) as ColorPoint;
  }
  Decode(bytes: Uint8Array): ColorPoint {
    this.WhitePointIndex = bytes[0] ?? 0;
    this.WhiteX = (((bytes[2] ?? 0) << 2) | (((bytes[1] ?? 0) >> 4) & 0x3)) / 1024;
    this.WhiteY = (((bytes[3] ?? 0) << 2) | (((bytes[1] ?? 0) >> 2) & 0x3)) / 1024;
    this.WhiteGamma = (bytes[4] ?? 0) / 100 + 1;
    return this;
  }
  Encode(): Uint8Array {
    let colorBytes = new Uint8Array(5);
    let wx = Math.round(this.WhiteX * 1024);
    let wy = Math.round(this.WhiteY * 1024);
    colorBytes[0] = this.WhitePointIndex;
    colorBytes[1] = ((wx & 0x3) << 4) | ((wy & 0x3) << 2);
    colorBytes[2] = (wx >> 2) & 0xff;
    colorBytes[3] = (wy >> 2) & 0xff;
    colorBytes[4] = (this.WhiteGamma * 100) - 100;
    return colorBytes;
  }
}

export class ColorPointData implements DisplayDescriptorInterface {
  kind = 'colorPointData' as const;
  raw: Uint8Array;
  Type: DescriptorType;
  WhitePoints: Array<ColorPoint> = [];
  LineFeed: number = 0
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.ColorPointData;
  }
  static decode(bytes: Uint8Array): ColorPointData {
    return new ColorPointData().Decode(bytes) as ColorPointData;
  }
  Decode(bytes: Uint8Array): DisplayDescriptorInterface {
    for (let index = 5; index < 15; index+=5) {
      let cpBytes = bytes.slice(index, index+5)
      this.WhitePoints.push(ColorPoint.decode(cpBytes))
    }
    return this;
  }
  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    let offset = 5
    this.WhitePoints.forEach(wp => {
      this.raw.set(wp.Encode(), offset)
      offset+=5
    });
    this.raw[15] = 0x0A;
    this.raw[16] = 0x20;
    this.raw[17] = 0x20;
    return this.raw;
  }
}



export class StandardTimingIdentification
  implements DisplayDescriptorInterface
{
  kind = 'standardTimingIdentification' as const;
  raw: Uint8Array;
  Type: DescriptorType;
  timings: Array<StandardTiming> = [];
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.StandardTimingIdentification;
  }
  static decode(bytes: Uint8Array): StandardTimingIdentification {
    return new StandardTimingIdentification().Decode(bytes) as StandardTimingIdentification;
  }
  Decode(bytes: Uint8Array): StandardTimingIdentification {
    this.raw = bytes;
    for (let index = 5; index < 17; index += 2) {
      let timing = new StandardTiming();
      timing.Decode(bytes.slice(index, index + 2));
      this.timings.push(timing);
    }
    return this;
  }
  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    for (let index = 0; index < this.timings.length; index++) {
      const timing = this.timings[index];
      if (timing) {
        this.raw.set(timing.Encode(), index * 2 + 5);
      }
    }
    return this.raw;
  }
}

export class DisplayColorManagement implements DisplayDescriptorInterface {
  kind = 'displayColorManagement' as const;
  raw: Uint8Array;
  Type: DescriptorType;
  Version: number = 3;
  Red_a3: number = 0;
  Red_a2: number = 0;
  Green_a3: number = 0;
  Green_a2: number = 0;
  Blue_a3: number = 0;
  Blue_a2: number = 0;
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.DisplayColorManagement;
  }
  static decode(bytes: Uint8Array): DisplayColorManagement {
    return new DisplayColorManagement().Decode(bytes) as DisplayColorManagement;
  }
  Decode(bytes: Uint8Array): DisplayColorManagement {
    this.raw = bytes;
    this.Version = bytes[5] ?? 0;
    // Red a3 Least Significant Byte (LSB)
    this.Red_a3 = bytes[6] ?? 0;
    // Red a3 Most Significant Byte (MSB)
    this.Red_a3 = this.Red_a3 + ((bytes[7] ?? 0) << 8);
    // Red a2 Least Significant Byte (LSB)
    this.Red_a2 = bytes[8] ?? 0;
    // Red a2 Most Significant Byte (MSB)
    this.Red_a2 = this.Red_a2 + ((bytes[9] ?? 0) << 8);
    // Green a3 Least Significant Byte (LSB)
    this.Green_a3 = bytes[10] ?? 0;
    // Green a3 Most Significant Byte (MSB)
    this.Green_a3 = this.Green_a3 + ((bytes[11] ?? 0) << 8);
    // Green a2 Least Significant Byte (LSB)
    this.Green_a2 = bytes[12] ?? 0;
    // Green a2 Most Significant Byte (MSB)
    this.Green_a2 = this.Green_a2 + ((bytes[13] ?? 0) << 8);
    // Blue a3 Least Significant Byte (LSB)
    this.Blue_a3 = bytes[14] ?? 0;
    // Blue a3 Most Significant Byte (MSB)
    this.Blue_a3 = this.Blue_a3 + ((bytes[15] ?? 0) << 8);
    // Blue a2 Least Significant Byte (LSB)
    this.Blue_a2 = bytes[16] ?? 0;
    // Blue a2 Most Significant Byte (MSB)
    this.Blue_a2 = this.Blue_a2 + ((bytes[17] ?? 0) << 8);
    return this;
  }
  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    this.raw[5] = this.Version;
    // Red a3 Least Significant Byte (LSB)
    this.raw[6] = this.Red_a3 & 0xff;
    // Red a3 Most Significant Byte (MSB)
    this.raw[7] = this.Red_a3 >> 8;
    // Red a2 Least Significant Byte (LSB)
    this.raw[8] = this.Red_a2 & 0xff;
    // Red a2 Most Significant Byte (MSB)
    this.raw[9] = this.Red_a2 >> 8;
    // Green a3 Least Significant Byte (LSB)
    this.raw[10] = this.Green_a3 & 0xff;
    // Green a3 Most Significant Byte (MSB)
    this.raw[11] = this.Green_a3 >> 8;
    // Green a2 Least Significant Byte (LSB)
    this.raw[12] = this.Green_a2 & 0xff;
    // Green a2 Most Significant Byte (MSB)
    this.raw[13] = this.Green_a2 >> 8;
    // Blue a3 Least Significant Byte (LSB)
    this.raw[14] = this.Blue_a3 & 0xff;
    // Blue a3 Most Significant Byte (MSB)
    this.raw[15] = this.Blue_a3 >> 8;
    // Blue a2 Least Significant Byte (LSB)
    this.raw[16] = this.Blue_a2 & 0xff;
    // Blue a2 Most Significant Byte (MSB)
    this.raw[17] = this.Blue_a2 >> 8;
    return this.raw;
  }
}

export class CVT3ByteCodeDescriptor {
  AddressableLines: number = 0;
  AspectRatio: AspectRatio = AspectRatio.FourThree;
  PreferredRefreshRate: number = 60;
  Supports50Hz: boolean = false;
  Supports60Hz: boolean = false;
  Supports75Hz: boolean = false;
  Supports85Hz: boolean = false;
  Supports60HzReducedBlanking: boolean = false;

  static decode(bytes: Uint8Array): CVT3ByteCodeDescriptor {
    return new CVT3ByteCodeDescriptor().Decode(bytes) as CVT3ByteCodeDescriptor;
  }

  Decode(bytes: Uint8Array): CVT3ByteCodeDescriptor {
    const value = readUint16LE(bytes, 0);
    this.AddressableLines = (value + 1) * 2;
    switch (((bytes[1] ?? 0) >> 2) & 0x03) {
      case 0:
        this.AspectRatio = AspectRatio.FourThree;
        break;
      case 1:
        this.AspectRatio = AspectRatio.SixteenNine;
        break;
      case 2:
        this.AspectRatio = AspectRatio.SixteenTen;
        break;
      case 3:
        this.AspectRatio = AspectRatio.FifteenNine;
        break;
    }
    switch ((bytes[2] ?? 0) >> 6) {
      case 0:
        this.PreferredRefreshRate = 50;
        break;
      case 1:
        this.PreferredRefreshRate = 60;
        break;
      case 2:
        this.PreferredRefreshRate = 75;
        break;
      case 3:
        this.PreferredRefreshRate = 85;
        break;
    }
    this.Supports50Hz = (bytes[2] ?? 0) & 0x08 ? true : false;
    this.Supports60Hz = (bytes[2] ?? 0) & 0x04 ? true : false;
    this.Supports75Hz = (bytes[2] ?? 0) & 0x02 ? true : false;
    this.Supports85Hz = (bytes[2] ?? 0) & 0x01 ? true : false;
    this.Supports60HzReducedBlanking = (bytes[2] ?? 0) & 0x10 ? true : false;
    return this;
  }

  Encode(): Uint8Array {
    const bytes = new Uint8Array(3);
    const value = this.AddressableLines / 2 - 1;
    bytes[0] = value & 0xff;
    bytes[1] = (value >> 8) & 0x0f;
    switch (this.AspectRatio) {
      case AspectRatio.FourThree:
        bytes[1] |= 0 << 2;
        break;
      case AspectRatio.SixteenNine:
        bytes[1] |= 1 << 2;
        break;
      case AspectRatio.SixteenTen:
        bytes[1] |= 2 << 2;
        break;
      case AspectRatio.FifteenNine:
        bytes[1] |= 3 << 2;
        break;
    }
    switch (this.PreferredRefreshRate) {
      case 50:
        bytes[2] |= 0 << 6;
        break;
      case 60:
        bytes[2] |= 1 << 6;
        break;
      case 75:
        bytes[2] |= 2 << 6;
        break;
      case 85:
        bytes[2] |= 3 << 6;
        break;
    }
    if (this.Supports50Hz) bytes[2] |= 0x08;
    if (this.Supports60Hz) bytes[2] |= 0x04;
    if (this.Supports75Hz) bytes[2] |= 0x02;
    if (this.Supports85Hz) bytes[2] |= 0x01;
    if (this.Supports60HzReducedBlanking) bytes[2] |= 0x10;
    return bytes;
  }
}

export class CVT3ByteCodes implements DisplayDescriptorInterface {
  kind = 'cvt3ByteCodes' as const;
  raw: Uint8Array;
  Type: DescriptorType;
  Version: number = 1;
  Descriptors: CVT3ByteCodeDescriptor[] = [];

  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.CVT3ByteCodes;
  }

  static decode(bytes: Uint8Array): CVT3ByteCodes {
    return new CVT3ByteCodes().Decode(bytes) as CVT3ByteCodes;
  }

  Decode(bytes: Uint8Array): CVT3ByteCodes {
    this.raw = bytes;
    this.Version = bytes[5] ?? 1;
    this.Descriptors = [];
    for (let i = 0; i < 4; i++) {
      const offset = 6 + i * 3;
      if (bytes[offset] === 0 && bytes[offset + 1] === 0 && bytes[offset + 2] === 0) {
        continue;
      }
      const desc = CVT3ByteCodeDescriptor.decode(bytes.slice(offset, offset + 3));
      this.Descriptors.push(desc);
    }
    return this;
  }

  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    this.raw[5] = this.Version;
    for (let i = 0; i < 4; i++) {
      const offset = 6 + i * 3;
      const desc = this.Descriptors[i];
      if (desc) {
        this.raw.set(desc.Encode(), offset);
      } else {
        this.raw[offset] = 0;
        this.raw[offset + 1] = 0;
        this.raw[offset + 2] = 0;
      }
    }
    return this.raw;
  }
}

export class EstablishedTimingsIII implements DisplayDescriptorInterface {
  kind = 'establishedTimingsIII' as const;
  raw: Uint8Array;
  Type: DescriptorType;
  Timings: Uint8Array = new Uint8Array(12);

  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.EstablishedTimingsIII;
  }

  static decode(bytes: Uint8Array): EstablishedTimingsIII {
    return new EstablishedTimingsIII().Decode(bytes) as EstablishedTimingsIII;
  }

  Decode(bytes: Uint8Array): EstablishedTimingsIII {
    this.raw = bytes;
    this.Timings = bytes.slice(5, 17);
    return this;
  }

  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    this.raw.set(this.Timings, 5);
    return this.raw;
  }
}

export class DummyDesciptor implements DisplayDescriptorInterface {
  kind = 'dummy' as const;
  raw: Uint8Array;
  Type: DescriptorType;
  constructor() {
    this.raw = new Uint8Array(18);
    this.Type = DescriptorType.Dummy;
  }
  static decode(bytes: Uint8Array): DummyDesciptor {
    return new DummyDesciptor().Decode(bytes) as DummyDesciptor;
  }
  Decode(_bytes: Uint8Array): DisplayDescriptorInterface {
    return this;
  }
  Encode(): Uint8Array {
    this.raw[3] = DescriptorTypeToValue(this.Type);
    return this.raw;
  }
}

export type DisplayDescriptorUnion =
  | DetailedTimingDescriptor
  | DisplayProductSerialNumber
  | AlphanumericDataString
  | DisplayProductName
  | DisplayRangeLimits
  | ColorPointData
  | StandardTimingIdentification
  | DisplayColorManagement
  | CVT3ByteCodes
  | EstablishedTimingsIII
  | DummyDesciptor;

export function DecodeDesciptor(
  bytes: Uint8Array
): DisplayDescriptorUnion | null {
  // console.log(bytes);
  // Check if 18 bytes is display desciprtor
  switch (bytes[3]) {
    case DescriptorDisplayProductSerialNumber:
      return DisplayProductSerialNumber.decode(bytes);
    case DescriptorAlphanumericDataString:
      return AlphanumericDataString.decode(bytes);
    case DescriptorDisplayRangeLimits:
      return DisplayRangeLimits.decode(bytes);
    case DescriptorDisplayProductName:
      return DisplayProductName.decode(bytes);
    case DescriptorColorPointData:
      return ColorPointData.decode(bytes);
    case DescriptorStandardTimingIdentification:
      return StandardTimingIdentification.decode(bytes);
    case DescriptorDisplayColorManagement:
      return DisplayColorManagement.decode(bytes);
    case DescriptorCVT3ByteCodes:
      return CVT3ByteCodes.decode(bytes);
    case DescriptorEstablishedTimingsIII:
      return EstablishedTimingsIII.decode(bytes);
    case DescriptorDummy:
      return DummyDesciptor.decode(bytes);
    default:
      return null;
  }
}

export const descriptorTypeOptions = [
  { value: DescriptorType.DetailedTimingDescriptor, label: "Detailed Timing Descriptor" },
  { value: DescriptorType.DisplayProductSerialNumber, label: "Display Product Serial Number" },
  { value: DescriptorType.AlphanumericDataString, label: "Alphanumeric Data String" },
  { value: DescriptorType.DisplayRangeLimits, label: "Display Range Limits" },
  { value: DescriptorType.DisplayProductName, label: "Display Product Name" },
  { value: DescriptorType.ColorPointData, label: "Color Point Data" },
  { value: DescriptorType.StandardTimingIdentification, label: "Standard Timing Identification" },
  { value: DescriptorType.DisplayColorManagement, label: "Display Color Management" },
  { value: DescriptorType.CVT3ByteCodes, label: "CVT 3 Byte Codes" },
  { value: DescriptorType.EstablishedTimingsIII, label: "Established Timings III" },
] as const;

export function CreateDesciptor(
  type: DescriptorType
): DisplayDescriptorUnion {
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
