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
 *  - `cea-861`    — CTA-861 VIC owns every byte; a VIC picker is the only free
 *                  control and {@link generateDetailedTimingFromVIC} snaps the
 *                  DTD to the VIC's exact bytes. Distinct from the generative
 *                  CVT modes — VICs are a fixed enumerated set (1-127, 193-219).
 */
export type TimingEditorMode = 'custom' | 'cvt' | 'cvt-rb' | 'cvt-rb2' | 'cea-861'

export const TIMING_MODE_OPTIONS: ReadonlyArray<{ value: TimingEditorMode; label: string }> = [
  { value: 'custom', label: 'Custom' },
  { value: 'cvt', label: 'CVT' },
  { value: 'cvt-rb', label: 'CVT-RB' },
  { value: 'cvt-rb2', label: 'CVT-RBv2' },
  { value: 'cea-861', label: 'CEA-861' },
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
    default:
      return null
  }
}

/**
 * Infer the editor authoring mode for a DTD from the lib classifiers, so the
 * selector and reality agree on load (TASK-89 AC #4). CEA-861 first — a DTD
 * matching a CTA-861 VIC snaps to `cea-861` with that VIC selected — then the
 * CVT family, else `custom`.
 *
 * Note: {@link analyzeDetailedTimingAgainstCTA} compares the DTD's full-frame
 * verticalTotal against the VIC table's per-field vTotal for interlaced VICs,
 * a pre-existing ~2× mismatch (see TASK-88), so interlaced CEA DTDs fall
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
    }) as TimingEditorState
    store.set(timing, state)
  }
  return state
}

/**
 * A pick-list entry for the "Add → Detailed Timing" flow, derived from the
 * library's {@link CVT_PRESETS}. Each entry carries the preset key (for looking
 * up the generator inputs) and a human label that names the resolution, refresh
 * rate, and CVT variant. The first entry is the default (1080p60 standard CVT,
 * matching the EDID constructor's first-descriptor baseline).
 */
export interface CVTPresetEntry {
  key: keyof typeof CVT_PRESETS
  label: string
}

export const CVT_PRESET_ENTRIES: ReadonlyArray<CVTPresetEntry> = [
  { key: '1080p60', label: '1080p60 · CVT' },
  { key: '1080p60_RB', label: '1080p60 · CVT-RB' },
  { key: '1440p60', label: '1440p60 · CVT' },
  { key: '1440p60_RB', label: '1440p60 · CVT-RB' },
  { key: '1440p144_RBv2', label: '1440p144 · CVT-RBv2' },
  { key: '4K30', label: '4K30 · CVT' },
  { key: '4K60_RB', label: '4K60 · CVT-RB' },
  { key: '4K60_RBv2', label: '4K60 · CVT-RBv2' },
  { key: '4K120_RBv2', label: '4K120 · CVT-RBv2' },
]

/** The default preset used when the add-timing flow is invoked without a pick. */
export const DEFAULT_TIMING_PRESET: CVTPresetEntry = CVT_PRESET_ENTRIES[0]

/**
 * Build a CVT-generated DetailedTimingDescriptor from a preset key (defaulting
 * to {@link DEFAULT_TIMING_PRESET}), and return the editor authoring mode that
 * matches the preset's blanking variant. The caller appends the DTD to the
 * EDID/CEA detailed-timings array and then sets `getTimingEditorState(proxy)`
 * from the returned mode + the preset's refresh rate so the new card opens with
 * field locking already applied (TASK-87 AC #3).
 */
export function generateTimingFromPreset(
  key?: string,
): { timing: DetailedTimingDescriptor; mode: TimingEditorMode; refreshRate: number } {
  const entry = CVT_PRESET_ENTRIES.find((e) => e.key === key) ?? DEFAULT_TIMING_PRESET
  const preset = CVT_PRESETS[entry.key]
  const blankingMode = ('blankingMode' in preset ? preset.blankingMode : 'cvt') as
    | 'cvt'
    | 'cvt-rb'
    | 'cvt-rb2'
  const timing = generateCVTDetailedTiming({
    horizontalActive: preset.horizontalActive,
    verticalActive: preset.verticalActive,
    refreshRate: preset.refreshRate,
    blankingMode,
  })
  return {
    timing,
    mode: blankingModeToMode(blankingMode),
    refreshRate: preset.refreshRate,
  }
}