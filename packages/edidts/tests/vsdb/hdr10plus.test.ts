// packages/edidts/tests/vsdb/hdr10plus.test.ts

import { describe, it, expect } from 'vitest';
import { HDR10PlusDecoder, HDR10PlusEncoder } from '../../src/cta/vsdb/hdr10plus';

describe('HDR10PlusDecoder', () => {
  it('decodes application identifier and version', () => {
    const payload = new Uint8Array([0x01, 0x02]);
    const result = new HDR10PlusDecoder().decode(payload);
    expect(result.applicationIdentifier).toBe(0x01);
    expect(result.applicationVersion).toBe(0x02);
    expect(result.payload.length).toBe(0);
  });

  it('preserves trailing payload bytes', () => {
    const payload = new Uint8Array([0x01, 0x02, 0xAA, 0xBB, 0xCC]);
    const result = new HDR10PlusDecoder().decode(payload);
    expect(result.applicationIdentifier).toBe(0x01);
    expect(result.applicationVersion).toBe(0x02);
    expect(Array.from(result.payload)).toEqual([0xAA, 0xBB, 0xCC]);
  });

  it('returns defaults for empty payload', () => {
    const result = new HDR10PlusDecoder().decode(new Uint8Array(0));
    expect(result.applicationIdentifier).toBe(0x01);  // HDR10_PLUS_DEFAULT
    expect(result.applicationVersion).toBe(0);
    expect(result.payload.length).toBe(0);
  });

  it('round-trips a well-formed fields object', () => {
    const fields = { applicationIdentifier: 0x01, applicationVersion: 0x02, payload: new Uint8Array(0) };
    const encoded = new HDR10PlusEncoder().encode(fields);
    const decoded = new HDR10PlusDecoder().decode(encoded);
    expect(decoded.applicationIdentifier).toBe(0x01);
    expect(decoded.applicationVersion).toBe(0x02);
  });

  it('round-trips with trailing payload bytes', () => {
    const fields = {
      applicationIdentifier: 0x01,
      applicationVersion: 0x02,
      payload: new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]),
    };
    const encoded = new HDR10PlusEncoder().encode(fields);
    const decoded = new HDR10PlusDecoder().decode(encoded);
    expect(decoded.applicationIdentifier).toBe(0x01);
    expect(decoded.applicationVersion).toBe(0x02);
    expect(Array.from(decoded.payload)).toEqual([0xDE, 0xAD, 0xBE, 0xEF]);
  });
});
