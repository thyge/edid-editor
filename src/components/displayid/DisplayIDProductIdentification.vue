<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdProductIdentificationBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, stringFromEvent } from '../common/editorUtils'
import { useDisplayIdRoom } from './displayIdRoom'

const props = defineProps<{
  section: DisplayIdSection
  index?: number
}>()

const emit = defineEmits<{
  updateBlock: [index: number, block: DisplayIdDataBlock]
}>()

/** OUI as its three wire bytes, most significant first (e.g. 00-10-FA). */
function ouiTriple(oui: number): string {
  const v = oui >>> 0
  return [v >>> 16, (v >>> 8) & 0xff, v & 0xff]
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join('-')
}

function update(index: number, block: DisplayIdProductIdentificationBlock, patch: Partial<DisplayIdProductIdentificationBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

/** The product name may grow only by the bytes still free in the section's
 *  0x70 block (and the block payload stays within 255 bytes). */
const room = useDisplayIdRoom()
function nameMaxLength(block: { productNameBytes: Uint8Array }): number {
  const free = room.freeBytes.value
  const roomLimit = Number.isFinite(free) ? block.productNameBytes.length + Math.max(0, free) : Number.POSITIVE_INFINITY
  return Math.min(roomLimit, 0xff - 12)
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
        v-for="{ block, index } in blocksByTag<DisplayIdProductIdentificationBlock>(props.section, DisplayIdDataBlockTag.ProductIdentification, props.index)"
        :key="index"
        class="grid grid-cols-2 gap-x-6 gap-y-4"
      >
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">IEEE OUI</label>
          <Input type="number" min="0" max="16777215" :model-value="block.ieeeOui" @input="update(index, block, { ieeeOui: numberFromEvent($event) })" />
          <!-- Stored big-endian (edid-decode reads 00-10-FA as Apple). -->
          <p class="text-xs text-muted-foreground">{{ ouiTriple(block.ieeeOui) }}</p>
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
          <Input :model-value="block.productName" :maxlength="nameMaxLength(block)" @input="updateName(index, block, stringFromEvent($event))" />
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
