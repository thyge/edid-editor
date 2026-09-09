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

/**
 * Display labels for {@link StereoMode} (EDID 1.4 §3.10.3.6). The stereo-mode
 * code is a 3-bit value formed from bits 6:5 and 0 of the flags byte; these
 * labels are the human-readable form used by the timing editor.
 */
export const STEREO_MODE_LABELS: Record<StereoMode, string> = {
  'none': 'None',
  'field-sequential-right': 'Field Sequential (Right)',
  'field-sequential-left': 'Field Sequential (Left)',
  '2-way-interleaved-right': '2-Way Interleaved (Right)',
  '2-way-interleaved-left': '2-Way Interleaved (Left)',
  '4-way-interleaved': '4-Way Interleaved',
  'side-by-side-interleaved': 'Side-by-Side Interleaved',
};

/**
 * Selectable stereo-mode options in spec display order, for `<select>` lists.
 */
export const STEREO_MODE_OPTIONS: ReadonlyArray<{ value: StereoMode; label: string }> = [
  { value: 'none', label: STEREO_MODE_LABELS['none'] },
  { value: 'field-sequential-right', label: STEREO_MODE_LABELS['field-sequential-right'] },
  { value: 'field-sequential-left', label: STEREO_MODE_LABELS['field-sequential-left'] },
  { value: '2-way-interleaved-right', label: STEREO_MODE_LABELS['2-way-interleaved-right'] },
  { value: '2-way-interleaved-left', label: STEREO_MODE_LABELS['2-way-interleaved-left'] },
  { value: '4-way-interleaved', label: STEREO_MODE_LABELS['4-way-interleaved'] },
  { value: 'side-by-side-interleaved', label: STEREO_MODE_LABELS['side-by-side-interleaved'] },
];

/**
 * Display labels for {@link SyncType} (EDID 1.4 §3.10.3.6, flags byte bits 4-1).
 */
export const SYNC_TYPE_LABELS: Record<SyncType, string> = {
  'analog-composite': 'Analog Composite',
  'bipolar-analog-composite': 'Bipolar Analog Composite',
  'digital-composite': 'Digital Composite',
  'digital-separate': 'Digital Separate',
};

/**
 * Selectable sync-type options in spec display order, for `<select>` lists.
 */
export const SYNC_TYPE_OPTIONS: ReadonlyArray<{ value: SyncType; label: string }> = [
  { value: 'analog-composite', label: SYNC_TYPE_LABELS['analog-composite'] },
  { value: 'bipolar-analog-composite', label: SYNC_TYPE_LABELS['bipolar-analog-composite'] },
  { value: 'digital-composite', label: SYNC_TYPE_LABELS['digital-composite'] },
  { value: 'digital-separate', label: SYNC_TYPE_LABELS['digital-separate'] },
];

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

/**
 * Shared field contract for detailed timings across EDID and DisplayID.
 *
 * EDID base / CTA-861 DTDs (`DetailedTiming`, 18-byte) and DisplayID Type VII /
 * v1 Type I (`DisplayIdTypeVIIDetailedTiming`, 20-byte) model the same DTD
 * geometry, but differ in clock units, in where the interlace/stereo/polarity
 * flags live (EDID nests them in `flags`; DisplayID flattens them to the top
 * level), and in per-family extras (EDID image-size-mm/borders/syncType;
 * DisplayID aspectRatio-code/preferred). Only the eight active/blanking/sync
 * geometry fields share an identical name, type, and nesting across both
 * families — those form the required core.
 *
 * The semantic fields are OPTIONAL: present at the top level on the family
 * that defines them, `undefined` on the other (e.g. `pixelClockKHz` is set by
 * DisplayID, which uses kHz natively, while EDID exposes `pixelClock` in MHz
 * and leaves `pixelClockKHz` absent). Consumers that need the clock, interlace,
 * stereo, or polarity must handle `undefined` or read the family-specific
 * field (`pixelClock` / `flags` for EDID). This is a type-level contract only
 * — the on-wire codecs are unchanged, and reference parsers keep the
 * on-wire structs separate.
 *
 * Type IX (6-byte formula) and Type X (6-8 byte delta) timings do NOT carry the
 * full DTD field set and are deliberately NOT modeled as extending this base.
 */
