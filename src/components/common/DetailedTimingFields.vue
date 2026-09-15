<script setup lang="ts">
import { computed } from 'vue'
import type { DetailedTiming } from 'edidts'
import { STEREO_MODE_OPTIONS, SYNC_TYPE_OPTIONS } from 'edidts'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { isTimingFieldEditable, TIMING_FIELD_MAX, clampTimingField, type TimingEditorMode, type TimingFieldMaxKey } from '@/composables/useTimingEditorState'

/**
 * Shared field-level editor for the 18-byte Detailed Timing Descriptor geometry,
 * sync, image-size, border, and flag fields. Used by both the EDID base
 * descriptor slots (DetailedDescriptors.vue) and the CTA-861 DTDs
 * (CTADetailedTimings.vue), which share the same DetailedTiming field set via
 * the common DTD codec (see packages/edidts/src/common/detailed-timing-descriptor.ts).
 *
 * Emits `update` with a dotted field path (e.g. "pixelClock", "flags.interlaced",
 * "flags.vSyncPolarity") and the new value. The owning component mutates the
 * matching DetailedTiming instance; the useEDID computed re-encodes.
 *
 * Fields are laid out in paired-axes rows (Horizontal left, Vertical right per
 * parameter). Editability follows the shared mode policy
 * ({@link isTimingFieldEditable}): outside Custom mode only H/V Active remain
 * editable (in CEA-861 mode nothing does — the VIC owns every byte); all
 * other inputs are disabled and greyed so derived values read as such.
 * Refresh rate and margins live on the card, not here, since they are
 * generator inputs with no direct DTD field counterpart.
 */
const props = withDefaults(defineProps<{
  timing: DetailedTiming
  /** Authoring mode; when not `custom`, derived fields are disabled. */
  mode?: TimingEditorMode
}>(), { mode: 'custom' })

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'

/** App-standard Switch row treatment (matches CTAHeaderFlags / CTAVideoCapability):
 * transparent border, hover wash, non-uppercase muted label. */
const switchRowClass =
  'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 hover:bg-muted/50 transition-colors'

/** H/V Active are free parameters in every generative mode — locked only in
 *  CEA-861 mode, where the VIC owns every byte. */
const activeLocked = computed(() => !isTimingFieldEditable(props.mode, 'horizontalActive'))
/** Every other field is generator/VIC-owned outside Custom mode. */
const locked = computed(() => !isTimingFieldEditable(props.mode, 'horizontalBlanking'))

const isDigitalSeparate = computed(() => props.timing.flags.syncType === 'digital-separate')
const isDigitalComposite = computed(() => props.timing.flags.syncType === 'digital-composite')
const isAnalog = computed(() =>
  props.timing.flags.syncType === 'analog-composite' ||
  props.timing.flags.syncType === 'bipolar-analog-composite'
)

/**
 * Per-field encodable maxima live in the shared {@link TIMING_FIELD_MAX}
 * (useTimingEditorState.ts) so the raster diagram clamps identically —
 * alias here only for the template's `:max` bindings.
 */
const FIELD_MAX = TIMING_FIELD_MAX

/** Round + clamp via the shared {@link clampTimingField} before emitting, so
 * the diagram and this grid commit the exact same value. */
function onNumber(field: TimingFieldMaxKey, v: string | number) {
  emit('update', field, clampTimingField(field, v))
}

