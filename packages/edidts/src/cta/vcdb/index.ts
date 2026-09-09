// packages/edidts/src/cta/vcdb/index.ts

// VCDB family: the CTA-861 extended-tag blocks grouped under the
// Video Capability Data Block family in the left-nav taxonomy —
// Video Capability (0x00), VSVDB (0x01), HDR Static (0x06), Video Format
// Preference (0x0D), YCbCr 4:2:0 Video (0x0E) / Capability Map (0x0F),
// VSADB (0x11), and InfoFrame (0x20). The tag-0x03 VSDBs are NOT part of this
// family — they live in `cta/vsdb/`.

export type {
  VideoCapabilityDataBlock,
  ScanBehavior,
} from './video-capability';
export {
  SCAN_BEHAVIOR_OPTIONS,
  decodeVideoCapabilityBlock,
  encodeVideoCapabilityBlock,
} from './video-capability';

export type { VendorSpecificVideoDataBlock } from './vendor-specific-video';
export {
  decodeVendorSpecificVideoBlock,
  encodeVendorSpecificVideoBlock,
} from './vendor-specific-video';

export type { HDRStaticMetadataDataBlock } from './hdr-static';
export {
  EOTF_FLAGS,
  decodeHDRStaticMetadataBlock,
  encodeHDRStaticMetadataBlock,
} from './hdr-static';

export type { VideoFormatPreferenceDataBlock } from './video-format-preference';
export {
  decodeVideoFormatPreferenceBlock,
  encodeVideoFormatPreferenceBlock,
} from './video-format-preference';

export type { YCbCr420VideoDataBlock } from './ycbcr420-video';
export {
  decodeYCbCr420VideoBlock,
  encodeYCbCr420VideoBlock,
} from './ycbcr420-video';

export type { YCbCr420CapabilityMapDataBlock } from './ycbcr420-capability-map';
export {
  decodeYCbCr420CapabilityMapBlock,
  encodeYCbCr420CapabilityMapBlock,
} from './ycbcr420-capability-map';

export type {
  InfoFrameDataBlock,
} from './infoframe';
export {
  decodeInfoFrameBlock,
  encodeInfoFrameBlock,
} from './infoframe';

export type { VSADBVendorDecoded } from './vsadb';
export {
  decodeVSADB,
  encodeVSADB,
  reassembleVsadbBlock,
  findVSADBs,
} from './vsadb';