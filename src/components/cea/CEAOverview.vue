<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, AudioDataBlock, VideoDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

// dtdOffset (byte 2) and the DTD count are not stored fields the encoder reads —
// the CEA encoder recomputes dtdOffset from the live data-block layout and
// appends detailedTimings after it (see ExtensionBlockParser.encodeCEA). So
// both are displayed as derived values rather than user-editable.
const derivedDtdOffset = computed(() => {
  const cea = props.cea
  let offset = 4
  for (const block of cea.dataBlocks) {
    // Mirror the encoder's per-block sizing (1 header + payload ≤ 31).
    offset += 1 + (((block as { payload?: Uint8Array }).payload?.length ?? 0) & 0x1f)
  }
  return (cea.detailedTimings.length > 0 || offset > 4) ? offset : 0
})

function onNativeFormats(v: string | number) {
  const n = typeof v === 'number' ? v : Number(v)
  const max = props.cea.detailedTimings.length
  const clamped = Number.isFinite(n) ? Math.max(0, Math.min(15, Math.min(max, Math.round(n)))) : 0
  emit('update', 'nativeFormats', clamped)
}

const blockSummary = computed(() => {
  const blocks = props.cea.dataBlocks
  const counts: { label: string; count: number }[] = []

  const video = blocks.filter(b => b.tag === 0x02)
  if (video.length) {
    const totalSvds = video.reduce((sum, b) => sum + ((b as VideoDataBlock).vics?.length ?? 0), 0)
    counts.push({ label: 'Video Data Block', count: totalSvds })
  }

  const audio = blocks.filter(b => b.tag === 0x01)
  if (audio.length) {
    const totalSads = audio.reduce((sum, b) => sum + ((b as AudioDataBlock).descriptors?.length ?? 0), 0)
    counts.push({ label: 'Audio Data Block', count: totalSads })
  }

  const speaker = blocks.filter(b => b.tag === 0x04)
  if (speaker.length) counts.push({ label: 'Speaker Allocation', count: speaker.length })

  const vendor = blocks.filter(b => b.tag === 0x03)
  if (vendor.length) counts.push({ label: 'Vendor Specific', count: vendor.length })

  const extended = blocks.filter(b => b.tag === 0x07)
  if (extended.length) counts.push({ label: 'Extended Data Blocks', count: extended.length })

  const vesa = blocks.filter(b => b.tag === 0x05)
  if (vesa.length) counts.push({ label: 'VESA Transfer Characteristic', count: vesa.length })

  return counts
})

const switchRowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CEA Extension Overview</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Header</h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
          <div :class="switchRowClass">
            <span class="text-muted-foreground">Revision</span>
            <span class="font-mono">{{ cea.revision }}</span>
          </div>
          <div :class="switchRowClass" title="Auto-derived from the data-block layout on encode">
            <span class="text-muted-foreground">DTD Offset <span class="text-[10px]">(derived)</span></span>
            <span class="font-mono text-muted-foreground">{{ derivedDtdOffset }}</span>
          </div>
          <div :class="switchRowClass" title="Number of CEA Detailed Timing Descriptors">
            <span class="text-muted-foreground">DTD Count <span class="text-[10px]">(derived)</span></span>
            <span class="font-mono text-muted-foreground">{{ cea.detailedTimings.length }}</span>
          </div>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground" title="Byte 3 bits 3:0 — number of native DTDs (first N DTDs are native)">
            Native DTDs (0–{{ Math.min(15, cea.detailedTimings.length) }})
            <Input type="number" :min="0" :max="Math.min(15, cea.detailedTimings.length)" :step="1" :model-value="cea.nativeFormats" @update:model-value="(v) => onNativeFormats(v)" />
          </label>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Capabilities</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <div :class="switchRowClass">
            <span>Underscan</span>
            <span :class="cea.underscan ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.underscan ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>Basic Audio</span>
            <span :class="cea.basicAudio ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.basicAudio ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>YCbCr 4:4:4</span>
            <span :class="cea.ycbcr444 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.ycbcr444 ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>YCbCr 4:2:2</span>
            <span :class="cea.ycbcr422 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.ycbcr422 ? 'Supported' : 'Not supported' }}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Data Blocks</h4>
        <div v-if="blockSummary.length > 0" class="space-y-1">
          <div
            v-for="entry in blockSummary"
            :key="entry.label"
            :class="switchRowClass"
          >
            <span>{{ entry.label }}</span>
            <span class="font-mono text-muted-foreground">{{ entry.count }}</span>
          </div>
        </div>
        <p v-else class="text-muted-foreground">No data blocks present.</p>
      </section>

      <section v-if="cea.detailedTimings.length > 0">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Detailed Timings</h4>
        <div :class="switchRowClass">
          <span>CEA Detailed Timing Descriptors</span>
          <span class="font-mono text-muted-foreground">{{ cea.detailedTimings.length }}</span>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
