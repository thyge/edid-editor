// packages/edidts/tests/vcdb/vsadb/dolby.test.ts

import { describe, it, expect } from 'vitest';
import {
  DolbyVSADBDecoder,
  DolbyVSADBEncoder,
  DOLBY_VSADB_DEFAULT,
} from '../../../src/cta/vcdb/vsadb/dolby';
import {
  VENDOR_VSADB_DECODERS,
  VENDOR_VSADB_ENCODERS,
  decodeVSADB,
  encodeVSADB,
  reassembleVsadbBlock,
} from '../../../src/cta/vcdb/vsadb/registry';
import { OUI } from '../../../src/cta/vsdb/types';
import type { ExtendedDataBlock } from '../../../src/cta/cta-extended-blocks';
import '../../../src/cta/vcdb/vsadb/dolby';

// A minimal carrier base for decodeVSADB — the real decode path fills it in
// from the CTA block walker; decodeVSADB only spreads it.
const base: ExtendedDataBlock = {
  tag: 0x07,
  extendedTag: 0x11,
  payload: new Uint8Array(0),
};

describe('DolbyVSADBDecoder', () => {
  it('decodes the Philips fixture body 70 00 (version 1, all speaker zones)', () => {
    // From the Philips "FTV" fixture VSADB (e6 11 46 d0 00 70 00): post-OUI
    // body 0x70 = height|surround|center zones set, version 1; byte 1 = 0x00
    // (full MAT/TrueHD support).
    const decoded = new DolbyVSADBDecoder().decode(new Uint8Array([0x70, 0x00]));
    expect(decoded.version).toBe(1);
    expect(decoded.headphoneOnly).toBe(false);
    expect(decoded.heightZone).toBe(true);
    expect(decoded.surroundZone).toBe(true);
    expect(decoded.centerZone).toBe(true);
    expect(decoded.mat48kHzOnly).toBe(false);
    expect(Array.from(decoded.trailing)).toEqual([]);
  });

  it('decodes headphone-only and MAT-48kHz-only flags', () => {
    const decoded = new DolbyVSADBDecoder().decode(new Uint8Array([0x85, 0x01]));
    expect(decoded.version).toBe(1 + 0x05);
    expect(decoded.headphoneOnly).toBe(true);
    expect(decoded.heightZone).toBe(false);
    expect(decoded.surroundZone).toBe(false);
    expect(decoded.centerZone).toBe(false);
    expect(decoded.mat48kHzOnly).toBe(true);
  });

  it('returns defaults for a truncated body', () => {
    const decoded = new DolbyVSADBDecoder().decode(new Uint8Array(0));
    expect(decoded).toEqual({ ...DOLBY_VSADB_DEFAULT });
  });
});

describe('DolbyVSADBEncoder', () => {
  it('round-trips the fixture body byte-exactly', () => {
    const payload = [0x70, 0x00];
    const decoded = new DolbyVSADBDecoder().decode(new Uint8Array(payload));
    const reencoded = new DolbyVSADBEncoder().encode(decoded);
    expect(Array.from(reencoded)).toEqual(payload);
  });

  it('round-trips reserved bits and trailing bytes verbatim', () => {
    // byte0 bit 3 and byte1 bits 7:1 are not parsed by edid-decode; they must
    // survive a decode→encode cycle untouched, as must any vendor-reserved
    // trailing bytes.
    const payload = [0x7b, 0xfe, 0xde, 0xad];
    const decoded = new DolbyVSADBDecoder().decode(new Uint8Array(payload));
    expect(decoded.byte0Reserved).toBe(1);
    expect(decoded.byte1Reserved).toBe(0x7f);
    expect(Array.from(decoded.trailing)).toEqual([0xde, 0xad]);
    const reencoded = new DolbyVSADBEncoder().encode(decoded);
    expect(Array.from(reencoded)).toEqual(payload);
  });

  it('throws on an out-of-range version', () => {
    expect(() =>
      new DolbyVSADBEncoder().encode({ ...DOLBY_VSADB_DEFAULT, version: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      new DolbyVSADBEncoder().encode({ ...DOLBY_VSADB_DEFAULT, version: 9 }),
    ).toThrow(RangeError);
  });
});

describe('VSADB registry integration', () => {
  it('registers the Dolby codec under OUI 00-D0-46', () => {
    expect(VENDOR_VSADB_DECODERS[OUI.DOLBY]).toBeInstanceOf(DolbyVSADBDecoder);
    expect(VENDOR_VSADB_ENCODERS['dolbyVsadb']).toBeInstanceOf(DolbyVSADBEncoder);
  });

  it('decodes the full fixture VSADB e6 11 46 d0 00 70 00 and re-encodes byte-exactly', () => {
    // Post-header bytes of the Philips fixture block: extended tag 0x11,
    // LE OUI 46 d0 00 (0x00D046), body 70 00. decodeVSADB's payload starts at
    // the OUI (the walker strips the extended-tag byte); encodeVSADB re-adds it.
    const bytes = [0x11, 0x46, 0xd0, 0x00, 0x70, 0x00];
    const block = decodeVSADB(base, new Uint8Array(bytes.slice(1)));
    expect(block.ieeeOui).toBe(OUI.DOLBY);
    expect(block.vendor?.kind).toBe('dolbyVsadb');
    const fields = (block.vendor as { fields: ReturnType<DolbyVSADBDecoder['decode']> }).fields;
    expect(fields.version).toBe(1);
    expect(fields.heightZone).toBe(true);
    expect(fields.surroundZone).toBe(true);
    expect(fields.centerZone).toBe(true);

    const reencoded = encodeVSADB(block);
    expect(Array.from(reencoded)).toEqual(bytes);

    // Reassembling from the structured fields reproduces the same post-header
    // bytes, i.e. the fixture block (header e6 = tag 0x07, length 6) is
    // stable under a decode→encode cycle.
    const reassembled = reassembleVsadbBlock(OUI.DOLBY, new DolbyVSADBEncoder().encode(fields));
    expect(Array.from(reassembled)).toEqual(bytes);
  });

  it('falls back to the raw carrier for a truncated Dolby body', () => {
    // A one-byte post-OUI body is shorter than the codec's minLength (2),
    // so the block keeps the legacy raw shape and still round-trips.
    const bytes = [0x11, 0x46, 0xd0, 0x00, 0x70];
    const block = decodeVSADB(base, new Uint8Array(bytes.slice(1)));
    expect(block.vendor).toBeUndefined();
    expect(Array.from(block.vendorPayload)).toEqual([0x70]);
    const reencoded = encodeVSADB(block);
    expect(Array.from(reencoded)).toEqual(bytes);
  });
});