// packages/edidts/src/cta/vsdb/amd.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type AMDFreeSyncVSDB } from './types';

/**
 * AMD FreeSync VSDB (OUI 0x00001A) — EXPERIMENTAL.
 *
 * The AMD OUI is IEEE-verified (Advanced Micro Devices, Inc.), but the
 * VSDB byte layout is **not publicly documented**. The shape below is a
 * best-effort interpretation: min/max/native refresh rates (Hz) and a
 * trailing flags byte. Real captures may differ; the decoder and encoder
 * are written to round-trip each other even if the wire layout turns out
 * to be different.
 */
export const AMD_FREESYNC_DEFAULT: AMDFreeSyncVSDB = {
  minRefreshHz: 0,
  maxRefreshHz: 0,
  nativeRefreshHz: 0,
  flags: 0,
};

export class AMDFreeSyncDecoder implements VendorDecoder<'amdFreeSync'> {
  readonly kind = 'amdFreeSync' as const;
  readonly minLength = 2;

  decode(payload: Uint8Array): AMDFreeSyncVSDB {
    if (payload.length < 2) return { ...AMD_FREESYNC_DEFAULT };
    return {
      minRefreshHz: payload[0],
      maxRefreshHz: payload[1],
      nativeRefreshHz: payload.length >= 3 ? payload[2] : 0,
      flags: payload.length >= 4 ? payload[3] : 0,
    };
  }
}

export class AMDFreeSyncEncoder implements VendorEncoder<'amdFreeSync'> {
  readonly kind = 'amdFreeSync' as const;

  encode(fields: AMDFreeSyncVSDB): Uint8Array {
    const out = new Uint8Array(4);
    out[0] = fields.minRefreshHz & 0xFF;
    out[1] = fields.maxRefreshHz & 0xFF;
    out[2] = fields.nativeRefreshHz & 0xFF;
    out[3] = fields.flags & 0xFF;
    return out;
  }
}

VENDOR_DECODERS[OUI.AMD] = new AMDFreeSyncDecoder();
VENDOR_ENCODERS['amdFreeSync'] = new AMDFreeSyncEncoder();
