import { describe, expect, it } from 'vitest';
import {
  decodeExtension,
  encodeExtension,
  getDisplayIdFreePayloadBytes,
  DISPLAY_ID_PAYLOAD_CAPACITY_BYTES,
  type DisplayIdExtension,
} from '../src/eedid/extension';
import { checksum8, isChecksum8Valid } from '../src/common/checksum';
import { decodeDisplayIdSection } from '../src/displayid/section';

/**
 * Build a minimal valid DisplayID 2.0 section:
 *   [0x20, bytesInSection, primaryUseCase, extensionCount, ...payload, checksum]
 * The trailing checksum byte is computed so the section is internally valid.
 */
function buildSection(
  primaryUseCase: number,
  extensionCount: number,
  payload: number[] = [],
): Uint8Array {
  const bytesInSection = payload.length;
  const body = [0x20, bytesInSection, primaryUseCase, extensionCount, ...payload];
  const data = new Uint8Array(body.length + 1);
  data.set(body, 0);
  data[data.length - 1] = checksum8(data, data.length - 1);
  return data;
}

/** Pack one or more DisplayID sections into a 128-byte EDID 0x70 extension block. */
function buildExtensionBlock(...sections: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(128);
  out[0] = 0x70;
  let offset = 1;
  for (const section of sections) {
    out.set(section, offset);
    offset += section.length;
  }
  // bytes offset..126 are zero-filled already; byte 127 is the EDID block checksum.
  out[127] = checksum8(out, 127);
  return out;
}

describe('DisplayID multi-section chain-walk in the 0x70 extension arm', () => {
  it('decodes two concatenated sections and exposes both `section` and `sections`', () => {
    const section1 = buildSection(0x04, 1); // base section declares extensionCount = 1
    const section2 = buildSection(0x00, 0); // trailing section, no further extensions
    const block = buildExtensionBlock(section1, section2);

    const ext = decodeExtension(block) as DisplayIdExtension;

    expect(ext.kind).toBe('displayid');
    expect(ext.tag).toBe(0x70);
    expect(ext.sections).toHaveLength(2);
    expect(ext.section).toBe(ext.sections[0]);

    // Each parsed section must be individually checksum-valid and match the
    // bytes we encoded.
    const reparsed1 = decodeDisplayIdSection(section1);
    const reparsed2 = decodeDisplayIdSection(section2);
    expect(ext.sections[0]).toMatchObject({
      primaryUseCase: reparsed1.primaryUseCase,
      extensionCount: 1,
      isChecksumValid: true,
    });
    expect(ext.sections[1]).toMatchObject({
      primaryUseCase: reparsed2.primaryUseCase,
      extensionCount: 0,
      isChecksumValid: true,
    });
  });

  it('re-encodes a two-section extension byte-identically to the original block', () => {
    const section1 = buildSection(0x04, 1);
    const section2 = buildSection(0x02, 0);
    const block = buildExtensionBlock(section1, section2);

    const ext = decodeExtension(block) as DisplayIdExtension;
    const encoded = encodeExtension(ext);

    expect(Array.from(encoded)).toEqual(Array.from(block));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('remains stable across repeated decode/encode cycles (round-trip stability)', () => {
    const section1 = buildSection(0x04, 1);
    const section2 = buildSection(0x00, 0);
    const block = buildExtensionBlock(section1, section2);

    const first = decodeExtension(block) as DisplayIdExtension;
    const encoded = encodeExtension(first);
    const second = decodeExtension(encoded) as DisplayIdExtension;

    expect(second.sections).toHaveLength(2);
    expect(second.section).toBe(second.sections[0]);
    expect(Array.from(encodeExtension(second))).toEqual(Array.from(block));
  });

  it('still decodes a single-section extension to sections.length === 1 and encodes byte-identically', () => {
    const section1 = buildSection(0x04, 0);
    const block = buildExtensionBlock(section1);

    const ext = decodeExtension(block) as DisplayIdExtension;

    expect(ext.kind).toBe('displayid');
    expect(ext.sections).toHaveLength(1);
    expect(ext.section).toBe(ext.sections[0]);
    expect(ext.section.extensionCount).toBe(0);

    const encoded = encodeExtension(ext);
    expect(Array.from(encoded)).toEqual(Array.from(block));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('round-trips a three-section payload', () => {
    const section1 = buildSection(0x04, 2, [0x7e, 0x00, 0x01, 0xaa]); // base + 2 extensions
    const section2 = buildSection(0x00, 1, [0x7e, 0x00, 0x01, 0xbb]);
    const section3 = buildSection(0x00, 0, [0x7e, 0x00, 0x01, 0xcc]);
    const block = buildExtensionBlock(section1, section2, section3);

    const ext = decodeExtension(block) as DisplayIdExtension;
    expect(ext.sections).toHaveLength(3);
    expect(ext.section).toBe(ext.sections[0]);
    expect(ext.sections[2].extensionCount).toBe(0);

    const encoded = encodeExtension(ext);
    expect(Array.from(encoded)).toEqual(Array.from(block));

    const redecoded = decodeExtension(encoded) as DisplayIdExtension;
    expect(redecoded.sections).toHaveLength(3);
  });
});
describe('getDisplayIdFreePayloadBytes (TASK-131)', () => {
  /** Build a DisplayID extension model from decoded sections (decodeExtension
   *  preserves the zero fill after a short section as trailingBytes, which
   *  would consume the budget — for a pure budget test, build the model
   *  directly the way the editor does). */
  function extModel(
    sections: Uint8Array[],
    trailingBytes?: Uint8Array,
  ): DisplayIdExtension {
    const decoded = sections.map(decodeDisplayIdSection);
    return {
      kind: 'displayid',
      tag: 0x70,
      revision: 1,
      section: decoded[0],
      sections: decoded,
      trailingBytes,
      checksum: 0,
    };
  }

  it('reports the shared 126-byte budget minus every chained section', () => {
    // One empty section = its 5-byte header only.
    expect(getDisplayIdFreePayloadBytes(extModel([buildSection(0x04, 0)]))).toBe(
      DISPLAY_ID_PAYLOAD_CAPACITY_BYTES - 5,
    );

    // A 5-byte data block (3-byte header + 2-byte payload) consumes 5 more.
    expect(
      getDisplayIdFreePayloadBytes(
        extModel([buildSection(0x04, 0, [0x7e, 0x00, 0x02, 0xaa, 0xbb])]),
      ),
    ).toBe(DISPLAY_ID_PAYLOAD_CAPACITY_BYTES - 10);

    // Every section draws from the same budget.
    expect(
      getDisplayIdFreePayloadBytes(
        extModel([
          buildSection(0x04, 1, [0x7e, 0x00, 0x02, 0xaa, 0xbb]),
          buildSection(0x00, 0),
        ]),
      ),
    ).toBe(DISPLAY_ID_PAYLOAD_CAPACITY_BYTES - 10 - 5);
  });

  it('accounts for verbatim trailingBytes in the shared budget', () => {
    expect(
      getDisplayIdFreePayloadBytes(
        extModel([buildSection(0x04, 0)], new Uint8Array([0xde, 0xad])),
      ),
    ).toBe(DISPLAY_ID_PAYLOAD_CAPACITY_BYTES - 5 - 2);
  });
});
