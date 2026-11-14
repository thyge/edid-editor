import { describe, expect, it } from 'vitest'
import { looksLikeText, parseEdidHex } from './parseEdidHex'

// LG TV EDID (base + CTA-861), 256 bytes.
const LG = Uint8Array.from(
  `00 ff ff ff ff ff ff 00 1e 6d cd 81 01 01 01 01 01 21 01 03 80 a0 5a 78 0a ee 91 a3 54 4c 99 26
   0f 50 54 a1 08 00 31 40 45 40 61 40 71 40 81 80 d1 c0 01 01 01 01 08 e8 00 30 f2 70 5a 80 b0 58
   8a 00 40 84 63 00 00 1e 6f c2 00 a0 a0 a0 55 50 30 20 35 00 40 84 63 00 00 1e 00 00 00 fd 00 18
   78 1e ff 77 00 0a 20 20 20 20 20 20 00 00 00 fc 00 4c 47 20 54 56 20 53 53 43 52 32 0a 20 01 9d
   02 03 6c f1 5d 61 60 76 75 66 65 db da 10 1f 04 13 05 14 03 02 12 20 21 22 15 5d 5e 5f 62 63 64
   3f 40 32 09 57 07 15 07 50 57 07 01 3d 1e c0 5f 7e 07 67 04 03 6e 03 0c 00 30 00 b8 44 2c 00 80
   01 02 03 04 6d d8 5d c4 01 78 80 6b 43 28 78 d3 33 05 e2 00 cf e3 05 c0 00 e3 06 0d 01 e2 0f ff
   eb 01 46 d0 00 48 22 9e 7e 62 65 97 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 57`
    .replace(/\s+/g, '')
    .match(/../g)!
    .map((h) => parseInt(h, 16)),
)

const hex2 = (b: number) => b.toString(16).padStart(2, '0')
const rows = (bytes: Uint8Array) =>
  Array.from({ length: Math.ceil(bytes.length / 16) }, (_, i) => Array.from(bytes.subarray(i * 16, i * 16 + 16)))
const ascii = (row: number[]) => row.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.')).join('')

/** `xxd file` */
function xxd(bytes: Uint8Array): string {
  return rows(bytes)
    .map((row, i) => {
      const groups = []
      for (let j = 0; j < row.length; j += 2) groups.push(row.slice(j, j + 2).map(hex2).join(''))
      return `${(i * 16).toString(16).padStart(8, '0')}: ${groups.join(' ')}  ${ascii(row)}`
    })
    .join('\n')
}

/** `hexdump -C file` / `od -tx1 file`, collapsing repeated rows into `*`. */
function columnDump(bytes: Uint8Array, style: 'hexdump' | 'od'): string {
  const lines: string[] = []
  let previous = ''
  let starred = false
  rows(bytes).forEach((row, i) => {
    const key = row.join(',')
    if (key === previous) {
      if (!starred) lines.push('*')
      starred = true
      return
    }
    previous = key
    starred = false
    const offset = style === 'od' ? (i * 16).toString(8).padStart(7, '0') : (i * 16).toString(16).padStart(8, '0')
    const cols = row.map(hex2)
    lines.push(
      style === 'od'
        ? `${offset} ${cols.join(' ')}`
        : `${offset}  ${cols.slice(0, 8).join(' ')}  ${cols.slice(8).join(' ')}  |${ascii(row)}|`,
    )
  })
  lines.push(style === 'od' ? bytes.length.toString(8).padStart(7, '0') : bytes.length.toString(16).padStart(8, '0'))
  return lines.join('\n')
}

