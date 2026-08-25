import type { DisplayIdTypeXTimingBlock } from './type-x-timing';
import type { DisplayIdAdaptiveSyncBlock } from './adaptive-sync';
import type { DisplayIdArvrHmdBlock, DisplayIdArvrLayerBlock } from './ar-vr';
import type { DisplayIdBrightnessLuminanceRangeBlock } from './brightness-luminance';
// CTA-861 short data block types (DisplayID 2.0 §4.10 CTA DisplayID embeds a
// stream of these). Type-only import: erased at runtime, so this does not
// create a runtime dependency cycle with the cta module.
import type { CEADataBlock } from '../cta';

export enum DisplayIdDataBlockTag {
  ProductIdentification = 0x20,
  DisplayParameters = 0x21,
  TypeVIIDetailedTiming = 0x22,
  TypeVIIIEnumeratedTimingCode = 0x23,
  TypeIXFormulaBasedTiming = 0x24,
  DynamicVideoTimingRangeLimits = 0x25,
  DisplayInterfaceFeatures = 0x26,
  StereoDisplayInterface = 0x27,
  TiledDisplayTopology = 0x28,
  ContainerId = 0x29,
  TypeXTiming = 0x2a,
  AdaptiveSync = 0x2b,
  ArvrHmd = 0x2c,
  ArvrLayer = 0x2d,
  BrightnessLuminanceRange = 0x2e,
  VendorSpecific = 0x7e,
  CtaDisplayId = 0x81,
}

export interface DisplayIdDataBlock {
  tag: number;
  revision: number;
  flags: number;
  payloadLength: number;
  payload: Uint8Array;
}

export interface DisplayIdProductIdentificationBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.ProductIdentification;
  ieeeOui: number;
  productId: number;
  serialNumber?: number;
  manufactureWeek?: number;
  year?: number;
  isModelYear: boolean;
  productNameLength: number;
  productNameBytes: Uint8Array;
  productName: string;
}

/** 12-bit CIE chromaticity coordinate pair (raw 0..4095; value = raw / 4096). */
export interface DisplayIdChromaticity {
  x: number;
  y: number;
}

/**
 * DisplayID 2.0 §4.2 Display Parameters Data Block (tag 0x21).
 *
 * Fixed 29-byte payload per Table 4-7; field layout per edid-decode
 * parse_displayid_parameters_v2 (parse-displayid-block.cpp:1109-1195).
 * The image-size precision multiplier lives in the block header flags
 * (byte 1 bit 7) and is exposed here as `imageSizeInMm`.
 */
export interface DisplayIdDisplayParametersBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.DisplayParameters;
  /** Derived from block flags bit 7: false = 0.1 mm precision, true = 1.0 mm. */
  imageSizeInMm: boolean;
  /** Payload[0..1] — horizontal image size (raw; see imageSizeInMm for units). */
  horizontalImageSizeMm: number;
  /** Payload[2..3] — vertical image size (raw). */
  verticalImageSizeMm: number;
  /** Payload[4..5] — horizontal native pixel count. */
  horizontalPixelCount: number;
  /** Payload[6..7] — vertical native pixel count. */
  verticalPixelCount: number;
  /** Payload[8] bits 2:0 — scan orientation (0..7). */
  scanOrientation: number;
  /** Payload[8] bits 4:3 — luminance information type (0..3). */
  luminanceInformation: number;
  /** Payload[8] bit 6 — true = CIE 1976, false = CIE 1931. */
  colorInformationCie1976: boolean;
  /** Payload[8] bit 7 — true = audio speaker NOT integrated. */
  audioSpeakerNotIntegrated: boolean;
  /** Payload[9..11] — native color primary #1 chromaticity (12-bit x/y). */
  primary1: DisplayIdChromaticity;
  /** Payload[12..14] — native color primary #2 chromaticity. */
  primary2: DisplayIdChromaticity;
  /** Payload[15..17] — native color primary #3 chromaticity. */
  primary3: DisplayIdChromaticity;
  /** Payload[18..20] — white point chromaticity. */
  whitePoint: DisplayIdChromaticity;
  /** Payload[21..22] — native max luminance, full coverage (IEEE 754 binary16, raw). */
  maxLuminanceFullCoverage: number;
  /** Payload[23..24] — native max luminance, 10% rectangular coverage (binary16, raw). */
  maxLuminance10PercentRect: number;
  /** Payload[25..26] — native minimum luminance (binary16, raw). */
  minLuminance: number;
  /** Payload[27] bits 2:0 — native color depth (0 = not defined; else bpc444 code). */
  nativeColorDepth: number;
  /** Payload[27] bits 6:3 — display device technology (0..7). */
  displayDeviceTechnology: number;
  /** Payload[27] bit 7 — display device theme preference (meaningful when revision >= 1). */
  displayDeviceThemePreference: boolean;
  /** Payload[28] — native gamma EOTF (0xff = not defined; else (100 + byte) / 100). */
  gammaEotf: number;
}

