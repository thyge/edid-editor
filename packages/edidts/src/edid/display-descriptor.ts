/**
 * Display Descriptors
 * 
 * Handles all 18-byte display descriptor types per VESA E-EDID A2.
 * Display descriptors start with 00 00 00 and use byte 3 as a tag.
 */

export type DisplayDescriptorTag = 
  | 0xFF  // Display Product Serial Number
  | 0xFE  // Alphanumeric Data String
  | 0xFD  // Display Range Limits
  | 0xFC  // Display Product Name
  | 0xFB  // Additional Color Point Data
  | 0xFA  // Standard Timing Identifiers
  | 0xF9  // Display Color Management (DCM) Data
  | 0xF8  // CVT 3-Byte Timing Codes
  | 0xF7  // Established Timings III
  | 0x10  // Dummy Descriptor
  | number; // 0x00-0x0F Manufacturer Specified

export interface BaseDisplayDescriptor {
  tag: DisplayDescriptorTag;
}

export interface ProductSerialDescriptor extends BaseDisplayDescriptor {
  tag: 0xFF;
  serialNumber: string;
}

export interface AlphanumericDataDescriptor extends BaseDisplayDescriptor {
  tag: 0xFE;
  data: string;
}

export interface DisplayRangeLimitsDescriptor extends BaseDisplayDescriptor {
  tag: 0xFD;
  minVerticalRate: number;      // Hz
  maxVerticalRate: number;      // Hz
  minHorizontalRate: number;    // kHz
  maxHorizontalRate: number;    // kHz
  maxPixelClock: number;        // MHz (in 10 MHz increments)
  timingSupport: 'default-gtf' | 'range-limits-only' | 'secondary-gtf' | 'cvt';
  // Secondary GTF parameters (if timingSupport === 'secondary-gtf')
  secondaryGTF?: {
    startFrequency: number;
    c: number;
    m: number;
    k: number;
    j: number;
  };
  // CVT parameters (if timingSupport === 'cvt')
  cvt?: {
    version: number;
    maxActivePixelsPerLine: number;
    aspectRatios: {
      ar4_3: boolean;
      ar16_9: boolean;
      ar16_10: boolean;
      ar5_4: boolean;
      ar15_9: boolean;
    };
    preferredAspectRatio: '4:3' | '16:9' | '16:10' | '5:4' | '15:9';
    reducedBlankingPreferred: boolean;
    standardBlankingSupported: boolean;
    horizontalShrinkSupported: boolean;
    horizontalStretchSupported: boolean;
    verticalShrinkSupported: boolean;
    verticalStretchSupported: boolean;
    preferredVerticalRefresh: number;
  };
}

export interface ProductNameDescriptor extends BaseDisplayDescriptor {
  tag: 0xFC;
  productName: string;
}

export interface ColorPointDescriptor extends BaseDisplayDescriptor {
  tag: 0xFB;
  colorPoints: Array<{
    index: number;
    whiteX: number;
    whiteY: number;
    gamma: number;
  }>;
}

export interface StandardTimingIdDescriptor extends BaseDisplayDescriptor {
  tag: 0xFA;
  timings: Array<{
    width: number;
    height: number;
    refreshRate: number;
  }>;
}

export interface DCMDescriptor extends BaseDisplayDescriptor {
  tag: 0xF9;
  version: number;
  redA3: number;
  redA2: number;
  greenA3: number;
  greenA2: number;
  blueA3: number;
  blueA2: number;
}

export interface CVTTimingDescriptor extends BaseDisplayDescriptor {
  tag: 0xF8;
  timings: Array<{
    addressableLines: number;
    aspectRatio: '4:3' | '16:9' | '16:10' | '5:4' | '15:9';
    preferredRefreshRate: number;
    refreshRates: {
      r50Hz: boolean;
      r60Hz: boolean;
      r75Hz: boolean;
      r85Hz: boolean;
      r60HzRB: boolean;
    };
  }>;
}

export interface EstablishedTimingsIIIDescriptor extends BaseDisplayDescriptor {
  tag: 0xF7;
  timings: number[]; // Bitmask of supported timings
}

