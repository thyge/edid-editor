import { describe, it, expect } from 'vitest'
import { EEDID, decodeExtension, encodeExtension, isCEAExtension, isDisplayIdExtension, isOpaqueExtension } from '../src/eedid'
import { EDID } from '../src/edid'
import { ExtensionBlockParser } from '../src/cta'
import { decodeDisplayIdSection, DisplayIdDataBlockTag, encodeDisplayIdSection, type DisplayIdProductIdentificationBlock } from '../src/displayid'
import { checksum8, isChecksum8Valid } from '../src/common'
import { isCEAExtensionBlock } from '../src/cta/extension-block'

function withChecksum(bytes: number[]): Uint8Array {
  const data = new Uint8Array(bytes)
  data[data.length - 1] = checksum8(data)
  return data
}

function buildDisplayIdSectionBytes(): Uint8Array {
  // A DisplayID 2.0 section, carried inside an EDID extension block (tag 0x70).
  // The EDID tag byte is at offset 0; the DisplayID section content starts at
  // offset 1. Section layout:
  //   byte 0:     0x70  (EDID tag — section starts at byte 1)
  //   byte 1:     0x20  (DisplayID version = 2.0)
  //   byte 2:     0x17  (bytesInSection = 23; block bytes only, excluding 4-byte
  //                     section header and the trailing 1-byte section checksum)
  //   byte 3:     0x04  (number of extensions following this section)
  //   byte 4:     0x00  (primary use case)
  //   bytes 5..:  product identification block (1 tag + 1 rev + 1 payload length + 19 payload)
  //   fill byte + section checksum appended by withChecksum.
  // Block at offset 5: tag(1) + rev(1) + payloadLength(1) + payload(19) = 22 bytes
  // Section: 4 header + 22 block + 1 fill byte + 1 checksum = 28 bytes
  // Then zero-padded to 128 (EDID extension block size), with the EDID block
  // checksum overwritten at byte 127.
  const sectionBytes = withChecksum([
    0x20, 0x17, 0x04, 0x00,
    DisplayIdDataBlockTag.ProductIdentification, 0x00, 0x13, // tag, rev, payload length 0x13 = 19
    0xac, 0x10, 0x42, // OUI 0xAC1042
    0x00, 0x00, // product id 0
    0x00, 0x00, 0x00, 0x01, // serial number
    0x00, 0x00, // week=0, year=0 (unused)
    0x07, // product name length 7
    0x54, 0x65, 0x73, 0x74, 0x4d, 0x6e, 0x74, // "TestMnt"
    0x00, // fill byte
    0x00, // extra byte so data.length matches declared total
  ])

  const out = new Uint8Array(128)
  out[0] = 0x70 // EDID extension tag
  out.set(sectionBytes, 1) // section content starts at offset 1
  out[127] = checksum8(out, 127)
  return out
}

describe('EEDID basic structure', () => {
  it('blank() returns a base-only EEDID', () => {
    const eedid = EEDID.blank()
    expect(eedid.extensions).toEqual([])
    expect(eedid.base).toBeInstanceOf(EDID)
  })

  it('decodes a base EDID with no extensions', () => {
    const base = EDID.encode(EDID.blank())
    const eedid = EEDID.decode(base)
    expect(eedid.extensions).toEqual([])
    expect(eedid.isValid).toBe(true)
  })

  it('encodes a base-only EEDID to 128 bytes with extension count 0', () => {
    const encoded = EEDID.encode(EEDID.blank())
    expect(encoded.length).toBe(128)
    expect(encoded[126]).toBe(0)
    expect(isChecksum8Valid(encoded.slice(0, 128))).toBe(true)
  })
})

