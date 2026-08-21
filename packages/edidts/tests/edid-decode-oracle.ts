// Cross-parser field-value oracle (TASK-58).
//
// Each linuxhw/EDID corpus file is an `edid-decode` dump: a hex block plus the
// full human-readable decoded text. `testedids.test.ts` (TASK-47) only asserts
// that blocks decode to the right structured *type*; it never checks that our
// decoded field *values* agree with edid-decode. This module mines the decoded
// text to turn every corpus fixture into a field-level oracle.
//
// It is deliberately scoped to a set of high-value, presentation-stable fields
// (manufacturer, model, manufacture date, image size, gamma, chromaticities,
// detailed-timing signatures, CTA revision/flags, VIC lists, audio formats,
// speaker allocation, DisplayID version + Type 1 timings). Fields whose
// edid-decode wording varies across parser versions (e.g. the CTA underscan
// bit, which has six+ phrasings) are either matched leniently with a "skip when
// the wording is unrecognized" rule or reported as soft (non-failing) notes —
// see `compareReports` and `ALLOWLIST`.
//
// The comparison favours SET/MULTISET matching for collections (DTDs, VICs,
// speakers) so it is immune to ordering and numbering differences: edid-decode
// numbers DTDs globally across the whole EDID (DTD 1, 2 in base; DTD 3, 4, 5 in
// CTA), while our decoder keeps them per-block, so an index-based compare would
// be fragile. A content signature compare is not.

import type { EEDID } from '../src/eedid/eedid'
import { getCEAExtension, getDisplayIdExtension } from '../src/eedid/extension'
import type { CEAExtension } from '../src/eedid/extension'
import type {
  AudioDataBlock,
  VideoDataBlock,
  SpeakerAllocationBlock,
} from '../src/cta/extension-block'
import { DISPLAY_ID_V1_BLOCK_TAGS } from '../src/displayid/types'
import type {
  DisplayIdTypeVIIDetailedTiming,
  DisplayIdV1TypeIDetailedTimingBlock,
} from '../src/displayid/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Polarity normalised to edid-decode's single-letter form ('P' / 'N'). */
type Pol = 'P' | 'N'

/**
 * Content signature of one detailed timing. Polarities are optional: edid-decode
 * omits Vpol (and sometimes Hpol) for composite-sync DTDs, so we only compare a
 * polarity when both sides have it. Numeric sync params (front/sync) are always
 * printed, so they are always compared.
 */
export interface DtdSig {
  ha: number
  va: number
  interlaced: boolean
  pcMHz: number // pixel clock in MHz, rounded to 2 decimals (10 kHz resolution)
  hso: number // Hfront  = horizontalSyncOffset
  hsw: number // Hsync   = horizontalSyncWidth
  hpol?: Pol
  vso: number // Vfront  = verticalSyncOffset
  vsw: number // Vsync   = verticalSyncWidth
  vpol?: Pol
}

export interface Chroma {
  red: [number, number]
  green: [number, number]
  blue: [number, number]
  white: [number, number]
}

export interface AudioDesc {
  channels: number
  sampleRates: number[] // kHz, sorted ascending
  sampleSizes?: number[] // bits, sorted ascending (LPCM only)
}

export interface BaseFields {
  manufacturer?: string
  model?: number
  madeIn?: { week?: number; year: number }
  imageSize?: { kind: 'cm'; h: number; v: number } | { kind: 'ratio'; value: number }
  gamma?: number
  chroma?: Chroma
  dtds: DtdSig[]
}

export interface CtaFields {
  revision?: number
  /** Soft (allowlisted): edid-decode's underscan wording is version-dependent. */
  underscan?: boolean
  basicAudio?: boolean
  ycbcr444?: boolean
  ycbcr422?: boolean
  nativeModes?: number
  vics: { vic: number; native: boolean }[]
  audio: AudioDesc[]
  speakers: string[] // our canonical flag keys, sorted
  dtds: DtdSig[]
}

export interface DisplayIdFields {
  version?: string // "X.Y"
  extensionCount?: number
  dtds: DtdSig[]
}

export interface OracleReport {
  base: BaseFields
  cta: CtaFields | null
  displayid: DisplayIdFields | null
}

export type MismatchSeverity = 'hard' | 'soft'

export interface Mismatch {
  /** Dot path identifying the field, e.g. "base.manufacturer" or "cta.vics". */
  field: string
  severity: MismatchSeverity
  /** edid-decode's value (serialised). */
  oracle: string
  /** our decoder's value (serialised). */
  ours: string
}

// ---------------------------------------------------------------------------
// Text → OracleReport (parse edid-decode's printed values)
// ---------------------------------------------------------------------------

const CTA_FLAG_TRUE_PHRASINGS: Record<string, string[]> = {
  // The CTA underscan bit (byte 3 bit 7) has six+ edid-decode phrasings across
  // corpus versions. All of these mean "underscan supported" (bit set).
  underscan: [
    'Underscans IT Video Formats by default',
    'IT scan behavior: Always Underscanned',
    'IT scan behavior: Supports both over- and underscan',
    'CE scan behavior: Supports both over- and underscan',
  ],
  basicAudio: ['Basic audio support'],
  ycbcr444: ['Supports YCbCr 4:4:4'],
  ycbcr422: ['Supports YCbCr 4:2:2'],
}

