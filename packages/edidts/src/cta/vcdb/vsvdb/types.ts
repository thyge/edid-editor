// packages/edidts/src/cta/vsvdb/types.ts

// The Vendor-Specific Video Data Block (VSVDB) is a CTA-861-G Extended Tag
// Data Block (tag 0x07, extended tag 0x01). The block's first 3 payload
// bytes are a little-endian IEEE OUI; everything after that is a
// vendor-specific payload. The carrier type `VendorSpecificVideoDataBlock`
// itself is defined in `../vendor-specific-video.ts`; this file only
// contributes the per-vendor decoded shapes.

/**
 * Dolby Vision VSVDB post-OUI body. The layout depends on `version`
 * (edid-decode `cta_dolby_video`); see `dolby.ts` for the per-version table.
 */
export interface DolbyVSDB {
  /** Byte 0 bits 7:5. Selects the layout of every other field. */
  version: number;
  /** Byte 0 bit 0 (every version). */
  supportsYUV422_12bit: boolean;
  /** Byte 0 bit 1 in v0 and v1 (in v2 that bit is `supportsBacklightControl`). */
  supports2160p60: boolean;
  /** v2 only: byte 0 bit 1, backlight control. */
  supportsBacklightControl?: boolean;
  /** v1/v2 only: byte 0 bits 4:2, the DM version minus 2 (0 → "DM 2.x"). */
  dmVersion?: number;
  /** v0: byte 0 bit 2; v1: byte 1 bit 0; v2: byte 1 bit 2. */
  supportsGlobalDimming: boolean;
  /**
   * Byte 0 bits no field covers, shifted down: v0 bits 4:3 (0–3); v3+ bits
   * 4:1 (0–15, layout unknown). Always 0 for v1/v2.
   */
  byte0Reserved: number;
  /**
   * v1/v2 only: byte 1 with the global-dimming bit cleared (target luminance /
   * PQ / backlight fields, kept raw). Absent when the block has no byte 1.
   */
  byte1Rest?: number;
  /** Remaining bytes (v1/v2: bytes 2..; other versions: bytes 1..), preserved verbatim. */
  trailing: Uint8Array;
}

/** HDR10+ VSVDB post-OUI body, per edid-decode `cta_hdr10plus`. */
export interface HDR10PlusVSDB {
  /** Byte 0 bits 1:0 (0–3). */
  applicationVersion: number;
  /** Byte 0 bits 3:2 (0–3). Optional for literals; absent means 0. */
  fullFramePeakLuminanceIndex?: number;
  /** Byte 0 bits 7:4 (0–15). Optional for literals; absent means 0. */
  peakLuminanceIndex?: number;
  trailing: Uint8Array;        // post-OUI bytes 1.. — vendor-specific, preserved verbatim
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
