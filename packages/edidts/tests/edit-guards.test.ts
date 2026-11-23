import { describe, expect, it } from 'vitest'
import {
  DetailedTimingDescriptor,
  DisplayDescriptorParser,
  EDID,
  StandardTiming,
  type CVTTimingDescriptor,
  type DisplayRangeLimitsDescriptor,
} from '../src/edid'
import { EEDID, getCEAExtension } from '../src/eedid'
import { checksum8 } from '../src/common'
import { computeRefreshRate } from '../src/common/detailed-timing-descriptor'
import { classifyDetailedTiming, generateCVTDetailedTiming } from '../src/common/cvt-timing-generator'
import { analyzeDetailedTimingAgainstCTA, generateDetailedTimingFromVIC } from '../src/cta/vic-table'
import type { VideoDataBlock } from '../src/cta/extension-block'

const fromHex = (hex: string) =>
  new Uint8Array(hex.replace(/[^0-9a-f]/gi, '').match(/../g)!.map((b) => parseInt(b, 16)))

/** Base block declaring one extension + a CTA block with a VDB and DTDs. */
function edidWithCta(vicCount: number, dtdCount: number): Uint8Array {
  const base = EDID.encode(new EDID(), { extensionCount: 1 })
  const cta = new Uint8Array(128)
  cta[0] = 0x02
  cta[1] = 0x03
  let offset = 4
  cta[offset++] = (0x02 << 5) | vicCount
  for (let i = 0; i < vicCount; i++) cta[offset++] = 1 + (i % 64)
  cta[2] = offset
  const dtd = fromHex('02 3a 80 18 71 38 2d 40 58 2c 45 00 40 84 63 00 00 1e')
  for (let i = 0; i < dtdCount; i++) {
    cta.set(dtd, offset)
    offset += 18
  }
  cta[127] = checksum8(cta, 127)
  const out = new Uint8Array(256)
  out.set(base)
  out.set(cta, 128)
  return out
}

describe('CTA-861 blocks that no longer fit are refused, not corrupted', () => {
  it('refuses a Video Data Block longer than 31 bytes instead of wrapping its length', () => {
    const eedid = EEDID.decode(edidWithCta(31, 0))
    const vdb = getCEAExtension(eedid)!.dataBlocks[0] as VideoDataBlock
    vdb.vics = [...vdb.vics, { vic: 16, native: false, known: true }]
    expect(() => EEDID.encode(eedid)).toThrow(/at most 31/)
  })

  it('refuses to drop a detailed timing when a data block grows into a full extension', () => {
    // 1 + 14 VICs + 6 DTDs × 18 = 123 bytes: the payload area is exactly full.
    const eedid = EEDID.decode(edidWithCta(14, 6))
    const vdb = getCEAExtension(eedid)!.dataBlocks[0] as VideoDataBlock
    vdb.vics = [...vdb.vics, { vic: 16, native: false, known: true }]
    expect(() => EEDID.encode(eedid)).toThrow(/extension is full/)
  })
})

describe('standard timings clamp to what the 2-byte code can hold', () => {
  it('clamps refresh to 60-123 Hz and width to 2288 instead of wrapping', () => {
    const timings = StandardTiming.decode(
      EDID.encode(
        new EDID({
          standardTimings: [
            new StandardTiming({ width: 1920, height: 1080, refreshRate: 144 }),
            new StandardTiming({ width: 1920, height: 1080, refreshRate: 50 }),
            new StandardTiming({ width: 3840, height: 2160, refreshRate: 60 }),
          ],
        }),
      ),
    )
    expect(timings.map((t) => t.refreshRate)).toEqual([123, 60, 60])
    expect(timings[2].width).toBe(2288)
  })
})

