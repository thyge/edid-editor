// packages/edidts/tests/vsdb/amd.test.ts

import { describe, it, expect } from 'vitest';
import { AMDFreeSyncDecoder, AMDFreeSyncEncoder } from '../../src/cta/vsdb/amd';

// Layout per edid-decode `cta_amd` (parse-cta-block.cpp):
//   byte 0 versionMajor, byte 1 versionMinor, byte 2 minRefreshHz,
//   byte 3 maxRefreshHz, byte 4 flags1, bytes 5.. 2.x extension (opaque).

describe('AMDFreeSyncDecoder', () => {
  it('decodes the 1.x prefix (version, min/max refresh, flags1)', () => {
    // FreeSync 1.0, 48-144 Hz, flags1 = 0
    const payload = new Uint8Array([0x01, 0x00, 48, 144, 0x00]);
    const result = new AMDFreeSyncDecoder().decode(payload);
    expect(result.versionMajor).toBe(1);
    expect(result.versionMinor).toBe(0);
    expect(result.minRefreshHz).toBe(48);
    expect(result.maxRefreshHz).toBe(144);
    expect(result.flags1).toBe(0x00);
    expect(result.payload.length).toBe(0);
  });

  it('preserves the 2.x extension verbatim when length >= 10', () => {
    // FreeSync 2.x: flags2 + 4 luminance bytes (edid-decode-allocated, kept opaque)
    const tail = new Uint8Array([0x04, 0x80, 0x40, 0x20, 0x08]);
    const payload = new Uint8Array([0x02, 0x00, 48, 144, 0x00, ...tail]);
    const result = new AMDFreeSyncDecoder().decode(payload);
    expect(result.versionMajor).toBe(2);
    expect(result.minRefreshHz).toBe(48);
    expect(result.maxRefreshHz).toBe(144);
    expect(Array.from(result.payload)).toEqual(Array.from(tail));
  });

  it('returns defaults for a truncated payload (< 5 bytes) without throwing', () => {
    const result = new AMDFreeSyncDecoder().decode(new Uint8Array([48, 144]));
    expect(result.versionMajor).toBe(0);
    expect(result.minRefreshHz).toBe(0);
    expect(result.maxRefreshHz).toBe(0);
    expect(result.payload.length).toBe(0);
  });
});

describe('AMDFreeSyncEncoder', () => {
  it('round-trips a 1.x payload byte-identically', () => {
    const payload = new Uint8Array([0x01, 0x00, 48, 144, 0x00]);
    const decoded = new AMDFreeSyncDecoder().decode(payload);
    const encoded = new AMDFreeSyncEncoder().encode(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(payload));
  });

  it('round-trips a 2.x payload byte-identically (tail preserved)', () => {
    const payload = new Uint8Array([0x02, 0x00, 48, 144, 0x00, 0x04, 0x80, 0x40, 0x20, 0x08]);
    const decoded = new AMDFreeSyncDecoder().decode(payload);
    const encoded = new AMDFreeSyncEncoder().encode(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(payload));
  });

  it('writes the structured 1.x prefix from fields', () => {
    const encoded = new AMDFreeSyncEncoder().encode({
      versionMajor: 1,
      versionMinor: 2,
      minRefreshHz: 40,
      maxRefreshHz: 240,
      flags1: 0xe6,
      payload: new Uint8Array(0),
    });
    expect(Array.from(encoded)).toEqual([0x01, 0x02, 40, 240, 0xe6]);
  });
});