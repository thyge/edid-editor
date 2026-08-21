import { existsSync } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as basicFixtures from './fixtures'
import { hexToUint8Array } from './fixture-utils'

export interface EdidFixtureCase {
  name: string
  data: Uint8Array
  source: 'fixtures' | 'fixtures_proprietary' | 'linuxhw'
  /**
   * The edid-decode human-readable text portion of a linuxhw corpus file (the
   * decoded text after the `edid-decode (hex):` block), retained only when the
   * loader is asked for it via `includeText`. Undefined for in-module fixtures
   * (which are raw bytes, not edid-decode dumps) and when `includeText` is
   * false. Used by the cross-parser oracle (TASK-58) to assert decoded field
   * values match edid-decode.
   */
  text?: string
}

type FixtureModule = Record<string, unknown>

const currentDir = dirname(fileURLToPath(import.meta.url))
const proprietaryFixturePath = join(currentDir, 'fixtures_proprietary.ts')
const edidSignature = [0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00]

/**
 * Default location of the linuxhw/EDID clone (per CLAUDE.md): this package's
 * `tests/fixtures-linuxhw`. Gitignored; absent in CI/worktrees, in which case
 * the loader silently returns no linuxhw fixtures. The cross-parser oracle
 * (corpus-field-oracle.test.ts / corpus-field-oracle.ts) resolves the corpus
 * dir itself with a canonical→repo-root fallback, so it works even when the
 * clone lives at the repo-root `tests/fixtures-linuxhw` instead.
 */
export const LINUXHW_FIXTURE_DIR = join(currentDir, 'fixtures-linuxhw')

/** env var: positive number = sample size, 0/unset = no limit. */
export const FIXTURE_LIMIT_ENV = 'EDID_FIXTURE_LIMIT'

export function isFullEdid(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
    && value.length >= 128
    && edidSignature.every((byte, index) => value[index] === byte)
}

