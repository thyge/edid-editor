/**
 * Turn pasted or saved EDID hex text into bytes. Accepts the formats people
 * usually have an EDID in:
 *
 * - plain hex, with or without separators: `00 FF FF …`, `00,FF,…`, `00ffff…`
 * - C / Python arrays: `{ 0x00, 0xff, … }`, `b'\x00\xff…'`
 * - `xxd` dumps: `00000000: 00ff ffff ffff ff00 …  ........`
 * - `hexdump -C` / `od -tx1` dumps, including `*` lines for repeated rows
 *   (`od`'s octal offsets are detected)
 * - whole `xrandr --verbose` or `edid-decode` output: labels, other
 *   properties and the decoded text are skipped
 * - Windows registry exports: `"EDID"=hex:00,ff,…,\`
 *
 * Consecutive data lines form a run; any other non-blank line ends it. The
 * run that starts with the EDID header (00 FF FF FF FF FF FF 00) is used, or
 * the longest run if none does — so stray hex in surrounding text (a
 * `CONNECTOR_ID: 95` property, a `Checksum: 0x9d` line) is never mixed in.
 */
export function parseEdidHex(text: string): Uint8Array {
  const runs: number[][] = []
  let run: number[] = []
  let dump: DumpEntry[] | null = null

  const flushDump = () => {
    if (dump) run.push(...resolveDump(dump))
    dump = null
  }
  const endRun = () => {
    flushDump()
    if (run.length > 0) runs.push(run)
    run = []
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue // blank lines don't split a dump

    if (dump && line === '*') {
      dump.push('*')
      continue
    }
    const dumpLine = parseDumpLine(line, dump !== null)
    if (dumpLine) {
      if (!dump) dump = []
      dump.push(dumpLine)
      continue
    }
    flushDump()

    const bytes = parsePlainLine(line)
    if (bytes) run.push(...bytes)
    else endRun()
  }
  endRun()

  const chosen = runs.find(startsWithEdidHeader) ?? runs.reduce<number[] | undefined>(
    (longest, candidate) => (!longest || candidate.length > longest.length ? candidate : longest),
    undefined,
  )
  if (!chosen) {
    throw new Error('No hex bytes found. Paste the EDID as hex, e.g. "00 FF FF FF FF FF FF 00 …".')
  }
  return new Uint8Array(chosen)
}

/** True when `bytes` look like text rather than binary (used to sniff files). */
export function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false
  for (const b of bytes.subarray(0, 512)) {
    // Allow tab, LF, CR and printable ASCII; anything else means binary.
    if (b !== 0x09 && b !== 0x0a && b !== 0x0d && (b < 0x20 || b > 0x7e)) return false
  }
  return true
}

const EDID_HEADER = [0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00]

function startsWithEdidHeader(bytes: number[]): boolean {
  return EDID_HEADER.every((b, i) => bytes[i] === b)
}

/** `run` as whole bytes, or null if it isn't an even-length run of hex digits. */
function pairsOf(run: string): number[] | null {
  if (run.length === 0 || run.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(run)) return null
  const out: number[] = []
  for (let i = 0; i < run.length; i += 2) out.push(parseInt(run.slice(i, i + 2), 16))
  return out
}

// ---------------------------------------------------------------------------
// Dumps with an offset column (xxd, hexdump -C, od -tx1)
// ---------------------------------------------------------------------------

type DumpEntry = { offset: string; bytes: number[] } | '*'

function parseDumpLine(line: string, inDump: boolean): Exclude<DumpEntry, '*'> | null {
  // xxd: "00000000: 00ff ffff …  ascii" — the hex part ends at the two-space
  // gap before the ASCII column.
  const xxd = /^([0-9a-f]{4,8}):\s+(.*)$/i.exec(line)
  if (xxd) {
    const bytes: number[] = []
    for (const group of xxd[2].split(/\s{2,}/)[0].split(/\s+/)) {
      const pairs = pairsOf(group)
      if (!pairs) return null
      bytes.push(...pairs)
    }
    return { offset: xxd[1], bytes }
  }

  // hexdump -C / od -tx1: offset, single-byte columns, optional |ascii|.
  const columns = /^([0-9a-f]{6,8})\s+(.*)$/i.exec(line)
  if (columns) {
    const tokens = columns[2].replace(/\|.*$/, '').trim().split(/\s+/).filter(Boolean)
    if (tokens.length > 0 && tokens.every((t) => /^[0-9a-f]{2}$/i.test(t))) {
      return { offset: columns[1], bytes: tokens.map((t) => parseInt(t, 16)) }
    }
  }

  // The closing line of hexdump/od is the total length on its own.
  if (inDump && /^[0-9a-f]{6,8}$/i.test(line)) return { offset: line, bytes: [] }
  return null
}

/**
 * Concatenate a dump's rows, expanding `*` (a run of rows identical to the
 * one before it) up to the next row's offset. `od` prints octal offsets by
 * default; the radix is whichever one makes the first two offsets one row
 * apart.
 */
function resolveDump(entries: DumpEntry[]): number[] {
  const rows = entries.filter((e): e is Exclude<DumpEntry, '*'> => e !== '*')
  const out: number[] = []
  if (!entries.includes('*')) {
    for (const row of rows) out.push(...row.bytes)
    return out
  }

  let radix = 16
  const [first, second] = rows
  if (first && second && first.bytes.length > 0) {
    const hexStep = parseInt(second.offset, 16) - parseInt(first.offset, 16)
    const octStep = /^[0-7]+$/.test(first.offset + second.offset)
      ? parseInt(second.offset, 8) - parseInt(first.offset, 8)
      : NaN
    if (hexStep !== first.bytes.length && octStep === first.bytes.length) radix = 8
  }

  let previous: number[] | null = null
  let repeating = false
  for (const entry of entries) {
    if (entry === '*') {
      repeating = true
      continue
    }
    const offset = parseInt(entry.offset, radix)
    if (repeating && previous && previous.length > 0) {
      while (out.length + previous.length <= offset) out.push(...previous)
    }
    repeating = false
    out.push(...entry.bytes)
    if (entry.bytes.length > 0) previous = entry.bytes
  }
  return out
}

// ---------------------------------------------------------------------------
// Everything else: plain hex, arrays, labelled lines
// ---------------------------------------------------------------------------

/** The line's bytes, or null if it isn't a data line. */
function parsePlainLine(rawLine: string): number[] | null {
  // C / Python arrays: every 0x-prefixed or \x-escaped byte on the line,
  // whatever else is there (`unsigned char edid[] = { 0x00, 0xff, …`).
  const prefixed = [...rawLine.matchAll(/(?:0x|\\x)([0-9a-f]{1,2})\b/gi)]
  if (prefixed.length > 0) return prefixed.map((m) => parseInt(m[1], 16))

  // Drop a leading label: `"EDID"=hex:` (registry export), `EDID:` (xrandr),
  // `edid-decode (hex):` … A label is text before ':' containing a non-hex
  // letter, so colon-separated bytes ("00:ff:…") are left alone.
  let line = rawLine.replace(/^.*?=\s*hex(\([0-9a-f]+\))?:/i, '')
  const label = /^[^:]*[g-z][^:]*:(.*)$/i.exec(line)
  if (label) line = label[1]

  // Every token must be whole bytes. Separators include the registry
  // export's trailing line-continuation backslash.
  const tokens = line.split(/[\s,;:{}[\]()\\]+/).filter(Boolean)
  if (tokens.length === 0) return null
  const out: number[] = []
  for (const token of tokens) {
    const pairs = pairsOf(token)
    if (!pairs) return null
    out.push(...pairs)
  }
  return out
}
