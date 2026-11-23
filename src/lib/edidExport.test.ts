import { describe, expect, it } from 'vitest'
import { EEDID } from 'edidts'
import { edidFileBaseName, formatEdidHex } from './edidExport'

function parseHex(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9A-Fa-f]/g, '')
  return Uint8Array.from(cleaned.match(/../g) ?? [], (pair) => parseInt(pair, 16))
}

describe('formatEdidHex', () => {
  it('writes 16 uppercase bytes per line', () => {
    const bytes = Uint8Array.from({ length: 20 }, (_, i) => i * 13)
    const lines = formatEdidHex(bytes).trimEnd().split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0].split(' ')).toHaveLength(16)
    expect(lines[0].startsWith('00 0D 1A 27')).toBe(true)
    expect(lines[1].split(' ')).toHaveLength(4)
  })

  it('round-trips through hex parsing', () => {
    const bytes = EEDID.encode(EEDID.blank())
    expect(parseHex(formatEdidHex(bytes))).toEqual(bytes)
  })
})

describe('edidFileBaseName', () => {
  const edid = EEDID.decode(EEDID.encode(EEDID.blank()))

  it('keeps the imported file name without its extension', () => {
    expect(edidFileBaseName(edid, 'dell-u2720q.bin')).toBe('dell-u2720q')
    expect(edidFileBaseName(edid, 'monitor.edid.txt')).toBe('monitor.edid')
  })

  it('strips characters that are not allowed in file names', () => {
    expect(edidFileBaseName(edid, 'a/b:c*.bin')).toBe('abc')
  })

  it('falls back to a name derived from the EDID when there is no source file', () => {
    const name = edidFileBaseName(edid, null)
    expect(name.length).toBeGreaterThan(0)
    expect(name).not.toMatch(/[\\/:*?"<>|\s]/)
  })
})
