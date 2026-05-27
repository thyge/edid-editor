import { describe, expect, it } from 'vitest'
import { collectEdidFixturesFromModule } from './fixture-loader'

describe('EDID fixture loader', () => {
  it('collects only full EDID Uint8Array fixture exports', () => {
    const edid = new Uint8Array(128)
    edid.set([0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00], 0)

    const fixtures = collectEdidFixturesFromModule({
      BASIC: edid,
      BASIC_HEX: '00,01,02',
      AUDIO_BLOCK: new Uint8Array([0x00, 0xff, 0xff]),
      helper: () => undefined,
    })

    expect(fixtures).toEqual([
      {
        name: 'BASIC',
        data: edid,
        source: 'fixtures',
      },
    ])
  })
})
