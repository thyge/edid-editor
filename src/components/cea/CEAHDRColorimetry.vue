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
import { getVICDefinition } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

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

const colorimetryFlags: { key: string; label: string }[] = [
  { key: 'xvYCC601', label: 'xvYCC601' },
  { key: 'xvYCC709', label: 'xvYCC709' },
  { key: 'sYCC601', label: 'sYCC601' },
  { key: 'opYCC601', label: 'opYCC601' },
  { key: 'opRGB', label: 'opRGB' },
  { key: 'bt2020cYCC', label: 'BT.2020 cYCC' },
  { key: 'bt2020YCC', label: 'BT.2020 YCC' },
  { key: 'bt2020RGB', label: 'BT.2020 RGB' },
  { key: 'dciP3', label: 'DCI-P3' },
]

function vicLabel(vic: number): string {
  const def = getVICDefinition(vic)
  if (!def) return `VIC ${vic}`
  return `VIC ${vic}: ${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDR & Colorimetry</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section v-if="hdrStatic">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">HDR Static Metadata</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1 mb-3">
          <div :class="rowClass">
            <span>Traditional Gamma SDR</span>
            <span :class="hdrStatic.eotf.traditionalGammaSDR ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdrStatic.eotf.traditionalGammaSDR ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>Traditional Gamma HDR</span>
            <span :class="hdrStatic.eotf.traditionalGammaHDR ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdrStatic.eotf.traditionalGammaHDR ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>SMPTE ST 2084 (HDR10)</span>
            <span :class="hdrStatic.eotf.smpte2084 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdrStatic.eotf.smpte2084 ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>Hybrid Log-Gamma (HLG)</span>
            <span :class="hdrStatic.eotf.hlg ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdrStatic.eotf.hlg ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>Static Metadata Type 1</span>
            <span :class="hdrStatic.staticMetadataType1 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdrStatic.staticMetadataType1 ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>

        <div v-if="hdrStatic.maxLuminance !== undefined || hdrStatic.minLuminance !== undefined" class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div v-if="hdrStatic.maxLuminance !== undefined" :class="rowClass">
            <span>Max Luminance</span>
            <span class="font-mono">{{ hdrStatic.maxLuminance.toFixed(1) }} cd/m²</span>
          </div>
          <div v-if="hdrStatic.maxFrameAvgLuminance !== undefined" :class="rowClass">
            <span>Max Frame-Avg</span>
            <span class="font-mono">{{ hdrStatic.maxFrameAvgLuminance.toFixed(1) }} cd/m²</span>
          </div>
          <div v-if="hdrStatic.minLuminance !== undefined" :class="rowClass">
            <span>Min Luminance</span>
            <span class="font-mono">{{ hdrStatic.minLuminance.toFixed(4) }} cd/m²</span>
          </div>
        </div>
      </section>
      <p v-else class="text-muted-foreground">No HDR Static Metadata block present.</p>

      <section v-if="hdrDynamic">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">HDR Dynamic Metadata</h4>
        <div :class="rowClass">
          <span>Supported Types</span>
          <span class="font-mono">{{ hdrDynamic.supportedTypes.join(', ') || 'None' }}</span>
        </div>
      </section>

      <section v-if="colorimetry">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Colorimetry</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div
            v-for="flag in colorimetryFlags"
            :key="flag.key"
            :class="rowClass"
          >
            <span>{{ flag.label }}</span>
            <span :class="(colorimetry as unknown as Record<string, unknown>)[flag.key] ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ (colorimetry as unknown as Record<string, unknown>)[flag.key] ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </section>

      <section v-if="ycbcr420Video">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">YCbCr 4:2:0 Only Formats</h4>
        <div class="space-y-1">
          <div
            v-for="(v, i) in ycbcr420Video.vics"
            :key="i"
            :class="rowClass"
          >
            <span class="text-xs">{{ vicLabel(v.vic) }}</span>
            <span v-if="v.native" class="text-xs text-emerald-500">Native</span>
          </div>
        </div>
      </section>

      <section v-if="ycbcr420Map">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">YCbCr 4:2:0 Capability Map</h4>
        <p class="text-xs text-muted-foreground">
          {{ ycbcr420Map.capabilityBitmap.length }} byte(s) of capability bitmap
        </p>
      </section>
    </CardContent>
  </Card>
</template>
