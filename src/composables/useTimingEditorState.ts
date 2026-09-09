import { reactive } from 'vue'
import {
  analyzeDetailedTimingAgainstCTA,
  analyzeDetailedTimingWithCVT,
  computeRefreshRate,
  CVT_PRESETS,
  generateCVTDetailedTiming,
  type CVTBlankingMode,
  type DetailedTiming,
  type DetailedTimingDescriptor,
} from 'edidts'

/**
 * Authoring mode for a detailed-timing card. This is editor-only UI state — it
 * decides which DTD fields the user may edit and, for the CVT family, drives
 * {@link generateCVTDetailedTiming} to (re)compute the derived geometry. It is
 * NOT part of the EDID data model and is never serialized: the EEDID.encode
 * path is unaware of it, so byte-exact round-tripping of existing DTDs is
 * preserved regardless of the selected mode.
 *
 *  - `custom`     — every field is freely editable (legacy behaviour).
 *  - `cvt`        — standard CVT blanking; margins toggle available.
 *  - `cvt-rb`     — CVT Reduced Blanking v1; margins ignored.
 *  - `cvt-rb2`    — CVT Reduced Blanking v2; margins ignored.
 *  - `target`     — "target refresh rate" authoring: the
 *                  user supplies H/V active plus a target Hz and the editor
 *                  solves for it across the CVT calculator's blanking variants
 *                  (standard / RB / RBv2 via
 *                  {@link generateCVTDetailedTimingForTarget}), picking the
 *                  encodable variant whose achieved rate lands closest to the
 *                  target. Geometry and clock are fully generator-owned; the
 *                  card shows the chosen variant, the achieved rate and its
 *                  deviation from the target. Margins ignored.
 *  - `cea-861`    — CTA-861 VIC owns every byte; a VIC picker is the only free
 *                  control and {@link generateDetailedTimingFromVIC} snaps the
 *                  DTD to the VIC's exact bytes. Distinct from the generative
 *                  CVT modes — VICs are a fixed enumerated set (1-127, 193-219).
 */
export type TimingEditorMode = 'custom' | 'cvt' | 'cvt-rb' | 'cvt-rb2' | 'target' | 'cea-861'

export const TIMING_MODE_OPTIONS: ReadonlyArray<{ value: TimingEditorMode; label: string }> = [
  { value: 'custom', label: 'Custom' },
  { value: 'cvt', label: 'CVT' },
  { value: 'cvt-rb', label: 'CVT-RB' },
  { value: 'cvt-rb2', label: 'CVT-RBv2' },
  { value: 'target', label: 'Target Refresh Rate' },
  { value: 'cea-861', label: 'CTA-861' },
]

/**
 * Per-DTD editor state. `refreshRate` and `margins` are CVT generator inputs
 * that have no direct DTD field counterpart (refresh is *derived* from the DTD;
 * margins does not exist on the DTD at all), so they are held here and only
 * used while a CVT mode is active. `selectedVic` is the CEA-861 picker value.
 */
export interface TimingEditorState {
  mode: TimingEditorMode
  /** Target refresh rate (Hz). Editor-only CVT input; seeds from the DTD. */
  refreshRate: number
  /** 1.8% margins toggle. Standard CVT only — RB modes ignore it. */
  margins: boolean
  /** Selected CTA-861 VIC in `cea-861` mode (null = no selection / other modes). */
  selectedVic: number | null
  /** Blanking variant the target-refresh-rate solver last selected.
   *  Editor-only mirror of the generator's choice, kept for display; null
   *  until a target-mode regeneration has succeeded. */
  targetBlankingMode: CVTBlankingMode | null
}

