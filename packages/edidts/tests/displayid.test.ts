import { describe, expect, it } from 'vitest'
import {
  DisplayIdDataBlockTag,
  decodeDisplayIdSection,
  encodeDisplayIdSection,
  type DisplayIdProductIdentificationBlock,
} from '../src/displayid'
import { checksum8, isChecksum8Valid } from '../src/common'

function withChecksum(bytes: number[]): Uint8Array {
  const data = new Uint8Array(bytes)
  data[data.length - 1] = checksum8(data)
  return data
}

describe('DisplayID v2.0 sections', () => {
  it('decodes a DisplayID section header and unknown data block', () => {
    const sectionBytes = withChecksum([
      0x20, // DisplayID v2.0
      0x06, // Six bytes between header and checksum
      0x04, // Desktop productivity display
      0x00, // No extension sections
      0x7e, // Vendor-specific block, currently preserved as unknown
      0x01, // Revision 1, no flags
      0x03, // Payload length
      0xaa,
      0xbb,
      0xcc,
      0x00, // Checksum placeholder
    ])

    const section = decodeDisplayIdSection(sectionBytes)

    expect(section.version).toBe(2)
    expect(section.revision).toBe(0)
    expect(section.bytesInSection).toBe(6)
    expect(section.totalLength).toBe(11)
    expect(section.primaryUseCase).toBe(0x04)
    expect(section.extensionCount).toBe(0)
    expect(section.isChecksumValid).toBe(true)
    expect(section.blocks).toHaveLength(1)
    expect(section.blocks[0]).toMatchObject({
      tag: DisplayIdDataBlockTag.VendorSpecific,
      revision: 1,
      payloadLength: 3,
    })
    expect(Array.from(section.blocks[0].payload)).toEqual([0xaa, 0xbb, 0xcc])
  })

  it('preserves unknown blocks when encoding a section', () => {
    const original = withChecksum([
      0x20,
      0x06,
      0x02,
      0x00,
      0x7f,
      0x00,
      0x03,
      0x10,
      0x20,
      0x30,
      0x00,
    ])

    const section = decodeDisplayIdSection(original)
    const encoded = encodeDisplayIdSection(section)

    expect(Array.from(encoded)).toEqual(Array.from(original))
    expect(isChecksum8Valid(encoded)).toBe(true)
  })

  it('decodes a DisplayID section with invalid checksum and marks it invalid', () => {
    const sectionBytes = withChecksum([
      0x20,
      0x03,
      0x02,
      0x00,
      0x7e,
      0x00,
      0x00,
      0x00,
    ])
    sectionBytes[7] ^= 0xff

    const section = decodeDisplayIdSection(sectionBytes)

    expect(section.isChecksumValid).toBe(false)
  })

  it('ignores fixed-length trailing fill bytes before the checksum', () => {
    const sectionBytes = withChecksum([
      0x20,
      0x09,
      0x03,
      0x00,
      0x7e,
      0x00,
      0x02,
      0x11,
      0x22,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ])

    const section = decodeDisplayIdSection(sectionBytes)

    expect(section.blocks).toHaveLength(1)
    expect(section.fillBytes).toBe(4)
  })

  it('throws when a DisplayID data block length exceeds the section payload', () => {
    const sectionBytes = withChecksum([
      0x20,
      0x05,
      0x02,
      0x00,
      0x7e,
      0x00,
      0x05,
      0xaa,
      0xbb,
      0x00,
    ])

    expect(() => decodeDisplayIdSection(sectionBytes)).toThrow(
      'DisplayID data block at offset 4 declares 5 payload bytes past the section payload',
    )
  })

  it('throws for reserved DisplayID v1.x data block tags in v2 sections', () => {
    const sectionBytes = withChecksum([
      0x20,
      0x03,
      0x02,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
    ])

    expect(() => decodeDisplayIdSection(sectionBytes)).toThrow(
      'DisplayID v2.0 reserves legacy data block tag 0x01',
    )
  })

  it('throws when the DisplayID section version is not v2.0', () => {
    const sectionBytes = withChecksum([
      0x10,
      0x03,
      0x02,
      0x00,
      0x7e,
      0x00,
      0x00,
      0x00,
    ])

    expect(() => decodeDisplayIdSection(sectionBytes)).toThrow(
      'DisplayID section version byte 0x10 is not v2.0',
    )
  })

  it('throws when the declared section length exceeds the available bytes', () => {
    const sectionBytes = new Uint8Array([0x20, 0x10, 0x02, 0x00, 0x00])

    expect(() => decodeDisplayIdSection(sectionBytes)).toThrow(
      'DisplayID section declares 21 bytes but only 5 bytes are available',
    )
  })
})

describe('DisplayID v2.0 Product Identification data block', () => {
  it('decodes OUI, product identifiers, manufacture date, and product name', () => {
    const sectionBytes = withChecksum([
      0x20,
      0x14,
      0x04,
      0x00,
      0x20,
      0x00,
      0x11,
      0x00,
      0x1a,
      0x2b,
      0x34,
      0x12,
      0x78,
      0x56,
      0x34,
      0x12,
      0x16,
      0x19,
      0x05,
      0x50,
      0x61,
      0x6e,
      0x65,
      0x6c,
      0x00,
    ])

    const section = decodeDisplayIdSection(sectionBytes)
    const block = section.blocks[0] as DisplayIdProductIdentificationBlock

    expect(block.tag).toBe(DisplayIdDataBlockTag.ProductIdentification)
    expect(block.ieeeOui).toBe(0x2b1a00)
    expect(block.productId).toBe(0x1234)
    expect(block.serialNumber).toBe(0x12345678)
    expect(block.manufactureWeek).toBe(22)
    expect(block.year).toBe(2025)
    expect(block.isModelYear).toBe(false)
    expect(block.productName).toBe('Panel')
    expect(Array.from(block.productNameBytes)).toEqual([0x50, 0x61, 0x6e, 0x65, 0x6c])
  })

  it('encodes Product Identification payloads from decoded fields', () => {
    const sectionBytes = withChecksum([
      0x20,
      0x0f,
      0x04,
      0x00,
      0x20,
      0x00,
      0x0c,
      0x00,
      0x1a,
      0x2b,
      0x34,
      0x12,
      0x00,
      0x00,
      0x00,
      0x00,
      0xff,
      0x1a,
      0x00,
      0x00,
    ])

    const section = decodeDisplayIdSection(sectionBytes)
    const block = section.blocks[0] as DisplayIdProductIdentificationBlock

    block.productName = 'VR'
    block.productNameBytes = new Uint8Array([0x56, 0x52])

    const encoded = encodeDisplayIdSection(section)
    const reparsed = decodeDisplayIdSection(encoded)
    const reparsedBlock = reparsed.blocks[0] as DisplayIdProductIdentificationBlock

    expect(reparsedBlock.serialNumber).toBeUndefined()
    expect(reparsedBlock.isModelYear).toBe(true)
    expect(reparsedBlock.year).toBe(2026)
    expect(reparsedBlock.productName).toBe('VR')
    expect(reparsedBlock.payloadLength).toBe(14)
    expect(isChecksum8Valid(encoded)).toBe(true)
  })
})
