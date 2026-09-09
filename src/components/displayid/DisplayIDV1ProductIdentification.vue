<script setup lang="ts">
import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdV1ProductIdentificationBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, stringFromEvent } from '../common/editorUtils'

/**
 * DisplayID 1.x Product Identification (tag 0x00). Unlike the v2.0
 * block (tag 0x20) the vendor ID is a 3-character ASCII string, not an IEEE
 * OUI; the product name is a length-prefixed ASCII string after 12 fixed
 * bytes (edidts v1-codecs.ts encodeV1ProductIdentificationBlock).
 */
const props = defineProps<{
  section: DisplayIdSection
  index?: number
}>()

const emit = defineEmits<{
  updateBlock: [index: number, block: DisplayIdDataBlock]
}>()

function update(index: number, block: DisplayIdV1ProductIdentificationBlock, patch: Partial<DisplayIdV1ProductIdentificationBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

/** 0 (or non-finite) = unspecified; otherwise clamped to the encodable
 *  2000–2255 range (the codec stores `year - 2000` in one byte). */
function clampYear(value: number): number | undefined {
  if (!Number.isFinite(value) || value === 0) return undefined
  return Math.min(2255, Math.max(2000, Math.round(value)))
}

function updateName(index: number, block: DisplayIdV1ProductIdentificationBlock, value: string) {
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
      <CardTitle>Product Identification (DisplayID 1.x)</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdV1ProductIdentificationBlock>(props.section, DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification, props.index)"
        :key="index"
        class="grid grid-cols-2 gap-x-6 gap-y-4"
      >
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Vendor ID (3 ASCII chars)</label>
          <Input :model-value="block.vendorId" maxlength="3" @input="update(index, block, { vendorId: stringFromEvent($event).slice(0, 3) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Product Code</label>
          <Input type="number" min="0" max="65535" :model-value="block.productCode" @input="update(index, block, { productCode: Math.min(65535, Math.max(0, numberFromEvent($event))) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Serial Number</label>
          <Input type="number" min="0" max="4294967295" :model-value="block.serialNumber" @input="update(index, block, { serialNumber: Math.min(4294967295, Math.max(0, numberFromEvent($event))) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Product Name</label>
          <Input :model-value="block.productName" @input="updateName(index, block, stringFromEvent($event))" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Manufacture Week (1–54, 0 = unspecified)</label>
          <Input
            type="number"
            min="0"
            max="54"
            :model-value="block.manufactureWeek ?? 0"
            @input="update(index, block, { manufactureWeek: Math.min(54, Math.max(0, Math.round(numberFromEvent($event)))) || undefined })"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Year (0 = unspecified)</label>
          <Input
            type="number"
            min="0"
            max="2255"
            :model-value="block.year ?? 0"
            @input="update(index, block, { year: clampYear(numberFromEvent($event)) })"
          />
        </div>
        <label class="col-span-2 flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
          <span>Model Year (no manufacture week)</span>
          <Switch :model-value="block.isModelYear" @update:model-value="(value: boolean) => update(index, block, { isModelYear: value })" />
        </label>
      </div>
    </CardContent>
  </Card>
</template>