export interface DetailedTimingBase {
  horizontalActive: number;
  horizontalBlanking: number;
  verticalActive: number;
  verticalBlanking: number;
  horizontalSyncOffset: number;
  horizontalSyncWidth: number;
  verticalSyncOffset: number;
  verticalSyncWidth: number;
  /** Pixel clock in kHz. DisplayID Type VII / v1 Type I expose this; EDID uses `pixelClock` (MHz). */
  pixelClockKHz?: number;
  /** Interlace flag. DisplayID exposes this top-level; EDID nests it in `flags.interlaced`. */
  interlaced?: boolean;
  /** 3D stereo (0-3). DisplayID exposes this top-level; EDID uses `flags.stereoMode` (string union). */
  stereo?: number;
  /** Horizontal sync polarity. DisplayID exposes this top-level; EDID nests it in `flags.hSyncPolarity`. */
  horizontalSyncPolarity?: boolean;
  /** Vertical sync polarity. DisplayID exposes this top-level; EDID nests it in `flags.vSyncPolarity`. */
  verticalSyncPolarity?: boolean;
}

export interface DetailedTiming extends DetailedTimingBase {
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

/**
 * Derive the refresh rate (Hz) for any {@link DetailedTiming}-shaped object
 * (base-block DTD or CTA-861 DTD). Single source of truth for the UI card and
 * the {@link DetailedTimingDescriptor.refreshRate} getter.
 *
 * For interlaced timings the result is the field rate (pixel clock / total
 * pixels per frame, doubled) — the user-facing "60 Hz" convention for 1080i.
 */
export function computeRefreshRate(timing: DetailedTiming): number {
  const horizontalTotal = timing.horizontalActive + timing.horizontalBlanking;
  const verticalTotal = timing.verticalActive + timing.verticalBlanking;

  if (horizontalTotal === 0 || verticalTotal === 0 || timing.pixelClock === 0) {
    return 0;
  }

  // Refresh rate = pixel clock (MHz) * 1,000,000 / (horizontal total * vertical total)
  let rate = (timing.pixelClock * 1_000_000) / (horizontalTotal * verticalTotal);

  // For interlaced, the field rate is doubled
  if (timing.flags.interlaced) {
    rate *= 2;
  }

  return rate;
}

/**
 * Inverse of {@link computeRefreshRate} for authoring: the pixel
 * clock (MHz, quantized to the DTD's 10 kHz field resolution) that makes
 * `refreshRate` the timing's rate given its current geometry. The geometry
 * itself is untouched — in a user-owned (Custom) mode only the clock is
 * derived, unlike the CVT generator which owns the blanking too.
 *
 * For interlaced timings `refreshRate` is the field rate (the user-facing
 * convention, same as computeRefreshRate), so the required clock is halved.
 *
 * Returns null when the timing has no usable geometry, the rate is not
 * positive, or the quantized clock would fall outside (0, `maxClockMhz`] —
 * the DTD's 16-bit 10 kHz clock field tops out at 655.35 MHz, which callers
 * pass as their bound. A null result must leave the timing unchanged.
 */
export function computePixelClockForTargetRate(
  timing: DetailedTiming,
  refreshRate: number,
  maxClockMhz: number,
): number | null {
  const horizontalTotal = timing.horizontalActive + timing.horizontalBlanking;
  const verticalTotal = timing.verticalActive + timing.verticalBlanking;
  if (horizontalTotal <= 0 || verticalTotal <= 0 || !(refreshRate > 0)) {
    return null;
  }

  // computeRefreshRate: rate = clock * 1e6 / (hTotal * vTotal), doubled when
  // interlaced — solve for the clock with the matching field factor.
  const interlaceFields = timing.flags.interlaced ? 2 : 1;
  const clockMhz = (refreshRate * horizontalTotal * verticalTotal) / (interlaceFields * 1_000_000);

  // Quantize to the DTD's 10 kHz field resolution (0.01 MHz).
  const quantized = Math.round(clockMhz * 100) / 100;
  if (quantized <= 0 || quantized > maxClockMhz) {
    return null;
  }
  return quantized;
}

/**
 * Maximum value of every 18-byte DTD field, from the packing in
 * {@link encodeEdidCtaDetailedTiming}: a 16-bit 10 kHz pixel clock, 12-bit
 * active/blanking and image-size fields, 10-bit H sync offset/width (low byte
 * plus the top 2 bits of byte 11), 6-bit V sync offset/width (nibbles of bytes
 * 10/11), and 8-bit borders. The encoder MASKS rather than rejects, so a value
 * beyond its field's max is silently truncated — callers that cannot afford a
 * truncated DTD (e.g. building one from a CTA-861 VIC) must check
 * with {@link isDetailedTimingEncodable} first.
 */
export const DTD_FIELD_MAX = {
  /** Pixel clock in MHz (16-bit field of 10 kHz units). */
  pixelClockMhz: 655.35,
  horizontalActive: 4095,
  horizontalBlanking: 4095,
  verticalActive: 4095,
  verticalBlanking: 4095,
  horizontalSyncOffset: 1023,
  horizontalSyncWidth: 1023,
  verticalSyncOffset: 63,
  verticalSyncWidth: 63,
  horizontalImageSize: 4095,
  verticalImageSize: 4095,
  horizontalBorder: 255,
  verticalBorder: 255,
} as const;

function dtdFieldFits(value: number, max: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= max;
}

/**
 * True iff every timing field fits its DTD field width (see
 * {@link DTD_FIELD_MAX}), i.e. {@link encodeEdidCtaDetailedTiming} would emit
 * the timing as-is without silently truncating any field. The pixel clock is
 * compared in 10 kHz units so a value like 655.351 is correctly rejected even
 * though the float compare against 655.35 could go either way.
 */
export function isDetailedTimingEncodable(timing: DetailedTiming): boolean {
  const clockUnits = Math.round(timing.pixelClock * 100);
  return (
    clockUnits >= 0 &&
    clockUnits <= Math.round(DTD_FIELD_MAX.pixelClockMhz * 100) &&
    dtdFieldFits(timing.horizontalActive, DTD_FIELD_MAX.horizontalActive) &&
    dtdFieldFits(timing.horizontalBlanking, DTD_FIELD_MAX.horizontalBlanking) &&
    dtdFieldFits(timing.verticalActive, DTD_FIELD_MAX.verticalActive) &&
    dtdFieldFits(timing.verticalBlanking, DTD_FIELD_MAX.verticalBlanking) &&
    dtdFieldFits(timing.horizontalSyncOffset, DTD_FIELD_MAX.horizontalSyncOffset) &&
    dtdFieldFits(timing.horizontalSyncWidth, DTD_FIELD_MAX.horizontalSyncWidth) &&
    dtdFieldFits(timing.verticalSyncOffset, DTD_FIELD_MAX.verticalSyncOffset) &&
    dtdFieldFits(timing.verticalSyncWidth, DTD_FIELD_MAX.verticalSyncWidth) &&
    dtdFieldFits(timing.horizontalImageSize, DTD_FIELD_MAX.horizontalImageSize) &&
    dtdFieldFits(timing.verticalImageSize, DTD_FIELD_MAX.verticalImageSize) &&
    dtdFieldFits(timing.horizontalBorder, DTD_FIELD_MAX.horizontalBorder) &&
    dtdFieldFits(timing.verticalBorder, DTD_FIELD_MAX.verticalBorder)
  );
}

export function decodeEdidCtaDetailedTimingFlags(byte: number): TimingFlags {
  const interlaced = (byte & 0x80) !== 0;

  // Stereo mode: 3-bit code formed from bits 6:5 (upper) and bit 0 (lower),
  // per EDID 1.4 §3.10.3.6 / CTA-861. stereoBits = (bit6 << 2) | (bit5 << 1) | bit0.
  const stereoBits = ((byte >> 4) & 0x06) | (byte & 0x01);
  let stereoMode: StereoMode;
  switch (stereoBits) {
    case 0x00: stereoMode = 'none'; break;
    case 0x01: stereoMode = 'field-sequential-right'; break;
    case 0x02: stereoMode = '2-way-interleaved-right'; break;
    case 0x03: stereoMode = 'field-sequential-left'; break;
    case 0x04: stereoMode = '2-way-interleaved-left'; break;
    case 0x05: stereoMode = '4-way-interleaved'; break;
    case 0x06: stereoMode = 'side-by-side-interleaved'; break;
    default: stereoMode = 'none'; break; // 0x07 (111) is reserved
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
    // Stereo bits are 6, 5, and 0 — they do not overlap the sync bits (4:1),
    // so stereo and sync can be encoded independently. Each mode emits the
    // exact bits whose stereoBits ((bit6<<2)|(bit5<<1)|bit0) match the decode
    // code, making this the inverse of decodeEdidCtaDetailedTimingFlags.
    // Reserved code 111 (0x61) is never emitted.
    switch (flags.stereoMode) {
      case 'field-sequential-right': byte |= 0x01; break;    // 001
      case '2-way-interleaved-right': byte |= 0x20; break;    // 010
      case 'field-sequential-left': byte |= 0x21; break;     // 011
      case '2-way-interleaved-left': byte |= 0x40; break;     // 100
      case '4-way-interleaved': byte |= 0x41; break;         // 101
      case 'side-by-side-interleaved': byte |= 0x60; break;   // 110
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

  /**
   * Encode this detailed timing descriptor to 18 bytes
   */
  encode(): Uint8Array {
    return encodeEdidCtaDetailedTiming(this);
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
   * Calculate the refresh rate in Hz.
   *
   * Delegates to the shared {@link computeRefreshRate} helper so the UI layer
   * (DetailedTimingCard) and the lib model derive refresh from one source.
   */
  get refreshRate(): number {
    return computeRefreshRate(this);
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
