/**
 * Vendor-Specific Video Data Block (CTA-861-G §7.5.4, Extended Tag 1)
 *
 * VCDB-family block (see `cta/vcdb/`): the VSVDB carrier. The decoded
 * per-vendor shape (Dolby Vision, HDR10+, ...) is surfaced on the carrier
 * as `vendor`, mirroring the tag-0x03 VSDB. `vendorPayload` retains the
 * raw post-OUI bytes; `vendor.fields` holds the structured, editable form. The
 * CTA encoder re-encodes from `vendor.fields` when a registered encoder exists
 * (see `encodeVendorSpecificVideoBlock`), falling back to the raw
 * `vendorPayload` for unknown OUIs. Per-vendor codecs live in `vsvdb/`.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';
import { pushIeeeOuiLE } from '../../common/bintools';
import { decodeVSVDB, reassembleVsvdbBlock, VENDOR_VSVDB_ENCODERS } from './vsvdb/registry';
import type { VSVDBVendorDecoded } from './vsvdb/types';

export interface VendorSpecificVideoDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x01;
  ieeeOui: number;
  vendorPayload: Uint8Array;
  vendor?: VSVDBVendorDecoded;
}

export function decodeVendorSpecificVideoBlock(base: ExtendedDataBlock, payload: Uint8Array): VendorSpecificVideoDataBlock {
  return decodeVSVDB(base, payload);
}

export function encodeVendorSpecificVideoBlock(block: VendorSpecificVideoDataBlock): Uint8Array {
  // Re-encode from the structured `vendor.fields` when a registered encoder
  // exists (parallel to `encodeVendorSpecificDataBlock` for tag-0x03 VSDBs).
  // `reassembleVsvdbBlock` emits the extended-tag byte + LE OUI + post-OUI
  // body, which is exactly the post-header bytes `encodeExtendedDataBlock`
  // must return. Falls back to the raw `payload` for unknown/unregistered OUIs
  // so the carrier round-trips byte-identically regardless of registration.
  if (block.vendor && block.vendor.kind !== 'unknown') {
    const encoder = VENDOR_VSVDB_ENCODERS[block.vendor.kind];
    if (encoder) {
      return reassembleVsvdbBlock(
        block.ieeeOui,
        encoder.encode(block.vendor.fields),
      );
    }
  }
  const bytes = [0x01];
  pushIeeeOuiLE(bytes, block.ieeeOui);
  for (const b of block.vendorPayload) bytes.push(b);
  return new Uint8Array(bytes);
}