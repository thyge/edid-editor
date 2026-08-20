import { describe, it, expect } from 'vitest';
import {
  ExtensionBlockParser,
  type CEAExtensionBlock,
  type VESADisplayTransferCharacteristicBlock,
} from '../src/cta';
import { checksum8 } from '../src/common';
import { buildCeaExtension } from './cea-utils';

/**
 * Build a 128-byte CEA extension block carrying a single data block whose
 * payload is `payload`. The data-block area is bytes 4..(4 + payload.length),
 * dtdOffset sits right after it, and there are no DTDs.
 */
function ceaWithSingleDataBlockPayload(tag: number, payload: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(128);
  bytes[0] = 0x02; // CEA-861 extension tag
  bytes[1] = 3; // revision
  const dtdOffset = 4 + 1 + payload.length; // 1 byte data-block header + payload
  bytes[2] = dtdOffset;
  bytes[3] = 0; // no underscan/audio/ycbcr/native flags
  bytes[4] = ((tag & 0x07) << 5) | (payload.length & 0x1F);
  bytes.set(payload, 5);
  bytes[127] = checksum8(bytes, 127);
  return bytes;
}

describe('VESA Display Transfer Characteristic data block (CTA tag 0x05)', () => {
  describe('decoder/encoder round-trip', () => {
    it('round-trips a 16-entry green transfer curve byte-identically', () => {
      // The decoder reads transfer type from bits 6:5 and the entry-count code
      // from bits 4:3. type=green (2) -> (2<<5); numEntries=16 (1) -> (1<<3).
      const header = (2 << 5) | (1 << 3); // 0x48
      const gammaBytes = [
        0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 255,
      ];
      const original = new Uint8Array([header, ...gammaBytes]);

      const raw = ceaWithSingleDataBlockPayload(0x05, original);
      const decoded = ExtensionBlockParser.decode(raw) as CEAExtensionBlock;
      expect(decoded.dataBlocks.length).toBe(1);

      const block = decoded.dataBlocks[0] as VESADisplayTransferCharacteristicBlock;
      expect(block.tag).toBe(0x05);
      expect(block.transferType).toBe('green');
      expect(block.numEntries).toBe(16);
      expect(block.gammaValues.map((v) => Math.round(v * 255))).toEqual(gammaBytes);

      // Re-encode the decoded CEA extension and verify the data-block payload
      // is byte-identical to the original.
      const reencoded = ExtensionBlockParser.encode(decoded);
      const payloadStart = 5;
      const payloadEnd = payloadStart + original.length;
      expect(Array.from(reencoded.slice(payloadStart, payloadEnd))).toEqual(
        Array.from(original),
      );
      // The whole 128-byte block round-trips too (checksum is deterministic).
      expect(Array.from(reencoded)).toEqual(Array.from(raw));
    });

    it('round-trips a structured block built from decoded fields', () => {
      const header = (2 << 5) | (1 << 3); // green, 16 entries
      const gammaBytes = [
        0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 255,
      ];
      const original = new Uint8Array([header, ...gammaBytes]);

      const raw = ceaWithSingleDataBlockPayload(0x05, original);
      const decoded = ExtensionBlockParser.decode(raw) as CEAExtensionBlock;
      const block = decoded.dataBlocks[0] as VESADisplayTransferCharacteristicBlock;

      // Rebuild a CEA extension from the structured block (with a zeroed
      // `data` sentinel of the right length so the encoder must rewrite it).
      const rebuilt: VESADisplayTransferCharacteristicBlock = {
        tag: 0x05,
        data: new Uint8Array(original.length), // all zero; encoder overwrites modeled bits
        transferType: block.transferType,
        numEntries: block.numEntries,
        gammaValues: block.gammaValues,
      };
      const reencoded = ExtensionBlockParser.encode(buildCeaExtension({ dataBlocks: [rebuilt] }));
      const payloadOut = reencoded.slice(5, 5 + original.length);
      expect(Array.from(payloadOut)).toEqual(Array.from(original));
    });
  });

  describe('reserved-bit preservation', () => {
    it('preserves the low-nibble reserved bits (header 0x67)', () => {
      // 0x67 = 0b01100111: bits 6:5 = 11 -> blue; bits 4:3 = 00 -> 8 entries;
      // bit 7 = 0 and bits 2:0 = 111 are reserved and must be preserved.
      const gammaBytes = [10, 20, 30, 40, 50, 60, 70, 80];
      const original = new Uint8Array([0x67, ...gammaBytes]);

      const raw = ceaWithSingleDataBlockPayload(0x05, original);
      const decoded = ExtensionBlockParser.decode(raw) as CEAExtensionBlock;
      const block = decoded.dataBlocks[0] as VESADisplayTransferCharacteristicBlock;
      expect(block.transferType).toBe('blue');
      expect(block.numEntries).toBe(8);

      const reencoded = ExtensionBlockParser.encode(decoded);
      const payloadOut = reencoded.slice(5, 5 + original.length);
      expect(Array.from(payloadOut)).toEqual(Array.from(original));
      // Explicitly: the reserved low nibble bits are kept verbatim.
      expect(payloadOut[0] & 0x07).toBe(0x07);
    });

    it('preserves bit 7 and the low bits (header 0xE7)', () => {
      // 0xE7 = 0b11100111: bit 7 = 1 (reserved), bits 6:5 = 11 -> blue,
      // bits 4:3 = 00 -> 8 entries, bits 2:0 = 111 (reserved).
      const gammaBytes = [1, 2, 3, 4, 5, 6, 7, 8];
      const original = new Uint8Array([0xE7, ...gammaBytes]);

      const raw = ceaWithSingleDataBlockPayload(0x05, original);
      const decoded = ExtensionBlockParser.decode(raw) as CEAExtensionBlock;
      const reencoded = ExtensionBlockParser.encode(decoded);
      const payloadOut = reencoded.slice(5, 5 + original.length);
      expect(Array.from(payloadOut)).toEqual(Array.from(original));
      expect(payloadOut[0] & 0x80).toBe(0x80);
      expect(payloadOut[0] & 0x07).toBe(0x07);
    });
  });

  describe('malformed input handling', () => {
    it('does not throw on an empty payload and encodes back empty', () => {
      const original = new Uint8Array(0);
      const raw = ceaWithSingleDataBlockPayload(0x05, original);
      // byte 4 header = (0x05 << 5) | 0 = 0xA0; dtdOffset = 5.
      expect(raw[4]).toBe(0xA0);
      expect(raw[2]).toBe(5);

      const decoded = ExtensionBlockParser.decode(raw) as CEAExtensionBlock;
      expect(decoded.dataBlocks.length).toBe(1);
      const block = decoded.dataBlocks[0] as VESADisplayTransferCharacteristicBlock;
      expect(block.transferType).toBe('white');
      expect(block.numEntries).toBe(0);
      expect(block.gammaValues).toEqual([]);

      expect(() => ExtensionBlockParser.encode(decoded)).not.toThrow();
      const reencoded = ExtensionBlockParser.encode(decoded);
      // No payload bytes after the 1-byte data-block header.
      expect(Array.from(reencoded.slice(5, 5))).toEqual([]);
    });

    it('does not throw on a single-byte (header-only) payload', () => {
      const original = new Uint8Array([0x48]); // green, 16 entries, no gamma bytes
      const raw = ceaWithSingleDataBlockPayload(0x05, original);
      const decoded = ExtensionBlockParser.decode(raw) as CEAExtensionBlock;
      const block = decoded.dataBlocks[0] as VESADisplayTransferCharacteristicBlock;
      expect(block.transferType).toBe('green');
      expect(block.numEntries).toBe(16);
      expect(block.gammaValues).toEqual([]);

      expect(() => ExtensionBlockParser.encode(decoded)).not.toThrow();
      const reencoded = ExtensionBlockParser.encode(decoded);
      expect(Array.from(reencoded.slice(5, 6))).toEqual([0x48]);
    });
  });
});