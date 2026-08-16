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

export interface DisplayIdDisplayParametersBlock extends DisplayIdDataBlock {
  tag: DisplayIdDataBlockTag.DisplayParameters;
  horizontalImageSizeMm: number;
  verticalImageSizeMm: number;
  nativeColorBitDepth: number;
  dynamicRange: number;
  audioSupport: boolean;
  separateAudioInputs: boolean;
  fixedPixelFormat: boolean;
  fixedTiming: boolean;
  deinterlacing: boolean;
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
        ...createDefaultBlock(tag, 7),
        tag,
        horizontalImageSizeMm: 0,
        verticalImageSizeMm: 0,
        nativeColorBitDepth: 8,
        dynamicRange: 0,
        audioSupport: false,
        separateAudioInputs: false,
        fixedPixelFormat: false,
        fixedTiming: false,
        deinterlacing: false,
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
