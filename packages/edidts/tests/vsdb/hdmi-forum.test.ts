// packages/edidts/tests/vsdb/hdmi-forum.test.ts

import { describe, it, expect } from 'vitest';
import { HDMIForumDecoder, HDMIForumEncoder, HDMI_FORUM_DEFAULT } from '../../src/cta/vsdb/hdmi-forum';

const decode = (bytes: number[]) => new HDMIForumDecoder().decode(new Uint8Array(bytes));
const encode = (fields: ReturnType<typeof decode>) => Array.from(new HDMIForumEncoder().encode(fields));

describe('HDMIForumDecoder', () => {
  it('decodes the HDMI 2.0 four-byte form (VESA Appendix A example)', () => {
    const result = decode([0x01, 0x78, 0x80, 0x03]);
    expect(result.version).toBe(1);
    expect(result.maxTmdsCharacterRate).toBe(600);
    expect(result.scdc).toBe(true);
    expect(result.rr).toBe(false);
    expect(result.dc30bit420).toBe(true);
    expect(result.dc36bit420).toBe(true);
    expect(result.dc48bit420).toBe(false);
    expect(result.vrrMin).toBe(0);
    expect(result.dsc12).toBe(false);
  });

  it('decodes every HDMI 2.1 field of a full block (LG TV, HDMI 2.1)', () => {
    // 01 78 80 6b 43 28 78 d3 33 05 — edid-decode reports: 600 MHz, SCDC,
    // FRL up to 12 Gbps x4, UHD VIC, 4:2:0 10/12-bit, QMS, ALLM, FAPA start,
    // VRR 40-120 Hz, DSC 1.2a, native 4:2:0, QMS TFRmin, 10/12 bpc,
    // DSC max FRL 6 Gbps x4, 4 slices, 6 KB chunks.
    const result = decode([0x01, 0x78, 0x80, 0x6b, 0x43, 0x28, 0x78, 0xd3, 0x33, 0x05]);
    expect(result.maxFrlRate).toBe(6);
    expect(result.uhd4k).toBe(true);
    expect(result.qms).toBe(true);
    expect(result.allm).toBe(true);
    expect(result.fapaStartLocation).toBe(true);
    expect(result.fapaEndExtended).toBe(false);
    expect(result.fva).toBe(false);
    expect(result.vrrMin).toBe(40);
    expect(result.vrrMax).toBe(120);
    expect(result.dsc12).toBe(true);
    expect(result.dscNative420).toBe(true);
    expect(result.qmsTfrMin).toBe(true);
    expect(result.qmsTfrMax).toBe(false);
    expect(result.dscAllBpp).toBe(false);
    expect(result.dsc12bpc).toBe(true);
    expect(result.dsc10bpc).toBe(true);
    expect(result.dsc16bpc).toBe(false);
    expect(result.dscMaxFrlRate).toBe(3);
    expect(result.dscMaxSlices).toBe(3);
    expect(result.dscTotalChunkKBytes).toBe(5);
  });

  it('decodes byte 2 cable status / CCBPCI and byte 4 flags per HDMI 2.1', () => {
    const result = decode([0x01, 0x78, 0x30, 0x00, 0xbc]);
    expect(result.cableStatus).toBe(true);
    expect(result.ccbpci).toBe(true);
    expect(result.fapaEndExtended).toBe(true); // bit 7
    expect(result.mDelta).toBe(true); // bit 5
    expect(result.cinemaVrr).toBe(true); // bit 4
    expect(result.negativeMvrr).toBe(true); // bit 3
    expect(result.fva).toBe(true); // bit 2
    expect(result.allm).toBe(false);
  });

  it('reads VRRmax bits 9:8 from byte 5', () => {
    const result = decode([0x01, 0x78, 0x80, 0x00, 0x00, 0x40 | 48, 0x2c]);
    expect(result.vrrMin).toBe(48);
    expect(result.vrrMax).toBe(0x12c); // 300 Hz
  });
});

describe('HDMIForumEncoder', () => {
  it.each([
    ['HDMI 2.0 four-byte form', [0x01, 0x78, 0x80, 0x03]],
    ['five-byte form with ALLM', [0x01, 0x78, 0x80, 0x00, 0x02]],
    ['LG TV HDMI 2.1 block', [0x01, 0x78, 0x80, 0x6b, 0x43, 0x28, 0x78, 0xd3, 0x33, 0x05]],
    ['HDMI 2.1 block with a reserved trailing byte', [0x01, 0x78, 0xc8, 0x6b, 0x17, 0x28, 0x78, 0x8f, 0x03, 0x0f, 0x00]],
    ['full-length block with zero DSC bytes', [0x01, 0x78, 0x80, 0x00, 0x02, 0x30, 0x90, 0x00, 0x00, 0x00]],
  ])('round-trips the %s byte-exactly', (_label, payload) => {
    expect(encode(decode(payload))).toEqual(payload);
  });

  it('grows a short block only as far as an edit needs', () => {
    const fields = decode([0x01, 0x78, 0x80, 0x03]);
    fields.vrrMin = 48;
    fields.vrrMax = 144;
    expect(encode(fields)).toEqual([0x01, 0x78, 0x80, 0x03, 0x00, 48, 144]);

    fields.dsc12 = true;
    expect(encode(fields)).toEqual([0x01, 0x78, 0x80, 0x03, 0x00, 48, 144, 0x80, 0x00, 0x00]);
  });

  it('encodes VRRmax above 255 Hz into byte 5 bits 7:6', () => {
    const fields = decode([0x01, 0x78, 0x80, 0x00]);
    fields.vrrMin = 40;
    fields.vrrMax = 480;
    const bytes = encode(fields);
    expect(bytes[5]).toBe((1 << 6) | 40);
    expect(bytes[6]).toBe(480 & 0xff);
    expect(decode(bytes).vrrMax).toBe(480);
  });

  it('encodes a new default block as a valid four-byte version 1 block', () => {
    expect(encode({ ...HDMI_FORUM_DEFAULT })).toEqual([0x01, 0x00, 0x00, 0x00]);
  });
});
