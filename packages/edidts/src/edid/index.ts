// Re-export all EDID spec modules from a single entry point
export {
  EDID,
} from "./edid.ts";

export {
  ManufacturerID,
} from "./edid-header.ts";

export {
  DigitalVideoInput,
  AnalogVideoInput,
  SignalInterface,
} from "./video-input.ts";

export {
  FeatureSupport,
  DigitalColourEncoding,
  AnalogueColourEncoding,
  EdidVersion,
} from "./feature-support.ts";

export { Chromaticity } from "./color-characteristics.ts";

export { EstablishedTimings } from "./established-timing.ts";

export { StandardTiming, AspectRatio } from "./standard-timing.ts";

// Display descriptors
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
} from "./display-descriptor.ts";

export type {
  DisplayDescriptorInterface,
  DisplayDescriptorUnion,
} from "./display-descriptor.ts";
