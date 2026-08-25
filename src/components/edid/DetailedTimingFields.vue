<script setup lang="ts">
import { computed } from 'vue'
import type { DetailedTiming } from 'edidts'
import { STEREO_MODE_OPTIONS, SYNC_TYPE_OPTIONS } from 'edidts'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

/**
 * Shared field-level editor for the 18-byte Detailed Timing Descriptor geometry,
 * sync, image-size, border, and flag fields. Used by both the EDID base
 * descriptor slots (DetailedDescriptors.vue) and the CTA-861 DTDs
 * (CEADetailedTimings.vue), which share the same DetailedTiming field set via
 * the common DTD codec (see packages/edidts/src/common/detailed-timing-descriptor.ts).
 *
 * Emits `update` with a dotted field path (e.g. "pixelClock", "flags.interlaced",
 * "flags.vSyncPolarity") and the new value. The owning component mutates the
 * matching DetailedTiming instance; the useEDID computed re-encodes.
 */
const props = defineProps<{
  timing: DetailedTiming
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const isDigitalSeparate = computed(() => props.timing.flags.syncType === 'digital-separate')
const isDigitalComposite = computed(() => props.timing.flags.syncType === 'digital-composite')
const isAnalog = computed(() =>
  props.timing.flags.syncType === 'analog-composite' ||
  props.timing.flags.syncType === 'bipolar-analog-composite'
)

function onNumber(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', field, Number.isFinite(parsed) ? Math.round(parsed) : 0)
}

function onPixelClock(v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  // pixelClock is in MHz with 0.01 MHz resolution (10 kHz units).
  emit('update', 'pixelClock', Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0)
}

function onFlag(flag: string, value: unknown) {
  emit('update', `flags.${flag}`, value)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Pixel clock + geometry -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Pixel Clock (MHz)
        <Input
          type="number"
          :min="0"
          :step="0.01"
          :model-value="timing.pixelClock"
          @update:model-value="(v) => onPixelClock(v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Active (px)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.horizontalActive"
          @update:model-value="(v) => onNumber('horizontalActive', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Blanking (px)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.horizontalBlanking"
          @update:model-value="(v) => onNumber('horizontalBlanking', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Active (lines)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.verticalActive"
          @update:model-value="(v) => onNumber('verticalActive', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Blanking (lines)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.verticalBlanking"
          @update:model-value="(v) => onNumber('verticalBlanking', v)"
        />
      </label>
    </div>

    <!-- Sync timing -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Sync Offset (px)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.horizontalSyncOffset"
          @update:model-value="(v) => onNumber('horizontalSyncOffset', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Sync Width (px)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.horizontalSyncWidth"
          @update:model-value="(v) => onNumber('horizontalSyncWidth', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Sync Offset (lines)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.verticalSyncOffset"
          @update:model-value="(v) => onNumber('verticalSyncOffset', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Sync Width (lines)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.verticalSyncWidth"
          @update:model-value="(v) => onNumber('verticalSyncWidth', v)"
        />
      </label>
    </div>

    <!-- Image size + borders -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Image Size (mm)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.horizontalImageSize"
          @update:model-value="(v) => onNumber('horizontalImageSize', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Image Size (mm)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.verticalImageSize"
          @update:model-value="(v) => onNumber('verticalImageSize', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Border (px)
        <Input
          type="number"
          :min="0"
          :step="1"
          :model-value="timing.horizontalBorder"
          @update:model-value="(v) => onNumber('horizontalBorder', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Border (lines)
        <Input
          type="number"
          :min="0"
          :step="1"
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
          :value="timing.flags.stereoMode"
          @change="(e: Event) => onFlag('stereoMode', (e.target as HTMLSelectElement).value)"
        >
          <option v-for="opt in STEREO_MODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label class="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interlaced</span>
        <Switch
          :checked="timing.flags.interlaced"
          @update:checked="(v: boolean) => onFlag('interlaced', v)"
        />
      </label>
    </div>

    <!-- Sync-type-dependent sub-flags -->
    <div v-if="isDigitalSeparate" class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        V. Sync Polarity
        <select
          :class="selectClass"
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
          :checked="timing.flags.serrationOnVSync ?? false"
          @update:checked="(v: boolean) => onFlag('serrationOnVSync', v)"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        H. Sync Polarity
        <select
          :class="selectClass"
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
          :checked="timing.flags.serrationOnVSync ?? false"
          @update:checked="(v: boolean) => onFlag('serrationOnVSync', v)"
        />
      </label>
      <label class="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sync on All Channels</span>
        <Switch
          :checked="timing.flags.syncOnAllChannels ?? false"
          @update:checked="(v: boolean) => onFlag('syncOnAllChannels', v)"
        />
      </label>
    </div>
  </div>
</template>