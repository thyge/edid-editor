/**
 * Standard timing information for EDID
 * Represents a standard timing mode with width, height, and refresh rate
 */
import {
  decodeStandardTimingAspectCode,
  heightFromStandardTimingAspect,
  standardTimingAspectCodeFor,
} from '../common/aspect-ratios';

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
   * @param edidVersion Declared EDID version (1.x); gates the aspect-ratio code-0 table
   * @param edidRevision Declared EDID revision; used with `edidVersion`
   * @returns Array of StandardTiming instances
   */
  static decode(
    data: Uint8Array,
    edidVersion?: number,
    edidRevision?: number,
  ): StandardTiming[] {
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
      const aspectCode = decodeStandardTimingAspectCode(timing2);
      const height = heightFromStandardTimingAspect(width, aspectCode, edidVersion, edidRevision);
      const refreshRate = (timing2 & 0x3f) + 60;

      timings.push(new StandardTiming({ width, height, refreshRate }));
    }

    return timings;
  }

  /**
   * Encode standard timings to EDID bytes
   * @param timings Array of StandardTiming instances
   * @param edidVersion Declared EDID version (1.x); gates the aspect-ratio code-0 table
   * @param edidRevision Declared EDID revision; used with `edidVersion`
   * @returns 16 bytes for standard timing section
   */
  static encode(
    timings: StandardTiming[],
    edidVersion?: number,
    edidRevision?: number,
  ): Uint8Array {
    const bytes = new Uint8Array(16); // 8 × 2 bytes

    for (let i = 0; i < 8; i++) {
      const offset = i * 2;

      if (i < timings.length && timings[i].isValid) {
        const timing = timings[i];
        const timing1 = Math.round(timing.width / 8) - 31;
        const aspectCode = standardTimingAspectCodeFor(
          timing.width,
          timing.height,
          edidVersion,
          edidRevision,
        );
        const timing2 = (aspectCode << 6) | ((timing.refreshRate - 60) & 0x3f);

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