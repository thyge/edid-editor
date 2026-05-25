// Public API entry point for src/edidts/
// All external consumers (stores, components) should import from here.

// Top-level container
export {
  EEDID,
  ExtensionBlockParser,
} from "./eedid.ts";
export type {
  BaseExtensionBlock,
  CEAExtensionBlock,
  DisplayIDExtensionBlock,
  UnknownExtensionBlock,
  ExtensionBlock,
} from "./eedid.ts";

// EDID spec (values)
export {
  EDID,
  ManufacturerID,
  StandardTiming,
  DigitalVideoInput,
  DigitalColourEncoding,
  SignalInterface,
  EdidVersion,
  AspectRatio,
} from "./edid/edid.ts";

// EDID descriptors (values)
export {
  DescriptorType,
  DecodeDesciptor,
  CreateDesciptor,
  descriptorTypeOptions,
  DisplayProductSerialNumber,
  AlphanumericDataString,
  DisplayProductName,
  DisplayRangeLimits,
  ColorPointData,
  StandardTimingIdentification,
  DisplayColorManagement,
  CVT3ByteCodes,
  EstablishedTimingsIII,
  DummyDesciptor,
} from "./edid/descriptors.ts";

// EDID descriptors (types)
export type {
  DisplayDescriptorInterface,
  DisplayDescriptorUnion,
} from "./edid/descriptors.ts";

// CEA spec (values)
export {
  CEA,
  DataBlockHeader,
  VideoDataBlock,
  AudioDataBlock,
  SpeakerAllocationDataBlock,
  VIC,
} from "./cea/cea.ts";

// CEA spec (types)
export type {
  CEADataBlock,
  CEADataBlockUnion,
} from "./cea/cea.ts";

// CEA extended (values)
export {
  CEAExtendedTag,
  VideoCapabilityDataBlock,
  ColorimetryDataBlock,
  HDRStaticMetadataDataBlock,
  YCBCR420CapabilityMap,
  SpeakerLocationDataBlock,
} from "./cea/extended.ts";
export type { ExtendedDataBlockUnion } from "./cea/extended.ts";

// CEA VSDB (values)
export { VSDBTag, HDMI_1_4, HDMI_2_0, HMDSpecialisedMonitor } from "./cea/vsdb.ts";
export type { VSDBUnion } from "./cea/vsdb.ts";

// DisplayID
export { DisplayID } from "./displayid/displayid.ts";

// Common / shared
export {
  DetailedTimingDescriptor,
  CVTMode,
  SyncType,
} from "./common/DetailedTimingDescriptor.ts";
export { CVTGenerator } from "./common/cvtgenerator.ts";
export {
  formatByte,
  calcEDIDChecksum,
  hexToUint8Array,
  readUint16LE,
  readUint16BE,
  readUint32LE,
} from "./common/utils.ts";
