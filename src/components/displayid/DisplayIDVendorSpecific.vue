<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdVendorSpecificBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, bytesToHex, hexToBytes, numberFromEvent, stringFromEvent } from '../common/editorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function update(index: number, block: DisplayIdVendorSpecificBlock, patch: Partial<DisplayIdVendorSpecificBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Vendor-specific</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdVendorSpecificBlock>(props.displayId, DisplayIdDataBlockTag.VendorSpecific)" :key="index" class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">IEEE OUI</label>
          <Input type="number" min="0" max="16777215" :model-value="block.ieeeOui ?? 0" @input="update(index, block, { ieeeOui: numberFromEvent($event) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Payload</label>
          <Input :model-value="bytesToHex(block.payload)" @input="update(index, block, { payload: hexToBytes(stringFromEvent($event)) })" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
