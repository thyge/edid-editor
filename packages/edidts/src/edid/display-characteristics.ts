/**
 * Display Characteristics class for handling EDID display characteristics
 * Handles video input type, screen size, gamma, and feature support
 */
export class DisplayCharacteristics {
  public inputType: "analog" | "digital";
  public maxHorizontalSize: number; // cm
  public maxVerticalSize: number; // cm
  public gamma: number;
  public features: {
    standby: boolean;
    suspend: boolean;
    activeOff: boolean;
    sRGB: boolean;
  };

  constructor(data?: {
    inputType?: "analog" | "digital";
    maxHorizontalSize?: number;
    maxVerticalSize?: number;
    gamma?: number;
    features?: {
      standby?: boolean;
      suspend?: boolean;
      activeOff?: boolean;
      sRGB?: boolean;
    };
  }) {
    this.inputType = data?.inputType ?? "digital";
    this.maxHorizontalSize = data?.maxHorizontalSize ?? 0;
    this.maxVerticalSize = data?.maxVerticalSize ?? 0;
    this.gamma = data?.gamma ?? 2.2;
    this.features = {
      standby: data?.features?.standby ?? false,
      suspend: data?.features?.suspend ?? false,
      activeOff: data?.features?.activeOff ?? false,
      sRGB: data?.features?.sRGB ?? false,
    };
  }
  

  /**
   * Decode display characteristics from EDID binary data
   * @param data - EDID binary data (full 128 bytes)
   * @returns New DisplayCharacteristics instance
   */
  static decode(data: Uint8Array): DisplayCharacteristics {
    // Video input definition at offset 20 (1 byte)
    const inputDefinition = data[20];
    const inputType = inputDefinition & 0x80 ? "digital" : "analog";

    // Max horizontal image size at offset 21 (1 byte, in cm)
    const maxHorizontalSize = data[21];

    // Max vertical image size at offset 22 (1 byte, in cm)
    const maxVerticalSize = data[22];

    // Display gamma at offset 23 (1 byte, (value + 100) / 100)
    const gammaValue = data[23];
    const gamma = DisplayCharacteristics.decodeGamma(gammaValue);

    // Feature support at offset 24 (1 byte)
    const features = data[24];

    return new DisplayCharacteristics({
      inputType,
      maxHorizontalSize,
      maxVerticalSize,
      gamma,
      features: {
        standby: !!(features & 0x80),
        suspend: !!(features & 0x40),
        activeOff: !!(features & 0x20),
        sRGB: !!(features & 0x04),
      },
    });
  }

  /**
   * Encode display characteristics to binary format
   * @returns 5-byte array containing the encoded display characteristics
   */
  encode(): Uint8Array {
    const result = new Uint8Array(5);

    // Video input definition at offset 0
    const inputDefinition = this.inputType === "digital" ? 0x80 : 0x00;
    result[0] = inputDefinition;

    // Screen size at offset 1-2
    result[1] = this.maxHorizontalSize;
    result[2] = this.maxVerticalSize;

    // Gamma at offset 3
    const gammaValue = DisplayCharacteristics.encodeGamma(this.gamma);
    result[3] = Math.max(0, Math.min(255, gammaValue));

    // Features at offset 4
    let features = 0;
    if (this.features.standby) features |= 0x80;
    if (this.features.suspend) features |= 0x40;
    if (this.features.activeOff) features |= 0x20;
    if (this.features.sRGB) features |= 0x04;
    result[4] = features;

    return result;
  }

  /**
   * Get aspect ratio of the display
   */
  get aspectRatio(): number {
    if (this.maxHorizontalSize === 0 || this.maxVerticalSize === 0) {
      return 0;
    }
    return this.maxHorizontalSize / this.maxVerticalSize;
  }

  /**
   * Get diagonal size in inches (approximate)
   */
  get diagonalInches(): number {
    if (this.maxHorizontalSize === 0 || this.maxVerticalSize === 0) {
      return 0;
    }
    const diagonalCm = Math.sqrt(
      this.maxHorizontalSize ** 2 + this.maxVerticalSize ** 2
    );
    return diagonalCm / 2.54; // Convert cm to inches
  }

  /**
   * Check if display supports power management
   */
  get supportsPowerManagement(): boolean {
    return this.features.standby || this.features.suspend || this.features.activeOff;
  }

  // Gamma encode/decode helpers
  private static decodeGamma(gammaValue: number): number {
    return gammaValue === 0xff ? 0 : (gammaValue + 100) / 100;
  }

  private static encodeGamma(gamma: number): number {
    return gamma === 0 ? 0xff : Math.round(gamma * 100 - 100);
  }
}