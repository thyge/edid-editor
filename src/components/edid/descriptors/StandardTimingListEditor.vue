<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export type TimingInput = {
  width: number
  height: number
  refreshRate: number
}

type AspectCode = '16:10' | '4:3' | '5:4' | '16:9'

const aspectOptions: Array<{ label: string; value: AspectCode; w: number; h: number }> = [
  { label: '16:10', value: '16:10', w: 16, h: 10 },
  { label: '4:3', value: '4:3', w: 4, h: 3 },
  { label: '5:4', value: '5:4', w: 5, h: 4 },
  { label: '16:9', value: '16:9', w: 16, h: 9 },
]

const selectClass = 'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

type EditableTiming = {
  width: number
  refreshRate: number
  aspect: AspectCode
}

const props = defineProps<{
  timings: TimingInput[]
  maxItems: number
  emptyMessage?: string
  slotsLabel?: string
}>()

const emit = defineEmits<{ update: [TimingInput[]] }>()

const localTimings = ref<EditableTiming[]>(toEditableList(props.timings))

watch(
  () => props.timings,
  (next) => {
    localTimings.value = toEditableList(next)
  },
  { deep: true }
)

const canAdd = computed(() => localTimings.value.length < props.maxItems)
const slotsRemaining = computed(() => Math.max(0, props.maxItems - localTimings.value.length))

function inferAspect(width: number, height: number): AspectCode {
  if (width <= 0 || height <= 0) return '16:9'
  const ratio = width / height
  let best: AspectCode = '16:9'
  let bestDiff = Number.POSITIVE_INFINITY
  for (const option of aspectOptions) {
    const optionRatio = option.w / option.h
    const diff = Math.abs(optionRatio - ratio)
    if (diff < bestDiff) {
      bestDiff = diff
      best = option.value
    }
  }
  return best
}

function toEditable(timing: TimingInput): EditableTiming {
  return {
    width: timing?.width ?? 640,
    refreshRate: timing?.refreshRate ?? 60,
    aspect: inferAspect(timing?.width ?? 640, timing?.height ?? 480),
  }
}

function toEditableList(timings: TimingInput[] = []): EditableTiming[] {
  return (timings ?? []).map((timing) => toEditable(timing)).slice(0, props.maxItems)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function sanitizeWidth(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 640
  const clamped = clamp(value, 256, 8192)
  return Math.round(clamped / 8) * 8
}

function sanitizeRefresh(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 60
  return Math.round(clamp(value, 24, 240))
}

function heightForAspect(width: number, aspect: AspectCode): number {
  const option = aspectOptions.find((opt) => opt.value === aspect) ?? aspectOptions[aspectOptions.length - 1]!
  const height = Math.round((width * option.h) / option.w)
  return clamp(height, 200, 4320)
}

function emitUpdate() {
  const normalized = localTimings.value.map((timing) => {
    const width = sanitizeWidth(timing.width)
    const refreshRate = sanitizeRefresh(timing.refreshRate)
    const height = heightForAspect(width, timing.aspect)
    return { width, height, refreshRate }
  })
  emit('update', normalized)
}

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function updateTimingField(index: number, field: 'width' | 'refreshRate', value: string | number) {
  const parsed = parseNumber(value)
  localTimings.value = localTimings.value.map((timing, idx) => {
    if (idx !== index) return timing
    return { ...timing, [field]: parsed }
  })
  emitUpdate()
}

function updateAspect(index: number, value: AspectCode) {
  localTimings.value = localTimings.value.map((timing, idx) => {
    if (idx !== index) return timing
    return { ...timing, aspect: value }
  })
  emitUpdate()
}

function removeTiming(index: number) {
  localTimings.value = localTimings.value.filter((_, idx) => idx !== index)
  emitUpdate()
}

function createDefaultTiming(): EditableTiming {
  return {
    width: 1920,
    refreshRate: 60,
    aspect: '16:9',
  }
}

function addTiming() {
  if (!canAdd.value) return
  localTimings.value = [...localTimings.value, createDefaultTiming()]
  emitUpdate()
}

function subtitle(timing: EditableTiming): string {
  const width = sanitizeWidth(timing.width)
  const height = heightForAspect(width, timing.aspect)
  const refresh = sanitizeRefresh(timing.refreshRate)
  return `${width}×${height} · ${refresh} Hz (${timing.aspect})`
}
</script>

<template>
  <div class="space-y-3 text-sm">
    <div v-if="localTimings.length > 0" class="grid gap-3 md:grid-cols-2">
      <div
        v-for="(timing, index) in localTimings"
        :key="`timing-${index}`"
        class="rounded-lg border border-border/60 p-3 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Standard Timing {{ index + 1 }}
            </p>
            <p class="text-xs text-muted-foreground/80">{{ subtitle(timing) }}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10"
            @click="removeTiming(index)"
          >
            Remove
          </Button>
        </div>

        <div class="grid gap-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Width (px)
              <Input
                type="number"
                :min="256"
                :max="8192"
                :step="8"
                :model-value="timing.width"
                @update:model-value="(v) => updateTimingField(index, 'width', v)"
              />
            </label>
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Refresh (Hz)
              <Input
                type="number"
                :min="24"
                :max="240"
                :step="1"
                :model-value="timing.refreshRate"
                @update:model-value="(v) => updateTimingField(index, 'refreshRate', v)"
              />
            </label>
          </div>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Aspect Ratio
            <select
              :class="selectClass"
              :value="timing.aspect"
              @change="(e: Event) => updateAspect(index, (e.target as HTMLSelectElement).value as AspectCode)"
            >
              <option v-for="option in aspectOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <div v-else class="rounded-md border border-dashed border-border/60 p-4 text-center text-muted-foreground">
      {{ props.emptyMessage ?? 'No standard timings defined.' }}
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" :disabled="!canAdd" @click="addTiming">
        Add Timing
      </Button>
      <p class="text-xs text-muted-foreground">
        {{ slotsRemaining }} {{ props.slotsLabel ?? 'slots remaining' }}
      </p>
    </div>
  </div>
</template>
