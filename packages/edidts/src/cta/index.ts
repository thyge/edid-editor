// VIC (Video Identification Code) Table
export {
  VIC_TABLE,
  getVICDefinition,
  isKnownVIC,
  getVICsForResolution,
  getVICDescription,
  isVIC4K,
  isVIC8K,
  analyzeDetailedTimingAgainstCTA,
  generateDetailedTimingFromVIC,
} from './vic-table';
export type { 
  VICDefinition,
  CTAAnalysisOptions,
  CTAAnalysisResult,
  CTAComparisonResult,
  CTAComparisonDifferences,
  CTATolerances,
} from './vic-table';

// Audio Format Codes
export {
  AUDIO_FORMAT_CODES,
  EXTENDED_AUDIO_FORMAT_CODES,
  AUDIO_SAMPLING_RATE_OPTIONS,
  AUDIO_BIT_DEPTH_OPTIONS,
  getAudioFormatName,
  getAudioFormatShortName,
  getExtendedAudioFormatName,
  getSamplingRatesString,
  getBitDepthsString,
} from './audio-format-codes';
export type { AudioFormatDefinition } from './audio-format-codes';

// CTA-861-G Extended Tag Data Blocks — the non-family blocks and the
// tag-keyed codec registry live in cta-extended-blocks.ts; the VCDB-family
// blocks (Video Capability, VSVDB, HDR Static, Video Format Preference,
// YCbCr 4:2:0 Video/Capability Map, VSADB, InfoFrame) live in vcdb/ (TASK-115).
export { decodeExtendedDataBlock, encodeExtendedDataBlock } from './cta-extended-blocks';
export {
  SPEAKER_PLACEMENT,
  SPEAKER_ALLOCATION_BITS,
  unifySpeakerLayout,
  COLORIMETRY_FLAGS,
  VESA_INTERFACE_CATEGORIES,
  VESA_CONTENT_PROTECTION,
  VESA_ORIENTATION,
  VESA_ROTATION,
  VESA_SUBPIXEL_INFORMATION,
  VESA_DITHERING,
  VESA_FRAME_RATE_CONVERSION,
  VESA_RESPONSE_TIME_DIRECTION,
} from './cta-extended-blocks';
export type {
  ExtendedTagCode,
  ExtendedDataBlock,
  CTAExtendedDataBlock,
  ColorimetryDataBlock,
  HDRDynamicMetadataDataBlock,
  RoomConfigurationDataBlock,
  SpeakerLocationDataBlock,
  RoomEnvironmentDataBlock,
  VESAVideoDisplayDeviceDataBlock,
  VESAVideoTimingBlockExtensionDataBlock,
  VESAChromaticity,
  SpeakerPlacement,
  SpeakerAllocationBit,
  UnifiedSpeaker,
} from './cta-extended-blocks';
export { SCAN_BEHAVIOR_OPTIONS } from './vcdb/video-capability';
export type { VideoCapabilityDataBlock, ScanBehavior } from './vcdb/video-capability';
export { EOTF_FLAGS } from './vcdb/hdr-static';
export type { HDRStaticMetadataDataBlock } from './vcdb/hdr-static';
export type { VideoFormatPreferenceDataBlock } from './vcdb/video-format-preference';
export type { YCbCr420VideoDataBlock } from './vcdb/ycbcr420-video';
export type { YCbCr420CapabilityMapDataBlock } from './vcdb/ycbcr420-capability-map';
export type { InfoFrameDataBlock } from './vcdb/infoframe';
export type { VendorSpecificVideoDataBlock } from './vcdb/vendor-specific-video';
export type { VendorSpecificAudioDataBlock, VSADBVendorDecoded } from './vcdb/vsadb';

// CEA/CTA Extension Block
export {
  ExtensionBlockParser,
  findHDMIBlock,
  findHDMIForumBlock,
  getSupportedVICs,
  getHDMI21Features,
  CEA_DATA_BLOCK_LABELS,
  getCEADataBlockLabel,
  VESA_TRANSFER_TYPE_OPTIONS,
} from './extension-block';
export type {
  ExtensionBlock,
  ExtensionTag,
  BaseExtensionBlock,
  CEAExtensionBlock,
  DisplayIdExtensionBlock,
  CEADataBlock,
  CEADataBlockTag,
  AudioDataBlock,
  VideoDataBlock,
  SpeakerAllocationBlock,
  VESADisplayTransferCharacteristicBlock,
  CEADetailedTiming,
  VTBDetailedTiming,
  VTBExtensionBlock,
  BlockMapExtension,
} from './extension-block';

// Video Timing Block (VTB, tag 0x10) — CTA-internal
export {
  decodeVideoTimingBlock,
  encodeVideoTimingBlock,
} from './video-timing-block';
export type {
  VideoTimingBlock,
  VideoTimingBlockAspectRatio,
  VideoTimingBlockBase,
  VideoTimingBlockCvtTiming,
  VideoTimingBlockDetailedTiming,
  VideoTimingBlockInput,
  VideoTimingBlockStandardTiming,
} from './video-timing-block';

// Vendor-Specific Data Blocks (tag 0x03)
export type {
  HDMI14VSDB,
  HdmiLatency,
  Hdmi3DMode,
  Hdmi3DStructure,
  HdmiImageSize,
  HDMIForumVSDB,
  MicrosoftHMDVSDB,
  AMDFreeSyncVSDB,
  MHLVSDB,
  VendorSpecificDataBlock,
  VendorSpecificDecoded,
} from './vsdb/types';
export { OUI } from './vsdb/types';
export {
  HDMI_3D_MODE_OPTIONS,
  HDMI_IMAGE_SIZE_OPTIONS,
  HDMI_FRL_RATE_OPTIONS,
  getHdmiFrlRateLabel,
} from './vsdb/types';
export { MICROSOFT_HMD_USE_CASES } from './vsdb/microsoft-hmd';
// The VSDB `decodeVendorSpecificBlock` is re-exported as
// `decodeVsdbBlock` to avoid colliding with the DisplayID module's
// `decodeVendorSpecificBlock` (which operates on a `DisplayIdDataBlock`).
export {
  decodeVendorSpecificBlock as decodeVsdbBlock,
  reassembleVsdbBlock,
  findVSDBs,
  findVSDBByKind,
  VENDOR_DECODERS,
  VENDOR_ENCODERS,
} from './vsdb/registry';
export type { VendorDecoder, VendorEncoder } from './vsdb/registry';

// Vendor-Specific Video Data Blocks (tag 0x07 ext 0x01, e.g., Dolby Vision) —
// part of the VCDB family (vcdb/, TASK-115)
export type { DolbyVSDB, HDR10PlusVSDB, VSVDBVendorDecoded } from './vcdb/vsvdb/types';
export {
  decodeVSVDB,
  reassembleVsvdbBlock,
  findVSVDBs,
  VENDOR_VSVDB_DECODERS,
  VENDOR_VSVDB_ENCODERS,
} from './vcdb/vsvdb/registry';
export { DolbyVSDBDecoder, DolbyVSDBEncoder, DOLBY_VSDB_DEFAULT } from './vcdb/vsvdb/dolby';

// CEA data-block default-value factory
export { createDefaultCEADataBlock } from './default-blocks';
export type { CEADefaultBlockType } from './default-blocks';
