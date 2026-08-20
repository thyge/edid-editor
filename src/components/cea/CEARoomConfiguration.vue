<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, RoomConfigurationDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [block: RoomConfigurationDataBlock | undefined, field: string, value: unknown]
}>()

const block = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x13
  ) as RoomConfigurationDataBlock | undefined
)

function onNumber(field: string, v: string | number) {
  if (!block.value) return
  const n = typeof v === 'number' ? v : Number(v)
  emit('update', block.value, field, Number.isFinite(n) ? Math.round(n) : 0)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Room Configuration <span class="text-xs text-muted-foreground font-normal">(ext 0x13)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!block" class="text-muted-foreground">No Room Configuration Data Block present.</p>
      <template v-else>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Speaker Count
            <Input type="number" :min="0" :max="255" :step="1" :model-value="block.speakerCount" @update:model-value="(v) => onNumber('speakerCount', v)" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Speaker Presence Descriptor (0–255)
            <Input type="number" :min="0" :max="255" :step="1" :model-value="block.speakerPresenceDescriptor" @update:model-value="(v) => onNumber('speakerPresenceDescriptor', v)" />
          </label>
        </div>
      </template>
    </CardContent>
  </Card>
</template>