// One-off streamed corpus round-trip for DisplayID 1.x.
//
// Walks the linuxhw/EDID corpus one file at a time (async opendir iterator, not
// recursive readdir, so 175k files don't trip EMFILE) and, for every fixture
// carrying a DisplayID (0x70) extension, verifies:
//   - v1.x sections (version byte 0x10–0x1F) decode to a structured
//     DisplayIdExtension, NOT an OpaqueExtension fallback (AC #1/#4);
//   - the DisplayID extension block round-trips byte-exactly through
//     decode → encode (AC #2: known v1.x blocks; AC #3: unknown tags preserved).
//
// Run: npx tsx tests/corpus-v1-roundtrip.ts [corpus-dir]
// Default corpus dir is the repo-root tests/fixtures-linuxhw clone.

import { opendir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { EEDID, encodeExtension, type Extension } from '../src/eedid'
import { isDisplayIdExtension } from '../src/eedid/extension'
import { extractEdidBytesFromText } from './fixture-loader'

const corpusDir = resolve(process.argv[2] ?? '../../../tests/fixtures-linuxhw')

interface Stats {
  files: number
  parseable: number
  withDisplayId: number
  didV1: number
  didV2: number
  v1Structured: number
  v1Opaque: number
  blockRoundTripPass: number
  blockRoundTripFail: number
  checksumNormalized: number
  failByVersion: Map<string, number>
  failures: string[]
}

async function* walk(dir: string): AsyncGenerator<string> {
  // Stream entries one at a time; descend into subdirectories lazily.
  const handle = await opendir(dir)
  for await (const entry of handle) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(path)
    } else if (entry.isFile()) {
      yield path
    }
  }
}

function extensionBlockBytes(data: Uint8Array, blockIndex: number): Uint8Array | null {
  // Extension blocks start at byte 128; each is 128 bytes.
  const start = 128 + blockIndex * 128
  return start + 128 <= data.length ? data.subarray(start, start + 128) : null
}

