import { describe, expect, it } from 'vitest'
import { EDID, detectSPWG } from '../src/edid'
import { EEDID } from '../src/eedid'
import { DetailedTimingDescriptor } from '../src/common/detailed-timing-descriptor'
import { checksum8 } from '../src/common/checksum'

// SPWG (Standard Panel Working Group) Notebook Panel EDID sub-format.
// edid-decode parse-base-block.cpp:1589 detects SPWG; :973 relocates DTD 2's
// sync-flags byte to 0x47 (the byte preceding the 2nd descriptor slot, shared
// with DTD 1) and repurposes DTD 2's own byte 17 (0x59) as the SPWG module
// revision. The corpus has ~275 SPWG fixtures (mostly laptop panels); the only
// safety net for this decode path is a synthetic test (zero fixtures exercise
// the encode side, which is intentionally not SPWG-aware — see code comment).

const SHARED_FLAGS = 0x18 // digital-separate, -hsync, -vsync (bits 4:3 = 11)
const MODULE_REV = 0x01 // DTD 2 byte 17 (0x59) holds the SPWG module revision

function makeDtd(flags: number): Uint8Array {
  // A minimal but valid 18-byte DTD (nonzero pixel clock so decode keeps it).
  const dtd = new DetailedTimingDescriptor({
    pixelClock: 72.0,
    horizontalActive: 1280,
    horizontalBlanking: 160,
    verticalActive: 720,
    verticalBlanking: 30,
    flags: { syncType: 'digital-separate', hSyncPolarity: 'negative', vSyncPolarity: 'negative' },
  })
  const bytes = dtd.encode()
  bytes[17] = flags
  return bytes
}

/**
 * Build a 128-byte EDID 1.4 base block. When `spwg` is true, slots 2/3 carry
 * 0xfe SPWG descriptors and the SPWG Descriptor #4 sanity bytes (0x79/0x7a) are
 * set so detectSPWG() returns true; otherwise slots 2/3 are dummy 0x10
 * descriptors (a normal non-SPWG base block).
 */
function buildBase(opts: { spwg: boolean; dtd2Byte17: number }): Uint8Array {
  const bytes = new Uint8Array(128)

  // Header: magic + manufacturer + product + serial + week/year + v1.4
  bytes.set([0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00], 0)
  bytes[8] = 0x48; bytes[9] = 0x53 // manufacturer placeholder
  bytes[16] = 1 // week
  bytes[17] = 30 // year (1990 + 30 = 2020)
  bytes[18] = 1 // EDID version
  bytes[19] = 4 // EDID revision
  bytes[20] = 0x00 // analog video input
  bytes[23] = 0x00 // gamma not defined
  bytes[24] = 0x00 // feature support
  // bytes 25-37: chromaticity + established timings left zero
  // Standard timings 38-53: all 0x01 0x01 = unused
  for (let i = 38; i < 54; i++) bytes[i] = 0x01

  // Slot 0 (0x36): DTD 1 — its byte 17 (0x47) is the shared SPWG flags byte.
  bytes.set(makeDtd(SHARED_FLAGS), 54)
  // Slot 1 (0x48): DTD 2 — byte 17 (0x59) holds the SPWG module revision.
  bytes.set(makeDtd(SHARED_FLAGS), 72)
  bytes[0x59] = opts.dtd2Byte17

  if (opts.spwg) {
    // Slots 2/3: SPWG display descriptors (tag 0xfe at byte 3).
    // 0xfe at 0x5d (slot2 byte3) and 0x6f (slot3 byte3); bytes 0/1/2 zero.
    bytes[0x5d] = 0xfe
    bytes[0x6f] = 0xfe
    // SPWG Descriptor #4 sanity: byte 0x79 (slot3 byte13) = LVDS channels ∈{1,2},
    // byte 0x7a (slot3 byte14) = panel-self-test ≤ 1.
    bytes[0x79] = 1
    bytes[0x7a] = 0
  } else {
    // Non-SPWG control: slots 2/3 are dummy 0x10 descriptors.
    bytes[0x38 + 2 * 18] = 0x00; bytes[0x38 + 2 * 18 + 3] = 0x10 // slot 2 tag
    bytes[0x38 + 3 * 18] = 0x00; bytes[0x38 + 3 * 18 + 3] = 0x10 // slot 3 tag
  }

  bytes[126] = 0 // extension count
  bytes[127] = checksum8(bytes, 127)
  return bytes
}

