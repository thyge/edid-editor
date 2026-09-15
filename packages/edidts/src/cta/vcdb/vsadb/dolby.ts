// packages/edidts/src/cta/vcdb/vsadb/dolby.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_VSADB_DECODERS, VENDOR_VSADB_ENCODERS } from './registry';
import { OUI } from '../../vsdb/types';
import type { DolbyVSADB } from './types';

// Dolby Laboratories VSADB (OUI 00-D0-46) byte layout (post-OUI body):
//   byte 0  bit 7 = headphone playback only
//           bit 6 = height speaker zone present
//           bit 5 = surround speaker zone present
//           bit 4 = center speaker zone present
//           bit 3 = reserved (not parsed by edid-decode; kept in byte0Reserved)
//           bits 2:0 = version - 1 (edid-decode reports 1 + (x[0] & 0x07))
//   byte 1  bit 0 = supports Dolby MAT PCM decoding at 48 kHz only,
//                   does not support TrueHD
//           bits 7:1 = reserved (kept in byte1Reserved)
//   bytes 2.. = vendor-reserved, preserved verbatim in `trailing`
//
// Source: edid-decode `cta_dolby_audio()` (parse-cta-block.cpp) — the public
// reference parser cited for this layout; the official definition lives in the
// licensed Dolby Atmos application notes. Byte-exact round-trip is preserved
// even for the reserved bits and trailing bytes.

export const DOLBY_VSADB_DEFAULT: DolbyVSADB = {
  version: 1,
  headphoneOnly: false,
  heightZone: false,
  surroundZone: false,
  centerZone: false,
  byte0Reserved: 0,
  mat48kHzOnly: false,
  byte1Reserved: 0,
  trailing: new Uint8Array(),
};

export class DolbyVSADBDecoder implements VendorDecoder<'dolbyVsadb'> {
  readonly kind = 'dolbyVsadb' as const;
  readonly minLength = 2;

  decode(payload: Uint8Array): DolbyVSADB {
    if (payload.length < 2) return { ...DOLBY_VSADB_DEFAULT };
    const byte0 = payload[0];
    const byte1 = payload[1];
    return {
      version: 1 + (byte0 & 0x07),
      headphoneOnly: (byte0 & 0x80) !== 0,
      heightZone: (byte0 & 0x40) !== 0,
      surroundZone: (byte0 & 0x20) !== 0,
      centerZone: (byte0 & 0x10) !== 0,
      byte0Reserved: (byte0 & 0x08) >> 3,
      mat48kHzOnly: (byte1 & 0x01) !== 0,
      byte1Reserved: (byte1 >> 1) & 0x7f,
      trailing: payload.slice(2),
    };
  }
}

export class DolbyVSADBEncoder implements VendorEncoder<'dolbyVsadb'> {
  readonly kind = 'dolbyVsadb' as const;

  encode(fields: DolbyVSADB): Uint8Array {
    // `version` is the semantic value (1..8); the wire carries version - 1.
    if (fields.version < 1 || fields.version > 8) {
      throw new RangeError(`Invalid Dolby VSADB version: ${fields.version}`);
    }
    const byte0 =
      (fields.headphoneOnly ? 0x80 : 0) |
      (fields.heightZone ? 0x40 : 0) |
      (fields.surroundZone ? 0x20 : 0) |
      (fields.centerZone ? 0x10 : 0) |
      ((fields.byte0Reserved & 0x01) << 3) |
      ((fields.version - 1) & 0x07);
    const byte1 =
      ((fields.byte1Reserved & 0x7f) << 1) |
      (fields.mat48kHzOnly ? 0x01 : 0);
    // `trailing` carries the post-byte-1 vendor-reserved bytes verbatim.
    // Tolerate callers passing the legacy shape (no `trailing`) so field-only
    // constructions still encode to the minimal 2-byte body.
    const trailing = fields.trailing ?? new Uint8Array();
    const out = new Uint8Array(2 + trailing.length);
    out[0] = byte0;
    out[1] = byte1;
    out.set(trailing, 2);
    return out;
  }
}

VENDOR_VSADB_DECODERS[OUI.DOLBY] = new DolbyVSADBDecoder();
VENDOR_VSADB_ENCODERS['dolbyVsadb'] = new DolbyVSADBEncoder();