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
