<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { DisplayRangeLimitsDescriptor } from 'edidts'
import { Input } from '@/components/ui/input'

type CVTDescriptorData = NonNullable<DisplayRangeLimitsDescriptor['cvt']>
type CVTAspectFlags = CVTDescriptorData['aspectRatios']
type RangeNumberField =
  | 'minVerticalRate'
  | 'maxVerticalRate'
  | 'minHorizontalRate'
  | 'maxHorizontalRate'
  | 'maxPixelClock'
type CVTBooleanField =
  | 'reducedBlankingPreferred'
  | 'standardBlankingSupported'
  | 'horizontalShrinkSupported'
  | 'horizontalStretchSupported'
  | 'verticalShrinkSupported'
  | 'verticalStretchSupported'

const selectClass = 'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const timingSupportOptions: Array<{ value: DisplayRangeLimitsDescriptor['timingSupport']; label: string }> = [
  { value: 'default-gtf', label: 'Default GTF' },
  { value: 'range-limits-only', label: 'Range limits only' },
  { value: 'secondary-gtf', label: 'Secondary GTF' },
  { value: 'cvt', label: 'CVT' },
]

const cvtAspectRatioLabels: Array<{ key: keyof CVTAspectFlags; label: string }> = [
  { key: 'ar4_3', label: '4:3' },
  { key: 'ar16_9', label: '16:9' },
  { key: 'ar16_10', label: '16:10' },
  { key: 'ar5_4', label: '5:4' },
  { key: 'ar15_9', label: '15:9' },
]

const props = defineProps<{ descriptor: DisplayRangeLimitsDescriptor }>()
const emit = defineEmits<{ update: [descriptor: DisplayRangeLimitsDescriptor] }>()

function cloneDescriptor(source: DisplayRangeLimitsDescriptor): DisplayRangeLimitsDescriptor {
  return {
    ...source,
    secondaryGTF: source.secondaryGTF ? { ...source.secondaryGTF } : undefined,
    cvt: source.cvt
      ? {
          ...source.cvt,
          aspectRatios: { ...source.cvt.aspectRatios },
        }
      : undefined,
  }
}

const local = reactive<DisplayRangeLimitsDescriptor>(cloneDescriptor(props.descriptor))

watch(
  () => props.descriptor,
  (next) => {
    const copy = cloneDescriptor(next)
    Object.assign(local, copy)
  },
  { deep: true }
)

const showSecondaryGTF = computed(() => local.timingSupport === 'secondary-gtf')
const showCVT = computed(() => local.timingSupport === 'cvt')

function emitUpdate() {
  emit('update', cloneDescriptor(local))
}

