<script setup lang="ts">
import type { DisplayIdDataBlock } from 'edidts'
import { displayIdBlockLabel } from './displayIdLabels'
import { Button } from '@/components/ui/button'

defineProps<{
  blocks: DisplayIdDataBlock[]
}>()

const emit = defineEmits<{
  remove: [index: number]
  move: [index: number, direction: -1 | 1]
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(block, index) in blocks"
      :key="`${block.tag}-${index}`"
      class="flex items-center justify-between rounded-md border border-border px-3 py-2"
    >
      <div class="min-w-0">
        <div class="text-sm font-medium">
          {{ displayIdBlockLabel(block.tag) }}
        </div>
        <div class="text-xs text-muted-foreground">
          Tag 0x{{ block.tag.toString(16).padStart(2, '0') }} · {{ block.payloadLength }} bytes
        </div>
      </div>
      <div class="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" :disabled="index === 0" @click="emit('move', index, -1)">↑</Button>
        <Button variant="ghost" size="sm" :disabled="index === blocks.length - 1" @click="emit('move', index, 1)">↓</Button>
        <Button variant="ghost" size="sm" class="text-destructive" @click="emit('remove', index)">Remove</Button>
      </div>
    </div>
  </div>
</template>
