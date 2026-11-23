// packages/edidts/tests/vsdb/amd.test.ts

import { describe, it, expect } from 'vitest';
import { AMDFreeSyncDecoder, AMDFreeSyncEncoder } from '../../src/cta/vsdb/amd';

// Layout per edid-decode `cta_amd` (parse-cta-block.cpp):
//   byte 0 version, byte 1 flags1, byte 2 minRefreshHz,
//   byte 3 maxRefreshHz, byte 4 MCCS VCP code, bytes 5.. version 2/3 fields (opaque).

describe('AMDFreeSyncDecoder', () => {
  it('decodes the 5-byte head (version, flags1, min/max refresh, MCCS VCP code)', () => {
    // Version 1, FreeSync supported, 48-144 Hz, no MCCS VCP code
    const payload = new Uint8Array([0x01, 0x01, 48, 144, 0x00]);
    const result = new AMDFreeSyncDecoder().decode(payload);
    expect(result.version).toBe(1);
    expect(result.flags1).toBe(0x01);
    expect(result.minRefreshHz).toBe(48);
    expect(result.maxRefreshHz).toBe(144);
    expect(result.mccsVcpCode).toBe(0x00);
    expect(result.trailing.length).toBe(0);
  });

  it('preserves the version 2 fields verbatim when length >= 10', () => {
    // Version 2: flags 5 + 4 luminance bytes (kept opaque)
    const tail = new Uint8Array([0x04, 0x80, 0x40, 0x20, 0x08]);
    const payload = new Uint8Array([0x02, 0x0b, 48, 144, 0x00, ...tail]);
    const result = new AMDFreeSyncDecoder().decode(payload);
    expect(result.version).toBe(2);
    expect(result.flags1).toBe(0x0b);
    expect(result.minRefreshHz).toBe(48);
    expect(result.maxRefreshHz).toBe(144);
    expect(Array.from(result.trailing)).toEqual(Array.from(tail));
  });

  it('decodes a truncated payload (< 5 bytes) as far as it goes, without throwing', () => {
    const result = new AMDFreeSyncDecoder().decode(new Uint8Array([0x02, 0x01]));
    expect(result.version).toBe(2);
    expect(result.flags1).toBe(0x01);
    expect(result.minRefreshHz).toBe(0);
    expect(result.maxRefreshHz).toBe(0);
    expect(result.trailing.length).toBe(0);
    expect(result.payloadLength).toBe(2);
  });
});

describe('AMDFreeSyncEncoder', () => {
  it('round-trips a version 1 payload byte-identically', () => {
    const payload = new Uint8Array([0x01, 0x01, 48, 144, 0x00]);
    const decoded = new AMDFreeSyncDecoder().decode(payload);
    const encoded = new AMDFreeSyncEncoder().encode(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(payload));
  });

  it('round-trips a version 2 payload byte-identically (tail preserved)', () => {
    const payload = new Uint8Array([0x02, 0x0b, 48, 144, 0x00, 0x04, 0x80, 0x40, 0x20, 0x08]);
    const decoded = new AMDFreeSyncDecoder().decode(payload);
    const encoded = new AMDFreeSyncEncoder().encode(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(payload));
  });

  it('round-trips a truncated payload at its own length', () => {
    const payload = new Uint8Array([0x02, 0x01]);
    const encoded = new AMDFreeSyncEncoder().encode(new AMDFreeSyncDecoder().decode(payload));
    expect(Array.from(encoded)).toEqual([0x02, 0x01]);
  });

  it('writes the structured head from fields', () => {
    const encoded = new AMDFreeSyncEncoder().encode({
      version: 1,
      flags1: 0x01,
      minRefreshHz: 40,
      maxRefreshHz: 240,
      mccsVcpCode: 0xe6,
      trailing: new Uint8Array(0),
    });
    expect(Array.from(encoded)).toEqual([0x01, 0x01, 40, 240, 0xe6]);
  });
});