/** Map an authoring mode to the CVT generator's blankingMode, or null for non-CVT. */
export function modeToBlankingMode(mode: TimingEditorMode): CVTBlankingMode | null {
  switch (mode) {
    case 'cvt':
      return 'cvt'
    case 'cvt-rb':
      return 'cvt-rb'
    case 'cvt-rb2':
      return 'cvt-rb2'
    // "Target refresh rate" mode no longer generates under a fixed variant:
    // the editor solves across all three, so this mapping is only
    // reached by callers that need *a* CVT variant (e.g. seeding a preset
    // before the target solve rewrites it).
    case 'target':
      return 'cvt'
    default:
      return null
  }
}

/**
 * Sensible bounds for the editor's refresh-rate generator input.
 * The low bound keeps the input in the generator's valid range; the
 * high bound is far beyond any rate whose pixel clock still fits the 16-bit
 * 10 kHz DTD field — the card's regenerate() guard refuses those outright.
 */
export const REFRESH_RATE_MIN = 1
export const REFRESH_RATE_MAX = 1000

/**
 * Maximum encodable DTD pixel clock in MHz — the DTD clock field is 16 bits
 * of 10 kHz units. The target-rate solver refuses targets whose pixel clock
 * exceeds this under every CVT variant.
 */
export const DTD_PIXEL_CLOCK_MAX = 655.35

/** Display labels for the CVT calculator's blanking variants. */
export const CVT_BLANKING_LABELS: Record<CVTBlankingMode, string> = {
  cvt: 'CVT',
  'cvt-rb': 'CVT-RB',
  'cvt-rb2': 'CVT-RBv2',
}

/**
 * Infer the editor authoring mode for a DTD from the lib classifiers, so the
 * selector and reality agree on load. CEA-861 first — a DTD
 * matching a CTA-861 VIC snaps to `cea-861` with that VIC selected — then the
 * CVT family, else `custom`.
 *
 * Note: {@link analyzeDetailedTimingAgainstCTA} compares the DTD's full-frame
 * verticalTotal against the VIC table's per-field vTotal for interlaced VICs,
 * a pre-existing ~2× mismatch, so interlaced CEA DTDs fall
 * through to CVT/custom here. The user can still pick `cea-861` + the VIC by
 * hand.
 */
function inferEditorMode(timing: DetailedTiming): {
  mode: TimingEditorMode
  selectedVic: number | null
} {
  const dtd = timing as DetailedTimingDescriptor
  const cea = analyzeDetailedTimingAgainstCTA(dtd)
  if (cea.matchVic) {
    return { mode: 'cea-861', selectedVic: cea.matchVic.vic }
  }
  const cvt = analyzeDetailedTimingWithCVT(dtd)
  const cvtMatch = cvt.comparisons.find((comparison) => comparison.withinTolerance)
  if (cvtMatch) {
    return { mode: blankingModeToMode(cvtMatch.mode), selectedVic: null }
  }
  return { mode: 'custom', selectedVic: null }
}

/**
 * Inverse of {@link modeToBlankingMode}: map a CVT generator blankingMode back to
 * the editor authoring mode. Used when seeding editor state from a generated
 * preset (the add-timing flow): a preset's `blankingMode` selects which CVT
 * variant the new DTD's Mode selector lands on so field locking applies at
 * once. Standard CVT (`'cvt'` or unset) maps to `'cvt'`.
 */
export function blankingModeToMode(blankingMode: CVTBlankingMode | undefined): TimingEditorMode {
  switch (blankingMode) {
    case 'cvt-rb':
      return 'cvt-rb'
    case 'cvt-rb2':
      return 'cvt-rb2'
    default:
      return 'cvt'
  }
}