/**
 * DisplayID 2.0 §4.3.1 Type VII Detailed Timing descriptor (Table 4-18).
 *
 * Fixed 20-byte descriptor. Every count field uses the spec's "1 + raw"
 * convention (stored value = raw + 1), so e.g. horizontalActive = 1 + raw16.
 * Pixel clock is 24-bit little-endian at 1 kHz resolution (1 + raw24).
 * Field layout per edid-decode parse_displayid_type_1_7_timing.
 */
export interface DisplayIdTypeVIIDetailedTiming {
  /** Bytes 0-2 — pixel clock in kHz (1 + raw 24-bit LE). */
  pixelClockKHz: number;
  /** Byte 3 bits 3:0 — aspect ratio code (0-8; 8 = calculate from active). */
  aspectRatio: number;
  /** Byte 3 bit 4 — true = interlaced scan. */
  interlaced: boolean;
  /** Byte 3 bits 6:5 — 3D stereo support (0=mono, 1=stereo, 2=user action, 3=reserved). */
  stereo: number;
  /** Byte 3 bit 7 — preferred detailed timing. */
  preferred: boolean;
  /** Bytes 4-5 — horizontal active pixels (1 + raw16). */
  horizontalActive: number;
  /** Bytes 6-7 — horizontal blank pixels (1 + raw16). */
  horizontalBlanking: number;
  /** Bytes 8 + (9 & 0x7f)<<8 — horizontal sync offset / front porch (1 + raw14). */
  horizontalSyncOffset: number;
  /** Byte 9 bit 7 — horizontal sync polarity (true = positive). */
  horizontalSyncPolarity: boolean;
  /** Bytes 10-11 — horizontal sync width (1 + raw16). */
  horizontalSyncWidth: number;
  /** Bytes 12-13 — vertical active lines (1 + raw16). */
  verticalActive: number;
  /** Bytes 14-15 — vertical blank lines (1 + raw16). */
  verticalBlanking: number;
  /** Bytes 16 + (17 & 0x7f)<<8 — vertical sync offset / front porch (1 + raw14). */
  verticalSyncOffset: number;
  /** Byte 17 bit 7 — vertical sync polarity (true = positive). */
  verticalSyncPolarity: boolean;
  /** Bytes 18-19 — vertical sync width (1 + raw16). */
  verticalSyncWidth: number;
}

export interface DisplayIdTypeVIIDetailedTimingBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.TypeVIIDetailedTiming;
  timings: DisplayIdTypeVIIDetailedTiming[];
}

/**
 * DisplayID 2.0 §4.3.2 Type VIII Enumerated Timing Code block (Table 4-19).
 *
 * The timing-code type and size live in the block header revision/flags byte
 * (byte 1): bits 7:6 = code type, bit 3 = code size. They are exposed here as
 * derived read-only views (`codeType`, `codeSize`); the authoritative source is
 * `block.flags`, which the generic encoder writes back to byte 1. The payload
 * is a list of `codeSize`-byte little-endian timing codes.
 */
export interface DisplayIdTypeVIIIEnumeratedTimingCodeBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode;
  /** Derived from header flags bits 7:6. 0 = DMT, 1 = CTA VIC, 2 = HDMI VIC, 3 = reserved. */
  codeType: number;
  /** Derived from header flags bit 3. 1 = 1-byte codes, 2 = 2-byte codes. */
  codeSize: number;
  /** Timing codes, read as `codeSize`-byte little-endian values. */
  timingCodes: number[];
}

/**
 * DisplayID 2.0 §4.3.3 Type IX Formula-based Timing descriptor (Table 4-21).
 *
 * Fixed 6-byte descriptor. Byte 0 carries the formula, NTSC pull-down, and
 * stereo flags; byte 5 is the refresh rate (1 + raw, range 1-256 Hz). Active
 * pixel/line counts use the "1 + raw16" convention. There is no preferred
 * flag in Type IX (priority is purely positional).
 */
export interface DisplayIdTypeIXFormulaBasedTiming {
  /** Byte 0 bits 2:0 — CVT formula (0 = standard blanking, 1 = RB v1.1+, 2 = RB v2; 3-7 reserved). */
  formula: number;
  /** Byte 0 bit 4 — true = refresh × (1000/1001) (NTSC pull-down) supported. */
  ntscPullDown: boolean;
  /** Byte 0 bits 6:5 — 3D stereo support (0=mono, 1=stereo, 2=user action, 3=reserved). */
  stereo: number;
  /** Bytes 1-2 — horizontal active pixels (1 + raw16). */
  horizontalActive: number;
  /** Bytes 3-4 — vertical active lines (1 + raw16). */
  verticalActive: number;
  /** Byte 5 — refresh rate in Hz (1 + raw, range 1-256). */
  refreshRateHz: number;
}

export interface DisplayIdTypeIXFormulaBasedTimingBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.TypeIXFormulaBasedTiming;
  timings: DisplayIdTypeIXFormulaBasedTiming[];
}

