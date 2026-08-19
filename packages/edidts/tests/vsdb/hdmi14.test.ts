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
      trailing: new Uint8Array(),
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
      trailing: new Uint8Array(),
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

describe('HDMI 1.4 VSDB optional sections (TASK-7)', () => {
  function roundTrip(payload: number[]) {
    const decoded = new HDMI14Decoder().decode(new Uint8Array(payload));
    const reencoded = new HDMI14Encoder().encode(decoded);
    expect(Array.from(reencoded)).toEqual(payload);
    return decoded;
  }

  it('decodes and encodes latency fields (progressive + interlaced)', () => {
    // byte4 = 0xE0: latency present (0x80) + interlaced present (0x40) + extended present (0x20)
    // But extended-present with no extended bytes would set extended={}. To test latency
    // in isolation we clear the extended bit: byte4 = 0xC0.
    // bytes: phys(2) flags maxTMDS byte4=0xC0 progV progA iV iA
    const payload = [0x10, 0x00, 0x80, 0x21, 0xc0, 0x10, 0x08, 0x20, 0x0a];
    const decoded = roundTrip(payload);
    expect(decoded.contentTypes).toBe(0);
    expect(decoded.latency?.progressive).toEqual({ video: 0x10, audio: 0x08 });
    expect(decoded.latency?.interlaced).toEqual({ video: 0x20, audio: 0x0a });
    expect(decoded.extended).toBeUndefined();
  });

  it('decodes and encodes progressive-only latency', () => {
    // byte4 = 0x80 (latency present, no interlaced, no extended)
    const payload = [0x10, 0x00, 0x80, 0x21, 0x80, 0x10, 0x08];
    const decoded = roundTrip(payload);
    expect(decoded.latency?.progressive).toEqual({ video: 0x10, audio: 0x08 });
    expect(decoded.latency?.interlaced).toBeUndefined();
  });

  it('decodes and encodes content types', () => {
    // byte4 = 0x0f (no latency, no extended; content types = Graphics|Photo|Cinema|Game)
    const payload = [0x10, 0x00, 0x80, 0x21, 0x0f];
    const decoded = roundTrip(payload);
    expect(decoded.contentTypes).toBe(0x0f);
    expect(decoded.latency).toBeUndefined();
    expect(decoded.extended).toBeUndefined();
  });

  it('decodes and encodes 3D present + image size + HDMI VIC (4K) list', () => {
    // byte4 = 0x20 (extended present, no latency)
    // eb = 0x80 (3D present) | 0x10 (image size = cm) => 0x90
    // lb: len_vic=2 (<<5 = 0x40), len_3d=0 => 0x40
    // two HDMI VIC bytes (e.g. 1, 2)
    const payload = [0x10, 0x00, 0x80, 0x21, 0x20, 0x90, 0x40, 0x01, 0x02];
    const decoded = roundTrip(payload);
    expect(decoded.extended?.threeDPresent).toBe(true);
    expect(decoded.extended?.threeDMode).toBe('none');
    expect(decoded.extended?.imageSize).toBe('cm');
    expect(decoded.extended?.hdmiVics).toEqual([1, 2]);
    expect(decoded.extended?.structures).toEqual([]);
  });

  it('decodes and encodes 3D_Structure_ALL mask (all-vics-3d mode)', () => {
    // byte4 = 0x20 (extended). eb = 0xA0 (3D present | mode=0x20 all-vics-3d).
    // lb: len_vic=0, len_3d=2 => 0x02. Then 2 bytes structureAll = 0x0102.
    const payload = [0x10, 0x00, 0x80, 0x21, 0x20, 0xa0, 0x02, 0x01, 0x02];
    const decoded = roundTrip(payload);
    expect(decoded.extended?.threeDMode).toBe('all-vics-3d');
    expect(decoded.extended?.structureAll).toBe(0x0102);
    expect(decoded.extended?.vicMask).toBeUndefined();
  });

  it('decodes and encodes the 3D-capable-VIC mask (vic-mask mode)', () => {
    // eb = 0xC0 (3D present | mode=0x40 vic-mask). lb: len_3d=4 => 0x04.
    // structureAll 0x0001, vicMask 0x0180.
    const payload = [0x10, 0x00, 0x80, 0x21, 0x20, 0xc0, 0x04, 0x00, 0x01, 0x01, 0x80];
    const decoded = roundTrip(payload);
    expect(decoded.extended?.threeDMode).toBe('vic-mask');
    expect(decoded.extended?.structureAll).toBe(0x0001);
    expect(decoded.extended?.vicMask).toBe(0x0180);
  });

  it('decodes and encodes per-VIC 3D structures (1-byte and 2-byte strides)', () => {
    // eb = 0x80 (3D present, mode none). lb: len_3d=3 => 0x03.
    // entry1: byte 0x30 → vicIndex 3, structure 0 (frame packing), stride 1.
    // entry2: byte 0x18 → vicIndex 1, structure 8 (side-by-side), stride 2 → detail byte 0x40 (detail 4).
    const payload = [0x10, 0x00, 0x80, 0x21, 0x20, 0x80, 0x03, 0x30, 0x18, 0x40];
    const decoded = roundTrip(payload);
    expect(decoded.extended?.structures).toEqual([
      { vicIndex: 3, structure: 0 },
      { vicIndex: 1, structure: 8, detail: 4 },
    ]);
  });

  it('round-trips a fully-populated HDMI 1.4 VSDB end-to-end', () => {
    // phys 1.0.0.0, supportsAI, maxTMDS 340 (0x44*5=340)
    // byte4 = 0xE0 (latency + interlaced + extended)
    // progressive latency 0x10/0x08, interlaced 0x20/0x0a
    // eb = 0xC0 (3D present | vic-mask mode | image size none)
    // lb: len_vic=1, len_3d=4+3=7 → 0x07|(1<<5)=0x27
    // hdmiVic: [1]
    // structureAll 0x0102, vicMask 0x0180
    // per-VIC: 0x30 (vic 3, structure 0, stride1), 0x18 0x40 (vic1, sbs, detail4)
    const payload = [
      0x10, 0x00, 0x80, 0x44, 0xe0,
      0x10, 0x08, 0x20, 0x0a,
      0xc0, 0x27, 0x01,
      0x01, 0x02, 0x01, 0x80,
      0x30, 0x18, 0x40,
    ];
    const decoded = roundTrip(payload);
    expect(decoded.contentTypes).toBe(0);
    expect(decoded.latency?.progressive).toEqual({ video: 0x10, audio: 0x08 });
    expect(decoded.latency?.interlaced).toEqual({ video: 0x20, audio: 0x0a });
    expect(decoded.extended?.threeDPresent).toBe(true);
    expect(decoded.extended?.threeDMode).toBe('vic-mask');
    expect(decoded.extended?.hdmiVics).toEqual([1]);
    expect(decoded.extended?.structureAll).toBe(0x0102);
    expect(decoded.extended?.vicMask).toBe(0x0180);
    expect(decoded.extended?.structures).toEqual([
      { vicIndex: 3, structure: 0 },
      { vicIndex: 1, structure: 8, detail: 4 },
    ]);
  });

  it('preserves trailing bytes after the modeled region', () => {
    // byte4 = 0x0f: contentTypes present, no latency (bit7=0), no extended (bit5=0).
    // Bytes after byte4 are not part of any modeled section → captured by `trailing`.
    const payload = [0x10, 0x00, 0x80, 0x21, 0x0f, 0xde, 0xad];
    const decoded = new HDMI14Decoder().decode(new Uint8Array(payload));
    expect(decoded.contentTypes).toBe(0x0f);
    expect(Array.from(decoded.trailing)).toEqual([0xde, 0xad]);
    // Round-trips byte-identically.
    const reencoded = new HDMI14Encoder().encode(decoded);
    expect(Array.from(reencoded)).toEqual(payload);
  });
});