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

export interface VESAAdaptiveSyncVSDB {
  fixedRateLink: boolean;
  minRefreshHz: number;
  maxRefreshHz: number;
  minBacklightHz: number;
  adaptiveSyncCapable: boolean;
  bcap30: boolean;
  dsc8bpc: boolean;
  dsc10bpc: boolean;
  dsc12bpc: boolean;
  selFl: boolean;
  vfrInactive: boolean;
}

export interface NvidiaVSDB {
  version: number;
  minRefreshHz: number;
  maxRefreshHz: number;
  flags: number;
}

export type VendorSpecificDecoded =
  | { kind: 'hdmi14'; fields: HDMI14VSDB }
  | { kind: 'hdmiForum'; fields: HDMIForumVSDB }
  | { kind: 'microsoftHmd'; fields: MicrosoftHMDVSDB }
  | { kind: 'amdFreeSync'; fields: AMDFreeSyncVSDB }
  | { kind: 'hdr10Plus'; fields: HDR10PlusVSDB }
  | { kind: 'vesaAdaptiveSync'; fields: VESAAdaptiveSyncVSDB }
  | { kind: 'nvidia'; fields: NvidiaVSDB }
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
  VESA_ADAPTIVE_SYNC: 0x9C5A78,
  NVIDIA: 0x00044B,
} as const;
