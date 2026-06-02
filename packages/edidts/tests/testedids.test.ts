import { describe, it, expect } from 'vitest'
import { EEDID } from '../src/eedid'
import { EstablishedTiming } from '../src/edid'
import { loadEdidFixtures } from './fixture-loader'

const edidFixtures = await loadEdidFixtures()

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