export function collectEdidFixturesFromModule(
  module: FixtureModule,
  source: EdidFixtureCase['source'] = 'fixtures',
): EdidFixtureCase[] {
  return Object.entries(module)
    .filter(([, value]) => isFullEdid(value))
    .map(([name, data]) => ({
      name,
      data: data as Uint8Array,
      source,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * linuxhw/EDID files are `edid-decode` output: an `edid-decode (hex):` header,
 * then a hex block (16 bytes per line), then a `---` separator, then
 * human-readable decoded text. Trim to the hex block, then defer all
 * whitespace/numeric parsing to the canonical `hexToUint8Array`.
 */
export function extractEdidBytesFromText(text: string): Uint8Array | null {
  const header = text.match(/^edid-decode\s*\(hex\)\s*:\s*\n/i)
  const afterHeader = header ? text.slice(header[0].length) : text
  const sepIdx = afterHeader.indexOf('\n---')
  const hexBlock = sepIdx >= 0 ? afterHeader.slice(0, sepIdx) : afterHeader
  const bytes = hexToUint8Array(hexBlock)
  return isFullEdid(bytes) ? bytes : null
}

/**
 * Extract the edid-decode human-readable text portion of a corpus dump — the
 * content AFTER the `edid-decode (hex):` hex block (everything from the first
 * `---` separator onward: decoded fields, warnings, failures, conformity).
 * Returns the empty string if there is no text portion (e.g. a bare hex dump).
 * The hex extraction in `extractEdidBytesFromText` is unchanged.
 */
export function extractEdidText(text: string): string {
  const header = text.match(/^edid-decode\s*\(hex\)\s*:\s*\n/i)
  const afterHeader = header ? text.slice(header[0].length) : text
  const sepIdx = afterHeader.indexOf('\n---')
  return sepIdx >= 0 ? afterHeader.slice(sepIdx + 1) : ''
}

export async function collectEdidFixturesFromFile(
  filePath: string,
  baseDir: string,
  includeText = false,
): Promise<EdidFixtureCase | null> {
  const text = await readFile(filePath, 'utf8')
  const data = extractEdidBytesFromText(text)
  if (!data) return null

  const relativePath = relative(baseDir, filePath).split(sep).join('/')
  return {
    name: relativePath,
    data,
    source: 'linuxhw',
    ...(includeText ? { text: extractEdidText(text) } : {}),
  }
}

export async function collectEdidFixturesFromDirectory(
  dir: string = LINUXHW_FIXTURE_DIR,
  includeText = false,
): Promise<EdidFixtureCase[]> {
  let info: import('node:fs').Stats
  try { info = await stat(dir) } catch { return [] }
  if (!info.isDirectory()) return []

  // recursive readdir returns mixed file/dir entries; keep only files.
  // parentPath is on Node 20.1+; path is on 20.0 (deprecated from 20.1).
  // Both point to the entry's parent directory (absolute path).
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  const files = entries
    .filter(e => e.isFile())
    .map(e => join(e.parentPath ?? e.path, e.name))

  const cases = (await Promise.all(
    files.map(file => collectEdidFixturesFromFile(file, dir, includeText)),
  )).filter((c): c is EdidFixtureCase => c !== null)

  cases.sort((a, b) => a.name.localeCompare(b.name))
  return cases
}

/**
 * Sample down to `limit` cases, distributing proportionally across sources so
 * each source is represented (a flat alphabetical sample concentrates on
 * whichever source sorts first). With limit=0 or limit>=length, returns
 * the input unchanged.
 */
export function applyFixtureLimit(
  cases: EdidFixtureCase[],
  limit: number,
): EdidFixtureCase[] {
  if (limit <= 0 || cases.length <= limit) return cases

  const bySource = new Map<EdidFixtureCase['source'], EdidFixtureCase[]>()
  for (const c of cases) {
    const list = bySource.get(c.source) ?? []
    list.push(c)
    bySource.set(c.source, list)
  }
  const perSource = Math.max(1, Math.floor(limit / bySource.size))
  const sampled: EdidFixtureCase[] = []
  for (const list of bySource.values()) {
    sampled.push(...sampleEveryNth(list, perSource))
  }
  return sampled.slice(0, limit)
}

function sampleEveryNth<T>(items: T[], count: number): T[] {
  if (count <= 0 || items.length <= count) return items
  const step = items.length / count
  const result: T[] = []
  for (let i = 0; i < count; i += 1) {
    result.push(items[Math.floor(i * step)])
  }
  return result
}

function readFixtureLimit(): number {
  const raw = process.env[FIXTURE_LIMIT_ENV]
  if (raw === undefined || raw === '') return 0
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

/** Load the in-module fixtures: proprietary if present and non-empty, else basic. */
async function loadInModuleFixtures(): Promise<EdidFixtureCase[]> {
  if (existsSync(proprietaryFixturePath)) {
    try {
      const mod = await import(pathToFileURL(proprietaryFixturePath).href)
      const proprietary = collectEdidFixturesFromModule(mod, 'fixtures_proprietary')
      if (proprietary.length > 0) return proprietary
    } catch {
      // Treat import errors as "no proprietary available" — fall through to basic.
    }
  }
  return collectEdidFixturesFromModule(basicFixtures as FixtureModule, 'fixtures')
}

export interface LoadFixturesOptions {
  /** Override the linuxhw directory location. Defaults to LINUXHW_FIXTURE_DIR. */
  linuxhwDir?: string
  /** Override the EDID_FIXTURE_LIMIT env var. 0 = no limit. */
  limit?: number
  /**
   * When true, retain the edid-decode text portion on linuxhw fixture cases
   * (populates `EdidFixtureCase.text`). In-module fixtures never carry text.
   * Used by the cross-parser oracle (TASK-58).
   */
  includeText?: boolean
}

export async function loadEdidFixtures(
  options: LoadFixturesOptions = {},
): Promise<EdidFixtureCase[]> {
  const inModule = await loadInModuleFixtures()
  const linuxhw = await collectEdidFixturesFromDirectory(
    options.linuxhwDir ?? LINUXHW_FIXTURE_DIR,
    options.includeText ?? false,
  )
  return applyFixtureLimit(
    [...inModule, ...linuxhw],
    options.limit ?? readFixtureLimit(),
  )
}
