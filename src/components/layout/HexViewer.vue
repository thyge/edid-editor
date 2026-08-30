<script setup lang="ts">
import { computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { HexRegion } from '@/composables/useHexBlockRegions'

const props = defineProps<{
  data?: Uint8Array | null
  /**
   * Block-boundary regions tiling the blob (offset + label + depth). When
   * present and covering the full byte range, the viewer renders a thin
   * labelled divider before each region. When absent or not covering the full
   * range, it falls back to the flat single-region render (byte-identical to
   * the previous behaviour) so byte-exact rendering can never regress.
   */
  regions?: HexRegion[] | null
}>()

const BYTES_PER_ROW = 8

const displayData = computed(() => props.data ?? new Uint8Array(128))

function formatHex(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase()
}

interface ByteRow {
  offset: number
  bytes: number[]
}
interface RegionRender {
  /** Empty-label regions render no divider header (flat fallback). */
  label: string
  depth: number
  start: number
  end: number
  rows: ByteRow[]
}

/**
 * Build the per-region row model from the flat bytes + region tiling. A
 * defensive check ensures the regions cover the full blob exactly; otherwise a
 * single empty-label region is synthesised so every byte is still rendered
 * exactly once (byte-exact fallback).
 */
const regionRows = computed<RegionRender[]>(() => {
  const data = displayData.value
  const regions = props.regions
  const coversAll =
    regions != null &&
    regions.length > 0 &&
    regions[0].start === 0 &&
    regions[regions.length - 1].start + regions[regions.length - 1].length === data.length
  const tile: HexRegion[] = coversAll
    ? regions!
    : [{ start: 0, length: data.length, label: '', depth: 0 }]

  return tile.map((region) => {
    const rows: ByteRow[] = []
    for (let off = region.start; off < region.start + region.length; off += BYTES_PER_ROW) {
      const end = Math.min(off + BYTES_PER_ROW, region.start + region.length)
      rows.push({ offset: off, bytes: Array.from(data.slice(off, end)) })
    }
    return {
      label: region.label,
      depth: region.depth,
      start: region.start,
      end: region.start + region.length - 1,
      rows,
    }
  })
})
</script>

<template>
  <aside class="w-64 border-l border-border bg-background flex flex-col">
    <ScrollArea class="flex-1">
      <div class="p-3 font-mono text-xs">
        <template v-for="(region, regionIndex) in regionRows" :key="regionIndex">
          <div
            v-if="region.label"
            :class="[
              'mt-1 first:mt-0 border-t border-border/50 pt-1 text-[11px] text-muted-foreground flex justify-between gap-2',
              region.depth === 1 && 'pl-2',
              region.depth === 2 && 'pl-4',
            ]"
          >
            <span class="truncate">{{ region.label }}</span>
            <span class="shrink-0 tabular-nums">0x{{ region.start.toString(16).toUpperCase() }}–0x{{ region.end.toString(16).toUpperCase() }}</span>
          </div>
          <div
            v-for="row in region.rows"
            :key="row.offset"
            class="flex gap-1 py-0.5"
          >
            <span class="text-muted-foreground w-8">{{ row.offset.toString(16).padStart(3, '0').toUpperCase() }}</span>
            <span
              v-for="(byte, byteIndex) in row.bytes"
              :key="byteIndex"
              class="w-6 text-center hover:bg-accent rounded cursor-default"
              :title="`Offset 0x${(row.offset + byteIndex).toString(16).toUpperCase()}`"
            >
              {{ formatHex(byte) }}
            </span>
          </div>
        </template>
      </div>
    </ScrollArea>
  </aside>
</template>