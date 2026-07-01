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
}

export interface HDR10PlusVSDB {
  applicationVersion: number;
}
