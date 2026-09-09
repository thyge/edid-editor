<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdArvrHmdBlock,
  type DisplayIdDataBlock,
  type DisplayIdSection,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent } from '../common/editorUtils'

/**
 * DisplayID 2.1 AR/VR HMD (tag 0x2c, 79-byte payload). Fixed-point
 * fields (3.13, 16.16) and the IEEE-754 center-of-projection floats are stored
 * as their raw integer bit patterns by the edidts codec (exact round-trip, no
 * float conversion error); this editor edits the raw values and shows the
 * derived human value in the label (edidts ar-vr.ts, sourced from edid-decode
 * parse_displayid_arvr_hmd).
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function update(index: number, block: DisplayIdArvrHmdBlock, patch: Partial<DisplayIdArvrHmdBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

/** Clamp to an unsigned field's encodable range. */
function clampU(value: number, max: number): number {
  const parsed = Math.round(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : 0
}

/** Clamp to a signed int16 field's encodable range (IPD center offset). */
function clampS16(value: number): number {
  const parsed = Math.round(value)
  return Number.isFinite(parsed) ? Math.max(-32768, Math.min(32767, parsed)) : 0
}

/** Derived display of a 3.13 fixed-point value. */
function fp313(raw: number): string {
  return (raw / 8192).toFixed(4)
}

/** Derived display of a 16.16 fixed-point value. */
function fp1616(raw: number): string {
  return (raw / 65536).toFixed(6)
}

/** Derived display of an IEEE 754 single-precision bit pattern. */
function f32(raw: number): string {
  const buffer = new ArrayBuffer(4)
  new Uint32Array(buffer)[0] = raw >>> 0
  return new Float32Array(buffer)[0].toPrecision(8)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>AR/VR HMD</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdArvrHmdBlock>(props.section, DisplayIdDataBlockTag.ArvrHmd, props.index)"
        :key="index"
        class="space-y-5"
      >
        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Transport & streams</h4>
          <div class="grid grid-cols-4 gap-3">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Dual-layer single-stream transport (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="block.dualLayerSingleStreamTransport" @input="update(index, block, { dualLayerSingleStreamTransport: clampU(numberFromEvent($event), 3) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Extended frame mode (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="block.extendedFrameMode" @input="update(index, block, { extendedFrameMode: clampU(numberFromEvent($event), 3) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Number of displays (0–15)</label>
              <Input type="number" min="0" max="15" :model-value="block.numberOfDisplays" @input="update(index, block, { numberOfDisplays: clampU(numberFromEvent($event), 15) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Number of streams (0–15)</label>
              <Input type="number" min="0" max="15" :model-value="block.numberOfStreams" @input="update(index, block, { numberOfStreams: clampU(numberFromEvent($event), 15) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Number of layers (0–15)</label>
              <Input type="number" min="0" max="15" :model-value="block.numberOfLayers" @input="update(index, block, { numberOfLayers: clampU(numberFromEvent($event), 15) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Layer metadata support (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="block.layerMetadataSupport" @input="update(index, block, { layerMetadataSupport: clampU(numberFromEvent($event), 3) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Replication factor (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="block.replicationFactor" @input="update(index, block, { replicationFactor: clampU(numberFromEvent($event), 3) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Layer 0 streams (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="block.layer0Streams" @input="update(index, block, { layer0Streams: clampU(numberFromEvent($event), 3) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Layer 1 streams (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="block.layer1Streams" @input="update(index, block, { layer1Streams: clampU(numberFromEvent($event), 3) })" />
            </div>
          </div>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Interleaving mode stacked</span><Switch :model-value="block.interleavingModeStacked" @update:model-value="(value: boolean) => update(index, block, { interleavingModeStacked: value })" /></label>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Area of low distortion (pixels / lines)</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right area X</label><Input type="number" min="0" max="65535" :model-value="block.rightLowDistortionAreaX" @input="update(index, block, { rightLowDistortionAreaX: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right area Y</label><Input type="number" min="0" max="65535" :model-value="block.rightLowDistortionAreaY" @input="update(index, block, { rightLowDistortionAreaY: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left area X</label><Input type="number" min="0" max="65535" :model-value="block.leftLowDistortionAreaX" @input="update(index, block, { leftLowDistortionAreaX: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left area Y</label><Input type="number" min="0" max="65535" :model-value="block.leftLowDistortionAreaY" @input="update(index, block, { leftLowDistortionAreaY: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Area width</label><Input type="number" min="0" max="65535" :model-value="block.lowDistortionAreaWidth" @input="update(index, block, { lowDistortionAreaWidth: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Area height</label><Input type="number" min="0" max="65535" :model-value="block.lowDistortionAreaHeight" @input="update(index, block, { lowDistortionAreaHeight: clampU(numberFromEvent($event), 65535) })" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right eye rotation orientation (0–7)</label><Input type="number" min="0" max="7" :model-value="block.rightEyeRotationOrientation" @input="update(index, block, { rightEyeRotationOrientation: clampU(numberFromEvent($event), 7) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left eye rotation orientation (0–7)</label><Input type="number" min="0" max="7" :model-value="block.leftEyeRotationOrientation" @input="update(index, block, { leftEyeRotationOrientation: clampU(numberFromEvent($event), 7) })" /></div>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Optics (3.13 fixed point, raw)</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right lens diameter ({{ fp313(block.rightLensDiameterRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.rightLensDiameterRaw" @input="update(index, block, { rightLensDiameterRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left lens diameter ({{ fp313(block.leftLensDiameterRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.leftLensDiameterRaw" @input="update(index, block, { leftLensDiameterRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Interocular angle ({{ fp313(block.interocularAngleRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.interocularAngleRaw" @input="update(index, block, { interocularAngleRaw: clampU(numberFromEvent($event), 65535) })" /></div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Lens adjust minimum ({{ fp313(block.lensAdjustMinimumRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.lensAdjustMinimumRaw" @input="update(index, block, { lensAdjustMinimumRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Lens adjustment range ({{ fp313(block.lensAdjustmentRangeRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.lensAdjustmentRangeRaw" @input="update(index, block, { lensAdjustmentRangeRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">IPD center offset (signed 3.13; {{ (clampS16(block.ipdCenterOffsetRaw) / 8192).toFixed(4) }})</label><Input type="number" min="-32768" max="32767" :model-value="block.ipdCenterOffsetRaw" @input="update(index, block, { ipdCenterOffsetRaw: clampS16(numberFromEvent($event)) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">IPD measurement minimum ({{ fp313(block.ipdMeasurementMinimumRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.ipdMeasurementMinimumRaw" @input="update(index, block, { ipdMeasurementMinimumRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">IPD measurement range ({{ fp313(block.ipdMeasurementRangeRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.ipdMeasurementRangeRaw" @input="update(index, block, { ipdMeasurementRangeRaw: clampU(numberFromEvent($event), 65535) })" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Lens adjustable</span><Switch :model-value="block.lensAdjustable" @update:model-value="(value: boolean) => update(index, block, { lensAdjustable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Lens distance available</span><Switch :model-value="block.lensDistanceAvailable" @update:model-value="(value: boolean) => update(index, block, { lensDistanceAvailable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>IPD useful to HMD</span><Switch :model-value="block.ipdUsefulToHmd" @update:model-value="(value: boolean) => update(index, block, { ipdUsefulToHmd: value })" /></label>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Lens adjust motion (0–3)</label><Input type="number" min="0" max="3" :model-value="block.lensAdjustMotion" @input="update(index, block, { lensAdjustMotion: clampU(numberFromEvent($event), 3) })" /></div>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Available measurements & foveated rendering</h4>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Distance to right display</span><Switch :model-value="block.distanceToRightDisplayAvailable" @update:model-value="(value: boolean) => update(index, block, { distanceToRightDisplayAvailable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Distance to left display</span><Switch :model-value="block.distanceToLeftDisplayAvailable" @update:model-value="(value: boolean) => update(index, block, { distanceToLeftDisplayAvailable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Distance to right eye</span><Switch :model-value="block.distanceToRightEyeAvailable" @update:model-value="(value: boolean) => update(index, block, { distanceToRightEyeAvailable: value })" /></label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Distance to left eye</span><Switch :model-value="block.distanceToLeftEyeAvailable" @update:model-value="(value: boolean) => update(index, block, { distanceToLeftEyeAvailable: value })" /></label>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Foveated rendering support (0–3)</label>
            <Input type="number" min="0" max="3" :model-value="block.foveatedRenderingSupport" @input="update(index, block, { foveatedRenderingSupport: clampU(numberFromEvent($event), 3) })" />
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Field of view, layer 0 (3.13 fixed point, raw)</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Horizontal ({{ fp313(block.horizontalFovRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.horizontalFovRaw" @input="update(index, block, { horizontalFovRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right eye: right ({{ fp313(block.rightFovRightRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.rightFovRightRaw" @input="update(index, block, { rightFovRightRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right eye: left ({{ fp313(block.rightFovLeftRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.rightFovLeftRaw" @input="update(index, block, { rightFovLeftRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right eye: up ({{ fp313(block.rightFovUpRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.rightFovUpRaw" @input="update(index, block, { rightFovUpRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right eye: down ({{ fp313(block.rightFovDownRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.rightFovDownRaw" @input="update(index, block, { rightFovDownRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left eye: right ({{ fp313(block.leftFovRightRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.leftFovRightRaw" @input="update(index, block, { leftFovRightRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left eye: left ({{ fp313(block.leftFovLeftRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.leftFovLeftRaw" @input="update(index, block, { leftFovLeftRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left eye: up ({{ fp313(block.leftFovUpRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.leftFovUpRaw" @input="update(index, block, { leftFovUpRaw: clampU(numberFromEvent($event), 65535) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left eye: down ({{ fp313(block.leftFovDownRaw) }})</label><Input type="number" min="0" max="65535" :model-value="block.leftFovDownRaw" @input="update(index, block, { leftFovDownRaw: clampU(numberFromEvent($event), 65535) })" /></div>
          </div>
        </section>

        <section class="space-y-3">
          <h4 class="text-xs font-medium text-muted-foreground">Focal lengths (16.16 fixed point, raw) & center of projection (IEEE 754 bit patterns)</h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right focal length ({{ fp1616(block.rightFocalLengthRaw) }})</label><Input type="number" min="0" max="4294967295" :model-value="block.rightFocalLengthRaw" @input="update(index, block, { rightFocalLengthRaw: clampU(numberFromEvent($event), 4294967295) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left focal length ({{ fp1616(block.leftFocalLengthRaw) }})</label><Input type="number" min="0" max="4294967295" :model-value="block.leftFocalLengthRaw" @input="update(index, block, { leftFocalLengthRaw: clampU(numberFromEvent($event), 4294967295) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right CoP Y ({{ f32(block.rightCenterOfProjectionYRaw) }})</label><Input type="number" min="0" max="4294967295" :model-value="block.rightCenterOfProjectionYRaw" @input="update(index, block, { rightCenterOfProjectionYRaw: clampU(numberFromEvent($event), 4294967295) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Right CoP X ({{ f32(block.rightCenterOfProjectionXRaw) }})</label><Input type="number" min="0" max="4294967295" :model-value="block.rightCenterOfProjectionXRaw" @input="update(index, block, { rightCenterOfProjectionXRaw: clampU(numberFromEvent($event), 4294967295) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left CoP Y ({{ f32(block.leftCenterOfProjectionYRaw) }})</label><Input type="number" min="0" max="4294967295" :model-value="block.leftCenterOfProjectionYRaw" @input="update(index, block, { leftCenterOfProjectionYRaw: clampU(numberFromEvent($event), 4294967295) })" /></div>
            <div class="space-y-1"><label class="text-xs text-muted-foreground">Left CoP X ({{ f32(block.leftCenterOfProjectionXRaw) }})</label><Input type="number" min="0" max="4294967295" :model-value="block.leftCenterOfProjectionXRaw" @input="update(index, block, { leftCenterOfProjectionXRaw: clampU(numberFromEvent($event), 4294967295) })" /></div>
          </div>
        </section>
      </div>
    </CardContent>
  </Card>
</template>