export interface DisplayIdDynamicVideoTimingRangeLimitsBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits;
  minimumPixelClockKHz: number;
  maximumPixelClockKHz: number;
  minimumHorizontalFrequencyHz: number;
  maximumHorizontalFrequencyHz: number;
  minimumVerticalFrequencyHz: number;
  maximumVerticalFrequencyHz: number;
  seamlessDynamicVideoTiming: boolean;
}

/**
 * Additional color space / EOTF combination (DisplayID 2.0 §4.5, Table 4-27).
 * One byte: bits 3:0 = EOTF, bits 7:4 = color space.
 */
export interface DisplayIdColorSpaceEotfCombination {
  /** bits 7:4 — 0=undefined, 1=sRGB, 2=BT.601, 3=BT.709, 4=Adobe RGB, 5=DCI-P3, 6=BT.2020, 7=Custom (8-15 reserved). */
  colorSpace: number;
  /** bits 3:0 — 0=undefined, 1=sRGB, 2=BT.601, 3=BT.1886, 4=Adobe RGB, 5=DCI-P3, 6=BT.2020, 7=Gamma function, 8=SMPTE ST 2084, 9=Hybrid Log, 10=Custom (11-15 reserved). */
  eotf: number;
}

/**
 * DisplayID 2.0 §4.5 Display Interface Features Data Block (tag 0x26).
 *
 * Variable 9+N byte payload per Table 4-23 (N = number of additional color
 * space/EOTF combinations, 0-7). Field bit layouts per Tables 4-24..4-27 and
 * edid-decode parse_displayid_interface_features
 * (parse-displayid-block.cpp:1298-1353). Reserved bits and any bytes past
 * 9+N are preserved in `trailing` for byte-exact round-trip.
 */
export interface DisplayIdDisplayInterfaceFeaturesBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.DisplayInterfaceFeatures;
  /** payload[0] bits 0-5: 6/8/10/12/14/16 bpc for RGB encoding. */
  rgbColorDepths: number[];
  /** payload[1] bits 0-5: 6/8/10/12/14/16 bpc for YCbCr 4:4:4 encoding. */
  ycbcr444ColorDepths: number[];
  /** payload[2] bits 0-4: 8/10/12/14/16 bpc for YCbCr 4:2:2 encoding. */
  ycbcr422ColorDepths: number[];
  /** payload[3] bits 0-4: 8/10/12/14/16 bpc for YCbCr 4:2:0 encoding. */
  ycbcr420ColorDepths: number[];
  /** payload[4]: min pixel rate for YCbCr 4:2:0 = 74.25 × this MHz; 0 = all DisplayID-exposed modes. */
  ycbcr420MinPixelRateMultiplier: number;
  /** payload[5] bits 7/6/5: 32/44.1/48 kHz audio sample rates (bits 4:0 reserved). */
  audioSampleRates: {
    sr32kHz: boolean;
    sr44_1kHz: boolean;
    sr48kHz: boolean;
  };
  /** payload[6] bits 0-6: standard color space/EOTF combination 1 (bit 7 reserved). */
  colorSpaceEotfStandard1: {
    srgb: boolean;
    bt601: boolean;
    bt709Bt1886: boolean;
    adobeRgb: boolean;
    dciP3: boolean;
    bt2020: boolean;
    bt2020St2084: boolean;
  };
  /** payload[9..]: additional color space/EOTF combinations (N entries, 0-7). */
  additionalColorSpaceEotfCombinations: DisplayIdColorSpaceEotfCombination[];
  /** bytes past 9+N (and reserved byte 0Ah / reserved bits), preserved verbatim. */
  trailing: Uint8Array;
}

/**
 * One 3D Timing Descriptor entry inside a Stereo Display Interface block
 * (DisplayID 2.0 §4.6, Table 4-28 "3D Timing Descriptor"). Present only when
 * the block's 3D Stereo Timing Support field lists timing codes.
 */
export interface DisplayIdStereoTimingCodeDescriptor {
  /** Header bits 7:6 — 0=DMT, 1=CTA VIC, 2=HDMI VIC, 3=reserved. */
  type: number;
  /** 1-byte timing codes (M entries, 0-31). */
  timingCodes: number[];
}

/**
 * DisplayID 2.0 timing-code type labels for the 2-bit code shared by the
 * Stereo Display Interface 3D Timing Descriptor (§4.6 Table 4-28, header bits
 * 7:6) and the Type VIII Enumerated Timing Code block (§4.3.2, header flags
 * bits 7:6). Index = on-the-wire code: 0=DMT, 1=CTA VIC, 2=HDMI VIC, 3=reserved.
 */
export const DISPLAY_ID_TIMING_CODE_TYPE_LABELS: readonly string[] = [
  'DMT', 'CTA VIC', 'HDMI VIC', 'Reserved',
];

