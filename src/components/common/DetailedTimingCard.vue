<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  analyzeDetailedTimingAgainstCTA,
  computeRefreshRate,
  generateCVTDetailedTiming,
  generateDetailedTimingFromVIC,
  type CVTTimingInput,
  type DetailedTiming,
  type DetailedTimingDescriptor,
} from 'edidts'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import DetailedTimingFields from './DetailedTimingFields.vue'
import VicPicker from './VicPicker.vue'
import {
  CVT_PRESET_ENTRIES,
  TIMING_MODE_OPTIONS,
  generateTimingFromPreset,
  getTimingEditorState,
  modeToBlankingMode,
  type TimingEditorMode,
} from '@/composables/useTimingEditorState'

/**
 * Shared detailed-timing card chrome: header (Timing N, resolution×refresh,
 * pixel-clock subtitle, Mode selector, expand toggle), a Preset picker, the
 * top controls row (Pixel Clock / Refresh / Margins), and the
 * DetailedTimingFields editor. Consumed by the EDID base-block descriptor view
 * (EDIDDetailedDescriptors.vue) and the CTA-861 DTD view (CTADetailedTimings.vue),
 * which share the same DetailedTiming field set via the common DTD codec.
 *
 * Refresh is derived from the single lib source {@link computeRefreshRate} —
 * never recomputed locally. Consumer-specific chrome is supplied via slots:
 *   - #details: the expanded body after the field editor (H/V summary grid,
 *     CTA-861 reference, CVT calculator — these differ per consumer)
 *
 * Emits `update` with a dotted field path and new value, forwarded from
 * DetailedTimingFields; the owning component mutates the matching timing
 * instance and the useEDID computed re-encodes.
 *
 * Timing mode: an authoring-mode selector (Custom / CVT / CVT-RB / CVT-RBv2)
 * drives field locking and CVT regeneration. In a CVT mode the derived geometry
 * is recomputed via {@link generateCVTDetailedTiming} from the free parameters
 * (H/V active, H/V image size, interlaced, plus editor-only refresh rate and
 * margins) and written back onto the existing reactive DTD in place. The mode
 * and the CVT-only params (refresh rate, margins) are editor state held in
 * {@link useTimingEditorState} — never serialized into the EDID bytes.
 */
const props = withDefaults(defineProps<{
  timing: DetailedTiming
  index: number
  /** Force the expanded body on (e.g. a focused single-timing view). */
  forceExpand?: boolean
  /** Show the "Show/Hide details" toggle button. */
  showToggle?: boolean
}>(), { forceExpand: false, showToggle: true })

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const expanded = ref(false)
const isExpanded = computed(() => props.forceExpand || expanded.value)

const refresh = computed(() => computeRefreshRate(props.timing))

/** Editor-only authoring state for this DTD (mode + CVT free params). */
const state = getTimingEditorState(props.timing)
const isCVTMode = computed(() => state.mode !== 'custom' && state.mode !== 'cea-861')
/** CEA-861 authoring mode: a VIC owns the timing geometry. */
const cea861 = computed(() => state.mode === 'cea-861')
/** Margins only applies to standard CVT — RB modes ignore it. */
const showMargins = computed(() => state.mode === 'cvt')

const modeSelectClass =
  'h-7 rounded-md border border-input bg-transparent dark:bg-input/30 px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

/** Controlled value of the Preset `<select>` — held only to reset the picker to
 * its placeholder after a load (it is a one-shot "load a starting point"
 * control, not a persistent selection). */
const selectedPreset = ref('')

/** App-standard Switch row treatment (matches CTAHeaderFlags / CTAVideoCapability):
 * transparent border, hover wash, non-uppercase muted label. */
const switchRowClass =
  'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 hover:bg-muted/50 transition-colors'

/** DTD fields the CVT generator derives from the free parameters. */
const FREE_PARAM_FIELDS = new Set([
  'horizontalActive',
  'verticalActive',
  'horizontalImageSize',
  'verticalImageSize',
  'flags.interlaced',
])

function toggle() {
  expanded.value = !expanded.value
}

