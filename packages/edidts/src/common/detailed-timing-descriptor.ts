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

  constructor(data?: {
    pixelClock?: number;
    horizontalActive?: number;
    horizontalBlanking?: number;
    verticalActive?: number;
    verticalBlanking?: number;
    horizontalSyncOffset?: number;
    horizontalSyncWidth?: number;
    verticalSyncOffset?: number;
    verticalSyncWidth?: number;
    horizontalImageSize?: number;
    verticalImageSize?: number;
    horizontalBorder?: number;
    verticalBorder?: number;
    flags?: Partial<TimingFlags>;
  }) {
    this.pixelClock = data?.pixelClock ?? 0;
    this.horizontalActive = data?.horizontalActive ?? 0;
    this.horizontalBlanking = data?.horizontalBlanking ?? 0;
    this.verticalActive = data?.verticalActive ?? 0;
    this.verticalBlanking = data?.verticalBlanking ?? 0;
    this.horizontalSyncOffset = data?.horizontalSyncOffset ?? 0;
    this.horizontalSyncWidth = data?.horizontalSyncWidth ?? 0;
    this.verticalSyncOffset = data?.verticalSyncOffset ?? 0;
    this.verticalSyncWidth = data?.verticalSyncWidth ?? 0;
    this.horizontalImageSize = data?.horizontalImageSize ?? 0;
    this.verticalImageSize = data?.verticalImageSize ?? 0;
    this.horizontalBorder = data?.horizontalBorder ?? 0;
    this.verticalBorder = data?.verticalBorder ?? 0;
    this.flags = {
      interlaced: data?.flags?.interlaced ?? false,
      stereoMode: data?.flags?.stereoMode ?? 'none',
      syncType: data?.flags?.syncType ?? 'digital-separate',
      vSyncPolarity: data?.flags?.vSyncPolarity ?? 'positive',
      hSyncPolarity: data?.flags?.hSyncPolarity ?? 'positive',
      serrationOnVSync: data?.flags?.serrationOnVSync ?? false,
      syncOnAllChannels: data?.flags?.syncOnAllChannels ?? false,
      syncOnGreen: data?.flags?.syncOnGreen ?? false,
    };
  }

  /**
   * Decode a detailed timing descriptor from 18 bytes of EDID data
   */
  static decode(timingData: Uint8Array): DetailedTimingDescriptor | null {
    if (timingData.length < 18) {
      throw new Error('Detailed timing descriptor requires 18 bytes');
    }

    // Check if this is a timing descriptor (pixel clock > 0)
    // Pixel clock is stored in 10kHz units, decode to MHz.
    const pixelClock = (timingData[1] << 8) | timingData[0];
    if (pixelClock === 0) {
      // This is a descriptor block, not timing data
      return null;
    }

    const horizontalActive = ((timingData[4] & 0xf0) << 4) | timingData[2];
    const horizontalBlanking = ((timingData[4] & 0x0f) << 8) | timingData[3];
    const verticalActive = ((timingData[7] & 0xf0) << 4) | timingData[5];
    const verticalBlanking = ((timingData[7] & 0x0f) << 8) | timingData[6];
    const horizontalSyncOffset = ((timingData[11] & 0xc0) << 2) | timingData[8];
    const horizontalSyncWidth = ((timingData[11] & 0x30) << 4) | timingData[9];
    const verticalSyncOffset = ((timingData[11] & 0x0c) << 2) | ((timingData[10] & 0xf0) >> 4);
    const verticalSyncWidth = ((timingData[11] & 0x03) << 4) | (timingData[10] & 0x0f);

    // Image size (bytes 12-14)
    const horizontalImageSize = ((timingData[14] & 0xf0) << 4) | timingData[12];
    const verticalImageSize = ((timingData[14] & 0x0f) << 8) | timingData[13];

    // Border (bytes 15-16)
    const horizontalBorder = timingData[15];
    const verticalBorder = timingData[16];

    // Flags (byte 17)
    const flagByte = timingData[17];
    const flags = DetailedTimingDescriptor.decodeFlags(flagByte);

    return new DetailedTimingDescriptor({
      // pixelClock is always in MHz (megahertz)
      pixelClock: pixelClock / 100, // Convert from 10kHz units to MHz
      horizontalActive,
      horizontalBlanking,
      verticalActive,
      verticalBlanking,
      horizontalSyncOffset,
      horizontalSyncWidth,
      verticalSyncOffset,
      verticalSyncWidth,
      horizontalImageSize,
      verticalImageSize,
      horizontalBorder,
      verticalBorder,
      flags,
    });
  }

  private static decodeFlags(byte: number): TimingFlags {
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

    // Sync type (bits 4-3)
    let syncType: SyncType;
    let vSyncPolarity: 'positive' | 'negative' | undefined;
    let hSyncPolarity: 'positive' | 'negative' | undefined;
    let serrationOnVSync: boolean | undefined;
    let syncOnAllChannels: boolean | undefined;
    let syncOnGreen: boolean | undefined;

    if ((byte & 0x10) === 0) {
      // Analog sync
      syncType = (byte & 0x08) ? 'bipolar-analog-composite' : 'analog-composite';
      serrationOnVSync = (byte & 0x04) !== 0;
      syncOnAllChannels = (byte & 0x02) !== 0;
      syncOnGreen = (byte & 0x02) === 0; // Inverted logic
    } else {
      // Digital sync
      if ((byte & 0x08) === 0) {
        syncType = 'digital-composite';
        serrationOnVSync = (byte & 0x04) !== 0;
        hSyncPolarity = (byte & 0x02) ? 'positive' : 'negative';
      } else {
        syncType = 'digital-separate';
        vSyncPolarity = (byte & 0x04) ? 'positive' : 'negative';
        hSyncPolarity = (byte & 0x02) ? 'positive' : 'negative';
      }
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

  /**
   * Encode this detailed timing descriptor to 18 bytes
   */
  encode(): Uint8Array {
    const timingData = new Uint8Array(18);

    // Pixel clock (in 10kHz units)
    // pixelClock must be provided in MHz (megahertz)
    const pixelClock = Math.round(this.pixelClock * 100);
    timingData[0] = pixelClock & 0xff;
    timingData[1] = (pixelClock >> 8) & 0xff;

    // Horizontal and vertical active/blanking
    timingData[2] = this.horizontalActive & 0xff;
    timingData[3] = this.horizontalBlanking & 0xff;
    timingData[4] =
      (((this.horizontalActive >> 8) & 0x0f) << 4) |
      ((this.horizontalBlanking >> 8) & 0x0f);

    timingData[5] = this.verticalActive & 0xff;
    timingData[6] = this.verticalBlanking & 0xff;
    timingData[7] =
      (((this.verticalActive >> 8) & 0x0f) << 4) |
      ((this.verticalBlanking >> 8) & 0x0f);

    // Sync offsets and widths
    timingData[8] = this.horizontalSyncOffset & 0xff;
    timingData[9] = this.horizontalSyncWidth & 0xff;
    timingData[10] =
      ((this.verticalSyncOffset & 0x0f) << 4) |
      (this.verticalSyncWidth & 0x0f);
    timingData[11] =
      (((this.horizontalSyncOffset >> 8) & 0x03) << 6) | // bits 7-6
      (((this.horizontalSyncWidth >> 8) & 0x03) << 4) | // bits 5-4
      (((this.verticalSyncOffset >> 4) & 0x03) << 2) | // bits 3-2
      ((this.verticalSyncWidth >> 4) & 0x03); // bits 1-0

    // Image size
    timingData[12] = this.horizontalImageSize & 0xff;
    timingData[13] = this.verticalImageSize & 0xff;
    timingData[14] =
      (((this.horizontalImageSize >> 8) & 0x0f) << 4) |
      ((this.verticalImageSize >> 8) & 0x0f);

    // Border
    timingData[15] = this.horizontalBorder;
    timingData[16] = this.verticalBorder;

    // Flags
    timingData[17] = this.encodeFlags();

    return timingData;
  }

  private encodeFlags(): number {
    let byte = 0;

    if (this.flags.interlaced) byte |= 0x80;

    // Stereo mode
    if (this.flags.stereoMode !== 'none') {
      switch (this.flags.stereoMode) {
        case 'field-sequential-right': byte |= 0x21; break;
        case '2-way-interleaved-right': byte |= 0x41; break;
        case 'field-sequential-left': byte |= 0x60; break;
        case '2-way-interleaved-left': byte |= 0x61; break;
        case '4-way-interleaved': byte |= 0x40; break;
        case 'side-by-side-interleaved': byte |= 0x20; break;
      }
    }

    // Sync type
    switch (this.flags.syncType) {
      case 'analog-composite':
        if (this.flags.serrationOnVSync) byte |= 0x04;
        if (this.flags.syncOnAllChannels) byte |= 0x02;
        break;
      case 'bipolar-analog-composite':
        byte |= 0x08;
        if (this.flags.serrationOnVSync) byte |= 0x04;
        if (this.flags.syncOnAllChannels) byte |= 0x02;
        break;
      case 'digital-composite':
        byte |= 0x10;
        if (this.flags.serrationOnVSync) byte |= 0x04;
        if (this.flags.hSyncPolarity === 'positive') byte |= 0x02;
        break;
      case 'digital-separate':
        byte |= 0x18;
        if (this.flags.vSyncPolarity === 'positive') byte |= 0x04;
        if (this.flags.hSyncPolarity === 'positive') byte |= 0x02;
        break;
    }

    return byte;
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
