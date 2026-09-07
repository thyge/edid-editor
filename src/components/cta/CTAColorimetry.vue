<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, ColorimetryDataBlock } from 'edidts'
import { COLORIMETRY_FLAGS } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

/**
 * Colorimetry Data Block editor (tag 0x07 ext 0x05) — the colorimetry section
 * of the former combined "HDR & Colorimetry" view, split per block so each
 * block has its own nav placement (TASK-114).
 */
const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const colorimetry = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x05,
  ) as ColorimetryDataBlock | undefined,
)

/** Resolve the block's `dataBlocks` index and emit a prop-rooted edit path. */
function emitBlock(field: string, value: unknown) {
  if (!colorimetry.value) return
  const idx = props.cea.dataBlocks.findIndex(b => b === colorimetry.value)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.${field}`, value)
}

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Colorimetry</CardTitle>
    </CardHeader>
    <CardContent class="text-sm">
      <p v-if="!colorimetry" class="text-muted-foreground">No Colorimetry Data Block present.</p>
      <div v-else class="grid grid-cols-3 gap-x-6 gap-y-1">
        <div v-for="flag in COLORIMETRY_FLAGS" :key="flag.key" :class="rowClass">
          <span>{{ flag.label }}</span>
          <Switch
            :model-value="(colorimetry as unknown as Record<string, boolean>)[flag.key]"
            @update:model-value="(v: boolean) => emitBlock(flag.key, v)"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>