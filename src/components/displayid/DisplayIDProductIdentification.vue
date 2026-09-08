<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdProductIdentificationBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, stringFromEvent } from '../common/editorUtils'

const props = defineProps<{
  displayId: DisplayIdExtension
  index?: number
}>()

const emit = defineEmits<{
  updateBlock: [index: number, block: DisplayIdDataBlock]
}>()

function update(index: number, block: DisplayIdProductIdentificationBlock, patch: Partial<DisplayIdProductIdentificationBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

function updateName(index: number, block: DisplayIdProductIdentificationBlock, value: string) {
  const productNameBytes = new Uint8Array(Array.from(value, character => character.charCodeAt(0) & 0xff))
  update(index, block, {
    productName: value,
    productNameBytes,
    productNameLength: productNameBytes.length,
  })
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Product Identification</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdProductIdentificationBlock>(props.displayId, DisplayIdDataBlockTag.ProductIdentification, props.index)"
        :key="index"
        class="grid grid-cols-2 gap-x-6 gap-y-4"
      >
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">IEEE OUI</label>
          <Input type="number" min="0" max="16777215" :model-value="block.ieeeOui" @input="update(index, block, { ieeeOui: numberFromEvent($event) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Product ID</label>
          <Input type="number" min="0" max="65535" :model-value="block.productId" @input="update(index, block, { productId: numberFromEvent($event) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Serial Number</label>
          <Input type="number" min="0" :model-value="block.serialNumber ?? 0" @input="update(index, block, { serialNumber: numberFromEvent($event) || undefined })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Product Name</label>
          <Input :model-value="block.productName" @input="updateName(index, block, stringFromEvent($event))" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Manufacture Week</label>
          <Input type="number" min="0" max="255" :model-value="block.manufactureWeek ?? 0" @input="update(index, block, { manufactureWeek: numberFromEvent($event) || undefined })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Year</label>
          <Input type="number" min="2000" max="2255" :model-value="block.year ?? 0" @input="update(index, block, { year: numberFromEvent($event) || undefined })" />
        </div>
        <label class="col-span-2 flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
          <span>Model Year</span>
          <Switch :model-value="block.isModelYear" @update:model-value="(value: boolean) => update(index, block, { isModelYear: value })" />
        </label>
      </div>
    </CardContent>
  </Card>
</template>