/** Round to 2 dp (refresh rate / pixel clock display granularity). */
function round2(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

/**
 * Module-level store keyed by the reactive DTD instance. Keying by the object
 * identity keeps the state out of the data model (no field added to the DTD,
 * nothing for encode to see) and lets it be garbage-collected with the timing.
 */
const store = new WeakMap<object, TimingEditorState>()

/**
 * Get (lazily creating) the editor state for a DTD. The first access defaults to
 * `custom` mode and seeds `refreshRate` from the DTD's current geometry via
 * {@link computeRefreshRate} so that switching to a CVT mode immediately
 * regenerates at the timing's present rate.
 *
 * Returns a reactive object so template bindings update on mode/param edits.
 */
export function getTimingEditorState(timing: DetailedTiming): TimingEditorState {
  let state = store.get(timing)
  if (!state) {
    const inferred = inferEditorMode(timing)
    state = reactive({
      mode: inferred.mode,
      selectedVic: inferred.selectedVic,
      refreshRate: round2(computeRefreshRate(timing)),
      margins: false,
      targetBlankingMode: null,
    }) as TimingEditorState
    store.set(timing, state)
  }
  return state
}

/**
 * A timing-only pick-list entry derived from the library's {@link CVT_PRESETS}.
 * The preset owns just the timing (resolution × refresh); the blanking variant
 * is owned by the editor's Mode selector and passed in at generation time
 * — so the entry carries the generator inputs directly and neither
 * its key nor its label names a CVT variant. The first entry is the default
 * (1080p60, matching the EDID constructor's first-descriptor baseline).
 */
export interface CVTPresetEntry {
  key: string
  label: string
  horizontalActive: number
  verticalActive: number
  refreshRate: number
}

/**
 * Timing-only preset list: one entry per unique resolution/refresh in the
 * library's {@link CVT_PRESETS}, with the `_RB`/`_RBv2` variant suffix stripped
 * from the key (e.g. '4K60_RB' and '4K60_RBv2' collapse to one '4K60' entry).
 * The generator inputs are taken from the lib preset itself so they stay
 * single-sourced — only the variant, which the Mode selector supplies, differs
 * between the collapsed lib entries.
 */
export const CVT_PRESET_ENTRIES: ReadonlyArray<CVTPresetEntry> = (() => {
  const byTiming = new Map<string, CVTPresetEntry>()
  for (const [key, preset] of Object.entries(CVT_PRESETS)) {
    const id = `${preset.horizontalActive}x${preset.verticalActive}@${preset.refreshRate}`
    if (byTiming.has(id)) continue
    const timingKey = key.replace(/_RB(v2)?$/, '')
    byTiming.set(id, {
      key: timingKey,
      label: timingKey,
      horizontalActive: preset.horizontalActive,
      verticalActive: preset.verticalActive,
      refreshRate: preset.refreshRate,
    })
  }
  return [...byTiming.values()]
})()

/** The default preset used when the add-timing flow is invoked without a pick. */
export const DEFAULT_TIMING_PRESET: CVTPresetEntry = CVT_PRESET_ENTRIES[0]

/**
 * Default blanking variant for the add-timing flows (LeftNav "+ Add → Detailed
 * Timing"): a new DTD is created before any mode is user-selected, so the flow
 * generates with standard CVT and seeds the editor mode from it.
 */
export const DEFAULT_TIMING_BLANKING_MODE: CVTBlankingMode = 'cvt'

/**
 * Build a CVT-generated DetailedTimingDescriptor from a preset key (defaulting
 * to {@link DEFAULT_TIMING_PRESET}) using the caller's blanking variant — the
 * preset only supplies the timing; the variant comes from the editor's Mode
 * selector. Returns the preset's refresh rate so callers seeding a
 * fresh editor state can align the CVT refresh-rate input with the loaded
 * timing; the mode itself is the caller's choice and is never changed here.
 */
export function generateTimingFromPreset(
  key: string | undefined,
  blankingMode: CVTBlankingMode,
): { timing: DetailedTimingDescriptor; refreshRate: number } {
  const entry = CVT_PRESET_ENTRIES.find((e) => e.key === key) ?? DEFAULT_TIMING_PRESET
  const timing = generateCVTDetailedTiming({
    horizontalActive: entry.horizontalActive,
    verticalActive: entry.verticalActive,
    refreshRate: entry.refreshRate,
    blankingMode,
  })
  return { timing, refreshRate: entry.refreshRate }
}