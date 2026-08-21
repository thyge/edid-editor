// packages/edidts/src/cta/vsvdb/index.ts

export type { DolbyVSDB, HDR10PlusVSDB, VSVDBVendorDecoded } from './types';

export { DolbyVSDBDecoder, DolbyVSDBEncoder, DOLBY_VSDB_DEFAULT } from './dolby';

export {
  VENDOR_VSVDB_DECODERS,
  VENDOR_VSVDB_ENCODERS,
  decodeVSVDB,
} from './registry';
export type { VendorDecoder, VendorEncoder } from './registry';
