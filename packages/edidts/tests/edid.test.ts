import { describe, it, expect } from 'vitest'
import { EDID } from '../src/edid'
import { checksum8, isChecksum8Valid } from '../src/common'
import type { ColorPointDescriptor, StandardTimingIdDescriptor } from '../src/edid/display-descriptor'

function createTestEDID(manufacturerId = 'ABC'): Uint8Array {
  const edid = new Uint8Array(128)
  
  // EDID signature
  edid.set([0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00], 0)
  
  const [manufacturerHigh, manufacturerLow] = encodeTestManufacturerId(manufacturerId)
  edid[8] = manufacturerHigh
  edid[9] = manufacturerLow
  
  // Product code (little endian)
  edid[10] = 0x34
  edid[11] = 0x12
  
  // Serial number (little endian)
  edid[12] = 0x78
  edid[13] = 0x56
  edid[14] = 0x34
  edid[15] = 0x12
  
  // Week and year
  edid[16] = 15  // Week 15
  edid[17] = 30  // Year 2020 (1990 + 30)
  
  // EDID version/revision
  edid[18] = 1   // Version 1
  edid[19] = 4   // Revision 4
  
  // Fill remaining bytes with some example data
  edid[20] = 0x08  // Digital input
  edid[21] = 52    // Max horizontal size (52 cm)
  edid[22] = 29    // Max vertical size (29 cm)
  edid[23] = 120   // Gamma: (120 + 100) / 100 = 2.2
  edid[24] = 0x06  // Features
  
  // Fill color characteristics (10 bytes)
  for (let i = 25; i < 35; i++) {
    edid[i] = 0x00
  }
  
  // Established timings (3 bytes)
  edid[35] = 0x21
  edid[36] = 0x08
  edid[37] = 0x00
  
  // Standard timings (16 bytes)
  for (let i = 38; i < 54; i++) {
    edid[i] = 0x01  // Unused timing
  }
  
  // Detailed timing descriptors (72 bytes)
  for (let i = 54; i < 126; i++) {
    edid[i] = 0x00
  }
  
  // Extensions
  edid[126] = 0x00
  
  edid[127] = checksum8(edid, 127)
  
  return edid
}

function encodeTestManufacturerId(id: string): [number, number] {
  const normalized = (id || 'ABC').toUpperCase().padEnd(3, ' ').slice(0, 3)
  const value =
    (((normalized.charCodeAt(0) - 64) & 0x1f) << 10) |
    (((normalized.charCodeAt(1) - 64) & 0x1f) << 5) |
    ((normalized.charCodeAt(2) - 64) & 0x1f)

  return [(value >> 8) & 0xff, value & 0xff]
}

describe('EDID', () => {
  it('should decode EDID header correctly', () => {
    const testEDID = createTestEDID()
    const decoded = new EDID(testEDID)
    
    expect(decoded.header.manufacturerId).toBe('ABC')
    expect(decoded.header.productCode).toBe(0x1234)
    expect(decoded.header.serialNumber).toBe(0x12345678)
    expect(decoded.header.weekOfManufacture).toBe(15)
    expect(decoded.header.yearOfManufacture).toBe(2020)
    expect(decoded.header.edidVersion).toBe(1)
    expect(decoded.header.edidRevision).toBe(4)
    expect(decoded.isValid).toBe(true)
  })

  it('should throw error for invalid EDID signature', () => {
    const invalidEDID = new Uint8Array(128)
    invalidEDID.fill(0x00)
    
    expect(() => {
      new EDID(invalidEDID)
    }).toThrow('Invalid EDID signature')
  })

  it('should throw error for too short data', () => {
    const shortData = new Uint8Array(50)
    
    expect(() => {
      new EDID(shortData)
    }).toThrow('Invalid EDID: minimum 128 bytes required')
  })

  it('should work with convenience function', () => {
    const testEDID = createTestEDID()
    const decoded = new EDID(testEDID)
    
    expect(decoded.header.manufacturerId).toBe('ABC')
    expect(decoded.header.productCode).toBe(0x1234)
    expect(decoded.header.serialNumber).toBe(0x12345678)
    expect(decoded.header.weekOfManufacture).toBe(15)
    expect(decoded.header.yearOfManufacture).toBe(2020)
    expect(decoded.header.edidVersion).toBe(1)
    expect(decoded.header.edidRevision).toBe(4)
  })

  it('should expose manufacturer name from the registry', () => {
    const testEDID = createTestEDID('ACR')
    const decoded = new EDID(testEDID)

    expect(decoded.header.manufacturerId).toBe('ACR')
    expect(decoded.header.manufacturerName).toBe('Acer Technologies')
  })
})

