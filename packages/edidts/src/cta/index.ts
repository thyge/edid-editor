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
  CEADataBlock,
  CEADataBlockTag,
  AudioDataBlock,
  VideoDataBlock,
  VendorSpecificDataBlock,
  SpeakerAllocationBlock,
  VESADisplayTransferCharacteristicBlock,
  CEADetailedTiming,
  VTBDetailedTiming,
  VTBExtensionBlock,
  BlockMapExtension,
} from './extension-block';
