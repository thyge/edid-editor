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

// Each CIE coordinate is a 10-bit binary fraction (value / 1024) packed across
// the 10-byte block: byte[0] holds the low 2 bits of redX/redY/greenX/greenY,
// byte[1] holds the low 2 bits of blueX/blueY/whiteX/whiteY, and bytes[2..9]
// hold the high 8 bits of each in order. These tests pin the binary-fraction
// packing and its edge cases.
describe('ColorCharacteristics binary-fraction edge cases', () => {
  it('encodes all-zero coordinates as 10 zero bytes and round-trips', () => {
    const cc = new ColorCharacteristics({
      redX: 0, redY: 0, greenX: 0, greenY: 0, blueX: 0, blueY: 0, whiteX: 0, whiteY: 0,
    })
    const encoded = cc.encode()
    expect(Array.from(encoded)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const decoded = ColorCharacteristics.decode(encoded)
    expect([decoded.redX, decoded.redY, decoded.greenX, decoded.greenY,
            decoded.blueX, decoded.blueY, decoded.whiteX, decoded.whiteY])
      .toEqual([0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('encodes the max 10-bit value (1023/1024) with all bits set and round-trips', () => {
    const max = 1023 / 1024
    const cc = new ColorCharacteristics({
      redX: max, redY: max, greenX: max, greenY: max, blueX: max, blueY: max, whiteX: max, whiteY: max,
    })
    const encoded = cc.encode()
    // All 10 bits set in every coordinate -> every byte is 0xFF.
    expect(Array.from(encoded)).toEqual([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
    const decoded = ColorCharacteristics.decode(encoded)
    expect(decoded.redX).toBeCloseTo(max, 10)
    expect(decoded.whiteY).toBeCloseTo(max, 10)
    expect(decoded.redX).toBeLessThan(1)
  })

  it('packs the sRGB low-2-bit header bytes and high-8-bit payload bytes exactly', () => {
    // sRGB: redX=0.640->655(0x28F), redY=0.330->338(0x152), greenX=0.300->307(0x133),
    // greenY=0.600->614(0x266), blueX=0.150->154(0x9A), blueY=0.060->61(0x3D),
    // whiteX=0.3127->320(0x140), whiteY=0.3290->337(0x151).
    // byte[0] = (3<<6)|(2<<4)|(3<<2)|2 = 0xEE; byte[1] = (2<<6)|(1<<4)|(0<<2)|1 = 0x91.
    const encoded = ColorCharacteristics.createSRGB().encode()
    expect(encoded[0]).toBe(0xee)
    expect(encoded[1]).toBe(0x91)
    expect(Array.from(encoded.slice(2))).toEqual([0xa3, 0x54, 0x4c, 0x99, 0x26, 0x0f, 0x50, 0x54])
  })

  it('round-trips arbitrary coordinates within 10-bit quantization (<= 1/1024)', () => {
    const cc = new ColorCharacteristics({
      redX: 0.640, redY: 0.330, greenX: 0.300, greenY: 0.600,
      blueX: 0.150, blueY: 0.060, whiteX: 0.3127, whiteY: 0.3290,
    })
    const decoded = ColorCharacteristics.decode(cc.encode())
    const tolerance = 1 / 1024
    for (const [a, b] of [
      [decoded.redX, cc.redX], [decoded.redY, cc.redY],
      [decoded.greenX, cc.greenX], [decoded.greenY, cc.greenY],
      [decoded.blueX, cc.blueX], [decoded.blueY, cc.blueY],
      [decoded.whiteX, cc.whiteX], [decoded.whiteY, cc.whiteY],
    ]) {
      expect(Math.abs(a - b)).toBeLessThan(tolerance)
    }
  })

  it('decodes a hand-packed byte block to the expected coordinates', () => {
    // redX = (0xA3 << 2) | (0xEE >> 6) = 0x28C | 0x03 = 0x28F = 655 -> 655/1024.
    const bytes = new Uint8Array([0xee, 0x91, 0xa3, 0x54, 0x4c, 0x99, 0x26, 0x0f, 0x50, 0x54])
    const decoded = ColorCharacteristics.decode(bytes)
    expect(decoded.redX).toBeCloseTo(655 / 1024, 10)
    expect(decoded.greenY).toBeCloseTo(614 / 1024, 10)
    expect(decoded.whiteY).toBeCloseTo(337 / 1024, 10)
  })
})

describe('ColorCharacteristics descriptions', () => {
  it('identifies the D65 white point for sRGB', () => {
    expect(ColorCharacteristics.createSRGB().whitePointDescription).toBe('D65 (6504K)')
  })

  it('identifies the D50 white point', () => {
    const cc = new ColorCharacteristics({ whiteX: 0.3457, whiteY: 0.3585 })
    expect(cc.whitePointDescription).toBe('D50 (5003K)')
  })

  it('identifies the Equal Energy white point', () => {
    const cc = new ColorCharacteristics({ whiteX: 0.3333, whiteY: 0.3333 })
    expect(cc.whitePointDescription).toBe('Equal Energy (E)')
  })

  it('falls back to a custom white-point description', () => {
    const cc = new ColorCharacteristics({ whiteX: 0.4, whiteY: 0.4 })
    expect(cc.whitePointDescription).toBe('Custom (0.400, 0.400)')
  })

  it('coversApproximateSRGB is true for sRGB and false for Rec.2020', () => {
    expect(ColorCharacteristics.createSRGB().coversApproximateSRGB).toBe(true)
    expect(ColorCharacteristics.createRec2020().coversApproximateSRGB).toBe(false)
  })
})