function round2(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

/**
 * Recompute the DTD's derived geometry from the current free parameters and the
 * editor CVT inputs (refresh rate, margins), writing the result onto the
 * existing reactive timing instance in place. No-ops (without throwing) when
 * the active resolution or target refresh rate is zero/invalid — e.g. a fresh
 * all-zero DTD before the user enters values.
 *
 * After mutating, emits a single `update` for `pixelClock` so the owning
 * component's `setByPath` reassigns the enclosing `detailedTimings` array — the
 * documented encode trigger (TASK-76 contract). The pure encode then re-reads
 * the mutated-in-place element and re-encodes.
 */
function regenerate(): void {
  const blankingMode = modeToBlankingMode(state.mode)
  if (!blankingMode) return

  const horizontalActive = Math.round(props.timing.horizontalActive)
  const verticalActive = Math.round(props.timing.verticalActive)
  const refreshRate = round2(state.refreshRate)
  if (horizontalActive <= 0 || verticalActive <= 0 || refreshRate <= 0) return

  const input: CVTTimingInput = {
    horizontalActive,
    verticalActive,
    refreshRate,
    blankingMode,
    interlaced: props.timing.flags.interlaced,
    margins: state.margins,
    horizontalImageSize: Math.round(props.timing.horizontalImageSize),
    verticalImageSize: Math.round(props.timing.verticalImageSize),
  }
  const gen = generateCVTDetailedTiming(input)

  // Write the derived fields onto the reactive DTD proxy in place. The free
  // parameters (active, image size, interlaced) are the generator inputs and
  // are left as the user set them; everything else is owned by the generator.
  props.timing.pixelClock = gen.pixelClock
  props.timing.horizontalBlanking = gen.horizontalBlanking
  props.timing.verticalBlanking = gen.verticalBlanking
  props.timing.horizontalSyncOffset = gen.horizontalSyncOffset
  props.timing.horizontalSyncWidth = gen.horizontalSyncWidth
  props.timing.verticalSyncOffset = gen.verticalSyncOffset
  props.timing.verticalSyncWidth = gen.verticalSyncWidth
  props.timing.horizontalBorder = gen.horizontalBorder
  props.timing.verticalBorder = gen.verticalBorder
  props.timing.flags.interlaced = gen.flags.interlaced
  props.timing.flags.syncType = gen.flags.syncType
  props.timing.flags.stereoMode = gen.flags.stereoMode
  props.timing.flags.hSyncPolarity = gen.flags.hSyncPolarity
  props.timing.flags.vSyncPolarity = gen.flags.vSyncPolarity

  emit('update', 'pixelClock', props.timing.pixelClock)
}

/**
 * Load a CVT preset onto the current DTD as a complete starting point. Unlike
 * {@link regenerate} (which preserves the user-set free parameters), this
 * overwrites every DetailedTiming field with the preset's generated timing,
 * sets the editor authoring mode to the preset's CVT variant, seeds the CVT
 * refresh-rate input from the preset, then emits `update` for `pixelClock` so
 * the owning mutator reassigns the enclosing `detailedTimings` array (the
 * documented encode trigger). The picker resets to its placeholder afterwards —
 * it is a one-shot "load a starting point" control, not a persistent selection
 * (subsequent field edits would diverge from any fixed label).
 */
function onPresetChange(event: Event): void {
  const key = (event.target as HTMLSelectElement).value
  if (!key) return
  const { timing: gen, mode, refreshRate } = generateTimingFromPreset(key)

  props.timing.pixelClock = gen.pixelClock
  props.timing.horizontalActive = gen.horizontalActive
  props.timing.horizontalBlanking = gen.horizontalBlanking
  props.timing.verticalActive = gen.verticalActive
  props.timing.verticalBlanking = gen.verticalBlanking
  props.timing.horizontalSyncOffset = gen.horizontalSyncOffset
  props.timing.horizontalSyncWidth = gen.horizontalSyncWidth
  props.timing.verticalSyncOffset = gen.verticalSyncOffset
  props.timing.verticalSyncWidth = gen.verticalSyncWidth
  props.timing.horizontalImageSize = gen.horizontalImageSize
  props.timing.verticalImageSize = gen.verticalImageSize
  props.timing.horizontalBorder = gen.horizontalBorder
  props.timing.verticalBorder = gen.verticalBorder
  props.timing.flags.interlaced = gen.flags.interlaced
  props.timing.flags.syncType = gen.flags.syncType
  props.timing.flags.stereoMode = gen.flags.stereoMode
  props.timing.flags.hSyncPolarity = gen.flags.hSyncPolarity
  props.timing.flags.vSyncPolarity = gen.flags.vSyncPolarity

  state.mode = mode
  state.refreshRate = refreshRate
  state.margins = false

  emit('update', 'pixelClock', props.timing.pixelClock)
  selectedPreset.value = ''
}

function onModeChange(event: Event): void {
  const mode = (event.target as HTMLSelectElement).value as TimingEditorMode
  state.mode = mode
  if (mode === 'cea-861') {
    // CEA-861 mode: the VIC owns the timing. If the DTD already matches a VIC
    // (e.g. it was authored from one), pre-select it so the picker reflects the
    // current bytes — no rewrite is needed in that case. Otherwise leave the
    // picker on its placeholder and let the user pick a VIC to snap to.
    if (state.selectedVic == null) {
      const match = analyzeDetailedTimingAgainstCTA(props.timing as DetailedTimingDescriptor).matchVic
      if (match) state.selectedVic = match.vic
    }
    return
  }
  if (mode !== 'custom') {
    // Seed the CVT refresh-rate input from the DTD's present geometry so the
    // first regeneration stays at the current rate; reset margins (std-only).
    state.refreshRate = round2(computeRefreshRate(props.timing))
    state.margins = false
    regenerate()
  }
}

/**
 * Apply a CTA-861 VIC to the current DTD: snap every timing field to the VIC's
 * canonical geometry (written onto the reactive DTD in place, like
 * {@link onPresetChange}), record the selection in editor state, and emit
 * `update` for `pixelClock` so the owning mutator reassigns the enclosing
 * `detailedTimings` array (the documented encode trigger). Image size is
 * preserved — it is display-specific, not a VIC property, and stays read-only
 * in CEA-861 mode. A null selection (picker cleared) is ignored.
 */
function onVICSelect(vic: number | null): void {
  if (vic == null) return
  const gen = generateDetailedTimingFromVIC(vic)

  props.timing.pixelClock = gen.pixelClock
  props.timing.horizontalActive = gen.horizontalActive
  props.timing.horizontalBlanking = gen.horizontalBlanking
  props.timing.verticalActive = gen.verticalActive
  props.timing.verticalBlanking = gen.verticalBlanking
  props.timing.horizontalSyncOffset = gen.horizontalSyncOffset
  props.timing.horizontalSyncWidth = gen.horizontalSyncWidth
  props.timing.verticalSyncOffset = gen.verticalSyncOffset
  props.timing.verticalSyncWidth = gen.verticalSyncWidth
  props.timing.horizontalBorder = gen.horizontalBorder
  props.timing.verticalBorder = gen.verticalBorder
  props.timing.flags.interlaced = gen.flags.interlaced
  props.timing.flags.syncType = gen.flags.syncType
  props.timing.flags.stereoMode = gen.flags.stereoMode
  props.timing.flags.hSyncPolarity = gen.flags.hSyncPolarity
  props.timing.flags.vSyncPolarity = gen.flags.vSyncPolarity

  state.selectedVic = vic
  emit('update', 'pixelClock', props.timing.pixelClock)
}

function onRefreshChange(v: string | number): void {
  const parsed = typeof v === 'number' ? v : Number(v)
  state.refreshRate = Number.isFinite(parsed) ? round2(parsed) : 0
  regenerate()
}

/**
 * Pixel Clock edit (Custom mode only — the input is disabled in CVT modes where
 * the generator owns it). pixelClock is in MHz with 0.01 MHz resolution (10 kHz
 * units), so round to 2 dp before forwarding to the owning mutator.
 */
function onPixelClock(v: string | number): void {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', 'pixelClock', Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0)
}

function onMarginsChange(v: boolean): void {
  state.margins = v
  regenerate()
}

/**
 * Forward field edits from DetailedTimingFields. In Custom mode the edit goes
 * straight through to the owning mutator as before. In a CVT mode only the free
 * parameters are editable (the rest are disabled); applying a free param then
 * regenerating the derived geometry keeps the DTD consistent with the mode.
 */
function onFieldUpdate(field: string, value: unknown): void {
  if (!isCVTMode.value) {
    emit('update', field, value)
    return
  }
  if (!FREE_PARAM_FIELDS.has(field)) return // locked/derived field — ignore
  applyFreeParam(field, value)
  regenerate()
}

function applyFreeParam(field: string, value: unknown): void {
  if (field.startsWith('flags.')) {
    const flag = field.slice('flags.'.length)
    ;(props.timing.flags as unknown as Record<string, unknown>)[flag] = value
  } else {
    ;(props.timing as unknown as Record<string, unknown>)[field] = value
  }
}
</script>

<template>
  <div class="rounded-2xl border border-border/60 bg-card shadow-sm scroll-mt-6">
    <div class="flex flex-wrap items-start gap-4 border-b border-border/40 p-4">
      <div>
        <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Timing {{ index + 1 }}</p>
        <p class="text-lg font-semibold text-foreground">
          {{ timing.horizontalActive }}×{{ timing.verticalActive }}{{ timing.flags.interlaced ? 'i' : 'p' }} ·
          {{ refresh.toFixed(2) }} Hz
        </p>
        <p class="text-xs text-muted-foreground">{{ timing.pixelClock.toFixed(2) }} MHz pixel clock</p>
      </div>
      <div class="ml-auto flex flex-col items-end gap-2">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Preset picker: load a CVT preset onto the current DTD as a starting
               point (overwrites all fields and sets the matching CVT mode). A
               one-shot control — resets to the placeholder after each load. -->
          <select
            :class="modeSelectClass"
            aria-label="Load preset"
            :value="selectedPreset"
            :disabled="cea861"
            @change="onPresetChange"
          >
            <option value="">Load preset…</option>
            <option v-for="preset in CVT_PRESET_ENTRIES" :key="preset.key" :value="preset.key">{{ preset.label }}</option>
          </select>
          <select
            :class="modeSelectClass"
            aria-label="Timing mode"
            :value="state.mode"
            @change="onModeChange"
          >
            <option v-for="opt in TIMING_MODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button
            v-if="showToggle"
            type="button"
            class="text-xs font-semibold text-foreground/80 hover:text-primary"
            @click="toggle"
          >
            {{ isExpanded ? 'Hide details' : 'Show details' }}
          </button>
        </div>
        <!-- CEA-861 mode: the VIC picker lives under the preset/mode selectors
             (it is the sole free-parameter control — every DTD field is locked
             to the VIC's bytes). Kept out of the edit-fields area per UX. -->
        <VicPicker
          v-if="cea861"
          class="w-full sm:w-72"
          :model-value="state.selectedVic"
          @update:model-value="(v) => onVICSelect(v)"
        />
      </div>
    </div>
    <div
      v-if="isExpanded"
      class="border-t border-border/40 p-4 text-xs text-muted-foreground"
    >
      <!-- Top controls row: Pixel Clock | Refresh Rate | Margins. Always
           rendered as a 3-column grid so the layout never reflows between
           modes. Pixel Clock is editable in Custom mode and disabled in CVT
           modes (generator owns it) and CEA-861 mode (the VIC owns it); the
           CEA-861 VIC picker lives in the header, not here. Refresh Rate is the
           editable CVT generator input (read-only mirror of the derived rate in
           Custom / CEA-861); Margins is enabled only for standard CVT. -->
      <div class="mb-4 grid gap-3 sm:grid-cols-3">
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pixel Clock (MHz)
          <Input
            type="number"
            :min="0"
            :step="0.01"
            :disabled="isCVTMode || cea861"
            :model-value="timing.pixelClock"
            @update:model-value="(v) => onPixelClock(v)"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Refresh Rate (Hz)
          <Input
            type="number"
            :min="0"
            :step="0.01"
            :disabled="!isCVTMode"
            :model-value="isCVTMode ? state.refreshRate : refresh"
            @update:model-value="(v) => onRefreshChange(v)"
          />
        </label>
        <label :class="switchRowClass">
          <span class="text-xs text-muted-foreground">Margins (1.8%)</span>
          <Switch
            :model-value="state.margins"
            :disabled="!showMargins"
            @update:model-value="(v: boolean) => onMarginsChange(v)"
          />
        </label>
      </div>

      <div class="mb-4">
        <p class="text-[11px] uppercase tracking-wide mb-2 text-foreground/80">Edit Fields</p>
        <DetailedTimingFields
          :timing="timing"
          :mode="state.mode"
          @update="(field: string, value: unknown) => onFieldUpdate(field, value)"
        />
      </div>
      <slot name="details" />
    </div>
  </div>
</template>