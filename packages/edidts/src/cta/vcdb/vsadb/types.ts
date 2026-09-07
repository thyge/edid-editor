// packages/edidts/src/cta/vcdb/vsadb/types.ts

// The Vendor-Specific Audio Data Block (VSADB) is a CTA-861-G Extended Tag
// Data Block (tag 0x07, extended tag 0x11), the audio counterpart of the VSVDB
// (extended tag 0x01). The block's first 3 payload bytes are a little-endian
// IEEE OUI; everything after that is a vendor-specific payload. The carrier
// type `VendorSpecificAudioDataBlock` itself is defined in `./registry.ts`;
// this file only contributes the per-vendor decoded shape.

/**
 * Per-vendor decoded shape attached to the VSADB carrier, parallel to
 * `VSVDBVendorDecoded` for the VSVDB. `unknown` is the fallback for
 * unregistered OUIs and is never paired with a decoder/encoder. No vendor
 * codecs are registered today; the union is closed with `never`-extensible
 * shape so a first codec (e.g. Dolby) slots in exactly like `vsvdb/`.
 */
export type VSADBVendorDecoded =
  | { kind: 'unknown'; ieeeOui: number; raw: Uint8Array };