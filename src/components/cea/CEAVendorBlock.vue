<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, DolbyVSDB, VendorSpecificVideoDataBlock } from 'edidts'
import { findVSDBs, findVSVDBs, VENDOR_VSVDB_DECODERS, OUI } from 'edidts'

import CEAVendorHDMI14 from './vsdb/CEAVendorHDMI14.vue'
import CEAVendorHDMIForum from './vsdb/CEAVendorHDMIForum.vue'
import CEAVendorMicrosoftHMD from './vsdb/CEAVendorMicrosoftHMD.vue'
import CEAVendorDolby from './vsdb/CEAVendorDolby.vue'
import CEAVendorAMD from './vsdb/CEAVendorAMD.vue'
import CEAVendorHDR10Plus from './vsdb/CEAVendorHDR10Plus.vue'
import CEAVendorUnknown from './vsdb/CEAVendorUnknown.vue'

interface DolbyRenderable {
  block: VendorSpecificVideoDataBlock
  fields: DolbyVSDB
}

const props = defineProps<{ cea: CEAExtensionBlock }>()

// Tag 0x03 VSDBs (HDMI 1.4, HDMI Forum, Microsoft HMD, AMD, HDR10+)
const vsdbs = computed(() => findVSDBs(props.cea))

// Tag 0x07 ext 0x01 VSVDBs. Only Dolby is currently registered in the VSVDB
// registry; the rest fall through to the unknown OUI card. We decode Dolby
// blocks up-front in a computed so the template can dispatch cleanly.
const dolbyRenderables = computed<DolbyRenderable[]>(() => {
  const decoder = VENDOR_VSVDB_DECODERS[OUI.DOLBY]
  if (!decoder) return []
  return findVSVDBs(props.cea)
    .filter((block) => block.ieeeOui === OUI.DOLBY)
    .map((block) => ({
      block,
      fields: decoder.decode(block.payload) as DolbyVSDB,
    }))
})
</script>

<template>
  <div class="space-y-6">
    <p v-if="!vsdbs.length && !dolbyRenderables.length" class="text-muted-foreground">No Vendor Specific Data Blocks present.</p>

    <template v-for="(block, i) in vsdbs" :key="`vsdb-${i}`">
      <CEAVendorHDMI14          v-if="block.vendor?.kind === 'hdmi14'"           :fields="block.vendor.fields" />
      <CEAVendorHDMIForum       v-else-if="block.vendor?.kind === 'hdmiForum'"   :fields="block.vendor.fields" />
      <CEAVendorMicrosoftHMD    v-else-if="block.vendor?.kind === 'microsoftHmd'" :fields="block.vendor.fields" />
      <CEAVendorAMD             v-else-if="block.vendor?.kind === 'amdFreeSync'" :fields="block.vendor.fields" />
      <CEAVendorHDR10Plus       v-else-if="block.vendor?.kind === 'hdr10Plus'"   :fields="block.vendor.fields" />
      <CEAVendorUnknown         v-else                                            :block="block" />
    </template>

    <template v-for="(item, i) in dolbyRenderables" :key="`vsvdb-${i}`">
      <CEAVendorDolby :fields="item.fields" />
    </template>
  </div>
</template>
