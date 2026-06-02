import { describe, expect, it } from 'vitest'
import { VideoInputDefinition } from '../src/edid/video-input'
import { FeatureSupportFlags } from '../src/edid/feature-support'

describe('VideoInputDefinition round-trip', () => {
  it('encodes and decodes every digital bit depth and interface value', () => {
    const depths: Array<6 | 8 | 10 | 12 | 14 | 16 | 'undefined'> = [6, 8, 10, 12, 14, 16, 'undefined']
    const ifaces = ['undefined', 'DVI', 'HDMI-a', 'HDMI-b', 'MDDI', 'DisplayPort'] as const

    for (const bitDepth of depths) {
      for (const videoInterface of ifaces) {
        const original = new VideoInputDefinition({ type: 'digital', bitDepth, videoInterface })
        const byte = original.encode()
        const decoded = VideoInputDefinition.decode(byte)
        expect(decoded.input).toEqual({ type: 'digital', bitDepth, videoInterface })
      }
    }
  })

  it('encodes and decodes every analog signal level', () => {
    const levels = ['0.7/0.3V', '0.714/0.286V', '1.0/0.4V', '0.7/0.0V'] as const
    for (const signalLevel of levels) {
      const original = new VideoInputDefinition({
        type: 'analog',
        signalLevel,
        videoSetup: true,
        separateSyncSupported: false,
        compositeSyncSupported: true,
        syncOnGreenSupported: false,
        vsyncSerrationSupported: true,
      })
      const byte = original.encode()
      const decoded = VideoInputDefinition.decode(byte)
      expect(decoded.input).toEqual(original.input)
    }
  })

  it('keeps the digital flag bit high on every digital encode', () => {
    const vi = new VideoInputDefinition({ type: 'digital', bitDepth: 8, videoInterface: 'DisplayPort' })
    expect(vi.encode() & 0x80).toBe(0x80)
  })

  it('keeps the digital flag bit low on every analog encode', () => {
    const vi = new VideoInputDefinition({
      type: 'analog',
      signalLevel: '0.7/0.3V',
      videoSetup: false,
      separateSyncSupported: false,
      compositeSyncSupported: false,
      syncOnGreenSupported: false,
      vsyncSerrationSupported: false,
    })
    expect(vi.encode() & 0x80).toBe(0)
  })
})

describe('FeatureSupportFlags round-trip', () => {
  it('encodes and decodes every digital color encoding', () => {
    const encodings = ['rgb444', 'rgb444_ycrcb444', 'rgb444_ycrcb422', 'rgb444_ycrcb444_ycrcb422'] as const
    for (const digitalColorEncoding of encodings) {
      const original = new FeatureSupportFlags({
        sRGBDefault: true,
        preferredTimingMode: true,
        continuousFrequency: false,
        digitalColorEncoding,
      })
      const byte = original.encode(true)
      const decoded = FeatureSupportFlags.decode(byte, true)
      expect(decoded.features.digitalColorEncoding).toBe(digitalColorEncoding)
    }
  })

  it('encodes and decodes every analog display type', () => {
    const types = ['monochrome', 'rgb', 'non-rgb', 'undefined'] as const
    for (const analogDisplayType of types) {
      const original = new FeatureSupportFlags({
        sRGBDefault: false,
        preferredTimingMode: true,
        continuousFrequency: true,
        analogDisplayType,
      })
      const byte = original.encode(false)
      const decoded = FeatureSupportFlags.decode(byte, false)
      expect(decoded.features.analogDisplayType).toBe(analogDisplayType)
    }
  })

  it('does not emit color-type bits when the field is absent', () => {
    const original = new FeatureSupportFlags({})
    const byte = original.encode(true)
    // bits 4,3 (mask 0x18) should be zero — undefined is mapped to 0 but the
    // original code only emitted color bits when the field was present, so the
    // post-refactor behavior is the same.
    expect(byte & 0x18).toBe(0)
  })
})
