// packages/edidts/src/cta/vsdb/hdmi14.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type HDMI14VSDB } from './types';

export const HDMI14_DEFAULT: HDMI14VSDB = {
  sourcePhysicalAddress: [0, 0, 0, 0],
  supportsAI: false,
  dcY444: false,
  dc30bit: false,
  dc36bit: false,
  dc48bit: false,
  maxTmdsClockMHz: 0,
};

export class HDMI14Decoder implements VendorDecoder<'hdmi14'> {
  readonly kind = 'hdmi14' as const;
  readonly minLength = 2;

  decode(payload: Uint8Array): HDMI14VSDB {
    if (payload.length < 2) return { ...HDMI14_DEFAULT };

    const physAddr = (payload[0] << 8) | payload[1];
    const flags = payload.length >= 3 ? payload[2] : 0;
    return {
      sourcePhysicalAddress: [
        (physAddr >> 12) & 0x0F,
        (physAddr >> 8) & 0x0F,
        (physAddr >> 4) & 0x0F,
        physAddr & 0x0F,
      ],
      supportsAI: (flags & 0x80) !== 0,
      dcY444: (flags & 0x08) !== 0,
      dc30bit: (flags & 0x10) !== 0,
      dc36bit: (flags & 0x20) !== 0,
      dc48bit: (flags & 0x40) !== 0,
      maxTmdsClockMHz: payload.length >= 4 ? payload[3] * 5 : 0,
    };
  }
}

export class HDMI14Encoder implements VendorEncoder<'hdmi14'> {
  readonly kind = 'hdmi14' as const;

  encode(fields: HDMI14VSDB): Uint8Array {
    const [a, b, c, d] = fields.sourcePhysicalAddress;
    const physAddr = ((a & 0x0F) << 12) | ((b & 0x0F) << 8) | ((c & 0x0F) << 4) | (d & 0x0F);
    const flags =
      (fields.supportsAI ? 0x80 : 0) |
      (fields.dcY444 ? 0x08 : 0) |
      (fields.dc30bit ? 0x10 : 0) |
      (fields.dc36bit ? 0x20 : 0) |
      (fields.dc48bit ? 0x40 : 0);

    // Always emit a full 4-byte payload (PhysAddr + flags + MaxTMDS). Real
    // HDMI 1.4 VSDBs in the wild always carry a length-7 block, and the
    // reassembled header byte `0x67` depends on this shape.
    const out = new Uint8Array(4);
    out[0] = (physAddr >> 8) & 0xFF;
    out[1] = physAddr & 0xFF;
    out[2] = flags;
    out[3] = fields.maxTmdsClockMHz === 0 ? 0 : Math.round(fields.maxTmdsClockMHz / 5);
    return out;
  }
}

VENDOR_DECODERS[OUI.HDMI_1_4] = new HDMI14Decoder();
VENDOR_ENCODERS['hdmi14'] = new HDMI14Encoder();
