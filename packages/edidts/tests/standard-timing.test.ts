import { describe, it, expect } from 'vitest'
import { EDID, StandardTiming } from '../src/edid'
import { EDIDHeader } from '../src/edid'

function blankEdidWithHeader(version: number, revision: number): EDID {
  return new EDID({
    header: new EDIDHeader({ edidVersion: version, edidRevision: revision }),
    standardTimings: [],
  })
}

describe('StandardTiming decode/encode (Section 3.9)', () => {
  it('decodes 8 null slots (0x01 0x01) to no timings', () => {
    const bytes = EDID.encode(blankEdidWithHeader(1, 4))
    const decoded = EDID.decode(bytes)
    expect(decoded.standardTimings).toEqual([])
  })

  it('round-trips a single 1920x1080@60Hz timing (16:9)', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1920, height: 1080, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings.length).toBe(1)
    expect(decoded.standardTimings[0].width).toBe(1920)
    expect(decoded.standardTimings[0].height).toBe(1080)
    expect(decoded.standardTimings[0].refreshRate).toBe(60)
  })

  it('round-trips all 4 valid + 4 null slots', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [
      new StandardTiming({ width: 1920, height: 1080, refreshRate: 60 }),
      new StandardTiming({ width: 1680, height: 1050, refreshRate: 60 }),
      new StandardTiming({ width: 1280, height: 1024, refreshRate: 60 }),
      new StandardTiming({ width: 1440, height: 900, refreshRate: 60 }),
    ]
    const encoded = EDID.encode(edid)
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings.length).toBe(4)
    expect(decoded.standardTimings[0].width).toBe(1920)
    expect(decoded.standardTimings[3].width).toBe(1440)
  })

  it('encodes empty trailing slots as 0x01 0x01 (null sentinel)', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1280, height: 720, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    // Slot 1 (bytes 40..41) should be 0x01 0x01
    expect(encoded[40]).toBe(0x01)
    expect(encoded[41]).toBe(0x01)
  })

  it('round-trips a 4:3 timing (1280x960@60Hz)', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1280, height: 960, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings[0].height).toBe(960)
  })

  it('round-trips a 5:4 timing (1280x1024@60Hz)', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1280, height: 1024, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings[0].height).toBe(1024)
  })

  it('encodes byte 38..39 with width 1920 → 0xD1 0x41 (16:9 @ 60Hz)', () => {
    // 1920/8 - 31 = 209 = 0xD1
    // aspect code 3 (16:9) << 6 = 0xC0; refresh 60 → 0x00 in low 6 bits
    // → byte2 = 0xC0 | 0 = 0xC0
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1920, height: 1080, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    expect(encoded[38]).toBe(0xd1)
    expect(encoded[39]).toBe(0xc0)
  })

  it('round-trips 8 distinct timings (8-pixel aligned widths only)', () => {
    // Standard-timing byte 0 = (width/8) - 31, so only multiples of 8 round-trip
    // exactly. 1366 is 2 pixels off; 1360 is 16x85 = 8-aligned and decodes back
    // to 1360.
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [
      new StandardTiming({ width: 1920, height: 1080, refreshRate: 60 }),
      new StandardTiming({ width: 1680, height: 1050, refreshRate: 60 }),
      new StandardTiming({ width: 1600, height: 1200, refreshRate: 60 }),
      new StandardTiming({ width: 1440, height: 900, refreshRate: 60 }),
      new StandardTiming({ width: 1400, height: 1050, refreshRate: 60 }),
      new StandardTiming({ width: 1360, height: 768, refreshRate: 60 }),
      new StandardTiming({ width: 1280, height: 1024, refreshRate: 60 }),
      new StandardTiming({ width: 1280, height: 960, refreshRate: 60 }),
    ]
    const encoded = EDID.encode(edid)
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings.length).toBe(8)
    expect(decoded.standardTimings.map((t) => t.width)).toEqual([
      1920, 1680, 1600, 1440, 1400, 1360, 1280, 1280,
    ])
  })
})

