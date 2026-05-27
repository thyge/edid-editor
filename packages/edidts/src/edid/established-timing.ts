/**
 * Established Timing class for handling EDID established timing information
 * Represents predefined standard display modes
 */
export class EstablishedTiming {
  public id: number;
  public name: string;
  public width: number;
  public height: number;
  public refreshRate: number;

  constructor(data?: {
    id?: number;
    name?: string;
    width?: number;
    height?: number;
    refreshRate?: number;
  }) {
    this.id = (data && data.id) || 0;
    this.name = (data && data.name) || "Unknown";
    this.width = (data && data.width) || 0;
    this.height = (data && data.height) || 0;
    this.refreshRate = (data && data.refreshRate) || 0;
  }

  /**
   * Decode established timings from EDID binary data
   * @param data - EDID binary data (full 128 bytes)
   * @returns Array of EstablishedTiming instances
   */
  static decode(data: Uint8Array): EstablishedTiming[] {
    // Established timings live at bytes 35-37 of the base block. Accept either the full
    // 128-byte EDID buffer or a pre-sliced 3-byte view for flexibility.
    const rawBytes = data.length >= 38 ? data.slice(35, 38) : data.slice(0, 3);
    const timingBytes = new Uint8Array(3);
    timingBytes.set(rawBytes.subarray(0, 3));
    const timings: EstablishedTiming[] = [];

    // Decode each bit to get supported timings
    for (let byte = 0; byte < 3; byte++) {
      for (let bit = 7; bit >= 0; bit--) {
        if (timingBytes[byte] & (1 << bit)) {
          const timingId = byte * 8 + (7 - bit);
          const timing = EstablishedTiming.TIMING_MAP[timingId];
          if (timing) {
            timings.push(new EstablishedTiming(timing));
          }
        }
      }
    }

    return timings;
  }

  /**
   * Encode established timings to binary format
   * @param timings - Array of EstablishedTiming instances
   * @returns 3-byte array containing the encoded established timings
   */
  static encode(timings: EstablishedTiming[]): Uint8Array {
    const result = new Uint8Array(3);

    // Set bits for each supported timing
    for (const timing of timings) {
      const byte = Math.floor(timing.id / 8);
      const bit = 7 - (timing.id % 8);
      if (byte < 3) {
        result[byte] |= 1 << bit;
      }
    }

    return result;
  }

  /**
   * Get display mode string (e.g., "1920×1080@60Hz")
   */
  get displayMode(): string {
    return `${this.width}×${this.height}@${this.refreshRate}Hz`;
  }

  /**
   * Get aspect ratio
   */
  get aspectRatio(): number {
    if (this.width === 0 || this.height === 0) {
      return 0;
    }
    return this.width / this.height;
  }

  /**
   * Check if this is a reserved/unused timing
   */
  get isReserved(): boolean {
    return this.name.includes("Reserved") || (this.width === 0 && this.height === 0);
  }

  /**
   * Established timings mapping
   * Maps timing IDs to their corresponding display modes
   */
  static readonly TIMING_MAP: ReadonlyArray<{
    id: number;
    name: string;
    width: number;
    height: number;
    refreshRate: number;
  }> = [
    { id: 0, name: "720×400@70Hz", width: 720, height: 400, refreshRate: 70 },
    { id: 1, name: "720×400@88Hz", width: 720, height: 400, refreshRate: 88 },
    { id: 2, name: "640×480@60Hz", width: 640, height: 480, refreshRate: 60 },
    { id: 3, name: "640×480@67Hz", width: 640, height: 480, refreshRate: 67 },
    { id: 4, name: "640×480@72Hz", width: 640, height: 480, refreshRate: 72 },
    { id: 5, name: "640×480@75Hz", width: 640, height: 480, refreshRate: 75 },
    { id: 6, name: "800×600@56Hz", width: 800, height: 600, refreshRate: 56 },
    { id: 7, name: "800×600@60Hz", width: 800, height: 600, refreshRate: 60 },
    { id: 8, name: "800×600@72Hz", width: 800, height: 600, refreshRate: 72 },
    { id: 9, name: "800×600@75Hz", width: 800, height: 600, refreshRate: 75 },
    { id: 10, name: "832×624@75Hz", width: 832, height: 624, refreshRate: 75 },
    {
      id: 11,
      name: "1024×768@87Hz",
      width: 1024,
      height: 768,
      refreshRate: 87,
    },
    {
      id: 12,
      name: "1024×768@60Hz",
      width: 1024,
      height: 768,
      refreshRate: 60,
    },
    {
      id: 13,
      name: "1024×768@70Hz",
      width: 1024,
      height: 768,
      refreshRate: 70,
    },
    {
      id: 14,
      name: "1024×768@75Hz",
      width: 1024,
      height: 768,
      refreshRate: 75,
    },
    {
      id: 15,
      name: "1280×1024@75Hz",
      width: 1280,
      height: 1024,
      refreshRate: 75,
    },
    {
      id: 16,
      name: "1152×870@75Hz",
      width: 1152,
      height: 870,
      refreshRate: 75,
    },
    { id: 17, name: "Reserved 17", width: 0, height: 0, refreshRate: 0 },
    { id: 18, name: "Reserved 18", width: 0, height: 0, refreshRate: 0 },
    { id: 19, name: "Reserved 19", width: 0, height: 0, refreshRate: 0 },
    { id: 20, name: "Reserved 20", width: 0, height: 0, refreshRate: 0 },
    { id: 21, name: "Reserved 21", width: 0, height: 0, refreshRate: 0 },
    { id: 22, name: "Reserved 22", width: 0, height: 0, refreshRate: 0 },
    { id: 23, name: "Reserved 23", width: 0, height: 0, refreshRate: 0 },
  ];
}