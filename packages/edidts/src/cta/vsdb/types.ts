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
  /** Byte 2 bit 0: DVI_Dual (dual-link DVI). Set only when the bit is on. */
  dviDual?: boolean;
  /** Byte 2 bits 2:1 (reserved), kept raw so they survive a re-encode. Set only when non-zero. */
  flagsReserved?: number;
  /**
   * How many of bytes 0-3 the decoded block carried, when fewer than all four
   * (the common "physical address only" form is 2). Encode keeps that short
   * form unless a field that needs the later bytes is set.
   */
  headLength?: number;

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
    /**
     * Present iff the length byte declares more VIC / 3D bytes than the block
     * actually contains — a common TV nonconformance (the declared overhang
     * would otherwise pad phantom zero VICs). Doubles as the diagnostic and
     * the round-trip preservation: encode re-writes the raw declared counts so
     * the source length byte and block size survive verbatim, while
     * hdmiVics/structures only contain bytes actually present.
     */
    declaredLengths?: {
      /** Length byte bits 7:5 — declared HDMI VIC count. */
      vics: number;
      /** Length byte bits 4:0 — declared 3D byte count. */
      threeD: number;
    };
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

/** Display-label options for the HDMI 1.4 VSDB 3D mode field. */
export const HDMI_3D_MODE_OPTIONS: ReadonlyArray<{ value: Hdmi3DMode; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'all-vics-3d', label: 'All VICs 3D' },
  { value: 'vic-mask', label: 'VIC Mask' },
];

/** Display-label options for the HDMI 1.4 VSDB base image-size field. */
export const HDMI_IMAGE_SIZE_OPTIONS: ReadonlyArray<{ value: HdmiImageSize; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'aspect-ratio', label: 'Aspect Ratio' },
  { value: 'cm', label: 'Centimeters' },
  { value: '5cm', label: '5 cm Units' },
];

/** A per-VIC 3D structure entry (3D_Structure_X / 3D_Detail_X nibbles). */
export interface Hdmi3DStructure {
  /** 2D VIC order index (high nibble). */
  vicIndex: number;
  /** 3D_Structure_X (low nibble). */
  structure: number;
  /** 3D_Detail_X (high nibble of the following byte); present iff structure >= 8. */
  detail?: number;
}

/**
 * HDMI Forum VSDB (HF-VSDB, OUI C4-5D-D8), post-OUI payload per HDMI 2.1 and
 * edid-decode `cta_hf_scdb`. Bytes 0-3 are always present (HDMI 2.0); bytes
 * 4, 5-6 and 7-9 are optional HDMI 2.1 groups.
 */
export interface HDMIForumVSDB {
  /** Byte 0. Always 1 in HDMI 2.x. */
  version: number;
  /** Byte 1 × 5, in MHz (0 = not indicated). */
  maxTmdsCharacterRate: number;
  // Byte 2
  scdc: boolean;
  rr: boolean;
  cableStatus: boolean;
  /** Color Content Bits Per Component Indication. */
  ccbpci: boolean;
  lte340McscScramble: boolean;
  independentView: boolean;
  dualView: boolean;
  osd3d: boolean;
  // Byte 3
  /** Bits 7:4 — see HDMI_FRL_RATE_OPTIONS. */
  maxFrlRate: number;
  /** Bit 3: UHD VIC (HDMI VIC ↔ CTA VIC equivalence). */
  uhd4k: boolean;
  dc48bit420: boolean;
  dc36bit420: boolean;
  dc30bit420: boolean;
  // Byte 4 (HDMI 2.1)
  fapaEndExtended: boolean;
  qms: boolean;
  mDelta: boolean;
  /** CinemaVRR — deprecated by HDMI 2.1a, kept so existing blocks round-trip. */
  cinemaVrr: boolean;
  negativeMvrr: boolean;
  fva: boolean;
  allm: boolean;
  /** FAPA in blanking after the first active video line. */
  fapaStartLocation: boolean;
  // Bytes 5-6 (HDMI 2.1)
  /** Hz, 6 bits (0 = VRR not supported). */
  vrrMin: number;
  /** Hz, 10 bits. */
  vrrMax: number;
  // Byte 7 (HDMI 2.1 DSC)
  dsc12: boolean;
  dscNative420: boolean;
  qmsTfrMax: boolean;
  qmsTfrMin: boolean;
  dscAllBpp: boolean;
  dsc16bpc: boolean;
  dsc12bpc: boolean;
  dsc10bpc: boolean;
  // Byte 8
  /** Bits 7:4 — same code table as maxFrlRate. */
  dscMaxFrlRate: number;
  /** Bits 3:0 — see HDMI_DSC_MAX_SLICES_OPTIONS. */
  dscMaxSlices: number;
  // Byte 9
  /** Bits 5:0; the line-of-chunks limit is 1024 × (1 + value) bytes. */
  dscTotalChunkKBytes: number;
  /**
   * Number of post-OUI bytes the decoded block carried. Encode never writes a
   * shorter block than this (so an HDMI 2.0 4-byte block stays 4 bytes and a
   * full HDMI 2.1 block keeps its zero-valued tail); optional for literals.
   */
  payloadLength?: number;
  /** Bytes after byte 9, preserved verbatim. */
  trailing: Uint8Array;
}

/** HF-VSDB DSC_Max_Slices code options (byte 8 bits 3:0, per HDMI 2.1). */
export const HDMI_DSC_MAX_SLICES_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'Not supported' },
  { value: 1, label: '1 slice, 340 MHz/slice' },
  { value: 2, label: '2 slices, 340 MHz/slice' },
  { value: 3, label: '4 slices, 340 MHz/slice' },
  { value: 4, label: '8 slices, 340 MHz/slice' },
  { value: 5, label: '8 slices, 400 MHz/slice' },
  { value: 6, label: '12 slices, 400 MHz/slice' },
  { value: 7, label: '12 slices, 600 MHz/slice' },
];

/**
 * HDMI Forum VSDB Max FRL Rate code options (CTA-861-G HDMI 2.1, 3-bit code).
 * `value` is the on-the-wire code stored on `HDMIForumVSDB.maxFrlRate`.
 */
export const HDMI_FRL_RATE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'None' },
  { value: 1, label: '3 Gbps (3 lanes)' },
  { value: 2, label: '6 Gbps (3 lanes)' },
  { value: 3, label: '6 Gbps (4 lanes)' },
  { value: 4, label: '8 Gbps (4 lanes)' },
  { value: 5, label: '10 Gbps (4 lanes)' },
  { value: 6, label: '12 Gbps (4 lanes)' },
];

/** Display label for an HDMI Forum Max FRL Rate code, tolerating unknown codes. */
export function getHdmiFrlRateLabel(rate: number): string {
  return HDMI_FRL_RATE_OPTIONS[rate]?.label ?? `Rate ${rate}`;
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
