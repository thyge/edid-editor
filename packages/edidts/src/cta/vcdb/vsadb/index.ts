export type { VSADBVendorDecoded, DolbyVSADB } from './types';

export {
  VENDOR_VSADB_DECODERS,
  VENDOR_VSADB_ENCODERS,
  decodeVSADB,
  encodeVSADB,
  reassembleVsadbBlock,
  findVSADBs,
} from './registry';
export type { VendorDecoder, VendorEncoder, VendorSpecificAudioDataBlock } from './registry';
export { DolbyVSADBDecoder, DolbyVSADBEncoder, DOLBY_VSADB_DEFAULT } from './dolby';