describe('interlaced detailed timings are stored per field', () => {
  // VIC 5 (1920x1080i60) exactly as real TVs carry it in a DTD: 540 active and
  // 22 blanking lines per field.
  const REAL_1080I = fromHex('01 1d 80 18 71 1c 16 20 58 2c 25 00 c4 8e 21 00 00 9e')

  it('reads a real 1080i DTD as 1920×1080i at 60 Hz and matches VIC 5', () => {
    const dtd = DetailedTimingDescriptor.decode(REAL_1080I)!
    expect(dtd.verticalActive).toBe(540)
    expect(dtd.resolution).toBe('1920×1080i')
    expect(computeRefreshRate(dtd)).toBeCloseTo(60, 6)
    expect(analyzeDetailedTimingAgainstCTA(dtd).matchVic?.vic).toBe(5)
  })

  it('writes VIC 5 with the same timing bytes a real 1080i DTD has', () => {
    const fromVic = generateDetailedTimingFromVIC(5, { horizontalImageSize: 708, verticalImageSize: 398 }).encode()
    expect(Array.from(fromVic)).toEqual(Array.from(REAL_1080I))
  })

  it('generates interlaced CVT timings per field at the requested field rate', () => {
    for (const blankingMode of ['cvt', 'cvt-rb', 'cvt-rb2'] as const) {
      const dtd = generateCVTDetailedTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        interlaced: true,
        blankingMode,
      })
      expect(dtd.verticalActive, blankingMode).toBe(540)
      expect(Math.abs(computeRefreshRate(dtd) - 60), blankingMode).toBeLessThan(0.5)
      expect(classifyDetailedTiming(dtd), blankingMode).toBe(blankingMode)
    }
  })
})

describe('CVT descriptor fields follow edid-decode', () => {
  it('reads CVT 3-byte aspect code 3 as 15:9 and writes it back as 3', () => {
    const raw = new Uint8Array(18)
    raw[3] = 0xf8
    raw[5] = 0x01
    raw[6] = 0xff
    raw[7] = (1 << 4) | (3 << 2)
    const decoded = DisplayDescriptorParser.decode(raw) as CVTTimingDescriptor
    expect(decoded.timings[0].aspectRatio).toBe('15:9')
    expect((DisplayDescriptorParser.encode(decoded)[7] >> 2) & 0x03).toBe(3)
  })

  it('maps range-limits byte 15 bit 4 to reduced and bit 3 to standard blanking', () => {
    const raw = fromHex('00 00 00 fd 00 30 4b 1e 53 18 04 11 00 c8 f8 10 00 3c') // byte 15 = 0x10
    const decoded = DisplayDescriptorParser.decode(raw) as DisplayRangeLimitsDescriptor
    expect(decoded.cvt?.reducedBlankingSupported).toBe(true)
    expect(decoded.cvt?.standardBlankingSupported).toBe(false)
    decoded.cvt!.standardBlankingSupported = true
    expect(DisplayDescriptorParser.encode(decoded)[15] & 0x18).toBe(0x18)
  })
})

describe('range-limit edits above 255', () => {
  const limits = (maxVerticalRate: number): DisplayRangeLimitsDescriptor => ({
    tag: 0xfd,
    minVerticalRate: 48,
    maxVerticalRate,
    minHorizontalRate: 30,
    maxHorizontalRate: 300,
    maxPixelClock: 1200,
    timingSupport: 'range-limits-only',
  })

  it('writes the EDID 1.4 offset flags for rates above 255', () => {
    const bytes = DisplayDescriptorParser.encode(limits(360), 1, 4)
    expect(bytes[4]).toBe(0x0a) // +255 on max vertical and max horizontal
    const back = DisplayDescriptorParser.decode(bytes, 1, 4) as DisplayRangeLimitsDescriptor
    expect(back.maxVerticalRate).toBe(360)
    expect(back.maxHorizontalRate).toBe(300)
  })

  it('caps at 255 for EDID 1.3, which has no offset flags', () => {
    const bytes = DisplayDescriptorParser.encode(limits(360), 1, 3)
    expect(bytes[4]).toBe(0)
    expect(bytes[6]).toBe(255)
  })
})