async function main() {
  const stats: Stats = {
    files: 0,
    parseable: 0,
    withDisplayId: 0,
    didV1: 0,
    didV2: 0,
    v1Structured: 0,
    v1Opaque: 0,
    blockRoundTripPass: 0,
    blockRoundTripFail: 0,
    checksumNormalized: 0,
    failByVersion: new Map<string, number>(),
    failures: [],
  }

  for await (const file of walk(corpusDir)) {
    stats.files += 1
    if (stats.files % 20000 === 0) {
      console.error(`  ...scanned ${stats.files} files (DisplayID: ${stats.withDisplayId}, v1.x: ${stats.didV1})`)
    }

    let text: string
    try {
      text = await readFile(file, 'utf8')
    } catch {
      continue
    }
    const data = extractEdidBytesFromText(text)
    if (!data) continue
    stats.parseable += 1

    let extensions: Extension[]
    try {
      extensions = EEDID.decode(data).extensions
    } catch {
      continue
    }

    const didExt = extensions.find((e): e is Extension => e.tag === 0x70)
    if (!didExt) continue
    stats.withDisplayId += 1

    // Locate the 0x70 block's index for byte extraction.
    let didBlockIndex = -1
    for (let i = 0; i < extensions.length; i += 1) {
      if (extensions[i].tag === 0x70) { didBlockIndex = i; break }
    }
    const originalBlock = extensionBlockBytes(data, didBlockIndex)

    const versionByte = (didExt as { section?: { versionByte?: number } }).section?.versionByte ?? 0
    const isV1 = versionByte >= 0x10 && versionByte < 0x20
    const isV2 = versionByte === 0x20

    if (isV1) {
      stats.didV1 += 1
      if (isDisplayIdExtension(didExt)) {
        stats.v1Structured += 1
      } else {
        stats.v1Opaque += 1
        if (stats.failures.length < 20) {
          stats.failures.push(`v1.x OPAQUE: ${file} (versionByte 0x${versionByte.toString(16)})`)
        }
      }
    } else if (isV2) {
      stats.didV2 += 1
    }

    // Per-extension-block round-trip gated on CONTENT fidelity (AC #2 known
    // blocks + AC #3 unknown-tag preservation). The structured encoder
    // recomputes the per-section checksum (and the EDID block checksum at byte
    // 127 derives from it), so fixtures whose original section checksum is
    // INVALID are normalized on re-encode — a byte diff at those positions is
    // expected and shared with the v2.0 encoder, not a v1.x codec regression.
    // We therefore exclude section-checksum bytes and the derived block
    // checksum (127) from the content gate and report checksum normalizations
    // separately.
    if (originalBlock) {
      try {
        const reencoded = encodeExtension(didExt)
        // Absolute positions of each carried section's checksum byte, and the
        // subset that were invalid in the source fixture.
        const checksumPositions = new Set<number>([127])
        const invalidChecksumPositions = new Set<number>()
        if (isDisplayIdExtension(didExt)) {
          let cursor = 1 // byte 0 is the 0x70 EDID tag
          for (const s of didExt.sections ?? [didExt.section]) {
            const csPos = cursor + s.totalLength - 1
            checksumPositions.add(csPos)
            if (s.isChecksumValid === false) invalidChecksumPositions.add(csPos)
            cursor += s.totalLength
          }
        }

        let contentDiffs = 0
        let checksumNormalizations = 0
        for (let i = 0; i < reencoded.length; i++) {
          if (reencoded[i] === originalBlock[i]) continue
          if (checksumPositions.has(i)) {
            // A checksum byte differs. If the source section was invalid, this
            // is normalization; otherwise it's an unexpected checksum change.
            if (invalidChecksumPositions.has(i) || i === 127) {
              checksumNormalizations += 1
            } else {
              contentDiffs += 1
            }
          } else {
            contentDiffs += 1
          }
        }

        if (contentDiffs === 0) {
          stats.blockRoundTripPass += 1
          if (checksumNormalizations > 0) stats.checksumNormalized += 1
        } else {
          stats.blockRoundTripFail += 1
          const vkey = `0x${versionByte.toString(16)}`
          stats.failByVersion.set(vkey, (stats.failByVersion.get(vkey) ?? 0) + 1)
          if (stats.failures.length < 20) {
            stats.failures.push(`content MISMATCH (${contentDiffs} bytes): ${file} (versionByte 0x${versionByte.toString(16)})`)
          }
        }
      } catch (err) {
        stats.blockRoundTripFail += 1
        const vkey = `0x${versionByte.toString(16)}`
        stats.failByVersion.set(vkey, (stats.failByVersion.get(vkey) ?? 0) + 1)
        if (stats.failures.length < 20) {
          stats.failures.push(`block round-trip THREW: ${file}: ${(err as Error).message}`)
        }
      }
    }
  }

  console.log('=== DisplayID 1.x corpus round-trip ===')
  console.log(`corpus dir:        ${corpusDir}`)
  console.log(`files scanned:     ${stats.files}`)
  console.log(`parseable EDIDs:   ${stats.parseable}`)
  console.log(`with DisplayID:    ${stats.withDisplayId}`)
  console.log(`  v1.x sections:   ${stats.didV1}  (structured: ${stats.v1Structured}, opaque: ${stats.v1Opaque})`)
  console.log(`  v2.0 sections:   ${stats.didV2}`)
  console.log(`block round-trip:   pass=${stats.blockRoundTripPass} fail=${stats.blockRoundTripFail} (checksum-normalized: ${stats.checksumNormalized})`)
  if (stats.failByVersion.size > 0) {
    console.log(`  fail by version:  ${[...stats.failByVersion.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`)
  }
  if (stats.failures.length > 0) {
    console.log(`\nfirst ${stats.failures.length} content failures:`)
    for (const f of stats.failures) console.log(`  ${f}`)
  }

  // The bar: every v1.x section decodes structured (not opaque) AND
  // every v1.x block's CONTENT round-trips byte-exactly (known blocks AC #2 +
  // unknown tags AC #3). Checksum normalization on invalid-source fixtures is
  // shared with the v2.0 encoder and excluded from the gate.
  const v1xFails = [...stats.failByVersion.entries()]
    .filter(([k]) => {
      const v = Number.parseInt(k, 16)
      return v >= 0x10 && v < 0x20
    })
    .reduce((sum, [, v]) => sum + v, 0)
  const ok = stats.v1Opaque === 0 && v1xFails === 0
  console.log(`\nRESULT: ${ok ? 'PASS' : 'FAIL'} (v1.x structured=${stats.v1Opaque === 0}, v1.x content-exact=${v1xFails === 0}; ${stats.checksumNormalized} fixtures had invalid section checksums normalized by the encoder)`)
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error('corpus round-trip crashed:', err)
  process.exit(1)
})