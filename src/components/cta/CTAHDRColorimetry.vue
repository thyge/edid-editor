<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock } from 'edidts'
import type {
  HDRStaticMetadataDataBlock,
  HDRDynamicMetadataDataBlock,
  ColorimetryDataBlock,
  YCbCr420VideoDataBlock,
  YCbCr420CapabilityMapDataBlock,
} from 'edidts'
import { getVICDefinition, VIC_TABLE, COLORIMETRY_FLAGS, EOTF_FLAGS } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

/** Resolve a CTA data block to its `dataBlocks` index and emit a prop-rooted
 *  edit path (`dataBlocks.<idx>.<field>`) so App can route via one
 *  `setByPath(cea, path, value)`. No-ops if the block is not found. */
function emitBlock(block: object | undefined, field: string, value: unknown) {
  if (!block) return
  const idx = props.cea.dataBlocks.findIndex(b => b === block)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.${field}`, value)
}

function findExtended<T>(extTag: number): T | undefined {
  return props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === extTag
  ) as T | undefined
}

const hdrStatic = computed(() => findExtended<HDRStaticMetadataDataBlock>(0x06))
const hdrDynamic = computed(() => findExtended<HDRDynamicMetadataDataBlock>(0x07))
const colorimetry = computed(() => findExtended<ColorimetryDataBlock>(0x05))
const ycbcr420Video = computed(() => findExtended<YCbCr420VideoDataBlock>(0x0E))
const ycbcr420Map = computed(() => findExtended<YCbCr420CapabilityMapDataBlock>(0x0F))

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const sectionClass = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'

const colorimetryFlags = COLORIMETRY_FLAGS
const eotfFlags = EOTF_FLAGS

function vicLabel(vic: number): string {
  const def = getVICDefinition(vic)
  if (!def) return `VIC ${vic}`
  return `VIC ${vic}: ${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz`
}

function onNumber(block: object | undefined, field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emitBlock(block, field, Number.isFinite(parsed) ? parsed : 0)
}

// --- YCbCr 4:2:0 VIC list edits -------------------------------------------
function set420Vics(block: YCbCr420VideoDataBlock | undefined, vics: YCbCr420VideoDataBlock['vics']) {
  emitBlock(block, 'vics', vics)
}
function toggle420Native(block: YCbCr420VideoDataBlock | undefined, index: number, native: boolean) {
  if (!block) return
  const updated = block.vics.map((v, i) => (i === index ? { ...v, native } : v))
  set420Vics(block, updated)
}
function remove420Vic(block: YCbCr420VideoDataBlock | undefined, index: number) {
  if (!block) return
  set420Vics(block, block.vics.filter((_, i) => i !== index))
}
function add420Vic(block: YCbCr420VideoDataBlock | undefined, vic: number) {
  if (!block) return
  set420Vics(block, [...block.vics, { vic, native: false, known: getVICDefinition(vic) !== undefined }])
}
const available420Vics = computed(() => {
  if (!ycbcr420Video.value) return []
  return VIC_TABLE.filter(v => !ycbcr420Video.value!.vics.some(sv => sv.vic === v.vic)).slice(0, 50)
})

// --- HDR Dynamic Metadata entries edits ----------------------------------
function setDynEntries(block: HDRDynamicMetadataDataBlock | undefined, entries: HDRDynamicMetadataDataBlock['entries']) {
  emitBlock(block, 'entries', entries)
}
function updateDynEntry(block: HDRDynamicMetadataDataBlock | undefined, index: number, field: 'type' | 'supportFlags', value: number) {
  if (!block) return
  const updated = block.entries.map((e, i) => (i === index ? { ...e, [field]: value } : e))
  setDynEntries(block, updated)
}
function removeDynEntry(block: HDRDynamicMetadataDataBlock | undefined, index: number) {
  if (!block) return
  setDynEntries(block, block.entries.filter((_, i) => i !== index))
}
function addDynEntry(block: HDRDynamicMetadataDataBlock | undefined) {
  if (!block) return
  setDynEntries(block, [...block.entries, { type: 0, supportFlags: 0, optionalFields: new Uint8Array() }])
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDR & Colorimetry</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <!-- HDR Static Metadata -->
      <section v-if="hdrStatic">
        <h4 :class="sectionClass">HDR Static Metadata</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1 mb-3">
          <div v-for="flag in eotfFlags" :key="flag.key" :class="rowClass">
            <span>{{ flag.label }}</span>
            <Switch
              :checked="(hdrStatic as unknown as Record<string, unknown>).eotf ? (hdrStatic.eotf as unknown as Record<string, boolean>)[flag.key] : false"
              @update:checked="(v: boolean) => emitBlock(hdrStatic, `eotf.${flag.key}`, v)"
            />
          </div>
          <div :class="rowClass">
            <span>Static Metadata Type 1</span>
            <Switch :checked="hdrStatic.staticMetadataType1" @update:checked="(v: boolean) => emitBlock(hdrStatic, 'staticMetadataType1', v)" />
          </div>
        </div>

        <div v-if="hdrStatic.maxLuminance !== undefined || hdrStatic.minLuminance !== undefined" class="grid grid-cols-3 gap-x-6 gap-y-1">
          <label v-if="hdrStatic.maxLuminance !== undefined" class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Max Luminance (cd/m²)
            <Input type="number" :min="0" :step="1" :model-value="hdrStatic.maxLuminance" @update:model-value="(v) => onNumber(hdrStatic, 'maxLuminance', v)" />
          </label>
          <label v-if="hdrStatic.maxFrameAvgLuminance !== undefined" class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Max Frame-Avg (cd/m²)
            <Input type="number" :min="0" :step="1" :model-value="hdrStatic.maxFrameAvgLuminance" @update:model-value="(v) => onNumber(hdrStatic, 'maxFrameAvgLuminance', v)" />
          </label>
          <label v-if="hdrStatic.minLuminance !== undefined" class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Min Luminance (cd/m²)
            <Input type="number" :min="0" :step="0.0001" :model-value="hdrStatic.minLuminance" @update:model-value="(v) => onNumber(hdrStatic, 'minLuminance', v)" />
          </label>
        </div>
      </section>
      <p v-else class="text-muted-foreground">No HDR Static Metadata block present.</p>

      <!-- HDR Dynamic Metadata -->
      <section v-if="hdrDynamic">
        <h4 :class="sectionClass">HDR Dynamic Metadata</h4>
        <div v-if="hdrDynamic.entries.length > 0" class="space-y-2 mb-3">
          <div
            v-for="(e, i) in hdrDynamic.entries"
            :key="i"
            class="rounded-md border border-border/40 px-3 py-2 space-y-2"
          >
            <div class="flex items-center gap-3">
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
                Type (16-bit)
                <Input type="number" :min="0" :max="65535" :step="1" :model-value="e.type" @update:model-value="(v) => updateDynEntry(hdrDynamic, i, 'type', Math.round(Number(v)) & 0xffff)" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
                Support Flags (0–255)
                <Input type="number" :min="0" :max="255" :step="1" :model-value="e.supportFlags" @update:model-value="(v) => updateDynEntry(hdrDynamic, i, 'supportFlags', Math.round(Number(v)) & 0xff)" />
              </label>
              <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 self-end" @click="removeDynEntry(hdrDynamic, i)">
                Remove
              </Button>
            </div>
            <p v-if="e.optionalFields.length > 0" class="text-[11px] text-muted-foreground/80">
              {{ e.optionalFields.length }} optional byte(s) preserved verbatim.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="addDynEntry(hdrDynamic)">Add Type</Button>
      </section>

      <!-- Colorimetry -->
      <section v-if="colorimetry">
        <h4 :class="sectionClass">Colorimetry</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div v-for="flag in colorimetryFlags" :key="flag.key" :class="rowClass">
            <span>{{ flag.label }}</span>
            <Switch
              :checked="(colorimetry as unknown as Record<string, boolean>)[flag.key]"
              @update:checked="(v: boolean) => emitBlock(colorimetry, flag.key, v)"
            />
          </div>
        </div>
      </section>

      <!-- YCbCr 4:2:0 Video -->
      <section v-if="ycbcr420Video">
        <h4 :class="sectionClass">YCbCr 4:2:0 Only Formats</h4>
        <div v-if="ycbcr420Video.vics.length > 0" class="space-y-1 mb-3">
          <div
            v-for="(v, i) in ycbcr420Video.vics"
            :key="i"
            class="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="font-mono text-xs text-muted-foreground w-10 shrink-0">VIC {{ v.vic }}</span>
              <span class="text-xs truncate">{{ vicLabel(v.vic) }}</span>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <label class="flex items-center gap-1.5 text-xs">
                <span class="text-muted-foreground">Native</span>
                <Switch :checked="v.native" @update:checked="(val: boolean) => toggle420Native(ycbcr420Video, i, val)" />
              </label>
              <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2" @click="remove420Vic(ycbcr420Video, i)">
                Remove
              </Button>
            </div>
          </div>
        </div>
        <div class="border-t pt-3">
          <select
            class="flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            @change="(e: Event) => { const val = parseInt((e.target as HTMLSelectElement).value, 10); if (!isNaN(val)) { add420Vic(ycbcr420Video, val); (e.target as HTMLSelectElement).value = '' } }"
          >
            <option value="">Select VIC...</option>
            <option v-for="vic in available420Vics" :key="vic.vic" :value="vic.vic">VIC {{ vic.vic }} — {{ vic.name }}</option>
          </select>
        </div>
      </section>

      <!-- YCbCr 4:2:0 Capability Map (display-only bitmap) -->
      <section v-if="ycbcr420Map">
        <h4 :class="sectionClass">YCbCr 4:2:0 Capability Map</h4>
        <p class="text-xs text-muted-foreground">
          {{ ycbcr420Map.capabilityBitmap.length }} byte(s) of capability bitmap
        </p>
      </section>
    </CardContent>
  </Card>
</template>