function parseNumber(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function updateNumberField(field: RangeNumberField, value: string | number) {
  const next = parseNumber(value)
  if (local[field] === next) return
  local[field] = next
  emitUpdate()
}

function ensureSecondaryGTF() {
  if (!local.secondaryGTF) {
    local.secondaryGTF = {
      startFrequency: 30,
      c: 40,
      m: 600,
      k: 128,
      j: 20,
    }
  }
}

function ensureCVT() {
  if (!local.cvt) {
    local.cvt = {
      version: 3,
      maxActivePixelsPerLine: 1920,
      aspectRatios: {
        ar4_3: true,
        ar16_9: true,
        ar16_10: false,
        ar5_4: false,
        ar15_9: false,
      },
      preferredAspectRatio: '16:9',
      reducedBlankingPreferred: false,
      standardBlankingSupported: true,
      horizontalShrinkSupported: false,
      horizontalStretchSupported: false,
      verticalShrinkSupported: false,
      verticalStretchSupported: false,
      preferredVerticalRefresh: 60,
    }
  }
}

function updateTimingSupport(value: DisplayRangeLimitsDescriptor['timingSupport']) {
  local.timingSupport = value
  if (value === 'secondary-gtf') {
    ensureSecondaryGTF()
    delete local.cvt
  } else if (value === 'cvt') {
    ensureCVT()
    delete local.secondaryGTF
  } else {
    delete local.secondaryGTF
    delete local.cvt
  }
  emitUpdate()
}

function updateSecondaryGTFField(
  field: keyof NonNullable<DisplayRangeLimitsDescriptor['secondaryGTF']>,
  value: string | number,
) {
  ensureSecondaryGTF()
  if (!local.secondaryGTF) return
  local.secondaryGTF[field] = parseNumber(value)
  emitUpdate()
}

function updateCVTField(field: keyof CVTDescriptorData, value: string | number) {
  ensureCVT()
  if (!local.cvt) return
  switch (field) {
    case 'preferredAspectRatio':
      local.cvt.preferredAspectRatio = value as CVTDescriptorData['preferredAspectRatio']
      break
    case 'preferredVerticalRefresh':
      local.cvt.preferredVerticalRefresh = parseNumber(value)
      break
    case 'version':
      local.cvt.version = parseNumber(value)
      break
    case 'maxActivePixelsPerLine':
      local.cvt.maxActivePixelsPerLine = parseNumber(value)
      break
  }
  emitUpdate()
}

function updateCVTBoolean(field: CVTBooleanField, checked: boolean) {
  ensureCVT()
  if (!local.cvt) return
  local.cvt[field] = checked
  emitUpdate()
}

function updateCVTAspectRatio(flag: keyof CVTAspectFlags, checked: boolean) {
  ensureCVT()
  if (!local.cvt) return
  local.cvt.aspectRatios[flag] = checked
  emitUpdate()
}

function onTimingSupportChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as DisplayRangeLimitsDescriptor['timingSupport']
  updateTimingSupport(value)
}

function onPreferredAspectChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as CVTDescriptorData['preferredAspectRatio']
  updateCVTField('preferredAspectRatio', value)
}
</script>