/**
 * DisplayID 2.0 §4.6 Stereo Display Interface Data Block (tag 0x27).
 *
 * Payload layout (offsets relative to the payload, i.e. spec offset + 03h):
 * - payload[0] = Number of Bytes in Stereo Interface Method (N+1, where N is
 *   the number of method-specific parameter bytes).
 * - payload[1] = Stereo Interface Method Code (0x00 Frame/Field Sequential,
 *   0x01 Side-by-side, 0x02 Pixel-interleaved, 0x03 Dual Interface,
 *   0x04 Multi-view, 0x05 Stacked Frame, 0xFF Proprietary; 0x06-0xFE reserved).
 * - payload[2..2+N-1] = method-specific parameters (raw bytes).
 * - When the 3D Stereo Timing Support field (header byte 01h bits 7:6) is 01b
 *   or 11b, a sequence of 3D Timing Descriptor entries follows the method
 *   region (see DisplayIdStereoTimingCodeDescriptor).
 *
 * The 3D Stereo Timing Support field lives in the block header revision/flags
 * byte (offset 01h), which the generic decoder exposes as `flags`
 * (flags = byte >> 3). `timingSupport` is derived from it for convenience:
 * (flags >> 3) & 0x03.
 */
export interface DisplayIdStereoDisplayInterfaceBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.StereoDisplayInterface;
  /** Header byte 01h bits 7:6 — 3D Stereo Timing Support (0-3). */
  timingSupport: number;
  /** payload[1] — Stereo Interface Method Code. */
  methodCode: number;
  /** payload[2..] — method-specific parameter bytes (N = payload[0] - 1). */
  methodParameters: Uint8Array;
  /** 3D Timing Descriptor entries (present when timingSupport lists codes). */
  stereoTimingCodeDescriptors: DisplayIdStereoTimingCodeDescriptor[];
  /** Bytes past the method region and last full timing descriptor, preserved. */
  trailing: Uint8Array;
}

/**
 * DisplayID 2.0 §4.7 Tiled Display Topology Data Block (tag 0x28).
 *
 * Fixed 22-byte payload (Table 4-37). The four topology/location fields are
 * 6-bit values (0-63) packed across payload[1..3]; the model exposes them as
 * human 1-based values (1-64), storing value-1 on encode. Tile sizes are
 * 16-bit values exposed as human pixel counts (1-65536), storing value-1.
 */
export interface DisplayIdTiledDisplayTopologyBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.TiledDisplayTopology;
  // payload[0] — Tiled Display and Tile Capabilities (Table 4-38)
  /** bits 2:0 — single-tile behavior (0=undefined, 1=at location, 2=scaled to fit, 3=cloned). */
  singleTileBehavior: number;
  /** bits 4:3 — subset-tile behavior (0=undefined, 1=at location). */
  subsetTileBehavior: number;
  /** bit 6 — bezel information descriptor present. */
  bezelInfoPresent: boolean;
  /** bit 7 — single physical display enclosure (else multiple). */
  singleEnclosure: boolean;
  // payload[1..3] — Tiled Display Topology & Tile Location (Table 4-39), human 1-64
  /** 1-64 (stored as 6-bit value-1). */
  tileCountHorizontal: number;
  /** 1-64 (stored as 6-bit value-1). */
  tileCountVertical: number;
  /** 1-64 (stored as 6-bit value-1). */
  tileLocationHorizontal: number;
  /** 1-64 (stored as 6-bit value-1). */
  tileLocationVertical: number;
  // payload[4..7] — Tile Size (Table 4-40), human 1-65536
  /** 1-65536 pixels (stored as 16-bit value-1). */
  tileWidthPixels: number;
  /** 1-65536 lines (stored as 16-bit value-1). */
  tileHeightPixels: number;
  // payload[8..12] — Tile Pixel Multiplier & Bezel (Table 4-41)
  /** 0-255. Must be non-zero when bezelInfoPresent is true. */
  pixelMultiplier: number;
  /** 0-255 — top bezel size. */
  topBezelSize: number;
  /** 0-255 — bottom bezel size. */
  bottomBezelSize: number;
  /** 0-255 — right bezel size. */
  rightBezelSize: number;
  /** 0-255 — left bezel size. */
  leftBezelSize: number;
  // payload[13..21] — Tiled Display Topology ID (Table 4-42)
  /** 24-bit Manufacturer/Vendor ID (3 bytes, big-endian). */
  vendorOui: number;
  /** 16-bit Product ID Code (little-endian). */
  productId: number;
  /** 32-bit Serial Number (little-endian). 0 is reserved. */
  serialNumber: number;
}

export interface DisplayIdContainerIdBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.ContainerId;
  containerId: Uint8Array;
}

/**
 * VESA DisplayPort-specific vendor payload (DisplayID 2.0 Appendix B).
 * Parsed only when the Vendor-specific block's OUI is the VESA OUI 0x3a0292.
 * The vendor data after the 3-byte OUI is 2..4 bytes; fields beyond the two
 * mandatory bytes (dscBitsPerPixel) are present only when the payload is
 * long enough (payload length >= 7, i.e. 3 OUI + 4 vendor bytes).
 *
 * Cross-checked against edid-decode parse_displayid_vesa
 * (parse-displayid-block.cpp:1427).
 */
