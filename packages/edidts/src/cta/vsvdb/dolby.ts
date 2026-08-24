// packages/edidts/src/cta/vsvdb/dolby.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_VSVDB_DECODERS, VENDOR_VSVDB_ENCODERS } from './registry';
import { OUI } from '../vsdb/types';
import type { DolbyVSDB } from './types';

// Dolby VSVDB byte layout (post-OUI):
//   bit 7..5 = version (3-bit field, values 0-7)
//   bit 4..3 = reserved (real v1/v2 blocks set these; not field-modeled)
//   bit 2    = supportsGlobalDimming
//   bit 1    = supports2160p60
//   bit 0    = supportsYUV422_12bit
// Bits 4:3 and the remaining payload bytes (v1/v2 carry further reserved
// fields) are not modeled field-by-field, but are preserved verbatim (in
// `byte0Reserved` and `trailing`) so the codec is byte-complete and round-trips
// identically regardless of version.

export const DOLBY_VSDB_DEFAULT: DolbyVSDB = {
  version: 0,
  supportsYUV422_12bit: false,
  supports2160p60: false,
  supportsGlobalDimming: false,
  byte0Reserved: 0,
  trailing: new Uint8Array(),
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
      byte0Reserved: (byte0 & 0x18) >> 3,
      trailing: payload.slice(1),
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
      ((fields.byte0Reserved & 0x03) << 3) |
      (fields.supportsYUV422_12bit ? 0x01 : 0) |
      (fields.supports2160p60 ? 0x02 : 0) |
      (fields.supportsGlobalDimming ? 0x04 : 0);
    // `trailing` carries the post-byte-0 vendor-reserved bytes verbatim. Tolerate
    // callers passing the legacy shape (no `trailing`) so existing field-only
    // constructions still encode to a single byte.
    const trailing = fields.trailing ?? new Uint8Array();
    const out = new Uint8Array(1 + trailing.length);
    out[0] = byte0;
    out.set(trailing, 1);
    return out;
  }
}

VENDOR_VSVDB_DECODERS[OUI.DOLBY] = new DolbyVSDBDecoder();
VENDOR_VSVDB_ENCODERS['dolbyVsdb'] = new DolbyVSDBEncoder();
