<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { HDMIForumVSDB } from 'edidts'
import { HDMI_DSC_MAX_SLICES_OPTIONS, HDMI_FRL_RATE_OPTIONS, getHdmiFrlRateLabel } from 'edidts'

const props = defineProps<{ fields: HDMIForumVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const labelClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
const headingClass = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'
const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

type BooleanField = {
  [K in keyof HDMIForumVSDB]-?: HDMIForumVSDB[K] extends boolean ? K : never
}[keyof HDMIForumVSDB]

const linkFlags: Array<{ field: BooleanField; label: string }> = [
  { field: 'scdc', label: 'SCDC' },
  { field: 'rr', label: 'Read Request' },
  { field: 'cableStatus', label: 'Cable Status' },
  { field: 'ccbpci', label: 'Color Content BPC Indication' },
  { field: 'lte340McscScramble', label: 'Scrambling ≤ 340 Mcsc' },
  { field: 'independentView', label: '3D Independent View' },
  { field: 'dualView', label: '3D Dual View' },
  { field: 'osd3d', label: '3D OSD Disparity' },
]

const colorFlags: Array<{ field: BooleanField; label: string }> = [
  // Named like the HDMI 1.4 card (bits per pixel), with bits per component.
  { field: 'dc30bit420', label: '4:2:0 30-bit (10 bpc)' },
  { field: 'dc36bit420', label: '4:2:0 36-bit (12 bpc)' },
  { field: 'dc48bit420', label: '4:2:0 48-bit (16 bpc)' },
  { field: 'uhd4k', label: 'UHD VIC' },
]

const hdmi21Flags: Array<{ field: BooleanField; label: string }> = [
  { field: 'allm', label: 'ALLM' },
  { field: 'fva', label: 'Fast VActive (FVA)' },
  { field: 'qms', label: 'QMS' },
  { field: 'mDelta', label: 'M-delta' },
  { field: 'negativeMvrr', label: 'Negative M-VRR' },
  { field: 'fapaStartLocation', label: 'FAPA Start Location' },
  { field: 'fapaEndExtended', label: 'FAPA End Extended' },
  { field: 'cinemaVrr', label: 'CinemaVRR (deprecated)' },
]

const dscFlags: Array<{ field: BooleanField; label: string }> = [
  { field: 'dsc12', label: 'DSC 1.2a' },
  { field: 'dscNative420', label: 'DSC Native 4:2:0' },
  { field: 'dscAllBpp', label: 'All 1/16 bpp' },
  { field: 'dsc10bpc', label: '10 bpc' },
  { field: 'dsc12bpc', label: '12 bpc' },
  { field: 'dsc16bpc', label: '16 bpc' },
  { field: 'qmsTfrMin', label: 'QMS TFRmin' },
  { field: 'qmsTfrMax', label: 'QMS TFRmax' },
]

function onNumber(field: string, v: string | number, max: number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  const value = Number.isFinite(parsed) ? Math.round(parsed) : 0
  emit('update', field, Math.max(0, Math.min(max, value)))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDMI Forum VSDB (2.0/2.1) <span class="text-xs text-muted-foreground font-normal">(OUI C4-5D-D8)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-1">
        <label :class="labelClass">
          Version
          <Input type="number" :min="0" :max="255" :step="1" :model-value="props.fields.version" @update:model-value="(v) => onNumber('version', v, 255)" />
        </label>
        <label :class="labelClass">
          Max TMDS Rate (MHz)
          <Input type="number" :min="0" :max="1275" :step="5" :model-value="props.fields.maxTmdsCharacterRate" @update:model-value="(v) => onNumber('maxTmdsCharacterRate', v, 1275)" />
        </label>
        <label :class="labelClass">
          Max FRL Rate ({{ getHdmiFrlRateLabel(props.fields.maxFrlRate) }})
          <select :class="selectClass" :value="props.fields.maxFrlRate" @change="(e: Event) => onNumber('maxFrlRate', Number((e.target as HTMLSelectElement).value), 15)">
            <option v-for="opt in HDMI_FRL_RATE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <div v-for="flag in linkFlags" :key="flag.field" :class="rowClass">
          <span>{{ flag.label }}</span>
          <Switch :model-value="props.fields[flag.field]" @update:model-value="(v: boolean) => emit('update', flag.field, v)" />
        </div>
      </div>

      <div>
        <h4 :class="headingClass">Deep Color 4:2:0</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div v-for="flag in colorFlags" :key="flag.field" :class="rowClass">
            <span>{{ flag.label }}</span>
            <Switch :model-value="props.fields[flag.field]" @update:model-value="(v: boolean) => emit('update', flag.field, v)" />
          </div>
        </div>
      </div>

      <div>
        <h4 :class="headingClass">HDMI 2.1 Features</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div v-for="flag in hdmi21Flags" :key="flag.field" :class="rowClass">
            <span>{{ flag.label }}</span>
            <Switch :model-value="props.fields[flag.field]" @update:model-value="(v: boolean) => emit('update', flag.field, v)" />
          </div>
        </div>
      </div>

      <div>
        <h4 :class="headingClass">Variable Refresh Rate</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <label :class="labelClass">
            VRR Min (Hz, 0 = no VRR)
            <Input type="number" :min="0" :max="63" :step="1" :model-value="props.fields.vrrMin" @update:model-value="(v) => onNumber('vrrMin', v, 63)" />
          </label>
          <label :class="labelClass">
            VRR Max (Hz)
            <Input type="number" :min="0" :max="1023" :step="1" :model-value="props.fields.vrrMax" @update:model-value="(v) => onNumber('vrrMax', v, 1023)" />
          </label>
        </div>
      </div>

      <div>
        <h4 :class="headingClass">Display Stream Compression</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div v-for="flag in dscFlags" :key="flag.field" :class="rowClass">
            <span>{{ flag.label }}</span>
            <Switch :model-value="props.fields[flag.field]" @update:model-value="(v: boolean) => emit('update', flag.field, v)" />
          </div>
        </div>
        <div class="grid gap-y-2 mt-2">
          <label :class="labelClass">
            DSC Max FRL Rate
            <select :class="selectClass" :value="props.fields.dscMaxFrlRate" @change="(e: Event) => onNumber('dscMaxFrlRate', Number((e.target as HTMLSelectElement).value), 15)">
              <option v-for="opt in HDMI_FRL_RATE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label :class="labelClass">
            DSC Max Slices
            <select :class="selectClass" :value="props.fields.dscMaxSlices" @change="(e: Event) => onNumber('dscMaxSlices', Number((e.target as HTMLSelectElement).value), 15)">
              <option v-for="opt in HDMI_DSC_MAX_SLICES_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label :class="labelClass">
            Total Chunk KBytes (1 KB × (1 + n))
            <Input type="number" :min="0" :max="63" :step="1" :model-value="props.fields.dscTotalChunkKBytes" @update:model-value="(v) => onNumber('dscTotalChunkKBytes', v, 63)" />
          </label>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
