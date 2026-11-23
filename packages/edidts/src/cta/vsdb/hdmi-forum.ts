// packages/edidts/src/cta/vsdb/hdmi-forum.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI, type HDMIForumVSDB } from './types';

export const HDMI_FORUM_DEFAULT: HDMIForumVSDB = {
  version: 1,
  maxTmdsCharacterRate: 0,
  scdc: false,
  rr: false,
  cableStatus: false,
  ccbpci: false,
  lte340McscScramble: false,
  independentView: false,
  dualView: false,
  osd3d: false,
  maxFrlRate: 0,
  uhd4k: false,
  dc48bit420: false,
  dc36bit420: false,
  dc30bit420: false,
  fapaEndExtended: false,
  qms: false,
  mDelta: false,
  cinemaVrr: false,
  negativeMvrr: false,
  fva: false,
  allm: false,
  fapaStartLocation: false,
  vrrMin: 0,
  vrrMax: 0,
  dsc12: false,
  dscNative420: false,
  qmsTfrMax: false,
  qmsTfrMin: false,
  dscAllBpp: false,
  dsc16bpc: false,
  dsc12bpc: false,
  dsc10bpc: false,
  dscMaxFrlRate: 0,
  dscMaxSlices: 0,
  dscTotalChunkKBytes: 0,
  trailing: new Uint8Array(),
};

/** Post-OUI bytes modelled field-by-field; anything after is `trailing`. */
const MODELLED_LENGTH = 10;

const bit = (byte: number, mask: number) => (byte & mask) !== 0;

/**
 * HDMI Forum Vendor Specific Data Block (HF-VSDB).
 *
 * Post-OUI payload per HDMI 2.1 (and edid-decode `cta_hf_scdb`):
 *
 *   byte 0  Version (= 1)
 *   byte 1  Max_TMDS_Character_Rate (5 MHz units)
 *   byte 2  SCDC_Present, RR_Capable, Cable_Status, CCBPCI,
 *           LTE_340Mcsc_scramble, 3D_Independent_View, 3D_Dual_View,
 *           3D_OSD_Disparity (bits 7..0)
 *   byte 3  Max_FRL_Rate (7:4), UHD_VIC (3), DC_48bit_420 (2),
 *           DC_36bit_420 (1), DC_30bit_420 (0)
 *   byte 4  FAPA_End_Extended, QMS, M_delta, CinemaVRR, Neg_Mvrr, FVA,
 *           ALLM, FAPA_start_location (bits 7..0)            [optional]
 *   byte 5  VRRmax[9:8] (7:6), VRRmin (5:0)                     [optional]
 *   byte 6  VRRmax[7:0]
 *   byte 7  DSC_1p2, DSC_Native_420, QMS_TFRmax, QMS_TFRmin,
 *           DSC_All_bpp, DSC_16bpc, DSC_12bpc, DSC_10bpc       [optional]
 *   byte 8  DSC_Max_FRL_Rate (7:4), DSC_MaxSlices (3:0)
 *   byte 9  DSC_TotalChunkKBytes (5:0)
 *   10..    reserved, preserved verbatim
 */
export class HDMIForumDecoder implements VendorDecoder<'hdmiForum'> {
  readonly kind = 'hdmiForum' as const;
  readonly minLength = 4;

  decode(payload: Uint8Array): HDMIForumVSDB {
    const at = (i: number) => (i < payload.length ? payload[i] : 0);
    const b2 = at(2);
    const b3 = at(3);
    const b4 = at(4);
    const b5 = at(5);
    const b7 = at(7);
    const b8 = at(8);

    return {
      version: at(0),
      maxTmdsCharacterRate: at(1) * 5,
      scdc: bit(b2, 0x80),
      rr: bit(b2, 0x40),
      cableStatus: bit(b2, 0x20),
      ccbpci: bit(b2, 0x10),
      lte340McscScramble: bit(b2, 0x08),
      independentView: bit(b2, 0x04),
      dualView: bit(b2, 0x02),
      osd3d: bit(b2, 0x01),
      maxFrlRate: (b3 >> 4) & 0x0f,
      uhd4k: bit(b3, 0x08),
      dc48bit420: bit(b3, 0x04),
      dc36bit420: bit(b3, 0x02),
      dc30bit420: bit(b3, 0x01),
      fapaEndExtended: bit(b4, 0x80),
      qms: bit(b4, 0x40),
      mDelta: bit(b4, 0x20),
      cinemaVrr: bit(b4, 0x10),
      negativeMvrr: bit(b4, 0x08),
      fva: bit(b4, 0x04),
      allm: bit(b4, 0x02),
      fapaStartLocation: bit(b4, 0x01),
      vrrMin: b5 & 0x3f,
      vrrMax: ((b5 & 0xc0) << 2) | at(6),
      dsc12: bit(b7, 0x80),
      dscNative420: bit(b7, 0x40),
      qmsTfrMax: bit(b7, 0x20),
      qmsTfrMin: bit(b7, 0x10),
      dscAllBpp: bit(b7, 0x08),
      dsc16bpc: bit(b7, 0x04),
      dsc12bpc: bit(b7, 0x02),
      dsc10bpc: bit(b7, 0x01),
      dscMaxFrlRate: (b8 >> 4) & 0x0f,
      dscMaxSlices: b8 & 0x0f,
      dscTotalChunkKBytes: at(9) & 0x3f,
      ...(at(9) & 0xc0 ? { byte9Reserved: at(9) & 0xc0 } : {}),
      payloadLength: payload.length,
      trailing: payload.slice(MODELLED_LENGTH),
    };
  }
}

