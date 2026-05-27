/**
 * Standard timing information for EDID
 * Represents a standard timing mode with width, height, and refresh rate
 */
export class StandardTiming {
  public readonly width: number;
  public readonly height: number;
  public readonly refreshRate: number;

  constructor(options: {
    width?: number;
    height?: number;
    refreshRate?: number;
  } = {}) {
    this.width = options.width ?? 0;
    this.height = options.height ?? 0;
    this.refreshRate = options.refreshRate ?? 0;
  }

  /**
   * Get the display mode string
   */
  get displayMode(): string {
    return `${this.width}×${this.height}@${this.refreshRate}Hz`;
  }

  /**
   * Get the aspect ratio as a string
   */
  get aspectRatio(): string {
    if (this.width === 0 || this.height === 0) return "Unknown";
    
    const ratio = this.width / this.height;
    if (Math.abs(ratio - 16/10) < 0.05) return "16:10";
    if (Math.abs(ratio - 4/3) < 0.05) return "4:3";
    if (Math.abs(ratio - 5/4) < 0.05) return "5:4";
    if (Math.abs(ratio - 16/9) < 0.05) return "16:9";
    return `${this.width}:${this.height}`;
  }

  /**
   * Check if this timing is valid (not a placeholder)
   */
  get isValid(): boolean {
    return this.width > 0 && this.height > 0 && this.refreshRate > 0;
  }

  /**
   * Decode standard timings from EDID data
   * @param data The EDID data bytes
   * @returns Array of StandardTiming instances
   */
  static decode(data: Uint8Array): StandardTiming[] {
    const timings: StandardTiming[] = [];

    // Standard timings at offset 38-53 (8 × 2 bytes)
    for (let i = 0; i < 8; i++) {
      const offset = 38 + i * 2;
      const timing1 = data[offset];
      const timing2 = data[offset + 1];

      // Skip unused entries (0x01, 0x01)
      if (timing1 === 0x01 && timing2 === 0x01) {
        continue;
      }

      const width = (timing1 + 31) * 8;
      const aspectRatio = (timing2 >> 6) & 0x03;
      const refreshRate = (timing2 & 0x3f) + 60;

      let height: number;
      switch (aspectRatio) {
        case 0:
          height = Math.round((width * 10) / 16);
          break; // 16:10
        case 1:
          height = Math.round((width * 3) / 4);
          break; // 4:3
        case 2:
          height = Math.round((width * 4) / 5);
          break; // 5:4
        case 3:
          height = Math.round((width * 9) / 16);
          break; // 16:9
        default:
          height = width;
      }

      timings.push(new StandardTiming({ width, height, refreshRate }));
    }

    return timings;
  }

  /**
   * Encode standard timings to EDID bytes
   * @param timings Array of StandardTiming instances
   * @returns 16 bytes for standard timing section
   */
  static encode(timings: StandardTiming[]): Uint8Array {
    const bytes = new Uint8Array(16); // 8 × 2 bytes

    for (let i = 0; i < 8; i++) {
      const offset = i * 2;
      
      if (i < timings.length && timings[i].isValid) {
        const timing = timings[i];
        const timing1 = Math.round(timing.width / 8) - 31;

        // Determine aspect ratio using integer math and lookup table
        let aspectRatio = 0;
        const aspectRatios = [
          { code: 0, w: 16, h: 10 }, // 16:10
          { code: 1, w: 4, h: 3 }, // 4:3
          { code: 2, w: 5, h: 4 }, // 5:4
          { code: 3, w: 16, h: 9 }, // 16:9
        ];
        for (const ar of aspectRatios) {
          if (Math.abs(timing.height * ar.w - timing.width * ar.h) < 2) {
            aspectRatio = ar.code;
            break;
          }
        }

        const timing2 = (aspectRatio << 6) | ((timing.refreshRate - 60) & 0x3f);

        bytes[offset] = Math.max(1, Math.min(255, timing1));
        bytes[offset + 1] = timing2;
      } else {
        // Unused timing slot
        bytes[offset] = 0x01;
        bytes[offset + 1] = 0x01;
      }
    }

    return bytes;
  }
}