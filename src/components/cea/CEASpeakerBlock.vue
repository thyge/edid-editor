<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, SpeakerAllocationBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const speakerBlock = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x04) as SpeakerAllocationBlock | undefined
)

const speakers = computed(() => speakerBlock.value?.speakers)

type Elevation = 'floor' | 'top' | 'sub'

interface SpeakerNode {
  key: string
  label: string
  description: string
  x: number
  y: number
  elevation: Elevation
}

const pairedKeys = [
  'frontLeftRight', 'rearLeftRight', 'frontLeftRightCenter',
  'rearLeftRightCenter', 'frontLeftRightWide', 'frontLeftRightHigh',
]

const speakerNodes: SpeakerNode[] = [
  // Front wall (ear level)
  { key: 'frontLeftRightWide', label: 'FLW', description: 'Front Left Wide', x: 5, y: 14, elevation: 'floor' },
  { key: 'frontLeftRight', label: 'FL', description: 'Front Left', x: 20, y: 14, elevation: 'floor' },
  { key: 'frontLeftRightCenter', label: 'FLC', description: 'Front Left of Center', x: 37, y: 14, elevation: 'floor' },
  { key: 'frontCenter', label: 'FC', description: 'Front Center', x: 50, y: 14, elevation: 'floor' },
  { key: 'frontLeftRightCenter', label: 'FRC', description: 'Front Right of Center', x: 63, y: 14, elevation: 'floor' },
  { key: 'frontLeftRight', label: 'FR', description: 'Front Right', x: 80, y: 14, elevation: 'floor' },
  { key: 'frontLeftRightWide', label: 'FRW', description: 'Front Right Wide', x: 95, y: 14, elevation: 'floor' },

  // Height speakers (overhead, between front and listener)
  { key: 'frontLeftRightHigh', label: 'FLH', description: 'Front Left High', x: 22, y: 32, elevation: 'top' },
  { key: 'frontCenterHigh', label: 'FCH', description: 'Front Center High', x: 50, y: 32, elevation: 'top' },
  { key: 'frontLeftRightHigh', label: 'FRH', description: 'Front Right High', x: 78, y: 32, elevation: 'top' },

  // LFE (subwoofer, front-left area)
  { key: 'lfe', label: 'LFE', description: 'Low Frequency Effects (Subwoofer)', x: 10, y: 42, elevation: 'sub' },

  // Top Center (overhead, directly above listener)
  { key: 'topCenter', label: 'TC', description: 'Top Center', x: 50, y: 55, elevation: 'top' },

  // Rear speakers (ear level, back wall)
  { key: 'rearLeftRightCenter', label: 'RLC', description: 'Rear Left of Center', x: 25, y: 86, elevation: 'floor' },
  { key: 'rearLeftRight', label: 'RL', description: 'Rear Left', x: 10, y: 86, elevation: 'floor' },
  { key: 'rearCenter', label: 'RC', description: 'Rear Center', x: 50, y: 86, elevation: 'floor' },
  { key: 'rearLeftRight', label: 'RR', description: 'Rear Right', x: 90, y: 86, elevation: 'floor' },
  { key: 'rearLeftRightCenter', label: 'RRC', description: 'Rear Right of Center', x: 75, y: 86, elevation: 'floor' },
]

function toggleSpeaker(key: string) {
  if (!speakers.value) return
  const current = (speakers.value as Record<string, boolean>)[key]
  const updated = { ...speakers.value, [key]: !current }
  emit('update', 'speakerBlock.speakers', updated)
}

function isActive(key: string): boolean {
  if (!speakers.value) return false
  return (speakers.value as Record<string, boolean>)[key] ?? false
}

const activeCount = computed(() => {
  if (!speakers.value) return 0
  let count = 0
  for (const [key, val] of Object.entries(speakers.value)) {
    if (!val) continue
    count += pairedKeys.includes(key) ? 2 : 1
  }
  return count
})

function nodeClasses(node: SpeakerNode): string {
  const base = 'flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 select-none w-[44px] py-1'
  const dashed = node.elevation === 'top' ? 'border-dashed' : ''
  const active = isActive(node.key)

  let colors: string
  if (!active) {
    colors = 'border-muted-foreground/20 bg-background/70 text-muted-foreground hover:border-muted-foreground/40 hover:bg-background'
  } else if (node.elevation === 'sub') {
    colors = 'border-chart-5 bg-chart-5/20 text-foreground shadow-md shadow-chart-5/25'
  } else if (node.elevation === 'top') {
    colors = 'border-blue-500 bg-blue-500/15 text-foreground shadow-md shadow-blue-500/20'
  } else {
    colors = 'border-primary bg-primary/15 text-foreground shadow-md shadow-primary/20'
  }

  return `${base} ${dashed} ${colors}`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <span>Speaker Allocation</span>
        <span class="text-sm font-normal text-muted-foreground">
          {{ activeCount }} channel{{ activeCount !== 1 ? 's' : '' }} active
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent class="text-sm">
      <div v-if="speakers">
        <div class="mx-auto" style="max-width: 540px;">
          <!-- Room -->
          <div class="relative rounded-2xl border-2 border-muted-foreground/20 bg-muted/10 overflow-hidden" style="aspect-ratio: 5 / 4;">

            <!-- TV (top-down view) -->
            <div class="absolute left-[20%] right-[20%] top-[2%] flex flex-col items-center">
              <div class="w-full h-[6px] rounded-sm bg-foreground/70"></div>
              <div class="w-[12%] h-[4px] bg-foreground/40 rounded-b-sm"></div>
            </div>

            <!-- Listener -->
            <div class="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 z-10">
              <div class="w-11 h-11 rounded-full border-2 border-muted-foreground/20 bg-background/80 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-muted-foreground/60">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

            <!-- Speakers -->
            <button
              v-for="(node, i) in speakerNodes"
              :key="node.label + '-' + i"
              class="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
              :style="{ left: node.x + '%', top: node.y + '%' }"
              :title="node.description"
              @click="toggleSpeaker(node.key)"
            >
              <div :class="nodeClasses(node)">
                <span class="font-mono text-[9px] font-bold leading-none">{{ node.label }}</span>
                <span class="text-[7px] mt-0.5 opacity-50">{{ isActive(node.key) ? 'ON' : 'OFF' }}</span>
              </div>
              <!-- Tooltip -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded bg-foreground text-background text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                {{ node.description }}
              </div>
            </button>

          </div>

          <!-- Legend -->
          <div class="flex flex-wrap items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-3 h-3 rounded border-2 border-primary bg-primary/15"></span>
              Ear level
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-3 h-3 rounded border-2 border-dashed border-blue-500 bg-blue-500/15"></span>
              Overhead
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-3 h-3 rounded border-2 border-chart-5 bg-chart-5/15"></span>
              Subwoofer
            </span>
          </div>
        </div>
      </div>
      <p v-else class="text-muted-foreground">No speaker allocation data block present.</p>
    </CardContent>
  </Card>
</template>
