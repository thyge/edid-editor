// packages/edidts/src/cta/vsdb/amd.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type AMDFreeSyncVSDB } from './types';

/**
 * AMD FreeSync VSDB (OUI 0x00001A, IEEE 00-00-1A = Advanced Micro Devices).
 *
 * There is no public AMD FreeSync VSDB specification; the byte layout is
 * reverse-engineered from real EDIDs and documented in edid-decode's
 * `cta_amd` (parse-cta-block.cpp), the de-facto reference parser. Source:
 * https://android.googlesource.com/platform/external/edid-decode
 *
 * Post-OUI layout (see `AMDFreeSyncVSDB` for the field doc):
 *   byte 0  versionMajor
 *   byte 1  versionMinor
 *   byte 2  minRefreshHz
 *   byte 3  maxRefreshHz
 *   byte 4  flags1 (FreeSync 1.x)
 *   bytes 5..  FreeSync 2.x extension — preserved verbatim as `payload`.
 *
 * The 1.x prefix (bytes 0-4) is confidently reverse-engineered; the 2.x
 * extension (flags2 + luminance, bytes 5-9 when length >= 10) is marked
 * speculative by edid-decode and is kept opaque here. The encoder rewrites
 * the 1.x prefix from the structured fields and appends `payload` verbatim,
 * so decode→encode is byte-identical for any length >= 5.
 */
export const AMD_FREESYNC_DEFAULT: AMDFreeSyncVSDB = {
  versionMajor: 0,
  versionMinor: 0,
  minRefreshHz: 0,
  maxRefreshHz: 0,
  flags1: 0,
  payload: new Uint8Array(0),
};

export class AMDFreeSyncDecoder implements VendorDecoder<'amdFreeSync'> {
  readonly kind = 'amdFreeSync' as const;
  readonly minLength = 5;

  decode(payload: Uint8Array): AMDFreeSyncVSDB {
    if (payload.length < 5) {
      return { ...AMD_FREESYNC_DEFAULT, payload: new Uint8Array(0) };
    }
    return {
      versionMajor: payload[0],
      versionMinor: payload[1],
      minRefreshHz: payload[2],
      maxRefreshHz: payload[3],
      flags1: payload[4],
      payload: payload.slice(5),
    };
  }
}

export class AMDFreeSyncEncoder implements VendorEncoder<'amdFreeSync'> {
  readonly kind = 'amdFreeSync' as const;

  encode(fields: AMDFreeSyncVSDB): Uint8Array {
    const out = new Uint8Array(5 + fields.payload.length);
    out[0] = fields.versionMajor & 0xFF;
    out[1] = fields.versionMinor & 0xFF;
    out[2] = fields.minRefreshHz & 0xFF;
    out[3] = fields.maxRefreshHz & 0xFF;
    out[4] = fields.flags1 & 0xFF;
    out.set(fields.payload, 5);
    return out;
  }
}

VENDOR_DECODERS[OUI.AMD] = new AMDFreeSyncDecoder();
VENDOR_ENCODERS['amdFreeSync'] = new AMDFreeSyncEncoder();