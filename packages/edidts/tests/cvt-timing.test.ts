import { describe, it, expect } from 'vitest'
import {
  calculateCVTTiming,
  calculateCVTTimingForTarget,
  generateCVTDetailedTiming,
  generateCVTDetailedTimingForTarget,
  CVT_PRESETS,
  type CVTTimingInput
} from '../src/common/cvt-timing-generator'
import { DetailedTimingDescriptor } from '../src/common/detailed-timing-descriptor'
import { EDID } from '../src/edid'

describe('CVT Timing Calculator', () => {
  describe('Standard Blanking', () => {
    it('should calculate 1920x1080@60Hz standard timing', () => {
      const result = calculateCVTTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        blankingMode: 'cvt',
      })

      expect(result.horizontalActive).toBe(1920)
      expect(result.verticalActive).toBe(1080)
      expect(result.pixelClock).toBeGreaterThan(140)
      expect(result.pixelClock).toBeLessThan(180)
      expect(result.actualRefreshRate).toBeCloseTo(60, 0)
      expect(result.hSyncPolarity).toBe('negative')
      expect(result.vSyncPolarity).toBe('positive')
    })

    it('should calculate 1280x720@60Hz standard timing', () => {
      const result = calculateCVTTiming({
        horizontalActive: 1280,
        verticalActive: 720,
        refreshRate: 60,
      })

      expect(result.horizontalActive).toBe(1280)
      expect(result.verticalActive).toBe(720)
      expect(result.actualRefreshRate).toBeCloseTo(60, 0)
      expect(result.horizontalTotal).toBeGreaterThan(result.horizontalActive)
      expect(result.verticalTotal).toBeGreaterThan(result.verticalActive)
    })

    it('should calculate interlaced timing', () => {
      const result = calculateCVTTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        interlaced: true,
      })

      expect(result.interlaced).toBe(true)
      expect(result.actualRefreshRate).toBeCloseTo(60, 0)
    })
  })

  describe('Reduced Blanking v1', () => {
    it('should calculate 1920x1080@60Hz RB timing', () => {
      const result = calculateCVTTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        blankingMode: 'cvt-rb',
      })

      expect(result.horizontalActive).toBe(1920)
      expect(result.horizontalBlanking).toBe(160)
      expect(result.horizontalSyncWidth).toBe(32)
      expect(result.horizontalFrontPorch).toBe(48)
      expect(result.hSyncPolarity).toBe('positive')
      expect(result.vSyncPolarity).toBe('negative')
      expect(result.pixelClock).toBeLessThan(140)
    })

    it('should have lower pixel clock than standard blanking', () => {
      const standard = calculateCVTTiming({
        horizontalActive: 2560,
        verticalActive: 1440,
        refreshRate: 60,
        blankingMode: 'cvt',
      })

      const rb = calculateCVTTiming({
        horizontalActive: 2560,
        verticalActive: 1440,
        refreshRate: 60,
        blankingMode: 'cvt-rb',
      })

      expect(rb.pixelClock).toBeLessThan(standard.pixelClock)
      expect(rb.horizontalBlanking).toBeLessThan(standard.horizontalBlanking)
    })
  })

  describe('Reduced Blanking v2', () => {
    it('should calculate 3840x2160@60Hz RBv2 timing', () => {
      const result = calculateCVTTiming({
        horizontalActive: 3840,
        verticalActive: 2160,
        refreshRate: 60,
        blankingMode: 'cvt-rb2',
      })

      expect(result.horizontalActive).toBe(3840)
      expect(result.horizontalBlanking).toBe(80)
      expect(result.hSyncPolarity).toBe('positive')
      expect(result.vSyncPolarity).toBe('negative')
    })

    it('should have lower pixel clock than RB v1', () => {
      const rbv1 = calculateCVTTiming({
        horizontalActive: 3840,
        verticalActive: 2160,
        refreshRate: 60,
        blankingMode: 'cvt-rb',
      })

      const rbv2 = calculateCVTTiming({
        horizontalActive: 3840,
        verticalActive: 2160,
        refreshRate: 60,
        blankingMode: 'cvt-rb2',
      })

      expect(rbv2.pixelClock).toBeLessThan(rbv1.pixelClock)
      expect(rbv2.horizontalBlanking).toBeLessThan(rbv1.horizontalBlanking)
    })

    it('should support high refresh rates', () => {
      const result = calculateCVTTiming({
        horizontalActive: 2560,
        verticalActive: 1440,
        refreshRate: 144,
        blankingMode: 'cvt-rb2',
      })

      expect(result.actualRefreshRate).toBeCloseTo(144, 0)
      expect(result.pixelClock).toBeGreaterThan(400)
    })
  })

  describe('generateCVTDetailedTiming', () => {
    it('should generate a valid DetailedTimingDescriptor', () => {
      const dtd = generateCVTDetailedTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        horizontalImageSize: 527,
        verticalImageSize: 296,
      })

      expect(dtd.horizontalActive).toBe(1920)
      expect(dtd.verticalActive).toBe(1080)
      expect(dtd.horizontalImageSize).toBe(527)
      expect(dtd.verticalImageSize).toBe(296)
      expect(dtd.pixelClock).toBeGreaterThan(0)
      expect(dtd.refreshRate).toBeCloseTo(60, 0)
    })

    it('should encode and decode correctly', () => {
      const original = generateCVTDetailedTiming({
        horizontalActive: 2560,
        verticalActive: 1440,
        refreshRate: 60,
        blankingMode: 'cvt-rb',
      })

      const encoded = original.encode()
      expect(encoded.length).toBe(18)

      const parsed = DetailedTimingDescriptor.decode(encoded)

      expect(parsed).not.toBeNull()
      expect(parsed!.horizontalActive).toBe(2560)
      expect(parsed!.verticalActive).toBe(1440)
      expect(parsed!.pixelClock).toBeCloseTo(original.pixelClock, 1)
    })

    it('should work with EDID class', () => {
      const edid = EDID.blank()
      const dtd = generateCVTDetailedTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        blankingMode: 'cvt-rb',
      })

      edid.detailedTimings = [dtd]

      const encoded = EDID.encode(edid)
      const decoded = EDID.decode(encoded)

      expect(decoded.detailedTimings.length).toBe(1)
      expect(decoded.detailedTimings[0].horizontalActive).toBe(1920)
      expect(decoded.detailedTimings[0].verticalActive).toBe(1080)

      // Native resolution is just the first detailed timing
      const native = decoded.detailedTimings[0]
      expect(native?.horizontalActive).toBe(1920)
      expect(native?.verticalActive).toBe(1080)
    })
  })

  describe('CVT Presets', () => {
    it('should have valid presets', () => {
      expect(CVT_PRESETS['1080p60']).toBeDefined()
      expect(CVT_PRESETS['1440p60_RB']).toBeDefined()
      expect(CVT_PRESETS['4K60_RBv2']).toBeDefined()
    })

    it('should generate valid timings from presets', () => {
      const result = calculateCVTTiming(CVT_PRESETS['4K60_RBv2'])
      
      expect(result.horizontalActive).toBe(3840)
      expect(result.verticalActive).toBe(2160)
      expect(result.blankingMode).toBe('cvt-rb2')
      expect(result.actualRefreshRate).toBeCloseTo(60, 0)
    })

    it('should generate DTD from all presets', () => {
      for (const [name, preset] of Object.entries(CVT_PRESETS)) {
        const dtd = generateCVTDetailedTiming(preset as CVTTimingInput)
        expect(dtd.pixelClock).toBeGreaterThan(0)
        expect(dtd.horizontalActive).toBe(preset.horizontalActive)
        expect(dtd.verticalActive).toBe(preset.verticalActive)
      }
    })
  })

  describe('Edge cases', () => {
    it('should throw on invalid input', () => {
      expect(() => calculateCVTTiming({
        horizontalActive: 0,
        verticalActive: 1080,
        refreshRate: 60,
      })).toThrow()

      expect(() => calculateCVTTiming({
        horizontalActive: 1920,
        verticalActive: 0,
        refreshRate: 60,
      })).toThrow()

      expect(() => calculateCVTTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 0,
      })).toThrow()
    })

    it('should handle unusual resolutions', () => {
      const result = calculateCVTTiming({
        horizontalActive: 1366,
        verticalActive: 768,
        refreshRate: 60,
      })

      expect(result.horizontalActive).toBe(1366)
      expect(result.verticalActive).toBe(768)
      expect(result.actualRefreshRate).toBeCloseTo(60, 0)
    })

    it('should handle ultrawide resolutions', () => {
      const result = calculateCVTTiming({
        horizontalActive: 3440,
        verticalActive: 1440,
        refreshRate: 60,
        blankingMode: 'cvt-rb',
      })

      expect(result.horizontalActive).toBe(3440)
      expect(result.verticalActive).toBe(1440)
      expect(result.actualRefreshRate).toBeCloseTo(60, 0)
    })
  })

  describe('Target refresh rate variant selection', () => {
    it('selects the blanking variant whose achieved rate lands closest to the target', () => {
      // 1080p60: all three variants fit the 655.35 MHz DTD clock field;
      // RBv2's quantized clock lands closest to 60 Hz.
      const selection = calculateCVTTimingForTarget({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
      }, 655.35)

      expect(selection).not.toBeNull()
      expect(selection!.blankingMode).toBe('cvt-rb2')
      expect(selection!.candidates).toHaveLength(3)
      expect(selection!.result.blankingMode).toBe('cvt-rb2')
      expect(selection!.result.actualRefreshRate).toBeGreaterThanOrEqual(60)
      // Every evaluated variant is itself a valid CVT calculation
      for (const candidate of selection!.candidates) {
        expect(candidate.timing.actualRefreshRate).toBeGreaterThan(0)
      }
    })

    it('can pick standard CVT when it fits and lands closest', () => {
      // 1080p165: standard CVT fits the DTD limit and its quantized clock
      // lands closest to the target — it should win over reduced blanking.
      const selection = calculateCVTTimingForTarget({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 165,
      }, 655.35)

      expect(selection!.blankingMode).toBe('cvt')
      expect(selection!.result.pixelClock).toBeLessThanOrEqual(655.35)
    })

    it('falls back to reduced blanking when standard CVT exceeds the pixel clock limit', () => {
      // 1440p144: standard CVT needs ~810 MHz (unencodable in a 16-bit
      // 10 kHz DTD clock field), so the target is only reachable via
      // reduced blanking — RBv2 fits and lands closest.
      const selection = calculateCVTTimingForTarget({
        horizontalActive: 2560,
        verticalActive: 1440,
        refreshRate: 144,
      }, 655.35)

      expect(selection!.blankingMode).toBe('cvt-rb2')
      expect(selection!.result.pixelClock).toBeLessThanOrEqual(655.35)
      expect(selection!.result.actualRefreshRate).toBeCloseTo(144, 1)
      const std = selection!.candidates.find((c) => c.blankingMode === 'cvt')!
      expect(std.withinPixelClockLimit).toBe(false)
    })

    it('returns null when no variant fits the pixel clock limit', () => {
      // 4K240 needs >2 GHz even with RBv2 — nothing fits the DTD limit.
      const selection = calculateCVTTimingForTarget({
        horizontalActive: 3840,
        verticalActive: 2160,
        refreshRate: 240,
      }, 655.35)

      expect(selection).toBeNull()
    })

    it('generates a descriptor carrying the selected variant and achieved rate', () => {
      const generated = generateCVTDetailedTimingForTarget({
        horizontalActive: 2560,
        verticalActive: 1440,
        refreshRate: 144,
        horizontalImageSize: 600,
        verticalImageSize: 340,
      }, 655.35)

      expect(generated).not.toBeNull()
      expect(generated!.blankingMode).toBe('cvt-rb2')
      expect(generated!.timing.pixelClock).toBeCloseTo(
        calculateCVTTimingForTarget({
          horizontalActive: 2560,
          verticalActive: 1440,
          refreshRate: 144,
        }, 655.35)!.result.pixelClock, 2)
      expect(generated!.timing.horizontalImageSize).toBe(600)
      expect(generated!.timing.verticalImageSize).toBe(340)
      // The descriptor's geometry reproduces the achieved refresh rate
      const dtd = generated!.timing
      expect(dtd.refreshRate).toBeCloseTo(generated!.actualRefreshRate, 4)
      expect(dtd.refreshRate).toBeGreaterThanOrEqual(144)
    })
  })
})