describe('EEDID extension dispatch', () => {
  it('decodes a CEA extension (tag 0x02) into a CEAExtension', () => {
    const cta = ExtensionBlockParser.encode({
      tag: 0x02,
      revision: 3,
      checksum: 0,
      data: new Uint8Array(125),
      dtdOffset: 4,
      underscan: true,
      basicAudio: false,
      ycbcr444: false,
      ycbcr422: false,
      nativeFormats: 0,
      dataBlocks: [],
      detailedTimings: [],
    })
    const ext = decodeExtension(cta)
    expect(isCEAExtension(ext)).toBe(true)
    expect((ext as { underscan?: boolean }).underscan).toBe(true)
  })

  it('encodes a CEA extension through the same codec', () => {
    const cta = ExtensionBlockParser.encode({
      tag: 0x02,
      revision: 3,
      checksum: 0,
      data: new Uint8Array(125),
      dtdOffset: 4,
      underscan: false,
      basicAudio: true,
      ycbcr444: false,
      ycbcr422: false,
      nativeFormats: 0,
      dataBlocks: [],
      detailedTimings: [],
    })
    const ext = decodeExtension(cta)
    const encoded = encodeExtension(ext)
    expect(encoded[0]).toBe(0x02)
    expect(encoded[127]).toBe(checksum8(encoded, 127))
  })

  it('decodes a DisplayID 2.0 extension (tag 0x70) into a DisplayIdExtension', () => {
    const extensionBytes = buildDisplayIdSectionBytes()
    // Direct section decode skips the EDID tag at offset 0.
    const section = decodeDisplayIdSection(extensionBytes.subarray(1, 29))
    const productBlock = section.blocks.find(
      (b) => b.tag === DisplayIdDataBlockTag.ProductIdentification
    ) as DisplayIdProductIdentificationBlock | undefined
    expect(productBlock).toBeDefined()
    expect(productBlock?.productName).toBe('TestMnt')

    const ext = decodeExtension(extensionBytes)
    expect(isDisplayIdExtension(ext)).toBe(true)
  })

  it('falls back to opaque for a non-2.0 DisplayID section (e.g. version byte 0x70)', () => {
    const v1Bytes = new Uint8Array(128)
    v1Bytes[0] = 0x70
    v1Bytes[1] = 0x10
    v1Bytes[127] = checksum8(v1Bytes, 127)
    const ext = decodeExtension(v1Bytes)
    expect(isOpaqueExtension(ext)).toBe(true)
    expect(ext.tag).toBe(0x70)
  })

  it('decodes a Block Map extension (tag 0xF0) as opaque (no named EEDID arm for 0xF0)', () => {
    const blockMap = ExtensionBlockParser.encode({
      tag: 0xF0,
      revision: 0,
      checksum: 0,
      data: new Uint8Array(125),
      blockTags: [0x02, 0x70],
    })
    const ext = decodeExtension(blockMap)
    expect(isOpaqueExtension(ext)).toBe(true)
    expect(ext.tag).toBe(0xF0)
  })

  it('decodes a vendor-specific tag (e.g. 0x40) as opaque with raw bytes preserved', () => {
    const raw = new Uint8Array(128)
    raw[0] = 0x40
    raw[1] = 0x01
    raw.set([0xde, 0xad, 0xbe, 0xef], 4)
    raw[127] = checksum8(raw, 127)
    const ext = decodeExtension(raw)
    expect(isOpaqueExtension(ext)).toBe(true)
    expect(ext.tag).toBe(0x40)
    if (isOpaqueExtension(ext)) {
      expect(ext.bytes[4]).toBe(0xde)
      expect(ext.bytes[5]).toBe(0xad)
      expect(ext.bytes[6]).toBe(0xbe)
      expect(ext.bytes[7]).toBe(0xef)
    }
    const reencoded = encodeExtension(ext)
    expect(reencoded[4]).toBe(0xde)
    expect(reencoded[127]).toBe(checksum8(reencoded, 127))
  })
})

