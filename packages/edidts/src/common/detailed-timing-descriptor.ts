/**
 * Detailed Timing Descriptor
 * 
 * Handles encoding and decoding of EDID detailed timing descriptors.
 * Each descriptor is 18 bytes and contains pixel clock and timing information.
 * 
 * pixelClock is always in MHz (megahertz).
 * When encoding, pixelClock (MHz) is multiplied by 100 to get the value in 10kHz units.
 * When decoding, the value in 10kHz units is divided by 100 to get MHz.
 */

export type StereoMode = 
  | 'none'
  | 'field-sequential-right'
  | 'field-sequential-left'
  | '2-way-interleaved-right'
  | '2-way-interleaved-left'
  | '4-way-interleaved'
  | 'side-by-side-interleaved';

export type SyncType = 
  | 'analog-composite'
  | 'bipolar-analog-composite'
  | 'digital-composite'
  | 'digital-separate';

export interface TimingFlags {
  interlaced: boolean;
  stereoMode: StereoMode;
  syncType: SyncType;
  // For digital separate sync
  vSyncPolarity?: 'positive' | 'negative';
  hSyncPolarity?: 'positive' | 'negative';
  // For analog/digital composite
  serrationOnVSync?: boolean;
  syncOnAllChannels?: boolean; // analog only
  syncOnGreen?: boolean; // analog only
}

export interface DetailedTiming {
  pixelClock: number; // MHz (megahertz)
  horizontalActive: number;
  horizontalBlanking: number;
  verticalActive: number;
  verticalBlanking: number;
  horizontalSyncOffset: number;
  horizontalSyncWidth: number;
  verticalSyncOffset: number;
  verticalSyncWidth: number;
  horizontalImageSize: number; // mm
  verticalImageSize: number;   // mm
  horizontalBorder: number;    // pixels (one side)
  verticalBorder: number;      // lines (one side)
  flags: TimingFlags;
}

export type DetailedTimingInput = Partial<Omit<DetailedTiming, 'flags'>> & {
  flags?: Partial<TimingFlags>;
};

export function normalizeTimingFlags(flags?: Partial<TimingFlags>): TimingFlags {
  return {
    interlaced: flags?.interlaced ?? false,
    stereoMode: flags?.stereoMode ?? 'none',
    syncType: flags?.syncType ?? 'digital-separate',
    vSyncPolarity: flags?.vSyncPolarity ?? 'positive',
    hSyncPolarity: flags?.hSyncPolarity ?? 'positive',
    serrationOnVSync: flags?.serrationOnVSync ?? false,
    syncOnAllChannels: flags?.syncOnAllChannels ?? false,
    syncOnGreen: flags?.syncOnGreen ?? false,
  };
}

export function normalizeDetailedTiming(data?: DetailedTimingInput): DetailedTiming {
  return {
    pixelClock: data?.pixelClock ?? 0,
    horizontalActive: data?.horizontalActive ?? 0,
    horizontalBlanking: data?.horizontalBlanking ?? 0,
    verticalActive: data?.verticalActive ?? 0,
    verticalBlanking: data?.verticalBlanking ?? 0,
    horizontalSyncOffset: data?.horizontalSyncOffset ?? 0,
    horizontalSyncWidth: data?.horizontalSyncWidth ?? 0,
    verticalSyncOffset: data?.verticalSyncOffset ?? 0,
    verticalSyncWidth: data?.verticalSyncWidth ?? 0,
    horizontalImageSize: data?.horizontalImageSize ?? 0,
    verticalImageSize: data?.verticalImageSize ?? 0,
    horizontalBorder: data?.horizontalBorder ?? 0,
    verticalBorder: data?.verticalBorder ?? 0,
    flags: normalizeTimingFlags(data?.flags),
  };
}