export interface DisplayIdVesaDisplayPortData {
  /** Data Structure Type: 0 = eDP, 1 = DP, 2-7 reserved (vendor[0] bits 2:0). */
  structureType: number;
  /** Default Colorspace/EOTF Handling: true = native per Display Parameters DB, false = sRGB (vendor[0] bit 7). */
  nativeColorspaceEotf: boolean;
  /** 0-15 — Number of Pixels in Hor Pix Cnt Overlapping an Adjacent Panel (vendor[1] bits 3:0). */
  horizontalOverlapPixels: number;
  /** Multi-SST Operation: 0 = Not Supported, 1 = Two Streams, 2 = Four Streams, 3 = Reserved (vendor[1] bits 6:5). */
  multiSstOperation: number;
  /** Pass-through timing target DSC bits per pixel (fractional). Present when payload length >= 7. */
  dscBitsPerPixel?: number;
  /** Vendor bytes beyond the modeled fields (preserved for lossless round-trip of unusual lengths). */
  trailing?: Uint8Array;
}

export interface DisplayIdVendorSpecificBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.VendorSpecific;
  /** 24-bit IEEE OUI (3 bytes, big-endian per DisplayID 2.0 §4.9). */
  ieeeOui: number;
  /** Parsed VESA DisplayPort payload; present only when ieeeOui === 0x3a0292 (VESA). */
  vesaDisplayPort?: DisplayIdVesaDisplayPortData;
}

export interface DisplayIdCtaBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.CtaDisplayId;
  /** Raw embedded CTA short-block stream (the bytes as decoded; kept for the UI hex editor). */
  ctaPayload: Uint8Array;
  /** Parsed embedded CTA-861 short data blocks (DisplayID 2.0 §4.10). */
  dataBlocks: CEADataBlock[];
  /** Unparsed remainder of a truncated/malformed stream (preserved for a lossless round-trip). */
  trailing: Uint8Array;
}

export type KnownDisplayIdDataBlock =
  | DisplayIdProductIdentificationBlock
  | DisplayIdDisplayParametersBlock
  | DisplayIdTypeVIIDetailedTimingBlock
  | DisplayIdTypeVIIIEnumeratedTimingCodeBlock
  | DisplayIdTypeIXFormulaBasedTimingBlock
  | DisplayIdDynamicVideoTimingRangeLimitsBlock
  | DisplayIdDisplayInterfaceFeaturesBlock
  | DisplayIdStereoDisplayInterfaceBlock
  | DisplayIdTiledDisplayTopologyBlock
  | DisplayIdContainerIdBlock
  | DisplayIdTypeXTimingBlock
  | DisplayIdAdaptiveSyncBlock
  | DisplayIdArvrHmdBlock
  | DisplayIdArvrLayerBlock
  | DisplayIdBrightnessLuminanceRangeBlock
  | DisplayIdVendorSpecificBlock
  | DisplayIdCtaBlock;

// ---------------------------------------------------------------------------
// DisplayID 1.x data blocks.
//
// DisplayID 1.x (VESA DisplayID v1.0–v1.3) reuses the same section header and
// 3-byte block framing as 2.0, but uses a different block-tag space (0x00–0x13
// + 0x7f vendor) and different per-block field layouts. edid-decode parses both
// versions in one walker (`parse_displayid_block`, parse-displayid-block.cpp);
// these types mirror the v1.x arm. A v1.x section carries v1.x blocks in
// `DisplayIdSection.blocks` (the base `DisplayIdDataBlock` type covers both).
// Only the four most common v1.x blocks are modeled in this first increment;
// every other v1.x tag falls through to the raw generic carrier (byte-exact).
// ---------------------------------------------------------------------------

/** DisplayID 1.x data block tags (edid-decode parse-displayid-block.cpp:1615). */
export const DISPLAY_ID_V1_BLOCK_TAGS = {
  /** Product Identification Data Block. */
  ProductIdentification: 0x00,
  /** Display Parameters Data Block (fixed 12-byte payload). */
  DisplayParameters: 0x01,
  /** Video Timing Modes Type 1 — Detailed Timings (20-byte DTD descriptors). */
  TypeIDetailedTiming: 0x03,
  /** Tiled Display Topology Data Block (fixed 22-byte payload). */
  TiledDisplayTopology: 0x12,
  /** Vendor-Specific Data Block (3-byte OUI + vendor payload). */
  VendorSpecific: 0x7f,
} as const;

/**
 * DisplayID 1.x Product Identification Data Block (tag 0x00).
 *
 * Variable payload: 12 fixed bytes + an ASCII product-name string. Unlike the
 * v2.0 block (tag 0x20), v1.x carries a 3-character ASCII vendor ID (not an
 * IEEE OUI). Field layout per edid-decode parse_displayid_product_id
 * (parse-displayid-block.cpp:79), `version < 0x20` arm:
 *   payload[0..2]  Vendor ID (3 ASCII chars)
 *   payload[3..4]  Product Code (LE 16-bit)
 *   payload[5..8]  Serial Number (LE 32-bit; 0 = not specified)
 *   payload[9]     Week of manufacture (0xff = model year; 0 = not specified)
 *   payload[10]    Year of manufacture (2000 + byte; 0 = not specified)
 *   payload[11]    Product-name string length N
 *   payload[12..]  Product name (N ASCII bytes)
 */
