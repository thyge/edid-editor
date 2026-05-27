/**
 * Video Input Definition
 * 
 * Handles encoding and decoding of EDID video input parameters.
 * Supports both analog and digital video inputs per VESA E-EDID A2.
 */

export type AnalogSignalLevel = '0.7/0.3V' | '0.714/0.286V' | '1.0/0.4V' | '0.7/0.0V';
export type DigitalBitDepth = 'undefined' | 6 | 8 | 10 | 12 | 14 | 16;
export type DigitalInterface = 'undefined' | 'DVI' | 'HDMI-a' | 'HDMI-b' | 'MDDI' | 'DisplayPort';

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

const SIGNAL_LEVEL_MAP: Record<number, AnalogSignalLevel> = {
  0: '0.7/0.3V',
  1: '0.714/0.286V',
  2: '1.0/0.4V',
  3: '0.7/0.0V',
};

const BIT_DEPTH_MAP: Record<number, DigitalBitDepth> = {
  0: 'undefined',
  1: 6,
  2: 8,
  3: 10,
  4: 12,
  5: 14,
  6: 16,
};

const INTERFACE_MAP: Record<number, DigitalInterface> = {
  0: 'undefined',
  1: 'DVI',
  2: 'HDMI-a',
  3: 'HDMI-b',
  4: 'MDDI',
  5: 'DisplayPort',
};

/** All valid analog signal levels */
export const ANALOG_SIGNAL_LEVELS: readonly AnalogSignalLevel[] = Object.values(SIGNAL_LEVEL_MAP);

/** All valid digital bit depths */
export const DIGITAL_BIT_DEPTHS: readonly DigitalBitDepth[] = Object.values(BIT_DEPTH_MAP);

/** All valid digital interfaces */
export const DIGITAL_INTERFACES: readonly DigitalInterface[] = Object.values(INTERFACE_MAP);

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
        bitDepth: BIT_DEPTH_MAP[bitDepthCode] ?? 'undefined',
        videoInterface: INTERFACE_MAP[interfaceCode] ?? 'undefined',
      });
    } else {
      const signalLevelCode = (byte >> 5) & 0x03;

      return new VideoInputDefinition({
        type: 'analog',
        signalLevel: SIGNAL_LEVEL_MAP[signalLevelCode] ?? '0.7/0.3V',
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
      let byte = 0x80; // Digital flag

      // Encode bit depth
      const digital = this.input as DigitalVideoInput;
      const bitDepthCode = Object.entries(BIT_DEPTH_MAP)
        .find(([, v]) => v === digital.bitDepth)?.[0];
      if (bitDepthCode) {
        byte |= (parseInt(bitDepthCode) & 0x07) << 4;
      }

      // Encode interface
      const interfaceCode = Object.entries(INTERFACE_MAP)
        .find(([, v]) => v === (this.input as DigitalVideoInput).videoInterface)?.[0];
      if (interfaceCode) {
        byte |= parseInt(interfaceCode) & 0x0F;
      }

      return byte;
    } else {
      let byte = 0x00; // Analog flag

      // Encode signal level
      const signalLevelCode = Object.entries(SIGNAL_LEVEL_MAP)
        .find(([, v]) => v === (this.input as AnalogVideoInput).signalLevel)?.[0];
      if (signalLevelCode) {
        byte |= (parseInt(signalLevelCode) & 0x03) << 5;
      }

      const analog = this.input as AnalogVideoInput;
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