const CTA_FLAG_FALSE_PHRASINGS: Record<string, string[]> = {
  underscan: ['IT Video Formats are overscanned by default'],
}

/** Speaker allocation: edid-decode abbreviation → our canonical flag key. */
const SPEAKER_CODE_TO_KEY: Record<string, string> = {
  'FL/FR': 'frontLeftRight',
  LFE1: 'lfe',
  FC: 'frontCenter',
  'BL/BR': 'rearLeftRight',
  BC: 'rearCenter',
  'FLc/FRc': 'frontLeftRightCenter',
  'RLC/RRC': 'rearLeftRightCenter',
  'FLw/FRw': 'frontLeftRightWide',
  'TpFL/TpFR': 'frontLeftRightHigh',
  TpC: 'topCenter',
  TpFC: 'frontCenterHigh',
  'LS/RS': 'surroundLeftRight',
  LFE2: 'lfe2',
  TpBC: 'topBackCenter',
  'SiL/SiR': 'sideLeftRight',
  'TpSiL/TpSiR': 'topSideLeftRight',
  'TpBL/TpBR': 'topBackLeftRight',
  BtFC: 'bottomFrontCenter',
  'BtFL/BtFR': 'bottomFrontLeftRight',
  'TpLS/TpRS': 'topLeftRightSurround',
}

/** A decoded block chunk: header label + body lines. */
interface BlockChunk {
  label: string // "Base EDID" | "CTA-861 Extension Block" | "DisplayID Extension Block"
  index: number
  body: string
}

/**
 * Isolate the decoded portion of an edid-decode dump (everything between the
 * hex block and the `Warnings:` / `Failures:` / `EDID conformity:` boundary).
 * Warnings and failures repeat `Block N, …:` headers at column 0, so we must
 * not parse past the boundary or we'd read warning prose as decoded values.
 */
function decodedPortion(text: string): string {
  // The text portion begins with the `---` separator that follows the hex
  // block (and possibly blank lines). Skip leading dashes/whitespace so the
  // boundary search below does not trip on that separator itself and return an
  // empty decoded portion.
  const start = text.search(/[^\s-]/)
  const body = start >= 0 ? text.slice(start) : text
  const boundary = body.search(/^(-{4,}|Warnings:|Failures:|EDID conformity:)/m)
  return boundary >= 0 ? body.slice(0, boundary) : body
}

/** Split the decoded portion into per-block chunks by `Block N, Label:` headers. */
function splitBlocks(decoded: string): BlockChunk[] {
  const chunks: BlockChunk[] = []
  const lines = decoded.split('\n')
  let cur: BlockChunk | null = null
  const headerRe = /^Block\s+(\d+),\s*(.+?):\s*$/
  for (const line of lines) {
    const m = line.match(headerRe)
    if (m) {
      if (cur) chunks.push(cur)
      cur = { index: Number(m[1]), label: m[2].trim(), body: '' }
    } else if (cur) {
      cur.body += line + '\n'
    }
  }
  if (cur) chunks.push(cur)
  return chunks
}

/** First chunk whose label matches one of `labels`. */
function firstBlock(chunks: BlockChunk[], labels: string[]): BlockChunk | null {
  for (const c of chunks) if (labels.includes(c.label)) return c
  return null
}

// Group 5 captures the rest of the header line after the MHz value (the
// parenthetical carrying the sync-type label, e.g. "(analog composite, ...)").
// Hback/Vback are computed by edid-decode (hbl - hsync - hfp / vbl - vsync - vfp)
// and can go NEGATIVE on malformed DTDs (printed as e.g. "Vback  -13"); Hfront/
// Hsync/Vfront/Vsync are raw unsigned fields we compare directly, so they stay
// `\d+`. The optional `-` on Hback/Vback only stops the computed back porch from
// breaking the line match (we do not compare back porches).
const DTD_HEADER_RE = /^\s+DTD\b[^\n]*?(\d+)x(\d+)(i?)[^\n]*?([\d.]+)\s*MHz([^\n]*)/m
const HFRONT_RE = /^\s+Hfront\s+(\d+)\s+Hsync\s+(\d+)\s+Hback\s+(-?\d+)\s+Hpol\s+([PN])/
const VFRONT_RE = /^\s+Vfront\s+(\d+)\s+Vsync\s+(\d+)\s+Vback\s+(-?\d+)(?:\s+Vpol\s+([PN]))?/

/**
 * edid-decode prints `Hpol`/`Vpol` for every DTD, but for analog/bipolar
 * composite sync the polarity bits are not part of the DTD — the struct fields
 * default to false and are never set, so it always prints "N". For digital
 * composite it prints Hpol (from a real bit) but omits Vpol. For digital separate
 * both are real bits. To compare only meaningful stored fields, we drop the
 * default polarities edid-decode prints for composite sync, matching our
 * decoder which leaves `hSyncPolarity`/`vSyncPolarity` undefined for those sync
 * types. The sync type is read from the parenthetical on the header line:
 * "analog composite" / "bipolar analog composite" → drop both; "digital
 * composite" → keep Hpol (Vpol is not printed anyway); otherwise (digital
 * separate, no composite label) → keep both.
 */
function compositeSyncOf(headerTail: string): 'analog' | 'digital' | 'none' {
  if (/digital composite/.test(headerTail)) return 'digital'
  if (/analog composite/.test(headerTail)) return 'analog'
  return 'none'
}