export function decodeEdidCtaDetailedTimingFlags(byte: number): TimingFlags {
  const interlaced = (byte & 0x80) !== 0;

  // Stereo mode (bits 6-5 and bit 0)
  const stereoBits = ((byte >> 4) & 0x06) | (byte & 0x01);
  let stereoMode: StereoMode = 'none';
  if ((byte & 0x60) === 0x00) {
    stereoMode = 'none';
  } else {
    switch (stereoBits) {
      case 0x01: stereoMode = 'field-sequential-right'; break;
      case 0x02: stereoMode = '2-way-interleaved-right'; break;
      case 0x03: stereoMode = 'field-sequential-left'; break;
      case 0x04: stereoMode = '2-way-interleaved-left'; break;
      case 0x05: stereoMode = '4-way-interleaved'; break;
      case 0x06: stereoMode = 'side-by-side-interleaved'; break;
      default: stereoMode = 'none';
    }
  }

  let syncType: SyncType;
  let vSyncPolarity: 'positive' | 'negative' | undefined;
  let hSyncPolarity: 'positive' | 'negative' | undefined;
  let serrationOnVSync: boolean | undefined;
  let syncOnAllChannels: boolean | undefined;
  let syncOnGreen: boolean | undefined;

  if ((byte & 0x10) === 0) {
    syncType = (byte & 0x08) ? 'bipolar-analog-composite' : 'analog-composite';
    serrationOnVSync = (byte & 0x04) !== 0;
    syncOnAllChannels = (byte & 0x02) !== 0;
    syncOnGreen = (byte & 0x02) === 0;
  } else if ((byte & 0x08) === 0) {
    syncType = 'digital-composite';
    serrationOnVSync = (byte & 0x04) !== 0;
    hSyncPolarity = (byte & 0x02) ? 'positive' : 'negative';
  } else {
    syncType = 'digital-separate';
    vSyncPolarity = (byte & 0x04) ? 'positive' : 'negative';
    hSyncPolarity = (byte & 0x02) ? 'positive' : 'negative';
  }

  return {
    interlaced,
    stereoMode,
    syncType,
    vSyncPolarity,
    hSyncPolarity,
    serrationOnVSync,
    syncOnAllChannels,
    syncOnGreen,
  };
}

export function encodeEdidCtaDetailedTimingFlags(flagsInput?: Partial<TimingFlags>): number {
  const flags = normalizeTimingFlags(flagsInput);
  let byte = 0;

  if (flags.interlaced) byte |= 0x80;

  if (flags.stereoMode !== 'none') {
    switch (flags.stereoMode) {
      case 'field-sequential-right': byte |= 0x21; break;
      case '2-way-interleaved-right': byte |= 0x41; break;
      case 'field-sequential-left': byte |= 0x60; break;
      case '2-way-interleaved-left': byte |= 0x61; break;
      case '4-way-interleaved': byte |= 0x40; break;
      case 'side-by-side-interleaved': byte |= 0x20; break;
    }
  }

  switch (flags.syncType) {
    case 'analog-composite':
      if (flags.serrationOnVSync) byte |= 0x04;
      if (flags.syncOnAllChannels) byte |= 0x02;
      break;
    case 'bipolar-analog-composite':
      byte |= 0x08;
      if (flags.serrationOnVSync) byte |= 0x04;
      if (flags.syncOnAllChannels) byte |= 0x02;
      break;
    case 'digital-composite':
      byte |= 0x10;
      if (flags.serrationOnVSync) byte |= 0x04;
      if (flags.hSyncPolarity === 'positive') byte |= 0x02;
      break;
    case 'digital-separate':
      byte |= 0x18;
      if (flags.vSyncPolarity === 'positive') byte |= 0x04;
      if (flags.hSyncPolarity === 'positive') byte |= 0x02;
      break;
  }

  return byte;
}