export interface DisplayIdV1ProductIdentificationBlock extends DisplayIdDataBlock {
  tag: typeof DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification;
  /** 3-character ASCII vendor ID (payload[0..2]). */
  vendorId: string;
  /** payload[3..4] LE — manufacturer product code. */
  productCode: number;
  /** payload[5..8] LE 32-bit — serial number (0 = not specified). */
  serialNumber: number;
  /** payload[9] — week of manufacture; omitted when 0 (not specified) or 0xff (model year). */
  manufactureWeek?: number;
  /** 2000 + payload[10]; omitted when payload[10] === 0 (not specified). */
  year?: number;
  /** True when payload[9] === 0xff (the byte encodes a model year, not a manufacture date). */
  isModelYear: boolean;
  /** payload[11] — product-name string length N. */
  productNameLength: number;
  /** payload[12..12+N-1] — product name (ASCII, preserved verbatim). */
  productNameBytes: Uint8Array;
  /** Decoded ASCII product name. */
  productName: string;
}

/**
 * DisplayID 1.x Display Parameters Data Block (tag 0x01, fixed 12-byte payload).
 *
 * Field layout per edid-decode parse_displayid_parameters
 * (parse-displayid-block.cpp:139). Raw wire values are stored; the UI derives
 * display units (image size / 10 mm, gamma/aspect = (100 + byte) / 100,
 * color depth = nibble + 1).
 *   payload[0..1]  Horizontal image size (LE 16-bit, 0.1 mm units)
 *   payload[2..3]  Vertical image size (LE 16-bit, 0.1 mm units)
 *   payload[4..5]  Horizontal native pixel count (LE 16-bit)
 *   payload[6..7]  Vertical native pixel count (LE 16-bit)
 *   payload[8]     Feature support flags (8-bit bitfield)
 *   payload[9]     Gamma (0xff = not defined, else (100 + byte) / 100)
 *   payload[10]    Aspect ratio ((100 + byte) / 100)
 *   payload[11]    bits 3:0 = native dynamic color depth - 1; bits 7:4 = overall - 1
 */
export interface DisplayIdV1DisplayParametersBlock extends DisplayIdDataBlock {
  tag: typeof DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters;
  horizontalImageSizeTenthsMm: number;
  verticalImageSizeTenthsMm: number;
  horizontalPixelCount: number;
  verticalPixelCount: number;
  featureSupportFlags: number;
  gamma: number;
  aspectRatio: number;
  /** payload[11] bits 3:0 — native color depth code (depth = code + 1). */
  nativeColorDepthCode: number;
  /** payload[11] bits 7:4 — overall color depth code (depth = code + 1). */
  overallColorDepthCode: number;
}

/**
 * DisplayID 1.x Type 1 Detailed Timings Data Block (tag 0x03).
 *
 * A stream of 20-byte Detailed Timing descriptors. The descriptor layout is
 * identical to the v2.0 Type VII block (tag 0x22) — both are the standard
 * 20-byte DTD — so the descriptor reuses `DisplayIdTypeVIIDetailedTiming`. The
 * only difference is the pixel-clock resolution: Type 1 is 10 kHz
 * (`pixelClockKHz = 10 * (1 + raw24)`) whereas Type VII is 1 kHz
 * (`1 + raw24`). The codec applies the 10× scaling on decode and reverses it
 * on encode, so `pixelClockKHz` always holds the physical pixel clock in kHz.
 * edid-decode parse_displayid_type_1_7_timing (parse-displayid-block.cpp:224).
 */
export interface DisplayIdV1TypeIDetailedTimingBlock extends DisplayIdDataBlock {
  tag: typeof DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming;
  timings: DisplayIdTypeVIIDetailedTiming[];
}

/**
 * DisplayID 1.x Tiled Display Topology Data Block (tag 0x12, fixed 22 bytes).
 *
 * Bit-packing is identical to the v2.0 block (tag 0x28); the only field
 * difference is the topology ID: v1.x carries a 3-character ASCII vendor ID
 * (payload[13..15]) where v2.0 carries a big-endian IEEE OUI. Tile counts and
 * locations are modeled as human 1-based values (1-64) storing value-1, and
 * tile sizes as human pixel counts (1-65536) storing value-1 — matching the
 * v2.0 codec convention so the two versions share one model shape.
 * edid-decode parse_displayid_tiled_display_topology(x, is_v2=false).
 */
