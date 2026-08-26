<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, DolbyVSDB, VendorSpecificDataBlock, VendorSpecificVideoDataBlock, VSVDBVendorDecoded } from 'edidts'
import { findVSDBs, findVSVDBs } from 'edidts'

type DolbyVSVDB = VendorSpecificVideoDataBlock & { vendor: Extract<VSVDBVendorDecoded, { kind: 'dolbyVsdb' }> }
const isDolbyVSVDB = (b: VendorSpecificVideoDataBlock): b is DolbyVSVDB => b.vendor?.kind === 'dolbyVsdb'

import CTAVendorHDMI14 from './vsdb/CTAVendorHDMI14.vue'
import CTAVendorHDMIForum from './vsdb/CTAVendorHDMIForum.vue'
import CTAVendorMicrosoftHMD from './vsdb/CTAVendorMicrosoftHMD.vue'
import CTAVendorDolby from './vsvdb/CTAVendorDolby.vue'
import CTAVendorAMD from './vsdb/CTAVendorAMD.vue'
import CTAVendorUnknown from './vsdb/CTAVendorUnknown.vue'

interface DolbyRenderable {
  block: VendorSpecificVideoDataBlock
  fields: DolbyVSDB
}

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

/** Resolve a vendor block to its `dataBlocks` index and emit a prop-rooted edit
 *  path (`dataBlocks.<idx>.vendor.fields.<field>`). The tag-0x03 VSDB and
 *  tag-0x07 VSVDB carriers both expose their structured shape as
 *  `block.vendor.fields`, so one path shape covers both. */
function emitBlock(block: VendorSpecificDataBlock | VendorSpecificVideoDataBlock, field: string, value: unknown) {
  const idx = props.cea.dataBlocks.findIndex(b => b === block)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.vendor.fields.${field}`, value)
}

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
      <CTAVendorHDMI14          v-if="block.vendor?.kind === 'hdmi14'"           :fields="block.vendor.fields" @update="(f: string, v: unknown) => emitBlock(block, f, v)" />
      <CTAVendorHDMIForum       v-else-if="block.vendor?.kind === 'hdmiForum'"   :fields="block.vendor.fields" @update="(f: string, v: unknown) => emitBlock(block, f, v)" />
      <CTAVendorMicrosoftHMD    v-else-if="block.vendor?.kind === 'microsoftHmd'" :fields="block.vendor.fields" @update="(f: string, v: unknown) => emitBlock(block, f, v)" />
      <CTAVendorAMD             v-else-if="block.vendor?.kind === 'amdFreeSync'" :fields="block.vendor.fields" />
      <CTAVendorUnknown         v-else                                            :block="block" />
    </template>

    <template v-for="(item, i) in dolbyRenderables" :key="`vsvdb-${i}`">
      <CTAVendorDolby :fields="item.fields" @update="(f: string, v: unknown) => emitBlock(item.block, f, v)" />
    </template>
  </div>
</template>
