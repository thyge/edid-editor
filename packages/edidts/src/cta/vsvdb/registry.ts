// packages/edidts/src/cta/vsvdb/registry.ts

import type { ExtendedDataBlock, VendorSpecificVideoDataBlock } from '../cta-extended-blocks';
import type { CEAExtensionBlock, CEADataBlock } from '../extension-block';
import { OUI } from '../vsdb/types';
import type { HDR10PlusVSDB } from './types';

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
  // OUI is written little-endian on the wire (low byte first), matching
  // `decodeVSVDB`'s reader and the production `encodeVendorSpecificVideoBlock`.
  // `writeIeeeOui` is big-endian, so write the bytes explicitly here.
  out[1] = ieeeOui & 0xff;
  out[2] = (ieeeOui >>> 8) & 0xff;
  out[3] = (ieeeOui >>> 16) & 0xff;
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

// HDR10+ Vendor-Specific Video Data Block (VSVDB).
//
// CTA-861 extended tag 0x01, OUI 0x90848B (HDR10_PLUS). IEEE oui.txt assigns
// 90-84-8B to "HDR10+ Technologies, LLC" (Beaverton, OR); edid-decode keys this
// OUI as 0x90848b and parses it in the Vendor-Specific Video Data Block path
// (tag 0x07, ext 0x01) via `cta_hdr10plus` (parse-cta-block.cpp). HDR10+ is
// carried ONLY as a VSVDB — edid-decode does not special-case this OUI in the
// tag-0x03 VSDB handler, so a tag-0x03 block with this OUI is dumped raw (the
// previous tag-0x03 "HDR10+ VSDB" codec was fabricated and has been removed).
//
// Post-OUI payload layout (verified against edid-decode `cta_hdr10plus`):
//   byte 0    Application Version (full byte)
//   bytes 1.. vendor-specific payload (opaque, preserved verbatim)
//
// The codec classes live directly in `registry.ts` (rather than a separate
// `hdr10plus.ts` file) so that importing `vsvdb/registry` registers them in
// production without requiring a side-effect import in `extension-block.ts`.
// This mirrors the Dolby registration shape but keeps the definition adjacent
// to the registry maps to avoid a circular side-effect import / TDZ.

export const HDR10_PLUS_VSVDB_DEFAULT: HDR10PlusVSDB = {
  applicationVersion: 0,
  payload: new Uint8Array(),
};

export class HDR10PlusVsvdbDecoder implements VendorDecoder<'hdr10PlusVsvdb'> {
  readonly kind = 'hdr10PlusVsvdb' as const;
  readonly minLength = 1;

  decode(payload: Uint8Array): HDR10PlusVSDB {
    if (payload.length < 1) return { ...HDR10_PLUS_VSVDB_DEFAULT };
    return {
      applicationVersion: payload[0],
      payload: payload.slice(1),
    };
  }
}

export class HDR10PlusVsvdbEncoder implements VendorEncoder<'hdr10PlusVsvdb'> {
  readonly kind = 'hdr10PlusVsvdb' as const;

  encode(fields: HDR10PlusVSDB): Uint8Array {
    const out = new Uint8Array(1 + fields.payload.length);
    out[0] = fields.applicationVersion & 0xff;
    out.set(fields.payload, 1);
    return out;
  }
}

VENDOR_VSVDB_DECODERS[OUI.HDR10_PLUS] = new HDR10PlusVsvdbDecoder();
VENDOR_VSVDB_ENCODERS['hdr10PlusVsvdb'] = new HDR10PlusVsvdbEncoder();
