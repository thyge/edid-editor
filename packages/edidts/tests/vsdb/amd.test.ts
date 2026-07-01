// packages/edidts/tests/vsdb/amd.test.ts

import { describe, it, expect } from 'vitest';
import { AMDFreeSyncDecoder, AMDFreeSyncEncoder } from '../../src/cta/vsdb/amd';

describe('AMDFreeSyncDecoder', () => {
  it('decodes min/max/native refresh range', () => {
    // min=48Hz, max=144Hz, native=120Hz, flags=0
    const payload = new Uint8Array([48, 144, 120, 0]);
    const result = new AMDFreeSyncDecoder().decode(payload);
    expect(result.minRefreshHz).toBe(48);
    expect(result.maxRefreshHz).toBe(144);
    expect(result.nativeRefreshHz).toBe(120);
    expect(result.flags).toBe(0);
  });

  it('returns defaults for a truncated payload', () => {
    const result = new AMDFreeSyncDecoder().decode(new Uint8Array([48]));
    expect(result.minRefreshHz).toBe(0);
    expect(result.maxRefreshHz).toBe(0);
  });

  it('round-trips a well-formed fields object', () => {
    const fields = { minRefreshHz: 48, maxRefreshHz: 144, nativeRefreshHz: 120, flags: 0 };
    const encoded = new AMDFreeSyncEncoder().encode(fields);
    const decoded = new AMDFreeSyncDecoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });
});
