import { describe, expect, it } from 'vitest'
import { EDID, DisplayDescriptorParser, DetailedTimingDescriptor } from '../src/edid'
import { EEDID, getCEAExtension, getDisplayIdExtension } from '../src/eedid'
import { checksum8 } from '../src/common'
import type { DisplayRangeLimitsDescriptor, ProductNameDescriptor } from '../src/edid'
import type { VendorSpecificDataBlock } from '../src/cta/vsdb/types'
import { APPENDIX_A_EXAMPLE_1 } from './fixtures'

/**
 * Opening a file and saving it without edits must give back the same bytes.
 * The app re-encodes the EDID as soon as it is loaded, so any field a codec
 * doesn't fully model would otherwise be silently changed on save.
 */

const fromHex = (hex: string) =>
  new Uint8Array(hex.replace(/[^0-9a-f]/gi, '').match(/../g)!.map((b) => parseInt(b, 16)))

const openAndSave = (bytes: Uint8Array) => EEDID.encode(EEDID.decode(bytes))

/** Fill a 128-byte block's checksum (byte 127). */
function sealBlock(block: Uint8Array): Uint8Array {
  block[127] = checksum8(block.subarray(0, 128), 127)
  return block
}

/** A blank base block with the given extension count and descriptor slots. */
function baseBlock(extensionCount: number, slots?: Uint8Array[]): Uint8Array {
  const base = EDID.encode(new EDID(), { extensionCount })
  slots?.forEach((slot, i) => base.set(slot, 54 + i * 18))
  return sealBlock(base)
}

/** A CTA-861 extension block holding the given data blocks and DTDs. */
function ctaBlock(dataBlocks: string[], dtds: Uint8Array[] = []): Uint8Array {
  const block = new Uint8Array(128)
  block[0] = 0x02
  block[1] = 0x03
  let offset = 4
  for (const hex of dataBlocks) {
    const bytes = fromHex(hex)
    block.set(bytes, offset)
    offset += bytes.length
  }
  block[2] = offset
  block[3] = 0xf0
  for (const dtd of dtds) {
    block.set(dtd, offset)
    offset += 18
  }
  return sealBlock(block)
}

function concat(...blocks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(blocks.reduce((n, b) => n + b.length, 0))
  let offset = 0
  for (const b of blocks) {
    out.set(b, offset)
    offset += b.length
  }
  return out
}

const DTD_1080P = fromHex('02 3a 80 18 71 38 2d 40 58 2c 45 00 40 84 63 00 00 1e')

// LG TV EDID with HDMI 1.4 + HDMI 2.1 (HF-VSDB with VRR and DSC), 8K VICs,
// Dolby Vision, colorimetry, HDR static metadata and a Y420 capability map.
const LG_TV_HDMI21 = fromHex(`
  00 ff ff ff ff ff ff 00 1e 6d cd 81 01 01 01 01 01 21 01 03 80 a0 5a 78 0a ee 91 a3 54 4c 99 26
  0f 50 54 a1 08 00 31 40 45 40 61 40 71 40 81 80 d1 c0 01 01 01 01 08 e8 00 30 f2 70 5a 80 b0 58
  8a 00 40 84 63 00 00 1e 6f c2 00 a0 a0 a0 55 50 30 20 35 00 40 84 63 00 00 1e 00 00 00 fd 00 18
  78 1e ff 77 00 0a 20 20 20 20 20 20 00 00 00 fc 00 4c 47 20 54 56 20 53 53 43 52 32 0a 20 01 9d
  02 03 6c f1 5d 61 60 76 75 66 65 db da 10 1f 04 13 05 14 03 02 12 20 21 22 15 5d 5e 5f 62 63 64
  3f 40 32 09 57 07 15 07 50 57 07 01 3d 1e c0 5f 7e 07 67 04 03 6e 03 0c 00 30 00 b8 44 2c 00 80
  01 02 03 04 6d d8 5d c4 01 78 80 6b 43 28 78 d3 33 05 e2 00 cf e3 05 c0 00 e3 06 0d 01 e2 0f ff
  eb 01 46 d0 00 48 22 9e 7e 62 65 97 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 57
`)

