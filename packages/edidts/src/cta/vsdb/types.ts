// packages/edidts/src/cta/vsdb/types.ts

import type { CEADataBlock } from '../extension-block';

/**
 * HDMI 1.4 Vendor-Specific Data Block (OUI 0x000C03).
 *
 * Layout per edid-decode `cta_hdmi_block` (parse-cta-block.cpp) and the HDMI 1.4
 * Specification. The post-OUI payload is:
 *   byte 0–1  Source Physical Address (A.B, C.D)
 *   byte 2    Flags (Supports_AI, DC_*, DVI_Dual)
 *   byte 3    Max TMDS Clock (in 5 MHz units)
 *   byte 4    Video/Latency byte (optional): Content Types (3:0),
 *             Interlaced latency present (6), Latency present (7),
 *             Extended HDMI video details present (5)
 *   byte 5..  Latency (progressive, optional interlaced) + extended details
 *             (3D present/mode, image size, HDMI VIC list, 3D structures)
 *
 * Fields after `maxTmdsClockMHz` are optional; they are `undefined` when the
 * payload is too short to carry them. `trailing` preserves any bytes after the
 * last modeled byte for byte-exact round-trip.
 */
export interface HDMI14VSDB {
  sourcePhysicalAddress: [number, number, number, number];
  supportsAI: boolean;
  dcY444: boolean;
  dc30bit: boolean;
  dc36bit: boolean;
  dc48bit: boolean;
  maxTmdsClockMHz: number;

  /** Byte 4 low nibble: Supported Content Types bitmap (Graphics=0x01, Photo=0x02, Cinema=0x04, Game=0x08). */
  contentTypes?: number;
  /** Video/audio latency, present iff byte 4 bit 7 set. */
  latency?: {
    progressive: HdmiLatency;
    /** Interlaced latency, present iff byte 4 bit 6 set. */
    interlaced?: HdmiLatency;
  };
  /** Extended HDMI video details, present iff byte 4 bit 5 set. */
  extended?: {
    /** Byte bit 7: 3D present. */
    threeDPresent: boolean;
    /** Byte bits 6:5 — determines whether 3D_Structure_ALL / VIC mask follow. */
    threeDMode: Hdmi3DMode;
    /** Byte bits 3:2 — Base EDID image size interpretation. */
    imageSize: HdmiImageSize;
    /** HDMI VIC list (HDMI VIC codes 1–4; maps to 4K formats). */
    hdmiVics: number[];
    /** 3D_Structure_ALL 16-bit mask, present iff threeDMode !== 'none'. */
    structureAll?: number;
    /** 3D-capable-VIC 16-bit mask, present iff threeDMode === 'vic-mask'. */
    vicMask?: number;
    /** Per-VIC 3D_Structure_X list (decoded with edid-decode's stride rule). */
    structures: Hdmi3DStructure[];
  };

  /** Bytes after the last modeled byte (preserved for byte-exact round-trip). */
  trailing: Uint8Array;
}

/** A video/audio latency pair. The raw byte encodes latency_ms = 1 + 2*byte (0 = not present, 0xff = unknown). */
export interface HdmiLatency {
  video: number;
  audio: number;
}

export type Hdmi3DMode = 'none' | 'all-vics-3d' | 'vic-mask';
export type HdmiImageSize = 'none' | 'aspect-ratio' | 'cm' | '5cm';

/** A per-VIC 3D structure entry (3D_Structure_X / 3D_Detail_X nibbles). */
export interface Hdmi3DStructure {
  /** 2D VIC order index (high nibble). */
  vicIndex: number;
  /** 3D_Structure_X (low nibble). */
  structure: number;
  /** 3D_Detail_X (high nibble of the following byte); present iff structure >= 8. */
  detail?: number;
}

export interface HDMIForumVSDB {
  version: number;
  maxTmdsCharacterRate: number;
  scdc: boolean;
  rr: boolean;
  lte340McscScramble: boolean;
  independentView: boolean;
  dualView: boolean;
  osd3d: boolean;
  dc30bit420: boolean;
  dc36bit420: boolean;
  dc48bit420: boolean;
  uhd4k: boolean;
  vrr: boolean;
  fapa: boolean;
  allm: boolean;
  fva: boolean;
  cnmVrr: boolean;
  dsc: boolean;
  maxFrlRate: number;
}

