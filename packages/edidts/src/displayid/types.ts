import type { DisplayIdTypeXTimingBlock } from './type-x-timing';
import type { DisplayIdAdaptiveSyncBlock } from './adaptive-sync';
import type { DisplayIdArvrHmdBlock, DisplayIdArvrLayerBlock } from './ar-vr';
import type { DisplayIdBrightnessLuminanceRangeBlock } from './brightness-luminance';

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

export interface DisplayIdTypeVIIDetailedTiming {
  pixelClockKHz: number;
  horizontalActive: number;
  horizontalBlanking: number;
  horizontalSyncOffset: number;
  horizontalSyncWidth: number;
  verticalActive: number;
  verticalBlanking: number;
  verticalSyncOffset: number;
  verticalSyncWidth: number;
  preferred: boolean;
  interlaced: boolean;
}

export interface DisplayIdTypeVIIDetailedTimingBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.TypeVIIDetailedTiming;
  timings: DisplayIdTypeVIIDetailedTiming[];
}

export interface DisplayIdTypeVIIIEnumeratedTimingCodeBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode;
  timingCodes: number[];
}

export interface DisplayIdTypeIXFormulaBasedTiming {
  horizontalActive: number;
  verticalActive: number;
  refreshRateHz: number;
  preferred: boolean;
  reducedBlanking: boolean;
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

export interface DisplayIdDisplayInterfaceFeaturesBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.DisplayInterfaceFeatures;
  supportedColorDepths: number[];
  rgb444: boolean;
  ycbcr444: boolean;
  ycbcr422: boolean;
  ycbcr420: boolean;
  audioOnInterface: boolean;
  contentProtection: boolean;
}

export interface DisplayIdStereoDisplayInterfaceBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.StereoDisplayInterface;
  stereoSupported: boolean;
  stereoTypes: number[];
}

export interface DisplayIdTiledDisplayTopologyBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.TiledDisplayTopology;
  tileCountHorizontal: number;
  tileCountVertical: number;
  tileLocationHorizontal: number;
  tileLocationVertical: number;
  tileWidthPixels: number;
  tileHeightPixels: number;
}

export interface DisplayIdContainerIdBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.ContainerId;
  containerId: Uint8Array;
}

export interface DisplayIdVendorSpecificBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.VendorSpecific;
  ieeeOui?: number;
}

export interface DisplayIdCtaBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.CtaDisplayId;
  ctaPayload: Uint8Array;
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
        ...createDefaultBlock(tag, 4),
        tag,
        supportedColorDepths: [],
        rgb444: true,
        ycbcr444: false,
        ycbcr422: false,
        ycbcr420: false,
        audioOnInterface: false,
        contentProtection: false,
      };
    case DisplayIdDataBlockTag.StereoDisplayInterface:
      return {
        ...createDefaultBlock(tag, 2),
        tag,
        stereoSupported: false,
        stereoTypes: [],
      };
    case DisplayIdDataBlockTag.TiledDisplayTopology:
      return {
        ...createDefaultBlock(tag, 9),
        tag,
        tileCountHorizontal: 1,
        tileCountVertical: 1,
        tileLocationHorizontal: 0,
        tileLocationVertical: 0,
        tileWidthPixels: 0,
        tileHeightPixels: 0,
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
      };
    case DisplayIdDataBlockTag.CtaDisplayId:
      return {
        ...createDefaultBlock(tag, 0),
        tag,
        ctaPayload: new Uint8Array(0),
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
  fillBytes: number;
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
