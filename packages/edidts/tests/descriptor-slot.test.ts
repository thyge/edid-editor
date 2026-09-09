import { describe, it, expect } from 'vitest'
import {
  DetailedTimingDescriptor,
  DisplayDescriptorParser,
  EDID,
  EDIDHeader,
} from '../src/edid'
import { checksum8 } from '../src/common'

/**
 * Build a synthetic 128-byte base block with the four descriptor slots filled
 * per the spec. Each slot entry is either a DetailedTimingDescriptor (encoded
 * via its .encode() method), a display descriptor spec object (with a `tag`
 * field), or undefined (which becomes a dummy).
 */
function makeEdidWithSlots(
  slots: Array<DetailedTimingDescriptor | { tag: number } | undefined>,
): Uint8Array {
  const header = new EDIDHeader().encode() // 20 bytes
  const out = new Uint8Array(128)
  out.set(header, 0)
  out[20] = 0x80 // digital
  out[21] = 0
  out[22] = 0
  out[23] = 0xff // gamma undefined
  out[24] = 0x06 // sRGB, preferred timing
  // bytes 25..34: chromaticity (zeros are fine for this test)
  // bytes 35..37: established timings (zeros)
  // bytes 38..53: standard timings (zeros)
  for (let i = 0; i < 4; i++) {
    const slot = slots[i]
    if (slot instanceof DetailedTimingDescriptor) {
      out.set(slot.encode(), 54 + i * 18)
    } else if (slot) {
      const descriptor = DisplayDescriptorParser.decode(
        new Uint8Array(18).map((_, j) => {
          if (j < 3) return 0
          if (j === 3) return slot.tag
          return 0
        }),
      )
      if (descriptor) out.set(DisplayDescriptorParser.encode(descriptor), 54 + i * 18)
    } else {
      out.set(DisplayDescriptorParser.encode({ tag: 0x10 }), 54 + i * 18)
    }
  }
  out[127] = checksum8(out, 127)
  return out
}

describe('Descriptor slot boundaries (Section 3.10)', () => {
  it('decodes a single DTD in slot 0 and dummies in slots 1..3', () => {
    const dtd = new DetailedTimingDescriptor({
      pixelClock: 148.5,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      verticalActive: 1080,
      verticalBlanking: 45,
    })
    const bytes = makeEdidWithSlots([dtd])
    const edid = EDID.decode(bytes)
    expect(edid.detailedTimings.length).toBe(1)
    expect(edid.detailedTimings[0].pixelClock).toBe(148.5)
    // The 3 dummy slots decode to DummyDescriptor entries (tag 0x10).
    expect(edid.displayDescriptors.length).toBe(3)
    expect(edid.displayDescriptors.every((d) => d.tag === 0x10)).toBe(true)
    expect(edid.isBaseValid).toBe(true)
  })

  it('decodes a display descriptor (Product Name) in slot 0', () => {
    const bytes = makeEdidWithSlots([{ tag: 0xfc }])
    const edid = EDID.decode(bytes)
    expect(edid.detailedTimings).toEqual([])
    // 1 real display descriptor + 3 dummy slots
    expect(edid.displayDescriptors.length).toBe(4)
    // The real one is the first decoded (slot 0)
    expect(edid.displayDescriptors[0].tag).toBe(0xfc)
    expect(edid.isBaseValid).toBe(true)
  })

  it('round-trips a mixed DTD + display descriptor slot layout', () => {
    const dtd = new DetailedTimingDescriptor({
      pixelClock: 25.175,
      horizontalActive: 640,
      horizontalBlanking: 160,
      verticalActive: 480,
      verticalBlanking: 45,
    })
    const bytes = makeEdidWithSlots([dtd, { tag: 0xfc }, { tag: 0xfd }])
    const edid = EDID.decode(bytes)
    expect(edid.detailedTimings.length).toBe(1)
    // 2 real display descriptors (slots 1, 2) + 1 dummy (slot 3)
    expect(edid.displayDescriptors.length).toBe(3)
    expect(edid.displayDescriptors[0].tag).toBe(0xfc)
    expect(edid.displayDescriptors[1].tag).toBe(0xfd)
    expect(edid.displayDescriptors[2].tag).toBe(0x10)
    expect(edid.isBaseValid).toBe(true)
  })
})

