<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdContainerIdBlock,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, bytesToHex, hexToBytes, stringFromEvent } from '../common/editorUtils'

const props = defineProps<{ displayId: DisplayIdExtension; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function updateContainerId(index: number, block: DisplayIdContainerIdBlock, value: string) {
  emit('updateBlock', index, { ...block, containerId: hexToBytes(value).slice(0, 16) } as DisplayIdContainerIdBlock)
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>ContainerID</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdContainerIdBlock>(props.displayId, DisplayIdDataBlockTag.ContainerId, props.index)" :key="index" class="space-y-1">
        <label class="text-xs text-muted-foreground">ContainerID Bytes</label>
        <Input :model-value="bytesToHex(block.containerId)" @input="updateContainerId(index, block, stringFromEvent($event))" />
      </div>
    </CardContent>
  </Card>
</template>