describe('open-and-save is byte-exact', () => {
  it('VESA E-EDID Appendix A example 1 (HDMI 2.0 HF-VSDB)', () => {
    expect(openAndSave(APPENDIX_A_EXAMPLE_1)).toEqual(APPENDIX_A_EXAMPLE_1)
  })

  it('LG TV with an HDMI 2.1 HF-VSDB (VRR range, DSC)', () => {
    expect(openAndSave(LG_TV_HDMI21)).toEqual(LG_TV_HDMI21)
  })

  it('base block: range limits above 255 Hz, CVT clock precision, side-by-side 3D, odd slot order', () => {
    // Range limits 48-360 Hz V / 30-410 kHz H (byte 4 offset flags = 0x0A).
    const rangeLimits = fromHex('00 00 00 fd 0a 30 69 1e 9b 4b 01 0a 20 20 20 20 20 20')
    // Side-by-side interleaved stereo: flags byte bits 6,5,0 set (0x61) + digital separate sync.
    const stereoDtd = DTD_1080P.slice()
    stereoDtd[17] = 0x7f
    const name = DisplayDescriptorParser.encode({ tag: 0xfc, productName: 'PROBE' } as ProductNameDescriptor)
    const base = baseBlock(0, [stereoDtd, rangeLimits, DTD_1080P, name])
    base[37] |= 0x01 // a manufacturer-specific established timing bit
    sealBlock(base)
    expect(openAndSave(base)).toEqual(base)

    const decoded = EEDID.decode(base).base
    const limits = decoded.displayDescriptors.find((d) => d.tag === 0xfd) as DisplayRangeLimitsDescriptor
    expect(limits.maxVerticalRate).toBe(360)
    expect(limits.maxHorizontalRate).toBe(410)
    expect(decoded.detailedTimings[0].flags.stereoMode).toBe('side-by-side-interleaved')
  })

  it('base block: CVT range-limits pixel clock precision', () => {
    // byte 9 = 0x18 (240 MHz), byte 12 bits 7:2 = 3 → 240 - 0.75 = 239.25 MHz.
    const cvtLimits = fromHex('00 00 00 fd 00 30 4b 1e 53 18 04 11 0c c8 f8 30 90 3c')
    const base = baseBlock(0, [DTD_1080P, cvtLimits])
    expect(openAndSave(base)).toEqual(base)
    const limits = EEDID.decode(base).base.displayDescriptors.find((d) => d.tag === 0xfd) as DisplayRangeLimitsDescriptor
    expect(limits.maxPixelClock).toBe(239.25)
  })

  it('CTA blocks whose codecs do not model every bit', () => {
    const microsoftHmd = '75 5c 12 ca 03 52 ' + '11 '.repeat(16)
    const bytes = concat(
      baseBlock(1, [DTD_1080P]),
      ctaBlock(
        [
          '65 03 0c 00 10 00', // HDMI 1.4, physical address only
          '67 03 0c 00 10 00 b9 3c', // HDMI 1.4 with DVI_Dual + reserved flag bits
          'e3 05 c0 41', // colorimetry incl. ICtCp / MD bits
          'e2 05 03', // colorimetry with a 1-byte body
          'e6 06 35 01 73 5d 01', // HDR static metadata, reserved EOTF bits, min luminance 1
          'eb 13 4b 7f 00 00 10 10 08 00 00 00', // room configuration
          'e3 14 80 e0', // speaker location with reserved bits
          'e4 0d c7 00 81', // video format preference with SVR 0
          'e3 01 46 d0', // truncated vendor-specific video block
          '67 1a 00 00 01 01 30 90', // AMD VSDB shorter than its codec expects
          'e1 00', // empty video capability block
          'e3 20 1f 00', // InfoFrame block with reserved header bits
          microsoftHmd, // Microsoft HMD VSDB
        ],
        [DTD_1080P],
      ),
    )
    expect(openAndSave(bytes)).toEqual(bytes)
  })

  it('DisplayID 2.0 section with non-zero fill bytes', () => {
    const section = fromHex('20 0b 03 00 7e 00 04 11 22 33 44 00 12 34 56 00')
    section[section.length - 1] = checksum8(section, section.length - 1)
    const block = new Uint8Array(128)
    block[0] = 0x70
    block.set(section, 1)
    const bytes = concat(baseBlock(1, [DTD_1080P]), sealBlock(block))
    expect(openAndSave(bytes)).toEqual(bytes)
    expect(getDisplayIdExtension(EEDID.decode(bytes))).not.toBeNull()
  })
})

