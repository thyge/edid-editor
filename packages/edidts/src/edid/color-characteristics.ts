/**
 * Color Characteristics
 * 
 * Handles encoding and decoding of EDID color characteristics data.
 * Contains CIE chromaticity coordinates for red, green, blue, and white points.
 * All coordinates are normalized values between 0 and 1.
 */
export class ColorCharacteristics {
  public redX: number;
  public redY: number;
  public greenX: number;
  public greenY: number;
  public blueX: number;
  public blueY: number;
  public whiteX: number;
  public whiteY: number;

  constructor(data?: {
    redX?: number;
    redY?: number;
    greenX?: number;
    greenY?: number;
    blueX?: number;
    blueY?: number;
    whiteX?: number;
    whiteY?: number;
  }) {
    this.redX = data?.redX ?? 0.64;
    this.redY = data?.redY ?? 0.33;
    this.greenX = data?.greenX ?? 0.3;
    this.greenY = data?.greenY ?? 0.6;
    this.blueX = data?.blueX ?? 0.15;
    this.blueY = data?.blueY ?? 0.06;
    this.whiteX = data?.whiteX ?? 0.3127;
    this.whiteY = data?.whiteY ?? 0.329;
  }

  /**
   * Decode color characteristics from 10 bytes of EDID data
   */
  static decode(colorBytes: Uint8Array): ColorCharacteristics {
    if (colorBytes.length < 10) {
      throw new Error('Color characteristics require 10 bytes');
    }

    // Extract color coordinates (each coordinate is 10 bits)
    const redX = ((colorBytes[2] << 2) | (colorBytes[0] >> 6)) / 1024;
    const redY = ((colorBytes[3] << 2) | ((colorBytes[0] >> 4) & 0x03)) / 1024;
    const greenX = ((colorBytes[4] << 2) | ((colorBytes[0] >> 2) & 0x03)) / 1024;
    const greenY = ((colorBytes[5] << 2) | (colorBytes[0] & 0x03)) / 1024;
    const blueX = ((colorBytes[6] << 2) | (colorBytes[1] >> 6)) / 1024;
    const blueY = ((colorBytes[7] << 2) | ((colorBytes[1] >> 4) & 0x03)) / 1024;
    const whiteX = ((colorBytes[8] << 2) | ((colorBytes[1] >> 2) & 0x03)) / 1024;
    const whiteY = ((colorBytes[9] << 2) | (colorBytes[1] & 0x03)) / 1024;

    return new ColorCharacteristics({
      redX,
      redY,
      greenX,
      greenY,
      blueX,
      blueY,
      whiteX,
      whiteY,
    });
  }

  /**
   * Encode color characteristics to 10 bytes
   */
  encode(): Uint8Array {
    const colorBytes = new Uint8Array(10);

    // Convert coordinates back to 10-bit values
    const redX = Math.round(this.redX * 1024);
    const redY = Math.round(this.redY * 1024);
    const greenX = Math.round(this.greenX * 1024);
    const greenY = Math.round(this.greenY * 1024);
    const blueX = Math.round(this.blueX * 1024);
    const blueY = Math.round(this.blueY * 1024);
    const whiteX = Math.round(this.whiteX * 1024);
    const whiteY = Math.round(this.whiteY * 1024);

    // Pack the coordinates
    colorBytes[0] =
      ((redX & 0x03) << 6) |
      ((redY & 0x03) << 4) |
      ((greenX & 0x03) << 2) |
      (greenY & 0x03);
    colorBytes[1] =
      ((blueX & 0x03) << 6) |
      ((blueY & 0x03) << 4) |
      ((whiteX & 0x03) << 2) |
      (whiteY & 0x03);
    colorBytes[2] = (redX >> 2) & 0xff;
    colorBytes[3] = (redY >> 2) & 0xff;
    colorBytes[4] = (greenX >> 2) & 0xff;
    colorBytes[5] = (greenY >> 2) & 0xff;
    colorBytes[6] = (blueX >> 2) & 0xff;
    colorBytes[7] = (blueY >> 2) & 0xff;
    colorBytes[8] = (whiteX >> 2) & 0xff;
    colorBytes[9] = (whiteY >> 2) & 0xff;

    return colorBytes;
  }

