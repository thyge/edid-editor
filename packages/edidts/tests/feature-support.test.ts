import { describe, it, expect } from 'vitest'
import { FeatureSupportFlags } from '../src/edid'

describe('FeatureSupportFlags bit packing (Section 3.6)', () => {
  it('writes bit 0 when continuousFrequency is true', () => {
    const fs = new FeatureSupportFlags({ continuousFrequency: true })
    const encoded = fs.encode(/* isDigital */ true)
    expect(encoded & 0x01).toBe(1)
  })

  it('writes bit 0 = 0 when continuousFrequency is false', () => {
    const fs = new FeatureSupportFlags({ continuousFrequency: false })
    const encoded = fs.encode(true)
    expect(encoded & 0x01).toBe(0)
  })

  it('writes bit 1 when preferredTimingMode is true', () => {
    const fs = new FeatureSupportFlags({ preferredTimingMode: true })
    const encoded = fs.encode(true)
    expect(encoded & 0x02).toBe(0x02)
  })

  it('writes bit 2 (sRGBDefault) when set', () => {
    const fs = new FeatureSupportFlags({ sRGBDefault: true })
    const encoded = fs.encode(true)
    expect(encoded & 0x04).toBe(0x04)
  })

  it('writes DPMS bits in the high nibble (bits 5-7)', () => {
    const fs = new FeatureSupportFlags({
      standbySupported: true,
      suspendSupported: true,
      activeOffSupported: true,
    })
    const encoded = fs.encode(true)
    expect(encoded & 0xE0).toBe(0xE0)
  })

  it('writes digital color encoding code at bits 3-4', () => {
    const fs = new FeatureSupportFlags({
      digitalColorEncoding: 'rgb444_ycrcb422',
    })
    const encoded = fs.encode(true)
    // rgb444_ycrcb422 is index 2 in DIGITAL_COLOR_ENCODINGS, so bits 3-4 = 0b10
    expect((encoded >> 3) & 0x03).toBe(2)
  })

  it('writes analog display type code at bits 3-4 when not digital', () => {
    const fs = new FeatureSupportFlags({ analogDisplayType: 'rgb' })
    const encoded = fs.encode(/* isDigital */ false)
    // 'rgb' is index 1 in ANALOG_DISPLAY_TYPES, so bits 3-4 = 0b01
    expect((encoded >> 3) & 0x03).toBe(1)
  })

  it('decodes bit 0 as continuousFrequency', () => {
    const decoded = FeatureSupportFlags.decode(0x01, /* isDigital */ true)
    expect(decoded.features.continuousFrequency).toBe(true)
  })

  it('decodes all-zero byte to all features off', () => {
    const decoded = FeatureSupportFlags.decode(0x00, true)
    expect(decoded.features.standbySupported).toBe(false)
    expect(decoded.features.suspendSupported).toBe(false)
    expect(decoded.features.activeOffSupported).toBe(false)
    expect(decoded.features.sRGBDefault).toBe(false)
    expect(decoded.features.preferredTimingMode).toBe(false)
    expect(decoded.features.continuousFrequency).toBe(false)
  })

  it('round-trips all DPMS bits and sRGB', () => {
    const original = new FeatureSupportFlags({
      standbySupported: true,
      suspendSupported: false,
      activeOffSupported: true,
      sRGBDefault: true,
      preferredTimingMode: true,
      continuousFrequency: true,
    })
    const byte = original.encode(true)
    const decoded = FeatureSupportFlags.decode(byte, true)
    expect(decoded.features.standbySupported).toBe(true)
    expect(decoded.features.suspendSupported).toBe(false)
    expect(decoded.features.activeOffSupported).toBe(true)
    expect(decoded.features.sRGBDefault).toBe(true)
    expect(decoded.features.preferredTimingMode).toBe(true)
    expect(decoded.features.continuousFrequency).toBe(true)
  })
})