/**
 * Parse DTD signatures out of a block body via a small state machine. This is
 * shared across base / CTA / DisplayID chunks (DisplayID uses `DTD:` with no
 * number; base/CTA use `DTD  N:`; the header regex handles both). Interlaced
 * DTDs print two Vfront lines (odd/even field additions); we take only the
 * first Vfront after the Hfront line and ignore the rest.
 */
function parseDtdSignatures(body: string): DtdSig[] {
  const sigs: DtdSig[] = []
  const lines = body.split('\n')
  type State = 'idle' | 'have-dtd' | 'have-h'
  let state: State = 'idle'
  let cur: Partial<DtdSig> | null = null
  let composite: 'analog' | 'digital' | 'none' = 'none'

  for (const line of lines) {
    if (state === 'idle' || state === 'have-dtd') {
      const hm = line.match(DTD_HEADER_RE)
      if (hm) {
        // A new DTD header: if we had an unfinished one, drop it (no sync lines).
        cur = {
          ha: Number(hm[1]),
          va: Number(hm[2]),
          interlaced: hm[3] === 'i',
          pcMHz: round2(Number(hm[4])),
        }
        composite = compositeSyncOf(hm[5] ?? '')
        state = 'have-dtd'
        continue
      }
    }
    if (state === 'have-dtd') {
      const hf = line.match(HFRONT_RE)
      if (hf) {
        if (cur) {
          cur.hso = Number(hf[1])
          cur.hsw = Number(hf[2])
          // Hpol is a stored field for digital composite and digital separate
          // only; for analog/bipolar composite edid-decode prints a default "N"
          // that is not a real field, so drop it to match our undefined.
          if (composite !== 'analog') cur.hpol = hf[4] as Pol
        }
        state = 'have-h'
        continue
      }
    }
    if (state === 'have-h') {
      const vf = line.match(VFRONT_RE)
      if (vf && cur) {
        cur.vso = Number(vf[1])
        cur.vsw = Number(vf[2])
        // Vpol is a stored field for digital separate only; edid-decode omits
        // it for digital composite (no Vpol token on this line) and prints a
        // default "N" for analog/bipolar composite. Keep it only for digital
        // separate, and only when the token is actually present.
        if (composite === 'none' && vf[4]) cur.vpol = vf[4] as Pol
        sigs.push(cur as DtdSig)
        cur = null
        state = 'idle'
        continue
      }
    }
  }
  return sigs
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function parseBase(body: string): BaseFields {
  const fields: BaseFields = { dtds: [] }

  const mfg = body.match(/^\s+Manufacturer:\s*(\S+)/m)
  if (mfg) fields.manufacturer = mfg[1]

  const model = body.match(/^\s+Model:\s*(\d+)/m)
  if (model) fields.model = Number(model[1])

  const madeWeek = body.match(/^\s+Made in:\s*week\s+(\d+)\s+of\s+(\d+)/m)
  const madeYear = body.match(/^\s+Made in:\s*(\d+)/m)
  if (madeWeek) {
    fields.madeIn = { week: Number(madeWeek[1]), year: Number(madeWeek[2]) }
  } else if (madeYear) {
    // No week printed: week was 0x00 (not specified) or 0xff (model year). We can
    // only cross-check the year here; the week byte is ambiguous in the text.
    fields.madeIn = { year: Number(madeYear[1]) }
  }

  const imgCm = body.match(/^\s+Maximum image size:\s*(\d+)\s*cm\s*x\s*(\d+)\s*cm/m)
  if (imgCm) {
    fields.imageSize = { kind: 'cm', h: Number(imgCm[1]), v: Number(imgCm[2]) }
  } else {
    const ratio = body.match(/^\s+Aspect ratio:\s*([\d.]+)\s*\((landscape|portrait)\)/m)
    if (ratio) fields.imageSize = { kind: 'ratio', value: Number(ratio[1]) }
  }

  const gamma = body.match(/^\s+Gamma:\s*([\d.]+)/m)
  if (gamma) fields.gamma = Number(gamma[1])

  fields.chroma = parseChroma(body)
  fields.dtds = parseDtdSignatures(body)
  return fields
}

function parseChroma(body: string): Chroma | undefined {
  const grab = (key: string): [number, number] | undefined => {
    const m = body.match(new RegExp(`^\\s+${key}\\s*:\\s*([\\d.]+),\\s*([\\d.]+)`, 'm'))
    return m ? [Number(m[1]), Number(m[2])] : undefined
  }
  const red = grab('Red')
  const green = grab('Green')
  const blue = grab('Blue')
  const white = grab('White')
  if (!red || !green || !blue || !white) return undefined
  return { red, green, blue, white }
}

/**
 * Split a CTA block body into named data-block subsections by their 2-space
 * headers (`  Video Data Block:`, `  Audio Data Block:`, etc.) and the leading
 * flag region (before the first subsection header).
 */
function ctaSubsections(body: string): { flags: string; subs: Map<string, string[]> } {
  const lines = body.split('\n')
  const subs = new Map<string, string[]>()
  let flags = ''
  let cur: string | null = null
  // 2-space indent, colon-terminated, no further indentation on the header line.
  const subHeaderRe = /^  ([A-Za-z][A-Za-z0-9 /()-]*?):\s*$/
  for (const line of lines) {
    const m = line.match(subHeaderRe)
    if (m) {
      cur = m[1].trim()
      subs.set(cur, [])
    } else if (cur) {
      subs.get(cur)!.push(line)
    } else {
      flags += line + '\n'
    }
  }
  return { flags, subs }
}

function parseCta(body: string): CtaFields {
  const { flags, subs } = ctaSubsections(body)
  const fields: CtaFields = { vics: [], audio: [], speakers: [], dtds: [] }

  const rev = flags.match(/^\s+Revision:\s*(\d+)/m)
  if (rev) fields.revision = Number(rev[1])

  fields.underscan = matchBoolFlag(flags, 'underscan')
  fields.basicAudio = matchBoolFlag(flags, 'basicAudio')
  fields.ycbcr444 = matchBoolFlag(flags, 'ycbcr444')
  fields.ycbcr422 = matchBoolFlag(flags, 'ycbcr422')

  const native = flags.match(/native detailed modes:\s*(\d+)/i)
  if (native) fields.nativeModes = Number(native[1])

  // underscan is version-dependent → soft, resolved in compareReports.
  fields.vics = parseVics(subs.get('Video Data Block') ?? [])
  fields.audio = parseAudio(subs.get('Audio Data Block') ?? [])
  fields.speakers = parseSpeakers(subs.get('Speaker Allocation Data Block') ?? [])

  const dtdSub = subs.get('Detailed Timing Descriptors')
  if (dtdSub) fields.dtds = parseDtdSignatures(dtdSub.join('\n'))
  return fields
}

/**
 * Resolve a boolean CTA flag from the flag region. Returns undefined when the
 * wording is unrecognized (so the comparison skips it instead of false-failing
 * on a parser-version difference). For underscan both true and false phrasings
 * are recognised; for the other flags edid-decode only prints anything when the
 * bit is set, so absence → undefined (skip).
 */
function matchBoolFlag(flags: string, key: string): boolean | undefined {
  for (const p of CTA_FLAG_TRUE_PHRASINGS[key] ?? []) if (flags.includes(p)) return true
  for (const p of CTA_FLAG_FALSE_PHRASINGS[key] ?? []) if (flags.includes(p)) return false
  return undefined
}

function parseVics(lines: string[]): { vic: number; native: boolean }[] {
  const vics: { vic: number; native: boolean }[] = []
  for (const line of lines) {
    const m = line.match(/^\s+VIC\s+(\d+):/)
    if (m) vics.push({ vic: Number(m[1]), native: line.includes('(native)') })
  }
  return vics
}

function parseAudio(lines: string[]): AudioDesc[] {
  const descs: AudioDesc[] = []
  // A descriptor block starts at a 4-space `Name:` header; its fields are at
  // 6-space indent. Iterate and bucket.
  let cur: AudioDesc | null = null
  for (const line of lines) {
    const header = line.match(/^    (\S.*?):\s*$/)
    if (header) {
      if (cur) descs.push(cur)
      cur = { channels: 0, sampleRates: [] }
      continue
    }
    if (!cur) continue
    const ch = line.match(/Max channels:\s*(\d+)/)
    if (ch) cur.channels = Number(ch[1])
    const rates = line.match(/Supported sample rates \(kHz\):\s*(.*)/)
    if (rates) {
      cur.sampleRates = rates[1]
        .trim()
        .split(/\s+/)
        .map(Number)
        .sort((a, b) => a - b)
    }
    const sizes = line.match(/Supported sample sizes \(bits\):\s*(.*)/)
    if (sizes) {
      cur.sampleSizes = sizes[1]
        .trim()
        .split(/\s+/)
        .map(Number)
        .sort((a, b) => a - b)
    }
  }
  if (cur) descs.push(cur)
  return descs
}

function parseSpeakers(lines: string[]): string[] {
  const keys = new Set<string>()
  for (const line of lines) {
    const m = line.match(/^\s+(\S+)\s+-\s+/)
    if (m) {
      const key = SPEAKER_CODE_TO_KEY[m[1]]
      if (key) keys.add(key) // unmapped codes (e.g. HDMI LSd/RSd) are skipped.
    }
  }
  return [...keys].sort()
}

function parseDisplayId(body: string): DisplayIdFields {
  const fields: DisplayIdFields = { dtds: [] }
  const ver = body.match(/^\s+Version:\s*(\d+)\.(\d+)/m)
  if (ver) fields.version = `${ver[1]}.${ver[2]}`
  const ext = body.match(/^\s+Extension Count:\s*(\d+)/m)
  if (ext) fields.extensionCount = Number(ext[1])
  fields.dtds = parseDtdSignatures(body)
  return fields
}

/** Parse an edid-decode text dump into comparable field values. */
export function parseOracleReport(text: string): OracleReport {
  const decoded = decodedPortion(text)
  const chunks = splitBlocks(decoded)
  const baseChunk = firstBlock(chunks, ['Base EDID'])
  const ctaChunk = firstBlock(chunks, ['CTA-861 Extension Block'])
  const didChunk = firstBlock(chunks, ['DisplayID Extension Block'])
  return {
    base: baseChunk ? parseBase(baseChunk.body) : { dtds: [] },
    cta: ctaChunk ? parseCta(ctaChunk.body) : null,
    displayid: didChunk ? parseDisplayId(didChunk.body) : null,
  }
}

// ---------------------------------------------------------------------------
// EEDID → OracleReport (extract our decoder's values)
// ---------------------------------------------------------------------------

function polFromStr(p: 'positive' | 'negative' | undefined): Pol | undefined {
  if (p === 'positive') return 'P'
  if (p === 'negative') return 'N'
  return undefined
}

/**
 * Build a DTD signature from our decoded timing. Polarity is included only for
 * the sync types where it is a stored EDID field, mirroring edid-decode: Hpol
 * for digital composite + digital separate; Vpol for digital separate only.
 * For analog/bipolar composite there is no polarity bit, so it is dropped
 * (edid-decode prints a struct-default "N" there that is not a real field).
 *
 * Note: `DetailedTimingDescriptor` normalizes an undefined polarity to
 * `'positive'`, so we cannot rely on undefined-ness here — we gate on
 * `flags.syncType` instead.
 */
function dtdSigFromDetailed(t: {
  pixelClock: number
  horizontalActive: number
  verticalActive: number
  horizontalSyncOffset: number
  horizontalSyncWidth: number
  verticalSyncOffset: number
  verticalSyncWidth: number
  flags: {
    interlaced: boolean
    syncType: 'analog-composite' | 'bipolar-analog-composite' | 'digital-composite' | 'digital-separate'
    hSyncPolarity?: 'positive' | 'negative'
    vSyncPolarity?: 'positive' | 'negative'
  }
}): DtdSig {
  const analog = t.flags.syncType === 'analog-composite' || t.flags.syncType === 'bipolar-analog-composite'
  const digitalSep = t.flags.syncType === 'digital-separate'
  return {
    ha: t.horizontalActive,
    // edid-decode doubles the vertical active for interlaced base/CTA DTDs
    // (`t.vact *= 2`) to report the full-frame line count rather than the
    // per-field value our decoder stores. Match it here. (DisplayID Type I
    // does not double — see dtdSigFromTypeI.)
    va: t.flags.interlaced ? t.verticalActive * 2 : t.verticalActive,
    interlaced: t.flags.interlaced,
    pcMHz: round2(t.pixelClock),
    hso: t.horizontalSyncOffset,
    hsw: t.horizontalSyncWidth,
    hpol: analog ? undefined : polFromStr(t.flags.hSyncPolarity),
    vso: t.verticalSyncOffset,
    vsw: t.verticalSyncWidth,
    vpol: digitalSep ? polFromStr(t.flags.vSyncPolarity) : undefined,
  }
}

function dtdSigFromTypeI(t: DisplayIdTypeVIIDetailedTiming): DtdSig {
  return {
    ha: t.horizontalActive,
    va: t.verticalActive,
    interlaced: t.interlaced,
    pcMHz: round2(t.pixelClockKHz / 1000),
    hso: t.horizontalSyncOffset,
    hsw: t.horizontalSyncWidth,
    hpol: t.horizontalSyncPolarity ? 'P' : 'N',
    vso: t.verticalSyncOffset,
    vsw: t.verticalSyncWidth,
    vpol: t.verticalSyncPolarity ? 'P' : 'N',
  }
}

function ourBase(eedid: EEDID): BaseFields {
  const b = eedid.base
  const fields: BaseFields = { dtds: [] }

  fields.manufacturer = b.header.manufacturerId
  fields.model = b.header.productCode

  // Week: only comparable when edid prints a week (1..54). When our week is 0 or
  // 0xff, edid prints no week, so we surface year-only.
  if (b.header.weekOfManufacture >= 1 && b.header.weekOfManufacture <= 54) {
    fields.madeIn = { week: b.header.weekOfManufacture, year: b.header.yearOfManufacture }
  } else {
    fields.madeIn = { year: b.header.yearOfManufacture }
  }

  if (b.screenSize.type === 'absolute') {
    fields.imageSize = { kind: 'cm', h: b.screenSize.horizontalCm, v: b.screenSize.verticalCm }
  } else if (b.screenSize.type === 'landscape-aspect') {
    fields.imageSize = { kind: 'ratio', value: (b.screenSize.encodedRatio + 99) / 100 }
  } else if (b.screenSize.type === 'portrait-aspect') {
    fields.imageSize = { kind: 'ratio', value: 100 / (b.screenSize.encodedRatio + 99) }
  }

  fields.gamma = b.gamma
  fields.chroma = {
    red: [b.colorCharacteristics.redX, b.colorCharacteristics.redY],
    green: [b.colorCharacteristics.greenX, b.colorCharacteristics.greenY],
    blue: [b.colorCharacteristics.blueX, b.colorCharacteristics.blueY],
    white: [b.colorCharacteristics.whiteX, b.colorCharacteristics.whiteY],
  }
  // edid-decode skips DTDs whose pixel clock is < 10 MHz as invalid placeholder
  // data (e.g. Apple's all-0x01 dummy descriptors decode to 1x1@2.57 MHz). Match
  // that heuristic here so the comparison is like-for-like; our decoder accepts
  // any non-zero pixel clock (filed as a follow-up robustness gap).
  fields.dtds = b.detailedTimings.map(dtdSigFromDetailed).filter((d) => d.pcMHz >= 10)
  return fields
}

function ourCta(cea: CEAExtension): CtaFields {
  const fields: CtaFields = { vics: [], audio: [], speakers: [], dtds: [] }
  fields.revision = cea.revision
  fields.underscan = cea.underscan
  fields.basicAudio = cea.basicAudio
  fields.ycbcr444 = cea.ycbcr444
  fields.ycbcr422 = cea.ycbcr422
  fields.nativeModes = cea.nativeFormats

  for (const block of cea.dataBlocks) {
    if (block.tag === 0x02) {
      const vdb = block as VideoDataBlock
      for (const v of vdb.vics) fields.vics.push({ vic: v.vic, native: v.native })
    } else if (block.tag === 0x01) {
      const adb = block as AudioDataBlock
      for (const d of adb.descriptors) {
        const present: number[] = []
        if (d.samplingRates.sr32kHz) present.push(32)
        if (d.samplingRates.sr44_1kHz) present.push(44.1)
        if (d.samplingRates.sr48kHz) present.push(48)
        if (d.samplingRates.sr88_2kHz) present.push(88.2)
        if (d.samplingRates.sr96kHz) present.push(96)
        if (d.samplingRates.sr176_4kHz) present.push(176.4)
        if (d.samplingRates.sr192kHz) present.push(192)
        present.sort((a, c) => a - c)
        const desc: AudioDesc = { channels: d.channels, sampleRates: present }
        if (d.format === 1 && d.bitDepths) {
          const sizes: number[] = []
          if (d.bitDepths.bd16) sizes.push(16)
          if (d.bitDepths.bd20) sizes.push(20)
          if (d.bitDepths.bd24) sizes.push(24)
          sizes.sort((a, c) => a - c)
          desc.sampleSizes = sizes
        }
        fields.audio.push(desc)
      }
    } else if (block.tag === 0x04) {
      const sab = block as SpeakerAllocationBlock
      const s = sab.speakers
      const present: string[] = []
      const map: Record<string, boolean> = {
        frontLeftRight: s.frontLeftRight,
        lfe: s.lfe,
        frontCenter: s.frontCenter,
        rearLeftRight: s.rearLeftRight,
        rearCenter: s.rearCenter,
        frontLeftRightCenter: s.frontLeftRightCenter,
        rearLeftRightCenter: s.rearLeftRightCenter,
        frontLeftRightWide: s.frontLeftRightWide,
        frontLeftRightHigh: s.frontLeftRightHigh,
        topCenter: s.topCenter,
        frontCenterHigh: s.frontCenterHigh,
        surroundLeftRight: s.surroundLeftRight,
        lfe2: s.lfe2,
        topBackCenter: s.topBackCenter,
        sideLeftRight: s.sideLeftRight,
        topSideLeftRight: s.topSideLeftRight,
        topBackLeftRight: s.topBackLeftRight,
        bottomFrontCenter: s.bottomFrontCenter,
        bottomFrontLeftRight: s.bottomFrontLeftRight,
        topLeftRightSurround: s.topLeftRightSurround,
      }
      for (const [k, v] of Object.entries(map)) if (v) present.push(k)
      fields.speakers = [...new Set(present)].sort()
    }
  }
  // CTA shares edid-decode's `detailed_block`, so the < 10 MHz invalid-DTD
  // heuristic applies here too (see ourBase).
  fields.dtds = cea.detailedTimings.map(t => dtdSigFromDetailed(t)).filter((d) => d.pcMHz >= 10)
  return fields
}

function ourDisplayId(eedid: EEDID): DisplayIdFields | null {
  const ext = getDisplayIdExtension(eedid)
  if (!ext) return null
  // Use the first section (the base section); chained sections are rare and
  // edid-decode prints the first DisplayID block's section.
  const section = ext.section
  const fields: DisplayIdFields = { dtds: [] }
  fields.version = `${section.version}.${section.revision}`
  fields.extensionCount = section.extensionCount
  // Only v1.x carries Type 1 DTD blocks (tag 0x03). v2.0 Type VII is out of scope.
  if (section.version === 1) {
    for (const block of section.blocks) {
      if (block.tag === DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming) {
        const t1 = block as DisplayIdV1TypeIDetailedTimingBlock
        for (const t of t1.timings) fields.dtds.push(dtdSigFromTypeI(t))
      }
    }
  }
  return fields
}

/** Extract our decoder's field values from a decoded EEDID. */
export function extractOurReport(eedid: EEDID): OracleReport {
  const cea = getCEAExtension(eedid)
  return {
    base: ourBase(eedid),
    cta: cea ? ourCta(cea) : null,
    displayid: ourDisplayId(eedid),
  }
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/**
 * Known, intentional parser-difference allowlist. A mismatch whose `field`
 * starts with one of these prefixes is downgraded to `soft` (reported but not
 * failing the gate). This documents where edid-decode and our decoder
 * legitimately differ and keeps the gate focused on real decode bugs.
 */
export const ALLOWLIST: string[] = [
  // edid-decode recomputes and normalises block checksums; we do too, but
  // invalid-source fixtures then differ on the checksum byte. Checksum is a
  // structural-integrity concern (covered by the TASK-57 round-trip gate), not a
  // decoded field value, so it is not asserted here.
  'base.checksum',
  'cta.checksum',
  'displayid.checksum',
  // The CTA underscan bit has six+ edid-decode phrasings across corpus
  // versions ("Underscans IT Video Formats by default",
  // "IT scan behavior: Always Underscanned", …). The wording is a parser
  // presentation difference, not a decode difference, so it is soft.
  'cta.underscan',
]

function isAllowlisted(field: string): boolean {
  return ALLOWLIST.some((p) => field === p || field.startsWith(p + '.'))
}

function sigKey(s: DtdSig): string {
  // Polarities excluded from the key when absent on either side are handled in
  // `compareDtdSets`; the key here includes them for the common (present) case.
  return JSON.stringify([s.ha, s.va, s.interlaced, s.pcMHz, s.hso, s.hsw, s.vso, s.vsw, s.hpol ?? '', s.vpol ?? ''])
}

/**
 * Compare two DTD multisets. Returns a mismatch if the multisets differ. To
 * avoid false fails on composite-sync DTDs (where edid omits Vpol), polarity is
 * compared only when both the oracle and our signature carry it; the matching
 * key therefore ignores a polarity that one side omits.
 */
function compareDtdSets(field: string, oracle: DtdSig[], ours: DtdSig[]): Mismatch[] {
  const norm = (s: DtdSig): DtdSig => ({
    ...s,
    // Drop a polarity that is absent so it does not break set equality.
    hpol: s.hpol,
    vpol: s.vpol,
  })
  const oKeys = oracle.map((s) => sigKey(norm(s)))
  const uKeys = ours.map((s) => sigKey(norm(s)))
  // Multiset equality: same length and every oracle key consumed by ours.
  if (oKeys.length !== uKeys.length || !sameMultiset(oKeys, uKeys)) {
    return [
      {
        field,
        severity: isAllowlisted(field) ? 'soft' : 'hard',
        oracle: `${oracle.length} DTDs: ${oracle.map((s) => `${s.ha}x${s.va}${s.interlaced ? 'i' : ''}@${s.pcMHz}`).join('; ')}`,
        ours: `${ours.length} DTDs: ${ours.map((s) => `${s.ha}x${s.va}${s.interlaced ? 'i' : ''}@${s.pcMHz}`).join('; ')}`,
      },
    ]
  }
  return []
}

function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const counts = new Map<string, number>()
  for (const k of a) counts.set(k, (counts.get(k) ?? 0) + 1)
  for (const k of b) {
    const c = counts.get(k)
    if (!c) return false
    counts.set(k, c - 1)
  }
  return true
}

function compareScalar(
  field: string,
  oracle: unknown,
  ours: unknown,
  eq: (a: unknown, b: unknown) => boolean,
  serialise: (v: unknown) => string = (v) => String(v),
): Mismatch[] {
  if (oracle === undefined || ours === undefined) return []
  if (eq(oracle, ours)) return []
  return [
    {
      field,
      severity: isAllowlisted(field) ? 'soft' : 'hard',
      oracle: serialise(oracle),
      ours: serialise(ours),
    },
  ]
}

const eqNum = (a: unknown, b: unknown) => Math.abs(Number(a) - Number(b)) < 2e-4
const eqChroma = (a: unknown, b: unknown) => {
  const [ax, ay] = a as [number, number]
  const [bx, by] = b as [number, number]
  return Math.abs(ax - bx) < 2e-4 && Math.abs(ay - by) < 2e-4
}

function compareBase(oracle: BaseFields, ours: BaseFields): Mismatch[] {
  const out: Mismatch[] = []
  out.push(...compareScalar('base.manufacturer', oracle.manufacturer, ours.manufacturer, (a, b) => a === b))
  out.push(...compareScalar('base.model', oracle.model, ours.model, (a, b) => Number(a) === Number(b)))
  if (oracle.madeIn && ours.madeIn) {
    if (oracle.madeIn.week !== undefined && ours.madeIn.week !== undefined) {
      out.push(...compareScalar('base.madeIn.week', oracle.madeIn.week, ours.madeIn.week, (a, b) => Number(a) === Number(b)))
    }
    out.push(...compareScalar('base.madeIn.year', oracle.madeIn.year, ours.madeIn.year, (a, b) => Number(a) === Number(b)))
  }
  if (oracle.imageSize && ours.imageSize) {
    if (oracle.imageSize.kind === 'cm' && ours.imageSize.kind === 'cm') {
      out.push(...compareScalar('base.imageSize.h', oracle.imageSize.h, ours.imageSize.h, (a, b) => Number(a) === Number(b)))
      out.push(...compareScalar('base.imageSize.v', oracle.imageSize.v, ours.imageSize.v, (a, b) => Number(a) === Number(b)))
    } else if (oracle.imageSize.kind === 'ratio' && ours.imageSize.kind === 'ratio') {
      out.push(...compareScalar('base.imageSize.ratio', oracle.imageSize.value, ours.imageSize.value, (a, b) => Math.abs(Number(a) - Number(b)) < 0.01))
    }
  }
  out.push(...compareScalar('base.gamma', oracle.gamma, ours.gamma, eqNum))
  if (oracle.chroma && ours.chroma) {
    out.push(...compareScalar('base.chroma.red', oracle.chroma.red, ours.chroma.red, eqChroma))
    out.push(...compareScalar('base.chroma.green', oracle.chroma.green, ours.chroma.green, eqChroma))
    out.push(...compareScalar('base.chroma.blue', oracle.chroma.blue, ours.chroma.blue, eqChroma))
    out.push(...compareScalar('base.chroma.white', oracle.chroma.white, ours.chroma.white, eqChroma))
  }
  out.push(...compareDtdSets('base.dtds', oracle.dtds, ours.dtds))
  return out
}

function compareCta(oracle: CtaFields, ours: CtaFields): Mismatch[] {
  const out: Mismatch[] = []
  out.push(...compareScalar('cta.revision', oracle.revision, ours.revision, (a, b) => Number(a) === Number(b)))
  out.push(...compareScalar('cta.underscan', oracle.underscan, ours.underscan, (a, b) => a === b))
  out.push(...compareScalar('cta.basicAudio', oracle.basicAudio, ours.basicAudio, (a, b) => a === b))
  out.push(...compareScalar('cta.ycbcr444', oracle.ycbcr444, ours.ycbcr444, (a, b) => a === b))
  out.push(...compareScalar('cta.ycbcr422', oracle.ycbcr422, ours.ycbcr422, (a, b) => a === b))
  out.push(...compareScalar('cta.nativeModes', oracle.nativeModes, ours.nativeModes, (a, b) => Number(a) === Number(b)))

  if (!sameMultiset(oracle.vics.map((v) => `${v.vic}:${v.native}`), ours.vics.map((v) => `${v.vic}:${v.native}`))) {
    out.push({
      field: 'cta.vics',
      severity: 'hard',
      oracle: oracle.vics.map((v) => `${v.vic}${v.native ? '*' : ''}`).join(','),
      ours: ours.vics.map((v) => `${v.vic}${v.native ? '*' : ''}`).join(','),
    })
  }
  compareAudio('cta.audio', oracle.audio, ours.audio).forEach((m) => out.push(m))
  if (!sameMultiset(oracle.speakers, ours.speakers)) {
    out.push({
      field: 'cta.speakers',
      severity: 'hard',
      oracle: oracle.speakers.join(','),
      ours: ours.speakers.join(','),
    })
  }
  out.push(...compareDtdSets('cta.dtds', oracle.dtds, ours.dtds))
  return out
}

function compareAudio(field: string, oracle: AudioDesc[], ours: AudioDesc[]): Mismatch[] {
  const ser = (d: AudioDesc): string => {
    const bits = d.sampleSizes ? ` bits[${d.sampleSizes.join('/')}]` : ''
    return `ch${d.channels}[${d.sampleRates.join('/')}]${bits}`
  }
  // Ordered comparison: edid prints descriptors in payload order, which matches
  // our decoder's order.
  if (oracle.length !== ours.length) {
    return [{ field, severity: 'hard', oracle: oracle.map(ser).join(' | '), ours: ours.map(ser).join(' | ') }]
  }
  for (let i = 0; i < oracle.length; i++) {
    const o = oracle[i]
    const u = ours[i]
    if (o.channels !== u.channels || !sameMultiset(o.sampleRates.map(String), u.sampleRates.map(String))) {
      return [{ field, severity: 'hard', oracle: oracle.map(ser).join(' | '), ours: ours.map(ser).join(' | ') }]
    }
    if (o.sampleSizes && u.sampleSizes && !sameMultiset(o.sampleSizes.map(String), u.sampleSizes.map(String))) {
      return [{ field, severity: 'hard', oracle: oracle.map(ser).join(' | '), ours: ours.map(ser).join(' | ') }]
    }
    // If edid printed sample sizes but we have none (or vice versa) for an LPCM
    // descriptor, that is a real difference.
    if ((o.sampleSizes === undefined) !== (u.sampleSizes === undefined)) {
      return [{ field, severity: 'hard', oracle: oracle.map(ser).join(' | '), ours: ours.map(ser).join(' | ') }]
    }
  }
  return []
}

function compareDisplayId(oracle: DisplayIdFields, ours: DisplayIdFields): Mismatch[] {
  const out: Mismatch[] = []
  out.push(...compareScalar('displayid.version', oracle.version, ours.version, (a, b) => a === b))
  out.push(...compareScalar('displayid.extensionCount', oracle.extensionCount, ours.extensionCount, (a, b) => Number(a) === Number(b)))
  out.push(...compareDtdSets('displayid.dtds', oracle.dtds, ours.dtds))
  return out
}

/**
 * Compare an oracle report (edid-decode's values) to our report (our decoder's
 * values). Returns every mismatch; `severity` distinguishes hard failures from
 * allowlisted soft notes.
 */
export function compareReports(oracle: OracleReport, ours: OracleReport): Mismatch[] {
  const out: Mismatch[] = []
  out.push(...compareBase(oracle.base, ours.base))
  if (oracle.cta && ours.cta) out.push(...compareCta(oracle.cta, ours.cta))
  if (oracle.displayid && ours.displayid) out.push(...compareDisplayId(oracle.displayid, ours.displayid))
  return out
}

/** Convenience: parse edid-decode text and compare to a decoded EEDID. */
export function crossValidate(text: string, eedid: EEDID): Mismatch[] {
  return compareReports(parseOracleReport(text), extractOurReport(eedid))
}

/** Only the hard (non-allowlisted) mismatches. */
export function hardMismatches(mismatches: Mismatch[]): Mismatch[] {
  return mismatches.filter((m) => m.severity === 'hard')
}