<template>
  <div class="space-y-4 text-sm">
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Min Vertical (Hz)
        <Input
          type="number"
          :min="0"
          :model-value="local.minVerticalRate"
          @update:model-value="(v) => updateNumberField('minVerticalRate', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Max Vertical (Hz)
        <Input
          type="number"
          :min="0"
          :model-value="local.maxVerticalRate"
          @update:model-value="(v) => updateNumberField('maxVerticalRate', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Min Horizontal (kHz)
        <Input
          type="number"
          :min="0"
          :model-value="local.minHorizontalRate"
          @update:model-value="(v) => updateNumberField('minHorizontalRate', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Max Horizontal (kHz)
        <Input
          type="number"
          :min="0"
          :model-value="local.maxHorizontalRate"
          @update:model-value="(v) => updateNumberField('maxHorizontalRate', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">
        Max Pixel Clock (MHz)
        <Input
          type="number"
          :min="0"
          :step="10"
          :model-value="local.maxPixelClock"
          @update:model-value="(v) => updateNumberField('maxPixelClock', v)"
        />
      </label>
    </div>

    <div class="space-y-1">
      <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timing Support</span>
      <select :class="selectClass" :value="local.timingSupport" @change="onTimingSupportChange">
        <option v-for="opt in timingSupportOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div v-if="showSecondaryGTF" class="rounded-lg border border-border/50 p-3 space-y-2 text-xs">
      <p class="font-semibold text-muted-foreground uppercase tracking-wide">Secondary GTF Parameters</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1">
          Start Frequency (kHz)
          <Input
            type="number"
            :min="0"
            :model-value="local.secondaryGTF?.startFrequency ?? 0"
            @update:model-value="(v) => updateSecondaryGTFField('startFrequency', v)"
          />
        </label>
        <label class="flex flex-col gap-1">
          C
          <Input
            type="number"
            :model-value="local.secondaryGTF?.c ?? 0"
            @update:model-value="(v) => updateSecondaryGTFField('c', v)"
          />
        </label>
        <label class="flex flex-col gap-1">
          M
          <Input
            type="number"
            :model-value="local.secondaryGTF?.m ?? 0"
            @update:model-value="(v) => updateSecondaryGTFField('m', v)"
          />
        </label>
        <label class="flex flex-col gap-1">
          K
          <Input
            type="number"
            :model-value="local.secondaryGTF?.k ?? 0"
            @update:model-value="(v) => updateSecondaryGTFField('k', v)"
          />
        </label>
        <label class="flex flex-col gap-1">
          J
          <Input
            type="number"
            :model-value="local.secondaryGTF?.j ?? 0"
            @update:model-value="(v) => updateSecondaryGTFField('j', v)"
          />
        </label>
      </div>
    </div>

    <div v-if="showCVT" class="rounded-lg border border-border/50 p-3 space-y-3 text-xs">
      <p class="font-semibold text-muted-foreground uppercase tracking-wide">CVT Parameters</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1">
          Version
          <Input
            type="number"
            :min="1"
            :model-value="local.cvt?.version ?? 0"
            @update:model-value="(v) => updateCVTField('version', v)"
          />
        </label>
        <label class="flex flex-col gap-1">
          Max Active Pixels Per Line
          <Input
            type="number"
            :min="0"
            :step="8"
            :model-value="local.cvt?.maxActivePixelsPerLine ?? 0"
            @update:model-value="(v) => updateCVTField('maxActivePixelsPerLine', v)"
          />
        </label>
        <label class="flex flex-col gap-1">
          Preferred Aspect Ratio
          <select
            :class="selectClass"
            :value="local.cvt?.preferredAspectRatio"
            @change="onPreferredAspectChange"
          >
            <option value="4:3">4:3</option>
            <option value="16:9">16:9</option>
            <option value="16:10">16:10</option>
            <option value="5:4">5:4</option>
            <option value="15:9">15:9</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          Preferred Refresh (Hz)
          <Input
            type="number"
            :min="0"
            :model-value="local.cvt?.preferredVerticalRefresh ?? 0"
            @update:model-value="(v) => updateCVTField('preferredVerticalRefresh', v)"
          />
        </label>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="size-4 rounded border border-input accent-primary"
            :checked="local.cvt?.reducedBlankingPreferred ?? false"
            @change="(e) => updateCVTBoolean('reducedBlankingPreferred', (e.target as HTMLInputElement).checked)"
          />
          Reduced Blanking Preferred
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="size-4 rounded border border-input accent-primary"
            :checked="local.cvt?.standardBlankingSupported ?? false"
            @change="(e) => updateCVTBoolean('standardBlankingSupported', (e.target as HTMLInputElement).checked)"
          />
          Standard Blanking Supported
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="size-4 rounded border border-input accent-primary"
            :checked="local.cvt?.horizontalShrinkSupported ?? false"
            @change="(e) => updateCVTBoolean('horizontalShrinkSupported', (e.target as HTMLInputElement).checked)"
          />
          Horizontal Shrink
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="size-4 rounded border border-input accent-primary"
            :checked="local.cvt?.horizontalStretchSupported ?? false"
            @change="(e) => updateCVTBoolean('horizontalStretchSupported', (e.target as HTMLInputElement).checked)"
          />
          Horizontal Stretch
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="size-4 rounded border border-input accent-primary"
            :checked="local.cvt?.verticalShrinkSupported ?? false"
            @change="(e) => updateCVTBoolean('verticalShrinkSupported', (e.target as HTMLInputElement).checked)"
          />
          Vertical Shrink
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="size-4 rounded border border-input accent-primary"
            :checked="local.cvt?.verticalStretchSupported ?? false"
            @change="(e) => updateCVTBoolean('verticalStretchSupported', (e.target as HTMLInputElement).checked)"
          />
          Vertical Stretch
        </label>
      </div>

      <div class="space-y-1">
        <p class="font-semibold text-muted-foreground">Supported Aspect Ratios</p>
        <div class="flex flex-wrap gap-3">
          <label
            v-for="ratio in cvtAspectRatioLabels"
            :key="ratio.key"
            class="inline-flex items-center gap-2"
          >
            <input
              type="checkbox"
              class="size-4 rounded border border-input accent-primary"
              :checked="local.cvt?.aspectRatios[ratio.key] ?? false"
              @change="(e) => updateCVTAspectRatio(ratio.key, (e.target as HTMLInputElement).checked)"
            />
            {{ ratio.label }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