function onFlag(flag: string, value: unknown) {
  emit('update', `flags.${flag}`, value)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Geometry, sync, image size, and borders in paired-axes rows: each row
         pairs the Horizontal (left) and Vertical (right) variant of one
         parameter — H/V Active, then H/V Blanking, then sync offset/width,
         image size, and borders. Two pairs per row on wide screens so the
         section uses the full card width. (Pixel clock lives on the card's
         top controls row.) -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Active (px)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.horizontalActive"
          :step="1"
          :disabled="activeLocked"
          :model-value="timing.horizontalActive"
          @update:model-value="(v) => onNumber('horizontalActive', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Active (lines)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.verticalActive"
          :step="1"
          :disabled="activeLocked"
          :model-value="timing.verticalActive"
          @update:model-value="(v) => onNumber('verticalActive', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Blanking (px)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.horizontalBlanking"
          :step="1"
          :disabled="locked"
          :model-value="timing.horizontalBlanking"
          @update:model-value="(v) => onNumber('horizontalBlanking', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Blanking (lines)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.verticalBlanking"
          :step="1"
          :disabled="locked"
          :model-value="timing.verticalBlanking"
          @update:model-value="(v) => onNumber('verticalBlanking', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Sync Offset (px)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.horizontalSyncOffset"
          :step="1"
          :disabled="locked"
          :model-value="timing.horizontalSyncOffset"
          @update:model-value="(v) => onNumber('horizontalSyncOffset', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Sync Offset (lines)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.verticalSyncOffset"
          :step="1"
          :disabled="locked"
          :model-value="timing.verticalSyncOffset"
          @update:model-value="(v) => onNumber('verticalSyncOffset', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Sync Width (px)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.horizontalSyncWidth"
          :step="1"
          :disabled="locked"
          :model-value="timing.horizontalSyncWidth"
          @update:model-value="(v) => onNumber('horizontalSyncWidth', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Sync Width (lines)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.verticalSyncWidth"
          :step="1"
          :disabled="locked"
          :model-value="timing.verticalSyncWidth"
          @update:model-value="(v) => onNumber('verticalSyncWidth', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Image Size (mm)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.horizontalImageSize"
          :step="1"
          :disabled="locked"
          :model-value="timing.horizontalImageSize"
          @update:model-value="(v) => onNumber('horizontalImageSize', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Image Size (mm)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.verticalImageSize"
          :step="1"
          :disabled="locked"
          :model-value="timing.verticalImageSize"
          @update:model-value="(v) => onNumber('verticalImageSize', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Border (px)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.horizontalBorder"
          :step="1"
          :disabled="locked"
          :model-value="timing.horizontalBorder"
          @update:model-value="(v) => onNumber('horizontalBorder', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Border (lines)
        <Input
          type="number"
          :min="0"
          :max="FIELD_MAX.verticalBorder"
          :step="1"
          :disabled="locked"
          :model-value="timing.verticalBorder"
          @update:model-value="(v) => onNumber('verticalBorder', v)"
        />
      </label>
    </div>

    <!-- Flags -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sync Type
        <select
          :class="selectClass"
          :disabled="locked"
          :value="timing.flags.syncType"
          @change="(e: Event) => onFlag('syncType', (e.target as HTMLSelectElement).value)"
        >
          <option v-for="opt in SYNC_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Stereo Mode
        <select
          :class="selectClass"
          :disabled="locked"
          :value="timing.flags.stereoMode"
          @change="(e: Event) => onFlag('stereoMode', (e.target as HTMLSelectElement).value)"
        >
          <option v-for="opt in STEREO_MODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label :class="switchRowClass">
        <span class="text-xs text-muted-foreground">Interlaced</span>
        <Switch
          :model-value="timing.flags.interlaced"
          :disabled="locked"
          @update:model-value="(v: boolean) => onFlag('interlaced', v)"
        />
      </label>
    </div>

    <!-- Sync-type-dependent sub-flags -->
    <div v-if="isDigitalSeparate" class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Sync Polarity
        <select
          :class="selectClass"
          :disabled="locked"
          :value="timing.flags.vSyncPolarity ?? 'positive'"
          @change="(e: Event) => onFlag('vSyncPolarity', (e.target as HTMLSelectElement).value)"
        >
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Sync Polarity
        <select
          :class="selectClass"
          :disabled="locked"
          :value="timing.flags.hSyncPolarity ?? 'positive'"
          @change="(e: Event) => onFlag('hSyncPolarity', (e.target as HTMLSelectElement).value)"
        >
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
      </label>
    </div>

    <div v-else-if="isDigitalComposite" class="grid gap-3 sm:grid-cols-2">
      <label class="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serration on V-Sync</span>
        <Switch
          :model-value="timing.flags.serrationOnVSync ?? false"
          :disabled="locked"
          @update:model-value="(v: boolean) => onFlag('serrationOnVSync', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Sync Polarity
        <select
          :class="selectClass"
          :disabled="locked"
          :value="timing.flags.hSyncPolarity ?? 'positive'"
          @change="(e: Event) => onFlag('hSyncPolarity', (e.target as HTMLSelectElement).value)"
        >
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
      </label>
    </div>

    <div v-else-if="isAnalog" class="grid gap-3 sm:grid-cols-2">
      <label class="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serration on V-Sync</span>
        <Switch
          :model-value="timing.flags.serrationOnVSync ?? false"
          :disabled="locked"
          @update:model-value="(v: boolean) => onFlag('serrationOnVSync', v)"
        />
      </label>
      <label class="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sync on All Channels</span>
        <Switch
          :model-value="timing.flags.syncOnAllChannels ?? false"
          :disabled="locked"
          @update:model-value="(v: boolean) => onFlag('syncOnAllChannels', v)"
        />
      </label>
    </div>
  </div>
</template>