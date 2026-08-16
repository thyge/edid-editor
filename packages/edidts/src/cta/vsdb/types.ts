// packages/edidts/src/cta/vsdb/types.ts

import type { CEADataBlock } from '../extension-block';

export interface HDMI14VSDB {
  sourcePhysicalAddress: [number, number, number, number];
  supportsAI: boolean;
  dcY444: boolean;
  dc30bit: boolean;
  dc36bit: boolean;
  dc48bit: boolean;
  maxTmdsClockMHz: number;
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

export interface AMDFreeSyncVSDB {
  minRefreshHz: number;
  maxRefreshHz: number;
  nativeRefreshHz: number;
  flags: number;
}

export interface HDR10PlusVSDB {
  applicationIdentifier: number;
  applicationVersion: number;
  payload: Uint8Array;
}

export interface MHLVSDB {
  version: number;          // byte 0 bits 7:4 — MHL major version
  revision: number;         // byte 0 bits 3:0 — MHL minor revision
  deviceCapability: number; // byte 1 — capability flags (raw byte; per-bit semantics unverified)
  payload: Uint8Array;      // bytes 2.. — reserved/vendor-specific, preserved verbatim
}

export type VendorSpecificDecoded =
  | { kind: 'hdmi14'; fields: HDMI14VSDB }
  | { kind: 'hdmiForum'; fields: HDMIForumVSDB }
  | { kind: 'microsoftHmd'; fields: MicrosoftHMDVSDB }
  | { kind: 'amdFreeSync'; fields: AMDFreeSyncVSDB }
  | { kind: 'hdr10Plus'; fields: HDR10PlusVSDB }
  | { kind: 'mhl'; fields: MHLVSDB }
  | { kind: 'unknown'; ieeeOui: number; raw: Uint8Array };

export interface VendorSpecificDataBlock extends CEADataBlock {
  tag: 0x03;
  ieeeOui: number;
  payload: Uint8Array;
  vendor?: VendorSpecificDecoded;
}

export const OUI = {
  HDMI_1_4: 0x000C03,
  HDMI_FORUM: 0xC45DD8,
  MICROSOFT_HMD: 0xCA125C,
  AMD: 0x00001A,
  HDR10_PLUS: 0x8B8490,        // LE on-wire; big-endian integer
  MHL: 0x7CD880,            // Silicon Image / MHL Consortium — LE on-wire; big-endian integer
  // Dolby Vision lives in a Vendor-Specific Video Data Block (tag 0x07 ext 0x01),
  // not a regular VSDB. The constant is exported here so that the vsvdb/ module
  // can register its decoder under the same OUI namespace.
  DOLBY: 0x00D046,
} as const;
