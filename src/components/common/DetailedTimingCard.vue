<script setup lang="ts">
import { ref, computed } from 'vue'
import { computeRefreshRate, type DetailedTiming } from 'edidts'
import DetailedTimingFields from './DetailedTimingFields.vue'

/**
 * Shared detailed-timing card chrome: header (Timing N, resolution×refresh,
 * pixel-clock subtitle), Interlaced/Progressive badge, expand toggle, and the
 * DetailedTimingFields editor. Consumed by the EDID base-block descriptor view
 * (EDIDDetailedDescriptors.vue) and the CTA-861 DTD view (CTADetailedTimings.vue),
 * which share the same DetailedTiming field set via the common DTD codec.
 *
 * Refresh is derived from the single lib source {@link computeRefreshRate} —
 * never recomputed locally. Consumer-specific chrome is supplied via slots:
 *   - #badges: extra header badges (e.g. the EDID CVT/CTA classification badge)
 *   - #details: the expanded body after the field editor (H/V summary grid,
 *     CTA-861 reference, CVT calculator — these differ per consumer)
 *
 * Emits `update` with a dotted field path and new value, forwarded from
 * DetailedTimingFields; the owning component mutates the matching timing
 * instance and the useEDID computed re-encodes.
 */
const props = withDefaults(defineProps<{
  timing: DetailedTiming
  index: number
  /** Force the expanded body on (e.g. a focused single-timing view). */
  forceExpand?: boolean
  /** Show the "Show/Hide details" toggle button. */
  showToggle?: boolean
}>(), { forceExpand: false, showToggle: true })

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const expanded = ref(false)
const isExpanded = computed(() => props.forceExpand || expanded.value)

const refresh = computed(() => computeRefreshRate(props.timing))
const scanTypeLabel = computed(() => (props.timing.flags.interlaced ? 'Interlaced' : 'Progressive'))

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="rounded-2xl border border-border/60 bg-card shadow-sm scroll-mt-6">
    <div class="flex flex-wrap items-start gap-4 border-b border-border/40 p-4">
      <div>
        <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Timing {{ index + 1 }}</p>
        <p class="text-lg font-semibold text-foreground">
          {{ timing.horizontalActive }}×{{ timing.verticalActive }}{{ timing.flags.interlaced ? 'i' : 'p' }} ·
          {{ refresh.toFixed(2) }} Hz
        </p>
        <p class="text-xs text-muted-foreground">{{ timing.pixelClock.toFixed(2) }} MHz pixel clock</p>
      </div>
      <div class="ml-auto flex items-center gap-3">
        <span class="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground">
          {{ scanTypeLabel }}
        </span>
        <slot name="badges" />
        <button
          v-if="showToggle"
          type="button"
          class="text-xs font-semibold text-foreground/80 hover:text-primary"
          @click="toggle"
        >
          {{ isExpanded ? 'Hide details' : 'Show details' }}
        </button>
      </div>
    </div>
    <div
      v-if="isExpanded"
      class="border-t border-border/40 p-4 text-xs text-muted-foreground"
    >
      <div class="mb-4">
        <p class="text-[11px] uppercase tracking-wide mb-2 text-foreground/80">Edit Fields</p>
        <DetailedTimingFields
          :timing="timing"
          @update="(field: string, value: unknown) => emit('update', field, value)"
        />
      </div>
      <slot name="details" />
    </div>
  </div>
</template>