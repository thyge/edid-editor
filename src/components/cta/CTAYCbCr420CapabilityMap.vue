<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, VideoDataBlock, YCbCr420CapabilityMapDataBlock } from 'edidts'
import { getVICDefinition } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

/**
 * YCbCr 4:2:0 Capability Map Data Block editor (tag 0x07 ext 0x0F) — the
 * display-only bitmap section of the former combined "HDR & Colorimetry"
 * view, split per block so each block has its own nav placement.
 *
 * Per CTA-861-G §7.5.12, bit N of the bitmap (LSB-first within each byte)
 * corresponds to SVD N of the Video Data Block: bit set means that SVD's
 * VIC additionally supports YCbCr 4:2:0 sampling.
 */
const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const capabilityMap = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x0f,
  ) as YCbCr420CapabilityMapDataBlock | undefined,
)

const videoDataBlock = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x02) as VideoDataBlock | undefined,
)

/** SVD list the bitmap indexes into; undefined when no Video Data Block exists. */
const svds = computed(() => videoDataBlock.value?.vics)

/** Value of bitmap bit `i` (LSB-first within each byte) or 0 beyond the map. */
function bitAt(bitmap: Uint8Array, i: number): boolean {
  return ((bitmap[i >> 3] >> (i & 7)) & 1) !== 0
}

/** Number of bit rows to render: every SVD the spec allows, plus any extra bits present in the map. */
const bitCount = computed(() => {
  const bitmap = capabilityMap.value?.capabilityBitmap
  if (!bitmap) return 0
  const mapped = svds.value?.length ?? 0
  return Math.max(mapped, bitmap.length * 8)
})

interface BitRow {
  index: number
  capable: boolean
  editable: boolean
  label: string | null // null → unlabelled/reserved
}

const bitRows = computed<BitRow[]>(() => {
  const bitmap = capabilityMap.value?.capabilityBitmap
  if (!bitmap) return []
  const svdList = svds.value
  const rows: BitRow[] = []
  for (let i = 0; i < bitCount.value; i++) {
    const capable = bitAt(bitmap, i)
    const svd = svdList?.[i]
    if (svdList && svd) {
      const def = getVICDefinition(svd.vic)
      rows.push({
        index: i,
        capable,
        editable: true,
        label: `VIC ${svd.vic}${def ? `: ${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz` : ''}`,
      })
    } else {
      // Beyond the SVD count (or no Video Data Block at all): spec requires
      // these bits to be zero. Surface them read-only so a nonconformant
      // source is still visible, but never editable.
      rows.push({ index: i, capable, editable: false, label: null })
    }
  }
  return rows
})

/** Resolve the block's `dataBlocks` index and emit a prop-rooted edit path. */
function emitBitmap(next: Uint8Array) {
  if (!capabilityMap.value) return
  const idx = props.cea.dataBlocks.findIndex(b => b === capabilityMap.value)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.capabilityBitmap`, next)
}

function toggleBit(index: number, value: boolean) {
  const bitmap = capabilityMap.value?.capabilityBitmap
  if (!bitmap || index >= (svds.value?.length ?? 0)) return
  const byteIndex = index >> 3
  // Grow the map (adding a trailing byte) when a bit beyond the current
  // byte range is set; never touch neighboring CTA block framing — the
  // encoder rebuilds block length from the payload it is handed.
  const length = value ? Math.max(bitmap.length, byteIndex + 1) : bitmap.length
  const next = new Uint8Array(length)
  next.set(bitmap.subarray(0, length))
  if (value) {
    next[byteIndex] |= 1 << (index & 7)
  } else {
    next[byteIndex] &= ~(1 << (index & 7)) & 0xff
    // Trim trailing zero bytes (§7.5.12 truncates the map to the minimum
    // bytes necessary), keeping at least one byte so the block stays present.
    let end = next.length
    while (end > 1 && next[end - 1] === 0) end--
    return emitBitmap(end === next.length ? next : next.subarray(0, end))
  }
  emitBitmap(next)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>YCbCr 4:2:0 Capability Map</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!capabilityMap" class="text-muted-foreground">No YCbCr 4:2:0 Capability Map block present.</p>
      <template v-else>
        <p v-if="!svds" class="text-xs text-muted-foreground">
          No Video Data Block is present, so the bitmap bits cannot be resolved to VICs (CTA-861-G §7.5.12 defines
          them against the Video Data Block). The raw bits are shown read-only.
        </p>
        <div v-if="bitRows.length > 0" class="space-y-1">
          <div
            v-for="row in bitRows"
            :key="row.index"
            class="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2"
            :class="{ 'opacity-60': !row.editable }"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="font-mono text-xs text-muted-foreground w-14 shrink-0">bit {{ row.index }}</span>
              <span class="text-xs truncate" :class="{ 'italic text-muted-foreground': !row.label }">
                {{ row.label ?? 'Reserved' }}
              </span>
            </div>
            <Switch
              :model-value="row.capable"
              :disabled="!row.editable"
              @update:model-value="(val: boolean) => toggleBit(row.index, val)"
            />
          </div>
        </div>
        <p v-else class="text-xs text-muted-foreground">The capability bitmap is empty (zero-length).</p>
        <p v-if="svds && bitCount > svds.length" class="text-xs text-muted-foreground">
          Bits beyond the {{ svds.length }} SVD{{ svds.length === 1 ? '' : 's' }} of the Video Data Block are reserved
          (CTA-861-G §7.5.12 requires them to be 0) and cannot be edited.
        </p>
      </template>
    </CardContent>
  </Card>
</template>