<script setup lang="ts">
import type { DisplayIdVesaDisplayPortData } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const props = defineProps<{ fields: DisplayIdVesaDisplayPortData }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const sectionClass = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'

// Data Structure Type (vendor[0] bits 2:0): 0 = eDP, 1 = DP, 2-7 reserved.
const structureTypeOptions = [
  { value: 0, label: '0 — eDP' },
  { value: 1, label: '1 — DP' },
  { value: 2, label: '2 — Reserved' },
  { value: 3, label: '3 — Reserved' },
  { value: 4, label: '4 — Reserved' },
  { value: 5, label: '5 — Reserved' },
  { value: 6, label: '6 — Reserved' },
  { value: 7, label: '7 — Reserved' },
]

// Multi-SST Operation (vendor[1] bits 6:5).
const multiSstOptions = [
  { value: 0, label: '0 — Not Supported' },
  { value: 1, label: '1 — Two Streams' },
  { value: 2, label: '2 — Four Streams' },
  { value: 3, label: '3 — Reserved' },
]

function onNumber(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', field, Number.isFinite(parsed) ? Math.round(parsed) : 0)
}

// DSC bits-per-pixel is fractional (integer 0-63 in bits 5:0 of vendor[2] +
// fraction 0-15 in bits 3:0 of vendor[3], value = integer + fraction/16).
function onDscBpp(v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', 'dscBitsPerPixel', Number.isFinite(parsed) ? parsed : 0)
}

// Toggling DSC present adds/removes the 2 vendor bytes (payload length 5 → 7),
// changing the wire length. The encoder writes the DSC bytes only when
// dscBitsPerPixel is a number, so switching it off sets the field to undefined.
function onDscPresent(present: boolean) {
  emit('update', 'dscBitsPerPixel', present ? (props.fields.dscBitsPerPixel ?? 0) : undefined)
}

function hexDump(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>VESA DisplayPort <span class="text-xs text-muted-foreground font-normal">(OUI 3A-02-92)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-3">
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Data Structure Type
          <select :class="selectClass" :value="props.fields.structureType" @change="(e: Event) => onNumber('structureType', parseInt((e.target as HTMLSelectElement).value, 10))">
            <option v-for="opt in structureTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Multi-SST Operation
          <select :class="selectClass" :value="props.fields.multiSstOperation" @change="(e: Event) => onNumber('multiSstOperation', parseInt((e.target as HTMLSelectElement).value, 10))">
            <option v-for="opt in multiSstOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>

        <label class="flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2">
          <div>
            <p class="text-xs font-semibold">Native Colorspace/EOTF</p>
            <p class="text-[11px] text-muted-foreground">On = native per Display Parameters DB; Off = sRGB</p>
          </div>
          <Switch :checked="props.fields.nativeColorspaceEotf" @update:checked="(v: boolean) => emit('update', 'nativeColorspaceEotf', v)" />
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Horizontal Overlap Pixels (0–15)
          <Input type="number" :min="0" :max="15" :step="1" :model-value="props.fields.horizontalOverlapPixels" @update:model-value="(v) => onNumber('horizontalOverlapPixels', v)" />
        </label>
      </div>

      <div class="border-t pt-3">
        <div class="flex items-center justify-between rounded-md border border-transparent px-3 py-2">
          <div>
            <p class="text-xs font-semibold">DSC Bits Per Pixel</p>
            <p class="text-[11px] text-muted-foreground">Present = payload length ≥ 7 (3 OUI + 4 vendor bytes)</p>
          </div>
          <Switch :checked="props.fields.dscBitsPerPixel !== undefined" @update:checked="(v: boolean) => onDscPresent(v)" />
        </div>
        <div v-if="props.fields.dscBitsPerPixel !== undefined" class="mt-2 px-3">
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground max-w-xs">
            DSC bpp (integer + fraction/16, 0–63.9375)
            <Input type="number" :min="0" :max="63.9375" :step="0.0625" :model-value="props.fields.dscBitsPerPixel" @update:model-value="(v) => onDscBpp(v)" />
          </label>
        </div>
      </div>

      <div v-if="props.fields.trailing && props.fields.trailing.length > 0" class="border-t pt-3">
        <p :class="sectionClass">Trailing vendor bytes (preserved verbatim)</p>
        <pre class="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto">{{ hexDump(props.fields.trailing) }}</pre>
      </div>
    </CardContent>
  </Card>
</template>