export interface DummyDescriptor extends BaseDisplayDescriptor {
  tag: 0x10;
}

export interface ManufacturerDescriptor extends BaseDisplayDescriptor {
  tag: number; // 0x00-0x0F
  data: Uint8Array;
}

export type DisplayDescriptor = 
  | ProductSerialDescriptor
  | AlphanumericDataDescriptor
  | DisplayRangeLimitsDescriptor
  | ProductNameDescriptor
  | ColorPointDescriptor
  | StandardTimingIdDescriptor
  | DCMDescriptor
  | CVTTimingDescriptor
  | EstablishedTimingsIIIDescriptor
  | DummyDescriptor
  | ManufacturerDescriptor;

export class DisplayDescriptorParser {
  /**
   * Check if an 18-byte block is a display descriptor (not a timing)
   */
  static isDisplayDescriptor(data: Uint8Array): boolean {
    return data[0] === 0x00 && data[1] === 0x00 && data[2] === 0x00;
  }

  /**
   * Decode a display descriptor from 18 bytes
   */
  static decode(data: Uint8Array): DisplayDescriptor | null {
    if (data.length < 18) return null;
    if (!this.isDisplayDescriptor(data)) return null;

    const tag = data[3] as DisplayDescriptorTag;

    switch (tag) {
      case 0xFF:
        return this.decodeProductSerial(data);
      case 0xFE:
        return this.decodeAlphanumericData(data);
      case 0xFD:
        return this.decodeRangeLimits(data);
      case 0xFC:
        return this.decodeProductName(data);
      case 0xFB:
        return this.decodeColorPoint(data);
      case 0xFA:
        return this.decodeStandardTimingId(data);
      case 0xF9:
        return this.decodeDCM(data);
      case 0xF8:
        return this.decodeCVTTiming(data);
      case 0xF7:
        return this.decodeEstablishedTimingsIII(data);
      case 0x10:
        return { tag: 0x10 } as DummyDescriptor;
      default:
        if (tag >= 0x00 && tag <= 0x0F) {
          return {
            tag,
            data: data.slice(5, 18),
          } as ManufacturerDescriptor;
        }
        return null;
    }
  }

  /**
   * Encode a display descriptor to 18 bytes
   */
  static encode(descriptor: DisplayDescriptor): Uint8Array {
    const bytes = new Uint8Array(18);
    bytes[0] = 0x00;
    bytes[1] = 0x00;
    bytes[2] = 0x00;
    bytes[3] = descriptor.tag;
    bytes[4] = 0x00; // Reserved

    switch (descriptor.tag) {
      case 0xFF:
        this.encodeString(bytes, (descriptor as ProductSerialDescriptor).serialNumber);
        break;
      case 0xFE:
        this.encodeString(bytes, (descriptor as AlphanumericDataDescriptor).data);
        break;
      case 0xFC:
        this.encodeString(bytes, (descriptor as ProductNameDescriptor).productName);
        break;
      case 0xFD:
        this.encodeRangeLimits(bytes, descriptor as DisplayRangeLimitsDescriptor);
        break;
      case 0xFB:
        this.encodeColorPoint(bytes, descriptor as ColorPointDescriptor);
        break;
      case 0xFA:
        this.encodeStandardTimingId(bytes, descriptor as StandardTimingIdDescriptor);
        break;
      case 0xF9:
        this.encodeDCM(bytes, descriptor as DCMDescriptor);
        break;
      case 0xF8:
        this.encodeCVTTiming(bytes, descriptor as CVTTimingDescriptor);
        break;
      case 0xF7:
        this.encodeEstablishedTimingsIII(bytes, descriptor as EstablishedTimingsIIIDescriptor);
        break;
      case 0x10:
        // Dummy - fill with zeros
        break;
      default:
        if (descriptor.tag >= 0x00 && descriptor.tag <= 0x0F) {
          const mfg = descriptor as ManufacturerDescriptor;
          bytes.set(mfg.data.slice(0, 13), 5);
        }
    }

    return bytes;
  }

