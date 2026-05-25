<script setup lang="ts">
import type { ExtendedDataBlockUnion } from "@/edidts";
import ColorimetryDataBlock from "./extended/ColorimetryDataBlock.vue";
import HDRStaticMetadataDataBlock from "./extended/HDRStaticMetadataDataBlock.vue";
import VideoCapabilityDataBlock from "./extended/VideoCapabilityDataBlock.vue";
import YCBCR420CapabilityMap from "./extended/YCBCR420CapabilityMap.vue";
const prop = defineProps<{
  block: ExtendedDataBlockUnion;
}>();
</script>

<template>
  <ColorimetryDataBlock
    v-if="block.extendedKind === 'colorimetry'"
    :block="block"
  />
  <HDRStaticMetadataDataBlock
    v-else-if="block.extendedKind === 'hdr'"
    :block="block"
  />
  <VideoCapabilityDataBlock
    v-else-if="block.extendedKind === 'videoCapability'"
    :block="block"
  />
  <YCBCR420CapabilityMap
    v-else-if="block.extendedKind === 'ycbcr420'"
    :block="block"
  />
  <div v-else>{{ block }}</div>
</template>
