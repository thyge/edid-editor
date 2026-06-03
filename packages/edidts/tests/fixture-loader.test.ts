import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as basicFixtures from './fixtures'
import {
  applyFixtureLimit,
  collectEdidFixturesFromDirectory,
  collectEdidFixturesFromFile,
  collectEdidFixturesFromModule,
  extractEdidBytesFromText,
  isFullEdid,
  loadEdidFixtures,
  LINUXHW_FIXTURE_DIR,
} from './fixture-loader'

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

describe('extractEdidBytesFromText', () => {
  // A minimal 128-byte EDID with only the signature + zero padding; sufficient
  // to verify byte extraction logic, not full structural validity.
  const MINIMAL_EDID_HEX = '00ffffffffffff000000000000000000' +
    '00000000000000000000000000000000' +
    '00000000000000000000000000000000' +
    '00000000000000000000000000000000' +
    '00000000000000000000000000000000' +
    '00000000000000000000000000000000' +
    '00000000000000000000000000000000' +
    '00000000000000000000000000000000'

  it('parses the upstream linuxhw/EDID 16-bytes-per-line format', () => {
    const spaced = MINIMAL_EDID_HEX.match(/.{2}/g)!.join(' ')
    const lines: string[] = []
    for (let i = 0; i < 128; i += 16) {
      lines.push(spaced.slice(i * 3, i * 3 + 16 * 3 - 1))
    }
    const text = ['edid-decode (hex):', '', ...lines, '', '----------------', '', 'Block 0, Base EDID:'].join('\n')

    const bytes = extractEdidBytesFromText(text)
    expect(bytes).not.toBeNull()
    expect(bytes!.length).toBe(128)
    expect(Array.from(bytes!.slice(0, 8))).toEqual([0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00])
  })

  it('parses the README single-line contiguous format', () => {
    const bytes = extractEdidBytesFromText(MINIMAL_EDID_HEX)
    expect(bytes?.length).toBe(128)
  })

  it('parses the README single-line space-separated format', () => {
    const spaced = MINIMAL_EDID_HEX.match(/.{2}/g)!.join(' ')
    const bytes = extractEdidBytesFromText(spaced)
    expect(bytes?.length).toBe(128)
  })

  it('returns null when no hex lines are present', () => {
    expect(extractEdidBytesFromText('Block 0, Base EDID:\n  Vendor: ACME\n')).toBeNull()
    expect(extractEdidBytesFromText('')).toBeNull()
  })

  it('stops at the --- block separator so decoded text is not consumed', () => {
    const spaced = MINIMAL_EDID_HEX.match(/.{2}/g)!.join(' ')
    const lines: string[] = []
    for (let i = 0; i < 128; i += 16) {
      lines.push(spaced.slice(i * 3, i * 3 + 16 * 3 - 1))
    }
    const text = [...lines, '----------------', '00 ff garbage should not parse'].join('\n')

    const bytes = extractEdidBytesFromText(text)
    expect(bytes?.length).toBe(128)
  })
})

describe('collectEdidFixturesFromFile', () => {
  let workdir: string

  beforeEach(async () => {
    workdir = await mkdtemp(join(tmpdir(), 'edid-fixture-test-'))
  })

  afterEach(async () => {
    await rm(workdir, { recursive: true, force: true })
  })

  it('rejects files that do not contain a parseable EDID', async () => {
    const filePath = join(workdir, 'garbage.txt')
    await writeFile(filePath, 'just a readme, no edid here\n', 'utf8')

    const result = await collectEdidFixturesFromFile(filePath, workdir)
    expect(result).toBeNull()
  })

  it('rejects files whose parsed bytes are shorter than 128 bytes', async () => {
    const filePath = join(workdir, 'tiny.txt')
    await writeFile(filePath, '00 ff ff ff ff ff ff 00\n', 'utf8')

    const result = await collectEdidFixturesFromFile(filePath, workdir)
    expect(result).toBeNull()
  })

  it('rejects files whose parsed bytes lack the EDID signature', async () => {
    const filePath = join(workdir, 'wrong-sig.txt')
    // 128 hex bytes but wrong signature
    const wrong = 'deadbeef'.repeat(16)
    await writeFile(filePath, wrong + '\n', 'utf8')

    const result = await collectEdidFixturesFromFile(filePath, workdir)
    expect(result).toBeNull()
  })

  it('returns a fixture with linuxhw source and a relative path name', async () => {
    const vendorDir = join(workdir, 'TestCo', 'TEST0001')
    await mkdir(vendorDir, { recursive: true })
    const filePath = join(vendorDir, 'ABCDEF123456')

    // Build a 128-byte file with the EDID signature; checksum is intentionally
    // not verified at this layer (isFullEdid only checks the signature).
    const bytes = new Uint8Array(128)
    bytes.set([0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00], 0)
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' ')
    const text = ['edid-decode (hex):', '', hex.slice(0, 16 * 3 - 1), hex.slice(16 * 3)].join('\n')
    await writeFile(filePath, text + '\n', 'utf8')

    const result = await collectEdidFixturesFromFile(filePath, workdir)
    expect(result).not.toBeNull()
    expect(result!.source).toBe('linuxhw')
    expect(result!.name).toBe('TestCo/TEST0001/ABCDEF123456')
    expect(isFullEdid(result!.data)).toBe(true)
  })
})