describe('SPWG Notebook Panel EDID', () => {
  it('detectSPWG matches edid-decode criteria for an SPWG base block', () => {
    const spwg = buildBase({ spwg: true, dtd2Byte17: MODULE_REV })
    expect(detectSPWG(spwg)).toBe(true)
  })

  it('detectSPWG returns false for a normal (non-SPWG) base block', () => {
    const normal = buildBase({ spwg: false, dtd2Byte17: SHARED_FLAGS })
    expect(detectSPWG(normal)).toBe(false)
  })

  it('reads DTD 2 flags from the relocated byte 0x47 (digital-separate, polarity preserved)', () => {
    const spwg = buildBase({ spwg: true, dtd2Byte17: MODULE_REV })
    const edid = EDID.decode(spwg)

    expect(edid.detailedTimings).toHaveLength(2)

    // DTD 2's own byte 17 (0x59) is the module revision (0x01), which without the
    // fix would decode to analog-composite. The relocated byte 0x47 (0x18) gives
    // digital-separate with both polarities negative, matching edid-decode.
    const dtd2 = edid.detailedTimings[1]
    expect(dtd2.flags.syncType).toBe('digital-separate')
    expect(dtd2.flags.hSyncPolarity).toBe('negative')
    expect(dtd2.flags.vSyncPolarity).toBe('negative')

    // DTD 1 reads its own byte 17 (0x47, the shared byte) — unchanged.
    const dtd1 = edid.detailedTimings[0]
    expect(dtd1.flags.syncType).toBe('digital-separate')
    expect(dtd1.flags.hSyncPolarity).toBe('negative')
    expect(dtd1.flags.vSyncPolarity).toBe('negative')
  })

  it('a non-SPWG base block reads DTD 2 flags from its own byte 17 (control)', () => {
    // DTD 2 byte 17 (0x59) = SHARED_FLAGS (0x18); not relocated because not SPWG.
    const normal = buildBase({ spwg: false, dtd2Byte17: SHARED_FLAGS })
    const edid = EDID.decode(normal)
    expect(detectSPWG(normal)).toBe(false)
    expect(edid.detailedTimings).toHaveLength(2)
    expect(edid.detailedTimings[1].flags.syncType).toBe('digital-separate')
    expect(edid.detailedTimings[1].flags.hSyncPolarity).toBe('negative')
  })

  it('DTD 1 and DTD 2 flags are field-stable across decode -> encode -> re-decode', () => {
    const spwg = buildBase({ spwg: true, dtd2Byte17: MODULE_REV })
    const first = EEDID.decode(spwg)
    expect(first.base.detailedTimings[1].flags.syncType).toBe('digital-separate')

    // Re-encode and re-decode. Encode is not SPWG-aware (it writes DTD 2's flags
    // to 0x59, overwriting the module revision), but because SPWG shares the
    // flags byte, the decoded flags field round-trips stably.
    const reencoded = EEDID.encode(first)
    const redecoded = EEDID.decode(reencoded)

    // Encode is intentionally not SPWG-aware: re-encode does not preserve the
    // SPWG-specific bytes (the 0x59 module-revision byte is overwritten with the
    // flags value, and the SPWG Descriptor #4 fields are decoded as a generic
    // 0xfe string and truncated at nulls, so detectSPWG may go false). The
    // decoded DTD sync-flags FIELD stays stable regardless: both the relocated
    // byte 0x47 and DTD 2's own byte 17 (0x59) carry the flags value after encode.
    expect(redecoded.base.detailedTimings).toHaveLength(2)
    expect(redecoded.base.detailedTimings[0].flags.syncType).toBe('digital-separate')
    expect(redecoded.base.detailedTimings[1].flags.syncType).toBe('digital-separate')
    expect(redecoded.base.detailedTimings[1].flags.hSyncPolarity).toBe('negative')
    expect(redecoded.base.detailedTimings[1].flags.vSyncPolarity).toBe('negative')
    expect(redecoded.isValid).toBe(true)
  })

  it('without the fix the relocated byte 0x47 differs from byte 0x59 (regression guard)', () => {
    // Documents the pre-fix misdecode: byte 0x59 (module rev 0x01) alone would
    // decode to analog-composite, not digital-separate.
    const spwg = buildBase({ spwg: true, dtd2Byte17: MODULE_REV })
    expect(spwg[0x47]).toBe(SHARED_FLAGS) // relocated flags (read by the fix)
    expect(spwg[0x59]).toBe(MODULE_REV) // module revision (NOT the flags)
    expect(spwg[0x47]).not.toBe(spwg[0x59])
  })
})