describe('EEDID full decode with mixed extensions', () => {
  it('decodes base + CEA + DisplayID + opaque in order', () => {
    const base = EDID.encode(EDID.blank())
    const cta = ExtensionBlockParser.encode({
      tag: 0x02, revision: 3, checksum: 0, data: new Uint8Array(125),
      dtdOffset: 4, underscan: false, basicAudio: false,
      ycbcr444: false, ycbcr422: false, nativeFormats: 0,
      dataBlocks: [], detailedTimings: [],
    })
    const didSection = buildDisplayIdSectionBytes()
    const opaque = new Uint8Array(128)
    opaque[0] = 0x40
    opaque[127] = checksum8(opaque, 127)

    const blob = new Uint8Array(base.length + cta.length + didSection.length + opaque.length)
    blob.set(base, 0)
    blob.set(cta, 128)
    blob.set(didSection, 256)
    blob.set(opaque, 384)
    blob[126] = 3
    blob[127] = checksum8(blob, 127)

    const eedid = EEDID.decode(blob)
    expect(eedid.extensions.length).toBe(3)
    expect(isCEAExtension(eedid.extensions[0])).toBe(true)
    expect(isDisplayIdExtension(eedid.extensions[1])).toBe(true)
    expect(isOpaqueExtension(eedid.extensions[2])).toBe(true)
    expect(eedid.isValid).toBe(true)
  })

  it('round-trips a base + DisplayID EEDID with section blocks preserved', () => {
    const extensionBytes = buildDisplayIdSectionBytes()
    // The DisplayID section itself starts at offset 1 of the EDID extension
    // block. Build the same section bytes for direct section decode/encode.
    const sectionContent = extensionBytes.subarray(1, 29)
    const section = decodeDisplayIdSection(sectionContent)
    const base = EDID.encode(EDID.blank())
    const blob = new Uint8Array(base.length + extensionBytes.length)
    blob.set(base, 0)
    blob.set(extensionBytes, 128)
    blob[126] = 1
    blob[127] = checksum8(blob, 127)

    const eedid = EEDID.decode(blob)
    expect(eedid.extensions.length).toBe(1)
    const ext = eedid.extensions[0]
    expect(isDisplayIdExtension(ext)).toBe(true)
    if (isDisplayIdExtension(ext)) {
      const productBlock = ext.section.blocks.find(
        (b) => b.tag === DisplayIdDataBlockTag.ProductIdentification
      ) as DisplayIdProductIdentificationBlock | undefined
      expect(productBlock?.productName).toBe('TestMnt')
    }

    const reencoded = EEDID.encode(eedid)
    const red = EEDID.decode(reencoded)
    expect(red.extensions.length).toBe(1)
    if (isDisplayIdExtension(red.extensions[0])) {
      const productBlock = red.extensions[0].section.blocks.find(
        (b) => b.tag === DisplayIdDataBlockTag.ProductIdentification
      ) as DisplayIdProductIdentificationBlock | undefined
      expect(productBlock?.productName).toBe('TestMnt')
    }
  })

  it('rejects bytes shorter than 128', () => {
    expect(() => EEDID.decode(new Uint8Array(64))).toThrow('EEDID: minimum 128 bytes required')
  })
})

describe('encodeDisplayIdSection integration', () => {
  it('round-trips a DisplayID section through encodeDisplayIdSection + decodeDisplayIdSection', () => {
    // buildDisplayIdSectionBytes returns a 128-byte EDID extension block
    // (tag 0x70 at byte 0; DisplayID section starts at byte 1).
    const original = decodeDisplayIdSection(buildDisplayIdSectionBytes().subarray(1, 29))
    const encoded = encodeDisplayIdSection(original)
    const red = decodeDisplayIdSection(encoded)
    expect(red.blocks.length).toBe(original.blocks.length)
    const productOriginal = original.blocks.find(
      (b) => b.tag === DisplayIdDataBlockTag.ProductIdentification
    ) as DisplayIdProductIdentificationBlock | undefined
    const productRed = red.blocks.find(
      (b) => b.tag === DisplayIdDataBlockTag.ProductIdentification
    ) as DisplayIdProductIdentificationBlock | undefined
    expect(productOriginal?.productName).toBe('TestMnt')
    expect(productRed?.productName).toBe('TestMnt')
  })
})

