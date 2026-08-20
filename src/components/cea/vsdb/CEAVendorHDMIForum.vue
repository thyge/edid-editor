<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { HDMIForumVSDB } from 'edidts'

const props = defineProps<{ fields: HDMIForumVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const frlRateOptions = [
  { value: 0, label: 'None' },
  { value: 1, label: '3 Gbps (3 lanes)' },
  { value: 2, label: '6 Gbps (3 lanes)' },
  { value: 3, label: '6 Gbps (4 lanes)' },
  { value: 4, label: '8 Gbps (4 lanes)' },
  { value: 5, label: '10 Gbps (4 lanes)' },
  { value: 6, label: '12 Gbps (4 lanes)' },
]

function frlRateLabel(rate: number): string {
  return frlRateOptions[rate]?.label ?? `Rate ${rate}`
}

function onNumber(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', field, Number.isFinite(parsed) ? Math.round(parsed) : 0)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDMI Forum VSDB (2.0/2.1) <span class="text-xs text-muted-foreground font-normal">(OUI C4-5D-D8)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-1">
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Version
          <Input type="number" :min="0" :step="1" :model-value="props.fields.version" @update:model-value="(v) => onNumber('version', v)" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Max TMDS Rate (MHz)
          <Input type="number" :min="0" :step="1" :model-value="props.fields.maxTmdsCharacterRate" @update:model-value="(v) => onNumber('maxTmdsCharacterRate', v)" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Max FRL Rate ({{ frlRateLabel(props.fields.maxFrlRate) }})
          <select :class="selectClass" :value="props.fields.maxFrlRate" @change="(e: Event) => onNumber('maxFrlRate', Number((e.target as HTMLSelectElement).value))">
            <option v-for="opt in frlRateOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <div :class="rowClass">
          <span>SCDC</span>
          <Switch :checked="props.fields.scdc" @update:checked="(v: boolean) => emit('update', 'scdc', v)" />
        </div>
        <div :class="rowClass">
          <span>Read Request</span>
          <Switch :checked="props.fields.rr" @update:checked="(v: boolean) => emit('update', 'rr', v)" />
        </div>
        <div :class="rowClass">
          <span>340 Mcsc Scramble</span>
          <Switch :checked="props.fields.lte340McscScramble" @update:checked="(v: boolean) => emit('update', 'lte340McscScramble', v)" />
        </div>
        <div :class="rowClass">
          <span>Independent View</span>
          <Switch :checked="props.fields.independentView" @update:checked="(v: boolean) => emit('update', 'independentView', v)" />
        </div>
        <div :class="rowClass">
          <span>Dual View</span>
          <Switch :checked="props.fields.dualView" @update:checked="(v: boolean) => emit('update', 'dualView', v)" />
        </div>
        <div :class="rowClass">
          <span>OSD 3D</span>
          <Switch :checked="props.fields.osd3d" @update:checked="(v: boolean) => emit('update', 'osd3d', v)" />
        </div>
      </div>

      <div>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">HDMI 2.1 Features</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div :class="rowClass"><span>VRR</span><Switch :checked="props.fields.vrr" @update:checked="(v: boolean) => emit('update', 'vrr', v)" /></div>
          <div :class="rowClass"><span>ALLM</span><Switch :checked="props.fields.allm" @update:checked="(v: boolean) => emit('update', 'allm', v)" /></div>
          <div :class="rowClass"><span>DSC</span><Switch :checked="props.fields.dsc" @update:checked="(v: boolean) => emit('update', 'dsc', v)" /></div>
          <div :class="rowClass"><span>CinemaVRR</span><Switch :checked="props.fields.cnmVrr" @update:checked="(v: boolean) => emit('update', 'cnmVrr', v)" /></div>
          <div :class="rowClass"><span>FAPA</span><Switch :checked="props.fields.fapa" @update:checked="(v: boolean) => emit('update', 'fapa', v)" /></div>
          <div :class="rowClass"><span>FVA</span><Switch :checked="props.fields.fva" @update:checked="(v: boolean) => emit('update', 'fva', v)" /></div>
          <div :class="rowClass"><span>UHD 4K</span><Switch :checked="props.fields.uhd4k" @update:checked="(v: boolean) => emit('update', 'uhd4k', v)" /></div>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Deep Color 4:2:0</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div :class="rowClass"><span>30-bit</span><Switch :checked="props.fields.dc30bit420" @update:checked="(v: boolean) => emit('update', 'dc30bit420', v)" /></div>
          <div :class="rowClass"><span>36-bit</span><Switch :checked="props.fields.dc36bit420" @update:checked="(v: boolean) => emit('update', 'dc36bit420', v)" /></div>
          <div :class="rowClass"><span>48-bit</span><Switch :checked="props.fields.dc48bit420" @update:checked="(v: boolean) => emit('update', 'dc48bit420', v)" /></div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>