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
        />
      </div>
      <p v-else class="text-muted-foreground">No detailed timing descriptors in CTA-861 extension.</p>
    </CardContent>
  </Card>
</template>