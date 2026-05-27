<script setup lang="ts">
import { computed } from 'vue'
import type { DetailedTimingDescriptor } from 'edidts'
import type { EDIDViewModel } from '@/types/edid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{ edid: EDIDViewModel }>()

const header = computed(() => props.edid.header)
const videoInput = computed(() => props.edid.videoInput)
const manufacturerLabel = computed(() => header.value.manufacturerName ?? header.value.manufacturerId)
const productLabel = computed(() => {
  const name = props.edid.productName?.trim()
  return name && name.length > 0 ? name : formatProductCode(header.value.productCode)
})
const edidVersion = computed(() => `${header.value.edidVersion}.${header.value.edidRevision}`)
const inputTypeLabel = computed(() => (videoInput.value.isDigital ? 'Digital' : 'Analog'))
const bitDepthLabel = computed(() => {
  if (!videoInput.value.isDigital) {
    return 'N/A'
  }
  const bitDepth = (videoInput.value.input as { bitDepth?: string | number }).bitDepth
  if (bitDepth === 'undefined' || bitDepth === undefined) {
    return 'Unknown'
  }
  return `${bitDepth}-bit`
})
const interfaceLabel = computed(() => {
  if (!videoInput.value.isDigital) {
    return 'Analog signal'
  }
  const iface = (videoInput.value.input as { videoInterface?: string }).videoInterface
  if (!iface || iface === 'undefined') {
    return 'Unknown interface'
  }
  return iface
})
const preferredTiming = computed(() => props.edid.detailedTimings?.[0] ?? null)
const preferredTimingSummary = computed(() => {
  if (!preferredTiming.value) {
    return null
  }
  return formatTiming(preferredTiming.value)
})

function formatProductCode(code: number): string {
  return `0x${code.toString(16).toUpperCase().padStart(4, '0')}`
}

function formatTiming(timing: DetailedTimingDescriptor): string {
  const resolution = `${timing.horizontalActive} × ${timing.verticalActive}`
  const refresh = timing.refreshRate > 0 ? `${timing.refreshRate.toFixed(2)} Hz` : 'Unknown Hz'
  const scan = timing.flags.interlaced ? 'Interlaced' : 'Progressive'
  const pixelClock = timing.pixelClock > 0 ? `${timing.pixelClock.toFixed(2)} MHz` : 'Unknown clock'
  return `${resolution} @ ${refresh} · ${scan}, ${pixelClock}`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Overview</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <p class="text-muted-foreground">Manufacturer</p>
          <p class="font-medium">{{ manufacturerLabel }}</p>
        </div>
        <div>
          <p class="text-muted-foreground">Product</p>
          <p class="font-medium">{{ productLabel }}</p>
        </div>
        <div>
          <p class="text-muted-foreground">EDID Version</p>
          <p class="font-medium">{{ edidVersion }}</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <p class="text-muted-foreground">Input Type</p>
          <p class="font-medium">{{ inputTypeLabel }}</p>
        </div>
        <div>
          <p class="text-muted-foreground">Bit Depth</p>
          <p class="font-medium">{{ bitDepthLabel }}</p>
        </div>
        <div>
          <p class="text-muted-foreground">Interface</p>
          <p class="font-medium">{{ interfaceLabel }}</p>
        </div>
      </div>

      <div class="rounded-lg border p-3">
        <div class="flex items-center justify-between">
          <span class="font-medium">Preferred Timing Mode</span>
          <span class="text-xs text-muted-foreground">Descriptor #1</span>
        </div>
        <p class="mt-2 font-mono" v-if="preferredTimingSummary">{{ preferredTimingSummary }}</p>
        <p class="mt-2 text-muted-foreground" v-else>No preferred timing defined</p>
      </div>
    </CardContent>
  </Card>
</template>