describe('StandardTiming placeholder detection and quantization edges', () => {
  it('isValid is false for a placeholder (width 0) and true for a real timing', () => {
    expect(new StandardTiming({}).isValid).toBe(false)
    expect(new StandardTiming({ width: 0, height: 1080, refreshRate: 60 }).isValid).toBe(false)
    expect(new StandardTiming({ width: 1920, height: 1080, refreshRate: 60 }).isValid).toBe(true)
  })

  it('encodes a placeholder in the middle as 0x01 0x01 and preserves later valid timings', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [
      new StandardTiming({ width: 1920, height: 1080, refreshRate: 60 }),
      new StandardTiming({}), // placeholder: width 0 -> isValid false
      new StandardTiming({ width: 1280, height: 1024, refreshRate: 60 }),
    ]
    const encoded = EDID.encode(edid)
    // Slot 0 (bytes 38..39) = 1920x1080 16:9 @ 60 -> 0xD1 0xC0
    expect(encoded[38]).toBe(0xd1)
    expect(encoded[39]).toBe(0xc0)
    // Slot 1 (bytes 40..41) = placeholder -> 0x01 0x01
    expect(encoded[40]).toBe(0x01)
    expect(encoded[41]).toBe(0x01)
    // Slot 2 (bytes 42..43) = 1280x1024 5:4 @ 60 -> 0x81 0x80
    expect(encoded[42]).toBe(0x81)
    expect(encoded[43]).toBe(0x80)
    // Decode skips the placeholder slot -> 2 timings
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings.length).toBe(2)
    expect(decoded.standardTimings.map((t) => t.width)).toEqual([1920, 1280])
    expect(decoded.standardTimings.map((t) => t.height)).toEqual([1080, 1024])
  })

  it('quantizes a non-8-aligned width to the nearest multiple of 8 (1366 -> 1368)', () => {
    // Standard-timing width is (byte + 31) * 8, so widths quantize to 8-pixel
    // granularity. 1366 is not 8-aligned; 1366/8 = 170.75 rounds to 171, which
    // decodes back to 171 * 8 = 1368, not 1366.
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1366, height: 768, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    expect(encoded[38]).toBe(0x8c) // (171 - 31) = 140 = 0x8C
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings[0].width).toBe(1368)
    expect(decoded.standardTimings[0].width % 8).toBe(0)
  })

  it('round-trips the minimum refresh rate (60 Hz -> low 6 bits 0x00)', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1920, height: 1080, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    expect(encoded[39] & 0x3f).toBe(0x00)
    expect(EDID.decode(encoded).standardTimings[0].refreshRate).toBe(60)
  })

  it('round-trips the maximum refresh rate (123 Hz -> low 6 bits 0x3F)', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 1920, height: 1080, refreshRate: 123 })]
    const encoded = EDID.encode(edid)
    // 16:9 aspect (code 3) << 6 = 0xC0; refresh 123 -> (123-60)&0x3f = 0x3F
    expect(encoded[39]).toBe(0xff)
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings[0].refreshRate).toBe(123)
  })

  it('always emits exactly 16 bytes for the 8-slot standard-timing region', () => {
    const timings = Array.from({ length: 8 }, (_, i) =>
      new StandardTiming({ width: 1280 + i * 8, height: 1024, refreshRate: 60 }))
    expect(StandardTiming.encode(timings).length).toBe(16)
    expect(StandardTiming.encode([]).length).toBe(16)
  })
})