describe('EEDID extension count byte 126', () => {
  it('encodes a base-only EEDID with byte 126 = 0', () => {
    const encoded = EEDID.encode(EEDID.blank())
    expect(encoded[126]).toBe(0)
  })

  it('encodes a 3-extension EEDID with byte 126 = 3', () => {
    const base = EDID.encode(EDID.blank())
    const cta = ExtensionBlockParser.encode({
      tag: 0x02,
      revision: 3,
      checksum: 0,
      data: new Uint8Array(125),
      dtdOffset: 4,
      underscan: false,
      basicAudio: false,
      ycbcr444: false,
      ycbcr422: false,
      nativeFormats: 0,
      dataBlocks: [],
      detailedTimings: [],
    })
    const didSection = buildDisplayIdSectionBytes()
    const opaque = new Uint8Array(128)
    opaque[0] = 0x40
    opaque[127] = checksum8(opaque, 127)

    const blob = new Uint8Array(base.length + cta.length + didSection.length + opaque.length)
    blob.set(base, 0)
    blob.set(cta, 128)
    blob.set(didSection, 256)
    blob.set(opaque, 384)
    blob[126] = 3
    blob[127] = checksum8(blob, 127)

    const eedid = EEDID.decode(blob)
    const reencoded = EEDID.encode(eedid)
    expect(reencoded[126]).toBe(3)
  })
})

describe('EEDID partial trailing bytes', () => {
  it('ignores a 64-byte tail after the base block (no extensions decoded)', () => {
    const base = EDID.encode(EDID.blank())
    const blob = new Uint8Array(base.length + 64)
    blob.set(base, 0)
    // The trailing 64 bytes are zero-filled (no real extension); the decoder
    // must not throw and must not invent a phantom extension from them.
    const eedid = EEDID.decode(blob)
    expect(eedid.extensions).toEqual([])
  })

  it('ignores a 32-byte tail when the base is followed by a full extension block', () => {
    const base = EDID.encode(EDID.blank())
    const cta = ExtensionBlockParser.encode({
      tag: 0x02,
      revision: 3,
      checksum: 0,
      data: new Uint8Array(125),
      dtdOffset: 4,
      underscan: false,
      basicAudio: false,
      ycbcr444: false,
      ycbcr422: false,
      nativeFormats: 0,
      dataBlocks: [],
      detailedTimings: [],
    })
    const blob = new Uint8Array(base.length + cta.length + 32)
    blob.set(base, 0)
    blob.set(cta, 128)
    // trailing 32 bytes are zero-filled; only 1 real extension should parse.
    const eedid = EEDID.decode(blob)
    expect(eedid.extensions.length).toBe(1)
  })
})

describe('EEDID extension checksum validity (Section 3.11)', () => {
  it('reports extensionsValid = true when all extension checksums are correct', () => {
    const base = EDID.encode(EDID.blank())
    const cta = ExtensionBlockParser.encode({
      tag: 0x02, revision: 3, checksum: 0, data: new Uint8Array(125),
      dtdOffset: 4, underscan: false, basicAudio: false,
      ycbcr444: false, ycbcr422: false, nativeFormats: 0,
      dataBlocks: [], detailedTimings: [],
    })
    const blob = new Uint8Array(base.length + cta.length)
    blob.set(base, 0)
    blob.set(cta, 128)
    blob[126] = 1
    blob[127] = checksum8(blob, 127)
    const eedid = EEDID.decode(blob)
    expect(eedid.extensionsValid).toBe(true)
  })

  it('reports extensionsValid = false when an extension checksum is corrupt', () => {
    const base = EDID.encode(EDID.blank())
    const cta = ExtensionBlockParser.encode({
      tag: 0x02, revision: 3, checksum: 0, data: new Uint8Array(125),
      dtdOffset: 4, underscan: false, basicAudio: false,
      ycbcr444: false, ycbcr422: false, nativeFormats: 0,
      dataBlocks: [], detailedTimings: [],
    })
    const blob = new Uint8Array(base.length + cta.length)
    blob.set(base, 0)
    blob.set(cta, 128)
    blob[126] = 1
    blob[127] = checksum8(blob, 127)
    // Corrupt the extension block's last byte (its checksum).
    blob[255] ^= 0xff
    const eedid = EEDID.decode(blob)
    expect(eedid.extensionsValid).toBe(false)
  })

  it('defaults extensionsValid to true for a programmatically constructed EEDID', () => {
    const eedid = EEDID.blank()
    expect(eedid.extensionsValid).toBe(true)
  })
})
