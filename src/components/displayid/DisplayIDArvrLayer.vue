<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdArvrLayerBlock,
  type DisplayIdDataBlock,
  type DisplayIdSection,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent } from '../common/editorUtils'

/**
 * DisplayID 2.1 AR/VR Layer (tag 0x2d, 20-byte payload, TASK-126). Layout per
 * the edidts codec (ar-vr.ts, sourced from edid-decode parse_displayid_arvr_layer);
 * the 3.5 fixed-point scaling-non-listed bytes are edited raw with a derived
 * display (value = raw / 32).
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function update(index: number, block: DisplayIdArvrLayerBlock, patch: Partial<DisplayIdArvrLayerBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

/** Clamp to the field's encodable range so the model never receives a value
 *  the encoder would silently truncate or wrap. */
function clamp(value: number, max: number): number {
  const parsed = Math.round(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : 0
}

/** Derived display of a 3.5 fixed-point byte. */
function fp35(raw: number): string {
  return (raw / 32).toFixed(3)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>AR/VR Layer</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdArvrLayerBlock>(props.section, DisplayIdDataBlockTag.ArvrLayer, props.index)"
        :key="index"
        class="space-y-5"
      >
        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">HMD identification</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">HMD manufacturer OUI (24-bit)</label><Input type="number" min="0" max="16777215" :model-value="block.hmdManufacturerOui" @input="update(index, block, { hmdManufacturerOui: clamp(numberFromEvent($event), 16777215) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">HMD product ID code</label><Input type="number" min="0" max="65535" :model-value="block.hmdProductIdCode" @input="update(index, block, { hmdProductIdCode: clamp(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">HMD serial number</label><Input type="number" min="0" max="4294967295" :model-value="block.hmdSerialNumber" @input="update(index, block, { hmdSerialNumber: clamp(numberFromEvent($event), 4294967295) })" /></div>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Layer configuration</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Layer number (0–15)</label><Input type="number" min="0" max="15" :model-value="block.layerNumber" @input="update(index, block, { layerNumber: clamp(numberFromEvent($event), 15) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Lens distortion support (0–3)</label><Input type="number" min="0" max="3" :model-value="block.lensDistortionSupport" @input="update(index, block, { lensDistortionSupport: clamp(numberFromEvent($event), 3) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Lens distortion configurable (0–3)</label><Input type="number" min="0" max="3" :model-value="block.lensDistortionConfigurable" @input="update(index, block, { lensDistortionConfigurable: clamp(numberFromEvent($event), 3) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Async reprojection support (0–3)</label><Input type="number" min="0" max="3" :model-value="block.asyncReprojectionSupport" @input="update(index, block, { asyncReprojectionSupport: clamp(numberFromEvent($event), 3) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Async reprojection configurable (0–3)</label><Input type="number" min="0" max="3" :model-value="block.asyncReprojectionConfigurable" @input="update(index, block, { asyncReprojectionConfigurable: clamp(numberFromEvent($event), 3) })" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Layer configurable</span><Switch :model-value="block.layerConfigurable" @update:model-value="(value: boolean) => update(index, block, { layerConfigurable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Cropping supported</span><Switch :model-value="block.croppingSupported" @update:model-value="(value: boolean) => update(index, block, { croppingSupported: value })" /></label>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Gamma / degamma / mura / VBI</h4>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Gamma support</span><Switch :model-value="block.gammaSupport" @update:model-value="(value: boolean) => update(index, block, { gammaSupport: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Gamma configurable</span><Switch :model-value="block.gammaConfigurable" @update:model-value="(value: boolean) => update(index, block, { gammaConfigurable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Degamma support</span><Switch :model-value="block.degammaSupport" @update:model-value="(value: boolean) => update(index, block, { degammaSupport: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Degamma configurable</span><Switch :model-value="block.degammaConfigurable" @update:model-value="(value: boolean) => update(index, block, { degammaConfigurable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Mura compensation support</span><Switch :model-value="block.muraCompensationSupport" @update:model-value="(value: boolean) => update(index, block, { muraCompensationSupport: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Mura compensation configurable</span><Switch :model-value="block.muraCompensationConfigurable" @update:model-value="(value: boolean) => update(index, block, { muraCompensationConfigurable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>VBI support</span><Switch :model-value="block.vbiSupport" @update:model-value="(value: boolean) => update(index, block, { vbiSupport: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>VBI configurable</span><Switch :model-value="block.vbiConfigurable" @update:model-value="(value: boolean) => update(index, block, { vbiConfigurable: value })" /></label>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Scaling</h4>
          <div class="grid grid-cols-4 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>2×</span><Switch :model-value="block.scaling2x" @update:model-value="(value: boolean) => update(index, block, { scaling2x: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>3×</span><Switch :model-value="block.scaling3x" @update:model-value="(value: boolean) => update(index, block, { scaling3x: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>4×</span><Switch :model-value="block.scaling4x" @update:model-value="(value: boolean) => update(index, block, { scaling4x: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>5×</span><Switch :model-value="block.scaling5x" @update:model-value="(value: boolean) => update(index, block, { scaling5x: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>6×</span><Switch :model-value="block.scaling6x" @update:model-value="(value: boolean) => update(index, block, { scaling6x: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>8×</span><Switch :model-value="block.scaling8x" @update:model-value="(value: boolean) => update(index, block, { scaling8x: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Other</span><Switch :model-value="block.scalingOther" @update:model-value="(value: boolean) => update(index, block, { scalingOther: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Configurable</span><Switch :model-value="block.scalingConfigurable" @update:model-value="(value: boolean) => update(index, block, { scalingConfigurable: value })" /></label>
          </div>
          <div class="grid grid-cols-4 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Non-listed scaling 0 ({{ fp35(block.scalingNonListed0) }})</label><Input type="number" min="0" max="255" :model-value="block.scalingNonListed0" @input="update(index, block, { scalingNonListed0: clamp(numberFromEvent($event), 255) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Non-listed scaling 1 ({{ fp35(block.scalingNonListed1) }})</label><Input type="number" min="0" max="255" :model-value="block.scalingNonListed1" @input="update(index, block, { scalingNonListed1: clamp(numberFromEvent($event), 255) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Non-listed scaling 2 ({{ fp35(block.scalingNonListed2) }})</label><Input type="number" min="0" max="255" :model-value="block.scalingNonListed2" @input="update(index, block, { scalingNonListed2: clamp(numberFromEvent($event), 255) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Non-listed scaling 3 ({{ fp35(block.scalingNonListed3) }})</label><Input type="number" min="0" max="255" :model-value="block.scalingNonListed3" @input="update(index, block, { scalingNonListed3: clamp(numberFromEvent($event), 255) })" /></div>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Multiple stream stereo modes</h4>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Side-by-side</span><Switch :model-value="block.stereoModeSideBySide" @update:model-value="(value: boolean) => update(index, block, { stereoModeSideBySide: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Stacked</span><Switch :model-value="block.stereoModeStacked" @update:model-value="(value: boolean) => update(index, block, { stereoModeStacked: value })" /></label>
          </div>
        </section>
      </div>
    </CardContent>
  </Card>
</template>