describe('EDID as mutable object', () => {
  it('should create editable EDID object', () => {
    const testEDID = createTestEDID()
    const edid = new EDID(testEDID)
    
    expect(edid.header.manufacturerId).toBe('ABC')
    expect(edid.isValid).toBe(true)
  })

  it('should allow modifications and re-encoding', () => {
    const testEDID = createTestEDID()
    const edid = new EDID(testEDID)
    
    // Modify some values
    edid.header.manufacturerId = 'DEL'
    edid.header.productCode = 0x1234
    edid.displayCharacteristics.maxHorizontalSize = 60
    edid.displayCharacteristics.maxVerticalSize = 34
    
    // Re-encode
    const reencoded = edid.encode()
    
    // Decode the re-encoded data to verify
    const verified = new EDID(reencoded)
    expect(verified.header.manufacturerId).toBe('DEL')
    expect(verified.header.productCode).toBe(0x1234)
    expect(verified.displayCharacteristics.maxHorizontalSize).toBe(60)
    expect(verified.displayCharacteristics.maxVerticalSize).toBe(34)
    expect(verified.isValid).toBe(true)
  })

  it('should create new EDID from scratch', () => {
    const edid = new EDID()
    
    // Set some basic values
    edid.header.manufacturerId = 'TST'
    edid.header.productCode = 0x5678
    edid.displayCharacteristics.maxHorizontalSize = 50
    edid.displayCharacteristics.maxVerticalSize = 28
    edid.displayCharacteristics.features.sRGB = true
    
    // Encode and verify
    const encoded = edid.encode()
    expect(encoded.length).toBe(128)
    
    const verified = new EDID(encoded)
    expect(verified.header.manufacturerId).toBe('TST')
    expect(verified.header.productCode).toBe(0x5678)
    expect(verified.displayCharacteristics.features.sRGB).toBe(true)
    expect(verified.isValid).toBe(true)
  })

  it('should update checksum correctly', () => {
    const edid = new EDID()
    edid.header.manufacturerId = 'CHK'
    
    const encoded = edid.encode()
    
    expect(isChecksum8Valid(encoded.slice(0, 128))).toBe(true)
  })

  it('should encode year of manufacture correctly after modification', () => {
    const testEDID = createTestEDID()
    const edid = new EDID(testEDID)
    
    // Verify initial year (2020 = 1990 + 30)
    expect(edid.header.yearOfManufacture).toBe(2020)
    expect(testEDID[17]).toBe(30) // Byte 17 = year offset from 1990
    
    // Change the year to 2025
    edid.header.yearOfManufacture = 2025
    
    // Encode to binary
    const encoded = edid.encode()
    
    // Verify the binary byte is updated correctly (2025 - 1990 = 35)
    expect(encoded[17]).toBe(35)
    
    // Decode again to verify round-trip
    const decoded = new EDID(encoded)
    expect(decoded.header.yearOfManufacture).toBe(2025)
    expect(decoded.isValid).toBe(true)
  })

  it('should encode week of manufacture correctly after modification', () => {
    const testEDID = createTestEDID()
    const edid = new EDID(testEDID)
    
    // Verify initial week
    expect(edid.header.weekOfManufacture).toBe(15)
    expect(testEDID[16]).toBe(15)
    
    // Change the week to 42
    edid.header.weekOfManufacture = 42
    
    // Encode to binary
    const encoded = edid.encode()
    
    // Verify the binary byte is updated correctly
    expect(encoded[16]).toBe(42)
    
    // Decode again to verify round-trip
    const decoded = new EDID(encoded)
    expect(decoded.header.weekOfManufacture).toBe(42)
    expect(decoded.isValid).toBe(true)
  })

  it('should recalculate checksum when fields are modified', () => {
    const testEDID = createTestEDID()
    const originalChecksum = testEDID[127]
    const edid = new EDID(testEDID)
    
    // Verify original is valid
    expect(edid.isValid).toBe(true)
    
    // Change the year (this changes byte 17)
    edid.header.yearOfManufacture = 2030
    
    // Encode to binary
    const encoded = edid.encode()
    
    // Checksum should be different since we changed a byte
    expect(encoded[127]).not.toBe(originalChecksum)
    
    expect(isChecksum8Valid(encoded.slice(0, 128))).toBe(true)
    
    // Decode and verify validity
    const decoded = new EDID(encoded)
    expect(decoded.isValid).toBe(true)
    expect(decoded.header.yearOfManufacture).toBe(2030)
  })

  it('should maintain valid checksum after multiple modifications', () => {
    const edid = new EDID()
    
    // Make multiple modifications
    edid.header.manufacturerId = 'XYZ'
    edid.header.productCode = 0xABCD
    edid.header.yearOfManufacture = 2024
    edid.header.weekOfManufacture = 25
    edid.gamma = 2.4
    
    // Encode
    const encoded = edid.encode()
    
    expect(isChecksum8Valid(encoded.slice(0, 128))).toBe(true)
    
    // Verify the checksum byte itself
    expect(encoded[127]).toBeGreaterThanOrEqual(0)
    expect(encoded[127]).toBeLessThanOrEqual(255)
    
    // Round-trip decode
    const decoded = new EDID(encoded)
    expect(decoded.isValid).toBe(true)
    expect(decoded.header.manufacturerId).toBe('XYZ')
    expect(decoded.header.productCode).toBe(0xABCD)
    expect(decoded.header.yearOfManufacture).toBe(2024)
  })
})

