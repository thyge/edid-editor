import { describe, it, expect } from 'vitest'
import { ColorCharacteristics } from '../src/edid'

describe('ColorCharacteristics', () => {
  it('round-trips sRGB defaults through decode/encode', () => {
    const srgb = ColorCharacteristics.createSRGB()
    const encoded = srgb.encode()
    const decoded = ColorCharacteristics.decode(encoded)
    expect(decoded.redX).toBeCloseTo(srgb.redX, 3)
    expect(decoded.redY).toBeCloseTo(srgb.redY, 3)
    expect(decoded.greenX).toBeCloseTo(srgb.greenX, 3)
    expect(decoded.greenY).toBeCloseTo(srgb.greenY, 3)
    expect(decoded.blueX).toBeCloseTo(srgb.blueX, 3)
    expect(decoded.blueY).toBeCloseTo(srgb.blueY, 3)
    expect(decoded.whiteX).toBeCloseTo(srgb.whiteX, 3)
    expect(decoded.whiteY).toBeCloseTo(srgb.whiteY, 3)
  })

  it('round-trips Rec.2020 primaries (wider gamut)', () => {
    const rec2020 = ColorCharacteristics.createRec2020()
    const encoded = rec2020.encode()
    const decoded = ColorCharacteristics.decode(encoded)
    expect(decoded.redX).toBeCloseTo(0.708, 3)
    expect(decoded.greenY).toBeCloseTo(0.797, 3)
    expect(decoded.blueX).toBeCloseTo(0.131, 3)
  })

  it('round-trips DCI-P3 primaries', () => {
    const dcip3 = ColorCharacteristics.createDCIP3()
    const encoded = dcip3.encode()
    const decoded = ColorCharacteristics.decode(encoded)
    expect(decoded.redX).toBeCloseTo(0.680, 3)
    expect(decoded.greenY).toBeCloseTo(0.690, 3)
  })

  it('preserves 10-bit precision for sRGB red primary within 0.001', () => {
    const srgb = ColorCharacteristics.createSRGB()
    const encoded = srgb.encode()
    const decoded = ColorCharacteristics.decode(encoded)
    expect(Math.abs(decoded.redX - srgb.redX)).toBeLessThan(0.001)
  })

  it('throws if given fewer than 10 bytes', () => {
    expect(() => ColorCharacteristics.decode(new Uint8Array(9))).toThrow(
      'Color characteristics require 10 bytes'
    )
  })

  it('isValid() returns true for sRGB and false for out-of-range coordinates', () => {
    expect(ColorCharacteristics.createSRGB().isValid()).toBe(true)
    const bad = new ColorCharacteristics({ redX: 1.5, redY: -0.1 })
    expect(bad.isValid()).toBe(false)
  })

  it('gamut area for sRGB primaries is small but positive', () => {
    const srgb = ColorCharacteristics.createSRGB()
    expect(srgb.gamutArea).toBeGreaterThan(0)
    expect(srgb.gamutArea).toBeLessThan(0.2)
  })
})
