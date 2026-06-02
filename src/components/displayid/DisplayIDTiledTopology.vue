<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtensionBlock,
  type DisplayIdTiledDisplayTopologyBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, numberFromEvent } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtensionBlock }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function update(index: number, block: DisplayIdTiledDisplayTopologyBlock, patch: Partial<DisplayIdTiledDisplayTopologyBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Tiled Display Topology</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdTiledDisplayTopologyBlock>(props.displayId, DisplayIdDataBlockTag.TiledDisplayTopology)" :key="index" class="grid grid-cols-2 gap-4">
        <Input type="number" :model-value="block.tileCountHorizontal" @input="update(index, block, { tileCountHorizontal: numberFromEvent($event) })" />
        <Input type="number" :model-value="block.tileCountVertical" @input="update(index, block, { tileCountVertical: numberFromEvent($event) })" />
        <Input type="number" :model-value="block.tileLocationHorizontal" @input="update(index, block, { tileLocationHorizontal: numberFromEvent($event) })" />
        <Input type="number" :model-value="block.tileLocationVertical" @input="update(index, block, { tileLocationVertical: numberFromEvent($event) })" />
        <Input type="number" :model-value="block.tileWidthPixels" @input="update(index, block, { tileWidthPixels: numberFromEvent($event) })" />
        <Input type="number" :model-value="block.tileHeightPixels" @input="update(index, block, { tileHeightPixels: numberFromEvent($event) })" />
      </div>
    </CardContent>
  </Card>
</template>
