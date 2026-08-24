import { describe, it, expect } from 'vitest'
import { EEDID, getCEAExtension, getDisplayIdExtension, isDisplayIdExtension } from '../src/eedid'
import { EstablishedTiming } from '../src/edid'
import { DetailedTimingDescriptor } from '../src/common'
import { checksum8 } from '../src/common'
import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  decodeDisplayIdSection,
  encodeDisplayIdSection,
  DisplayIdDataBlockTag,
  type DisplayIdV1TypeIDetailedTimingBlock,
} from '../src/displayid'
import { VENDOR_DECODERS } from '../src/cta/vsdb/registry'
import { loadEdidFixtures } from './fixture-loader'

const edidFixtures = await loadEdidFixtures()

/**
 * OUI integer values that have a registered VSDB decoder. A tag-0x03 VSDB
 * whose on-wire OUI (block.data[0..2], little-endian) is in this set MUST
 * decode to a structured vendor kind — never the 'unknown' fallback. This
 * guards the TASK-56 regression where an OUI byte-shift made every known
 * VSDB decode as opaque/unknown.
 */
const KNOWN_VSDB_OUIS = new Set(Object.keys(VENDOR_DECODERS).map(Number))

/** Base field set every DisplayID data block carries (incl. opaque fallback). */
const DISPLAYID_BASE_KEYS = ['tag', 'revision', 'flags', 'payloadLength', 'payload']

function isStructuredDisplayIdBlock(block: { tag: number }): boolean {
  // A structured (known) block carries typed fields beyond the base 5; an
  // opaque fallback carries only the base set.
  return Object.keys(block).some((k) => !DISPLAYID_BASE_KEYS.includes(k))
}

function ouiFromVsdbData(data: Uint8Array): number {
  // VSDB block.payload is the header-stripped body: OUI occupies bytes 0..2
  // little-endian (CTA OUIs are wire/little-endian, unlike DisplayID §4.9).
  return data[0] | (data[1] << 8) | (data[2] << 16)
}

describe('Test EDID compatibility', () => {
  it.each(edidFixtures)('should parse $source/$name without throwing', ({ data }) => {
    expect(() => {
      const edid = EEDID.decode(data)
      expect(edid).toBeDefined()
    }).not.toThrow()
  })

  it.each(edidFixtures)('should have valid header signature for $source/$name', ({ data }) => {
    const edid = EEDID.decode(data)

    expect(edid.base.header).toBeDefined()
    expect(edid.base.header.manufacturerId).toMatch(/^[A-Z]{3}$/)
  })

  it.each(edidFixtures)('should have valid checksum for $source/$name', ({ data }) => {
    const edid = EEDID.decode(data)

    expect(edid.isValid).toBe(true)
  })

  it.each(edidFixtures)('should round-trip encode/decode $source/$name', ({ data }) => {
    const original = EEDID.decode(data)

    const encoded = EEDID.encode(original)
    const decoded = EEDID.decode(encoded)

    expect(decoded.base.header.manufacturerId).toBe(original.base.header.manufacturerId)
    expect(decoded.base.header.productCode).toBe(original.base.header.productCode)
    expect(decoded.isValid).toBe(true)
  })

  it.each(edidFixtures)('should encode modifications correctly for $source/$name', ({ data }) => {
    const edid = EEDID.decode(data)

    const originalManufacturer = edid.base.header.manufacturerId
    const originalYear = edid.base.header.yearOfManufacture

    edid.base.header.manufacturerId = 'ZZZ'
    edid.base.header.yearOfManufacture = 2025

    const encoded = EEDID.encode(edid)
    const decoded = EEDID.decode(encoded)

    expect(decoded.base.header.manufacturerId).toBe('ZZZ')
    expect(decoded.base.header.yearOfManufacture).toBe(2025)
    expect(decoded.base.header.manufacturerId).not.toBe(originalManufacturer)
    expect(decoded.isValid).toBe(true)

    decoded.base.header.manufacturerId = originalManufacturer
    decoded.base.header.yearOfManufacture = originalYear
    const restored = EEDID.decode(EEDID.encode(decoded))
    expect(restored.base.header.manufacturerId).toBe(originalManufacturer)
    expect(restored.isValid).toBe(true)
  })

  it.each(edidFixtures)('should encode established timing changes for $source/$name', ({ data }) => {
    const edid = EEDID.decode(data)

    const originalTimings = edid.base.establishedTimings
    const originalIds = originalTimings.map(t => t.id)
    const missingTimingDef = EstablishedTiming.TIMING_MAP.find(
      timing => !originalIds.includes(timing.id) && !timing.name.startsWith('Reserved')
    )

    if (missingTimingDef) {
      edid.base.establishedTimings = [
        ...originalTimings,
        new EstablishedTiming(missingTimingDef),
      ]

      const encoded = EEDID.encode(edid)
      const decoded = EEDID.decode(encoded)

      expect(decoded.base.establishedTimings.some(t => t.id === missingTimingDef.id)).toBe(true)
      expect(decoded.isValid).toBe(true)
    } else if (originalTimings.length > 0) {
      const removedTiming = originalTimings[0]
      edid.base.establishedTimings = originalTimings.slice(1)

      const encoded = EEDID.encode(edid)
      const decoded = EEDID.decode(encoded)

      expect(decoded.base.establishedTimings.some(t => t.id === removedTiming.id)).toBe(false)
      expect(decoded.isValid).toBe(true)
    } else {
      expect.fail('Unable to modify established timings for this EDID sample')
    }
  })

  it.each(edidFixtures)('should extract timing information from $source/$name', ({ data }) => {
    const edid = EEDID.decode(data)

    expect(edid.base.establishedTimings).toBeInstanceOf(Array)
    expect(edid.base.standardTimings).toBeInstanceOf(Array)
    expect(edid.base.detailedTimings).toBeInstanceOf(Array)
  })
})

