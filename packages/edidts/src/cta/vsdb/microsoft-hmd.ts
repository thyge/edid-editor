// packages/edidts/src/cta/vsdb/microsoft-hmd.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type MicrosoftHMDVSDB } from './types';
import { clampByte, clampInt, keepShortLength } from '../byte-utils';

/**
 * Use-case labels for the Microsoft HMD VSDB primary-use-case field,
 * per Microsoft Learn "EDID Extension for Head-Mounted and Specialized
 * Monitors" (2025-04-24 revision) and edid-decode `display_use_case`.
 */
export const MICROSOFT_HMD_USE_CASES: Record<number, string> = {
  0x01: 'Test Equipment',
  0x02: 'Generic Display',
  0x03: 'Television',
  0x04: 'Productivity Display',
  0x05: 'Gaming Display',
  0x06: 'Presentation Display',
  0x07: 'VR Headset',
  0x08: 'AR Headset',
  0x10: 'Video Wall',
  0x11: 'Medical Display',
  0x12: 'Dedicated Gaming Display',
  0x13: 'Dedicated Video Monitor',
  0x14: 'Accessory Display',
};

export const MICROSOFT_HMD_DEFAULT: MicrosoftHMDVSDB = {
  version: 0,
  desktopUsage: false,
  nonMicrosoftUsage: false,
  primaryUseCase: 0,
  containerId: new Uint8Array(16),
};

/** Post-OUI body length of a well-formed block: version, flags, 16-byte Container ID. */
const BODY_LENGTH = 18;

/**
 * Microsoft HMD / Specialized Monitor VSDB (OUI 0xCA125C).
 *
 * Layout (post-OUI payload bytes), per the Microsoft spec and edid-decode
 * `cta_microsoft` (parse-cta-block.cpp):
 *   byte 0:     Version (0x01–0x03)
 *   byte 1:     bit 7 reserved, bit 6 Desktop Usage, bit 5 Third-Party
 *               Usage (both defined from version 3), bits 4:0 Display
 *               Product Primary Use Case (5 bits — 0x10–0x14 need bit 4)
 *   bytes 2-17: 16-byte Container ID (UUID)
 *
 * edid-decode only parses the block when the body is exactly 18 bytes; other
 * lengths still round-trip here (short bodies keep their length, extra bytes
 * live in `trailing`).
 */
export class MicrosoftHMDDecoder implements VendorDecoder<'microsoftHmd'> {
  readonly kind = 'microsoftHmd' as const;
  readonly minLength = 2;

  decode(payload: Uint8Array): MicrosoftHMDVSDB {
    const flags = payload[1] ?? 0;
    const containerId = new Uint8Array(16);
    containerId.set(payload.slice(2, BODY_LENGTH));
    const fields: MicrosoftHMDVSDB = {
      version: payload[0] ?? 0,
      desktopUsage: (flags & 0x40) !== 0,
      nonMicrosoftUsage: (flags & 0x20) !== 0,
      primaryUseCase: flags & 0x1f,
      containerId,
    };
    if (flags & 0x80) fields.flagsReserved = true;
    if (payload.length > BODY_LENGTH) fields.trailing = payload.slice(BODY_LENGTH);
    if (payload.length < BODY_LENGTH) fields.payloadLength = payload.length;
    return fields;
  }
}

export class MicrosoftHMDEncoder implements VendorEncoder<'microsoftHmd'> {
  readonly kind = 'microsoftHmd' as const;

  encode(fields: MicrosoftHMDVSDB): Uint8Array {
    // Never throws: an unknown use case is still a valid 5-bit value, and the
    // Container ID is cut / zero-padded to 16 bytes, so the EDID stays savable.
    const trailing = fields.trailing ?? new Uint8Array();
    const out = new Uint8Array(BODY_LENGTH + trailing.length);
    out[0] = clampByte(fields.version);
    out[1] =
      (fields.flagsReserved ? 0x80 : 0) |
      (fields.desktopUsage ? 0x40 : 0) |
      (fields.nonMicrosoftUsage ? 0x20 : 0) |
      clampInt(fields.primaryUseCase, 0, 0x1f);
    out.set((fields.containerId ?? new Uint8Array()).slice(0, 16), 2);
    out.set(trailing, BODY_LENGTH);
    return keepShortLength(out, fields.payloadLength);
  }
}

export function isValidMicrosoftHMDUseCase(v: number): boolean {
  return v in MICROSOFT_HMD_USE_CASES;
}

VENDOR_DECODERS[OUI.MICROSOFT_HMD] = new MicrosoftHMDDecoder();
VENDOR_ENCODERS['microsoftHmd'] = new MicrosoftHMDEncoder();
