<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, YCbCr420CapabilityMapDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * YCbCr 4:2:0 Capability Map Data Block view (tag 0x07 ext 0x0F) — the
 * display-only bitmap section of the former combined "HDR & Colorimetry"
 * view, split per block so each block has its own nav placement.
 */
const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const capabilityMap = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x0f,
  ) as YCbCr420CapabilityMapDataBlock | undefined,
)
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>YCbCr 4:2:0 Capability Map</CardTitle>
    </CardHeader>
    <CardContent class="text-sm">
      <p v-if="!capabilityMap" class="text-muted-foreground">No YCbCr 4:2:0 Capability Map block present.</p>
      <p v-else class="text-xs text-muted-foreground">
        {{ capabilityMap.capabilityBitmap.length }} byte(s) of capability bitmap
      </p>
    </CardContent>
  </Card>
</template>