describe('First descriptor validation (Section 3.10.1)', () => {
  it('marks base as invalid when slot 0 is a dummy descriptor', () => {
    // A real EDID must have slot 0 populated. Construct a synthetic one with
    // a dummy in slot 0 and a valid descriptor in slot 1 — slot 0 being
    // dummy alone is enough to fail per spec.
    const bytes = makeEdidWithSlots([{ tag: 0x10 }, { tag: 0xfc }])
    const edid = EDID.decode(bytes)
    expect(edid.isBaseValid).toBe(false)
  })

  it('marks base as invalid when slot 0 is all zeros', () => {
    // A truly empty slot 0 (all bytes 0x00) is also invalid.
    const bytes = makeEdidWithSlots([undefined, { tag: 0xfc }])
    const edid = EDID.decode(bytes)
    expect(edid.isBaseValid).toBe(false)
  })

  it('marks base as valid when slot 0 is a DTD', () => {
    const dtd = new DetailedTimingDescriptor({
      pixelClock: 25.175,
      horizontalActive: 640,
      horizontalBlanking: 160,
      verticalActive: 480,
      verticalBlanking: 45,
    })
    const bytes = makeEdidWithSlots([dtd])
    const edid = EDID.decode(bytes)
    expect(edid.isBaseValid).toBe(true)
  })

  it('defaults isBaseValid to true for a programmatically constructed EDID', () => {
    const edid = new EDID()
    expect(edid.isBaseValid).toBe(true)
  })
})

describe('First descriptor diagnostics (Section 3.10.1)', () => {
  it('emits no baseDiagnostics when slot 0 is populated (DTD)', () => {
    const dtd = new DetailedTimingDescriptor({
      pixelClock: 25.175,
      horizontalActive: 640,
      horizontalBlanking: 160,
      verticalActive: 480,
      verticalBlanking: 45,
    })
    const edid = EDID.decode(makeEdidWithSlots([dtd]))
    expect(edid.isBaseValid).toBe(true)
    expect(edid.baseDiagnostics).toEqual([])
  })

  it('emits no baseDiagnostics when slot 0 is a non-dummy display descriptor', () => {
    const edid = EDID.decode(makeEdidWithSlots([{ tag: 0xfc }]))
    expect(edid.isBaseValid).toBe(true)
    expect(edid.baseDiagnostics).toEqual([])
  })

  it('warns that slot 0 is a dummy (tag 0x10) and marks base invalid', () => {
    const edid = EDID.decode(makeEdidWithSlots([{ tag: 0x10 }, { tag: 0xfc }]))
    expect(edid.isBaseValid).toBe(false)
    expect(edid.baseDiagnostics.length).toBe(1)
    expect(edid.baseDiagnostics[0]).toMatch(/First descriptor slot is a dummy/)
    expect(edid.baseDiagnostics[0]).toMatch(/3\.10\.1/)
  })

  it('warns that slot 0 is empty and marks base invalid', () => {
    // A genuinely all-zero slot 0 (not a dummy — byte 3 is 0x00, not 0x10).
    // Slot 1 carries a real descriptor so the block isn't otherwise empty.
    const bytes = makeEdidWithSlots([undefined, { tag: 0xfc }])
    bytes.set(new Uint8Array(18), 54) // overwrite slot 0 with all zeros
    bytes[127] = checksum8(bytes, 127)
    const edid = EDID.decode(bytes)
    expect(edid.isBaseValid).toBe(false)
    expect(edid.baseDiagnostics.length).toBe(1)
    expect(edid.baseDiagnostics[0]).toMatch(/First descriptor slot is empty/)
  })

  it('defaults baseDiagnostics to [] for a programmatically constructed EDID', () => {
    expect(new EDID().baseDiagnostics).toEqual([])
  })
})

describe('Borders math (Section 3.12)', () => {
  it('round-trips a DTD with non-zero horizontal and vertical borders', () => {
    const dtd = new DetailedTimingDescriptor({
      pixelClock: 108.0,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      verticalActive: 1080,
      verticalBlanking: 45,
      horizontalBorder: 6,
      verticalBorder: 4,
    })
    const bytes = makeEdidWithSlots([dtd])
    const edid = EDID.decode(bytes)
    const timing = edid.detailedTimings[0]
    expect(timing.horizontalBorder).toBe(6)
    expect(timing.verticalBorder).toBe(4)
  })

  it('total horizontal = active + blanking + 2*border (DTD math sanity)', () => {
    const dtd = new DetailedTimingDescriptor({
      pixelClock: 25.175,
      horizontalActive: 640,
      horizontalBlanking: 160,
      horizontalBorder: 8,
    })
    const totalPixels = dtd.horizontalActive + dtd.horizontalBlanking + 2 * dtd.horizontalBorder
    expect(totalPixels).toBe(640 + 160 + 16)
  })
})
