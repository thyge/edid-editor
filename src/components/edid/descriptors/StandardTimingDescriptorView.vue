<script setup lang="ts">
import type { StandardTimingIdDescriptor } from 'edidts'
import StandardTimingListEditor, { type TimingInput } from './StandardTimingListEditor.vue'

const props = defineProps<{ descriptor: StandardTimingIdDescriptor }>()
const emit = defineEmits<{ update: [StandardTimingIdDescriptor] }>()

function handleUpdate(timings: TimingInput[]) {
  emit('update', { ...props.descriptor, timings })
}
</script>

<template>
  <div class="space-y-3 text-sm">
    <div class="space-y-1 text-xs text-muted-foreground">
      <p class="uppercase tracking-wide">Define up to six supplemental standard timing identifiers.</p>
      <p>These entries complement the base block standard timings and can be verified in the Timing Modes panel.</p>
    </div>

    <StandardTimingListEditor
      :timings="descriptor.timings ?? []"
      :max-items="6"
      empty-message="No standard timing identifiers defined."
      @update="handleUpdate"
    />
  </div>
</template>
