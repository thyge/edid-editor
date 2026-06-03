// packages/edidts/src/cta/vsdb/hdmi-forum.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type HDMIForumVSDB } from './types';

export const HDMI_FORUM_DEFAULT: HDMIForumVSDB = {
  version: 0,
  maxTmdsCharacterRate: 0,
  scdc: false,
  rr: false,
  lte340McscScramble: false,
  independentView: false,
  dualView: false,
  osd3d: false,
  dc30bit420: false,
  dc36bit420: false,
  dc48bit420: false,
  uhd4k: false,
  vrr: false,
  fapa: false,
  allm: false,
  fva: false,
  cnmVrr: false,
  dsc: false,
  maxFrlRate: 0,
};

/**
 * HDMI Forum Vendor Specific Data Block (HF-VSDB).
 *
 * Per CTA-861-G Annex F.3 / HDMI 2.1 spec §10.3, the HF-VSDB layout
 * (post-OUI payload, minimum 5 bytes) is:
 *
 *   byte 0  Version (= 0x01 for HDMI 2.1)
 *   byte 1  Max_TMDS_Character_Rate (5 MHz units)
 *   byte 2  Flags 1 (SCDC, RR, scramble, multi-view)
 *   byte 3  YCbCr 4:2:0 deep color + Max FRL Rate
 *           bits 7-4: Max_FRL_Rate[3:0]
 *           bit 3:    UHD_4K_support
 *           bit 2:    DC_48bit_420
 *           bit 1:    DC_36bit_420
 *           bit 0:    DC_30bit_420
 *   byte 4  Flags 2 (HDMI 2.1)
 *           bit 7:    VRR (Variable Refresh Rate)
 *           bit 6:    (reserved)
 *           bit 5:    (reserved)
 *           bit 4:    (reserved)
 *           bit 3:    CinemaVRR (cnmVrr)
 *           bit 2:    FAPA_Start_Location
 *           bit 1:    ALLM
 *           bit 0:    FVA (Fast VActive)
 *   byte 5  Flags 3
 *           bit 7:    DSC_1p2
 *           bits 6-0: (reserved / FRL extension)
 */
export class HDMIForumDecoder implements VendorDecoder<'hdmiForum'> {
  readonly kind = 'hdmiForum' as const;
  readonly minLength = 5;

  decode(payload: Uint8Array): HDMIForumVSDB {
    if (payload.length < 5) return { ...HDMI_FORUM_DEFAULT };

    const flags1 = payload[2];
    const flags2 = payload[3]; // FRL + YCbCr 4:2:0
    const flags3 = payload[4]; // HDMI 2.1 flags
    const flags4 = payload.length >= 6 ? payload[5] : 0; // DSC / CinemaVRR (optional)

    return {
      version: payload[0],
      maxTmdsCharacterRate: payload[1] * 5,
      scdc: (flags1 & 0x80) !== 0,
      rr: (flags1 & 0x40) !== 0,
      lte340McscScramble: (flags1 & 0x08) !== 0,
      independentView: (flags1 & 0x04) !== 0,
      dualView: (flags1 & 0x02) !== 0,
      osd3d: (flags1 & 0x01) !== 0,
      maxFrlRate: (flags2 >> 4) & 0x0F,
      uhd4k: (flags2 & 0x08) !== 0,
      dc48bit420: (flags2 & 0x04) !== 0,
      dc36bit420: (flags2 & 0x02) !== 0,
      dc30bit420: (flags2 & 0x01) !== 0,
      vrr: (flags3 & 0x80) !== 0,
      cnmVrr: (flags4 & 0x08) !== 0,
      fapa: (flags3 & 0x04) !== 0,
      allm: (flags3 & 0x02) !== 0,
      fva: (flags3 & 0x01) !== 0,
      dsc: (flags4 & 0x80) !== 0,
    };
  }
}

export class HDMIForumEncoder implements VendorEncoder<'hdmiForum'> {
  readonly kind = 'hdmiForum' as const;

  encode(fields: HDMIForumVSDB): Uint8Array {
    const flags1 =
      (fields.scdc ? 0x80 : 0) |
      (fields.rr ? 0x40 : 0) |
      (fields.lte340McscScramble ? 0x08 : 0) |
      (fields.independentView ? 0x04 : 0) |
      (fields.dualView ? 0x02 : 0) |
      (fields.osd3d ? 0x01 : 0);

    const flags2 =
      ((fields.maxFrlRate & 0x0F) << 4) |
      (fields.uhd4k ? 0x08 : 0) |
      (fields.dc48bit420 ? 0x04 : 0) |
      (fields.dc36bit420 ? 0x02 : 0) |
      (fields.dc30bit420 ? 0x01 : 0);

    const flags3 =
      (fields.vrr ? 0x80 : 0) |
      (fields.fapa ? 0x04 : 0) |
      (fields.allm ? 0x02 : 0) |
      (fields.fva ? 0x01 : 0);

    const flags4 =
      (fields.dsc ? 0x80 : 0) |
      (fields.cnmVrr ? 0x08 : 0);

    return new Uint8Array([
      fields.version & 0xFF,
      Math.round(fields.maxTmdsCharacterRate / 5) & 0xFF,
      flags1,
      flags2,
      flags3,
      flags4,
    ]);
  }
}

VENDOR_DECODERS[OUI.HDMI_FORUM] = new HDMIForumDecoder();
VENDOR_ENCODERS['hdmiForum'] = new HDMIForumEncoder();