export function decodeEdidCtaDetailedTiming(timingData: Uint8Array): DetailedTiming | null {
  if (timingData.length < 18) {
    throw new Error('Detailed timing descriptor requires 18 bytes');
  }

  const pixelClock = (timingData[1] << 8) | timingData[0];
  if (pixelClock === 0) {
    return null;
  }

  return {
    pixelClock: pixelClock / 100,
    horizontalActive: ((timingData[4] & 0xf0) << 4) | timingData[2],
    horizontalBlanking: ((timingData[4] & 0x0f) << 8) | timingData[3],
    verticalActive: ((timingData[7] & 0xf0) << 4) | timingData[5],
    verticalBlanking: ((timingData[7] & 0x0f) << 8) | timingData[6],
    horizontalSyncOffset: ((timingData[11] & 0xc0) << 2) | timingData[8],
    horizontalSyncWidth: ((timingData[11] & 0x30) << 4) | timingData[9],
    verticalSyncOffset: ((timingData[11] & 0x0c) << 2) | ((timingData[10] & 0xf0) >> 4),
    verticalSyncWidth: ((timingData[11] & 0x03) << 4) | (timingData[10] & 0x0f),
    horizontalImageSize: ((timingData[14] & 0xf0) << 4) | timingData[12],
    verticalImageSize: ((timingData[14] & 0x0f) << 8) | timingData[13],
    horizontalBorder: timingData[15],
    verticalBorder: timingData[16],
    flags: decodeEdidCtaDetailedTimingFlags(timingData[17]),
  };
}

export function encodeEdidCtaDetailedTiming(timingInput: DetailedTimingInput): Uint8Array {
  const timing = normalizeDetailedTiming(timingInput);
  const timingData = new Uint8Array(18);

  const pixelClock = Math.round(timing.pixelClock * 100);
  timingData[0] = pixelClock & 0xff;
  timingData[1] = (pixelClock >> 8) & 0xff;

  timingData[2] = timing.horizontalActive & 0xff;
  timingData[3] = timing.horizontalBlanking & 0xff;
  timingData[4] =
    (((timing.horizontalActive >> 8) & 0x0f) << 4) |
    ((timing.horizontalBlanking >> 8) & 0x0f);

  timingData[5] = timing.verticalActive & 0xff;
  timingData[6] = timing.verticalBlanking & 0xff;
  timingData[7] =
    (((timing.verticalActive >> 8) & 0x0f) << 4) |
    ((timing.verticalBlanking >> 8) & 0x0f);

  timingData[8] = timing.horizontalSyncOffset & 0xff;
  timingData[9] = timing.horizontalSyncWidth & 0xff;
  timingData[10] =
    ((timing.verticalSyncOffset & 0x0f) << 4) |
    (timing.verticalSyncWidth & 0x0f);
  timingData[11] =
    (((timing.horizontalSyncOffset >> 8) & 0x03) << 6) |
    (((timing.horizontalSyncWidth >> 8) & 0x03) << 4) |
    (((timing.verticalSyncOffset >> 4) & 0x03) << 2) |
    ((timing.verticalSyncWidth >> 4) & 0x03);

  timingData[12] = timing.horizontalImageSize & 0xff;
  timingData[13] = timing.verticalImageSize & 0xff;
  timingData[14] =
    (((timing.horizontalImageSize >> 8) & 0x0f) << 4) |
    ((timing.verticalImageSize >> 8) & 0x0f);

  timingData[15] = timing.horizontalBorder;
  timingData[16] = timing.verticalBorder;
  timingData[17] = encodeEdidCtaDetailedTimingFlags(timing.flags);

  return timingData;
}

export class DetailedTimingDescriptor {
  public pixelClock: number; // MHz (megahertz)
  public horizontalActive: number;
  public horizontalBlanking: number;
  public verticalActive: number;
  public verticalBlanking: number;
  public horizontalSyncOffset: number;
  public horizontalSyncWidth: number;
  public verticalSyncOffset: number;
  public verticalSyncWidth: number;
  // New fields per VESA spec
  public horizontalImageSize: number; // mm
  public verticalImageSize: number;   // mm
  public horizontalBorder: number;    // pixels (one side)
  public verticalBorder: number;      // lines (one side)
  public flags: TimingFlags;

  constructor(data?: DetailedTimingInput) {
    const timing = normalizeDetailedTiming(data);
    this.pixelClock = timing.pixelClock;
    this.horizontalActive = timing.horizontalActive;
    this.horizontalBlanking = timing.horizontalBlanking;
    this.verticalActive = timing.verticalActive;
    this.verticalBlanking = timing.verticalBlanking;
    this.horizontalSyncOffset = timing.horizontalSyncOffset;
    this.horizontalSyncWidth = timing.horizontalSyncWidth;
    this.verticalSyncOffset = timing.verticalSyncOffset;
    this.verticalSyncWidth = timing.verticalSyncWidth;
    this.horizontalImageSize = timing.horizontalImageSize;
    this.verticalImageSize = timing.verticalImageSize;
    this.horizontalBorder = timing.horizontalBorder;
    this.verticalBorder = timing.verticalBorder;
    this.flags = timing.flags;
  }

