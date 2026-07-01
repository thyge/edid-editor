// packages/edidts/tests/vsdb/hdmi-forum.test.ts

import { describe, it, expect } from 'vitest';
import { HDMIForumDecoder, HDMIForumEncoder } from '../../src/cta/vsdb/hdmi-forum';

describe('HDMIForumDecoder', () => {
  it('decodes version 1, SCDC, FRL rate 6, DC_48bit_420, ALLM', () => {
    // version=0x01, maxTMDS=300MHz (0x3C*5), flags1=0xC0 (SCDC|RR),
    // FRL=0x64 (maxFRLRate=6 in upper nibble | DC_48bit_420 in bit 2),
    // flags2=0x02 (ALLM in bit 1)
    const payload = new Uint8Array([0x01, 0x3C, 0xC0, 0x64, 0x02]);
    const result = new HDMIForumDecoder().decode(payload);
    expect(result.version).toBe(1);
    expect(result.maxTmdsCharacterRate).toBe(300);
    expect(result.scdc).toBe(true);
    expect(result.rr).toBe(true);
    expect(result.maxFrlRate).toBe(6);
    expect(result.dc48bit420).toBe(true);
    expect(result.allm).toBe(true);
  });

  it('returns defaults for empty payload', () => {
    const result = new HDMIForumDecoder().decode(new Uint8Array(0));
    expect(result.version).toBe(0);
    expect(result.maxTmdsCharacterRate).toBe(0);
  });
});

describe('HDMIForumEncoder', () => {
  it('round-trips a well-formed fields object', () => {
    const fields = {
      version: 1,
      maxTmdsCharacterRate: 300,
      scdc: true,
      rr: true,
      lte340McscScramble: false,
      independentView: false,
      dualView: false,
      osd3d: false,
      dc30bit420: false,
      dc36bit420: false,
      dc48bit420: true,
      uhd4k: false,
      vrr: false,
      fapa: false,
      allm: true,
      fva: false,
      cnmVrr: false,
      dsc: false,
      maxFrlRate: 6,
    };
    const encoded = new HDMIForumEncoder().encode(fields);
    const decoded = new HDMIForumDecoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });
});
