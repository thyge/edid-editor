/**
 * Cross-parser field oracle.
 *
 * For every linuxhw corpus fixture that carries an edid-decode text dump, assert
 * our decoded field values match edid-decode's printed values for the defined
 * field set (see edid-decode-oracle.ts). Hard mismatches are real decode bugs or
 * untriaged parser differences; soft (allowlisted) ones are reported but do not
 * fail.
 *
 * This is a regression gate: the oracle is tuned to edid-decode's parsing
 * semantics (see ALLOWLIST and the composite-sync / interlaced / < 10 MHz
 * handling in edid-decode-oracle.ts), so the expected hard-mismatch count is the
 * documented BASELINE below. A new decode bug or parser regression surfaces as
 * a hard mismatch above the baseline and fails the gate.
 *
 * Configurable via EDID_FIXTURE_LIMIT: a positive number streams only that many
 * corpus files (fast sample); 0/unset streams the full corpus (slow, but
 * comprehensive — run via `npm run test:corpus`). The corpus is walked with
 * opendir and read one file at a time so a sample does NOT load all 175k files
 * into memory. Without the gitignored linuxhw clone this is a no-op (no files)
 * and passes vacuously.
 */
import { describe, it, expect } from 'vitest'
import { opendir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EEDID } from '../src/eedid/eedid'
import { extractEdidBytesFromText, extractEdidText, LINUXHW_FIXTURE_DIR } from './fixture-loader'
import {
  parseOracleReport,
  extractOurReport,
  compareReports,
  hardMismatches,
} from './edid-decode-oracle'

const sampleLimit = Number.parseInt(process.env.EDID_FIXTURE_LIMIT ?? '0', 10) || 0

/**
 * Resolve the linuxhw corpus directory: prefer the canonical
 * `packages/edidts/tests/fixtures-linuxhw` (LINUXHW_FIXTURE_DIR); fall back to
 * the repo-root `tests/fixtures-linuxhw` clone when the canonical path is
 * absent. Both are gitignored. This is local to the oracle so the fixture
 * loader's default (and `npm run test:corpus`) behavior is unchanged — the
 * loader keeps pointing at the canonical path only.
 */
const here = dirname(fileURLToPath(import.meta.url))
const CORPUS_DIR = existsSync(LINUXHW_FIXTURE_DIR)
  ? LINUXHW_FIXTURE_DIR
  : join(here, '../../../tests/fixtures-linuxhw')

interface Case {
  name: string
  data: Uint8Array
  text: string
}

async function* walk(dir: string): AsyncGenerator<string> {
  const handle = await opendir(dir)
  for await (const entry of handle) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.isFile()) yield path
  }
}

/** Stream up to `limit` (0 = all) corpus fixtures carrying edid-decode text. */
async function loadCases(limit: number): Promise<Case[]> {
  const cases: Case[] = []
  try {
    for await (const file of walk(CORPUS_DIR)) {
      if (limit > 0 && cases.length >= limit) break
      let text: string
      try { text = await readFile(file, 'utf8') } catch { continue }
      if (!text.includes('edid-decode (hex)')) continue
      const data = extractEdidBytesFromText(text)
      if (!data) continue
      const dump = extractEdidText(text)
      if (!dump.trim()) continue
      cases.push({ name: file, data, text: dump })
    }
  } catch {
    // corpus dir absent — return empty (vacuous pass)
  }
  return cases
}

const cases = await loadCases(sampleLimit)

/**
 * Documented baseline of hard mismatches the full corpus still produces after
 * the oracle was tuned to edid-decode's parsing semantics. Each entry caps the
 * number of hard mismatches allowed for that field. A field absent from this
 * map must have zero hard mismatches. A real decode bug filed as a follow-up
 * is listed here so the gate stays green until it is fixed; once fixed the
 * entry is removed and the field must return to zero.
 *
 * Update this map only after re-running the full corpus
 * (npx tsx tests/corpus-field-oracle.ts <corpus> 0) and confirming the counts.
 *
 * Currently empty: the previous `base.dtds`: 275 entry (all SPWG Notebook
 * Panel EDIDs — AU Optronics / HannStar laptop panels) was resolved by
 * implementing SPWG detection and DTD 2 sync-flags relocation
 * (edid-decode parse-base-block.cpp:973). A full-corpus run now reports 0 hard
 * mismatches across 174759 compared fixtures.
 */
const BASELINE: Record<string, number> = {}

describe('Cross-parser field oracle', () => {
  // Vacuous pass when no corpus is available (no linuxhw clone present).
  if (cases.length === 0) {
    it('skips when no edid-decode text fixtures are available', () => {
      expect(cases.length).toBe(0)
    })
    return
  }

  // Per-fixture gate: a hard mismatch in a field NOT covered by the baseline is
  // an unexpected regression and fails here with the offending file. Hard
  // mismatches in baseline fields (e.g. base.dtds/SPWG) are tolerated per
  // fixture; the aggregate test below guards their total stays within budget.
  it.each(cases)(
    'no unexpected hard mismatch for $name',
    ({ data, text }) => {
      const eedid = EEDID.decode(data)
      const hard = hardMismatches(
        compareReports(parseOracleReport(text), extractOurReport(eedid)),
      )
      const unexpected = hard.filter((m) => !(m.field in BASELINE))
      if (unexpected.length > 0) {
        const details = unexpected
          .map((m) => `${m.field}: oracle=${JSON.stringify(m.oracle)} ours=${JSON.stringify(m.ours)}`)
          .join('\n  ')
        expect.fail(`${unexpected.length} unexpected hard mismatch(es):\n  ${details}`)
      }
    },
  )

  it('hard-mismatch counts are within the documented baseline per field', () => {
    const counts = new Map<string, number>()
    for (const { data, text } of cases) {
      const eedid = EEDID.decode(data)
      const hard = hardMismatches(compareReports(parseOracleReport(text), extractOurReport(eedid)))
      for (const m of hard) counts.set(m.field, (counts.get(m.field) ?? 0) + 1)
    }
    const seen = [...counts.entries()]
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)

    const over: { field: string; count: number }[] = []
    const unexpected: { field: string; count: number }[] = []
    for (const { field, count } of seen) {
      const cap = BASELINE[field] ?? 0
      if (count > cap) over.push({ field, count })
    }
    // Fields not in the baseline must be exactly zero (already implied by
    // cap=0, but report them distinctly for the failure message).
    for (const { field } of seen) if (!(field in BASELINE)) unexpected.push({ field, count: counts.get(field)! })

    if (over.length > 0 || unexpected.length > 0) {
      const msg = [
        'hard-mismatch counts exceeded the documented baseline:',
        ...over.map((o) => `  ${o.field}: ${o.count} > ${BASELINE[o.field] ?? 0}`),
        ...unexpected.map((u) => `  ${u.field}: ${u.count} (not in baseline)`),
        're-run the full corpus (npx tsx tests/corpus-field-oracle.ts <corpus> 0)',
        'and update BASELINE after triaging any new mismatch.',
      ].join('\n')
      expect.fail(msg)
    }
  })
})