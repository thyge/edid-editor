import { describe, expect, it } from 'vitest'
import { checksum8, isChecksum8Valid } from '../src/common'

describe('common 8-bit checksum helpers', () => {
  it('calculates the checksum byte that makes the full byte sum valid', () => {
    const bytes = new Uint8Array([0x02, 0x03, 0x04, 0x00])

    bytes[3] = checksum8(bytes)

    expect(bytes[3]).toBe(0xf7)
    expect(isChecksum8Valid(bytes)).toBe(true)
  })

  it('supports an explicit checksum byte index', () => {
    const bytes = new Uint8Array([0x10, 0x00, 0x20, 0x30])

    bytes[1] = checksum8(bytes, 1)

    expect(bytes[1]).toBe(0xa0)
    expect(isChecksum8Valid(bytes)).toBe(true)
  })
})