describe('collectEdidFixturesFromDirectory', () => {
  let workdir: string

  beforeEach(async () => {
    workdir = await mkdtemp(join(tmpdir(), 'edid-fixture-dir-'))
  })

  afterEach(async () => {
    await rm(workdir, { recursive: true, force: true })
  })

  function minimalEdidText(): string {
    const bytes = new Uint8Array(128)
    bytes.set([0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00], 0)
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' ')
    const lines: string[] = []
    for (let i = 0; i < 128; i += 16) {
      lines.push(hex.slice(i * 3, i * 3 + 16 * 3 - 1))
    }
    return ['edid-decode (hex):', '', ...lines, '----------------', 'Block 0, Base EDID:'].join('\n') + '\n'
  }

  it('returns an empty array when the directory does not exist', async () => {
    const result = await collectEdidFixturesFromDirectory(join(workdir, 'does-not-exist'))
    expect(result).toEqual([])
  })

  it('walks nested vendor/model directories and sorts results', async () => {
    await mkdir(join(workdir, 'Aco', 'ACO0001'), { recursive: true })
    await mkdir(join(workdir, 'Zco', 'ZCO0001'), { recursive: true })
    await writeFile(join(workdir, 'Aco', 'ACO0001', 'aaaa'), minimalEdidText(), 'utf8')
    await writeFile(join(workdir, 'Zco', 'ZCO0001', 'zzzz'), minimalEdidText(), 'utf8')

    const result = await collectEdidFixturesFromDirectory(workdir)
    expect(result.map(c => c.name)).toEqual([
      'Aco/ACO0001/aaaa',
      'Zco/ZCO0001/zzzz',
    ])
  })

  it('skips files that fail validation but still returns valid ones', async () => {
    await mkdir(join(workdir, 'mixed'), { recursive: true })
    await writeFile(join(workdir, 'mixed', 'good'), minimalEdidText(), 'utf8')
    await writeFile(join(workdir, 'mixed', 'garbage'), 'not an edid\n', 'utf8')

    const result = await collectEdidFixturesFromDirectory(workdir)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('mixed/good')
  })
})

describe('applyFixtureLimit', () => {
  const makeCases = (n: number, source: 'linuxhw' | 'fixtures' = 'linuxhw') =>
    Array.from({ length: n }, (_, i) => ({
      name: `${source}-${i}`,
      data: new Uint8Array(128),
      source,
    }))

  it('returns all fixtures when limit is 0', () => {
    const cases = makeCases(10)
    expect(applyFixtureLimit(cases, 0)).toHaveLength(10)
  })

  it('returns all fixtures when limit exceeds input size', () => {
    const cases = makeCases(5)
    expect(applyFixtureLimit(cases, 100)).toHaveLength(5)
  })

  it('samples deterministically with uniform spread when limiting one source', () => {
    const cases = makeCases(100)
    const sample = applyFixtureLimit(cases, 10)
    expect(sample).toHaveLength(10)
    // First element is the start; with step = 10, last element is index 90.
    expect(sample[0].name).toBe('linuxhw-0')
    expect(sample[9].name).toBe('linuxhw-90')
    // No two adjacent elements should be within less than 5 of each other
    // (this would catch a regression to "take the first N").
    for (let i = 1; i < sample.length; i += 1) {
      const prev = Number(sample[i - 1].name.split('-')[1])
      const curr = Number(sample[i].name.split('-')[1])
      expect(curr - prev).toBeGreaterThanOrEqual(5)
    }
  })

  it('distributes the sample across sources so each is represented', () => {
    const cases = [...makeCases(100, 'linuxhw'), ...makeCases(5, 'fixtures')]
    const sample = applyFixtureLimit(cases, 6)
    expect(sample).toHaveLength(6)
    const sources = new Set(sample.map(c => c.source))
    // With 2 sources, per-source = floor(6/2) = 3, so both are represented.
    expect(sources).toEqual(new Set(['linuxhw', 'fixtures']))
  })
})

describe('loadEdidFixtures', () => {
  it('points the default linuxhw dir at tests/fixtures-linuxhw', () => {
    expect(LINUXHW_FIXTURE_DIR).toMatch(/tests[\\/]fixtures-linuxhw$/)
  })

  it('returns in-module fixtures plus (empty) linuxhw when no corpus is present', async () => {
    const fixtures = await loadEdidFixtures()
    // The basic fixtures.ts module ships at least one EDID; the proprietary
    // file is gitignored but may be present locally.
    expect(fixtures.length).toBeGreaterThan(0)
    const inModuleSources = fixtures.filter(f => f.source !== 'linuxhw')
    expect(inModuleSources.length).toBeGreaterThan(0)
    // Every in-module fixture must come from one of the in-module sources.
    const allowedSources = new Set(['fixtures', 'fixtures_proprietary'])
    expect(inModuleSources.every(f => allowedSources.has(f.source))).toBe(true)
    // No linuxhw dir present in CI/worktree, so no linuxhw entries.
    expect(fixtures.some(f => f.source === 'linuxhw')).toBe(false)
  })

  it('uses the in-module basic fixtures when proprietary is absent', () => {
    const basic = collectEdidFixturesFromModule(basicFixtures, 'fixtures')
    expect(basic.length).toBeGreaterThan(0)
    expect(basic.every(f => f.source === 'fixtures')).toBe(true)
  })
})