  /**
   * Validate that all coordinates are within valid range (0-1)
   */
  isValid(): boolean {
    const coords = [
      this.redX, this.redY, this.greenX, this.greenY,
      this.blueX, this.blueY, this.whiteX, this.whiteY
    ];
    return coords.every(coord => coord >= 0 && coord <= 1);
  }

  /**
   * Get color gamut area using the shoelace formula
   * Returns the area of the triangle formed by red, green, and blue primaries
   */
  get gamutArea(): number {
    // Calculate triangle area using shoelace formula
    return Math.abs(
      (this.redX * (this.greenY - this.blueY) +
       this.greenX * (this.blueY - this.redY) +
       this.blueX * (this.redY - this.greenY)) / 2
    );
  }

  /**
   * Check if this color space covers sRGB gamut approximately
   */
  get coversApproximateSRGB(): boolean {
    // Approximate sRGB primaries in CIE xy
    const sRGB = {
      redX: 0.64, redY: 0.33,
      greenX: 0.30, greenY: 0.60,
      blueX: 0.15, blueY: 0.06
    };

    // Check if our primaries are reasonably close to sRGB (within 0.05)
    const threshold = 0.05;
    return (
      Math.abs(this.redX - sRGB.redX) < threshold &&
      Math.abs(this.redY - sRGB.redY) < threshold &&
      Math.abs(this.greenX - sRGB.greenX) < threshold &&
      Math.abs(this.greenY - sRGB.greenY) < threshold &&
      Math.abs(this.blueX - sRGB.blueX) < threshold &&
      Math.abs(this.blueY - sRGB.blueY) < threshold
    );
  }

  /**
   * Get the white point as a formatted string
   */
  get whitePointDescription(): string {
    // Common white points
    if (Math.abs(this.whiteX - 0.3127) < 0.01 && Math.abs(this.whiteY - 0.3290) < 0.01) {
      return 'D65 (6504K)';
    }
    if (Math.abs(this.whiteX - 0.3457) < 0.01 && Math.abs(this.whiteY - 0.3585) < 0.01) {
      return 'D50 (5003K)';
    }
    if (Math.abs(this.whiteX - 0.3333) < 0.01 && Math.abs(this.whiteY - 0.3333) < 0.01) {
      return 'Equal Energy (E)';
    }
    
    return `Custom (${this.whiteX.toFixed(3)}, ${this.whiteY.toFixed(3)})`;
  }

  /**
   * Create a human-readable description of the color characteristics
   */
  toString(): string {
    return `Color Gamut: R(${this.redX.toFixed(3)},${this.redY.toFixed(3)}) ` +
           `G(${this.greenX.toFixed(3)},${this.greenY.toFixed(3)}) ` +
           `B(${this.blueX.toFixed(3)},${this.blueY.toFixed(3)}) ` +
           `W(${this.whiteX.toFixed(3)},${this.whiteY.toFixed(3)}) ` +
           `Area: ${this.gamutArea.toFixed(4)} White: ${this.whitePointDescription}`;
  }

  /**
   * Create standard sRGB color characteristics
   */
  static createSRGB(): ColorCharacteristics {
    return new ColorCharacteristics({
      redX: 0.640, redY: 0.330,
      greenX: 0.300, greenY: 0.600,
      blueX: 0.150, blueY: 0.060,
      whiteX: 0.3127, whiteY: 0.3290  // D65
    });
  }

  /**
   * Create Rec. 2020 color characteristics
   */
  static createRec2020(): ColorCharacteristics {
    return new ColorCharacteristics({
      redX: 0.708, redY: 0.292,
      greenX: 0.170, greenY: 0.797,
      blueX: 0.131, blueY: 0.046,
      whiteX: 0.3127, whiteY: 0.3290  // D65
    });
  }

  /**
   * Create DCI-P3 color characteristics
   */
  static createDCIP3(): ColorCharacteristics {
    return new ColorCharacteristics({
      redX: 0.680, redY: 0.320,
      greenX: 0.265, greenY: 0.690,
      blueX: 0.150, blueY: 0.060,
      whiteX: 0.3127, whiteY: 0.3290  // D65
    });
  }
}