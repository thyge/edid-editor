// packages/edidts/src/cta/vsdb/amd.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type AMDFreeSyncVSDB } from './types';
import { clampByte, keepShortLength } from '../byte-utils';

/**
 * AMD FreeSync VSDB (OUI 0x00001A, IEEE 00-00-1A = Advanced Micro Devices).
 *
 * There is no public AMD FreeSync VSDB specification; the byte layout is
 * reverse-engineered from real EDIDs and documented in edid-decode's
 * `cta_amd` (parse-cta-block.cpp), the de-facto reference parser. Source:
 * https://android.googlesource.com/platform/external/edid-decode
 *
 * Post-OUI layout (see `AMDFreeSyncVSDB` for the field doc):
 *   byte 0  version
 *   byte 1  flags1 (FreeSync / FreeSync 2 HDR / local dimming / … bits)
 *   byte 2  minRefreshHz
 *   byte 3  maxRefreshHz
 *   byte 4  mccsVcpCode
 *   bytes 5..  version 2/3 fields — preserved verbatim as `trailing`.
 *
 * The encoder rewrites the 5-byte head from the structured fields and appends
 * `trailing` verbatim, so decode→encode is byte-identical for any length; a
 * malformed body shorter than 5 bytes keeps its length (`payloadLength`).
 */
export const AMD_FREESYNC_DEFAULT: AMDFreeSyncVSDB = {
  version: 0,
  flags1: 0,
  minRefreshHz: 0,
  maxRefreshHz: 0,
  mccsVcpCode: 0,
  trailing: new Uint8Array(0),
};

export class AMDFreeSyncDecoder implements VendorDecoder<'amdFreeSync'> {
  readonly kind = 'amdFreeSync' as const;
  readonly minLength = 5;

  decode(payload: Uint8Array): AMDFreeSyncVSDB {
    // A short body is decoded as far as it goes (missing bytes read as 0).
    const fields: AMDFreeSyncVSDB = {
      version: payload[0] ?? 0,
      flags1: payload[1] ?? 0,
      minRefreshHz: payload[2] ?? 0,
      maxRefreshHz: payload[3] ?? 0,
      mccsVcpCode: payload[4] ?? 0,
      trailing: payload.slice(5),
    };
    if (payload.length < 5) fields.payloadLength = payload.length;
    return fields;
  }
}

export class AMDFreeSyncEncoder implements VendorEncoder<'amdFreeSync'> {
  readonly kind = 'amdFreeSync' as const;

  encode(fields: AMDFreeSyncVSDB): Uint8Array {
    const trailing = fields.trailing ?? new Uint8Array(0);
    const out = new Uint8Array(5 + trailing.length);
    out[0] = clampByte(fields.version);
    out[1] = clampByte(fields.flags1);
    out[2] = clampByte(fields.minRefreshHz);
    out[3] = clampByte(fields.maxRefreshHz);
    out[4] = clampByte(fields.mccsVcpCode ?? 0);
    out.set(trailing, 5);
    return keepShortLength(out, fields.payloadLength);
  }
}

VENDOR_DECODERS[OUI.AMD] = new AMDFreeSyncDecoder();
VENDOR_ENCODERS['amdFreeSync'] = new AMDFreeSyncEncoder();
