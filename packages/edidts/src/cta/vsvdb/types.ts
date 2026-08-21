// packages/edidts/src/cta/vsvdb/types.ts

// The Vendor-Specific Video Data Block (VSVDB) is a CTA-861-G Extended Tag
// Data Block (tag 0x07, extended tag 0x01). The block's first 3 payload
// bytes are a little-endian IEEE OUI; everything after that is a
// vendor-specific payload. The carrier type `VendorSpecificVideoDataBlock`
// itself is defined in `./cta-extended-blocks.ts`; this file only
// contributes the per-vendor decoded shapes.

export interface DolbyVSDB {
  version: number;
  supportsYUV422_12bit: boolean;
  supports2160p60: boolean;
  supportsGlobalDimming: boolean;
  /** Byte 0 bits 4:3 — not field-modeled (version occupies 7:5, the capability
   *  flags 2:0), but real Dolby Vision v1/v2 blocks set them. Preserved so the
   *  codec is byte-complete and round-trips identically regardless of version. */
  byte0Reserved: number;
  /** Post-OUI bytes 1.. — vendor-reserved, preserved verbatim for byte-exact round-trip. */
  payload: Uint8Array;
}

export interface HDR10PlusVSDB {
  applicationVersion: number;  // post-OUI byte 0 (full byte)
  payload: Uint8Array;         // post-OUI bytes 1.. — vendor-specific, preserved verbatim
}

/**
 * Per-vendor decoded shape attached to the VSVDB carrier, parallel to
 * `VendorSpecificDecoded` for the tag-0x03 VSDB. `unknown` is the fallback for
 * unregistered OUIs and is never paired with a decoder/encoder.
 */
export type VSVDBVendorDecoded =
  | { kind: 'dolbyVsdb'; fields: DolbyVSDB }
  | { kind: 'hdr10PlusVsvdb'; fields: HDR10PlusVSDB }
  | { kind: 'unknown'; ieeeOui: number; raw: Uint8Array };
