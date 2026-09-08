<script setup lang="ts">
import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  SINGLE_TILE_BEHAVIOR_LABELS,
  SUBSET_TILE_BEHAVIOR_LABELS,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdV1TiledDisplayTopologyBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, stringFromEvent } from '../common/editorUtils'

/**
 * DisplayID 1.x Tiled Display Topology (tag 0x12, fixed 22-byte payload,
 * TASK-125). Bit-packing is identical to the v2.0 block (tag 0x28); the one
 * field difference is the topology ID: v1.x carries a 3-character ASCII
 * vendor ID where v2.0 carries a big-endian IEEE OUI (edidts v1-codecs.ts
 * encodeV1TiledDisplayTopologyBlock).
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

const singleTileBehaviorLabels = SINGLE_TILE_BEHAVIOR_LABELS
const subsetTileBehaviorLabels = SUBSET_TILE_BEHAVIOR_LABELS

function update(index: number, block: DisplayIdV1TiledDisplayTopologyBlock, patch: Partial<DisplayIdV1TiledDisplayTopologyBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

/** Clamp to the field's encodable range so the model never receives a value
 *  the encoder would silently truncate or wrap. */
function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)))
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Tiled Display Topology (DisplayID 1.x)</CardTitle></CardHeader>
    <CardContent class="space-y-5 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdV1TiledDisplayTopologyBlock>(props.section, DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology, props.index)"
        :key="index"
        class="space-y-5"
      >
        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Capabilities</h4>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Single-tile behavior</label>
            <select :value="block.singleTileBehavior" @change="update(index, block, { singleTileBehavior: numberFromEvent($event) })" class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm">
              <option v-for="value in 4" :key="value - 1" :value="value - 1">{{ singleTileBehaviorLabels[value - 1] }}</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Subset-tile behavior</label>
            <select :value="block.subsetTileBehavior" @change="update(index, block, { subsetTileBehavior: numberFromEvent($event) })" class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm">
              <option v-for="value in 2" :key="value - 1" :value="value - 1">{{ subsetTileBehaviorLabels[value - 1] }}</option>
            </select>
          </div>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Bezel information present</span><Switch :model-value="block.bezelInfoPresent" @update:model-value="(value: boolean) => update(index, block, { bezelInfoPresent: value })" /></label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Single physical enclosure</span><Switch :model-value="block.singleEnclosure" @update:model-value="(value: boolean) => update(index, block, { singleEnclosure: value })" /></label>
        </section>

        <section class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal tile count (1-64)</label>
            <Input type="number" min="1" max="64" :model-value="block.tileCountHorizontal" @input="update(index, block, { tileCountHorizontal: clamp(numberFromEvent($event), 64) || 1 })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical tile count (1-64)</label>
            <Input type="number" min="1" max="64" :model-value="block.tileCountVertical" @input="update(index, block, { tileCountVertical: clamp(numberFromEvent($event), 64) || 1 })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal tile location (1-64)</label>
            <Input type="number" min="1" max="64" :model-value="block.tileLocationHorizontal" @input="update(index, block, { tileLocationHorizontal: clamp(numberFromEvent($event), 64) || 1 })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical tile location (1-64)</label>
            <Input type="number" min="1" max="64" :model-value="block.tileLocationVertical" @input="update(index, block, { tileLocationVertical: clamp(numberFromEvent($event), 64) || 1 })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Tile width (pixels, 1-65536)</label>
            <Input type="number" min="1" max="65536" :model-value="block.tileWidthPixels" @input="update(index, block, { tileWidthPixels: clamp(numberFromEvent($event), 65536) || 1 })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Tile height (lines, 1-65536)</label>
            <Input type="number" min="1" max="65536" :model-value="block.tileHeightPixels" @input="update(index, block, { tileHeightPixels: clamp(numberFromEvent($event), 65536) || 1 })" />
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Bezel & pixel multiplier</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Pixel multiplier (0-255)</label>
              <Input type="number" min="0" max="255" :model-value="block.pixelMultiplier" @input="update(index, block, { pixelMultiplier: clamp(numberFromEvent($event), 255) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Top bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.topBezelSize" @input="update(index, block, { topBezelSize: clamp(numberFromEvent($event), 255) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Bottom bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.bottomBezelSize" @input="update(index, block, { bottomBezelSize: clamp(numberFromEvent($event), 255) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Right bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.rightBezelSize" @input="update(index, block, { rightBezelSize: clamp(numberFromEvent($event), 255) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Left bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.leftBezelSize" @input="update(index, block, { leftBezelSize: clamp(numberFromEvent($event), 255) })" />
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Topology ID</h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Vendor ID (3 ASCII chars)</label>
              <Input :model-value="block.vendorId" maxlength="3" @input="update(index, block, { vendorId: stringFromEvent($event).slice(0, 3) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Product ID (16-bit)</label>
              <Input type="number" min="0" max="65535" :model-value="block.productId" @input="update(index, block, { productId: clamp(numberFromEvent($event), 65535) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Serial number (32-bit)</label>
              <Input type="number" min="0" max="4294967295" :model-value="block.serialNumber" @input="update(index, block, { serialNumber: clamp(numberFromEvent($event), 4294967295) })" />
            </div>
          </div>
        </section>
      </div>
    </CardContent>
  </Card>
</template>