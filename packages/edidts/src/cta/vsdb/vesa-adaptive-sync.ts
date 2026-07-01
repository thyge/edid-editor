// packages/edidts/src/cta/vsdb/vesa-adaptive-sync.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type VESAAdaptiveSyncVSDB } from './types';

/**
 * VESA Adaptive-Sync VSDB (OUI 0x9C5A78) — EXPERIMENTAL.
 *
 * The OUI `0x9C5A78` is **unverified** (not in the public IEEE registry),
 * and the VSDB byte layout is **unverified** (sourced from a possibly
 * AI-generated web snippet). The shape below is a best-effort
 * interpretation: a flags byte, three refresh rates, and a capability
 * byte. The decoder and encoder round-trip each other for the fields
 * in the type. If real captures show a different layout, update the
 * bit positions without changing the public type.
 *
 * Post-OUI layout (5 bytes):
 *   byte 0  flags1: bit 7 fixedRateLink
 *   byte 1  minRefreshHz
 *   byte 2  maxRefreshHz
 *   byte 3  minBacklightHz
 *   byte 4  caps: bit 6 bcap30, bit 5 dsc10bpc, bit 4 dsc8bpc, bit 3 dsc12bpc,
 *                  bit 2 selFl, bit 1 adaptiveSyncCapable, bit 0 vfrInactive
 */
export const VESA_ADAPTIVE_SYNC_DEFAULT: VESAAdaptiveSyncVSDB = {
  fixedRateLink: false,
  minRefreshHz: 0,
  maxRefreshHz: 0,
  minBacklightHz: 0,
  adaptiveSyncCapable: false,
  bcap30: false,
  dsc8bpc: false,
  dsc10bpc: false,
  dsc12bpc: false,
  selFl: false,
  vfrInactive: false,
};

export class VESAAdaptiveSyncDecoder implements VendorDecoder<'vesaAdaptiveSync'> {
  readonly kind = 'vesaAdaptiveSync' as const;
  readonly minLength = 5;

  decode(payload: Uint8Array): VESAAdaptiveSyncVSDB {
    if (payload.length < 5) return { ...VESA_ADAPTIVE_SYNC_DEFAULT };
    const flags1 = payload[0];
    const cap = payload[4];
    return {
      fixedRateLink: (flags1 & 0x80) !== 0,
      minRefreshHz: payload[1],
      maxRefreshHz: payload[2],
      minBacklightHz: payload[3],
      adaptiveSyncCapable: (cap & 0x02) !== 0,
      bcap30: (cap & 0x40) !== 0,
      dsc8bpc: (cap & 0x10) !== 0,
      dsc10bpc: (cap & 0x20) !== 0,
      dsc12bpc: (cap & 0x08) !== 0,
      selFl: (cap & 0x04) !== 0,
      vfrInactive: (cap & 0x01) !== 0,
    };
  }
}

export class VESAAdaptiveSyncEncoder implements VendorEncoder<'vesaAdaptiveSync'> {
  readonly kind = 'vesaAdaptiveSync' as const;

  encode(fields: VESAAdaptiveSyncVSDB): Uint8Array {
    const out = new Uint8Array(5);
    out[0] = fields.fixedRateLink ? 0x80 : 0;
    out[1] = fields.minRefreshHz & 0xFF;
    out[2] = fields.maxRefreshHz & 0xFF;
    out[3] = fields.minBacklightHz & 0xFF;
    out[4] =
      (fields.bcap30 ? 0x40 : 0) |
      (fields.dsc10bpc ? 0x20 : 0) |
      (fields.dsc8bpc ? 0x10 : 0) |
      (fields.dsc12bpc ? 0x08 : 0) |
      (fields.selFl ? 0x04 : 0) |
      (fields.adaptiveSyncCapable ? 0x02 : 0) |
      (fields.vfrInactive ? 0x01 : 0);
    return out;
  }
}

VENDOR_DECODERS[OUI.VESA_ADAPTIVE_SYNC] = new VESAAdaptiveSyncDecoder();
VENDOR_ENCODERS['vesaAdaptiveSync'] = new VESAAdaptiveSyncEncoder();