  /**
   * Decode a detailed timing descriptor from 18 bytes of EDID data
   */
  static decode(timingData: Uint8Array): DetailedTimingDescriptor | null {
    const timing = decodeEdidCtaDetailedTiming(timingData);
    return timing ? new DetailedTimingDescriptor(timing) : null;
  }

  private static decodeFlags(byte: number): TimingFlags {
    return decodeEdidCtaDetailedTimingFlags(byte);
  }

  /**
   * Encode this detailed timing descriptor to 18 bytes
   */
  encode(): Uint8Array {
    return encodeEdidCtaDetailedTiming(this);
  }

  private encodeFlags(): number {
    return encodeEdidCtaDetailedTimingFlags(this.flags);
  }

  /**
   * Get the total horizontal pixels (active + blanking)
   */
  get horizontalTotal(): number {
    return this.horizontalActive + this.horizontalBlanking;
  }

  /**
   * Get the total vertical lines (active + blanking)
   */
  get verticalTotal(): number {
    return this.verticalActive + this.verticalBlanking;
  }

  /**
   * Calculate the refresh rate in Hz
   */
  get refreshRate(): number {
    const horizontalTotal = this.horizontalTotal;
    const verticalTotal = this.verticalTotal;
    
    if (horizontalTotal === 0 || verticalTotal === 0 || this.pixelClock === 0) {
      return 0;
    }
    
    // Refresh rate = pixel clock (MHz) * 1,000,000 / (horizontal total * vertical total)
    let rate = (this.pixelClock * 1000000) / (horizontalTotal * verticalTotal);
    
    // For interlaced, the field rate is doubled
    if (this.flags.interlaced) {
      rate *= 2;
    }
    
    return rate;
  }

  /**
   * Get image diagonal in inches
   */
  get diagonalInches(): number {
    if (this.horizontalImageSize === 0 || this.verticalImageSize === 0) {
      return 0;
    }
    const diagonalMm = Math.sqrt(
      this.horizontalImageSize ** 2 + this.verticalImageSize ** 2
    );
    return diagonalMm / 25.4;
  }

  /**
   * Encode all detailed timing descriptors to EDID bytes
   * @param timings Array of DetailedTimingDescriptor instances
   * @returns 72 bytes for detailed timing section (4 × 18 bytes)
   */
  static encodeAll(timings: DetailedTimingDescriptor[]): Uint8Array {
    const bytes = new Uint8Array(72); // 4 × 18 bytes
    
    for (let i = 0; i < 4; i++) {
      const offset = i * 18;
      
      if (i < timings.length) {
        const timingData = timings[i].encode();
        bytes.set(timingData, offset);
      }
      // If no timing available, bytes remain as zeros (which is correct)
    }
    
    return bytes;
  }

  /**
   * Decode all detailed timing descriptors from full EDID data
   * @param data Full EDID data (128+ bytes)
   * @returns Array of DetailedTimingDescriptor instances
   */
  static decodeAll(data: Uint8Array): DetailedTimingDescriptor[] {
    const timings: DetailedTimingDescriptor[] = [];
    
    // 4 detailed timing descriptors at offset 54-125 (18 bytes each)
    for (let i = 0; i < 4; i++) {
      const offset = 54 + (i * 18);
      const timingData = data.slice(offset, offset + 18);
      
      const timing = DetailedTimingDescriptor.decode(timingData);
      if (timing) {
        timings.push(timing);
      }
    }
    
    return timings;
  }

  /**
   * Get display resolution as a string (e.g., "1920×1080")
   */
  get resolution(): string {
    const suffix = this.flags.interlaced ? 'i' : 'p';
    return `${this.horizontalActive}×${this.verticalActive}${suffix}`;
  }

  /**
   * Create a human-readable description of this timing
   */
  toString(): string {
    return `${this.resolution}@${Math.round(this.refreshRate)}Hz (${this.pixelClock}MHz)`;
  }
}