  private static decodeString(data: Uint8Array, start: number, length: number): string {
    let str = '';
    for (let i = start; i < start + length && i < data.length; i++) {
      if (data[i] === 0x0A) break; // Newline terminates
      if (data[i] >= 0x20 && data[i] < 0x7F) {
        str += String.fromCharCode(data[i]);
      }
    }
    return str.trim();
  }

  private static encodeString(bytes: Uint8Array, str: string): void {
    const maxLen = 13;
    for (let i = 0; i < maxLen; i++) {
      if (i < str.length) {
        bytes[5 + i] = str.charCodeAt(i);
      } else if (i === str.length) {
        bytes[5 + i] = 0x0A; // Newline terminator
      } else {
        bytes[5 + i] = 0x20; // Padding with spaces
      }
    }
  }

  private static decodeProductSerial(data: Uint8Array): ProductSerialDescriptor {
    return {
      tag: 0xFF,
      serialNumber: this.decodeString(data, 5, 13),
    };
  }

  private static decodeAlphanumericData(data: Uint8Array): AlphanumericDataDescriptor {
    return {
      tag: 0xFE,
      data: this.decodeString(data, 5, 13),
    };
  }

  private static decodeProductName(data: Uint8Array): ProductNameDescriptor {
    return {
      tag: 0xFC,
      productName: this.decodeString(data, 5, 13),
    };
  }

  private static decodeRangeLimits(data: Uint8Array): DisplayRangeLimitsDescriptor {
    const timingSupportByte = data[10];
    let timingSupport: DisplayRangeLimitsDescriptor['timingSupport'] = 'default-gtf';
    
    switch (timingSupportByte) {
      case 0x00: timingSupport = 'default-gtf'; break;
      case 0x01: timingSupport = 'range-limits-only'; break;
      case 0x02: timingSupport = 'secondary-gtf'; break;
      case 0x04: timingSupport = 'cvt'; break;
    }

    const descriptor: DisplayRangeLimitsDescriptor = {
      tag: 0xFD,
      minVerticalRate: data[5],
      maxVerticalRate: data[6],
      minHorizontalRate: data[7],
      maxHorizontalRate: data[8],
      maxPixelClock: data[9] * 10,
      timingSupport,
    };

    if (timingSupport === 'secondary-gtf' && data[11] === 0x00) {
      descriptor.secondaryGTF = {
        startFrequency: data[12] * 2,
        c: data[13] / 2,
        m: (data[15] << 8) | data[14],
        k: data[16],
        j: data[17] / 2,
      };
    }

    if (timingSupport === 'cvt') {
      const cvtVersion = ((data[11] >> 4) & 0x0F) * 10 + (data[11] & 0x0F);
      const maxPixelsHigh = ((data[12] & 0x03) << 8) | data[13];
      const arByte = data[14];
      const prefAR = (data[15] >> 5) & 0x07;

      descriptor.cvt = {
        version: cvtVersion,
        maxActivePixelsPerLine: maxPixelsHigh * 8,
        aspectRatios: {
          ar4_3: (arByte & 0x80) !== 0,
          ar16_9: (arByte & 0x40) !== 0,
          ar16_10: (arByte & 0x20) !== 0,
          ar5_4: (arByte & 0x10) !== 0,
          ar15_9: (arByte & 0x08) !== 0,
        },
        preferredAspectRatio: this.rangeCvtAspectRatioFromCode(prefAR),
        reducedBlankingPreferred: (data[15] & 0x08) !== 0,
        standardBlankingSupported: (data[15] & 0x10) !== 0,
        horizontalShrinkSupported: (data[16] & 0x80) !== 0,
        horizontalStretchSupported: (data[16] & 0x40) !== 0,
        verticalShrinkSupported: (data[16] & 0x20) !== 0,
        verticalStretchSupported: (data[16] & 0x10) !== 0,
        preferredVerticalRefresh: data[17],
      };
    }

    return descriptor;
  }

