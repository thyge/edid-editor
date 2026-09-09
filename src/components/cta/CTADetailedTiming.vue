<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DetailedTimingCard from '../common/DetailedTimingCard.vue'

/**
 * Single CTA-861 detailed timing editor — the per-child view of the
 * "Detailed Timings" nav sub-group. Reuses the shared timing
 * card (expanded, no toggle) with the same positional native badge as the
 * combined view: CTA-861-G byte 3 bits 3:0 declare the first N DTDs native
 * and the CTAHeaderFlags picker owns that count.
 */
const props = defineProps<{
  cea: CEAExtensionBlock
  /** Index of the timing within cea.detailedTimings. */
  index: number
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const timing = computed(() => props.cea.detailedTimings[props.index])

const nativeCount = computed(() =>
  Math.min(props.cea.nativeFormats, props.cea.detailedTimings.length),
)
</script>

<template>
  <Card v-if="timing">
    <CardHeader>
      <CardTitle>Detailed Timing {{ index + 1 }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <DetailedTimingCard
        :timing="timing"
        :index="index"
        :force-expand="true"
        :show-toggle="false"
        :native="index < nativeCount"
        @update="(field: string, value: unknown) => emit('update', `detailedTimings.${index}.${field}`, value)"
      >
        <template #details>
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
        </template>
      </DetailedTimingCard>
    </CardContent>
  </Card>
  <Card v-else>
    <CardContent class="text-sm text-muted-foreground">
      No detailed timing at this position — it may have been removed or moved.
    </CardContent>
  </Card>
</template>