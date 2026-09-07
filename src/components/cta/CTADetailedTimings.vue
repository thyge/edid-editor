<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DetailedTimingCard from '../common/DetailedTimingCard.vue'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const timings = computed(() => props.cea.detailedTimings)

/** Positional native declaration (CTA-861-G byte 3 bits 3:0): the first N
 *  DTDs are native; a malformed count beyond the list degrades to all. */
const nativeCount = computed(() => Math.min(props.cea.nativeFormats, timings.value.length))
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CTA-861 Detailed Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-if="timings.length > 0" class="space-y-3">
        <DetailedTimingCard
          v-for="(timing, i) in timings"
          :key="i"
          :timing="timing"
          :index="i"
          :native="i < nativeCount"
          @update="(field: string, value: unknown) => emit('update', `detailedTimings.${i}.${field}`, value)"
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
      </div>
      <p v-else class="text-muted-foreground">No detailed timing descriptors in CTA-861 extension.</p>
    </CardContent>
  </Card>
</template>