describe('parseEdidHex', () => {
  it('uses a well-formed fixture (two blocks, valid checksums)', () => {
    expect(LG).toHaveLength(256)
    for (const block of [LG.subarray(0, 128), LG.subarray(128)]) {
      expect(block.reduce((sum, b) => sum + b, 0) % 256).toBe(0)
    }
  })

  it.each([
    ['spaced hex', rows(LG).map((r) => r.map(hex2).join(' ')).join('\n')],
    ['uppercase comma-separated hex', Array.from(LG, (b) => hex2(b).toUpperCase()).join(',')],
    ['one compact run', Array.from(LG, hex2).join('')],
    ['colon-separated hex', Array.from(LG, hex2).join(':')],
    ['a C array', `unsigned char edid[256] = {\n${rows(LG).map((r) => '  ' + r.map((b) => `0x${hex2(b)}`).join(', ') + ',').join('\n')}\n};`],
    ['a Python bytes literal', `edid = b'${Array.from(LG, (b) => `\\x${hex2(b)}`).join('')}'`],
    ['xxd output', xxd(LG)],
    ['hexdump -C output', columnDump(LG, 'hexdump')],
    ['od -tx1 output', columnDump(LG, 'od')],
  ])('reads %s', (_label, text) => {
    expect(Array.from(parseEdidHex(text))).toEqual(Array.from(LG))
  })

  it('expands repeated rows marked with * in hexdump -C and od (octal offsets) dumps', () => {
    const padded = LG.slice()
    padded.fill(0, 0xb0, 0xf0) // four identical all-zero rows
    for (const style of ['hexdump', 'od'] as const) {
      const dump = columnDump(padded, style)
      expect(dump).toContain('*')
      expect(Array.from(parseEdidHex(dump)), style).toEqual(Array.from(padded))
    }
  })

  it('reads a Windows registry export', () => {
    const lines = rows(LG).map((r) => r.map(hex2).join(','))
    const reg = [
      'Windows Registry Editor Version 5.00',
      '',
      '[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Enum\\DISPLAY\\GSM81CD\\1&8713bca&0&UID0\\Device Parameters]',
      `"EDID"=hex:${lines.join(',\\\n  ')}`,
    ].join('\n')
    expect(Array.from(parseEdidHex(reg))).toEqual(Array.from(LG))
  })

  it('picks the EDID out of full xrandr --verbose output', () => {
    const edidLines = rows(LG).map((r) => '\t\t' + r.map(hex2).join(''))
    const text = [
      'HDMI-1 connected primary 3840x2160+0+0 (0x4a) normal (normal left inverted right x axis y axis) 1600mm x 900mm',
      '\tIdentifier: 0x48',
      '\tnon-desktop: 0 ',
      '\t\trange: (0, 1)',
      '\tCONNECTOR_ID: 95 ',
      '\t\tsupported: 95',
      '\tEDID: ',
      ...edidLines,
      '\tBorderDimensions: 4 ',
      '\t\tsupported: 4',
    ].join('\n')
    expect(Array.from(parseEdidHex(text))).toEqual(Array.from(LG))
  })

  it('picks the EDID out of full edid-decode output', () => {
    const text = [
      'edid-decode (hex):',
      '',
      ...rows(LG.subarray(0, 128)).map((r) => r.map(hex2).join(' ')),
      '',
      ...rows(LG.subarray(128)).map((r) => r.map(hex2).join(' ')),
      '',
      '----------------',
      '',
      'Block 0, Base EDID:',
      '  EDID Structure Version & Revision: 1.3',
      '  Vendor & Product Identification:',
      '    Manufacturer: GSM',
      '    Model: 33229',
      '    Serial Number: 16843009 (0x01010101)',
      'Checksum: 0x9d',
    ].join('\n')
    expect(Array.from(parseEdidHex(text))).toEqual(Array.from(LG))
  })

  it('reports text with no hex in it', () => {
    expect(() => parseEdidHex('hello world')).toThrow(/No hex bytes found/)
  })
})

describe('looksLikeText', () => {
  it('tells hex text from a binary EDID', () => {
    expect(looksLikeText(new TextEncoder().encode('00 FF FF FF\r\n'))).toBe(true)
    expect(looksLikeText(LG)).toBe(false)
  })
})
