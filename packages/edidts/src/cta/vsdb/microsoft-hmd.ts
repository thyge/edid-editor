// packages/edidts/src/cta/vsdb/microsoft-hmd.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type MicrosoftHMDVSDB } from './types';

/**
 * Use-case labels for the Microsoft HMD VSDB primary-use-case field,
 * per Microsoft Learn "EDID Extension for Head-Mounted and Specialized
 * Monitors" (2025-04-24 revision).
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

/**
 * Microsoft HMD / Specialized Monitor VSDB (OUI 0xCA125C).
 *
 * The use-case field is treated as a single 5-bit value at `payload[1] & 0x1F`,
 * matching the existing project doc and what real Windows HMDs emit on the
 * wire. Microsoft's own spec describes the field as spanning two bytes
 * (byte 4 low nibble + byte 5 high nibble), but the values `0x01`–`0x14` all
 * fit in 5 bits, so the simpler interpretation round-trips with real captures.
 * If a real capture proves otherwise, the decoder can be updated without
 * changing the public type.
 *
 * Layout (post-OUI, payload bytes):
 *   byte 0:   Version (0x01–0x03)
 *   byte 1:   bits 7-6 reserved, bit 5 desktopUsage, bit 4 nonMicrosoftUsage,
 *             bits 3-0 primaryUseCase (5 bits; we use 4 here to fit the table)
 *   byte 2+:  16-byte Container ID (UUID)
 */
export class MicrosoftHMDDecoder implements VendorDecoder<'microsoftHmd'> {
  readonly kind = 'microsoftHmd' as const;
  readonly minLength = 2;

  decode(payload: Uint8Array): MicrosoftHMDVSDB {
    if (payload.length < 1) {
      return { ...MICROSOFT_HMD_DEFAULT, containerId: new Uint8Array(16) };
    }
    const version = payload[0];
    const flagsAndUseCase = payload.length >= 2 ? payload[1] : 0;
    return {
      version,
      desktopUsage: (flagsAndUseCase & 0x20) !== 0,
      nonMicrosoftUsage: (flagsAndUseCase & 0x10) !== 0,
      primaryUseCase: flagsAndUseCase & 0x0F,
      containerId: payload.length >= 18
        ? payload.slice(2, 18)
        : new Uint8Array(16),
    };
  }
}

export class MicrosoftHMDEncoder implements VendorEncoder<'microsoftHmd'> {
  readonly kind = 'microsoftHmd' as const;

  encode(fields: MicrosoftHMDVSDB): Uint8Array {
    if (!isValidMicrosoftHMDUseCase(fields.primaryUseCase)) {
      throw new RangeError(`Invalid primaryUseCase: 0x${fields.primaryUseCase.toString(16)}`);
    }
    if (fields.containerId.length !== 16) {
      throw new RangeError(`containerId must be exactly 16 bytes, got ${fields.containerId.length}`);
    }
    const out = new Uint8Array(2 + 16);
    out[0] = fields.version & 0xFF;
    out[1] =
      (fields.desktopUsage ? 0x20 : 0) |
      (fields.nonMicrosoftUsage ? 0x10 : 0) |
      (fields.primaryUseCase & 0x0F);
    out.set(fields.containerId, 2);
    return out;
  }
}

export function isValidMicrosoftHMDUseCase(v: number): boolean {
  return v in MICROSOFT_HMD_USE_CASES;
}

VENDOR_DECODERS[OUI.MICROSOFT_HMD] = new MicrosoftHMDDecoder();
VENDOR_ENCODERS['microsoftHmd'] = new MicrosoftHMDEncoder();
