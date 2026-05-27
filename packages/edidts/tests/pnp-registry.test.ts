import { describe, it, expect } from 'vitest'
import { getManufacturerInfo, getManufacturerName } from '../src/common/pnp-registry'

describe('PNP manufacturer registry', () => {
  it('returns company info for a known identifier', () => {
    const info = getManufacturerInfo('ACR')
    expect(info).not.toBeNull()
    expect(info?.company).toBe('Acer Technologies')
    expect(info?.approvedOn).toBe('11/29/1996')
  })

  it('normalizes casing and whitespace for lookup input', () => {
    expect(getManufacturerName('  acr ')).toBe('Acer Technologies')
  })

  it('yields null for unknown identifiers', () => {
    expect(getManufacturerInfo('???')).toBeNull()
    expect(getManufacturerName('')).toBeNull()
  })
})
