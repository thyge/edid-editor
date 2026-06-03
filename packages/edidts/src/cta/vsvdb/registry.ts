// packages/edidts/src/cta/vsvdb/registry.ts

import type { ExtendedDataBlock, VendorSpecificVideoDataBlock } from '../cta-extended-blocks';
import type { CEAExtensionBlock, CEADataBlock } from '../extension-block';
import { writeIeeeOui } from '../../common/bintools';

// The VSVDB (Vendor-Specific Video Data Block) is the CTA-861-G extended tag
// 0x01, distinct from the regular VSDB at tag 0x03. Only Dolby Vision is
// registered today, but the architecture is parallel to `vsdb/registry.ts`
// so HDR10+ and other vendors can be added in the same way.
//
// Each decoder is keyed by the integer IEEE OUI; each encoder is keyed by
// the discriminator `kind` string. The `VendorDecoder`/`VendorEncoder`
// shapes mirror the VSDB ones but are typed more loosely (generic over a
// string `K`) because the VSVDB decoded-shape union lives in this file
// family and is not yet part of a public discriminated union.

export interface VendorDecoder<K extends string> {
  readonly kind: K;
  readonly minLength: number;
  decode(payload: Uint8Array): unknown;
}

export interface VendorEncoder<K extends string> {
  readonly kind: K;
  encode(fields: any): Uint8Array;
}

export const VENDOR_VSVDB_DECODERS: Record<number, VendorDecoder<string>> = {};
export const VENDOR_VSVDB_ENCODERS: Record<string, VendorEncoder<string>> = {};

/**
 * Decode a VSVDB block (tag 0x07, extended tag 0x01).
 *
 * The `payload` argument is the post-extended-tag bytes: a 3-byte little-
 * endian IEEE OUI followed by the vendor-specific body. The first 3 bytes
 * are split into the integer OUI on the carrier; everything after is the
 * `payload`. No per-vendor decoded shape is set on the carrier (see
 * VSDB's `vendor?` for the parallel pattern; this refactor leaves that
 * work for a follow-up).
 */
export function decodeVSVDB(base: ExtendedDataBlock, payload: Uint8Array): VendorSpecificVideoDataBlock {
  if (payload.length < 3) {
    return {
      ...base,
      extendedTag: 0x01,
      ieeeOui: 0,
      payload: new Uint8Array(),
    };
  }

  const ieeeOui = (payload[0] | (payload[1] << 8) | (payload[2] << 16)) >>> 0;
  const data = payload.slice(3);

  return {
    ...base,
    extendedTag: 0x01,
    ieeeOui,
    payload: data,
  };
}

/**
 * Build the VSVDB block bytes from an OUI and a post-OUI payload.
 * Layout: extended tag byte (0x01) + 3 OUI bytes (LE) + payload.
 * The block-level header byte (tag 0x07, length) is added by the CTA
 * block-framing code, not by this helper — only the post-header bytes
 * are returned.
 */
export function reassembleVsvdbBlock(ieeeOui: number, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(1 + 3 + payload.length);
  out[0] = 0x01; // extended tag code
  writeIeeeOui(out, 1, ieeeOui);
  out.set(payload, 4);
  return out;
}

/**
 * Return all Vendor-Specific Video Data Blocks (tag 0x07, extended tag
 * 0x01) from a CEA extension's data block list. Mirrors `findVSDBs` in
 * the parallel VSDB module; the UI uses it to render VSVDB subcomponents
 * (currently only Dolby Vision).
 */
export function findVSVDBs(cea: CEAExtensionBlock): VendorSpecificVideoDataBlock[] {
  return cea.dataBlocks.filter(
    (b): b is VendorSpecificVideoDataBlock =>
      b.tag === 0x07 && (b as CEADataBlock & { extendedTag?: number }).extendedTag === 0x01
  );
}
