<script setup lang="ts">
import { computed, ref } from 'vue'
import { analyzeDetailedTimingWithCVT, analyzeDetailedTimingAgainstCTA } from 'edidts'
import type {
  DetailedTimingDescriptor,
  DisplayDescriptor,
  CVTAnalysisResult,
  CVTComparisonResult,
  CTAAnalysisResult,
  CTAComparisonResult,
} from 'edidts'
import type { EDIDViewModel } from '@/types/edid'
import DisplayDescriptors from './DisplayDescriptors.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  edid: EDIDViewModel
}>()

const emit = defineEmits<{
  addTiming: []
  removeTiming: [index: number]
  addDescriptor: [tag: number]
  removeDescriptor: [index: number]
  updateDescriptor: [index: number, descriptor: DisplayDescriptor]
}>()

const detailedTimings = computed(() => props.edid.detailedTimings)
const displayDescriptors = computed(() => props.edid.displayDescriptors)
const expandedTimings = ref<Set<number>>(new Set())

const meaningfulDescriptors = computed(() => displayDescriptors.value.filter(d => d.tag !== 0x10))
const usedSlots = computed(() => detailedTimings.value.length + meaningfulDescriptors.value.length)
const canAdd = computed(() => usedSlots.value < 4)

const cvtAnalysis = computed<CVTAnalysisResult[]>(() =>
  detailedTimings.value.map((timing) => analyzeDetailedTimingWithCVT(timing))
)

const ceaAnalysis = computed<CTAAnalysisResult[]>(() =>
  detailedTimings.value.map((timing) => analyzeDetailedTimingAgainstCTA(timing))
)

function toggleTimingDetails(index: number) {
  const next = new Set(expandedTimings.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  expandedTimings.value = next
}

function isTimingExpanded(index: number): boolean {
  return expandedTimings.value.has(index)
}

function scanTypeLabel(timing: DetailedTimingDescriptor): string {
  return timing.flags.interlaced ? 'Interlaced' : 'Progressive'
}

function horizontalFrontPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.horizontalSyncOffset)
}

function horizontalBackPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.horizontalBlanking - timing.horizontalSyncWidth - timing.horizontalSyncOffset)
}

function verticalFrontPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.verticalSyncOffset)
}

function verticalBackPorch(timing: DetailedTimingDescriptor): number {
  return Math.max(0, timing.verticalBlanking - timing.verticalSyncWidth - timing.verticalSyncOffset)
}

function getCVTComparisonRows(index: number): CVTComparisonResult[] {
  return (cvtAnalysis.value[index]?.comparisons ?? []).filter((comparison) => comparison.withinTolerance)
}

function getCEAClassificationDescription(index: number): string {
  const analysis = ceaAnalysis.value[index]
  if (!analysis?.matchVic) return 'Not a CTA-861 timing'
  return analysis.matchVic.name
}

function getCEAComparisonRows(index: number): CTAComparisonResult[] {
  return (ceaAnalysis.value[index]?.comparisons ?? []).filter((comparison) => comparison.withinTolerance)
}

function normalizeCVTLabel(label: string): string {
  switch (label) {
    case 'CVT RB':
      return 'CVT-RB'
    case 'CVT RB2':
      return 'CVT-RBv2'
    default:
      return label
  }
}

function getTimingClassificationLabel(index: number): string {
  const cvtLabel = cvtAnalysis.value[index]?.matchLabel
  if (cvtLabel && cvtLabel !== 'Custom') {
    return normalizeCVTLabel(cvtLabel)
  }

  if (ceaAnalysis.value[index]?.matchVic) {
    return 'CEA-861'
  }

  return 'Custom'
}