describe('editing one part keeps the rest byte-exact', () => {
  it('renaming the product keeps the range-limit offsets and other slots', () => {
    const eedid = EEDID.decode(LG_TV_HDMI21)
    const name = eedid.base.displayDescriptors.find((d) => d.tag === 0xfc) as ProductNameDescriptor
    name.productName = 'RENAMED'
    const out = EEDID.encode(eedid)

    const nameSlot = 54 + 3 * 18
    // Everything outside the product-name slot and the checksum is untouched.
    for (let i = 0; i < LG_TV_HDMI21.length; i++) {
      if ((i >= nameSlot && i < nameSlot + 18) || i === 127) continue
      expect(out[i], `byte ${i}`).toBe(LG_TV_HDMI21[i])
    }
    expect(EEDID.decode(out).base.displayDescriptors.find((d) => d.tag === 0xfc)).toMatchObject({
      productName: 'RENAMED',
    })
  })

  it('editing the HDMI 2.1 block keeps its VRR and DSC fields and every other block', () => {
    const eedid = EEDID.decode(LG_TV_HDMI21)
    const cea = getCEAExtension(eedid)!
    const forum = cea.dataBlocks.find(
      (b) => b.tag === 0x03 && (b as VendorSpecificDataBlock).vendor?.kind === 'hdmiForum',
    ) as VendorSpecificDataBlock
    if (forum.vendor?.kind !== 'hdmiForum') throw new Error('expected an HF-VSDB')
    forum.vendor.fields.fva = true

    const out = EEDID.encode(eedid)
    expect(out.length).toBe(LG_TV_HDMI21.length)
    const hfOffset = 128 + 0x44 // header byte of the HF-VSDB in the CTA block
    expect(out[hfOffset]).toBe(0x6d) // still 13 bytes long
    expect(out[hfOffset + 1 + 3 + 4]).toBe(0x43 | 0x04) // FVA bit set in byte 4
    // Bytes outside the edited byte and the CTA checksum are unchanged.
    for (let i = 0; i < LG_TV_HDMI21.length; i++) {
      if (i === hfOffset + 1 + 3 + 4 || i === 255) continue
      expect(out[i], `byte ${i}`).toBe(LG_TV_HDMI21[i])
    }
  })

  it('a newly added detailed timing is encoded fresh while existing slots keep their bytes', () => {
    const base = baseBlock(0, [DTD_1080P])
    const eedid = EEDID.decode(base)
    eedid.base.detailedTimings = [
      ...eedid.base.detailedTimings,
      new DetailedTimingDescriptor({ pixelClock: 74.25, horizontalActive: 1280, horizontalBlanking: 370, verticalActive: 720, verticalBlanking: 30 }),
    ]
    const out = EEDID.encode(eedid)
    expect(Array.from(out.subarray(54, 72))).toEqual(Array.from(DTD_1080P))
    expect(EEDID.decode(out).base.detailedTimings).toHaveLength(2)
  })
})
