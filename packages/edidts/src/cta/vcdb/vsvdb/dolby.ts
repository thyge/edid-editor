// packages/edidts/src/cta/vsvdb/dolby.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_VSVDB_DECODERS, VENDOR_VSVDB_ENCODERS } from './registry';
import { OUI } from '../../vsdb/types';
import type { DolbyVSDB } from './types';
import { clampByte, clampInt } from '../../byte-utils';

// Dolby Vision VSVDB post-OUI layout, per version (edid-decode
// `cta_dolby_video`, parse-cta-block.cpp). Byte 0 bits 7:5 are the version and
// bit 0 is "YUV 4:2:2 12-bit" in every version; the other bits move:
//
//   v0  byte 0: bit 1 2160p60, bit 2 global dimming, bits 4:3 reserved
//       bytes 1..: chromaticities, target PQ, DM version (kept in `trailing`)
//   v1  byte 0: bit 1 2160p60, bits 4:2 DM version (− 2)
//       byte 1: bit 0 global dimming, bits 7:1 target max luminance
//   v2  byte 0: bit 1 backlight control, bits 4:2 DM version (− 2)
//       byte 1: bit 2 global dimming, bits 1:0 backlight min luma,
//               bits 7:3 target min PQ
//   v3+ not parsed by edid-decode: byte 0 bits 4:1 kept raw.
//
// Bits that are not field-modeled (the rest of byte 1 in v1/v2 and every later
// byte) are kept raw in `byte1Rest` / `trailing`, so each bit lives in exactly
// one field and decode → encode is byte-exact for every version.

export const DOLBY_VSDB_DEFAULT: DolbyVSDB = {
  version: 0,
  supportsYUV422_12bit: false,
  supports2160p60: false,
  supportsGlobalDimming: false,
  byte0Reserved: 0,
  trailing: new Uint8Array(),
};

/** Byte-1 mask of the global-dimming bit in v1 / v2. */
function globalDimmingMask(version: number): number {
  return version === 1 ? 0x01 : 0x04;
}

export class DolbyVSDBDecoder implements VendorDecoder<'dolbyVsdb'> {
  readonly kind = 'dolbyVsdb' as const;
  readonly minLength = 1;

  decode(payload: Uint8Array): DolbyVSDB {
    if (payload.length < 1) return { ...DOLBY_VSDB_DEFAULT, trailing: new Uint8Array() };
    const byte0 = payload[0];
    const version = (byte0 >> 5) & 0x07;
    const supportsYUV422_12bit = (byte0 & 0x01) !== 0;

    if (version === 0) {
      return {
        version,
        supportsYUV422_12bit,
        supports2160p60: (byte0 & 0x02) !== 0,
        supportsGlobalDimming: (byte0 & 0x04) !== 0,
        byte0Reserved: (byte0 >> 3) & 0x03,
        trailing: payload.slice(1),
      };
    }

    if (version === 1 || version === 2) {
      const mask = globalDimmingMask(version);
      const fields: DolbyVSDB = {
        version,
        supportsYUV422_12bit,
        supports2160p60: version === 1 && (byte0 & 0x02) !== 0,
        dmVersion: (byte0 >> 2) & 0x07,
        supportsGlobalDimming: payload.length > 1 && (payload[1] & mask) !== 0,
        byte0Reserved: 0,
        trailing: payload.slice(2),
      };
      if (version === 2) fields.supportsBacklightControl = (byte0 & 0x02) !== 0;
      if (payload.length > 1) fields.byte1Rest = payload[1] & ~mask & 0xff;
      return fields;
    }

    // v3+: layout unknown — keep bits 4:1 raw.
    return {
      version,
      supportsYUV422_12bit,
      supports2160p60: false,
      supportsGlobalDimming: false,
      byte0Reserved: (byte0 >> 1) & 0x0f,
      trailing: payload.slice(1),
    };
  }
}

export class DolbyVSDBEncoder implements VendorEncoder<'dolbyVsdb'> {
  readonly kind = 'dolbyVsdb' as const;

  encode(fields: DolbyVSDB): Uint8Array {
    // Never throw (the EDID must stay savable): out-of-range values clamp.
    const version = clampInt(fields.version, 0, 0x07);
    // `trailing` carries the not-field-modeled bytes verbatim. Tolerate callers
    // passing the legacy shape (no `trailing`).
    const trailing = fields.trailing ?? new Uint8Array();
    let byte0 = (version << 5) | (fields.supportsYUV422_12bit ? 0x01 : 0);

    if (version === 1 || version === 2) {
      const bit1 = version === 1 ? fields.supports2160p60 : fields.supportsBacklightControl;
      byte0 |= (bit1 ? 0x02 : 0) | (clampInt(fields.dmVersion ?? 0, 0, 0x07) << 2);
      const head = [byte0];
      // Byte 1 exists when the source had it, when global dimming needs it, or
      // when later bytes follow it.
      if (fields.byte1Rest !== undefined || fields.supportsGlobalDimming || trailing.length > 0) {
        const mask = globalDimmingMask(version);
        head.push((clampByte(fields.byte1Rest ?? 0) & ~mask) | (fields.supportsGlobalDimming ? mask : 0));
      }
      return concat(head, trailing);
    }

    if (version === 0) {
      byte0 |=
        (fields.supports2160p60 ? 0x02 : 0) |
        (fields.supportsGlobalDimming ? 0x04 : 0) |
        (clampInt(fields.byte0Reserved ?? 0, 0, 0x03) << 3);
    } else {
      byte0 |= clampInt(fields.byte0Reserved ?? 0, 0, 0x0f) << 1;
    }
    return concat([byte0], trailing);
  }
}

function concat(head: number[], tail: Uint8Array): Uint8Array {
  const out = new Uint8Array(head.length + tail.length);
  out.set(head, 0);
  out.set(tail, head.length);
  return out;
}

/**
 * Change only the version bits (byte 0 bits 7:5) and re-read the block with
 * that version's layout. The other bytes stay exactly as they are; what they
 * mean follows the new version (e.g. v0's global-dimming bit is part of the
 * DM version in v1/v2).
 */
export function setDolbyVsvdbVersion(fields: DolbyVSDB, version: number): DolbyVSDB {
  const bytes = new DolbyVSDBEncoder().encode(fields);
  bytes[0] = (bytes[0] & 0x1f) | (clampInt(version, 0, 0x07) << 5);
  return new DolbyVSDBDecoder().decode(bytes);
}

VENDOR_VSVDB_DECODERS[OUI.DOLBY] = new DolbyVSDBDecoder();
VENDOR_VSVDB_ENCODERS['dolbyVsdb'] = new DolbyVSDBEncoder();
