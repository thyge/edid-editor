<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { HDMI14VSDB } from 'edidts'
import { HDMI_3D_MODE_OPTIONS, HDMI_IMAGE_SIZE_OPTIONS } from 'edidts'

const props = defineProps<{ fields: HDMI14VSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const sectionClass = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'

const threeDModeOptions = HDMI_3D_MODE_OPTIONS
const imageSizeOptions = HDMI_IMAGE_SIZE_OPTIONS

function onNumber(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', field, Number.isFinite(parsed) ? Math.round(parsed) : 0)
}

function onPhysAddr(index: number, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  const nibble = Number.isFinite(parsed) ? Math.max(0, Math.min(15, Math.round(parsed))) : 0
  const next = [...props.fields.sourcePhysicalAddress] as [number, number, number, number]
  next[index] = nibble
  emit('update', 'sourcePhysicalAddress', next)
}

function onHdmiVics(text: string) {
  const vics = text
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .map((n) => Math.round(n) & 0xff)
  emit('update', 'extended.hdmiVics', vics)
}

function hdmiVicsText(): string {
  return (props.fields.extended?.hdmiVics ?? []).join(', ')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDMI 1.4 VSDB <span class="text-xs text-muted-foreground font-normal">(OUI 00-0C-03)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <!-- Physical Address (A.B.C.D, each 0–15) -->
      <div>
        <p :class="sectionClass">Source Physical Address</p>
        <div class="grid grid-cols-4 gap-2">
          <label v-for="(_, i) in props.fields.sourcePhysicalAddress" :key="i" class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {{ 'ABCD'[i] }}
            <Input type="number" :min="0" :max="15" :step="1" :model-value="props.fields.sourcePhysicalAddress[i]" @update:model-value="(v) => onPhysAddr(i, v)" />
          </label>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-x-6 gap-y-1">
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Max TMDS Clock (MHz)
          <Input type="number" :min="0" :step="5" :model-value="props.fields.maxTmdsClockMHz" @update:model-value="(v) => onNumber('maxTmdsClockMHz', v)" />
        </label>
        <label v-if="props.fields.contentTypes !== undefined" class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Content Types (bitmap)
          <Input type="number" :min="0" :max="15" :step="1" :model-value="props.fields.contentTypes" @update:model-value="(v) => onNumber('contentTypes', v)" />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-x-6 gap-y-1">
        <div :class="rowClass"><span>AI Support</span><Switch :model-value="props.fields.supportsAI" @update:model-value="(v: boolean) => emit('update', 'supportsAI', v)" /></div>
        <div :class="rowClass"><span>DC Y444</span><Switch :model-value="props.fields.dcY444" @update:model-value="(v: boolean) => emit('update', 'dcY444', v)" /></div>
        <div :class="rowClass"><span>Deep Color 30-bit</span><Switch :model-value="props.fields.dc30bit" @update:model-value="(v: boolean) => emit('update', 'dc30bit', v)" /></div>
        <div :class="rowClass"><span>Deep Color 36-bit</span><Switch :model-value="props.fields.dc36bit" @update:model-value="(v: boolean) => emit('update', 'dc36bit', v)" /></div>
        <div :class="rowClass"><span>Deep Color 48-bit</span><Switch :model-value="props.fields.dc48bit" @update:model-value="(v: boolean) => emit('update', 'dc48bit', v)" /></div>
      </div>

      <!-- Latency (present iff byte 4 bit 7 set; rendered only when decoded) -->
      <div v-if="props.fields.latency">
        <p :class="sectionClass">Video/Audio Latency (raw bytes; 0 = not present, 0xFF = unknown)</p>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Progressive Video Latency
            <Input type="number" :min="0" :max="255" :step="1" :model-value="props.fields.latency.progressive.video" @update:model-value="(v) => onNumber('latency.progressive.video', v)" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Progressive Audio Latency
            <Input type="number" :min="0" :max="255" :step="1" :model-value="props.fields.latency.progressive.audio" @update:model-value="(v) => onNumber('latency.progressive.audio', v)" />
          </label>
          <template v-if="props.fields.latency.interlaced">
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Interlaced Video Latency
              <Input type="number" :min="0" :max="255" :step="1" :model-value="props.fields.latency.interlaced.video" @update:model-value="(v) => onNumber('latency.interlaced.video', v)" />
            </label>
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Interlaced Audio Latency
              <Input type="number" :min="0" :max="255" :step="1" :model-value="props.fields.latency.interlaced.audio" @update:model-value="(v) => onNumber('latency.interlaced.audio', v)" />
            </label>
          </template>
        </div>
      </div>

      <!-- Extended HDMI video details (present iff byte 4 bit 5 set) -->
      <div v-if="props.fields.extended">
        <p :class="sectionClass">Extended HDMI Video Details</p>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <div :class="rowClass"><span>3D Present</span><Switch :model-value="props.fields.extended.threeDPresent" @update:model-value="(v: boolean) => emit('update', 'extended.threeDPresent', v)" /></div>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            3D Mode
            <select :class="selectClass" :value="props.fields.extended.threeDMode" @change="(e: Event) => emit('update', 'extended.threeDMode', (e.target as HTMLSelectElement).value)">
              <option v-for="opt in threeDModeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Base Image Size
            <select :class="selectClass" :value="props.fields.extended.imageSize" @change="(e: Event) => emit('update', 'extended.imageSize', (e.target as HTMLSelectElement).value)">
              <option v-for="opt in imageSizeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 col-span-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            HDMI VIC List (comma-separated)
            <Input :model-value="hdmiVicsText()" @update:model-value="(v: string | number) => onHdmiVics(String(v))" />
          </label>
        </div>
        <p class="text-[11px] text-muted-foreground/80 mt-1">
          Per-VIC 3D structures and the 3D_Structure_ALL / VIC masks are advanced
          fields left display-only; edits here preserve the modeled bytes and
          trailing data.
        </p>
      </div>
    </CardContent>
  </Card>
</template>