export interface DisplayIdV1TiledDisplayTopologyBlock extends DisplayIdDataBlock {
  tag: typeof DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology;
  singleTileBehavior: number;
  subsetTileBehavior: number;
  bezelInfoPresent: boolean;
  singleEnclosure: boolean;
  /** 1-64 (stored as 6-bit value-1). */
  tileCountHorizontal: number;
  /** 1-64 (stored as 6-bit value-1). */
  tileCountVertical: number;
  /** 1-64 (stored as 6-bit value-1). */
  tileLocationHorizontal: number;
  /** 1-64 (stored as 6-bit value-1). */
  tileLocationVertical: number;
  /** 1-65536 pixels (stored as 16-bit value-1). */
  tileWidthPixels: number;
  /** 1-65536 lines (stored as 16-bit value-1). */
  tileHeightPixels: number;
  pixelMultiplier: number;
  topBezelSize: number;
  bottomBezelSize: number;
  rightBezelSize: number;
  leftBezelSize: number;
  /** 3-character ASCII vendor ID (payload[13..15]). */
  vendorId: string;
  /** payload[16..17] LE 16-bit. */
  productId: number;
  /** payload[18..21] LE 32-bit. */
  serialNumber: number;
}

export type KnownDisplayIdV1DataBlock =
  | DisplayIdV1ProductIdentificationBlock
  | DisplayIdV1DisplayParametersBlock
  | DisplayIdV1TypeIDetailedTimingBlock
  | DisplayIdV1TiledDisplayTopologyBlock;

export const DISPLAY_ID_V1_BLOCK_LABELS: Record<number, string> = {
  [DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification]: 'Product Identification',
  [DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters]: 'Display Parameters',
  [DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming]: 'Type 1 Detailed Timings',
  [DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology]: 'Tiled Display Topology',
  [DISPLAY_ID_V1_BLOCK_TAGS.VendorSpecific]: 'Vendor-Specific',
};

export const DISPLAY_ID_BLOCK_LABELS: Record<DisplayIdDataBlockTag, string> = {
  [DisplayIdDataBlockTag.ProductIdentification]: 'Product Identification',
  [DisplayIdDataBlockTag.DisplayParameters]: 'Display Parameters',
  [DisplayIdDataBlockTag.TypeVIIDetailedTiming]: 'Type VII Detailed Timing',
  [DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode]: 'Type VIII Enumerated Timing Code',
  [DisplayIdDataBlockTag.TypeIXFormulaBasedTiming]: 'Type IX Formula-Based Timing',
  [DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits]: 'Dynamic Video Timing Range Limits',
  [DisplayIdDataBlockTag.DisplayInterfaceFeatures]: 'Display Interface Features',
  [DisplayIdDataBlockTag.StereoDisplayInterface]: 'Stereo Display Interface',
  [DisplayIdDataBlockTag.TiledDisplayTopology]: 'Tiled Display Topology',
  [DisplayIdDataBlockTag.ContainerId]: 'ContainerID',
  [DisplayIdDataBlockTag.TypeXTiming]: 'Type X Timing',
  [DisplayIdDataBlockTag.AdaptiveSync]: 'Adaptive Sync',
  [DisplayIdDataBlockTag.ArvrHmd]: 'AR/VR HMD',
  [DisplayIdDataBlockTag.ArvrLayer]: 'AR/VR Layer',
  [DisplayIdDataBlockTag.BrightnessLuminanceRange]: 'Brightness Luminance Range',
  [DisplayIdDataBlockTag.VendorSpecific]: 'Vendor-Specific',
  [DisplayIdDataBlockTag.CtaDisplayId]: 'CTA DisplayID',
};

