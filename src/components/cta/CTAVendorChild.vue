<script setup lang="ts">
import { computed } from 'vue'
import type {
  CEAExtensionBlock,
  DolbyVSDB,
  VendorSpecificAudioDataBlock,
  VendorSpecificDataBlock,
  VendorSpecificVideoDataBlock,
} from 'edidts'
import CTAVendorHDMI14 from './vsdb/CTAVendorHDMI14.vue'
import CTAVendorHDMIForum from './vsdb/CTAVendorHDMIForum.vue'
import CTAVendorMicrosoftHMD from './vsdb/CTAVendorMicrosoftHMD.vue'
import CTAVendorAMD from './vsdb/CTAVendorAMD.vue'
import CTAVendorUnknown from './vsdb/CTAVendorUnknown.vue'
import CTAVendorDolby from './vsvdb/CTAVendorDolby.vue'
import CTAVendorAudioBlock from './CTAVendorAudioBlock.vue'

/**
 * Single-block vendor editor: the view behind one "Vendor" nav child row
 * (TASK-102). Renders exactly one vendor-specific block from the CEA
 * dataBlocks array — a tag-0x03 VSDB (structured card or raw fallback), a
 * tag-0x07 ext 0x01 VSVDB (Dolby card or raw fallback for HDR10+/unknown),
 * or a tag-0x07 ext 0x11 Vendor-Specific Audio block — keyed by its
 * dataBlocks index so multiple blocks of the same carrier are independently
 * editable.
 */
const props = defineProps<{
  cea: CEAExtensionBlock
  /** Index of the vendor block within cea.dataBlocks. */
  index: number
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

type VendorBlock = VendorSpecificDataBlock | VendorSpecificVideoDataBlock | VendorSpecificAudioDataBlock

const block = computed(() => props.cea.dataBlocks[props.index] as VendorBlock | undefined)

/** True when the block is a vendor block of any of the three carriers. */
const isVendor = computed(() => {
  const b = block.value
  if (!b) return false
  if (b.tag === 0x03) return true
  if (b.tag === 0x07) {
    const ext = (b as { extendedTag?: number }).extendedTag
    return ext === 0x01 || ext === 0x11
  }
  return false
})

const vsdb = computed(() =>
  block.value?.tag === 0x03 ? (block.value as VendorSpecificDataBlock) : undefined)
const vsvdb = computed(() =>
  block.value?.tag === 0x07 && (block.value as { extendedTag?: number }).extendedTag === 0x01
    ? (block.value as VendorSpecificVideoDataBlock)
    : undefined)
const vendorAudio = computed(() =>
  block.value?.tag === 0x07 && (block.value as { extendedTag?: number }).extendedTag === 0x11
    ? (block.value as VendorSpecificAudioDataBlock)
    : undefined)

/** Resolve the block's live dataBlocks index and emit a prop-rooted edit path
 *  (`dataBlocks.<idx>.vendor.fields.<field>`), matching the combined view's
 *  emitBlock convention (CTAVendorBlock). */
function emitBlock(field: string, value: unknown) {
  const b = block.value
  if (!b) return
  const idx = props.cea.dataBlocks.findIndex(x => x === b)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.vendor.fields.${field}`, value)
}
</script>

<template>
  <div class="space-y-6">
    <p v-if="!isVendor" class="text-muted-foreground">
      No vendor-specific block at this position — it may have been removed or moved.
    </p>

    <!-- Tag 0x03 VSDB -->
    <template v-else-if="vsdb">
      <CTAVendorHDMI14
        v-if="vsdb.vendor?.kind === 'hdmi14'"
        :fields="vsdb.vendor.fields"
        @update="(f: string, v: unknown) => emitBlock(f, v)"
      />
      <CTAVendorHDMIForum
        v-else-if="vsdb.vendor?.kind === 'hdmiForum'"
        :fields="vsdb.vendor.fields"
        @update="(f: string, v: unknown) => emitBlock(f, v)"
      />
      <CTAVendorMicrosoftHMD
        v-else-if="vsdb.vendor?.kind === 'microsoftHmd'"
        :fields="vsdb.vendor.fields"
        @update="(f: string, v: unknown) => emitBlock(f, v)"
      />
      <CTAVendorAMD
        v-else-if="vsdb.vendor?.kind === 'amdFreeSync'"
        :fields="vsdb.vendor.fields"
      />
      <!-- MHL is decoded but has no structured card yet; unknown OUIs keep raw
           bytes — both fall through to the raw fallback card. -->
      <CTAVendorUnknown v-else :block="vsdb" />
    </template>

    <!-- Tag 0x07 ext 0x01 VSVDB (Dolby Vision card; HDR10+/unknown → raw) -->
    <template v-else-if="vsvdb">
      <CTAVendorDolby
        v-if="vsvdb.vendor?.kind === 'dolbyVsdb'"
        :fields="(vsvdb.vendor as { fields: DolbyVSDB }).fields"
        @update="(f: string, v: unknown) => emitBlock(f, v)"
      />
      <CTAVendorUnknown v-else :block="vsvdb" />
    </template>

    <!-- Tag 0x07 ext 0x11 Vendor-Specific Audio -->
    <CTAVendorAudioBlock
      v-else-if="vendorAudio"
      :block="vendorAudio"
      :index="index"
      @update="(p: string, v: unknown) => emit('update', p, v)"
    />
  </div>
</template>