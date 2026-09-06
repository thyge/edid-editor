<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  SINGLE_TILE_BEHAVIOR_LABELS,
  SUBSET_TILE_BEHAVIOR_LABELS,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdTiledDisplayTopologyBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, stringFromEvent } from '../common/editorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

// Capabilities byte semantics (Table 4-38) sourced from the edidts lib
// (tiled-topology.ts): SINGLE_TILE_BEHAVIOR_LABELS / SUBSET_TILE_BEHAVIOR_LABELS.
const singleTileBehaviorLabels = SINGLE_TILE_BEHAVIOR_LABELS
const subsetTileBehaviorLabels = SUBSET_TILE_BEHAVIOR_LABELS

function update(index: number, block: DisplayIdTiledDisplayTopologyBlock, patch: Partial<DisplayIdTiledDisplayTopologyBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Tiled Display Topology</CardTitle></CardHeader>
    <CardContent class="space-y-5 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdTiledDisplayTopologyBlock>(props.displayId, DisplayIdDataBlockTag.TiledDisplayTopology)" :key="index" class="space-y-5">
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
            <Input type="number" min="1" max="64" :model-value="block.tileCountHorizontal" @input="update(index, block, { tileCountHorizontal: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical tile count (1-64)</label>
            <Input type="number" min="1" max="64" :model-value="block.tileCountVertical" @input="update(index, block, { tileCountVertical: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal tile location (1-64)</label>
            <Input type="number" min="1" max="64" :model-value="block.tileLocationHorizontal" @input="update(index, block, { tileLocationHorizontal: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical tile location (1-64)</label>
            <Input type="number" min="1" max="64" :model-value="block.tileLocationVertical" @input="update(index, block, { tileLocationVertical: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Tile width (pixels, 1-65536)</label>
            <Input type="number" min="1" max="65536" :model-value="block.tileWidthPixels" @input="update(index, block, { tileWidthPixels: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Tile height (lines, 1-65536)</label>
            <Input type="number" min="1" max="65536" :model-value="block.tileHeightPixels" @input="update(index, block, { tileHeightPixels: numberFromEvent($event) })" />
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Bezel & pixel multiplier</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Pixel multiplier (0-255)</label>
              <Input type="number" min="0" max="255" :model-value="block.pixelMultiplier" @input="update(index, block, { pixelMultiplier: numberFromEvent($event) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Top bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.topBezelSize" @input="update(index, block, { topBezelSize: numberFromEvent($event) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Bottom bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.bottomBezelSize" @input="update(index, block, { bottomBezelSize: numberFromEvent($event) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Right bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.rightBezelSize" @input="update(index, block, { rightBezelSize: numberFromEvent($event) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Left bezel size</label>
              <Input type="number" min="0" max="255" :model-value="block.leftBezelSize" @input="update(index, block, { leftBezelSize: numberFromEvent($event) })" />
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Topology ID</h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Vendor OUI (24-bit hex)</label>
              <Input :model-value="block.vendorOui.toString(16).padStart(6, '0')" @input="update(index, block, { vendorOui: parseInt(stringFromEvent($event), 16) || 0 })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Product ID (16-bit)</label>
              <Input type="number" min="0" max="65535" :model-value="block.productId" @input="update(index, block, { productId: numberFromEvent($event) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Serial number (32-bit)</label>
              <Input type="number" min="0" max="4294967295" :model-value="block.serialNumber" @input="update(index, block, { serialNumber: numberFromEvent($event) })" />
            </div>
          </div>
        </section>
      </div>
    </CardContent>
  </Card>
</template>