// VIC (Video Identification Code) Table
export { 
  VIC_TABLE, 
  getVICDefinition, 
  getVICsForResolution, 
  getVICDescription,
  isVIC4K,
  isVIC8K,
  analyzeDetailedTimingAgainstCTA,
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
  getAudioFormatName,
  getAudioFormatShortName,
  getExtendedAudioFormatName,
  getSamplingRatesString,
  getBitDepthsString,
} from './audio-format-codes';
export type { AudioFormatDefinition } from './audio-format-codes';

// CTA-861-G Extended Tag Data Blocks
export { decodeExtendedDataBlock, encodeExtendedDataBlock } from './cta-extended-blocks';
export type {
  ExtendedTagCode,
  ExtendedDataBlock,
  CTAExtendedDataBlock,
  VideoCapabilityDataBlock,
  ColorimetryDataBlock,
  HDRStaticMetadataDataBlock,
  HDRDynamicMetadataDataBlock,
  VideoFormatPreferenceDataBlock,
  YCbCr420VideoDataBlock,
  YCbCr420CapabilityMapDataBlock,
  VendorSpecificVideoDataBlock,
  VendorSpecificAudioDataBlock,
  RoomConfigurationDataBlock,
  SpeakerLocationDataBlock,
  RoomEnvironmentDataBlock,
  InfoFrameDataBlock,
} from './cta-extended-blocks';

// CEA/CTA Extension Block
export {
  ExtensionBlockParser,
  findHDMIBlock,
  findHDMIForumBlock,
  getSupportedVICs,
  getHDMI21Features
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
  HDMIForumVSDB,
  MicrosoftHMDVSDB,
  AMDFreeSyncVSDB,
  HDR10PlusVSDB,
  MHLVSDB,
  VendorSpecificDataBlock,
  VendorSpecificDecoded,
} from './vsdb/types';
export { OUI } from './vsdb/types';
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

// Vendor-Specific Video Data Blocks (tag 0x07 ext 0x01, e.g., Dolby Vision)
export type { DolbyVSDB } from './vsvdb/types';
export {
  decodeVSVDB,
  reassembleVsvdbBlock,
  findVSVDBs,
  VENDOR_VSVDB_DECODERS,
  VENDOR_VSVDB_ENCODERS,
} from './vsvdb/registry';
export { DolbyVSDBDecoder, DolbyVSDBEncoder, DOLBY_VSDB_DEFAULT } from './vsvdb/dolby';
