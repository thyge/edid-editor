import { describe, expect, it } from 'vitest'
import {
  DisplayDescriptorParser,
  type CVTTimingDescriptor,
  type DCMDescriptor,
  type DisplayRangeLimitsDescriptor,
  type EstablishedTimingsIIIDescriptor,
} from '../src/edid/display-descriptor'

describe('DisplayDescriptorParser encode symmetry', () => {
  it('encodes and decodes Display Color Management descriptors', () => {
    const descriptor: DCMDescriptor = {
      tag: 0xf9,
      version: 3,
      redA3: 0xabcd,
      redA2: 0x1234,
      greenA3: 0x4567,
      greenA2: 0x789a,
      blueA3: 0xdef0,
      blueA2: 0x2345,
    }

    const encoded = DisplayDescriptorParser.encode(descriptor)
    const decoded = DisplayDescriptorParser.decode(encoded)

    expect(decoded).toEqual(descriptor)
  })

  it('encodes and decodes CVT 3-byte timing code descriptors', () => {
    const descriptor: CVTTimingDescriptor = {
      tag: 0xf8,
      timings: [
        {
          addressableLines: 1200,
          aspectRatio: '16:10',
          preferredRefreshRate: 75,
          refreshRates: {
            r50Hz: true,
            r60Hz: true,
            r75Hz: true,
            r85Hz: false,
            r60HzRB: true,
          },
        },
        {
          addressableLines: 1080,
          aspectRatio: '16:9',
          preferredRefreshRate: 60,
          refreshRates: {
            r50Hz: false,
            r60Hz: true,
            r75Hz: false,
            r85Hz: true,
            r60HzRB: false,
          },
        },
      ],
    }

    const encoded = DisplayDescriptorParser.encode(descriptor)
    const decoded = DisplayDescriptorParser.decode(encoded)

    expect(decoded).toEqual(descriptor)
  })

  it('encodes and decodes Established Timings III descriptors', () => {
    const descriptor: EstablishedTimingsIIIDescriptor = {
      tag: 0xf7,
      timings: [0, 3, 11, 47, 95],
    }

    const encoded = DisplayDescriptorParser.encode(descriptor)
    const decoded = DisplayDescriptorParser.decode(encoded)

    expect(decoded).toEqual(descriptor)
  })

  it('encodes and decodes secondary GTF range limits', () => {
    const descriptor: DisplayRangeLimitsDescriptor = {
      tag: 0xfd,
      minVerticalRate: 48,
      maxVerticalRate: 144,
      minHorizontalRate: 30,
      maxHorizontalRate: 180,
      maxPixelClock: 600,
      timingSupport: 'secondary-gtf',
      secondaryGTF: {
        startFrequency: 40,
        c: 30,
        m: 600,
        k: 128,
        j: 20,
      },
    }

    const encoded = DisplayDescriptorParser.encode(descriptor)
    const decoded = DisplayDescriptorParser.decode(encoded)

    expect(decoded).toEqual(descriptor)
  })

  it('encodes and decodes CVT range limits', () => {
    const descriptor: DisplayRangeLimitsDescriptor = {
      tag: 0xfd,
      minVerticalRate: 48,
      maxVerticalRate: 120,
      minHorizontalRate: 30,
      maxHorizontalRate: 160,
      maxPixelClock: 540,
      timingSupport: 'cvt',
      cvt: {
        version: 13,
        maxActivePixelsPerLine: 3840,
        aspectRatios: {
          ar4_3: true,
          ar16_9: true,
          ar16_10: false,
          ar5_4: true,
          ar15_9: false,
        },
        preferredAspectRatio: '16:9',
        reducedBlankingPreferred: true,
        standardBlankingSupported: true,
        horizontalShrinkSupported: true,
        horizontalStretchSupported: false,
        verticalShrinkSupported: true,
        verticalStretchSupported: false,
        preferredVerticalRefresh: 60,
      },
    }

    const encoded = DisplayDescriptorParser.encode(descriptor)
    const decoded = DisplayDescriptorParser.decode(encoded)

    expect(decoded).toEqual(descriptor)
  })
})