describe('low-risk leftovers: edits keep bits the model does not express', () => {
  it('writes descriptor strings as printable ASCII without trailing spaces', () => {
    const bytes = DisplayDescriptorParser.encode({ tag: 0xfc, productName: 'Café 😀  ' } as never)
    // "Caf?" then the 😀 surrogate pair as one '?', trailing spaces dropped.
    expect(Array.from(bytes.subarray(5, 11))).toEqual([0x43, 0x61, 0x66, 0x3f, 0x20, 0x3f])
    expect(bytes[11]).toBe(0x0a)
  })

  it.each([
    ['an I_Latency flag without Latency', [0x10, 0x00, 0xb8, 0x3c, 0x40]],
    ['reserved byte-4 bit 4', [0x10, 0x00, 0xb8, 0x3c, 0x10]],
    ['a latency field cut short', [0x10, 0x00, 0xb8, 0x3c, 0x80, 0x10]],
    ['3D_Multi = 11 and reserved extended bits', [0x10, 0x00, 0xb8, 0x3c, 0x20, 0x67, 0x00]],
  ])('keeps HDMI 1.4 %s when the block is edited', async (_label, payload) => {
    const { HDMI14Decoder, HDMI14Encoder } = await import('../src/cta/vsdb/hdmi14')
    const fields = { ...new HDMI14Decoder().decode(new Uint8Array(payload)) }
    expect(Array.from(new HDMI14Encoder().encode(fields))).toEqual(payload)
  })

  it('drops a stray I_Latency flag once real latency is added', async () => {
    const { HDMI14Decoder, HDMI14Encoder } = await import('../src/cta/vsdb/hdmi14')
    const fields = { ...new HDMI14Decoder().decode(new Uint8Array([0x10, 0x00, 0xb8, 0x3c, 0x40])) }
    fields.latency = { progressive: { video: 0x10, audio: 0x08 } }
    const bytes = new HDMI14Encoder().encode(fields)
    expect(bytes[4] & 0xc0).toBe(0x80) // progressive only: exactly 2 latency bytes follow
    expect(bytes.length).toBe(7)
  })

  it('keeps the HDMI 2.1 block byte-9 reserved bits', async () => {
    const { HDMIForumDecoder, HDMIForumEncoder } = await import('../src/cta/vsdb/hdmi-forum')
    const payload = [0x01, 0x78, 0x80, 0x6b, 0x43, 0x28, 0x78, 0xd3, 0x33, 0xc5]
    const fields = { ...new HDMIForumDecoder().decode(new Uint8Array(payload)) }
    expect(Array.from(new HDMIForumEncoder().encode(fields))).toEqual(payload)
  })

  it('keeps an unknown range-limits code, reserved byte-4 bits and odd padding across a rate edit', () => {
    // Code 0x03 (undefined), byte 4 bit 4 set, padding of zeros instead of 0A 20 20 …
    const raw = fromHex('00 00 00 fd 10 30 4b 1e 53 18 03 00 00 00 00 00 00 00')
    const decoded = DisplayDescriptorParser.decode(raw, 1, 4) as DisplayRangeLimitsDescriptor
    const edited = { ...decoded, maxVerticalRate: 76 }
    const bytes = DisplayDescriptorParser.encode(edited, 1, 4)
    expect(bytes[4]).toBe(0x10)
    expect(bytes[6]).toBe(76)
    expect(bytes[10]).toBe(0x03)
    expect(Array.from(bytes.subarray(11))).toEqual([0, 0, 0, 0, 0, 0, 0])
  })

  it('writes the chosen timing support once the user picks one', () => {
    const raw = fromHex('00 00 00 fd 00 30 4b 1e 53 18 03 0a 20 20 20 20 20 20')
    const decoded = DisplayDescriptorParser.decode(raw, 1, 4) as DisplayRangeLimitsDescriptor
    const { timingSupportCode: _dropped, ...picked } = { ...decoded, timingSupport: 'range-limits-only' as const }
    expect(DisplayDescriptorParser.encode(picked, 1, 4)[10]).toBe(0x01)
  })

  it('treats all of byte 4 as reserved before EDID 1.4', () => {
    const raw = fromHex('00 00 00 fd 02 30 4b 1e 53 18 01 0a 20 20 20 20 20 20')
    const decoded = DisplayDescriptorParser.decode(raw, 1, 3) as DisplayRangeLimitsDescriptor
    expect(decoded.maxVerticalRate).toBe(0x4b) // no +255 offset in 1.3
    const bytes = DisplayDescriptorParser.encode({ ...decoded, minVerticalRate: 50 }, 1, 3)
    expect(bytes[4]).toBe(0x02)
    expect(bytes[5]).toBe(50)
  })
})
