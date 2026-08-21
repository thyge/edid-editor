<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, DolbyVSDB, VendorSpecificDataBlock, VendorSpecificVideoDataBlock, VSVDBVendorDecoded } from 'edidts'
import { findVSDBs, findVSVDBs } from 'edidts'

type DolbyVSVDB = VendorSpecificVideoDataBlock & { vendor: Extract<VSVDBVendorDecoded, { kind: 'dolbyVsdb' }> }
const isDolbyVSVDB = (b: VendorSpecificVideoDataBlock): b is DolbyVSVDB => b.vendor?.kind === 'dolbyVsdb'

import CEAVendorHDMI14 from './vsdb/CEAVendorHDMI14.vue'
import CEAVendorHDMIForum from './vsdb/CEAVendorHDMIForum.vue'
import CEAVendorMicrosoftHMD from './vsdb/CEAVendorMicrosoftHMD.vue'
import CEAVendorDolby from './vsdb/CEAVendorDolby.vue'
import CEAVendorAMD from './vsdb/CEAVendorAMD.vue'
import CEAVendorUnknown from './vsdb/CEAVendorUnknown.vue'

interface DolbyRenderable {
  block: VendorSpecificVideoDataBlock
  fields: DolbyVSDB
}

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [block: VendorSpecificDataBlock, field: string, value: unknown]
  'update-vsvdb': [block: VendorSpecificVideoDataBlock, field: string, value: unknown]
}>()

// Tag 0x03 VSDBs (HDMI 1.4, HDMI Forum, Microsoft HMD, AMD)
const vsdbs = computed(() => findVSDBs(props.cea))

// Tag 0x07 ext 0x01 VSVDBs. The carrier now carries the structured decoded
// shape as `block.vendor` (parallel to tag-0x03 VSDBs), so we read the live
// fields directly — this keeps the rendered values in sync after an edit,
// since updateVSVDB mutates `block.vendor.fields` rather than re-encoding the
// raw payload. Only Dolby is rendered today; other registered/unknown VSVDBs
// fall through to the unknown card.
const dolbyRenderables = computed<DolbyRenderable[]>(() =>
  findVSVDBs(props.cea)
    .filter(isDolbyVSVDB)
    .map((block) => ({ block, fields: block.vendor.fields as DolbyVSDB }))
)
</script>

<template>
  <div class="space-y-6">
    <p v-if="!vsdbs.length && !dolbyRenderables.length" class="text-muted-foreground">No Vendor Specific Data Blocks present.</p>

    <template v-for="(block, i) in vsdbs" :key="`vsdb-${i}`">
      <CEAVendorHDMI14          v-if="block.vendor?.kind === 'hdmi14'"           :fields="block.vendor.fields" @update="(f: string, v: unknown) => emit('update', block, f, v)" />
      <CEAVendorHDMIForum       v-else-if="block.vendor?.kind === 'hdmiForum'"   :fields="block.vendor.fields" @update="(f: string, v: unknown) => emit('update', block, f, v)" />
      <CEAVendorMicrosoftHMD    v-else-if="block.vendor?.kind === 'microsoftHmd'" :fields="block.vendor.fields" @update="(f: string, v: unknown) => emit('update', block, f, v)" />
      <CEAVendorAMD             v-else-if="block.vendor?.kind === 'amdFreeSync'" :fields="block.vendor.fields" />
      <CEAVendorUnknown         v-else                                            :block="block" />
    </template>

    <template v-for="(item, i) in dolbyRenderables" :key="`vsvdb-${i}`">
      <CEAVendorDolby :fields="item.fields" @update="(f: string, v: unknown) => emit('update-vsvdb', item.block, f, v)" />
    </template>
  </div>
</template>
