// packages/edidts/src/cta/vcdb/vsadb/types.ts

// The Vendor-Specific Audio Data Block (VSADB) is a CTA-861-G Extended Tag
// Data Block (tag 0x07, extended tag 0x11), the audio counterpart of the VSVDB
// (extended tag 0x01). The block's first 3 payload bytes are a little-endian
// IEEE OUI; everything after that is a vendor-specific payload. The carrier
// type `VendorSpecificAudioDataBlock` itself is defined in `./registry.ts`;
// this file only contributes the per-vendor decoded shape.

/**
 * Dolby Laboratories VSADB (OUI 00-D0-46) post-OUI body, per the edid-decode
 * reference parser `cta_dolby_audio()` (parse-cta-block.cpp) — the only citable
 * public source; the official layout lives in the licensed Dolby Atmos
 * application notes. Layout (minimum 2 bytes):
 *
 *   byte 0  bit 7:    headphone playback only
 *           bit 6:    height speaker zone present
 *           bit 5:    surround speaker zone present
 *           bit 4:    center speaker zone present
 *           bit 3:    (not parsed by edid-decode; kept in `byte0Reserved`)
 *           bits 2:0: version - 1 (edid-decode reports `1 + (x[0] & 0x07)`)
 *   byte 1  bit 0:    Dolby MAT PCM decoding at 48 kHz only (no TrueHD)
 *           bits 7:1: (not parsed by edid-decode; kept in `byte1Reserved`)
 *   bytes 2..         vendor-reserved, preserved verbatim in `trailing`
 */
export interface DolbyVSADB {
  /** Semantic version, 1..8 (wire stores version - 1 in byte 0 bits 2:0). */
  version: number;
  /** Byte 0 bit 7 — playback over headphones only. */
  headphoneOnly: boolean;
  /** Byte 0 bit 6 — height speaker zone present. */
  heightZone: boolean;
  /** Byte 0 bit 5 — surround speaker zone present. */
  surroundZone: boolean;
  /** Byte 0 bit 4 — center speaker zone present. */
  centerZone: boolean;
  /** Byte 0 bit 3 — unmodeled by edid-decode, preserved for round-trip. */
  byte0Reserved: number;
  /** Byte 1 bit 0 — MAT PCM decoding at 48 kHz only, does not support TrueHD. */
  mat48kHzOnly: boolean;
  /** Byte 1 bits 7:1 — unmodeled by edid-decode, preserved for round-trip. */
  byte1Reserved: number;
  /** Bytes 2.. — vendor-reserved, preserved verbatim for byte-exact round-trip. */
  trailing: Uint8Array;
}

/**
 * Per-vendor decoded shape attached to the VSADB carrier, parallel to
 * `VSVDBVendorDecoded` for the VSVDB. `unknown` is the fallback for
 * unregistered OUIs and is never paired with a decoder/encoder. The Dolby
 * codec (OUI 00-D0-46) is registered in `./dolby.ts`.
 */
export type VSADBVendorDecoded =
  | { kind: 'dolbyVsadb'; fields: DolbyVSADB }
  | { kind: 'unknown'; ieeeOui: number; raw: Uint8Array };