  private static encodeRangeLimits(bytes: Uint8Array, desc: DisplayRangeLimitsDescriptor): void {
    bytes[5] = desc.minVerticalRate;
    bytes[6] = desc.maxVerticalRate;
    bytes[7] = desc.minHorizontalRate;
    bytes[8] = desc.maxHorizontalRate;
    bytes[9] = Math.round(desc.maxPixelClock / 10);

    switch (desc.timingSupport) {
      case 'default-gtf': bytes[10] = 0x00; break;
      case 'range-limits-only': bytes[10] = 0x01; break;
      case 'secondary-gtf': bytes[10] = 0x02; break;
      case 'cvt': bytes[10] = 0x04; break;
    }

    // Fill remaining with padding for default GTF
    if (desc.timingSupport === 'default-gtf' || desc.timingSupport === 'range-limits-only') {
      bytes[11] = 0x0A;
      for (let i = 12; i < 18; i++) bytes[i] = 0x20;
    }

    if (desc.timingSupport === 'secondary-gtf') {
      const gtf = desc.secondaryGTF;
      bytes[11] = 0x00;
      bytes[12] = gtf ? Math.round(gtf.startFrequency / 2) & 0xFF : 0x00;
      bytes[13] = gtf ? Math.round(gtf.c * 2) & 0xFF : 0x00;
      const m = gtf ? Math.max(0, Math.min(0xFFFF, Math.round(gtf.m))) : 0;
      bytes[14] = m & 0xFF;
      bytes[15] = (m >> 8) & 0xFF;
      bytes[16] = gtf ? Math.round(gtf.k) & 0xFF : 0x00;
      bytes[17] = gtf ? Math.round(gtf.j * 2) & 0xFF : 0x00;
    }

    if (desc.timingSupport === 'cvt') {
      const cvt = desc.cvt;
      if (!cvt) return;

      const version = Math.max(0, Math.min(99, Math.round(cvt.version)));
      const maxActivePixels = Math.max(0, Math.min(0x3FF, Math.round(cvt.maxActivePixelsPerLine / 8)));

      bytes[11] = ((Math.floor(version / 10) & 0x0F) << 4) | (version % 10);
      bytes[12] = (maxActivePixels >> 8) & 0x03;
      bytes[13] = maxActivePixels & 0xFF;
      bytes[14] = this.encodeRangeCvtAspectRatios(cvt.aspectRatios);
      bytes[15] = (this.rangeCvtAspectRatioCode(cvt.preferredAspectRatio) << 5)
        | (cvt.standardBlankingSupported ? 0x10 : 0)
        | (cvt.reducedBlankingPreferred ? 0x08 : 0);
      bytes[16] = (cvt.horizontalShrinkSupported ? 0x80 : 0)
        | (cvt.horizontalStretchSupported ? 0x40 : 0)
        | (cvt.verticalShrinkSupported ? 0x20 : 0)
        | (cvt.verticalStretchSupported ? 0x10 : 0);
      bytes[17] = Math.max(1, Math.min(0xFF, Math.round(cvt.preferredVerticalRefresh)));
    }
  }

  private static decodeColorPoint(data: Uint8Array): ColorPointDescriptor {
    const colorPoints: ColorPointDescriptor['colorPoints'] = [];
    
    // Two color points can be stored
    for (let i = 0; i < 2; i++) {
      const offset = 5 + i * 5;
      const index = data[offset];
      if (index === 0) continue; // Unused
      
      const whiteXLow = (data[offset + 1] >> 2) & 0x03;
      const whiteYLow = data[offset + 1] & 0x03;
      const whiteXHigh = data[offset + 2];
      const whiteYHigh = data[offset + 3];
      const gamma = data[offset + 4];

      colorPoints.push({
        index,
        whiteX: ((whiteXHigh << 2) | whiteXLow) / 1024,
        whiteY: ((whiteYHigh << 2) | whiteYLow) / 1024,
        gamma: gamma === 0xFF ? 0 : (gamma + 100) / 100,
      });
    }

    return { tag: 0xFB, colorPoints };
  }

