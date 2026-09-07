// packages/edidts/src/cta/vcdb/vsadb/registry.ts

// The VSADB (Vendor-Specific Audio Data Block) is the CTA-861-G extended tag
// 0x11, the audio counterpart of the VSVDB (extended tag 0x01, handled in
// `../vsvdb/`). No per-vendor audio codecs are registered today, but the
// architecture is parallel to `../vsvdb/registry.ts` so a first vendor can be
// added in the same way: a `VendorDecoder` keyed by the integer IEEE OUI, an
// encoder keyed by the discriminator `kind` string, and the structured shape
// attached to the carrier on decode.

import type { ExtendedDataBlock } from '../../cta-extended-blocks';
import type { CEAExtensionBlock, CEADataBlock } from '../../extension-block';
import { readIeeeOuiLE, writeIeeeOuiLE, pushIeeeOuiLE } from '../../../common/bintools';
import type { VSADBVendorDecoded } from './types';

/** Mirrors `vsvdb/registry.ts`'s `VendorDecoder`. */
export interface VendorDecoder<K extends string> {
  readonly kind: K;
  readonly minLength: number;
  decode(payload: Uint8Array): unknown;
}

/** Mirrors `vsvdb/registry.ts`'s `VendorEncoder`. */
export interface VendorEncoder<K extends string> {
  readonly kind: K;
  encode(fields: any): Uint8Array;
}

export const VENDOR_VSADB_DECODERS: Record<number, VendorDecoder<string>> = {};
export const VENDOR_VSADB_ENCODERS: Record<string, VendorEncoder<string>> = {};

/**
 * Vendor-Specific Audio Data Block carrier (CTA-861-G extended tag 0x11).
 *
 * `ieeeOui` is the integer little-endian OUI read from the first 3 post-tag
 * bytes; `vendorPayload` retains the raw post-OUI bytes. `vendor` carries the
 * structured shape when a per-vendor decoder is registered for the OUI —
 * unlike the VSVDB path, an unregistered OUI leaves `vendor` unset (the
 * legacy carrier shape), preserving the historical decoded shape while no
 * codecs are registered.
 */
export interface VendorSpecificAudioDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x11;
  ieeeOui: number;
  vendorPayload: Uint8Array;
  vendor?: VSADBVendorDecoded;
}

/**
 * Decode a VSADB block (tag 0x07, extended tag 0x11).
 *
 * The `payload` argument is the post-extended-tag bytes: a 3-byte little-
 * endian IEEE OUI followed by the vendor-specific body. The first 3 bytes are
 * split into the integer OUI on the carrier; everything after is the raw
 * `vendorPayload`. A registered per-vendor decoder (keyed by OUI) is then
 * invoked and its structured shape attached as `vendor`, mirroring the VSVDB
 * carrier in `../vsvdb/registry.ts`. No codecs are registered today, so
 * decode always yields the raw carrier (byte-identical round-trip).
 */
export function decodeVSADB(base: ExtendedDataBlock, payload: Uint8Array): VendorSpecificAudioDataBlock {
  if (payload.length < 3) {
    return {
      ...base,
      extendedTag: 0x11,
      ieeeOui: 0,
      vendorPayload: new Uint8Array(),
    };
  }

  const ieeeOui = readIeeeOuiLE(payload, 0);
  const data = payload.slice(3);

  const block: VendorSpecificAudioDataBlock = {
    ...base,
    extendedTag: 0x11,
    ieeeOui,
    vendorPayload: data,
  };

  const decoder = VENDOR_VSADB_DECODERS[ieeeOui];
  // Only attach the structured vendor shape when a codec is registered and
  // the post-OUI body is long enough for the vendor's format (decoder.minLength).
  // The union currently has no `fields` variant (no codecs registered), so the
  // attach goes through `unknown` — mirroring the VSVDB shape for a future codec.
  if (decoder && data.length >= decoder.minLength) {
    block.vendor = { kind: decoder.kind, fields: decoder.decode(data) } as unknown as VSADBVendorDecoded;
  }
  return block;
}

/**
 * Build the VSADB block bytes from an OUI and a post-OUI payload.
 * Layout: extended tag byte (0x11) + 3 OUI bytes (LE) + payload.
 * The block-level header byte (tag 0x07, length) is added by the CTA
 * block-framing code, not by this helper — only the post-header bytes are
 * returned. Mirrors `reassembleVsvdbBlock`.
 */
export function reassembleVsadbBlock(ieeeOui: number, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(1 + 3 + payload.length);
  out[0] = 0x11; // extended tag code
  writeIeeeOuiLE(out, 1, ieeeOui);
  out.set(payload, 4);
  return out;
}

/**
 * Encode a VSADB carrier to the post-header bytes: the extended-tag byte,
 * the little-endian OUI, then the raw `vendorPayload`. Re-encodes from the
 * structured `vendor.fields` when a registered encoder exists (parallel to
 * `encodeVendorSpecificVideoBlock` for the VSVDB); falls back to the raw
 * `vendorPayload` for unknown/unregistered OUIs so the carrier round-trips
 * byte-identically regardless of registration.
 */
export function encodeVSADB(block: VendorSpecificAudioDataBlock): Uint8Array {
  if (block.vendor && block.vendor.kind !== 'unknown') {
    // The union has no `fields` variant until a codec registers; the cast
    // mirrors the VSVDB encode path for a future codec.
    const vendor = block.vendor as unknown as { kind: string; fields: unknown };
    const encoder = VENDOR_VSADB_ENCODERS[vendor.kind];
    if (encoder) {
      return reassembleVsadbBlock(
        block.ieeeOui,
        encoder.encode(vendor.fields),
      );
    }
  }
  const bytes = [0x11];
  pushIeeeOuiLE(bytes, block.ieeeOui);
  for (const b of block.vendorPayload) bytes.push(b);
  return new Uint8Array(bytes);
}

/**
 * Return all Vendor-Specific Audio Data Blocks (tag 0x07, extended tag
 * 0x11) from a CEA extension's data block list. Mirrors `findVSVDBs` in the
 * parallel VSVDB module.
 */
export function findVSADBs(cea: CEAExtensionBlock): VendorSpecificAudioDataBlock[] {
  return cea.dataBlocks.filter(
    (b): b is VendorSpecificAudioDataBlock =>
      b.tag === 0x07 && (b as CEADataBlock & { extendedTag?: number }).extendedTag === 0x11
  );
}