export function createDefaultDisplayIdBlock(tag: DisplayIdDataBlockTag): KnownDisplayIdDataBlock {
  switch (tag) {
    case DisplayIdDataBlockTag.ProductIdentification:
      return {
        ...createDefaultBlock(tag, 12),
        tag,
        ieeeOui: 0,
        productId: 0,
        isModelYear: false,
        productNameLength: 0,
        productNameBytes: new Uint8Array(0),
        productName: '',
      };
    case DisplayIdDataBlockTag.DisplayParameters:
      return {
        ...createDefaultBlock(tag, 29),
        tag,
        imageSizeInMm: false,
        horizontalImageSizeMm: 0,
        verticalImageSizeMm: 0,
        horizontalPixelCount: 0,
        verticalPixelCount: 0,
        scanOrientation: 0,
        luminanceInformation: 0,
        colorInformationCie1976: false,
        audioSpeakerNotIntegrated: false,
        primary1: { x: 0, y: 0 },
        primary2: { x: 0, y: 0 },
        primary3: { x: 0, y: 0 },
        whitePoint: { x: 0, y: 0 },
        maxLuminanceFullCoverage: 0,
        maxLuminance10PercentRect: 0,
        minLuminance: 0,
        nativeColorDepth: 0,
        displayDeviceTechnology: 0,
        displayDeviceThemePreference: false,
        gammaEotf: 0xff,
      };
    case DisplayIdDataBlockTag.TypeVIIDetailedTiming:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        timings: [],
      };
    case DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        codeType: 0,
        codeSize: 1,
        timingCodes: [],
      };
    case DisplayIdDataBlockTag.TypeIXFormulaBasedTiming:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        timings: [],
      };
    case DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits:
      return {
        ...createDefaultBlock(tag, 13),
        tag,
        minimumPixelClockKHz: 0,
        maximumPixelClockKHz: 0,
        minimumHorizontalFrequencyHz: 0,
        maximumHorizontalFrequencyHz: 0,
        minimumVerticalFrequencyHz: 0,
        maximumVerticalFrequencyHz: 0,
        seamlessDynamicVideoTiming: false,
      };
    case DisplayIdDataBlockTag.DisplayInterfaceFeatures:
      return {
        ...createDefaultBlock(tag, 9),
        tag,
        rgbColorDepths: [8],
        ycbcr444ColorDepths: [],
        ycbcr422ColorDepths: [],
        ycbcr420ColorDepths: [],
        ycbcr420MinPixelRateMultiplier: 0,
        audioSampleRates: {
          sr32kHz: false,
          sr44_1kHz: false,
          sr48kHz: false,
        },
        colorSpaceEotfStandard1: {
          srgb: false,
          bt601: false,
          bt709Bt1886: false,
          adobeRgb: false,
          dciP3: false,
          bt2020: false,
          bt2020St2084: false,
        },
        additionalColorSpaceEotfCombinations: [],
        trailing: new Uint8Array(),
      };
    case DisplayIdDataBlockTag.StereoDisplayInterface:
      return {
        ...createDefaultBlock(tag, 2),
        tag,
        payload: new Uint8Array([0x01, 0xff]),
        timingSupport: 0,
        methodCode: 0xff,
        methodParameters: new Uint8Array(),
        stereoTimingCodeDescriptors: [],
        trailing: new Uint8Array(),
      };
    case DisplayIdDataBlockTag.TiledDisplayTopology:
      return {
        ...createDefaultBlock(tag, 22),
        tag,
        singleTileBehavior: 0,
        subsetTileBehavior: 0,
        bezelInfoPresent: false,
        singleEnclosure: true,
        tileCountHorizontal: 1,
        tileCountVertical: 1,
        tileLocationHorizontal: 1,
        tileLocationVertical: 1,
        tileWidthPixels: 1920,
        tileHeightPixels: 1080,
        pixelMultiplier: 0,
        topBezelSize: 0,
        bottomBezelSize: 0,
        rightBezelSize: 0,
        leftBezelSize: 0,
        vendorOui: 0,
        productId: 0,
        serialNumber: 0,
      };
    case DisplayIdDataBlockTag.ContainerId:
      return {
        ...createDefaultBlock(tag, 16),
        tag,
        containerId: new Uint8Array(16),
      };
    case DisplayIdDataBlockTag.TypeXTiming:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        timings: [],
        descriptorSize: 6,
      };
    case DisplayIdDataBlockTag.AdaptiveSync:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        descriptors: [],
      };
    case DisplayIdDataBlockTag.ArvrHmd:
      // 79-byte HMD block; structured fields default to all-zero (a zero payload
      // decodes to zero/false for every field). Cast avoids enumerating ~40 fields.
      return { ...createDefaultBlock(tag, 79), tag } as DisplayIdArvrHmdBlock;
    case DisplayIdDataBlockTag.ArvrLayer:
      // 20-byte Layer block; same zero-default rationale as the HMD case.
      return { ...createDefaultBlock(tag, 20), tag } as DisplayIdArvrLayerBlock;
    case DisplayIdDataBlockTag.BrightnessLuminanceRange:
      return {
        ...createDefaultBlock(tag, 6),
        tag,
        minSdrLuminance: 0,
        maxSdrLuminance: 0,
        maxBoostSdrLuminance: 0,
      };
    case DisplayIdDataBlockTag.VendorSpecific:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        ieeeOui: 0,
      };
    case DisplayIdDataBlockTag.CtaDisplayId:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        ctaPayload: new Uint8Array(0),
        dataBlocks: [],
        trailing: new Uint8Array(0),
      };
  }
}

export interface DisplayIdSection {
  version: number;
  revision: number;
  versionByte: number;
  bytesInSection: number;
  totalLength: number;
  primaryUseCase: number;
  extensionCount: number;
  blocks: DisplayIdDataBlock[];
  /**
   * Count of trailing 0x00 fill bytes after the last block. Used by the v2.0
   * codec, where any 0x00 byte inside the data-block area is the fill marker.
   */
  fillBytes: number;
  /**
   * Verbatim trailing bytes after the last decoded block (v1.x). The v1.x
   * walker stops at a `tag===0 && len===0` end-marker or at a truncated/over-
   * running block; the bytes from there to the section end (including the
   * marker and any non-zero leftover) are preserved here so the section
   * round-trips byte-identically regardless of fill content. When present,
   * `encodeDisplayIdSection` writes these bytes verbatim; otherwise the v2.0
   * `fillBytes` count of 0x00 is written.
   */
  fillBytesRaw?: Uint8Array;
  checksum: number;
  isChecksumValid: boolean;
}

export class DisplayIdDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisplayIdDecodeError';
  }
}

function createDefaultBlock(tag: DisplayIdDataBlockTag, payloadLength: number): DisplayIdDataBlock {
  return {
    tag,
    revision: 0,
    flags: 0,
    payloadLength,
    payload: new Uint8Array(payloadLength),
  };
}