function formatDifference(value: number, unit: 'MHz' | 'px' | 'lines' | 'Hz'): string {
  const decimals = unit === 'MHz' ? 2 : 0
  const rounded = Number(value.toFixed(decimals))
  if (Object.is(rounded, -0)) {
    return `0 ${unit}`
  }
  const sign = rounded > 0 ? '+' : rounded < 0 ? '' : ''
  return `${sign}${rounded} ${unit}`
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Detailed Timing Descriptor</CardTitle>
      <Button
        variant="outline"
        size="sm"
        :disabled="!canAdd"
        @click="emit('addTiming')"
      >
        Add Timing
      </Button>
    </CardHeader>
    <CardContent class="space-y-4">
      <div v-if="detailedTimings.length > 0" class="space-y-4">
        <div
          v-for="(timing, i) in detailedTimings"
          :key="i"
          class="rounded-2xl border border-border/60 bg-card/40 shadow-sm"
        >
          <div class="flex flex-wrap items-start gap-4 border-b border-border/40 p-4">
            <div>
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Timing {{ i + 1 }}</p>
              <p class="text-lg font-semibold text-foreground">
                {{ timing.horizontalActive }}×{{ timing.verticalActive }}{{ timing.flags.interlaced ? 'i' : 'p' }} ·
                {{ timing.refreshRate.toFixed(2) }} Hz
              </p>
              <p class="text-xs text-muted-foreground">{{ timing.pixelClock.toFixed(2) }} MHz pixel clock</p>
            </div>
            <div class="ml-auto flex items-center gap-3">
              <span class="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {{ scanTypeLabel(timing) }}
              </span>
              <span class="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {{ getTimingClassificationLabel(i) }}
              </span>
              <button
                type="button"
                class="text-xs font-semibold text-foreground/80 hover:text-primary"
                @click="toggleTimingDetails(i)"
              >
                {{ isTimingExpanded(i) ? 'Hide details' : 'Show details' }}
              </button>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10"
                :disabled="detailedTimings.length <= 1"
                @click="emit('removeTiming', i)"
              >
                Remove
              </Button>
            </div>
          </div>
          <div
            v-if="isTimingExpanded(i)"
            class="border-t border-border/40 p-4 text-xs text-muted-foreground"
          >
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-lg border border-border/40 p-3">
                <p class="text-[11px] uppercase tracking-wide mb-2">Horizontal</p>
                <div class="space-y-1">
                  <div class="flex justify-between"><span>Total</span><span class="font-mono text-foreground">{{ timing.horizontalTotal }} px</span></div>
                  <div class="flex justify-between"><span>Active</span><span class="font-mono text-foreground">{{ timing.horizontalActive }} px</span></div>
                  <div class="flex justify-between"><span>Blanking</span><span class="font-mono text-foreground">{{ timing.horizontalBlanking }} px</span></div>
                  <div class="flex justify-between"><span>Front Porch</span><span class="font-mono text-foreground">{{ horizontalFrontPorch(timing) }} px</span></div>
                  <div class="flex justify-between"><span>Sync Width</span><span class="font-mono text-foreground">{{ timing.horizontalSyncWidth }} px</span></div>
                  <div class="flex justify-between"><span>Back Porch</span><span class="font-mono text-foreground">{{ horizontalBackPorch(timing) }} px</span></div>
                </div>
              </div>
              <div class="rounded-lg border border-border/40 p-3">
                <p class="text-[11px] uppercase tracking-wide mb-2">Vertical</p>
                <div class="space-y-1">
                  <div class="flex justify-between"><span>Total</span><span class="font-mono text-foreground">{{ timing.verticalTotal }} lines</span></div>
                  <div class="flex justify-between"><span>Active</span><span class="font-mono text-foreground">{{ timing.verticalActive }} lines</span></div>
                  <div class="flex justify-between"><span>Blanking</span><span class="font-mono text-foreground">{{ timing.verticalBlanking }} lines</span></div>
                  <div class="flex justify-between"><span>Front Porch</span><span class="font-mono text-foreground">{{ verticalFrontPorch(timing) }} lines</span></div>
                  <div class="flex justify-between"><span>Sync Width</span><span class="font-mono text-foreground">{{ timing.verticalSyncWidth }} lines</span></div>
                  <div class="flex justify-between"><span>Back Porch</span><span class="font-mono text-foreground">{{ verticalBackPorch(timing) }} lines</span></div>
                </div>
              </div>
            </div>

            <div class="mt-4 rounded-lg border border-border/40 p-3">
              <p class="text-[11px] uppercase tracking-wide mb-2">CTA-861 Reference</p>
              <p class="text-xs text-muted-foreground mb-3">{{ getCEAClassificationDescription(i) }}</p>
              <div class="space-y-2" v-if="getCEAComparisonRows(i).length > 0">
                <div
                  v-for="comparison in getCEAComparisonRows(i)"
                  :key="comparison.vic.vic"
                  class="rounded border border-border/30 bg-background/60 p-3"
                >
                  <div class="flex items-center justify-between text-[11px] font-semibold uppercase">
                    <span>VIC {{ comparison.vic.vic }}</span>
                    <span :class="comparison.withinTolerance ? 'text-emerald-500' : 'text-muted-foreground'">
                      {{ comparison.withinTolerance ? 'Match' : 'Mismatch' }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">{{ comparison.vic.name }}</p>
                  <div class="mt-2 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p class="font-medium text-foreground">Pixel Clock</p>
                      <p>
                        {{ comparison.vic.pixelClock.toFixed(2) }} MHz
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.pixelClock, 'MHz') }})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p class="font-medium text-foreground">Refresh Rate</p>
                      <p>
                        {{ comparison.vic.refreshRate.toFixed(2) }} Hz
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.refreshRate, 'Hz') }})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p class="font-medium text-foreground">Horizontal Total</p>
                      <p>
                        {{ comparison.vic.hTotal }} px
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.horizontalTotal, 'px') }})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p class="font-medium text-foreground">Vertical Total</p>
                      <p>
                        {{ comparison.vic.vTotal }} lines
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.verticalTotal, 'lines') }})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-muted-foreground">No matching CTA-861 timings.</p>
            </div>

            <div class="mt-4 rounded-lg border border-border/40 p-3">
              <p class="text-[11px] uppercase tracking-wide mb-2">CVT Calculator Check</p>
              <div class="space-y-2">
                <div
                  v-for="comparison in getCVTComparisonRows(i)"
                  :key="comparison.mode"
                  class="rounded border border-border/30 bg-background/60 p-3"
                >
                  <div class="flex items-center justify-between text-[11px] font-semibold uppercase">
                    <span>{{ comparison.label }}</span>
                    <span :class="comparison.withinTolerance ? 'text-emerald-500' : 'text-muted-foreground'">
                      {{ comparison.withinTolerance ? 'Match' : 'Mismatch' }}
                    </span>
                  </div>
                  <div class="mt-2 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p class="font-medium text-foreground">Pixel Clock</p>
                      <p>
                        {{ comparison.expected.pixelClock.toFixed(2) }} MHz
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.pixelClock, 'MHz') }})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p class="font-medium text-foreground">Horizontal Blanking</p>
                      <p>
                        {{ comparison.expected.horizontalBlanking }} px
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.horizontalBlanking, 'px') }})
                        </span>
                      </p>
                      <p>
                        Back porch {{ comparison.expected.horizontalBackPorch }} px
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.horizontalBackPorch, 'px') }})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p class="font-medium text-foreground">Vertical Blanking</p>
                      <p>
                        {{ comparison.expected.verticalBlanking }} lines
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.verticalBlanking, 'lines') }})
                        </span>
                      </p>
                      <p>
                        Back porch {{ comparison.expected.verticalBackPorch }} lines
                        <span class="text-muted-foreground/80">
                          (Δ {{ formatDifference(comparison.differences.verticalBackPorch, 'lines') }})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DisplayDescriptors
        :descriptors="displayDescriptors"
        :can-add="canAdd"
        @add-descriptor="(tag: number) => emit('addDescriptor', tag)"
        @remove-descriptor="(index: number) => emit('removeDescriptor', index)"
        @update-descriptor="(index: number, descriptor: DisplayDescriptor) => emit('updateDescriptor', index, descriptor)"
      />
    </CardContent>
  </Card>
</template>
