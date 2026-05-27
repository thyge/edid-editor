<script setup lang="ts">
import type { CVTTimingDescriptor } from 'edidts'

defineProps<{ descriptor: CVTTimingDescriptor }>()

type CVTRefreshRates = CVTTimingDescriptor['timings'][number]['refreshRates']
type CVTRefreshRateKey = keyof CVTRefreshRates

const refreshRateFlags: Array<{ key: CVTRefreshRateKey; label: string }> = [
  { key: 'r50Hz', label: '50 Hz' },
  { key: 'r60Hz', label: '60 Hz' },
  { key: 'r75Hz', label: '75 Hz' },
  { key: 'r85Hz', label: '85 Hz' },
  { key: 'r60HzRB', label: '60 Hz RB' },
]

function formatCVTRefreshList(flags: CVTRefreshRates): string {
  const supported = refreshRateFlags
    .filter(({ key }) => flags[key])
    .map(({ label }) => label)
  return supported.length > 0 ? supported.join(', ') : 'None'
}
</script>

<template>
  <div v-if="descriptor.timings.length > 0" class="space-y-2">
    <div
      v-for="(timing, index) in descriptor.timings"
      :key="index"
      class="rounded bg-muted/40 p-2"
    >
      <div class="font-medium">{{ timing.addressableLines }} lines · {{ timing.aspectRatio }}</div>
      <div>Preferred: {{ timing.preferredRefreshRate }} Hz</div>
      <div>Supported: {{ formatCVTRefreshList(timing.refreshRates) }}</div>
    </div>
  </div>
  <div v-else class="text-muted-foreground">No CVT codes defined</div>
</template>
