<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
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
import EDIDDisplayDescriptors from './EDIDDisplayDescriptors.vue'
import DetailedTimingCard from '../common/DetailedTimingCard.vue'

const props = defineProps<{
  edid: EDIDViewModel
  focus?: string
}>()

const emit = defineEmits<{
  updateDescriptor: [index: number, descriptor: DisplayDescriptor]
  update: [path: string, value: unknown]
}>()

const detailedTimings = computed(() => props.edid.base.detailedTimings)
const displayDescriptors = computed(() => props.edid.base.displayDescriptors)

// Navigation focus: 'edid-descriptors' (or empty) → combined view of all
// timings + descriptors; 'edid-dtd-<i>' → dedicated single-timing view;
// 'edid-desc-<i>' → dedicated single-descriptor view.
const focusMode = computed(() => {
  const f = props.focus ?? ''
  if (f.startsWith('edid-dtd-')) {
    const idx = Number(f.slice('edid-dtd-'.length))
    return { kind: 'dtd' as const, index: Number.isNaN(idx) ? -1 : idx }
  }
  if (f.startsWith('edid-desc-')) {
    const idx = Number(f.slice('edid-desc-'.length))
    return { kind: 'descriptor' as const, index: Number.isNaN(idx) ? -1 : idx }
  }
  return { kind: 'all' as const, index: -1 }
})

const isAllView = computed(() => focusMode.value.kind === 'all')
const forceExpandTiming = computed(() => focusMode.value.kind === 'dtd')

// Timings to render: all in the combined view, just the focused one in a
// dedicated timing view. `i` is always the real index into detailedTimings so
// the CVT/CTA analysis (indexed by position) stays correct.
const visibleTimingEntries = computed(() => {
  if (focusMode.value.kind === 'dtd') {
    const i = focusMode.value.index
    const t = detailedTimings.value[i]
    return t ? [{ timing: t, i }] : []
  }
  return detailedTimings.value.map((t, i) => ({ timing: t, i }))
})

const cvtAnalysis = computed<CVTAnalysisResult[]>(() =>
  detailedTimings.value.map((timing: DetailedTimingDescriptor) => analyzeDetailedTimingWithCVT(timing))
)

const ceaAnalysis = computed<CTAAnalysisResult[]>(() =>
  detailedTimings.value.map((timing: DetailedTimingDescriptor) => analyzeDetailedTimingAgainstCTA(timing))
)

// Scroll the focused item into view on navigation. In dedicated single-item
// views the item is the only content, so this mainly matters when re-entering
// the combined view; expansion is handled by forceExpandTiming.
watch(() => props.focus, async (focus) => {
  if (!focus) return
  await nextTick()
  if (focus.startsWith('edid-dtd-')) {
    const idx = Number(focus.slice('edid-dtd-'.length))
    if (!Number.isNaN(idx)) document.getElementById(`edid-card-dtd-${idx}`)?.scrollIntoView({ block: 'nearest' })
  } else if (focus.startsWith('edid-desc-')) {
    const idx = Number(focus.slice('edid-desc-'.length))
    if (!Number.isNaN(idx)) document.getElementById(`edid-card-desc-${idx}`)?.scrollIntoView({ block: 'nearest' })
  }
}, { immediate: true })

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
  <div class="space-y-4">
      <!-- Detailed timings: all in the combined view, just the focused one in
           a dedicated timing view. Hidden in the dedicated descriptor view. -->
      <div v-if="focusMode.kind !== 'descriptor' && visibleTimingEntries.length > 0" class="space-y-4">
        <h4 v-if="isAllView" class="font-medium text-muted-foreground">Detailed Timings</h4>
        <DetailedTimingCard
          v-for="entry in visibleTimingEntries"
          :id="`edid-card-dtd-${entry.i}`"
          :key="entry.i"
          :timing="entry.timing"
          :index="entry.i"
          :force-expand="forceExpandTiming"
          :show-toggle="isAllView"
          @update="(field: string, value: unknown) => emit('update', `detailedTimings.${entry.i}.${field}`, value)"
        >
          <template #details>
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-lg border border-border/40 p-3">
                <p class="text-[11px] uppercase tracking-wide mb-2">Horizontal</p>
                <div class="space-y-1">
                  <div class="flex justify-between"><span>Total</span><span class="font-mono text-foreground">{{ entry.timing.horizontalTotal }} px</span></div>
                  <div class="flex justify-between"><span>Active</span><span class="font-mono text-foreground">{{ entry.timing.horizontalActive }} px</span></div>
                  <div class="flex justify-between"><span>Blanking</span><span class="font-mono text-foreground">{{ entry.timing.horizontalBlanking }} px</span></div>
                  <div class="flex justify-between"><span>Front Porch</span><span class="font-mono text-foreground">{{ horizontalFrontPorch(entry.timing) }} px</span></div>
                  <div class="flex justify-between"><span>Sync Width</span><span class="font-mono text-foreground">{{ entry.timing.horizontalSyncWidth }} px</span></div>
                  <div class="flex justify-between"><span>Back Porch</span><span class="font-mono text-foreground">{{ horizontalBackPorch(entry.timing) }} px</span></div>
                </div>
              </div>
              <div class="rounded-lg border border-border/40 p-3">
                <p class="text-[11px] uppercase tracking-wide mb-2">Vertical</p>
                <div class="space-y-1">
                  <div class="flex justify-between"><span>Total</span><span class="font-mono text-foreground">{{ entry.timing.verticalTotal }} lines</span></div>
                  <div class="flex justify-between"><span>Active</span><span class="font-mono text-foreground">{{ entry.timing.verticalActive }} lines</span></div>
                  <div class="flex justify-between"><span>Blanking</span><span class="font-mono text-foreground">{{ entry.timing.verticalBlanking }} lines</span></div>
                  <div class="flex justify-between"><span>Front Porch</span><span class="font-mono text-foreground">{{ verticalFrontPorch(entry.timing) }} lines</span></div>
                  <div class="flex justify-between"><span>Sync Width</span><span class="font-mono text-foreground">{{ entry.timing.verticalSyncWidth }} lines</span></div>
                  <div class="flex justify-between"><span>Back Porch</span><span class="font-mono text-foreground">{{ verticalBackPorch(entry.timing) }} lines</span></div>
                </div>
              </div>
            </div>

            <div class="mt-4 rounded-lg border border-border/40 p-3">
              <p class="text-[11px] uppercase tracking-wide mb-2">CTA-861 Reference</p>
              <p class="text-xs text-muted-foreground mb-3">{{ getCEAClassificationDescription(entry.i) }}</p>
              <div class="space-y-2" v-if="getCEAComparisonRows(entry.i).length > 0">
                <div
                  v-for="comparison in getCEAComparisonRows(entry.i)"
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
                        {{ Math.round(comparison.vic.refreshRate) }} Hz
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
                  v-for="comparison in getCVTComparisonRows(entry.i)"
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
          </template>
        </DetailedTimingCard>
      </div>

      <EDIDDisplayDescriptors
        v-if="focusMode.kind !== 'dtd'"
        :descriptors="displayDescriptors"
        :focus="focus"
        @update-descriptor="(index: number, descriptor: DisplayDescriptor) => emit('updateDescriptor', index, descriptor)"
      />
  </div>
</template>
