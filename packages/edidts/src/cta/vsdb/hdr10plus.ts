// packages/edidts/src/cta/vsdb/hdr10plus.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type HDR10PlusVSDB } from './types';

/**
 * HDR10+ VSDB (OUI 0x8B8490) — EXPERIMENTAL.
 *
 * Note: there is a separate HDR10+ VSVDB (Tag 0x07 ext 0x01) under
 * `VendorSpecificVideoDataBlock` in `cta-extended-blocks.ts`. That is a
 * VSVDB, not a VSDB, and is handled by the vsvdb registry. This decoder
 * covers the **VSDB** form (Tag 0x03, IEEE OUI prefix 0x90848B) only.
 *
 * The exact byte layout is not publicly documented. The interpretation
 * below is: byte 0 application identifier, byte 1 application version,
 * remaining bytes opaque payload. The decoder and encoder round-trip
 * each other for any payload length.
 */
export const HDR10_PLUS_DEFAULT: HDR10PlusVSDB = {
  applicationIdentifier: 0x01,
  applicationVersion: 0,
  payload: new Uint8Array(0),
};

export class HDR10PlusDecoder implements VendorDecoder<'hdr10Plus'> {
  readonly kind = 'hdr10Plus' as const;
  readonly minLength = 1;

  decode(payload: Uint8Array): HDR10PlusVSDB {
    if (payload.length < 1) return { ...HDR10_PLUS_DEFAULT, payload: new Uint8Array(0) };
    return {
      applicationIdentifier: payload[0],
      applicationVersion: payload.length >= 2 ? payload[1] : 0,
      payload: payload.slice(2),
    };
  }
}

export class HDR10PlusEncoder implements VendorEncoder<'hdr10Plus'> {
  readonly kind = 'hdr10Plus' as const;

  encode(fields: HDR10PlusVSDB): Uint8Array {
    const out = new Uint8Array(2 + fields.payload.length);
    out[0] = fields.applicationIdentifier & 0xFF;
    out[1] = fields.applicationVersion & 0xFF;
    out.set(fields.payload, 2);
    return out;
  }
}

VENDOR_DECODERS[OUI.HDR10_PLUS] = new HDR10PlusDecoder();
VENDOR_ENCODERS['hdr10Plus'] = new HDR10PlusEncoder();
