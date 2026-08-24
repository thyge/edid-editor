import { describe, expect, it } from 'vitest'
import {
  readIeeeOui,
  writeIeeeOui,
  readIeeeOuiLE,
  writeIeeeOuiLE,
  readUint16BE,
  readUint16LE,
  readUint32LE,
} from '../src/common/bintools'

describe('bintools read helpers', () => {
  it('reads little-endian 16-bit integers', () => {
    const data = new Uint8Array([0x34, 0x12, 0xff, 0xff])
    expect(readUint16LE(data, 0)).toBe(0x1234)
    expect(readUint16LE(data, 2)).toBe(0xffff)
  })

  it('reads big-endian 16-bit integers', () => {
    const data = new Uint8Array([0x12, 0x34, 0xff, 0xff])
    expect(readUint16BE(data, 0)).toBe(0x1234)
    expect(readUint16BE(data, 2)).toBe(0xffff)
  })

  it('reads little-endian 32-bit integers as unsigned', () => {
    const data = new Uint8Array([0xff, 0xff, 0xff, 0x7f])
    expect(readUint32LE(data, 0)).toBe(0x7fffffff)
  })
})

describe('IEEE OUI helpers', () => {
  it('reads an IEEE OUI in big-endian order', () => {
    expect(readIeeeOui(new Uint8Array([0x00, 0x0c, 0x03]))).toBe(0x000c03)
    expect(readIeeeOui(new Uint8Array([0xc4, 0x5d, 0xd8]))).toBe(0xc45dd8)
  })

  it('reads an IEEE OUI at an explicit offset', () => {
    const data = new Uint8Array([0xff, 0xff, 0x00, 0x0c, 0x03, 0xff])
    expect(readIeeeOui(data, 2)).toBe(0x000c03)
  })

  it('writes an IEEE OUI in big-endian order', () => {
    const target = new Uint8Array(6)
    writeIeeeOui(target, 1, 0x000c03)
    expect(Array.from(target)).toEqual([0x00, 0x00, 0x0c, 0x03, 0x00, 0x00])
  })

  it('masks the OUI value to 24 bits on write', () => {
    const target = new Uint8Array(3)
    writeIeeeOui(target, 0, 0xff000c03)
    expect(Array.from(target)).toEqual([0x00, 0x0c, 0x03])
  })

  it('round-trips through read → write', () => {
    const original = new Uint8Array([0x00, 0x0c, 0x03, 0xc4, 0x5d, 0xd8])
    const oui1 = readIeeeOui(original, 0)
    const oui2 = readIeeeOui(original, 3)
    const target = new Uint8Array(6)
    writeIeeeOui(target, 0, oui1)
    writeIeeeOui(target, 3, oui2)
    expect(Array.from(target)).toEqual(Array.from(original))
  })
})

describe('IEEE OUI little-endian helpers (CTA-861 wire order)', () => {
  it('reads an IEEE OUI in little-endian order', () => {
    // CTA-861 stores OUIs low-byte first: bytes 03-0C-00 => 0x000C03.
    expect(readIeeeOuiLE(new Uint8Array([0x03, 0x0c, 0x00]))).toBe(0x000c03)
    expect(readIeeeOuiLE(new Uint8Array([0xd8, 0x5d, 0xc4]))).toBe(0xc45dd8)
  })

  it('reads an IEEE OUI LE at an explicit offset', () => {
    const data = new Uint8Array([0xff, 0x03, 0x0c, 0x00, 0xff])
    expect(readIeeeOuiLE(data, 1)).toBe(0x000c03)
  })

  it('writes an IEEE OUI in little-endian order', () => {
    const target = new Uint8Array(6)
    writeIeeeOuiLE(target, 1, 0x000c03)
    expect(Array.from(target)).toEqual([0x00, 0x03, 0x0c, 0x00, 0x00, 0x00])
  })

  it('masks the OUI value to 24 bits on LE write', () => {
    const target = new Uint8Array(3)
    writeIeeeOuiLE(target, 0, 0xff000c03)
    expect(Array.from(target)).toEqual([0x03, 0x0c, 0x00])
  })

  it('round-trips through LE read → LE write', () => {
    const original = new Uint8Array([0x03, 0x0c, 0x00, 0xd8, 0x5d, 0xc4])
    const oui1 = readIeeeOuiLE(original, 0)
    const oui2 = readIeeeOuiLE(original, 3)
    const target = new Uint8Array(6)
    writeIeeeOuiLE(target, 0, oui1)
    writeIeeeOuiLE(target, 3, oui2)
    expect(Array.from(target)).toEqual(Array.from(original))
  })
})
