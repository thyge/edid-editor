<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  DEPTHS_444,
  DEPTHS_4XX,
  getDisplayIdColorSpaceLabel,
  getDisplayIdEotfLabel,
  type DisplayIdColorSpaceEotfCombination,
  type DisplayIdDataBlock,
  type DisplayIdDisplayInterfaceFeaturesBlock,
  type DisplayIdExtension,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { blocksByTag, numberFromEvent, updateArrayItem, removeArrayItem } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

// Color-depth bit tables and the Table 4-27 color space / EOTF label maps are
// sourced from the edidts lib (interface-features.ts) — see DEPTHS_444 /
// DEPTHS_4XX and DISPLAY_ID_COLOR_SPACE_LABELS / DISPLAY_ID_EOTF_LABELS.
const rgbDepths = DEPTHS_444
const ycbcr444Depths = DEPTHS_444
const ycbcr4xxDepths = DEPTHS_4XX

function update(index: number, block: DisplayIdDisplayInterfaceFeaturesBlock, patch: Partial<DisplayIdDisplayInterfaceFeaturesBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

function toggleDepth(depths: number[], depth: number, enabled: boolean): number[] {
  const next = enabled ? [...new Set([...depths, depth])] : depths.filter(value => value !== depth)
  return next.sort((a, b) => a - b)
}

function minPixelRateMHz(block: DisplayIdDisplayInterfaceFeaturesBlock): string {
  const value = block.ycbcr420MinPixelRateMultiplier
  return value === 0 ? 'all modes' : `${(74.25 * value).toFixed(2)} MHz`
}

function defaultCombination(): DisplayIdColorSpaceEotfCombination {
  return { colorSpace: 0, eotf: 0 }
}

function updateCombination(block: DisplayIdDisplayInterfaceFeaturesBlock, index: number, comboIndex: number, patch: Partial<DisplayIdColorSpaceEotfCombination>) {
  const combinations = updateArrayItem(block.additionalColorSpaceEotfCombinations, comboIndex, { ...block.additionalColorSpaceEotfCombinations[comboIndex], ...patch })
  // Route through `update` (spread-only object literal) so the named property
  // is checked against Partial<DisplayIdDisplayInterfaceFeaturesBlock>, not the
  // wider DisplayIdDataBlock emit signature — avoids an excess-property error.
  update(index, block, { additionalColorSpaceEotfCombinations: combinations })
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Display Interface Features</CardTitle></CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdDisplayInterfaceFeaturesBlock>(props.displayId, DisplayIdDataBlockTag.DisplayInterfaceFeatures)" :key="index" class="space-y-5">
        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Supported color depths (bits per primary color)</h4>
          <div class="space-y-1">
            <span class="text-xs">RGB 4:4:4</span>
            <div class="flex flex-wrap gap-3">
              <label v-for="depth in rgbDepths" :key="depth" class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
                <Checkbox :model-value="block.rgbColorDepths.includes(depth)" @update:model-value="(value: boolean | 'indeterminate') => update(index, block, { rgbColorDepths: toggleDepth(block.rgbColorDepths, depth, value === true) })" />
                <span>{{ depth }}</span>
              </label>
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs">YCbCr 4:4:4</span>
            <div class="flex flex-wrap gap-3">
              <label v-for="depth in ycbcr444Depths" :key="depth" class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
                <Checkbox :model-value="block.ycbcr444ColorDepths.includes(depth)" @update:model-value="(value: boolean | 'indeterminate') => update(index, block, { ycbcr444ColorDepths: toggleDepth(block.ycbcr444ColorDepths, depth, value === true) })" />
                <span>{{ depth }}</span>
              </label>
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs">YCbCr 4:2:2</span>
            <div class="flex flex-wrap gap-3">
              <label v-for="depth in ycbcr4xxDepths" :key="depth" class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
                <Checkbox :model-value="block.ycbcr422ColorDepths.includes(depth)" @update:model-value="(value: boolean | 'indeterminate') => update(index, block, { ycbcr422ColorDepths: toggleDepth(block.ycbcr422ColorDepths, depth, value === true) })" />
                <span>{{ depth }}</span>
              </label>
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs">YCbCr 4:2:0</span>
            <div class="flex flex-wrap gap-3">
              <label v-for="depth in ycbcr4xxDepths" :key="depth" class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
                <Checkbox :model-value="block.ycbcr420ColorDepths.includes(depth)" @update:model-value="(value: boolean | 'indeterminate') => update(index, block, { ycbcr420ColorDepths: toggleDepth(block.ycbcr420ColorDepths, depth, value === true) })" />
                <span>{{ depth }}</span>
              </label>
            </div>
          </div>
        </section>

        <section class="space-y-1">
          <label class="text-xs text-muted-foreground">YCbCr 4:2:0 minimum pixel rate (× 74.25 MHz; 0 = all modes)</label>
          <Input type="number" min="0" max="255" :model-value="block.ycbcr420MinPixelRateMultiplier" @input="update(index, block, { ycbcr420MinPixelRateMultiplier: numberFromEvent($event) })" />
          <p class="text-xs text-muted-foreground">{{ minPixelRateMHz(block) }}</p>
        </section>

        <section class="space-y-2">
          <h4 class="text-xs font-medium text-muted-foreground">Audio sample rates</h4>
          <div class="grid grid-cols-3 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>32 kHz</span><Switch :checked="block.audioSampleRates.sr32kHz" @update:checked="(value: boolean) => update(index, block, { audioSampleRates: { ...block.audioSampleRates, sr32kHz: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>44.1 kHz</span><Switch :checked="block.audioSampleRates.sr44_1kHz" @update:checked="(value: boolean) => update(index, block, { audioSampleRates: { ...block.audioSampleRates, sr44_1kHz: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>48 kHz</span><Switch :checked="block.audioSampleRates.sr48kHz" @update:checked="(value: boolean) => update(index, block, { audioSampleRates: { ...block.audioSampleRates, sr48kHz: value } })" /></label>
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-xs font-medium text-muted-foreground">Color space / EOTF standard combination 1</h4>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>sRGB</span><Switch :checked="block.colorSpaceEotfStandard1.srgb" @update:checked="(value: boolean) => update(index, block, { colorSpaceEotfStandard1: { ...block.colorSpaceEotfStandard1, srgb: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>BT.601</span><Switch :checked="block.colorSpaceEotfStandard1.bt601" @update:checked="(value: boolean) => update(index, block, { colorSpaceEotfStandard1: { ...block.colorSpaceEotfStandard1, bt601: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>BT.709 / BT.1886</span><Switch :checked="block.colorSpaceEotfStandard1.bt709Bt1886" @update:checked="(value: boolean) => update(index, block, { colorSpaceEotfStandard1: { ...block.colorSpaceEotfStandard1, bt709Bt1886: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Adobe RGB</span><Switch :checked="block.colorSpaceEotfStandard1.adobeRgb" @update:checked="(value: boolean) => update(index, block, { colorSpaceEotfStandard1: { ...block.colorSpaceEotfStandard1, adobeRgb: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>DCI-P3</span><Switch :checked="block.colorSpaceEotfStandard1.dciP3" @update:checked="(value: boolean) => update(index, block, { colorSpaceEotfStandard1: { ...block.colorSpaceEotfStandard1, dciP3: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>BT.2020</span><Switch :checked="block.colorSpaceEotfStandard1.bt2020" @update:checked="(value: boolean) => update(index, block, { colorSpaceEotfStandard1: { ...block.colorSpaceEotfStandard1, bt2020: value } })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 col-span-2"><span>BT.2020 / SMPTE ST 2084</span><Switch :checked="block.colorSpaceEotfStandard1.bt2020St2084" @update:checked="(value: boolean) => update(index, block, { colorSpaceEotfStandard1: { ...block.colorSpaceEotfStandard1, bt2020St2084: value } })" /></label>
          </div>
        </section>

        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-medium text-muted-foreground">Additional color space / EOTF combinations (max 7)</h4>
            <Button variant="outline" size="sm" :disabled="block.additionalColorSpaceEotfCombinations.length >= 7" @click="update(index, block, { additionalColorSpaceEotfCombinations: [...block.additionalColorSpaceEotfCombinations, defaultCombination()] })">Add</Button>
          </div>
          <div v-for="(combo, comboIndex) in block.additionalColorSpaceEotfCombinations" :key="comboIndex" class="flex items-end gap-2 rounded-md border border-border p-3">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Color space</label>
              <select :value="combo.colorSpace" @change="(event) => updateCombination(block, index, comboIndex, { colorSpace: numberFromEvent(event) })" class="h-9 rounded-md border border-border bg-background px-2 text-sm">
                <option v-for="code in 16" :key="code - 1" :value="code - 1">{{ getDisplayIdColorSpaceLabel(code - 1) }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">EOTF</label>
              <select :value="combo.eotf" @change="(event) => updateCombination(block, index, comboIndex, { eotf: numberFromEvent(event) })" class="h-9 rounded-md border border-border bg-background px-2 text-sm">
                <option v-for="code in 16" :key="code - 1" :value="code - 1">{{ getDisplayIdEotfLabel(code - 1) }}</option>
              </select>
            </div>
            <Button variant="ghost" size="sm" class="text-destructive" @click="update(index, block, { additionalColorSpaceEotfCombinations: removeArrayItem(block.additionalColorSpaceEotfCombinations, comboIndex) })">Remove</Button>
          </div>
        </section>
      </div>
    </CardContent>
  </Card>
</template>