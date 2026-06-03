// packages/edidts/tests/vsdb/hdmi14.test.ts

import { describe, it, expect } from 'vitest';
import { HDMI14Decoder, HDMI14Encoder } from '../../src/cta/vsdb/hdmi14';
import { OUI } from '../../src/cta/vsdb/types';
import { reassembleVsdbBlock } from '../../src/cta/vsdb/registry';

describe('HDMI14Decoder', () => {
  it('decodes physical address 1.0.0.0', () => {
    // PhysAddr 0x1000 (1.0.0.0), supportsAI=1, maxTMDS=165MHz (0x21*5)
    const payload = new Uint8Array([0x10, 0x00, 0x80, 0x21]);
    const result = new HDMI14Decoder().decode(payload);
    expect(result.sourcePhysicalAddress).toEqual([1, 0, 0, 0]);
    expect(result.supportsAI).toBe(true);
    expect(result.maxTmdsClockMHz).toBe(165);
  });

  it('returns defaults for a truncated payload', () => {
    const result = new HDMI14Decoder().decode(new Uint8Array([0x00]));
    expect(result.sourcePhysicalAddress).toEqual([0, 0, 0, 0]);
    expect(result.maxTmdsClockMHz).toBe(0);
  });
});

describe('HDMI14Encoder', () => {
  it('round-trips a well-formed fields object', () => {
    const fields = {
      sourcePhysicalAddress: [1, 0, 0, 0] as [number, number, number, number],
      supportsAI: true,
      dcY444: false,
      dc30bit: true,
      dc36bit: false,
      dc48bit: false,
      maxTmdsClockMHz: 165,
    };
    const encoded = new HDMI14Encoder().encode(fields);
    const decoded = new HDMI14Decoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });

  it('produces correct block bytes via reassembleVsdbBlock', () => {
    const fields = {
      sourcePhysicalAddress: [1, 0, 0, 0] as [number, number, number, number],
      supportsAI: false,
      dcY444: false,
      dc30bit: false,
      dc36bit: false,
      dc48bit: false,
      maxTmdsClockMHz: 0,
    };
    const payload = new HDMI14Encoder().encode(fields);
    const block = reassembleVsdbBlock(OUI.HDMI_1_4, payload);
    expect(block[0]).toBe(0x67);
    expect(block[1]).toBe(0x03);
    expect(block[2]).toBe(0x0C);
    expect(block[3]).toBe(0x00);
    expect(block[4]).toBe(0x10);
    expect(block[5]).toBe(0x00);
  });
});
