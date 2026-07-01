// packages/edidts/src/cta/vsdb/nvidia.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type NvidiaVSDB } from './types';

/**
 * NVIDIA VSDB (OUI 0x00044B) — EXPERIMENTAL.
 *
 * The OUI is IEEE-verified (NVIDIA Corporation), but the VSDB byte
 * layout is **unverified** (no public NVIDIA documentation of a
 * CTA-861 VSDB form; the G-Sync Compatible range is typically conveyed
 * via DisplayID instead). The shape below is a best-effort
 * interpretation: a single-byte version, two refresh rates (min, max),
 * and a trailing flags byte. The decoder and encoder round-trip each
 * other.
 *
 * Post-OUI layout (4 bytes):
 *   byte 0  version
 *   byte 1  minRefreshHz
 *   byte 2  maxRefreshHz
 *   byte 3  flags
 */
export const NVIDIA_DEFAULT: NvidiaVSDB = {
  version: 0,
  minRefreshHz: 0,
  maxRefreshHz: 0,
  flags: 0,
};

export class NvidiaDecoder implements VendorDecoder<'nvidia'> {
  readonly kind = 'nvidia' as const;
  readonly minLength = 3;

  decode(payload: Uint8Array): NvidiaVSDB {
    if (payload.length < 3) return { ...NVIDIA_DEFAULT };
    return {
      version: payload[0],
      minRefreshHz: payload[1],
      maxRefreshHz: payload[2],
      flags: payload.length >= 4 ? payload[3] : 0,
    };
  }
}

export class NvidiaEncoder implements VendorEncoder<'nvidia'> {
  readonly kind = 'nvidia' as const;

  encode(fields: NvidiaVSDB): Uint8Array {
    const out = new Uint8Array(4);
    out[0] = fields.version & 0xFF;
    out[1] = fields.minRefreshHz & 0xFF;
    out[2] = fields.maxRefreshHz & 0xFF;
    out[3] = fields.flags & 0xFF;
    return out;
  }
}

VENDOR_DECODERS[OUI.NVIDIA] = new NvidiaDecoder();
VENDOR_ENCODERS['nvidia'] = new NvidiaEncoder();
