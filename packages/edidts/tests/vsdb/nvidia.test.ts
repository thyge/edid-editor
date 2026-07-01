// packages/edidts/tests/vsdb/nvidia.test.ts

import { describe, it, expect } from 'vitest';
import { NvidiaDecoder, NvidiaEncoder } from '../../src/cta/vsdb/nvidia';

describe('NvidiaDecoder', () => {
  it('decodes G-Sync Compatible range', () => {
    // version=1, min=60Hz, max=240Hz
    const payload = new Uint8Array([0x01, 60, 240]);
    const result = new NvidiaDecoder().decode(payload);
    expect(result.version).toBe(1);
    expect(result.minRefreshHz).toBe(60);
    expect(result.maxRefreshHz).toBe(240);
  });

  it('decodes flags byte when present', () => {
    const payload = new Uint8Array([0x01, 60, 240, 0x80]);
    const result = new NvidiaDecoder().decode(payload);
    expect(result.version).toBe(1);
    expect(result.minRefreshHz).toBe(60);
    expect(result.maxRefreshHz).toBe(240);
    expect(result.flags).toBe(0x80);
  });

  it('returns defaults for truncated payload', () => {
    const result = new NvidiaDecoder().decode(new Uint8Array([0x01]));
    expect(result.version).toBe(0);
    expect(result.minRefreshHz).toBe(0);
  });

  it('round-trips a well-formed fields object', () => {
    const fields = { version: 1, minRefreshHz: 60, maxRefreshHz: 240, flags: 0 };
    const encoded = new NvidiaEncoder().encode(fields);
    const decoded = new NvidiaDecoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });
});
