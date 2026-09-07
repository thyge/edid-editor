<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { HDMI14VSDB, Hdmi3DStructure } from 'edidts'
import { HDMI_3D_MODE_OPTIONS, HDMI_IMAGE_SIZE_OPTIONS } from 'edidts'

const props = defineProps<{ fields: HDMI14VSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const sectionClass = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'
const chipClass =
  'inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs text-foreground'

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

// ---------------------------------------------------------------------------
// HDMI VIC list (CTA-861-G §7.5 / HDMI 1.4: four fixed 4K format codes; the
// CTA-VIC equivalents per edid-decode's edid_hdmi_mode_map = { 95, 94, 93, 98 }
// — parse-cta-block.cpp:269). Codes outside 1–4 are invalid per spec, and the
// encoder's 3-bit length field caps the list at 7 entries (hdmi14.ts), so the
// picker only offers valid codes and disables add beyond 7.
// ---------------------------------------------------------------------------

const HDMI_VIC_LABELS: Readonly<Record<number, string>> = {
  1: '4096×2160p @ 24 Hz',
  2: '4096×2160p @ 25 Hz',
  3: '4096×2160p @ 30 Hz',
  4: '3840×2160p @ 30 Hz',
}

/** Max entries storable in the encoder's 3-bit length field (& 0x07). */
const MAX_HDMI_VICS = 7

const hdmiVics = computed(() => props.fields.extended?.hdmiVics ?? [])

/** Codes 1–4 not yet in the list — the add-picker's option set. */
const addableVicOptions = computed(() =>
  Object.keys(HDMI_VIC_LABELS)
    .map(Number)
    .filter((code) => !hdmiVics.value.includes(code)),
)

function addHdmiVic(code: number) {
  if (hdmiVics.value.length >= MAX_HDMI_VICS) return
  emit('update', 'extended.hdmiVics', [...hdmiVics.value, code])
}

function removeHdmiVic(index: number) {
  const next = hdmiVics.value.filter((_, i) => i !== index)
  emit('update', 'extended.hdmiVics', next)
}

// ---------------------------------------------------------------------------
// 3D advanced fields (display-only). Names follow edid-decode's HDMI VSDB 3D
// parser (parse-cta-block.cpp, cta_hdmi_vsdb_3d region) — the local CTA-861-G
// PDF defers the HDMI VSDB 3D tables to the HDMI 1.4 spec.
// ---------------------------------------------------------------------------

/** 3D_Structure_ALL bit → structure name (edid-decode: bit 0 = frame packing,
 * … bit 6 = top-and-bottom, bit 8 = side-by-side half/horizontal subsampling,
 * bit 15 = side-by-side half/quincunx; all other bits reserved). */
const STRUCTURE_ALL_BITS: ReadonlyArray<{ bit: number; label: string }> = [
  { bit: 0, label: 'Frame Packing' },
  { bit: 1, label: 'Field Alternative' },
  { bit: 2, label: 'Line Alternative' },
  { bit: 3, label: 'Side-by-Side (Full)' },
  { bit: 4, label: 'L + Depth' },
  { bit: 5, label: 'L + Depth + Graphics + Graphics-Depth' },
  { bit: 6, label: 'Top-and-Bottom' },
  { bit: 8, label: 'Side-by-Side (Half, Horizontal Subsampling)' },
  { bit: 15, label: 'Side-by-Side (Half, Quincunx)' },
]

/** 3D_Structure_X values 0–7 (edid-decode's 3D_Structure_X switch). */
const STRUCTURE_NAMES: Readonly<Record<number, string>> = {
  0: 'Frame Packing',
  1: 'Field Alternative',
  2: 'Line Alternative',
  3: 'Side-by-Side (Full)',
  4: 'L + Depth',
  5: 'L + Depth + Graphics + Graphics-Depth',
  6: 'Top-and-Bottom',
}

/** 3D_Detail_X names for side-by-side (half), structure 8 (edid-decode). */
const SBS_HALF_DETAILS: Readonly<Record<number, string>> = {
  0x0: 'any subsampling',
  0x1: 'horizontal subsampling',
  0x6: 'all quincunx combinations',
  0x7: 'quincunx odd/left, odd/right',
  0x8: 'quincunx odd/left, even/right',
  0x9: 'quincunx even/left, odd/right',
  0xa: 'quincunx even/left, even/right',
}

/** VIC indices whose bit is set in the 3D-capable-VIC mask. In the codec's
 * 16-bit model value, bit i = i-th VIC of the Video Data Block ("worst bit
 * ordering ever" per edid-decode: the low byte covers indices 0–7). */
const vicMaskIndices = computed(() => {
  const mask = props.fields.extended?.vicMask
  if (mask === undefined) return []
  const indices: number[] = []
  for (let i = 0; i < 16; i++) if (mask & (1 << i)) indices.push(i)
  return indices
})

/** 3D_Structure_ALL chips — set bits with a known name (reserved bits shown raw). */
const structureAllChips = computed(() => {
  const mask = props.fields.extended?.structureAll
  if (mask === undefined) return []
  return STRUCTURE_ALL_BITS
    .filter((entry) => mask & (1 << entry.bit))
    .map((entry) => entry.label)
})

/** Human-readable name for a per-VIC 3D_Structure_X entry (+ detail when
 * present, i.e. structure ≥ 8). */
function structureLabel(s: Hdmi3DStructure): string {
  if (s.structure === 8) {
    const detail = s.detail !== undefined ? (SBS_HALF_DETAILS[s.detail] ?? `reserved detail 0x${s.detail.toString(16)}`) : ''
    return `Side-by-Side (Half${detail ? `, ${detail}` : ''})`
  }
  if (STRUCTURE_NAMES[s.structure] !== undefined) return STRUCTURE_NAMES[s.structure]
  return `Reserved (0x${s.structure.toString(16)})`
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
          <div class="col-span-2 flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">HDMI VIC List (4K formats)</span>
            <div class="flex flex-wrap items-center gap-2">
              <span v-for="(vic, i) in hdmiVics" :key="i" :class="chipClass" :title="HDMI_VIC_LABELS[vic] ?? 'Unknown HDMI VIC'">
                VIC {{ vic }} · {{ HDMI_VIC_LABELS[vic] ?? 'unknown format' }}
                <button
                  type="button"
                  class="ml-0.5 text-muted-foreground/70 hover:text-foreground"
                  aria-label="Remove HDMI VIC"
                  @click="removeHdmiVic(i)"
                >×</button>
              </span>
              <select
                v-if="hdmiVics.length < MAX_HDMI_VICS"
                :class="selectClass + ' !w-auto !h-7'"
                aria-label="Add HDMI VIC"
                @change="(e: Event) => { const v = Number((e.target as HTMLSelectElement).value); if (v) addHdmiVic(v); (e.target as HTMLSelectElement).value = '' }"
              >
                <option value="">+ Add…</option>
                <option v-for="code in addableVicOptions" :key="code" :value="code">VIC {{ code }} · {{ HDMI_VIC_LABELS[code] }}</option>
              </select>
              <span v-else class="text-xs text-muted-foreground/70">List full (7 max)</span>
            </div>
          </div>
        </div>

        <!-- 3D advanced fields, decoded from the bytes and shown read-only (the
             len3d length/stride interplay makes editing error-prone; editing is
             out of scope — the modeled bytes and trailing data are preserved
             as-is on any other edit). -->
        <div v-if="structureAllChips.length || vicMaskIndices.length || (props.fields.extended?.structures?.length ?? 0) > 0" class="space-y-2">
          <p :class="sectionClass">3D Advanced (read-only)</p>
          <div v-if="structureAllChips.length" class="flex flex-wrap gap-1.5">
            <span v-for="label in structureAllChips" :key="label" :class="chipClass">{{ label }}</span>
          </div>
          <div v-if="vicMaskIndices.length" class="flex flex-wrap items-center gap-1.5 text-xs">
            <span class="text-muted-foreground">3D-capable VIC indices:</span>
            <span v-for="idx in vicMaskIndices" :key="idx" :class="chipClass">Index {{ idx }}</span>
          </div>
          <div v-if="(props.fields.extended?.structures?.length ?? 0) > 0" class="space-y-1">
            <p class="text-xs text-muted-foreground">Per-VIC 3D structures (index = position in the Video Data Block):</p>
            <div
              v-for="(s, i) in props.fields.extended?.structures"
              :key="i"
              class="flex items-center justify-between gap-2 rounded-md border border-border/40 px-2 py-1 text-xs"
            >
              <span class="font-mono text-muted-foreground">VIC index {{ s.vicIndex }}</span>
              <span>{{ structureLabel(s) }}</span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>