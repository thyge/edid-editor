<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import ColorimetryDataBlock from "./extended/ColorimetryDataBlock.vue";
import HDRStaticMetadataDataBlock from "./extended/HDRStaticMetadataDataBlock.vue";
import VideoCapabilityDataBlock from "./extended/VideoCapabilityDataBlock.vue";
import YCBCR420CapabilityMap from "./extended/YCBCR420CapabilityMap.vue";
import { CEAExtendedTag } from "../../edidjs/cea_extended";
</script>

<template>
  <ColorimetryDataBlock
    v-if="
      blocks[prop.blockNum].Header.ExtendedTag === CEAExtendedTag.ColorimetryDB
    "
    :blockNum="prop.blockNum"
  />
  <HDRStaticMetadataDataBlock
    v-else-if="
      blocks[prop.blockNum].Header.ExtendedTag ===
      CEAExtendedTag.HDRStaticMetadataDB
    "
    :blockNum="prop.blockNum"
  />
  <VideoCapabilityDataBlock
    v-else-if="
      blocks[prop.blockNum].Header.ExtendedTag ===
      CEAExtendedTag.VideoCapabilityDB
    "
    :blockNum="prop.blockNum"
  />
  <YCBCR420CapabilityMap
    v-else-if="
      blocks[prop.blockNum].Header.ExtendedTag ===
      CEAExtendedTag.YCBCR420CapabilityMap
    "
    :blockNum="prop.blockNum"
  />
  <div v-else>{{ blocks[prop.blockNum] }}</div>
</template>
