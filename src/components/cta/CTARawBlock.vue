<script setup lang="ts">
import { computed } from 'vue'
import type { CEADataBlock, CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ctaBlockNavLabel } from '@/components/cta/ctaBlockOrder'

/**
 * Read-only fallback view for CTA data blocks the editor has no structured
 * editor for: VESA VTB (ext 0x03), HDMI Video (ext 0x04), CTA Misc Audio
 * (ext 0x10), HDMI Audio (ext 0x12), reserved tag codes, and unknown extended
 * tags. Per-block nav entries exist for every decoded block (TASK-114), so
 * these need a view even though their bytes are preserved verbatim rather
 * than structured — the hex dump shows exactly what will be re-encoded.
 */
const props = defineProps<{
  cea: CEAExtensionBlock
  /** Index of the block within cea.dataBlocks. */
  index: number
}>()

const block = computed(() => props.cea.dataBlocks[props.index] as CEADataBlock | undefined)

/** Opaque carriers keep their raw payload in `payload`; extended blocks with
 *  no structured codec also expose `data`. Show whichever holds bytes. */
const rawBytes = computed<Uint8Array>(() => {
  const b = block.value as { payload?: Uint8Array; data?: Uint8Array } | undefined
  return b?.payload ?? b?.data ?? new Uint8Array()
})

const hexDump = computed(() => {
  const bytes = rawBytes.value
  if (bytes.length === 0) return '(empty payload)'
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
})

const extendedTag = computed(() => {
  const b = block.value as { tag?: number; extendedTag?: number } | undefined
  return b?.tag === 0x07 ? b.extendedTag : undefined
})
</script>

<template>
  <Card v-if="block">
    <CardHeader>
      <CardTitle>{{ ctaBlockNavLabel(block) }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p class="text-xs text-muted-foreground">
        This block type has no structured editor; its bytes are preserved verbatim on round-trip.
        Tag 0x{{ block.tag.toString(16).padStart(2, '0').toUpperCase() }}<template v-if="extendedTag !== undefined"> · extended tag 0x{{ extendedTag.toString(16).padStart(2, '0').toUpperCase() }}</template>
        · {{ rawBytes.length }} byte payload.
      </p>
      <p class="font-mono text-xs break-all leading-relaxed">{{ hexDump }}</p>
    </CardContent>
  </Card>
  <Card v-else>
    <CardContent class="text-sm text-muted-foreground">
      No data block at this position — it may have been removed or moved.
    </CardContent>
  </Card>
</template>