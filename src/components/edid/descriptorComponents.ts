import { type Component } from "vue";
import DetailedTimingDescriptor from "../DetailedTimingDesciptor.vue";
import ASCIIDescriptor from "./descriptors/ASCIIDescriptor.vue";
import DisplayRangeLimits from "./descriptors/DisplayRangeLimits.vue";
import ColorPointData from "./descriptors/ColorPointData.vue";
import StandardTimingIdentification from "./descriptors/StandardTimingIdentification.vue";
import DisplayColorManagement from "./descriptors/ColorManagementData.vue";
import CVT3ByteCodes from "./descriptors/CVT3ByteCodes.vue";
import EstablishedTimingsIII from "./descriptors/EstablishedTimingsIII.vue";

export const descriptorComponents: Record<string, Component> = {
  detailedTiming: DetailedTimingDescriptor,
  displayProductSerialNumber: ASCIIDescriptor,
  alphanumericDataString: ASCIIDescriptor,
  displayProductName: ASCIIDescriptor,
  displayRangeLimits: DisplayRangeLimits,
  colorPointData: ColorPointData,
  standardTimingIdentification: StandardTimingIdentification,
  displayColorManagement: DisplayColorManagement,
  cvt3ByteCodes: CVT3ByteCodes,
  establishedTimingsIII: EstablishedTimingsIII,
};