  private static encodeColorPoint(bytes: Uint8Array, descriptor: ColorPointDescriptor): void {
    const points = [...descriptor.colorPoints]
      .slice(0, 2)
      .sort((a, b) => a.index - b.index);

    for (let i = 0; i < 2; i++) {
      const offset = 5 + i * 5;
      const point = points[i];
      if (!point) {
        bytes[offset] = 0x00;
        bytes[offset + 1] = 0x00;
        bytes[offset + 2] = 0x00;
        bytes[offset + 3] = 0x00;
        bytes[offset + 4] = 0x00;
        continue;
      }

      const index = Math.max(1, Math.min(2, Math.round(point.index)));
      bytes[offset] = index & 0xFF;

      const whiteX = this.encodeChromaticity(point.whiteX);
      const whiteY = this.encodeChromaticity(point.whiteY);

      bytes[offset + 1] = ((whiteX & 0x03) << 2) | (whiteY & 0x03);
      bytes[offset + 2] = (whiteX >> 2) & 0xFF;
      bytes[offset + 3] = (whiteY >> 2) & 0xFF;
      bytes[offset + 4] = this.encodeGamma(point.gamma);
    }
  }

  private static encodeChromaticity(value: number): number {
    if (!Number.isFinite(value)) return 0;
    const clamped = Math.min(0.9999, Math.max(0, value));
    return Math.round(clamped * 1024) & 0x3FF;
  }

  private static encodeGamma(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0xFF;
    const clamped = Math.min(3.54, Math.max(1, value));
    const encoded = Math.round(clamped * 100 - 100);
    return Math.max(0, Math.min(0xFE, encoded));
  }

  private static decodeStandardTimingId(data: Uint8Array): StandardTimingIdDescriptor {
    const timings: StandardTimingIdDescriptor['timings'] = [];

    for (let i = 0; i < 6; i++) {
      const offset = 5 + i * 2;
      const byte1 = data[offset];
      const byte2 = data[offset + 1];

      if (byte1 === 0x01 && byte2 === 0x01) continue; // Unused

      const width = (byte1 + 31) * 8;
      const aspectRatio = (byte2 >> 6) & 0x03;
      const refreshRate = (byte2 & 0x3F) + 60;

      let height: number;
      switch (aspectRatio) {
        case 0: height = Math.round((width * 10) / 16); break; // 16:10
        case 1: height = Math.round((width * 3) / 4); break;   // 4:3
        case 2: height = Math.round((width * 4) / 5); break;   // 5:4
        case 3: height = Math.round((width * 9) / 16); break;  // 16:9
        default: height = width;
      }

      timings.push({ width, height, refreshRate });
    }

    return { tag: 0xFA, timings };
  }

  private static encodeStandardTimingId(bytes: Uint8Array, descriptor: StandardTimingIdDescriptor): void {
    for (let i = 0; i < 6; i++) {
      const offset = 5 + i * 2;
      const timing = descriptor.timings?.[i];

      if (!timing || timing.width <= 0 || timing.refreshRate <= 0) {
        bytes[offset] = 0x01;
        bytes[offset + 1] = 0x01;
        continue;
      }

      const roundedWidth = Math.round(timing.width / 8) * 8;
      const clampedWidth = Math.min(2288, Math.max(256, roundedWidth));
      const widthByte = Math.max(1, Math.min(255, Math.round(clampedWidth / 8) - 31));
      const aspectCode = this.aspectCodeFromTimings(clampedWidth, timing.height);
      const refresh = Math.min(123, Math.max(60, Math.round(timing.refreshRate))) - 60;

      bytes[offset] = widthByte & 0xFF;
      bytes[offset + 1] = ((aspectCode & 0x03) << 6) | (refresh & 0x3F);
    }
  }

  private static aspectCodeFromTimings(width: number, height?: number): number {
    if (!height || height <= 0) return 3; // Default to 16:9 when height unknown

    const targetRatio = width / height;
    const ratios = [
      { code: 0, ratio: 16 / 10 },
      { code: 1, ratio: 4 / 3 },
      { code: 2, ratio: 5 / 4 },
      { code: 3, ratio: 16 / 9 },
    ];

    let best = 3;
    let bestDiff = Number.POSITIVE_INFINITY;

    for (const candidate of ratios) {
      const diff = Math.abs(targetRatio - candidate.ratio);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = candidate.code;
      }
    }

