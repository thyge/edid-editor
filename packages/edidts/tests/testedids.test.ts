import { describe, it, expect } from 'vitest'
import { EDID } from '../src/edid'
import { EstablishedTiming } from '../src/edid/established-timing'
import { loadEdidFixtures } from './fixture-loader'

const edidFixtures = await loadEdidFixtures()

describe('Test EDID compatibility', () => {
  it.each(edidFixtures)('should parse $source/$name without throwing', ({ data }) => {
    expect(() => {
      const edid = new EDID(data)
      expect(edid).toBeDefined()
    }).not.toThrow()
  })

  it.each(edidFixtures)('should have valid header signature for $source/$name', ({ data }) => {
    const edid = new EDID(data)
    
    expect(edid.header).toBeDefined()
    expect(edid.header.manufacturerId).toMatch(/^[A-Z]{3}$/)
  })

  it.each(edidFixtures)('should have valid checksum for $source/$name', ({ data }) => {
    const edid = new EDID(data)
    
    expect(edid.isValid).toBe(true)
  })

  it.each(edidFixtures)('should round-trip encode/decode $source/$name', ({ data }) => {
    const original = new EDID(data)
    
    const encoded = original.encode()
    const decoded = new EDID(encoded)
    
    expect(decoded.header.manufacturerId).toBe(original.header.manufacturerId)
    expect(decoded.header.productCode).toBe(original.header.productCode)
    expect(decoded.isValid).toBe(true)
  })

  it.each(edidFixtures)('should encode modifications correctly for $source/$name', ({ data }) => {
    const edid = new EDID(data)
    
    const originalManufacturer = edid.header.manufacturerId
    const originalYear = edid.header.yearOfManufacture
    
    edid.header.manufacturerId = 'ZZZ'
    edid.header.yearOfManufacture = 2025
    
    const encoded = edid.encode()
    const decoded = new EDID(encoded)
    
    expect(decoded.header.manufacturerId).toBe('ZZZ')
    expect(decoded.header.yearOfManufacture).toBe(2025)
    expect(decoded.header.manufacturerId).not.toBe(originalManufacturer)
    expect(decoded.isValid).toBe(true)
    
    decoded.header.manufacturerId = originalManufacturer
    decoded.header.yearOfManufacture = originalYear
    const restored = new EDID(decoded.encode())
    expect(restored.header.manufacturerId).toBe(originalManufacturer)
    expect(restored.isValid).toBe(true)
  })

  it.each(edidFixtures)('should encode established timing changes for $source/$name', ({ data }) => {
    const edid = new EDID(data)

    const originalTimings = edid.establishedTimings
    const originalIds = originalTimings.map(t => t.id)
    const missingTimingDef = EstablishedTiming.TIMING_MAP.find(
      timing => !originalIds.includes(timing.id) && !timing.name.startsWith('Reserved')
    )

    if (missingTimingDef) {
      edid.establishedTimings = [
        ...originalTimings,
        new EstablishedTiming(missingTimingDef),
      ]

      const encoded = edid.encode()
      const decoded = new EDID(encoded)

      expect(decoded.establishedTimings.some(t => t.id === missingTimingDef.id)).toBe(true)
      expect(decoded.isValid).toBe(true)
    } else if (originalTimings.length > 0) {
      const removedTiming = originalTimings[0]
      edid.establishedTimings = originalTimings.slice(1)

      const encoded = edid.encode()
      const decoded = new EDID(encoded)

      expect(decoded.establishedTimings.some(t => t.id === removedTiming.id)).toBe(false)
      expect(decoded.isValid).toBe(true)
    } else {
      expect.fail('Unable to modify established timings for this EDID sample')
    }
  })

  it.each(edidFixtures)('should extract timing information from $source/$name', ({ data }) => {
    const edid = new EDID(data)
    
    expect(edid.establishedTimings).toBeInstanceOf(Array)
    expect(edid.standardTimings).toBeInstanceOf(Array)
    expect(edid.detailedTimings).toBeInstanceOf(Array)
  })
})

describe('Test EDID content extraction', () => {
  it.each(edidFixtures)('should extract display info from $source/$name', ({ data }) => {
    const edid = new EDID(data)
    
    expect(edid.header.edidVersion).toBeGreaterThanOrEqual(1)
    expect(edid.header.edidRevision).toBeGreaterThanOrEqual(0)
    expect(typeof edid.gamma).toBe('number')
  })
})
