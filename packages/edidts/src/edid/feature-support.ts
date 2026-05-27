/**
 * Feature Support
 * 
 * Handles encoding and decoding of EDID feature support byte (18h).
 * Per VESA E-EDID A2 specification.
 */

export type AnalogDisplayType = 'monochrome' | 'rgb' | 'non-rgb' | 'undefined';
export type DigitalColorEncoding = 'rgb444' | 'rgb444_ycrcb444' | 'rgb444_ycrcb422' | 'rgb444_ycrcb444_ycrcb422';

export interface FeatureSupport {
  // Power management (DPMS)
  standbySupported: boolean;
  suspendSupported: boolean;
  activeOffSupported: boolean;

  // Display type (depends on analog/digital)
  analogDisplayType?: AnalogDisplayType;
  digitalColorEncoding?: DigitalColorEncoding;

  // Standard color space
  sRGBDefault: boolean;

  // Timing
  preferredTimingMode: boolean;
  continuousFrequency: boolean;
}

const ANALOG_DISPLAY_TYPE_MAP: Record<number, AnalogDisplayType> = {
  0: 'monochrome',
  1: 'rgb',
  2: 'non-rgb',
  3: 'undefined',
};

const DIGITAL_COLOR_ENCODING_MAP: Record<number, DigitalColorEncoding> = {
  0: 'rgb444',
  1: 'rgb444_ycrcb444',
  2: 'rgb444_ycrcb422',
  3: 'rgb444_ycrcb444_ycrcb422',
};

/** All valid analog display types */
export const ANALOG_DISPLAY_TYPES: readonly AnalogDisplayType[] = Object.values(ANALOG_DISPLAY_TYPE_MAP);

/** All valid digital color encodings */
export const DIGITAL_COLOR_ENCODINGS: readonly DigitalColorEncoding[] = Object.values(DIGITAL_COLOR_ENCODING_MAP);

export class FeatureSupportFlags {
  public features: FeatureSupport;

  constructor(features?: Partial<FeatureSupport>) {
    this.features = {
      standbySupported: features?.standbySupported ?? false,
      suspendSupported: features?.suspendSupported ?? false,
      activeOffSupported: features?.activeOffSupported ?? false,
      analogDisplayType: features?.analogDisplayType,
      digitalColorEncoding: features?.digitalColorEncoding,
      sRGBDefault: features?.sRGBDefault ?? false,
      preferredTimingMode: features?.preferredTimingMode ?? true,
      continuousFrequency: features?.continuousFrequency ?? false,
    };
  }

  /**
   * Decode feature support from byte 18h
   * @param byte The feature support byte
   * @param isDigital Whether the video input is digital
   */
  static decode(byte: number, isDigital: boolean): FeatureSupportFlags {
    const colorTypeCode = (byte >> 3) & 0x03;

    const features: FeatureSupport = {
      standbySupported: (byte & 0x80) !== 0,
      suspendSupported: (byte & 0x40) !== 0,
      activeOffSupported: (byte & 0x20) !== 0,
      sRGBDefault: (byte & 0x04) !== 0,
      preferredTimingMode: (byte & 0x02) !== 0,
      continuousFrequency: (byte & 0x01) !== 0,
    };

    if (isDigital) {
      features.digitalColorEncoding = DIGITAL_COLOR_ENCODING_MAP[colorTypeCode] ?? 'rgb444';
    } else {
      features.analogDisplayType = ANALOG_DISPLAY_TYPE_MAP[colorTypeCode] ?? 'undefined';
    }

    return new FeatureSupportFlags(features);
  }

  /**
   * Encode feature support to byte
   * @param isDigital Whether the video input is digital
   */
  encode(isDigital: boolean): number {
    let byte = 0;

    if (this.features.standbySupported) byte |= 0x80;
    if (this.features.suspendSupported) byte |= 0x40;
    if (this.features.activeOffSupported) byte |= 0x20;

    // Encode color type
    if (isDigital && this.features.digitalColorEncoding) {
      const code = Object.entries(DIGITAL_COLOR_ENCODING_MAP)
        .find(([, v]) => v === this.features.digitalColorEncoding)?.[0];
      if (code) byte |= (parseInt(code) & 0x03) << 3;
    } else if (!isDigital && this.features.analogDisplayType) {
      const code = Object.entries(ANALOG_DISPLAY_TYPE_MAP)
        .find(([, v]) => v === this.features.analogDisplayType)?.[0];
      if (code) byte |= (parseInt(code) & 0x03) << 3;
    }

    if (this.features.sRGBDefault) byte |= 0x04;
    if (this.features.preferredTimingMode) byte |= 0x02;
    if (this.features.continuousFrequency) byte |= 0x01;

    return byte;
  }

  get supportsPowerManagement(): boolean {
    return this.features.standbySupported || 
           this.features.suspendSupported || 
           this.features.activeOffSupported;
  }

  toString(): string {
    const parts: string[] = [];
    if (this.features.standbySupported) parts.push('Standby');
    if (this.features.suspendSupported) parts.push('Suspend');
    if (this.features.activeOffSupported) parts.push('Active-Off');
    if (this.features.sRGBDefault) parts.push('sRGB');
    if (this.features.preferredTimingMode) parts.push('Preferred Timing');
    if (this.features.continuousFrequency) parts.push('Continuous Freq');
    return parts.join(', ') || 'None';
  }
}