export interface MicrosoftHMDVSDB {
  version: number;
  desktopUsage: boolean;
  nonMicrosoftUsage: boolean;
  primaryUseCase: number;
  containerId: Uint8Array;  // 16-byte UUID
}

/**
 * AMD FreeSync VSDB (OUI 0x00001A). Layout per edid-decode `cta_amd`
 * (parse-cta-block.cpp), reverse-engineered from real EDIDs:
 *   byte 0  versionMajor      — FreeSync version major
 *   byte 1  versionMinor      — FreeSync version minor
 *   byte 2  minRefreshHz      — minimum refresh rate (Hz)
 *   byte 3  maxRefreshHz      — maximum refresh rate (Hz)
 *   byte 4  flags1            — FreeSync 1.x flags (raw); bits in 0xE6 ⇒ MCCS
 *   bytes 5.. trailing        — FreeSync 2.x extension, preserved verbatim.
 *                  edid-decode parses byte 5 as flags 2.x and bytes 6-9 as
 *                  max/min luminance (with and without local dimming) when
 *                  length >= 10, but marks those semantics as speculative, so
 *                  they are kept opaque here for round-trip safety.
 */
export interface AMDFreeSyncVSDB {
  versionMajor: number;
  versionMinor: number;
  minRefreshHz: number;
  maxRefreshHz: number;
  flags1: number;
  trailing: Uint8Array;     // bytes 5.. — FreeSync 2.x extension, preserved verbatim
}

export interface MHLVSDB {
  version: number;          // byte 0 bits 7:4 — MHL major version
  revision: number;         // byte 0 bits 3:0 — MHL minor revision
  deviceCapability: number; // byte 1 — capability flags (raw byte; per-bit semantics unverified)
  trailing: Uint8Array;     // bytes 2.. — reserved/vendor-specific, preserved verbatim
}

export type VendorSpecificDecoded =
  | { kind: 'hdmi14'; fields: HDMI14VSDB }
  | { kind: 'hdmiForum'; fields: HDMIForumVSDB }
  | { kind: 'microsoftHmd'; fields: MicrosoftHMDVSDB }
  | { kind: 'amdFreeSync'; fields: AMDFreeSyncVSDB }
  | { kind: 'mhl'; fields: MHLVSDB }
  | { kind: 'unknown'; ieeeOui: number; raw: Uint8Array };

export interface VendorSpecificDataBlock extends CEADataBlock {
  tag: 0x03;
  ieeeOui: number;
  /** Post-OUI vendor body (the codec input / raw-fallback source for unknown OUIs). */
  vendorPayload: Uint8Array;
  vendor?: VendorSpecificDecoded;
}

export const OUI = {
  HDMI_1_4: 0x000C03,
  HDMI_FORUM: 0xC45DD8,
  MICROSOFT_HMD: 0xCA125C,
  AMD: 0x00001A,
  // HDR10+ Technologies, LLC (IEEE oui.txt 90-84-8B). edid-decode keys this as
  // 0x90848b. The dispatcher reads the LE wire bytes (8B 84 90) as the integer
  // (MSB<<16)|(mid<<8)|LSB = 0x90848B, so the constant must be 0x90848B — NOT the
  // reversed 0x8B8490. HDR10+ is carried in a VSVDB (tag 0x07 ext 0x01), see
  // cta/vsvdb/registry.ts; there is no tag-0x03 VSDB form (edid-decode dumps a
  // tag-0x03 block with this OUI as raw bytes).
  HDR10_PLUS: 0x90848B,
  MHL: 0x7CD880,            // Silicon Image / MHL Consortium — LE on-wire; big-endian integer
  // Dolby Vision lives in a Vendor-Specific Video Data Block (tag 0x07 ext 0x01),
  // not a regular VSDB. The constant is exported here so that the vsvdb/ module
  // can register its decoder under the same OUI namespace.
  DOLBY: 0x00D046,
} as const;
