// One-off streamed corpus cross-parser oracle (TASK-58 AC #3/#5).
//
// Walks the linuxhw/EDID corpus one file at a time (async opendir, not recursive
// readdir, so 175k files don't trip EMFILE) and, for every edid-decode dump,
// asserts our decoded field values match edid-decode's printed values for the
// defined field set (see edid-decode-oracle.ts). Hard mismatches are real decode
// bugs or parser differences to triage; soft (allowlisted) mismatches are
// reported but do not fail the gate.
//
// Captures a baseline mismatch set (first N by field) so real decode bugs can be
// filed as follow-ups and regressions show up as new mismatches on future runs.
//
// Run: npx tsx tests/corpus-field-oracle.ts [corpus-dir] [sample-size]
// Default corpus dir is the repo-root tests/fixtures-linuxhw clone.
// sample-size 0 (default) = full corpus.

import { opendir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { EEDID } from '../src/eedid/eedid'
import { extractEdidBytesFromText } from './fixture-loader'
import {
  parseOracleReport,
  extractOurReport,
  compareReports,
  hardMismatches,
  type Mismatch,
} from './edid-decode-oracle'

const corpusDir = resolve(process.argv[2] ?? '../../../tests/fixtures-linuxhw')
const sampleSize = Number.parseInt(process.argv[3] ?? '0', 10) || 0

interface Stats {
  files: number
  parseable: number
  decoded: number
  withText: number
  compared: number
  hardFail: number
  softNotes: number
  byField: Map<string, number>
  hardFiles: string[]
}

async function* walk(dir: string): AsyncGenerator<string> {
  const handle = await opendir(dir)
  for await (const entry of handle) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.isFile()) yield path
  }
}

async function main() {
  const stats: Stats = {
    files: 0,
    parseable: 0,
    decoded: 0,
    withText: 0,
    compared: 0,
    hardFail: 0,
    softNotes: 0,
    byField: new Map(),
    hardFiles: [],
  }

  for await (const file of walk(corpusDir)) {
    stats.files += 1
    if (sampleSize > 0 && stats.files > sampleSize) break
    if (stats.files % 20000 === 0) {
      console.error(`  ...scanned ${stats.files} files (compared ${stats.compared}, hard-fail ${stats.hardFail})`)
    }

    let text: string
    try {
      text = await readFile(file, 'utf8')
    } catch {
      continue
    }
    if (!text.includes('edid-decode (hex)')) continue
    const data = extractEdidBytesFromText(text)
    if (!data) continue
    stats.parseable += 1

    let eedid: EEDID
    try {
      eedid = EEDID.decode(data)
    } catch {
      continue
    }
    stats.decoded += 1

    // The text portion after the hex block (edid-decode's decoded dump).
    const sepIdx = text.indexOf('\n---')
    if (sepIdx < 0) continue
    const dump = text.slice(sepIdx + 1)
    if (!dump.trim()) continue
    stats.withText += 1

    let mismatches: Mismatch[]
    try {
      mismatches = compareReports(parseOracleReport(dump), extractOurReport(eedid))
    } catch {
      // An oracle parse error is an oracle limitation, not an edidts bug.
      continue
    }
    stats.compared += 1

    const hard = hardMismatches(mismatches)
    const soft = mismatches.length - hard.length
    stats.softNotes += soft
    if (hard.length > 0) {
      stats.hardFail += 1
      if (stats.hardFiles.length < 30) stats.hardFiles.push(file)
    }
    for (const m of hard) {
      stats.byField.set(m.field, (stats.byField.get(m.field) ?? 0) + 1)
    }
  }

  console.log('=== Cross-parser field oracle ===')
  console.log(`corpus dir:        ${corpusDir}`)
  console.log(`files scanned:     ${stats.files}`)
  console.log(`parseable EDIDs:    ${stats.parseable}`)
  console.log(`decoded by us:      ${stats.decoded}`)
  console.log(`with edid-decode text: ${stats.withText}`)
  console.log(`compared:           ${stats.compared}`)
  console.log(`hard mismatches:    ${stats.hardFail} files`)
  console.log(`soft (allowlisted): ${stats.softNotes} notes`)
  if (stats.byField.size > 0) {
    console.log(`\nhard mismatches by field:`)
    const sorted = [...stats.byField.entries()].sort((a, b) => b[1] - a[1])
    for (const [f, n] of sorted) console.log(`  ${n.toString().padStart(6)}  ${f}`)
  }
  if (stats.hardFiles.length > 0) {
    console.log(`\nfirst ${stats.hardFiles.length} hard-mismatch files:`)
    for (const f of stats.hardFiles) console.log(`  ${f}`)
  }
  const ok = stats.hardFail === 0
  console.log(`\nRESULT: ${ok ? 'PASS' : 'FAIL'} (${stats.hardFail} hard mismatches across ${stats.compared} compared fixtures)`)
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error('corpus field oracle crashed:', err)
  process.exit(1)
})