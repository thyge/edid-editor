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
  VendorSpecific = 0x7e,
  CtaDisplayId = 0x81,
}

export type DisplayIdWarningCode =
  | 'invalid_checksum'
  | 'unsupported_version'
  | 'trailing_fill'
  | 'block_length_overflow'
  | 'reserved_legacy_tag';

export interface DisplayIdWarning {
  code: DisplayIdWarningCode;
  offset: number;
  message: string;
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
  warnings: DisplayIdWarning[];
}

export class DisplayIdDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisplayIdDecodeError';
  }
}