describe('Dummy descriptor encoding', () => {
  it('should fill all 4 descriptor slots with dummies when only one DTD exists', () => {
    const edid = new EDID()
    // Default EDID has 1 detailed timing and no display descriptors
    const encoded = edid.encode()

    // Slot 0: detailed timing (pixel clock > 0)
    const slot0PixelClock = encoded[54] | (encoded[55] << 8)
    expect(slot0PixelClock).toBeGreaterThan(0)

    // Slots 1-3: dummy descriptors (00 00 00 10 00 ...)
    for (let slot = 1; slot < 4; slot++) {
      const offset = 54 + slot * 18
      expect(encoded[offset]).toBe(0x00)
      expect(encoded[offset + 1]).toBe(0x00)
      expect(encoded[offset + 2]).toBe(0x00)
      expect(encoded[offset + 3]).toBe(0x10)
    }
  })

  it('should fill remaining slots with dummies when DTD and descriptors do not fill all 4', () => {
    const edid = new EDID()
    edid.displayDescriptors = [{ tag: 0xFC, productName: 'Test' }]
    const encoded = edid.encode()

    // Slot 0: detailed timing
    const slot0PixelClock = encoded[54] | (encoded[55] << 8)
    expect(slot0PixelClock).toBeGreaterThan(0)

    // Slot 1: product name descriptor (tag 0xFC)
    const slot1Offset = 54 + 18
    expect(encoded[slot1Offset + 3]).toBe(0xFC)

    // Slots 2-3: dummy descriptors
    for (let slot = 2; slot < 4; slot++) {
      const offset = 54 + slot * 18
      expect(encoded[offset]).toBe(0x00)
      expect(encoded[offset + 1]).toBe(0x00)
      expect(encoded[offset + 2]).toBe(0x00)
      expect(encoded[offset + 3]).toBe(0x10)
    }
  })

  it('should not encode explicit dummy descriptors from the array', () => {
    const edid = new EDID()
    // Add a real descriptor plus explicit dummies — dummies should be ignored
    edid.displayDescriptors = [
      { tag: 0xFC, productName: 'Hello' },
      { tag: 0x10 },
      { tag: 0x10 },
    ]
    const encoded = edid.encode()

    // Slot 0: DTD
    // Slot 1: product name
    expect(encoded[54 + 18 + 3]).toBe(0xFC)

    // Slots 2-3: auto-filled dummies (not the explicit ones from the array)
    for (let slot = 2; slot < 4; slot++) {
      const offset = 54 + slot * 18
      expect(encoded[offset + 3]).toBe(0x10)
    }
  })

  it('should not add dummies when all 4 slots are used', () => {
    const edid = new EDID()
    edid.displayDescriptors = [
      { tag: 0xFC, productName: 'Test' },
      { tag: 0xFF, serialNumber: '12345' },
      { tag: 0xFE, data: 'Info' },
    ]
    // 1 DTD + 3 descriptors = 4 slots full
    const encoded = edid.encode()

    expect(encoded[54 + 18 + 3]).toBe(0xFC)
    expect(encoded[54 + 36 + 3]).toBe(0xFF)
    expect(encoded[54 + 54 + 3]).toBe(0xFE)
  })

  it('should round-trip correctly with dummy descriptors', () => {
    const edid = new EDID()
    edid.displayDescriptors = [{ tag: 0xFC, productName: 'RoundTrip' }]
    const encoded = edid.encode()
    const decoded = new EDID(encoded)

    expect(decoded.productName).toBe('RoundTrip')
    expect(decoded.detailedTimings.length).toBe(1)
    expect(decoded.isValid).toBe(true)
  })
})

