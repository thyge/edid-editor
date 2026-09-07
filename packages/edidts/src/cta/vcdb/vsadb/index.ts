// packages/edidts/src/cta/vcdb/vsadb/index.ts

export type { VSADBVendorDecoded } from './types';

export {
  VENDOR_VSADB_DECODERS,
  VENDOR_VSADB_ENCODERS,
  decodeVSADB,
  encodeVSADB,
  reassembleVsadbBlock,
  findVSADBs,
} from './registry';
export type { VendorDecoder, VendorEncoder, VendorSpecificAudioDataBlock } from './registry';