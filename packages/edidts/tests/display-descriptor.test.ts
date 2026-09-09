import { describe, expect, it } from 'vitest'
import {
  DisplayDescriptorParser,
  type CVTTimingDescriptor,
  type DCMDescriptor,
  type DisplayRangeLimitsDescriptor,
  type EstablishedTimingsIIIDescriptor,
  type OpaqueDisplayDescriptor,
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

  it('DCM (0xF9) mutates a decoded field, re-encodes, re-decodes, and keeps other fields stable', () => {
    // The corpus has zero DCM descriptors in active use, so this synthetic
    // mutation test is the only safety net for the encode path.
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

    const decoded = DisplayDescriptorParser.decode(DisplayDescriptorParser.encode(descriptor))
    expect(decoded.redA3).toBe(0xabcd)
    expect(decoded.greenA3).toBe(0x4567)

    // Edit redA3; leave greenA3 untouched.
    decoded.redA3 = 0xffff
    const redecoded = DisplayDescriptorParser.decode(DisplayDescriptorParser.encode(decoded))

    expect(redecoded.redA3).toBe(0xffff)
    expect(redecoded.greenA3).toBe(0x4567)
    expect(redecoded.version).toBe(3)
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

  it('CVT (0xF8) mutates a decoded field, re-encodes, re-decodes, and keeps other fields stable', () => {
    // The corpus has zero CVT 3-byte timing descriptors, so this synthetic
    // mutation test is the only safety net for the encode path.
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

    const decoded = DisplayDescriptorParser.decode(DisplayDescriptorParser.encode(descriptor))
    expect(decoded.timings[0].addressableLines).toBe(1200)
    expect(decoded.timings[0].preferredRefreshRate).toBe(75)

    // Edit addressableLines of timing 0; leave preferredRefreshRate and timing 1 untouched.
    decoded.timings[0].addressableLines = 1440
    const redecoded = DisplayDescriptorParser.decode(DisplayDescriptorParser.encode(decoded))

    expect(redecoded.timings[0].addressableLines).toBe(1440)
    expect(redecoded.timings[0].preferredRefreshRate).toBe(75)
    expect(redecoded.timings[1].addressableLines).toBe(1080)
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

describe('DisplayDescriptorParser unknown-tag opaque preservation', () => {
  it('decodes a reserved-tag (0xF6) descriptor to an opaque descriptor, not null', () => {
    const raw = new Uint8Array(18)
    raw[0] = 0x00
    raw[1] = 0x00
    raw[2] = 0x00
    raw[3] = 0xF6 // reserved/unknown tag
    raw[4] = 0x00
    for (let i = 5; i < 18; i++) raw[i] = 0xA0 + i // arbitrary payload

    const decoded = DisplayDescriptorParser.decode(raw)
    expect(decoded).not.toBeNull()
    expect(decoded?.tag).toBe(0xF6)
    expect((decoded as OpaqueDisplayDescriptor).data).toEqual(raw.slice(5, 18))
  })

  it('round-trips an unknown-tag descriptor byte-for-byte through encode', () => {
    const raw = new Uint8Array(18)
    raw[0] = 0x00
    raw[1] = 0x00
    raw[2] = 0x00
    raw[3] = 0x11 // unknown tag in the 0x11-0xEF range
    raw[4] = 0x00
    for (let i = 5; i < 18; i++) raw[i] = (i * 7) & 0xFF

    const decoded = DisplayDescriptorParser.decode(raw) as OpaqueDisplayDescriptor
    expect(decoded.tag).toBe(0x11)

    const reencoded = DisplayDescriptorParser.encode(decoded)
    // Header bytes 0-4 are reconstructed; payload bytes 5-17 must match exactly.
    expect(reencoded.slice(5, 18)).toEqual(raw.slice(5, 18))
    expect(reencoded[3]).toBe(0x11)

    // Re-decode yields the same opaque descriptor.
    const redecoded = DisplayDescriptorParser.decode(reencoded) as OpaqueDisplayDescriptor
    expect(redecoded).toEqual(decoded)
  })

  it('still decodes structured descriptors correctly alongside opaque ones', () => {
    const productName = DisplayDescriptorParser.encode({
      tag: 0xFC,
      productName: 'Test',
    })
    expect(DisplayDescriptorParser.decode(productName)?.tag).toBe(0xFC)
  })
})

describe('CVT 3-byte aspect code 3 = 5:4 (not 15:9)', () => {
  it('round-trips a CVT 3-byte timing with the 5:4 aspect', () => {
    const descriptor: CVTTimingDescriptor = {
      tag: 0xf8,
      timings: [
        {
          addressableLines: 1024,
          aspectRatio: '5:4',
          preferredRefreshRate: 60,
          refreshRates: { r50Hz: false, r60Hz: true, r75Hz: false, r85Hz: false, r60HzRB: false },
        },
      ],
    }
    const encoded = DisplayDescriptorParser.encode(descriptor)
    const decoded = DisplayDescriptorParser.decode(encoded)
    expect(decoded).toEqual(descriptor)
    // The aspect code field (bits 4:3 of the second byte of each 3-byte entry)
    // must be 3 for 5:4, distinct from any 15:9 mapping.
    const entryByte1 = encoded[7] // bytes[5]=0x01 header, entry0 = bytes[6..8]
    expect((entryByte1 >> 2) & 0x03).toBe(3)
  })

  it('decodes raw aspect code 3 as 5:4 (regression: was 15:9)', () => {
    // Build raw bytes: header byte[5]=0x01, entry0 lines=1024 → lineCode=511=0x1FF,
    // byte[6]=0xFF, byte[7]=((0x1)<<4)|(3<<2)=0x1C, byte[8]=0 (refresh).
    const raw = new Uint8Array(18)
    raw[3] = 0xf8
    raw[5] = 0x01
    raw[6] = 0xFF
    raw[7] = (1 << 4) | (3 << 2)
    raw[8] = 0
    const decoded = DisplayDescriptorParser.decode(raw) as CVTTimingDescriptor
    expect(decoded.timings[0].aspectRatio).toBe('5:4')
  })
})