    return best;
  }

  private static decodeDCM(data: Uint8Array): DCMDescriptor {
    return {
      tag: 0xF9,
      version: data[5],
      redA3: data[6] | (data[7] << 8),
      redA2: data[8] | (data[9] << 8),
      greenA3: data[10] | (data[11] << 8),
      greenA2: data[12] | (data[13] << 8),
      blueA3: data[14] | (data[15] << 8),
      blueA2: data[16] | (data[17] << 8),
    };
  }

  private static encodeDCM(bytes: Uint8Array, descriptor: DCMDescriptor): void {
    bytes[5] = descriptor.version & 0xFF;
    this.writeUint16LE(bytes, 6, descriptor.redA3);
    this.writeUint16LE(bytes, 8, descriptor.redA2);
    this.writeUint16LE(bytes, 10, descriptor.greenA3);
    this.writeUint16LE(bytes, 12, descriptor.greenA2);
    this.writeUint16LE(bytes, 14, descriptor.blueA3);
    this.writeUint16LE(bytes, 16, descriptor.blueA2);
  }

  private static decodeCVTTiming(data: Uint8Array): CVTTimingDescriptor {
    const timings: CVTTimingDescriptor['timings'] = [];

    for (let i = 0; i < 4; i++) {
      const offset = 6 + i * 3;
      const lines = ((data[offset + 1] & 0xF0) << 4) | data[offset];
      if (lines === 0) continue;

      const arCode = (data[offset + 1] >> 2) & 0x03;
      const arMap: Record<number, '4:3' | '16:9' | '16:10' | '5:4' | '15:9'> = {
        0: '4:3', 1: '16:9', 2: '16:10', 3: '15:9',
      };

      const prefRR = (data[offset + 2] >> 5) & 0x03;
      const rrMap: Record<number, number> = { 0: 50, 1: 60, 2: 75, 3: 85 };

      timings.push({
        addressableLines: (lines + 1) * 2,
        aspectRatio: arMap[arCode] ?? '4:3',
        preferredRefreshRate: rrMap[prefRR] ?? 60,
        refreshRates: {
          r50Hz: (data[offset + 2] & 0x10) !== 0,
          r60Hz: (data[offset + 2] & 0x08) !== 0,
          r75Hz: (data[offset + 2] & 0x04) !== 0,
          r85Hz: (data[offset + 2] & 0x02) !== 0,
          r60HzRB: (data[offset + 2] & 0x01) !== 0,
        },
      });
    }

    return { tag: 0xF8, timings };
  }

  private static encodeCVTTiming(bytes: Uint8Array, descriptor: CVTTimingDescriptor): void {
    bytes[5] = 0x01;

    for (let i = 0; i < 4; i++) {
      const timing = descriptor.timings[i];
      const offset = 6 + i * 3;

      if (!timing) {
        bytes[offset] = 0x00;
        bytes[offset + 1] = 0x00;
        bytes[offset + 2] = 0x00;
        continue;
      }

      const lineCode = Math.max(1, Math.min(0xFFF, Math.round(timing.addressableLines / 2) - 1));
      bytes[offset] = lineCode & 0xFF;
      bytes[offset + 1] = ((lineCode >> 8) & 0x0F) << 4
        | ((this.cvtTimingAspectRatioCode(timing.aspectRatio) & 0x03) << 2);
      bytes[offset + 2] = (this.cvtRefreshRateCode(timing.preferredRefreshRate) << 5)
        | this.encodeCvtRefreshRates(timing.refreshRates);
    }
  }

  private static decodeEstablishedTimingsIII(data: Uint8Array): EstablishedTimingsIIIDescriptor {
    const timings: number[] = [];
    for (let i = 6; i < 18; i++) {
      for (let bit = 7; bit >= 0; bit--) {
        if (data[i] & (1 << bit)) {
          timings.push((i - 6) * 8 + (7 - bit));
        }
      }
    }
    return { tag: 0xF7, timings };
  }

  private static encodeEstablishedTimingsIII(bytes: Uint8Array, descriptor: EstablishedTimingsIIIDescriptor): void {
    bytes[5] = 0x0A;

    for (const timing of descriptor.timings) {
      if (!Number.isInteger(timing) || timing < 0 || timing > 95) continue;
      const byteOffset = 6 + Math.floor(timing / 8);
      const bit = 7 - (timing % 8);
      bytes[byteOffset] |= 1 << bit;
    }
  }

  private static writeUint16LE(bytes: Uint8Array, offset: number, value: number): void {
    const clamped = Math.max(0, Math.min(0xFFFF, Math.round(value)));
    bytes[offset] = clamped & 0xFF;
    bytes[offset + 1] = (clamped >> 8) & 0xFF;
  }

  private static rangeCvtAspectRatioCode(aspectRatio: NonNullable<DisplayRangeLimitsDescriptor['cvt']>['preferredAspectRatio']): number {
    switch (aspectRatio) {
      case '4:3': return 0;
      case '16:9': return 1;
      case '16:10': return 2;
      case '5:4': return 3;
      case '15:9': return 4;
      default: return 0;
    }
  }

  private static rangeCvtAspectRatioFromCode(code: number): '4:3' | '16:9' | '16:10' | '5:4' | '15:9' {
    switch (code) {
      case 1: return '16:9';
      case 2: return '16:10';
      case 3: return '5:4';
      case 4: return '15:9';
      default: return '4:3';
    }
  }

  private static encodeRangeCvtAspectRatios(aspectRatios: NonNullable<DisplayRangeLimitsDescriptor['cvt']>['aspectRatios']): number {
    return (aspectRatios.ar4_3 ? 0x80 : 0)
      | (aspectRatios.ar16_9 ? 0x40 : 0)
      | (aspectRatios.ar16_10 ? 0x20 : 0)
      | (aspectRatios.ar5_4 ? 0x10 : 0)
      | (aspectRatios.ar15_9 ? 0x08 : 0);
  }

  private static cvtTimingAspectRatioCode(aspectRatio: CVTTimingDescriptor['timings'][number]['aspectRatio']): number {
    switch (aspectRatio) {
      case '4:3': return 0;
      case '16:9': return 1;
      case '16:10': return 2;
      case '15:9': return 3;
      case '5:4': return 3;
    }
  }

  private static cvtRefreshRateCode(refreshRate: number): number {
    const refreshRates = [50, 60, 75, 85];
    let best = 1;
    let bestDiff = Number.POSITIVE_INFINITY;

    for (let i = 0; i < refreshRates.length; i++) {
      const diff = Math.abs(refreshRate - refreshRates[i]);
      if (diff < bestDiff) {
        best = i;
        bestDiff = diff;
      }
    }

    return best;
  }

  private static encodeCvtRefreshRates(refreshRates: CVTTimingDescriptor['timings'][number]['refreshRates']): number {
    return (refreshRates.r50Hz ? 0x10 : 0)
      | (refreshRates.r60Hz ? 0x08 : 0)
      | (refreshRates.r75Hz ? 0x04 : 0)
      | (refreshRates.r85Hz ? 0x02 : 0)
      | (refreshRates.r60HzRB ? 0x01 : 0);
  }
}

/**
 * Helper to get product name from descriptors
 */
export function getProductName(descriptors: DisplayDescriptor[]): string | null {
  const desc = descriptors.find(d => d.tag === 0xFC) as ProductNameDescriptor | undefined;
  return desc?.productName ?? null;
}

/**
 * Helper to get serial number from descriptors
 */
export function getProductSerial(descriptors: DisplayDescriptor[]): string | null {
  const desc = descriptors.find(d => d.tag === 0xFF) as ProductSerialDescriptor | undefined;
  return desc?.serialNumber ?? null;
}

/**
 * Helper to get range limits from descriptors
 */
export function getRangeLimits(descriptors: DisplayDescriptor[]): DisplayRangeLimitsDescriptor | null {
  return descriptors.find(d => d.tag === 0xFD) as DisplayRangeLimitsDescriptor ?? null;
}
