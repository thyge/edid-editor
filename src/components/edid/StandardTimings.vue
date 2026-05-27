<script setup lang="ts">
import { computed } from 'vue'
import { StandardTiming } from 'edidts'
import type { EDIDViewModel } from '@/types/edid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StandardTimingListEditor, { type TimingInput } from '@/components/edid/descriptors/StandardTimingListEditor.vue'

const props = defineProps<{ edid: EDIDViewModel }>()
const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const standardTimings = computed(() => props.edid.standardTimings.filter((t) => t.width > 0))

const timingPayload = computed<TimingInput[]>(() =>
  standardTimings.value.map((timing) => ({
    width: timing.width,
    height: timing.height,
    refreshRate: timing.refreshRate,
  }))
)

function handleUpdate(timings: TimingInput[]) {
  const entries = timings.slice(0, 8).map((timing) => new StandardTiming(timing))
  emit('update', 'standardTimings', entries)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Standard Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <p class="text-xs text-muted-foreground">
        Configure up to eight standard timing identifiers. Width, refresh rate, and aspect ratio determine the encoded
        values automatically.
      </p>

      <StandardTimingListEditor
        :timings="timingPayload"
        :max-items="8"
        empty-message="No standard timings defined."
        slots-label="slots remaining"
        @update="handleUpdate"
      />
    </CardContent>
  </Card>
</template>
