<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CEAExtensionBlock, CEADetailedTiming } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const timings = computed(() => props.cea.detailedTimings)
const expandedTimings = ref<Set<number>>(new Set())

function toggleDetails(index: number) {
  const next = new Set(expandedTimings.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  expandedTimings.value = next
}

function refreshRate(t: CEADetailedTiming): string {
  const hTotal = t.horizontalActive + t.horizontalBlanking
  const vTotal = t.verticalActive + t.verticalBlanking
  if (hTotal === 0 || vTotal === 0) return '0.00'
  const rate = (t.pixelClock * 1_000_000) / (hTotal * vTotal)
  return rate.toFixed(2)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CEA Detailed Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-if="timings.length > 0" class="space-y-3">
        <div
          v-for="(timing, i) in timings"
          :key="i"
          class="rounded-2xl border border-border/60 bg-card/40 shadow-sm"
        >
          <div class="flex flex-wrap items-start gap-4 border-b border-border/40 p-4">
            <div>
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Timing {{ i + 1 }}</p>
              <p class="text-lg font-semibold text-foreground">
                {{ timing.horizontalActive }}×{{ timing.verticalActive }}{{ timing.interlaced ? 'i' : 'p' }} ·
                {{ refreshRate(timing) }} Hz
              </p>
              <p class="text-xs text-muted-foreground">{{ timing.pixelClock.toFixed(2) }} MHz pixel clock</p>
            </div>
            <div class="ml-auto flex items-center gap-3">
              <span class="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {{ timing.interlaced ? 'Interlaced' : 'Progressive' }}
              </span>
              <button
                type="button"
                class="text-xs font-semibold text-foreground/80 hover:text-primary"
                @click="toggleDetails(i)"
              >
                {{ expandedTimings.has(i) ? 'Hide details' : 'Show details' }}
              </button>
            </div>
          </div>

          <div
            v-if="expandedTimings.has(i)"
            class="border-t border-border/40 p-4 text-xs text-muted-foreground"
          >
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-lg border border-border/40 p-3">
                <p class="text-[11px] uppercase tracking-wide mb-2">Horizontal</p>
                <div class="space-y-1">
                  <div class="flex justify-between"><span>Active</span><span class="font-mono text-foreground">{{ timing.horizontalActive }} px</span></div>
                  <div class="flex justify-between"><span>Blanking</span><span class="font-mono text-foreground">{{ timing.horizontalBlanking }} px</span></div>
                  <div class="flex justify-between"><span>Sync Offset</span><span class="font-mono text-foreground">{{ timing.horizontalSyncOffset }} px</span></div>
                  <div class="flex justify-between"><span>Sync Width</span><span class="font-mono text-foreground">{{ timing.horizontalSyncWidth }} px</span></div>
                </div>
              </div>
              <div class="rounded-lg border border-border/40 p-3">
                <p class="text-[11px] uppercase tracking-wide mb-2">Vertical</p>
                <div class="space-y-1">
                  <div class="flex justify-between"><span>Active</span><span class="font-mono text-foreground">{{ timing.verticalActive }} lines</span></div>
                  <div class="flex justify-between"><span>Blanking</span><span class="font-mono text-foreground">{{ timing.verticalBlanking }} lines</span></div>
                  <div class="flex justify-between"><span>Sync Offset</span><span class="font-mono text-foreground">{{ timing.verticalSyncOffset }} lines</span></div>
                  <div class="flex justify-between"><span>Sync Width</span><span class="font-mono text-foreground">{{ timing.verticalSyncWidth }} lines</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-muted-foreground">No detailed timing descriptors in CEA extension.</p>
    </CardContent>
  </Card>
</template>