export class HDMIForumEncoder implements VendorEncoder<'hdmiForum'> {
  readonly kind = 'hdmiForum' as const;

  encode(fields: HDMIForumVSDB): Uint8Array {
    const flag = (value: boolean, mask: number) => (value ? mask : 0);
    const vrrMin = Math.max(0, Math.min(0x3f, Math.round(fields.vrrMin ?? 0)));
    const vrrMax = Math.max(0, Math.min(0x3ff, Math.round(fields.vrrMax ?? 0)));

    const bytes = [
      fields.version & 0xff,
      Math.max(0, Math.min(0xff, Math.round(fields.maxTmdsCharacterRate / 5))),
      flag(fields.scdc, 0x80) |
        flag(fields.rr, 0x40) |
        flag(fields.cableStatus, 0x20) |
        flag(fields.ccbpci, 0x10) |
        flag(fields.lte340McscScramble, 0x08) |
        flag(fields.independentView, 0x04) |
        flag(fields.dualView, 0x02) |
        flag(fields.osd3d, 0x01),
      ((fields.maxFrlRate & 0x0f) << 4) |
        flag(fields.uhd4k, 0x08) |
        flag(fields.dc48bit420, 0x04) |
        flag(fields.dc36bit420, 0x02) |
        flag(fields.dc30bit420, 0x01),
      flag(fields.fapaEndExtended, 0x80) |
        flag(fields.qms, 0x40) |
        flag(fields.mDelta, 0x20) |
        flag(fields.cinemaVrr, 0x10) |
        flag(fields.negativeMvrr, 0x08) |
        flag(fields.fva, 0x04) |
        flag(fields.allm, 0x02) |
        flag(fields.fapaStartLocation, 0x01),
      ((vrrMax >> 8) << 6) | vrrMin,
      vrrMax & 0xff,
      flag(fields.dsc12, 0x80) |
        flag(fields.dscNative420, 0x40) |
        flag(fields.qmsTfrMax, 0x20) |
        flag(fields.qmsTfrMin, 0x10) |
        flag(fields.dscAllBpp, 0x08) |
        flag(fields.dsc16bpc, 0x04) |
        flag(fields.dsc12bpc, 0x02) |
        flag(fields.dsc10bpc, 0x01),
      ((fields.dscMaxFrlRate & 0x0f) << 4) | (fields.dscMaxSlices & 0x0f),
      (fields.dscTotalChunkKBytes & 0x3f) | ((fields.byte9Reserved ?? 0) & 0xc0),
    ];

    // Write the shortest block that carries every set field: bytes 0-3 always,
    // then the optional HDMI 2.1 groups (byte 4; bytes 5-6; bytes 7-9) only
    // when used — but never shorter than the decoded source block.
    const trailing = fields.trailing ?? new Uint8Array();
    let needed = 4;
    if (bytes[4] !== 0) needed = 5;
    if (bytes[5] !== 0 || bytes[6] !== 0) needed = 7;
    if (bytes[7] !== 0 || bytes[8] !== 0 || bytes[9] !== 0) needed = MODELLED_LENGTH;
    if (trailing.length > 0) needed = MODELLED_LENGTH;
    const length = Math.max(needed, Math.min(fields.payloadLength ?? 0, MODELLED_LENGTH));

    const out = new Uint8Array(length + trailing.length);
    out.set(bytes.slice(0, length));
    out.set(trailing, length);
    return out;
  }
}

VENDOR_DECODERS[OUI.HDMI_FORUM] = new HDMIForumDecoder();
VENDOR_ENCODERS['hdmiForum'] = new HDMIForumEncoder();
