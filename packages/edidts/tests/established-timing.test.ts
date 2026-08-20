import { describe, it, expect } from 'vitest'
import { EstablishedTiming } from '../src/edid'

describe('EstablishedTiming decode/encode (Section 3.8)', () => {
  it('decodes an empty byte array to no timings', () => {
    expect(EstablishedTiming.decode(new Uint8Array([0, 0, 0]))).toEqual([])
  })

  it('decodes 0xFF 0xFF 0xFF to all 24 timing IDs (17 usable + 7 reserved)', () => {
    // TIMING_MAP contains entries for ids 0..23. The decoder does not skip
    // reserved IDs; it just produces EstablishedTiming entries with width=0
    // and height=0 for them. Round-trip via the all-17-supported encode test
    // confirms the 17-timings path.
    const timings = EstablishedTiming.decode(new Uint8Array([0xff, 0xff, 0xff]))
    expect(timings.length).toBe(24)
    expect(timings.filter((t) => t.width > 0).length).toBe(17)
  })

  it('encodes an empty list to a 3-byte zero array', () => {
    expect(EstablishedTiming.encode([])).toEqual(new Uint8Array([0, 0, 0]))
  })

  it('encodes all 17 supported timings to 0xFF 0xFF 0x80', () => {
    // Bits 0..16 of the 3-byte block: ids 0..7 in byte 0 (bits 7..0), 8..15 in
    // byte 1 (bits 7..0), 16 in byte 2 (bit 7). Reserved ids 17..23 are in byte
    // 2 bits 6..0 and are not set.
    const all = EstablishedTiming.TIMING_MAP
      .filter((t) => t.width > 0)
      .map((t) => new EstablishedTiming(t))
    const encoded = EstablishedTiming.encode(all)
    expect(encoded).toEqual(new Uint8Array([0xff, 0xff, 0x80]))
  })

  it('round-trips a single timing (id 0: 720x400@70Hz)', () => {
    const original = [
      new EstablishedTiming({ id: 0, name: '720x400@70Hz', width: 720, height: 400, refreshRate: 70 }),
    ]
    const encoded = EstablishedTiming.encode(original)
    expect(encoded[0]).toBe(0x80) // bit 7 of byte 0
    expect(encoded[1]).toBe(0x00)
    expect(encoded[2]).toBe(0x00)
    const decoded = EstablishedTiming.decode(encoded)
    expect(decoded.length).toBe(1)
    expect(decoded[0].width).toBe(720)
    expect(decoded[0].height).toBe(400)
    expect(decoded[0].refreshRate).toBe(70)
  })

  it('round-trips a single timing from the last byte (id 16: 1152x870@75Hz)', () => {
    const original = [
      new EstablishedTiming({ id: 16, name: '1152x870@75Hz', width: 1152, height: 870, refreshRate: 75 }),
    ]
    const encoded = EstablishedTiming.encode(original)
    expect(encoded[0]).toBe(0x00)
    expect(encoded[1]).toBe(0x00)
    expect(encoded[2]).toBe(0x80) // bit 7 of byte 2
    const decoded = EstablishedTiming.decode(encoded)
    expect(decoded.length).toBe(1)
    expect(decoded[0].width).toBe(1152)
  })

  it('skips reserved timing IDs (17..23) on encode (TASK-46)', () => {
    // Reserved IDs occupy byte 2 bits 6..0; EDID 1.4 §3.8 / Table 3.18 requires
    // these bits to be written as 0, so the encoder must not set them even if a
    // reserved id appears in the input.
    const reserved = new EstablishedTiming({ id: 17, name: 'Reserved 17', width: 0, height: 0, refreshRate: 0 })
    const encoded = EstablishedTiming.encode([reserved])
    expect(encoded[0]).toBe(0)
    expect(encoded[1]).toBe(0)
    expect(encoded[2]).toBe(0) // reserved bit 6 (id 17) forced to 0

    // A mix of valid + reserved ids: only the valid bits are set.
    const mixed = [
      new EstablishedTiming({ id: 2, name: '640x480@60Hz', width: 640, height: 480, refreshRate: 60 }),
      new EstablishedTiming({ id: 20, name: 'Reserved 20', width: 0, height: 0, refreshRate: 0 }),
    ]
    const enc = EstablishedTiming.encode(mixed)
    expect(enc[0]).toBe(0x20) // id 2 → byte 0 bit 5
    expect(enc[2]).toBe(0) // id 20 reserved → not set
  })

  it('decodes 0x80 0x00 0x00 to a single 720x400@70Hz timing', () => {
    const decoded = EstablishedTiming.decode(new Uint8Array([0x80, 0x00, 0x00]))
    expect(decoded.length).toBe(1)
    expect(decoded[0].id).toBe(0)
    expect(decoded[0].width).toBe(720)
  })

  it('encodes multiple distinct timings and decodes them back in id order', () => {
    const original = [
      new EstablishedTiming({ id: 2, name: '640x480@60Hz', width: 640, height: 480, refreshRate: 60 }),
      new EstablishedTiming({ id: 12, name: '1024x768@60Hz', width: 1024, height: 768, refreshRate: 60 }),
      new EstablishedTiming({ id: 16, name: '1152x870@75Hz', width: 1152, height: 870, refreshRate: 75 }),
    ]
    const encoded = EstablishedTiming.encode(original)
    // id 2: byte 0, bit 5 (1 << 5 = 0x20)
    // id 12: byte 1, bit 3 (1 << 3 = 0x08)
    // id 16: byte 2, bit 7 (1 << 7 = 0x80)
    expect(encoded[0]).toBe(0x20)
    expect(encoded[1]).toBe(0x08)
    expect(encoded[2]).toBe(0x80)
    const decoded = EstablishedTiming.decode(encoded)
    expect(decoded.map((t) => t.id)).toEqual([2, 12, 16])
  })
})
