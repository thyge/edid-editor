<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdStereoDisplayInterfaceBlock,
  type DisplayIdStereoTimingCodeDescriptor,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { blocksByTag, bytesToHex, hexToBytes, numberFromEvent, stringFromEvent } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

// DisplayID 2.0 §4.6 Table 4-29: Stereo Interface Method Codes.
const methodLabels: Record<number, string> = {
  0x00: 'Frame/Field Sequential',
  0x01: 'Side-by-side',
  0x02: 'Pixel-interleaved',
  0x03: 'Dual Interface (L/R Separate)',
  0x04: 'Multi-view',
  0x05: 'Stacked Frame',
  0xff: 'Proprietary',
}
// Expected parameter byte counts per method code (Table 4-29).
const methodParamCounts: Record<number, number> = {
  0x00: 1, 0x01: 1, 0x02: 8, 0x03: 1, 0x04: 2, 0x05: 1, 0xff: 0,
}

const timingSupportLabels = [
  'Apply to timings that explicitly report 3D',
  'Explicit 3D timings + Timing Codes listed',
  'Apply to all listed timings',
  'Only Timing Codes listed',
]

const timingCodeTypeLabels = ['DMT timing code', 'CTA VIC timing code', 'HDMI VIC timing code', 'Reserved timing code type']

function methodOptionLabel(code: number): string {
  return methodLabels[code] ?? `Reserved (0x${code.toString(16).padStart(2, '0')})`
}

function methodOptions(current: number): { value: number; label: string }[] {
  const known = Object.keys(methodLabels).map((k) => Number(k))
  const options = known.map((value) => ({ value, label: methodLabels[value] }))
  if (!known.includes(current)) {
    options.unshift({ value: current, label: methodOptionLabel(current) })
  }
  return options
}

function update(index: number, block: DisplayIdStereoDisplayInterfaceBlock, patch: Partial<DisplayIdStereoDisplayInterfaceBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

// timingSupport lives in the header byte 01h bits 7:6, exposed as block.flags
// bits 4:3 (flags = byte >> 3). Edit it by rewriting flags and the derived field.
function setTimingSupport(index: number, block: DisplayIdStereoDisplayInterfaceBlock, value: number) {
  const flags = (block.flags & 0x07) | ((value & 0x03) << 3)
  update(index, block, { flags, timingSupport: value })
}

function setMethodCode(index: number, block: DisplayIdStereoDisplayInterfaceBlock, value: number) {
  update(index, block, { methodCode: value })
}

function setMethodParameters(index: number, block: DisplayIdStereoDisplayInterfaceBlock, hex: string) {
  update(index, block, { methodParameters: hexToBytes(hex) })
}

function hasTimingCodes(block: DisplayIdStereoDisplayInterfaceBlock): boolean {
  return block.timingSupport === 1 || block.timingSupport === 3
}

function defaultDescriptor(): DisplayIdStereoTimingCodeDescriptor {
  return { type: 0, timingCodes: [] }
}

function codesToHex(codes: number[]): string {
  return bytesToHex(new Uint8Array(codes))
}

function updateDescriptor(block: DisplayIdStereoDisplayInterfaceBlock, index: number, descriptorIndex: number, patch: Partial<DisplayIdStereoTimingCodeDescriptor>) {
  const descriptors = block.stereoTimingCodeDescriptors.map((d, i) => (i === descriptorIndex ? { ...d, ...patch } : d))
  // Route through `update` (spread-only literal) so the named property is
  // checked against Partial<DisplayIdStereoDisplayInterfaceBlock>, not the
  // wider DisplayIdDataBlock emit signature.
  update(index, block, { stereoTimingCodeDescriptors: descriptors })
}

function removeDescriptor(block: DisplayIdStereoDisplayInterfaceBlock, index: number, descriptorIndex: number) {
  const descriptors = block.stereoTimingCodeDescriptors.filter((_, i) => i !== descriptorIndex)
  update(index, block, { stereoTimingCodeDescriptors: descriptors })
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Stereo Display Interface</CardTitle></CardHeader>
    <CardContent class="space-y-5 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdStereoDisplayInterfaceBlock>(props.displayId, DisplayIdDataBlockTag.StereoDisplayInterface)" :key="index" class="space-y-5">
        <section class="space-y-1">
          <label class="text-xs text-muted-foreground">3D Stereo Timing Support</label>
          <select :value="block.timingSupport" @change="(event) => setTimingSupport(index, block, numberFromEvent(event))" class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm">
            <option v-for="value in 4" :key="value - 1" :value="value - 1">{{ timingSupportLabels[value - 1] }}</option>
          </select>
        </section>

        <section class="space-y-1">
          <label class="text-xs text-muted-foreground">Stereo Interface Method Code</label>
          <select :value="block.methodCode" @change="(event) => setMethodCode(index, block, numberFromEvent(event))" class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm">
            <option v-for="opt in methodOptions(block.methodCode)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground">Expected {{ methodParamCounts[block.methodCode] ?? '?' }} parameter byte(s).</p>
        </section>

        <section class="space-y-1">
          <label class="text-xs text-muted-foreground">Method-specific Parameters (hex)</label>
          <Input :model-value="bytesToHex(block.methodParameters)" @input="setMethodParameters(index, block, stringFromEvent($event))" />
        </section>

        <section v-if="hasTimingCodes(block)" class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-medium text-muted-foreground">3D Timing Code Descriptors</h4>
            <Button variant="outline" size="sm" @click="update(index, block, { stereoTimingCodeDescriptors: [...block.stereoTimingCodeDescriptors, defaultDescriptor()] })">Add</Button>
          </div>
          <div v-for="(descriptor, descriptorIndex) in block.stereoTimingCodeDescriptors" :key="descriptorIndex" class="flex items-end gap-2 rounded-md border border-border p-3">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Type</label>
              <select :value="descriptor.type" @change="(event) => updateDescriptor(block, index, descriptorIndex, { type: numberFromEvent(event) })" class="h-9 rounded-md border border-border bg-background px-2 text-sm">
                <option v-for="value in 4" :key="value - 1" :value="value - 1">{{ timingCodeTypeLabels[value - 1] }}</option>
              </select>
            </div>
            <div class="flex-1 space-y-1">
              <label class="text-xs text-muted-foreground">Timing Codes (hex)</label>
              <Input :model-value="codesToHex(descriptor.timingCodes)" @input="updateDescriptor(block, index, descriptorIndex, { timingCodes: Array.from(hexToBytes(stringFromEvent($event))) })" />
            </div>
            <Button variant="ghost" size="sm" class="text-destructive" @click="removeDescriptor(block, index, descriptorIndex)">Remove</Button>
          </div>
        </section>

        <section v-if="block.trailing.length > 0" class="space-y-1">
          <label class="text-xs text-muted-foreground">Trailing bytes (read-only)</label>
          <Input :model-value="bytesToHex(block.trailing)" readonly />
        </section>
      </div>
    </CardContent>
  </Card>
</template>