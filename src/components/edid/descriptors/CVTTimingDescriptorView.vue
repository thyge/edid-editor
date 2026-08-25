<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { CVTTimingDescriptor } from 'edidts'
import {
  CVT_TIMING_ASPECT_RATIO_OPTIONS,
  CVT_PREFERRED_REFRESH_OPTIONS,
  CVT_REFRESH_RATE_FLAGS,
} from 'edidts'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

type CVTTiming = CVTTimingDescriptor['timings'][number]
type AspectRatio = CVTTiming['aspectRatio']
type RefreshKey = keyof CVTTiming['refreshRates']

const props = defineProps<{ descriptor: CVTTimingDescriptor }>()
const emit = defineEmits<{ update: [descriptor: CVTTimingDescriptor] }>()

function clone(d: CVTTimingDescriptor): CVTTimingDescriptor {
  return {
    ...d,
    timings: d.timings.map((t) => ({ ...t, refreshRates: { ...t.refreshRates } })),
  }
}

const local = reactive<CVTTimingDescriptor>(clone(props.descriptor))

watch(
  () => props.descriptor,
  (next) => {
    const copy = clone(next)
    local.timings = copy.timings
  },
  { deep: true },
)

function emitUpdate() {
  emit('update', clone(local))
}

const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const aspectRatioOptions = CVT_TIMING_ASPECT_RATIO_OPTIONS
const preferredRefreshOptions = CVT_PREFERRED_REFRESH_OPTIONS
const refreshRateFlags = CVT_REFRESH_RATE_FLAGS

function onLines(index: number, v: string | number) {
  const n = typeof v === 'number' ? v : Number(v)
  // addressableLines is even, range [4, 8192] (lineCode = lines/2 - 1, 1..0xFFF).
  const lines = Number.isFinite(n) ? Math.max(4, Math.min(8192, Math.round(n / 2) * 2)) : 4
  local.timings[index] = { ...local.timings[index], addressableLines: lines }
  emitUpdate()
}

function onAspect(index: number, v: AspectRatio) {
  local.timings[index] = { ...local.timings[index], aspectRatio: v }
  emitUpdate()
}

function onPreferred(index: number, v: string | number) {
  local.timings[index] = { ...local.timings[index], preferredRefreshRate: Number(v) }
  emitUpdate()
}

function onRefresh(index: number, key: RefreshKey, v: boolean) {
  local.timings[index] = {
    ...local.timings[index],
    refreshRates: { ...local.timings[index].refreshRates, [key]: v },
  }
  emitUpdate()
}

function addTiming() {
  if (local.timings.length >= 4) return
  local.timings.push({
    addressableLines: 480,
    aspectRatio: '4:3',
    preferredRefreshRate: 60,
    refreshRates: { r50Hz: false, r60Hz: true, r75Hz: false, r85Hz: false, r60HzRB: false },
  })
  emitUpdate()
}

function removeTiming(index: number) {
  local.timings.splice(index, 1)
  emitUpdate()
}
</script>

<template>
  <div class="space-y-2">
    <p class="text-[11px] uppercase tracking-wide text-muted-foreground">
      Up to 4 CVT 3-byte codes (VESA E-EDID A2 §3.10.3.6).
    </p>
    <div v-if="local.timings.length > 0" class="space-y-2">
      <div
        v-for="(timing, index) in local.timings"
        :key="index"
        class="rounded bg-muted/40 p-2 space-y-2"
      >
        <div class="flex items-end gap-2">
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
            Addressable Lines (4–8192, even)
            <Input type="number" :min="4" :max="8192" :step="2" :model-value="timing.addressableLines" @update:model-value="(v) => onLines(index, v)" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Aspect
            <select :class="selectClass" :value="timing.aspectRatio" @change="(e: Event) => onAspect(index, (e.target as HTMLSelectElement).value as AspectRatio)">
              <option v-for="opt in aspectRatioOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preferred RR
            <select :class="selectClass" :value="timing.preferredRefreshRate" @change="(e: Event) => onPreferred(index, (e.target as HTMLSelectElement).value)">
              <option v-for="rr in preferredRefreshOptions" :key="rr" :value="rr">{{ rr }} Hz</option>
            </select>
          </label>
          <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2" @click="removeTiming(index)">Remove</Button>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <label
            v-for="flag in refreshRateFlags"
            :key="flag.key"
            class="flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Switch :checked="timing.refreshRates[flag.key]" @update:checked="(v: boolean) => onRefresh(index, flag.key, v)" />
            <span>{{ flag.label }}</span>
          </label>
        </div>
      </div>
    </div>
    <div v-else class="text-muted-foreground">No CVT codes defined</div>
    <Button v-if="local.timings.length < 4" variant="outline" size="sm" @click="addTiming">Add CVT Code</Button>
  </div>
</template>