describe('Test EDID content extraction', () => {
  it.each(edidFixtures)('should extract display info from $source/$name', ({ data }) => {
    const edid = EEDID.decode(data)

    expect(edid.base.header.edidVersion).toBeGreaterThanOrEqual(1)
    expect(edid.base.header.edidRevision).toBeGreaterThanOrEqual(0)
    expect(typeof edid.base.gamma).toBe('number')
  })
})

/**
 * Structured-field regression guards (TASK-47).
 *
 * The byte-level round-trip suite above passes even when a structured decoder
 * silently falls back to opaque (the opaque path preserves bytes), so it
 * cannot catch classes of regressions like the VSDB OUI-shift (TASK-56) or the
 * DTD stereo bug (TASK-32). These assertions inspect decoded *structure*, not
 * bytes, so a structured→opaque regression or a field-misdecode fails here.
 */
describe('Structured-field regression guards', () => {
  it('CEA Video/Audio/Speaker/VSDB blocks decode to structured types (not opaque) where present', () => {
    const violations: string[] = []

    for (const { source, name, data } of edidFixtures) {
      const edid = EEDID.decode(data)
      const cea = getCEAExtension(edid)
      if (!cea) continue

      for (const block of cea.dataBlocks) {
        const label = `${source}/${name} tag=0x${block.tag.toString(16)}`
        switch (block.tag) {
          case 0x01: // Audio Data Block — must carry structured `descriptors`
            if (!Array.isArray((block as { descriptors?: unknown }).descriptors)) {
              violations.push(`${label} (audio) missing structured descriptors`)
            }
            break
          case 0x02: // Video Data Block — must carry structured `vics`
            if (!Array.isArray((block as { vics?: unknown }).vics)) {
              violations.push(`${label} (video) missing structured vics`)
            }
            break
          case 0x04: { // Speaker Allocation — must carry structured `speakers`
            const speakers = (block as { speakers?: unknown }).speakers
            if (typeof speakers !== 'object' || speakers === null) {
              violations.push(`${label} (speaker) missing structured speakers`)
            }
            break
          }
          case 0x03: { // VSDB — must carry a structured `vendor` descriptor
            const vendor = (block as { vendor?: { kind: string } }).vendor
            if (!vendor) {
              violations.push(`${label} (vsdb) missing structured vendor`)
              break
            }
            // Known OUIs must decode to their vendor kind, not the 'unknown'
            // fallback — guards the TASK-56 OUI-shift regression.
            if (KNOWN_VSDB_OUIS.has(ouiFromVsdbData(block.payload)) && vendor.kind === 'unknown') {
              violations.push(`${label} (vsdb) known OUI decoded as unknown kind`)
            }
            break
          }
          default:
            break
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })

  it('DisplayID 2.0 section blocks decode to structured types where present', () => {
    // The in-module committed corpus carries no v2.0 DisplayID fixtures
    // (v1.x is now decoded structured too — see the v1.x guard below), so
    // construct a v2.0 section with a Product Identification block and assert
    // it decodes to structured fields, not an opaque block. Payload mirrors
    // displayid.test.ts §Product Identification.
    const sectionBytes = new Uint8Array([
      0x20, 0x14, 0x04, 0x00, // v2.0, 20 bytes-in-section, desktop use, 0 extensions
      0x20, 0x00, 0x11, 0x00, // Product Identification tag 0x20, rev 0, len 17
      0x1a, 0x2b, 0x34, 0x12, // OUI 0x2b1a00, product id 0x1234
      0x78, 0x56, 0x34, 0x12, // serial 0x12345678
      0x16, 0x19, 0x05,       // week 22, year 2025, name len 5
      0x50, 0x61, 0x6e, 0x65, 0x6c, // "Panel"
      0x00,                   // checksum placeholder
    ])
    sectionBytes[sectionBytes.length - 1] = checksum8(sectionBytes)

    const section = decodeDisplayIdSection(sectionBytes)
    expect(section.blocks).toHaveLength(1)

    const block = section.blocks[0]
    expect(block.tag).toBe(DisplayIdDataBlockTag.ProductIdentification)
    // Structured-field checks (not byte round-trip): the known block carries
    // typed product-identification fields an opaque fallback would not have.
    expect(isStructuredDisplayIdBlock(block)).toBe(true)
    expect((block as { ieeeOui?: number }).ieeeOui).toBe(0x2b1a00)
    expect((block as { productName?: string }).productName).toBe('Panel')
  })

  it('DisplayID 1.x sections decode to structured v1.x section blocks (TASK-57)', () => {
    // The in-module committed corpus has no v1.x DisplayID fixture (the v1.x
    // samples live in the gitignored proprietary fixtures), so construct a v1.x
    // section carrying a Type I Detailed Timing block (tag 0x03) and assert it
    // decodes to structured DTDs, not an opaque/raw block. This guards the
    // TASK-57 change that routes v1.x sections through the v1.x codec instead
    // of the opaque fallback.
    //
    // The 20-byte Type I descriptor encodes a 1920x1080@60 timing:
    //   pixelClockKHz = 10 * (1 + raw24)  →  raw24 = 148500/10 - 1 = 14849
    //   options byte 0x80  → preferred, aspect 0, progressive, stereo none
    const typeIDescriptor = new Uint8Array([
      0x01, 0x3a, 0x00, // pixel clock raw24 (14849 → 148500 kHz)
      0x80,            // options: preferred
      0x7f, 0x07,      // hactive 1919 → 1920
      0x17, 0x01,      // hblank 279 → 280
      0x57, 0x00,      // hsync offset 87 → 88, polarity positive
      0x2b, 0x00,      // hsync width 43 → 44
      0x37, 0x04,      // vactive 1079 → 1080
      0x2c, 0x00,      // vblank 44 → 45
      0x03, 0x00,      // vsync offset 3 → 4, polarity positive
      0x04, 0x00,      // vsync width 4 → 5
    ])

    const sectionBytes = new Uint8Array([
      0x10, 0x17, 0x02, 0x00, // v1.x (version 1, rev 0), 23 bytes-in-section, desktop, 0 extensions
      0x03, 0x00, 0x14,       // Type I Detailed Timing tag 0x03, rev 0, len 20
      ...typeIDescriptor,     // 20-byte timing descriptor
      0x00,                   // checksum placeholder
    ])
    sectionBytes[sectionBytes.length - 1] = checksum8(sectionBytes)

    const section = decodeDisplayIdSection(sectionBytes)
    expect(section.version).toBe(1)
    expect(section.versionByte).toBe(0x10)
    expect(section.blocks).toHaveLength(1)

    const block = section.blocks[0] as DisplayIdV1TypeIDetailedTimingBlock
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming)
    // Structured-field check (not byte round-trip): the known block carries a
    // typed `timings` array an opaque/raw fallback would not have.
    expect(isStructuredDisplayIdBlock(block)).toBe(true)
    expect(block.timings).toHaveLength(1)

    const timing = block.timings[0]
    // Type 1 pixel clock is 10 kHz resolution (Type VII is 1 kHz).
    expect(timing.pixelClockKHz).toBe(148500)
    expect(timing.horizontalActive).toBe(1920)
    expect(timing.verticalActive).toBe(1080)
    expect(timing.horizontalSyncWidth).toBe(44)
    expect(timing.verticalSyncWidth).toBe(5)
    expect(timing.preferred).toBe(true)
    expect(timing.interlaced).toBe(false)

    // Byte-exact round-trip: re-encoding the decoded section reproduces the
    // original bytes (incl. checksum), proving the v1.x codec is lossless.
    const reencoded = encodeDisplayIdSection(section)
    expect(Array.from(reencoded)).toEqual(Array.from(sectionBytes))
  })

  it('corpus DisplayID 1.x sections are not opaque (TASK-57)', () => {
    // Walk every loaded fixture; any DisplayID extension whose carried section
    // is v1.x (version byte 0x10–0x1F) MUST decode to a structured
    // DisplayIdExtension, not fall back to OpaqueExtension. On a checkout
    // without the proprietary/corpus fixtures this is a no-op (no v1.x sections
    // are found) and passes vacuously — the constructed-section guard above
    // carries the always-runs assertion.
    const violations: string[] = []

    for (const { source, name, data } of edidFixtures) {
      const edid = EEDID.decode(data)
      const ext = getDisplayIdExtension(edid)
      if (!ext) continue

      const versionByte = ext.section.versionByte
      if (versionByte >= 0x10 && versionByte < 0x20) {
        // v1.x section: must be a structured DisplayIdExtension (it is, by
        // construction of getDisplayIdExtension, but assert the kind and that
        // the section is not the opaque fallback shape).
        if (!isDisplayIdExtension(ext)) {
          violations.push(`${source}/${name} v1.x section (0x${versionByte.toString(16)}) is opaque`)
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })

  it('a constructed stereo DTD round-trips its stereo mode (guards TASK-32 fix)', () => {
    // The TASK-32 broken decode short-circuited field-sequential-right (code
    // 001) to 'none', and the broken encode emitted scrambled bits. A DTD
    // constructed with that mode MUST round-trip to the same mode — under the
    // broken maps this assertion fails.
    const dtd = new DetailedTimingDescriptor({
      pixelClock: 148.5,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      verticalActive: 1080,
      verticalBlanking: 45,
      horizontalSyncWidth: 44,
      verticalSyncWidth: 5,
      flags: { stereoMode: 'field-sequential-right', syncType: 'digital-separate' },
    })

    const encoded = dtd.encode()
    const decoded = DetailedTimingDescriptor.decode(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.flags.stereoMode).toBe('field-sequential-right')

    // Exercise every non-`none` mode so any future stereo-bit scramble fails.
    for (const mode of [
      'field-sequential-left',
      '2-way-interleaved-right',
      '2-way-interleaved-left',
      '4-way-interleaved',
      'side-by-side-interleaved',
    ] as const) {
      const built = new DetailedTimingDescriptor({
        pixelClock: 74.25,
        horizontalActive: 1280,
        horizontalBlanking: 200,
        verticalActive: 720,
        verticalBlanking: 30,
        flags: { stereoMode: mode },
      })
      const roundTrip = DetailedTimingDescriptor.decode(built.encode())
      expect(roundTrip!.flags.stereoMode).toBe(mode)
    }
  })
})