describe('StandardTiming aspect code 0: EDID 1.3 (1:1) vs 1.4 (16:10)', () => {
  it('decodes aspect code 0 as 1:1 under EDID 1.3 and 16:10 under EDID 1.4', () => {
    // Slot 0 at offset 38: width 640, aspect code 0, 60 Hz.
    // 640/8 - 31 = 49 = 0x31; code 0 << 6 = 0x00; refresh 60 -> 0x00.
    const buf = new Uint8Array(54)
    buf[38] = 0x31
    buf[39] = 0x00
    const v13 = StandardTiming.decode(buf, 1, 3)
    const v14 = StandardTiming.decode(buf, 1, 4)
    expect(v13[0].height).toBe(640) // 1:1 -> height = width
    expect(v14[0].height).toBe(400) // 16:10 -> 640 * 10/16 = 400
  })

  it('encodes a square timing as aspect code 0 under EDID 1.3 but not under 1.4', () => {
    const square = [new StandardTiming({ width: 640, height: 640, refreshRate: 60 })]
    const v13 = StandardTiming.encode(square, 1, 3)
    const v14 = StandardTiming.encode(square, 1, 4)
    expect((v13[1] >> 6) & 0x03).toBe(0) // 1:1 -> code 0 in 1.3
    // Under 1.4, 640x640 (ratio 1.0) is closest to 5:4 (code 2), not 16:10 (code 0).
    expect((v14[1] >> 6) & 0x03).not.toBe(0)
  })

  it('round-trips a 1.3 EDID with a code-0 (1:1) standard timing', () => {
    const edid = blankEdidWithHeader(1, 3)
    edid.standardTimings = [new StandardTiming({ width: 640, height: 640, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    expect(encoded[18]).toBe(1) // header declares EDID 1.3
    expect(encoded[19]).toBe(3)
    expect((encoded[39] >> 6) & 0x03).toBe(0) // code 0
    const decoded = EDID.decode(encoded)
    expect(decoded.header.edidRevision).toBe(3)
    expect(decoded.standardTimings[0].width).toBe(640)
    expect(decoded.standardTimings[0].height).toBe(640) // 1:1 preserved
  })

  it('round-trips a 1.4 EDID with a code-0 (16:10) standard timing', () => {
    const edid = blankEdidWithHeader(1, 4)
    edid.standardTimings = [new StandardTiming({ width: 640, height: 400, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    expect((encoded[39] >> 6) & 0x03).toBe(0) // 16:10 -> code 0
    const decoded = EDID.decode(encoded)
    expect(decoded.standardTimings[0].height).toBe(400) // 16:10 preserved
  })

  it('decoding the same 1.3-encoded bytes as 1.4 misreads code 0 as 16:10 (regression guard)', () => {
    const edid = blankEdidWithHeader(1, 3)
    edid.standardTimings = [new StandardTiming({ width: 640, height: 640, refreshRate: 60 })]
    const encoded = EDID.encode(edid)
    // Decode the full block under each version (decode reads offset 38 absolutely).
    const as13 = StandardTiming.decode(encoded, 1, 3)
    const as14 = StandardTiming.decode(encoded, 1, 4)
    expect(as13[0].height).toBe(640) // correct under 1.3
    expect(as14[0].height).toBe(400) // misread as 16:10 under 1.4
  })

  it('the 0xFA Standard Timing ID descriptor also resolves code 0 by EDID version', () => {
    const edid13 = blankEdidWithHeader(1, 3)
    edid13.displayDescriptors = [
      { tag: 0xFA, timings: [{ width: 640, height: 640, refreshRate: 60 }] },
    ] as never
    const encoded13 = EDID.encode(edid13)
    const decoded13 = EDID.decode(encoded13)
    const fa13 = decoded13.displayDescriptors.find((d) => d.tag === 0xFA) as
      | { tag: 0xFA; timings: { width: number; height: number; refreshRate: number }[] }
      | undefined
    expect(fa13?.timings[0].height).toBe(640) // 1:1 under 1.3

    const edid14 = blankEdidWithHeader(1, 4)
    edid14.displayDescriptors = [
      { tag: 0xFA, timings: [{ width: 640, height: 400, refreshRate: 60 }] },
    ] as never
    const decoded14 = EDID.decode(EDID.encode(edid14))
    const fa14 = decoded14.displayDescriptors.find((d) => d.tag === 0xFA) as
      | { tag: 0xFA; timings: { width: number; height: number; refreshRate: number }[] }
      | undefined
    expect(fa14?.timings[0].height).toBe(400) // 16:10 under 1.4
  })
})
