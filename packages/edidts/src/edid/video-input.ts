/**
 * Video Input Definition
 *
 * Handles encoding and decoding of EDID video input parameters.
 * Supports both analog and digital video inputs per VESA E-EDID A2.
 *
 * Per E-EDID A2 §3.6 / Table 3.11, the digital bit depth and interface codes
 * and the analog signal-level codes are sequential integers starting at 0, so
 * the values are stored as positional arrays — the array index *is* the
 * on-the-wire code.
 */

export const ANALOG_SIGNAL_LEVELS = ['0.7/0.3V', '0.714/0.286V', '1.0/0.4V', '0.7/0.0V'] as const;
export type AnalogSignalLevel = (typeof ANALOG_SIGNAL_LEVELS)[number];

export const DIGITAL_BIT_DEPTHS = ['undefined', 6, 8, 10, 12, 14, 16] as const;
export type DigitalBitDepth = (typeof DIGITAL_BIT_DEPTHS)[number];

export const DIGITAL_INTERFACES = ['undefined', 'DVI', 'HDMI-a', 'HDMI-b', 'MDDI', 'DisplayPort'] as const;
export type DigitalInterface = (typeof DIGITAL_INTERFACES)[number];

export interface AnalogVideoInput {
  type: 'analog';
  signalLevel: AnalogSignalLevel;
  videoSetup: boolean;
  separateSyncSupported: boolean;
  compositeSyncSupported: boolean;
  syncOnGreenSupported: boolean;
  vsyncSerrationSupported: boolean;
}

export interface DigitalVideoInput {
  type: 'digital';
  bitDepth: DigitalBitDepth;
  videoInterface: DigitalInterface;
}

export type VideoInput = AnalogVideoInput | DigitalVideoInput;

export class VideoInputDefinition {
  public input: VideoInput;

  constructor(input?: VideoInput) {
    this.input = input ?? { type: 'digital', bitDepth: 8, videoInterface: 'DisplayPort' };
  }

  /**
   * Decode video input definition from byte 14h
   */
  static decode(byte: number): VideoInputDefinition {
    const isDigital = (byte & 0x80) !== 0;

    if (isDigital) {
      const bitDepthCode = (byte >> 4) & 0x07;
      const interfaceCode = byte & 0x0F;

      return new VideoInputDefinition({
        type: 'digital',
        bitDepth: DIGITAL_BIT_DEPTHS[bitDepthCode] ?? 'undefined',
        videoInterface: DIGITAL_INTERFACES[interfaceCode] ?? 'undefined',
      });
    } else {
      const signalLevelCode = (byte >> 5) & 0x03;

      return new VideoInputDefinition({
        type: 'analog',
        signalLevel: ANALOG_SIGNAL_LEVELS[signalLevelCode] ?? '0.7/0.3V',
        videoSetup: (byte & 0x10) !== 0,
        separateSyncSupported: (byte & 0x08) !== 0,
        compositeSyncSupported: (byte & 0x04) !== 0,
        syncOnGreenSupported: (byte & 0x02) !== 0,
        vsyncSerrationSupported: (byte & 0x01) !== 0,
      });
    }
  }

  /**
   * Encode video input definition to byte
   */
  encode(): number {
    if (this.input.type === 'digital') {
      const digital = this.input;
      return (
        0x80 |
        (DIGITAL_BIT_DEPTHS.indexOf(digital.bitDepth) << 4) |
        DIGITAL_INTERFACES.indexOf(digital.videoInterface)
      );
    } else {
      const analog = this.input;
      let byte = ANALOG_SIGNAL_LEVELS.indexOf(analog.signalLevel) << 5;
      if (analog.videoSetup) byte |= 0x10;
      if (analog.separateSyncSupported) byte |= 0x08;
      if (analog.compositeSyncSupported) byte |= 0x04;
      if (analog.syncOnGreenSupported) byte |= 0x02;
      if (analog.vsyncSerrationSupported) byte |= 0x01;
      return byte;
    }
  }

  get isDigital(): boolean {
    return this.input.type === 'digital';
  }

  get isAnalog(): boolean {
    return this.input.type === 'analog';
  }

  toString(): string {
    if (this.input.type === 'digital') {
      const depth = this.input.bitDepth === 'undefined' ? 'undefined' : `${this.input.bitDepth}-bit`;
      return `Digital ${depth} ${this.input.videoInterface}`;
    } else {
      return `Analog ${this.input.signalLevel}`;
    }
  }
}