describe('Color point descriptors', () => {
  it('should encode and decode supplemental white points', () => {
    const edid = new EDID()
    edid.displayDescriptors = [
      {
        tag: 0xFB,
        colorPoints: [
          { index: 1, whiteX: 0.3127, whiteY: 0.329, gamma: 2.2 },
          { index: 2, whiteX: 0.345, whiteY: 0.358, gamma: 0 },
        ],
      },
    ]

    const encoded = edid.encode()
    const decoded = new EDID(encoded)

    const descriptor = decoded.displayDescriptors.find((d) => d.tag === 0xFB) as ColorPointDescriptor | undefined
    expect(descriptor).toBeDefined()
    expect(descriptor?.colorPoints.length).toBe(2)
    expect(descriptor?.colorPoints[0].index).toBe(1)
    expect(descriptor?.colorPoints[0].whiteX).toBeCloseTo(0.3127, 3)
    expect(descriptor?.colorPoints[0].whiteY).toBeCloseTo(0.329, 3)
    expect(descriptor?.colorPoints[0].gamma).toBeCloseTo(2.2, 2)
    expect(descriptor?.colorPoints[1].index).toBe(2)
    expect(descriptor?.colorPoints[1].whiteX).toBeCloseTo(0.345, 3)
    expect(descriptor?.colorPoints[1].whiteY).toBeCloseTo(0.358, 3)
    expect(descriptor?.colorPoints[1].gamma).toBe(0)
  })
})

describe('Standard timing descriptors', () => {
  it('should encode and decode standard timing identifier entries', () => {
    const edid = new EDID()
    edid.displayDescriptors = [
      {
        tag: 0xFA,
        timings: [
          { width: 1920, height: 1200, refreshRate: 60 },
          { width: 1280, height: 1024, refreshRate: 75 },
        ],
      },
    ]

    const encoded = edid.encode()
    const decoded = new EDID(encoded)

    const descriptor = decoded.displayDescriptors.find((d) => d.tag === 0xFA) as StandardTimingIdDescriptor | undefined
    expect(descriptor).toBeDefined()
    expect(descriptor?.timings.length).toBe(2)
    expect(descriptor?.timings[0].width).toBe(1920)
    expect(descriptor?.timings[0].height).toBe(1200)
    expect(descriptor?.timings[0].refreshRate).toBe(60)
    expect(descriptor?.timings[1].width).toBe(1280)
    expect(descriptor?.timings[1].height).toBe(1024)
    expect(descriptor?.timings[1].refreshRate).toBe(75)
  })
})

describe('Real-world usage examples', () => {
  it('should handle ArrayBuffer input', () => {
    const testEDID = createTestEDID()
    const arrayBuffer = new ArrayBuffer(testEDID.length)
    new Uint8Array(arrayBuffer).set(testEDID)
    
    const decoded = new EDID(arrayBuffer)
    expect(decoded.header.manufacturerId).toBe('ABC')
  })

  it('should provide detailed timing information', () => {
    const testEDID = createTestEDID()
    const decoded = new EDID(testEDID)
    
    expect(decoded.detailedTimings).toBeInstanceOf(Array)
    expect(decoded.standardTimings).toBeInstanceOf(Array)
    expect(decoded.establishedTimings).toBeInstanceOf(Array)
  })
})
