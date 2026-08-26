import { reactive } from 'vue'
import { computeRefreshRate, type CVTBlankingMode, type DetailedTiming } from 'edidts'

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
 */
export type TimingEditorMode = 'custom' | 'cvt' | 'cvt-rb' | 'cvt-rb2'

export const TIMING_MODE_OPTIONS: ReadonlyArray<{ value: TimingEditorMode; label: string }> = [
  { value: 'custom', label: 'Custom' },
  { value: 'cvt', label: 'CVT' },
  { value: 'cvt-rb', label: 'CVT-RB' },
  { value: 'cvt-rb2', label: 'CVT-RBv2' },
]

/**
 * Per-DTD editor state. `refreshRate` and `margins` are CVT generator inputs
 * that have no direct DTD field counterpart (refresh is *derived* from the DTD;
 * margins does not exist on the DTD at all), so they are held here and only
 * used while a CVT mode is active.
 */
export interface TimingEditorState {
  mode: TimingEditorMode
  /** Target refresh rate (Hz). Editor-only CVT input; seeds from the DTD. */
  refreshRate: number
  /** 1.8% margins toggle. Standard CVT only — RB modes ignore it. */
  margins: boolean
}

/** Map an authoring mode to the CVT generator's blankingMode, or null for Custom. */
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
    state = reactive({
      mode: 'custom',
      refreshRate: round2(computeRefreshRate(timing)),
      margins: false,
    }) as TimingEditorState
    store.set(timing, state)
  }
  return state
}