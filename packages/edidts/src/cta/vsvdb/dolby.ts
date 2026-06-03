// packages/edidts/src/cta/vsvdb/dolby.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_VSVDB_DECODERS, VENDOR_VSVDB_ENCODERS } from './registry';
import { OUI } from '../vsdb/types';
import type { DolbyVSDB } from './types';

// Dolby VSVDB byte layout (post-OUI):
//   bit 7..5 = version (3-bit field, values 0-7)
//   bit 2    = supportsGlobalDimming
//   bit 1    = supports2160p60
//   bit 0    = supportsYUV422_12bit
// The remaining payload bytes (if any) are vendor-reserved and not decoded.

export const DOLBY_VSDB_DEFAULT: DolbyVSDB = {
  version: 0,
  supportsYUV422_12bit: false,
  supports2160p60: false,
  supportsGlobalDimming: false,
};

export class DolbyVSDBDecoder implements VendorDecoder<'dolbyVsdb'> {
  readonly kind = 'dolbyVsdb' as const;
  readonly minLength = 1;

  decode(payload: Uint8Array): DolbyVSDB {
    if (payload.length < 1) return { ...DOLBY_VSDB_DEFAULT };
    const byte0 = payload[0];
    return {
      version: (byte0 >> 5) & 0x07,
      supportsYUV422_12bit: (byte0 & 0x01) !== 0,
      supports2160p60: (byte0 & 0x02) !== 0,
      supportsGlobalDimming: (byte0 & 0x04) !== 0,
    };
  }
}

export class DolbyVSDBEncoder implements VendorEncoder<'dolbyVsdb'> {
  readonly kind = 'dolbyVsdb' as const;

  encode(fields: DolbyVSDB): Uint8Array {
    if (fields.version < 0 || fields.version > 0x07) {
      throw new RangeError(`Invalid Dolby version: ${fields.version}`);
    }
    const byte0 =
      ((fields.version & 0x07) << 5) |
      (fields.supportsYUV422_12bit ? 0x01 : 0) |
      (fields.supports2160p60 ? 0x02 : 0) |
      (fields.supportsGlobalDimming ? 0x04 : 0);
    return new Uint8Array([byte0]);
  }
}

VENDOR_VSVDB_DECODERS[OUI.DOLBY] = new DolbyVSDBDecoder();
VENDOR_VSVDB_ENCODERS['dolbyVsdb'] = new DolbyVSDBEncoder();
